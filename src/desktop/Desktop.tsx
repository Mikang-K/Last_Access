import { useEffect, useState } from 'react';
import { useGameState } from '../app/GameProvider';
import { lastAccessCase } from '../content/last-access';
import { canAttemptPuzzle, canOpenSource } from '../game/rules';
import type { SourceRef } from '../game/types';
import { Explorer } from '../apps/Explorer';
import { Viewer } from '../apps/Viewer';
import { Messenger } from '../apps/Messenger';
import { Calendar } from '../apps/Calendar';
import { Notebook } from '../apps/Notebook';
import { Hints } from '../apps/Hints';
import { Submit } from '../apps/Submit';
import { Ending } from '../apps/Ending';
import { WindowFrame } from './WindowFrame';
import { Taskbar } from './Taskbar';
import { closeWindow, focusWindow, minimizeWindow, moveWindow, openWindow, resizeDesktop, toggleMaximizeWindow, type AppId, type DesktopState, type WindowState } from './window-state';
import '../styles/desktop.css';
import '../styles/apps.css';

const appLabels: Record<AppId, string> = { explorer: '파일 탐색기', viewer: '문서', messenger: '메신저', calendar: '일정', notebook: '조사 노트', hints: '힌트', submit: '진상 제출' };
const icons: Partial<Record<AppId, string>> = { explorer: '▣', messenger: '◉', calendar: '▦', notebook: '▤', hints: '?', submit: '↗' };
const workArea = () => ({ width: window.innerWidth, height: Math.max(1, window.innerHeight - 44) });
type Props = { onRestart: () => void; saveStatus?: string; saveConflict?: boolean; onRetrySave?: () => void; showEnding?: boolean; onContinue?: () => void };
export function Desktop({ onRestart, saveStatus, saveConflict, onRetrySave, showEnding, onContinue }: Props) {
  const game = useGameState();
  const [desktop, setDesktop] = useState<DesktopState>(() => openWindow({ windows: [], activeWindowId: null }, { appId: 'viewer', source: { kind: 'file', id: 'F01' } }, workArea()));
  useEffect(() => { const resize = () => setDesktop(previous => resizeDesktop(previous, workArea())); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  const openSource = (source: SourceRef) => {
    if (!canOpenSource(game, source, lastAccessCase)) {
      const puzzle = lastAccessCase.puzzles.find(item => item.targetId === source.id);
      if (source.kind !== 'file' || !puzzle || !canAttemptPuzzle(game, puzzle.id, lastAccessCase)) return;
    }
    setDesktop(previous => openWindow(previous, { appId: source.kind === 'file' ? 'viewer' : source.kind === 'conversation' ? 'messenger' : 'calendar', source: { ...source } }, workArea()));
    onContinue?.();
  };
  const titleForWindow = (win: WindowState) => win.appId === 'viewer' ? lastAccessCase.files.find(item => item.id === win.source?.id)?.name ?? '문서' : appLabels[win.appId];
  return <main className="desktop" aria-label="서윤의 컴퓨터"><div className="desktop-wallpaper" aria-hidden="true"><span>청록의 기록</span><small>SEOYUN'S WORKSPACE / 2026</small></div>
    <nav className="desktop-icons" aria-label="바탕화면 앱">{(['explorer', 'messenger', 'calendar', 'notebook', 'submit', 'hints'] as const).map(appId => <button key={appId} type="button" onClick={() => setDesktop(previous => openWindow(previous, { appId }, workArea()))}><span aria-hidden="true">{icons[appId]}</span>{appLabels[appId]}</button>)}</nav>
    <div className="desktop-session"><button type="button" disabled={saveConflict} onClick={onRestart}>새 게임</button><span role="status">{saveConflict ? '' : saveStatus === 'saved' ? '진행 저장됨' : saveStatus === 'pending' ? '저장 대기 중' : saveStatus === 'error' ? '현재 진행을 저장할 수 없어. 창을 닫으면 진행이 사라질 수 있어.' : ''}</span>{saveStatus === 'error' && !saveConflict && onRetrySave && <button type="button" onClick={onRetrySave}>저장 재시도</button>}</div>
    {desktop.windows.map((win, index) => <WindowFrame key={win.id} window={win} title={titleForWindow(win)} active={desktop.activeWindowId === win.id} zIndex={index + 1} onFocus={() => setDesktop(previous => previous.activeWindowId === win.id ? previous : focusWindow(previous, win.id))} onMove={(x, y) => setDesktop(previous => moveWindow(previous, win.id, x, y, workArea()))} onMinimize={() => setDesktop(previous => minimizeWindow(previous, win.id))} onMaximize={() => setDesktop(previous => toggleMaximizeWindow(previous, win.id, workArea()))} onClose={() => setDesktop(previous => closeWindow(previous, win.id))}>
      {win.appId === 'explorer' && <Explorer onOpenSource={openSource} />}
      {win.appId === 'viewer' && win.source && <Viewer source={win.source} />}
      {win.appId === 'messenger' && <Messenger source={win.source} onOpenSource={openSource} />}
      {win.appId === 'calendar' && <Calendar source={win.source} onOpenSource={openSource} />}
      {win.appId === 'notebook' && <Notebook onOpenSource={openSource} />}
      {win.appId === 'hints' && <Hints />}
      {win.appId === 'submit' && <Submit />}
    </WindowFrame>)}
    <Taskbar desktop={desktop} titleFor={id => { const win = desktop.windows.find(item => item.id === id); return win ? titleForWindow(win) : ''; }} onFocus={id => setDesktop(previous => focusWindow(previous, id))} referenceTime={lastAccessCase.referenceTime} />
    {showEnding && <div className="ending-layer"><Ending onContinue={onContinue ?? (() => {})} onRestart={onRestart} onOpenSource={openSource} /></div>}
  </main>;
}
export default Desktop;
