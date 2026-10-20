import type { CaseContent, Condition, GameState, Puzzle, SourceRef } from './types';
export const sourceKey=(source:SourceRef):string=>`${source.kind}:${source.id}`;
export function normalizePuzzleInput(input:string,normalization:Puzzle['normalization']):string|null {
 const value=input.normalize('NFKC').trim();
 if(normalization==='date4')return /^[0-9]{4}$/.test(value)?value:null;
 const code=value.replace(/[a-z]/g,char=>char.toUpperCase());
 return /^[A-Z]+[0-9]{2}$/.test(code)?code:null;
}
function meets(state:GameState,condition:Condition,content:CaseContent,seen:Set<Condition>=new Set()):boolean {
 if(seen.has(condition))return false;
 seen.add(condition);
 if(condition.type==='always')return true;
 if(condition.type==='puzzleSolved')return content.puzzles.some(p=>p.id===condition.puzzleId)&&state.solvedPuzzleIds.includes(condition.puzzleId);
 return condition.conditions.every(child=>meets(state,child,content,new Set(seen)));
}
function canOpenNode(state:GameState,id:string,content:CaseContent):boolean {
 const seen=new Set<string>();let node=content.files.find(file=>file.id===id);
 if(!node)return false;
 while(node){
  if(seen.has(node.id)||!meets(state,node.access,content))return false;
  seen.add(node.id);
  if(node.kind==='file'&&node.puzzleId){const puzzleId=node.puzzleId;if(!content.puzzles.some(p=>p.id===puzzleId)||!state.solvedPuzzleIds.includes(puzzleId))return false;}
  if(node.parentId===null)return node.id==='ROOT'&&node.kind==='folder';
  const parent=content.files.find(file=>file.id===node!.parentId);
  if(!parent||parent.kind!=='folder')return false;
  node=parent;
 }
 return false;
}
export function canOpenSource(state:GameState,source:SourceRef,content:CaseContent):boolean {
 if(source.kind==='file')return canOpenNode(state,source.id,content);
 if(source.kind==='conversation')return content.conversations.some(c=>c.id===source.id);
 if(source.kind==='calendar')return content.calendar.some(c=>c.id===source.id);
 return false;
}
export function canAttemptPuzzle(state:GameState,puzzleId:string,content:CaseContent):boolean {
 const puzzle=content.puzzles.find(p=>p.id===puzzleId);
 const target=puzzle&&content.files.find(f=>f.id===puzzle.targetId);
 return !!target&&target.parentId!==null&&canOpenNode(state,target.parentId,content);
}
export function canCollectEvidence(state:GameState,evidenceId:string,content:CaseContent):boolean {
 const evidence=content.evidence.find(e=>e.id===evidenceId);
 return !!evidence&&state.openedSourceIds.includes(sourceKey(evidence.source))&&canOpenSource(state,evidence.source,content);
}
export function validateSubmission(state:GameState,content:CaseContent):import('./types').SubmissionResult {
 for(const question of content.questions){
  const draft=state.submissionDraft[question.id];
  if(!draft||!draft.answerId||draft.evidenceIds.length<question.requiredEvidenceIds.length)return {status:'incomplete',questionId:question.id};
 }
 for(const question of content.questions){
  const draft=state.submissionDraft[question.id]!;
  if(draft.answerId!==question.correctAnswerId||draft.evidenceIds.length!==question.requiredEvidenceIds.length||new Set(draft.evidenceIds).size!==draft.evidenceIds.length||draft.evidenceIds.some(id=>!state.collectedEvidenceIds.includes(id)||!canCollectEvidence(state,id,content)||!question.requiredEvidenceIds.includes(id)))return {status:'incorrect'};
 }
 return {status:'correct'};
}

