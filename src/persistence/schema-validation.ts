import type { CaseContent, GameState, SaveEnvelope } from '../game/types';
import { NOTEBOOK_LIMIT } from '../game/types';
import { canCollectEvidence, canOpenSource, sourceKey, validateSubmission } from '../game/rules';
type ValidationResult = {ok:true;envelope:SaveEnvelope}|{ok:false;reason:string};
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const integer=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
const exactKeys=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function ids(value:unknown,allowed:string[]):value is string[]{
 return Array.isArray(value)&&value.length<=allowed.length&&value.every((id:unknown)=>typeof id==='string'&&allowed.includes(id))&&new Set(value).size===value.length;
}
function isoTime(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return false;
 const parsed=new Date(value);return Number.isFinite(parsed.getTime())&&parsed.toISOString()===value;
}
export function validateSave(value:unknown,content:CaseContent):ValidationResult {
 const fail=(reason:string):ValidationResult=>({ok:false,reason});
 if(!record(value)||!exactKeys(value,['schemaVersion','savedAt','game'])||value.schemaVersion!==1||!isoTime(value.savedAt)||!record(value.game))return fail('저장 형식 또는 버전을 확인할 수 없어');
 const game=value.game;
 if(!exactKeys(game,['caseId','caseVersion','phase','openedSourceIds','collectedEvidenceIds','solvedPuzzleIds','hintLevels','notebookText','submissionDraft','submissionAttempts']))return fail('게임 저장 필드가 올바르지 않아');
 const {caseId,caseVersion,phase,openedSourceIds,collectedEvidenceIds,solvedPuzzleIds,hintLevels,notebookText,submissionDraft,submissionAttempts}=game;
 if(caseId!==content.id||caseVersion!==content.version||(phase!=='investigating'&&phase!=='solved'))return fail('지원하지 않는 사건 또는 진행 단계야');
 if(typeof notebookText!=='string'||notebookText.length>NOTEBOOK_LIMIT||!integer(submissionAttempts))return fail('메모 길이 또는 제출 횟수가 올바르지 않아');
 const sources=[...content.files.filter(f=>f.kind==='file').map(f=>({kind:'file' as const,id:f.id})),...content.conversations.map(c=>({kind:'conversation' as const,id:c.id})),...content.calendar.map(c=>({kind:'calendar' as const,id:c.id}))];
 if(!ids(openedSourceIds,sources.map(sourceKey))||!ids(collectedEvidenceIds,content.evidence.map(e=>e.id))||!ids(solvedPuzzleIds,content.puzzles.map(p=>p.id)))return fail('자료·증거·퍼즐 참조가 올바르지 않아');
 if(!record(hintLevels)||!exactKeys(hintLevels,['P01','P02','final']))return fail('힌트 대상이 올바르지 않아');
 const hints:Record<string,number>={};
 for(const id of ['P01','P02','final']){const level=hintLevels[id];if(!integer(level)||level>3)return fail('힌트 단계가 올바르지 않아');hints[id]=level;}
 if(!record(submissionDraft)||!exactKeys(submissionDraft,content.questions.map(q=>q.id)))return fail('제출 질문 참조가 올바르지 않아');
 const draft:GameState['submissionDraft']={};
 for(const question of content.questions){
  const answer=submissionDraft[question.id];
  if(!record(answer)||!exactKeys(answer,['answerId','evidenceIds'])||typeof answer.answerId!=='string'||(answer.answerId!==''&&!question.options.some(o=>o.id===answer.answerId))||!ids(answer.evidenceIds,collectedEvidenceIds)||answer.evidenceIds.length>question.requiredEvidenceIds.length)return fail(`제출 ${question.id}의 답 또는 근거가 올바르지 않아`);
  draft[question.id]={answerId:answer.answerId,evidenceIds:[...answer.evidenceIds]};
 }
 const state:GameState={caseId:content.id,caseVersion:content.version,phase,openedSourceIds:[...openedSourceIds],collectedEvidenceIds:[...collectedEvidenceIds],solvedPuzzleIds:[...solvedPuzzleIds],hintLevels:hints,notebookText,submissionDraft:draft,submissionAttempts};
 for(const key of state.openedSourceIds){const source=sources.find(s=>sourceKey(s)===key);if(!source||!canOpenSource(state,source,content))return fail('잠긴 자료의 열람 기록이 있어');}
 if(state.collectedEvidenceIds.some(id=>!canCollectEvidence(state,id,content)))return fail('증거의 원본 열람 기록이 올바르지 않아');
 if(state.phase==='solved'&&(state.submissionAttempts<1||validateSubmission(state,content).status!=='correct'))return fail('해결 상태와 제출 결과가 일치하지 않아');
 return {ok:true,envelope:{schemaVersion:1,savedAt:value.savedAt,game:state}};
}
