import { lastAccessCase } from '../content/last-access/case';
import { canOpenSource } from '../game/rules';
import { NOTEBOOK_LIMIT, type SourceRef } from '../game/types';
import { useGameDispatch, useGameSession, useGameState } from '../app/GameProvider';

export function Notebook({ onOpenSource }: { onOpenSource: (source: SourceRef) => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { flushSave } = useGameSession();
  const evidence = lastAccessCase.evidence.filter(item => state.collectedEvidenceIds.includes(item.id));
  return <div className="notebook app-padding"><header className="app-section-heading"><div><p className="eyebrow">INVESTIGATION NOTES</p><h2>조사 노트</h2></div><span>기록한 증거 {evidence.length}개</span></header><section><h3>발견한 증거</h3>{evidence.length === 0 && <p className="muted">자료를 읽고 ‘증거 기록’을 눌러 단서를 모아 보세요.</p>}<ul className="evidence-list">{evidence.map(item => <li key={item.id}><div><strong>{item.title}</strong><p>{item.summary}</p></div><button disabled={!canOpenSource(state, item.source, lastAccessCase)} onClick={() => onOpenSource(item.source)}>원본 다시 열기</button></li>)}</ul></section><section className="notebook-editor"><label htmlFor="investigation-note">나의 추리 메모</label><p className="muted">생각을 자유롭게 적어 두세요. 메모는 자동으로 저장됩니다.</p><textarea id="investigation-note" maxLength={NOTEBOOK_LIMIT} value={state.notebookText} onChange={event => dispatch({ type: 'UPDATE_NOTEBOOK', text: event.target.value })} onBlur={flushSave} placeholder="서로 맞지 않는 기록, 다시 확인할 장소…" /><span className="note-count">{state.notebookText.length.toLocaleString()} / 20,000자</span></section></div>;
}
