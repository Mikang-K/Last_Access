import type { CaseContent, Condition, SourceRef } from './types';
export function validateContent(content:CaseContent):string[]{
 const errors:string[]=[];
 const allIds=new Set<string>();
 const checkIds=(items:{id:string}[],path:string)=>items.forEach(item=>{if(!item.id||allIds.has(item.id))errors.push(`${path}/${item.id}: 중복 또는 빈 ID`);allIds.add(item.id);});
 checkIds(content.files,'files');checkIds(content.conversations,'conversations');checkIds(content.calendar,'calendar');checkIds(content.puzzles,'puzzles');checkIds(content.evidence,'evidence');checkIds(content.questions,'questions');
 for(const question of content.questions)checkIds(question.options,`questions/${question.id}/options`);
 const condition=(value:Condition,path:string,ancestors=new Set<Condition>())=>{
  if(ancestors.has(value)){errors.push(`${path}: 조건 순환`);return;}
  if(value.type==='puzzleSolved'&&!content.puzzles.some(p=>p.id===value.puzzleId))errors.push(`${path}: 퍼즐 ${value.puzzleId} 누락`);
  if(value.type==='all'){const next=new Set(ancestors);next.add(value);value.conditions.forEach((c,i)=>condition(c,`${path}/${i}`,next));}
 };
 const sourceExists=(source:SourceRef)=>source.kind==='file'?content.files.some(f=>f.id===source.id&&f.kind==='file'):source.kind==='conversation'?content.conversations.some(c=>c.id===source.id):source.kind==='calendar'&&content.calendar.some(c=>c.id===source.id);
 const root=content.files.find(f=>f.id==='ROOT');
 if(!root||root.kind!=='folder'||root.parentId!==null)errors.push('files/ROOT: 루트 폴더 누락 또는 잘못된 부모');
 for(const node of content.files){
  condition(node.access,`files/${node.id}/access`);
  if(node.id!=='ROOT'&&(node.parentId===null||!content.files.some(f=>f.id===node.parentId&&f.kind==='folder')))errors.push(`files/${node.id}/parentId: 부모 폴더 누락`);
  const seen=new Set<string>();let cursor:typeof node|undefined=node;
  while(cursor){if(seen.has(cursor.id)){errors.push(`files/${node.id}/parentId: 폴더 순환`);break;}seen.add(cursor.id);if(cursor.parentId===null)break;const parentId:string=cursor.parentId;cursor=content.files.find(f=>f.id===parentId);}
  if(node.kind==='file'){
   if(node.puzzleId&&!content.puzzles.some(p=>p.id===node.puzzleId&&p.targetId===node.id))errors.push(`files/${node.id}/puzzleId: 대상 퍼즐 누락`);
   if(new Set(node.evidenceIds).size!==node.evidenceIds.length)errors.push(`files/${node.id}/evidenceIds: 중복 증거`);
   for(const id of node.evidenceIds)if(!content.evidence.some(e=>e.id===id&&e.source.kind==='file'&&e.source.id===node.id))errors.push(`files/${node.id}/evidenceIds/${id}: 원본 참조 오류`);
   const body=node.content;
   if(body.kind==='table'&&(body.columns.length===0||body.rows.some(row=>row.length!==body.columns.length)))errors.push(`files/${node.id}/content/rows: 표 열 수 불일치`);
   if(node.content.kind==='diagram'&&!content.assets[node.content.assetId])errors.push(`files/${node.id}/content/assetId: 에셋 ${node.content.assetId} 누락`);
  }
 }
 for(const puzzle of content.puzzles){
  const target=content.files.find(f=>f.id===puzzle.targetId);
  if(!target||target.parentId===null)errors.push(`puzzles/${puzzle.id}/targetId: 대상 누락`);
  if(puzzle.hints.length!==3||puzzle.hints.some(h=>!h))errors.push(`puzzles/${puzzle.id}/hints: 힌트 누락`);
 }
 for(const evidence of content.evidence){
  if(!sourceExists(evidence.source))errors.push(`evidence/${evidence.id}/source: 원본 ${evidence.source.id} 누락`);
  if(evidence.source.kind==='file'){
   const file=content.files.find(f=>f.id===evidence.source.id);
   if(file?.kind==='file'&&!file.evidenceIds.includes(evidence.id))errors.push(`evidence/${evidence.id}/source: 파일 역참조 누락`);
  }
 }
 for(const question of content.questions){
  if(!question.options.some(o=>o.id===question.correctAnswerId))errors.push(`questions/${question.id}/correctAnswerId: 선택지 누락`);
  if(question.requiredEvidenceIds.length===0||new Set(question.requiredEvidenceIds).size!==question.requiredEvidenceIds.length)errors.push(`questions/${question.id}/requiredEvidenceIds: 빈 값 또는 중복`);
  for(const id of question.requiredEvidenceIds)if(!content.evidence.some(e=>e.id===id))errors.push(`questions/${question.id}/requiredEvidenceIds/${id}: 증거 누락`);
 }
 for(const id of ['P01','P02','final'] as const)if(!content.hints[id]||content.hints[id].length!==3)errors.push(`hints/${id}: 3단계 힌트 누락`);
 return errors;
}


