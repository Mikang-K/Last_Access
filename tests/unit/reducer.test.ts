import { expect, it } from 'vitest';
import { lastAccessCase as content } from '../../src/content/last-access/case';
import { createInitialState, gameReducer } from '../../src/game/reducer';
it('잠금 우회·위조 증거·초과 메모를 거절하고 반복 액션은 중복되지 않는다',()=>{
 let state=createInitialState(content);
 const dispatch=(action:Parameters<typeof gameReducer>[1])=>state=gameReducer(state,action,content);
 dispatch({type:'OPEN_SOURCE',source:{kind:'file',id:'D01'}});
 dispatch({type:'OPEN_SOURCE',source:{kind:'file',id:'F08'}}); dispatch({type:'COLLECT_EVIDENCE',evidenceId:'E05'});
 expect(state.openedSourceIds).toEqual([]);expect(state.collectedEvidenceIds).toEqual([]);
 dispatch({type:'UPDATE_NOTEBOOK',text:'x'.repeat(20001)});expect(state.notebookText.length).toBeLessThanOrEqual(20000);
 for(let i=0;i<5;i++){dispatch({type:'TRY_PUZZLE',puzzleId:'P02',input:'TEAL04'});dispatch({type:'REVEAL_HINT',targetId:'final'});dispatch({type:'OPEN_SOURCE',source:{kind:'file',id:'F08'}});dispatch({type:'COLLECT_EVIDENCE',evidenceId:'E05'});}
 expect(state.solvedPuzzleIds).toEqual(['P02']);expect(state.collectedEvidenceIds).toEqual(['E05']);expect(state.hintLevels.final).toBe(3);
});
it('미수집·과다 증거·알 수 없는 힌트를 거절하고 오답 진행을 보존한다',()=>{
 let state=createInitialState(content);const initial=state;
 state=gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:'Q01',answerId:'A_LOCATION_ARCHIVE',evidenceIds:['E01']},content);expect(state).toBe(initial);
 state=gameReducer(state,{type:'REVEAL_HINT',targetId:'missing' as 'final'},content);expect(state).toBe(initial);
 for(const evidence of content.evidence.slice(0,2)){state=gameReducer(state,{type:'OPEN_SOURCE',source:evidence.source},content);state=gameReducer(state,{type:'COLLECT_EVIDENCE',evidenceId:evidence.id},content);}
 const before=state;state=gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:'Q01',answerId:'A_LOCATION_ARCHIVE',evidenceIds:['E01','E02','E07']},content);expect(state).toBe(before);
});

