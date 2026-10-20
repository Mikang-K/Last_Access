import { useEffect, useRef, useState } from 'react';
import { lastAccessCase } from '../content/last-access/case';
import { canOpenSource } from '../game/rules';
import type { SourceRef } from '../game/types';
import { useGameDispatch, useGameState } from '../app/GameProvider';
import { EvidenceButtons } from '../app/EvidenceButtons';

export function Messenger({ source }: { source?: SourceRef; onOpenSource?: (source: SourceRef) => void }) {
  const [selected, setSelected] = useState(source?.kind === 'conversation' ? source.id : 'C01');
  const state = useGameState();
  const dispatch = useGameDispatch();
  const scroll = useRef<HTMLDivElement>(null);
  const positions = useRef<Record<string, number>>({});
  const conversation = lastAccessCase.conversations.find(item => item.id === selected);
  const ref: SourceRef = { kind: 'conversation', id: selected };
  const allowed = canOpenSource(state, ref, lastAccessCase);
  useEffect(() => { if (source?.kind === 'conversation') setSelected(source.id); }, [source]);
  useEffect(() => { if (conversation && allowed) dispatch({ type: 'OPEN_SOURCE', source: { kind: 'conversation', id: selected } }); if (scroll.current) scroll.current.scrollTop = positions.current[selected] ?? 0; }, [selected, allowed, conversation, dispatch]);
  return <div className="messenger-layout"><nav className="conversation-list" aria-label="대화 상대"><p className="eyebrow">보관된 대화</p>{lastAccessCase.conversations.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><span className="avatar" aria-hidden="true">{item.title.slice(0, 1)}</span><span>{item.title}<small>대화 기록</small></span></button>)}</nav><section className="conversation"><header className="app-section-heading"><h2>{conversation?.title ?? '대화'}</h2><span>읽기 전용 · 보관된 대화</span></header><div role="region" className="message-history" ref={scroll} onScroll={event => { positions.current[selected] = event.currentTarget.scrollTop; }} tabIndex={0} aria-label="대화 기록">{conversation && allowed ? conversation.messages.map((message, index) => <article className="message" key={index}><div><strong>{message.sender}</strong><time>{message.time}</time></div><p>{message.text}</p></article>) : <p>이 대화에 접근할 수 없습니다.</p>}</div>{conversation && allowed && <EvidenceButtons source={ref} />}</section></div>;
}
