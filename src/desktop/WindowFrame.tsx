import { useRef, type ReactNode } from 'react';
import type { WindowState } from './window-state';

type Props = { window: WindowState; title: string; active: boolean; zIndex: number; children: ReactNode; onFocus: () => void; onMove: (x: number, y: number) => void; onMinimize: () => void; onMaximize: () => void; onClose: () => void };
export function WindowFrame({ window: win, title, active, zIndex, children, onFocus, onMove, onMinimize, onMaximize, onClose }: Props) {
  const drag = useRef<{ x: number; y: number; left: number; top: number; pointerId: number } | null>(null);
  return <section className={`desktop-window${active ? ' active' : ''}`} aria-label={title} hidden={win.minimized} style={{ left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height, zIndex }} onPointerDown={onFocus} onFocusCapture={onFocus}>
    <header className="window-titlebar" onPointerDown={event => {
      if (win.maximized || event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) return;
      drag.current = { x: event.clientX, y: event.clientY, left: win.bounds.x, top: win.bounds.y, pointerId: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    }} onPointerMove={event => {
      const start = drag.current;
      if (start && start.pointerId === event.pointerId) onMove(start.left + event.clientX - start.x, start.top + event.clientY - start.y);
    }} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      <span className="window-title">{title}</span><div className="window-controls">
        <button type="button" aria-label={`${title} 최소화`} onClick={onMinimize}>−</button>
        <button type="button" aria-label={`${title} ${win.maximized ? '복원' : '최대화'}`} onClick={onMaximize}>{win.maximized ? '❐' : '□'}</button>
        <button type="button" aria-label={`${title} 닫기`} onClick={onClose}>×</button>
      </div>
    </header><div className="window-body">{children}</div>
  </section>;
}
