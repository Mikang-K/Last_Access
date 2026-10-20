import { useEffect, useState } from 'react';
import { lastAccessCase } from '../content/last-access';
import { useGameDispatch, useGameState } from '../app/GameProvider';
import { canAttemptPuzzle, canCollectEvidence, canOpenSource, normalizePuzzleInput } from '../game/rules';
import type { FileContent, SourceRef } from '../game/types';

export function DocumentContent({ content }: { content: FileContent }) {
  if (content.kind === 'text') return <div className="document-text">{content.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
  if (content.kind === 'table') return <div className="document-table"><table><thead><tr>{content.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{content.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell}</td>)}</tr>)}</tbody></table></div>;
  const asset = lastAccessCase.assets[content.assetId];
  return <figure className="document-diagram">{asset && <img src={asset} alt={content.alt} />}<figcaption>{content.alt}</figcaption></figure>;
}

export function PuzzleForm({ puzzleId }: { puzzleId: string }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const puzzle = lastAccessCase.puzzles.find(item => item.id === puzzleId);
  if (!puzzle || !canAttemptPuzzle(state, puzzleId, lastAccessCase)) return <p>이 자료에는 접근할 수 없어.</p>;
  return <form className="puzzle-form" onSubmit={event => {
    event.preventDefault();
    if (normalizePuzzleInput(input, puzzle.normalization) !== puzzle.answer) { setError('비밀번호가 맞지 않아. 기록을 다시 확인해 봐.'); return; }
    dispatch({ type: 'TRY_PUZZLE', puzzleId, input });
    setError('');
  }}><span className="lock-symbol" aria-hidden="true">◇</span><h2>잠긴 자료</h2><p>기록에서 비밀번호의 단서를 찾아 입력해 줘.</p><label>{puzzle.inputLabel}<input autoComplete="off" value={input} maxLength={100} onChange={event => setInput(event.target.value)} /></label><button type="submit">잠금 해제</button><p role="status">{error}</p></form>;
}

export function Viewer({ source }: { source: SourceRef }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const file = lastAccessCase.files.find(item => item.id === source.id && item.kind === 'file');
  const allowed = canOpenSource(state, source, lastAccessCase);
  useEffect(() => { if (allowed) dispatch({ type: 'OPEN_SOURCE', source }); }, [allowed, dispatch, source.id, source.kind]);
  if (!file || file.kind !== 'file' || source.kind !== 'file') return <p>자료를 찾을 수 없어.</p>;
  if (!allowed) {
    const puzzle = lastAccessCase.puzzles.find(item => item.targetId === file.id || item.targetId === file.parentId);
    return puzzle ? <PuzzleForm puzzleId={puzzle.id} /> : <p>잠긴 자료야. 상위 폴더를 먼저 확인해 줘.</p>;
  }
  return <article className="viewer"><header className="document-heading"><span>읽기 전용 자료</span><h1>{file.name}</h1></header><DocumentContent content={file.content} /><div className="evidence-actions">{file.evidenceIds.map(id => {
    const evidence = lastAccessCase.evidence.find(item => item.id === id);
    const collected = state.collectedEvidenceIds.includes(id);
    return evidence && <button key={id} type="button" disabled={collected || !canCollectEvidence(state, id, lastAccessCase)} onClick={() => dispatch({ type: 'COLLECT_EVIDENCE', evidenceId: id })}>{collected ? '기록됨' : '증거 기록'} · {evidence.title}</button>;
  })}</div></article>;
}
