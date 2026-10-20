import { expect,it } from 'vitest';
import { lastAccessCase as content } from '../../src/content/last-access/case';
import { createInitialState,gameReducer,validateSubmission } from '../../src/game/reducer';
it('답과 정확한 수집 증거 집합으로만 해결하며 solved 결과를 고정한다',()=>{
 let state=createInitialState(content);expect(validateSubmission(state,content).status).toBe('incomplete');
 state=gameReducer(state,{type:'SUBMIT_SOLUTION'},content);expect(state.submissionAttempts).toBe(0);
 state=gameReducer(state,{type:'TRY_PUZZLE',puzzleId:'P02',input:'TEAL04'},content);
 for(const evidence of content.evidence.slice(0,7)){state=gameReducer(state,{type:'OPEN_SOURCE',source:evidence.source},content);state=gameReducer(state,{type:'COLLECT_EVIDENCE',evidenceId:evidence.id},content);}
 for(const q of content.questions){state=gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:q.id,answerId:q.correctAnswerId,evidenceIds:[...q.requiredEvidenceIds].reverse()},content);}
 expect(state.phase).toBe('investigating');expect(validateSubmission(state,content).status).toBe('correct');
 const forged={...state,collectedEvidenceIds:[]};expect(validateSubmission(forged,content).status).not.toBe('correct');
 const wrong={...state,submissionDraft:{...state.submissionDraft,Q01:{answerId:'A_LOCATION_CAFE',evidenceIds:['E01','E02']}}};expect(validateSubmission(wrong,content).status).toBe('incorrect');
 const wrongEvidence={...state,submissionDraft:{...state.submissionDraft,Q01:{answerId:'A_LOCATION_ARCHIVE',evidenceIds:['E03','E04']}}};expect(validateSubmission(wrongEvidence,content).status).toBe('incorrect');
 const before=state;state=gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:'Q01',answerId:'A_LOCATION_ARCHIVE',evidenceIds:['E01','E01']},content);expect(state).toBe(before);
 state=gameReducer(state,{type:'SUBMIT_SOLUTION'},content);expect(state.phase).toBe('solved');expect(state.submissionAttempts).toBe(1);
 expect(gameReducer(state,{type:'SUBMIT_SOLUTION'},content)).toBe(state);expect(gameReducer(state,{type:'UPDATE_SUBMISSION',questionId:'Q01',answerId:'',evidenceIds:[]},content)).toBe(state);
 expect(gameReducer(state,{type:'UPDATE_NOTEBOOK',text:'계속 조사'},content).notebookText).toBe('계속 조사');
});
