import type { CaseContent, GameState, SaveEnvelope } from '../game/types';
import { validateSave } from './schema-validation';
export type LoadResult={status:'empty'}|{status:'valid';envelope:SaveEnvelope}|{status:'invalid';reason:string}|{status:'unavailable';reason:string};
export type WriteResult={ok:true}|{ok:false;reason:string;conflict?:true};
export const SAVE_KEY='last-access:save:v1';
const conflictResult:WriteResult={ok:false,conflict:true,reason:'다른 탭에서 저장이 변경됐어. 최신 저장을 다시 불러와 줘.'};
let expectedRaw:string|null|undefined;
// shortcut: localStorage 비교·쓰기는 원자적이지 않음, 동시 편집 지원 시 Web Locks로 직렬화.
export function loadSave(content:CaseContent):LoadResult {
 let raw:string|null;
 try{raw=globalThis.localStorage.getItem(SAVE_KEY);expectedRaw=raw;}catch{expectedRaw=undefined;return {status:'unavailable',reason:'저장소를 사용할 수 없어'};}
 if(raw===null)return {status:'empty'};
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{return {status:'invalid',reason:'저장 데이터를 불러올 수 없어'};}
 const result=validateSave(parsed,content);
 return result.ok?{status:'valid',envelope:result.envelope}:{status:'invalid',reason:result.reason};
}
export function writeSave(state:GameState,content:CaseContent):WriteResult {
 const result=validateSave({schemaVersion:1,savedAt:new Date().toISOString(),game:state},content);
 if(!result.ok)return {ok:false,reason:result.reason};
 try{
  const storage=globalThis.localStorage;
  if(storage.getItem(SAVE_KEY)!==(expectedRaw??null))return conflictResult;
  const raw=JSON.stringify(result.envelope);
  storage.setItem(SAVE_KEY,raw);expectedRaw=raw;return {ok:true};
 }catch{return {ok:false,reason:'현재 진행을 저장할 수 없어. 창을 닫으면 진행이 사라질 수 있어.'};}
}
export function deleteSave():WriteResult {
 try{
  const storage=globalThis.localStorage;
  if(storage.getItem(SAVE_KEY)!==(expectedRaw??null))return conflictResult;
  storage.removeItem(SAVE_KEY);expectedRaw=null;return {ok:true};
 }catch{return {ok:false,reason:'저장 데이터를 초기화할 수 없어. 기존 진행을 유지할게.'};}
}
export function subscribeSaveChanges(onChange:()=>void):()=>void {
 const changed=(event:StorageEvent)=>{
  try{if(event.storageArea===globalThis.localStorage&&(event.key===SAVE_KEY||event.key===null))onChange();}catch{}
 };
 window.addEventListener('storage',changed);
 return ()=>window.removeEventListener('storage',changed);
}
