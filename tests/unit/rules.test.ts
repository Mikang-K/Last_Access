import { describe, it, expect } from 'vitest';
import { lastAccessCase as content } from '../../src/content/last-access/case';
import { createInitialState, gameReducer } from '../../src/game/reducer';
import { canOpenSource, canAttemptPuzzle, canCollectEvidence, normalizePuzzleInput } from '../../src/game/rules';
describe('공통 접근 규칙', () => {
 it.each([['０４１７','date4','0417'],['417','date4',null],['04/17','date4',null],[' teal04 ','asciiCode','TEAL04'],['TEAL 04','asciiCode',null],['TEAL-04','asciiCode',null]] as const)('입력 %s', (input,kind,result) => expect(normalizePuzzleInput(input,kind)).toBe(result));
 it('직접 접근과 미열람 증거를 차단하고 P01 생략을 허용한다', () => {
 const state=createInitialState(content);
 expect(canOpenSource(state,{kind:'file',id:'F03'},content)).toBe(false);
 expect(canOpenSource(state,{kind:'file',id:'F08'},content)).toBe(false);
 expect(canAttemptPuzzle(state,'P02',content)).toBe(true);
 expect(canCollectEvidence(state,'E01',content)).toBe(false);
 expect(canOpenSource(state,{kind:'file',id:'UNKNOWN'},content)).toBe(false);
 expect(canAttemptPuzzle(state,'UNKNOWN',content)).toBe(false);
 expect(canCollectEvidence(state,'UNKNOWN',content)).toBe(false);
 expect(canOpenSource(gameReducer(state,{type:'TRY_PUZZLE',puzzleId:'P02',input:'teal04'},content),{kind:'file',id:'F08'},content)).toBe(true);
 });
});
it('부모 순환·잘못된 부모를 만나면 접근을 거절한다',()=>{
 const copy=structuredClone(content);copy.files.find(f=>f.id==='D03')!.parentId='D04';
 const state={...createInitialState(copy),solvedPuzzleIds:['P02']};
 expect(canOpenSource(state,{kind:'file',id:'F08'},copy)).toBe(false);
 copy.files.find(f=>f.id==='D03')!.parentId='F01';expect(canAttemptPuzzle(state,'P02',copy)).toBe(false);
});
