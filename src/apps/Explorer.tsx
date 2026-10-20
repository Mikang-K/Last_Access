import { useState } from 'react';
import { useGameState } from '../app/GameProvider';
import { lastAccessCase } from '../content/last-access';
import { canOpenSource } from '../game/rules';
import type { SourceRef } from '../game/types';
import { PuzzleForm } from './Viewer';

export function Explorer({ onOpenSource }: { onOpenSource: (source: SourceRef) => void }) {
  const state = useGameState();
  const [history, setHistory] = useState(['ROOT']);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const folderId = history.at(-1) ?? 'ROOT';
  const folder = lastAccessCase.files.find(item => item.id === folderId);
  const lockedFolder = lockedId && lastAccessCase.files.find(item => item.id === lockedId);
  const puzzle = lockedFolder && lastAccessCase.puzzles.find(item => item.targetId === lockedFolder.id);
  const unlocked = lockedId && canOpenSource(state, { kind: 'file', id: lockedId }, lastAccessCase);
  const path: string[] = [];
  let current = folder;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) { visited.add(current.id); path.unshift(current.name); current = lastAccessCase.files.find(item => item.id === current?.parentId); }
  return <div className="explorer"><div className="explorer-toolbar"><button type="button" disabled={history.length < 2 && !lockedId} onClick={() => { if (lockedId) setLockedId(null); else setHistory(previous => previous.slice(0, -1)); }}>← 뒤로</button><span aria-label="현재 경로">{path.join(' / ')}</span></div>
    {lockedFolder && !unlocked ? <div className="folder-lock"><h2>{lockedFolder.name}</h2>{puzzle ? <PuzzleForm puzzleId={puzzle.id} /> : <p>접근할 수 없는 폴더야.</p>}</div> : <>
      {unlocked && <div className="unlock-notice"><span>잠금이 해제됐어.</span><button type="button" onClick={() => { if (lockedId) setHistory(previous => [...previous, lockedId]); setLockedId(null); }}>백업 폴더 열기</button></div>}
      <table className="file-list"><thead><tr><th scope="col">이름</th><th scope="col">종류</th><th scope="col">상태</th></tr></thead><tbody>{lastAccessCase.files.filter(item => item.parentId === folderId).map(item => {
        const accessible = canOpenSource(state, { kind: 'file', id: item.id }, lastAccessCase);
        return <tr key={item.id}><td><button type="button" onClick={() => {
          if (item.kind === 'folder') { if (accessible) { setHistory(previous => [...previous, item.id]); setLockedId(null); } else setLockedId(item.id); }
          else onOpenSource({ kind: 'file', id: item.id });
        }}><span aria-hidden="true">{item.kind === 'folder' ? '▣' : '▤'}</span> {item.name}</button></td><td>{item.kind === 'folder' ? '폴더' : item.content.kind === 'table' ? '표' : item.content.kind === 'diagram' ? '도식' : '텍스트'}</td><td>{accessible ? '열람 가능' : '◇ 잠김'}</td></tr>;
      })}</tbody></table></>}
  </div>;
}
