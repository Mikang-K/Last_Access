import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { lastAccessCase as content } from '../../src/content/last-access';
import { createInitialState, gameReducer } from '../../src/game/reducer';
import { validateSave } from '../../src/persistence/schema-validation';
import { loadSave,writeSave,deleteSave } from '../../src/persistence/save-adapter';
const key='last-access:save:v1';
function envelope(){return {schemaVersion:1,savedAt:'2026-10-20T00:00:00.000Z',game:createInitialState(content)};}
let storage:Storage;
beforeEach(()=>{const values=new Map<string,string>();storage={getItem:vi.fn(k=>values.get(k)??null),setItem:vi.fn((k,v)=>{values.set(k,v);}),removeItem:vi.fn(k=>{values.delete(k);}),clear:vi.fn(),key:vi.fn(),length:0};vi.stubGlobal('localStorage',storage);loadSave(content);});
afterEach(()=>vi.unstubAllGlobals());
it('정상 저장 왕복과 빈 저장·잘못된 저장 원문 보존',()=>{
 expect(loadSave(content).status).toBe('empty');expect(writeSave(createInitialState(content),content)).toEqual({ok:true});expect(loadSave(content).status).toBe('valid');
 storage.setItem(key,'{broken');vi.mocked(storage.setItem).mockClear();expect(loadSave(content).status).toBe('invalid');expect(storage.getItem(key)).toBe('{broken');expect(storage.setItem).not.toHaveBeenCalled();expect(storage.removeItem).not.toHaveBeenCalled();
 storage.setItem('unrelated','keep');expect(deleteSave()).toEqual({ok:true});expect(storage.getItem('unrelated')).toBe('keep');expect(storage.getItem(key)).toBeNull();
});
it.each([null,[],{},42,{...envelope(),schemaVersion:2},{...envelope(),savedAt:'yesterday'},{...envelope(),savedAt:'2026-02-30T00:00:00.000Z'}])('잘못된 외부 구조 거절 %j',value=>expect(validateSave(value,content).ok).toBe(false));
it('잘못된 타입·참조·중복·진행 관계 거절',()=>{
 const mutations:((value:ReturnType<typeof envelope>)=>void)[]=[
 v=>{v.game.caseId='other';},v=>{v.game.caseVersion=2;},v=>{v.game.notebookText='x'.repeat(20001);},
 v=>{v.game.openedSourceIds=['file:unknown'];},v=>{v.game.openedSourceIds=['file:F01','file:F01'];},v=>{v.game.solvedPuzzleIds=['unknown'];},
 v=>{v.game.collectedEvidenceIds=['UNKNOWN'];},v=>{v.game.openedSourceIds=['conversation:C02'];v.game.collectedEvidenceIds=['E01','E01'];},
 v=>{v.game.openedSourceIds=['conversation:C02'];v.game.collectedEvidenceIds=['E01'];v.game.submissionDraft.Q01={answerId:'',evidenceIds:['E01','E01']};},
 v=>{v.game.submissionAttempts=Number.POSITIVE_INFINITY;},v=>{v.game.submissionAttempts=Number.MAX_SAFE_INTEGER+1;},
 v=>{v.game.submissionAttempts=-1;},v=>{v.game.submissionAttempts=1.5;},v=>{v.game.hintLevels.final=4;},v=>{v.game.hintLevels.unknown=1;},
 v=>{v.game.openedSourceIds=['file:F08'];},v=>{v.game.collectedEvidenceIds=['E01'];},v=>{v.game.collectedEvidenceIds=['E05'];},
 v=>{v.game.submissionDraft.Q01={answerId:'A_LOCATION_ARCHIVE',evidenceIds:['E01']};},v=>{v.game.submissionDraft.Q01={answerId:'UNKNOWN',evidenceIds:[]};},
 v=>{v.game.phase='solved';v.game.submissionAttempts=1;},
 ];
 for(const mutate of mutations){const value=envelope();mutate(value);expect(validateSave(value,content).ok).toBe(false);}
});
it('P01 생략과 미완성 초안, solved 이후 추가 조사를 복원한다',()=>{
 let state=gameReducer(createInitialState(content),{type:'TRY_PUZZLE',puzzleId:'P02',input:'TEAL04'},content);
 expect(validateSave({...envelope(),game:state},content).ok).toBe(true);
 for(const evidence of content.evidence.slice(0,7)){state=gameReducer(state,{type:'OPEN_SOURCE',source:evidence.source},content);state=gameReducer(state,{type:'COLLECT_EVIDENCE',evidenceId:evidence.id},content);}
 for(const question of content.questions)state=gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:question.id,answerId:question.correctAnswerId,evidenceIds:question.requiredEvidenceIds},content);
 expect(validateSave({...envelope(),game:state},content).ok).toBe(true);
 state=gameReducer(state,{type:'SUBMIT_SOLUTION'},content);state=gameReducer(state,{type:'UPDATE_NOTEBOOK',text:'<script>alert(1)</script>'},content);
 const optional=content.evidence.find(e=>e.id==='E08')!;state=gameReducer(state,{type:'OPEN_SOURCE',source:optional.source},content);state=gameReducer(state,{type:'COLLECT_EVIDENCE',evidenceId:optional.id},content);
 expect(writeSave(state,content).ok).toBe(true);const loaded=loadSave(content);expect(loaded.status).toBe('valid');if(loaded.status==='valid')expect(loaded.envelope.game).toEqual(state);
 const incorrect=structuredClone(state);incorrect.submissionDraft.Q01!.answerId='A_LOCATION_CAFE';expect(validateSave({...envelope(),game:incorrect},content).ok).toBe(false);
});
it('getter·읽기·쓰기·삭제 예외를 분류하고 실패한 쓰기는 진행을 파괴하지 않는다',()=>{
 vi.mocked(storage.getItem).mockImplementation(()=>{throw new Error('blocked');});expect(loadSave(content).status).toBe('unavailable');
 vi.mocked(storage.setItem).mockImplementation(()=>{throw new Error('quota');});const state=createInitialState(content);expect(writeSave(state,content).ok).toBe(false);expect(state).toEqual(createInitialState(content));
 vi.mocked(storage.removeItem).mockImplementation(()=>{throw new Error('blocked');});expect(deleteSave().ok).toBe(false);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked getter');}});expect(loadSave(content).status).toBe('unavailable');expect(writeSave(state,content).ok).toBe(false);expect(deleteSave().ok).toBe(false);
});
it('외부 저장 변경은 쓰기·삭제 전에 거절하고 원문을 보존한다',()=>{
 const value=envelope();value.game.notebookText='다른 탭의 최신 메모';
 const raw=JSON.stringify(value);storage.setItem(key,raw);
 expect(writeSave(createInitialState(content),content).ok).toBe(false);
 expect(storage.getItem(key)).toBe(raw);
 expect(deleteSave().ok).toBe(false);expect(storage.getItem(key)).toBe(raw);
});
it('이 탭의 연속 쓰기와 확인한 삭제는 계속 허용한다',()=>{
 const state=createInitialState(content);
 expect(writeSave(state,content).ok).toBe(true);
 expect(writeSave({...state,notebookText:'두 번째 메모'},content).ok).toBe(true);
 expect(deleteSave().ok).toBe(true);expect(storage.getItem(key)).toBeNull();
});
it('쓰기 직전 비교용 읽기가 실패하면 저장을 덮어쓰지 않는다',()=>{
 vi.mocked(storage.getItem).mockImplementation(()=>{throw new Error('blocked');});
 expect(writeSave(createInitialState(content),content).ok).toBe(false);
 expect(storage.setItem).not.toHaveBeenCalled();
});
it('다른 탭에서 초기화한 저장을 오래된 메모로 되살리지 않는다',()=>{
 const state={...createInitialState(content),notebookText:'초기화 전의 메모'};
 expect(writeSave(state,content).ok).toBe(true);
 storage.removeItem(key);
 expect(writeSave(state,content).ok).toBe(false);expect(storage.getItem(key)).toBeNull();
});
