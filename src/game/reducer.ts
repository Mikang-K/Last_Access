import type { CaseContent, GameAction, GameState } from './types';
import { NOTEBOOK_LIMIT } from './types';
import { canOpenSource, canAttemptPuzzle, canCollectEvidence, normalizePuzzleInput, sourceKey, validateSubmission } from './rules';
export { validateSubmission } from './rules';
export function createInitialState(content:CaseContent):GameState {
 return {caseId:content.id,caseVersion:content.version,phase:'investigating',openedSourceIds:[],collectedEvidenceIds:[],solvedPuzzleIds:[],hintLevels:{P01:0,P02:0,final:0},notebookText:'',submissionDraft:Object.fromEntries(content.questions.map(q=>[q.id,{answerId:'',evidenceIds:[]}])),submissionAttempts:0};
}
export function gameReducer(state:GameState,action:GameAction,content:CaseContent):GameState {
 switch(action.type){
 case 'OPEN_SOURCE':{
  if(action.source.kind==='file'&&!content.files.some(file=>file.id===action.source.id&&file.kind==='file'))return state;
  const key=sourceKey(action.source);
  return canOpenSource(state,action.source,content)&&!state.openedSourceIds.includes(key)?{...state,openedSourceIds:[...state.openedSourceIds,key]}:state;
 }
 case 'TRY_PUZZLE':{
  const puzzle=content.puzzles.find(p=>p.id===action.puzzleId);
  return puzzle&&canAttemptPuzzle(state,puzzle.id,content)&&!state.solvedPuzzleIds.includes(puzzle.id)&&normalizePuzzleInput(action.input,puzzle.normalization)===puzzle.answer?{...state,solvedPuzzleIds:[...state.solvedPuzzleIds,puzzle.id]}:state;
 }
 case 'COLLECT_EVIDENCE':return canCollectEvidence(state,action.evidenceId,content)&&!state.collectedEvidenceIds.includes(action.evidenceId)?{...state,collectedEvidenceIds:[...state.collectedEvidenceIds,action.evidenceId]}:state;
 case 'UPDATE_NOTEBOOK':return action.text.length<=NOTEBOOK_LIMIT&&action.text!==state.notebookText?{...state,notebookText:action.text}:state;
 case 'REVEAL_HINT':{
  if(!Object.hasOwn(content.hints,action.targetId))return state;
  const level=state.hintLevels[action.targetId]??0;
  return level<3?{...state,hintLevels:{...state.hintLevels,[action.targetId]:level+1}}:state;
 }
 case 'UPDATE_SUBMISSION':{
  if(state.phase==='solved')return state;
  const question=content.questions.find(q=>q.id===action.questionId);
  if(!question||(action.answerId!==''&&!question.options.some(o=>o.id===action.answerId))||action.evidenceIds.length>question.requiredEvidenceIds.length||new Set(action.evidenceIds).size!==action.evidenceIds.length||action.evidenceIds.some(id=>!state.collectedEvidenceIds.includes(id)||!content.evidence.some(e=>e.id===id)))return state;
  return {...state,submissionDraft:{...state.submissionDraft,[question.id]:{answerId:action.answerId,evidenceIds:[...action.evidenceIds]}}};
 }
 case 'SUBMIT_SOLUTION':{
  if(state.phase==='solved')return state;
  const result=validateSubmission(state,content);
  return result.status==='incomplete'?state:{...state,submissionAttempts:Math.min(Number.MAX_SAFE_INTEGER,state.submissionAttempts+1),phase:result.status==='correct'?'solved':'investigating'};
 }
 }
}

