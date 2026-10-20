import { useEffect, useState } from 'react';
import { lastAccessCase } from '../content/last-access/case';
import { canOpenSource } from '../game/rules';
import type { SourceRef } from '../game/types';
import { useGameDispatch, useGameState } from '../app/GameProvider';
import { EvidenceButtons } from '../app/EvidenceButtons';

export function Calendar({ source }: { source?: SourceRef; onOpenSource?: (source: SourceRef) => void }) {
  const [selected, setSelected] = useState(source?.kind === 'calendar' ? source.id : 'CAL01');
  const dispatch = useGameDispatch();
  const state = useGameState();
  const event = lastAccessCase.calendar.find(item => item.id === selected);
  const ref: SourceRef = { kind: 'calendar', id: selected };
  const allowed = canOpenSource(state, ref, lastAccessCase);
  useEffect(() => { if (source?.kind === 'calendar') setSelected(source.id); }, [source]);
  useEffect(() => { if (event && allowed) dispatch({ type: 'OPEN_SOURCE', source: { kind: 'calendar', id: selected } }); }, [selected, event, allowed, dispatch]);
  return <div className="calendar-app app-padding"><header className="app-section-heading"><div><p className="eyebrow">개인 일정 · 기록</p><h2>남겨진 약속</h2></div><span>2026</span></header><nav className="calendar-list" aria-label="일정 목록">{lastAccessCase.calendar.map(item => <button key={item.id} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}><time>{item.time}</time><strong>{item.title}</strong></button>)}</nav>{event && allowed && <article className="calendar-detail"><h3>{event.title}</h3><dl><dt>일시</dt><dd>{event.time}</dd><dt>장소</dt><dd>{event.location}</dd></dl><p>{event.description}</p><EvidenceButtons source={ref} /></article>}</div>;
}
