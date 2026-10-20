import type { DesktopState } from './window-state';

export function Taskbar({ desktop, titleFor, onFocus, referenceTime }: { desktop: DesktopState; titleFor: (id: string) => string; onFocus: (id: string) => void; referenceTime: string }) {
  return <footer className="taskbar"><span className="taskbar-brand">LA</span><nav aria-label="열린 창">{desktop.windows.map(window => <button key={window.id} type="button" aria-pressed={desktop.activeWindowId === window.id && !window.minimized} onClick={() => onFocus(window.id)}>{titleFor(window.id)}{window.minimized ? ' (최소화)' : ''}</button>)}</nav><time>기록 기준 시각<br />{referenceTime}</time></footer>;
}
