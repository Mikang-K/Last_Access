import { useState } from 'react';
import { lastAccessCase } from '../content/last-access/case';
import type { HintTargetId } from '../game/types';
import { useGameDispatch, useGameState } from '../app/GameProvider';
import { ConfirmDialog } from '../app/ConfirmDialog';

export function Hints() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [target, setTarget] = useState<HintTargetId>('P01');
  const [confirm, setConfirm] = useState(false);
  const targets: { id: HintTargetId; title: string }[] = [{ id: 'P01', title: '개인 메모 잠금' }, { id: 'P02', title: '백업 폴더 잠금' }, { id: 'final', title: '진상 제출' }];
  const level = state.hintLevels[target] ?? 0;
  return <div className="hints-app app-padding"><p className="eyebrow">막혔을 때만 열어 보세요</p><h2>조사의 실마리</h2><p className="muted">힌트는 세 단계로 공개됩니다. 다음 단계로 갈수록 정답에 가까워집니다.</p><div className="hint-targets">{targets.map(item => <button key={item.id} aria-pressed={target === item.id} onClick={() => setTarget(item.id)}>{item.title}</button>)}</div><ol className="hint-list">{lastAccessCase.hints[target].slice(0, level).map((hint, index) => <li key={index}><span>{index + 1}단계</span><p>{hint}</p></li>)}</ol><button className="primary" disabled={level >= 3} onClick={() => setConfirm(true)}>{level >= 3 ? '모든 힌트를 확인했어요' : `다음 힌트 열기 (${level + 1}/3)`}</button><ConfirmDialog open={confirm} title="힌트를 공개할까요?" confirmLabel="힌트 공개" onCancel={() => setConfirm(false)} onConfirm={() => { dispatch({ type: 'REVEAL_HINT', targetId: target }); setConfirm(false); }}><p>다음 힌트에는 퍼즐과 사건의 스포일러가 포함될 수 있습니다. 공개한 힌트는 되돌릴 수 없습니다.</p></ConfirmDialog></div>;
}
