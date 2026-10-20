import { expect,it } from 'vitest';
import { lastAccessCase as c } from '../../src/content/last-access/case';
import { validateContent } from '../../src/game/content-validator';
it('사건 수량·정답 관계와 구조를 검증한다',()=>{
 expect(validateContent(c)).toEqual([]);expect(c.files.filter(x=>x.kind==='file')).toHaveLength(14);expect(c.files.filter(x=>x.kind==='folder')).toHaveLength(5);expect(c.conversations).toHaveLength(2);expect(c.calendar).toHaveLength(3);expect(c.puzzles).toHaveLength(2);expect(c.evidence).toHaveLength(9);expect(c.questions).toHaveLength(3);
 expect(c.questions.map(q=>[q.id,q.correctAnswerId,q.requiredEvidenceIds])).toEqual([['Q01','A_LOCATION_ARCHIVE',['E01','E02']],['Q02','A_ACTOR_DOHYEON',['E03','E04']],['Q03','A_METHOD_INFLATE',['E05','E06','E07']]]);
 const duplicate=structuredClone(c);duplicate.files.push(duplicate.files[0]!);expect(validateContent(duplicate).join()).toContain('ROOT');
 const cycle=structuredClone(c);cycle.files.find(x=>x.id==='D03')!.parentId='D04';expect(validateContent(cycle).join()).toContain('D03');
});
it('반복 사실과 잠금 밖 대체 단서를 고정한다',()=>{
 const body=(id:string)=>JSON.stringify(c.files.find(f=>f.id===id));
 for(const [id,values] of [['F08',['800,000','17:50']],['F09',['1,800,000','18:45']],['F10',['18:40']],['F11',['18:40','18:43']],['F13',['19:20','20:30']],['F14',['19:25']]] as const){for(const value of values)expect(body(id)).toContain(value);}
 expect(c.puzzles.map(p=>[p.id,p.targetId])).toEqual([['P01','F03'],['P02','D04']]);
});
it('부모·참조·에셋·표의 손상을 위치와 함께 보고한다',()=>{
 const mutations:((c:typeof import('../../src/content/last-access/case').lastAccessCase)=>void)[]=[
 x=>{x.files=x.files.filter(f=>f.id!=='ROOT');},
 x=>{x.files.find(f=>f.id==='F01')!.parentId='MISSING';},
 x=>{x.files.find(f=>f.id==='F01')!.access={type:'puzzleSolved',puzzleId:'MISSING'};},
 x=>{const file=x.files.find(f=>f.id==='F03');if(file?.kind==='file')file.puzzleId='MISSING';},
 x=>{x.puzzles[0]!.targetId='MISSING';},
 x=>{x.evidence[0]!.source={kind:'file',id:'MISSING'};},
 x=>{x.questions[0]!.correctAnswerId='MISSING';},
 x=>{x.questions[0]!.requiredEvidenceIds=['MISSING'];},
 x=>{const f=x.files.find(f=>f.id==='F08');if(f?.kind==='file'&&f.content.kind==='table')f.content.rows[0]!.pop();},
 x=>{delete x.assets['first-exhibition'];},
 ];
 for(const mutate of mutations){const copy=structuredClone(c);mutate(copy);const errors=validateContent(copy);expect(errors.length).toBeGreaterThan(0);for(const error of errors)expect(error).toMatch(/(?:files|evidence|puzzles|questions)\//);}
});
import { createInitialState,gameReducer } from '../../src/game/reducer';
import { canOpenSource } from '../../src/game/rules';
it.each([true,false])('순수 액션으로 정규/생략 경로 완주 %s',firstPuzzle=>{
 let state=createInitialState(c);
 for(const source of [{kind:'conversation',id:'C01'},{kind:'file',id:'F02'},{kind:'calendar',id:'CAL01'},{kind:'calendar',id:'CAL02'},{kind:'file',id:'F04'},{kind:'file',id:'F05'}] as const)expect(canOpenSource(state,source,c)).toBe(true);
 if(firstPuzzle)state=gameReducer(state,{type:'TRY_PUZZLE',puzzleId:'P01',input:'０４１７'},c);
 state=gameReducer(state,{type:'TRY_PUZZLE',puzzleId:'P02',input:' teal04 '},c);
 for(const evidence of c.evidence.slice(0,7)){state=gameReducer(state,{type:'OPEN_SOURCE',source:evidence.source},c);state=gameReducer(state,{type:'COLLECT_EVIDENCE',evidenceId:evidence.id},c);}
 for(const q of c.questions)state=gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:q.id,answerId:q.correctAnswerId,evidenceIds:q.requiredEvidenceIds},c);
 state=gameReducer(state,{type:'SUBMIT_SOLUTION'},c);expect(state.phase).toBe('solved');expect(state.collectedEvidenceIds).not.toContain('E08');expect(state.collectedEvidenceIds).not.toContain('E09');
});
import { readFileSync } from 'node:fs';
it('필수 SVG가 로컬에 존재하고 외부 리소스나 실행 코드를 포함하지 않는다',()=>{
 for(const asset of ['first-exhibition','annex-map']){
  const svg=readFileSync(new URL(`../../src/content/last-access/assets/${asset}.svg`,import.meta.url),'utf8');
  expect(svg).toContain('<svg');expect(svg).not.toMatch(/<script|\son\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)/i);
 }
});
