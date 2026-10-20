import type { SourceRef } from '../game/types';
import { sourceKey } from '../game/rules';

export type AppId = 'explorer' | 'viewer' | 'messenger' | 'calendar' | 'notebook' | 'hints' | 'submit';
export type Bounds = { x: number; y: number; width: number; height: number };
export type WorkArea = { width: number; height: number };
export type WindowState = { id: string; appId: AppId; source?: SourceRef; bounds: Bounds; restoreBounds: Bounds; minimized: boolean; maximized: boolean };
export type DesktopState = { windows: WindowState[]; activeWindowId: string | null };
type WindowRequest = { appId: AppId; source?: SourceRef };

export function clampBounds(bounds: Bounds, area: WorkArea): Bounds {
  const width = Math.max(1, Math.min(bounds.width, area.width));
  const height = Math.max(1, Math.min(bounds.height, area.height));
  return { width, height, x: Math.max(0, Math.min(bounds.x, area.width - width)), y: Math.max(0, Math.min(bounds.y, area.height - height)) };
}
export function focusWindow(state: DesktopState, id: string): DesktopState {
  const target = state.windows.find(window => window.id === id);
  return target ? { windows: [...state.windows.filter(window => window.id !== id), { ...target, minimized: false }], activeWindowId: id } : state;
}
export function openWindow(state: DesktopState, request: WindowRequest, area: WorkArea): DesktopState {
  const id = request.appId === 'viewer' && request.source ? sourceKey(request.source) : request.appId;
  if (state.windows.some(window => window.id === id)) {
    const focused = focusWindow(state, id);
    return { ...focused, windows: focused.windows.map(window => window.id === id ? { ...window, source: request.source ?? window.source } : window) };
  }
  const size = request.appId === 'explorer' ? { width: 680, height: 460 } : request.appId === 'viewer' ? { width: 640, height: 480 } : { width: 720, height: 500 };
  const bounds = clampBounds({ ...size, x: 150 + state.windows.length * 28, y: 38 + state.windows.length * 24 }, area);
  return { windows: [...state.windows, { ...request, id, bounds, restoreBounds: bounds, minimized: false, maximized: false }], activeWindowId: id };
}
export function minimizeWindow(state: DesktopState, id: string): DesktopState {
  const windows = state.windows.map(window => window.id === id ? { ...window, minimized: true } : window);
  return { windows, activeWindowId: state.activeWindowId === id ? windows.filter(window => !window.minimized).at(-1)?.id ?? null : state.activeWindowId };
}
export function closeWindow(state: DesktopState, id: string): DesktopState {
  const windows = state.windows.filter(window => window.id !== id);
  return { windows, activeWindowId: state.activeWindowId === id ? windows.filter(window => !window.minimized).at(-1)?.id ?? null : state.activeWindowId };
}
export function toggleMaximizeWindow(state: DesktopState, id: string, area: WorkArea): DesktopState {
  const focused = focusWindow(state, id);
  return { ...focused, windows: focused.windows.map(window => window.id !== id ? window : window.maximized
    ? { ...window, maximized: false, bounds: clampBounds(window.restoreBounds, area) }
    : { ...window, maximized: true, restoreBounds: window.bounds, bounds: { x: 0, y: 0, ...area } }) };
}
export function moveWindow(state: DesktopState, id: string, x: number, y: number, area: WorkArea): DesktopState {
  return { ...state, windows: state.windows.map(window => window.id === id && !window.maximized ? { ...window, bounds: clampBounds({ ...window.bounds, x, y }, area) } : window) };
}
export function resizeDesktop(state: DesktopState, area: WorkArea): DesktopState {
  return { ...state, windows: state.windows.map(window => ({ ...window, bounds: window.maximized ? { x: 0, y: 0, ...area } : clampBounds(window.bounds, area), restoreBounds: clampBounds(window.restoreBounds, area) })) };
}
