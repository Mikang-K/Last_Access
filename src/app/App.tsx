import { useEffect, useState } from 'react';
import { GameProvider, useGameSession, useGameState } from './GameProvider';
import { ConfirmDialog } from './ConfirmDialog';
import { Desktop } from '../desktop/Desktop';
import { lastAccessCase } from '../content/last-access/case';
import { validateContent } from '../game/content-validator';
import '../styles/base.css';

function Game() {
  const { started, loadResult, saveStatus, saveConflict, retrySave, startNewGame, resumeGame } = useGameSession();
  const game = useGameState();
  const [confirm, setConfirm] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [showEnding, setShowEnding] = useState(false);
  useEffect(() => { if (started && game.phase === 'solved') setShowEnding(true); }, [started, game.phase]);
  const begin = () => { if (startNewGame()) { setConfirm(false); setShowEnding(false); setGeneration(value => value + 1); } };
  const requestNew = () => { if (saveConflict) return; if (started || loadResult.status === 'valid' || loadResult.status === 'invalid') setConfirm(true); else begin(); };
  const errors = validateContent(lastAccessCase);
  if (errors.length) return <main className="start-screen"><h1>사건 데이터를 확인해 주세요</h1><p>사건 자료를 불러올 수 없습니다.</p></main>;
  return <>{saveConflict && <aside className="save-conflict" role="alert"><p>다른 탭에서 저장이 변경됐어. 이 탭의 자동 저장을 멈췄어. 저장하지 못한 메모를 복사한 뒤 최신 저장을 불러와 줘.</p><button onClick={() => window.location.reload()}>저장 다시 불러오기</button></aside>}{started ? <Desktop key={generation} onRestart={requestNew} saveStatus={saveStatus} saveConflict={saveConflict} onRetrySave={retrySave} showEnding={showEnding} onContinue={() => setShowEnding(false)} /> : <main className="start-screen"><div className="start-grid" aria-hidden="true" /><section className="start-content"><p className="eyebrow">A PERSONAL COMPUTER MYSTERY · CASE 01</p><h1>마지막 <span>접속</span><small>LAST ACCESS</small></h1><p className="start-intro">약속 장소에 나타나지 않은 친구가 예약 메시지를 남겼다.<br />“내가 연락이 안 되면, 내 컴퓨터부터 확인해 줘.”<br />바탕화면에는 평범한 기록과 지워진 문서의 흔적이 남아 있다.</p><div className="start-actions">{loadResult.status === 'valid' && <button className="primary" onClick={resumeGame}>이어하기 <span aria-hidden="true">↗</span></button>}<button onClick={requestNew}>{loadResult.status === 'invalid' ? '초기화하고 시작' : '새 게임'} <span aria-hidden="true">→</span></button></div>{loadResult.status === 'invalid' && <p role="alert" className="start-warning">저장 데이터를 불러올 수 없어. 기존 저장은 초기화를 확인하기 전까지 보존돼.</p>}{(loadResult.status === 'unavailable' || saveStatus === 'error') && <p role="alert" className="start-warning">현재 진행을 저장할 수 없어. 창을 닫으면 진행이 사라질 수 있어.</p>}<footer className="start-footer"><span>기록 기준 시각 · 2026-10-18 20:45</span><span>한국어 · 싱글 플레이 · 로컬 저장</span></footer></section><aside className="start-art" aria-hidden="true"><div className="art-monitor"><div className="art-toolbar"><i /><i /><i /></div><p>예약된 메시지 01</p><div className="art-lines"><i /><i /><i /></div><div className="art-cursor">_</div><span>마지막 기록을 따라가세요.</span></div><div className="art-caption">접속은 끊겼지만,<br />기록은 남아 있다.</div></aside></main>}<ConfirmDialog open={confirm} title="처음부터 시작할까요?" confirmLabel="초기화하고 시작" onCancel={() => setConfirm(false)} onConfirm={begin}><p>현재 진행과 조사 메모가 삭제됩니다. 이 게임의 저장 한 개만 초기화합니다.</p>{saveStatus === 'error' && <p role="alert">{saveConflict ? '다른 탭에서 저장이 변경됐어. 취소하고 최신 저장을 불러와 줘.' : '저장소에 접근할 수 없습니다. 초기화에 실패하면 기존 진행을 유지합니다.'}</p>}</ConfirmDialog></>;
}
export function App() { return <GameProvider><Game /></GameProvider>; }
export default App;
