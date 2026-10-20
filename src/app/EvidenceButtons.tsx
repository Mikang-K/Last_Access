import { lastAccessCase } from '../content/last-access/case';
import { canCollectEvidence, sourceKey } from '../game/rules';
import type { SourceRef } from '../game/types';
import { useGameDispatch, useGameState } from './GameProvider';

export function EvidenceButtons({ source }: { source: SourceRef }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  return <div className="evidence-actions">{lastAccessCase.evidence.filter(evidence => sourceKey(evidence.source) === sourceKey(source)).map(evidence => <button key={evidence.id} disabled={state.collectedEvidenceIds.includes(evidence.id) || !canCollectEvidence(state, evidence.id, lastAccessCase)} onClick={() => dispatch({ type: 'COLLECT_EVIDENCE', evidenceId: evidence.id })}>{state.collectedEvidenceIds.includes(evidence.id) ? '✓ 기록됨' : '증거 기록'} · {evidence.title}</button>)}</div>;
}
