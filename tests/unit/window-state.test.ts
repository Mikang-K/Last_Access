import { describe, expect, it } from 'vitest';
import { clampBounds, closeWindow, focusWindow, minimizeWindow, moveWindow, openWindow, resizeDesktop, toggleMaximizeWindow, type DesktopState } from '../../src/desktop/window-state';

const area = { width: 1920, height: 1036 };
const empty: DesktopState = { windows: [], activeWindowId: null };
describe('창 상태', () => {
  it('같은 앱을 복원하고 파일별 창을 구분한다', () => {
    let state = openWindow(empty, { appId: 'explorer' }, area);
    state = minimizeWindow(state, 'explorer');
    state = openWindow(state, { appId: 'explorer' }, area);
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0].minimized).toBe(false);
    state = openWindow(state, { appId: 'viewer', source: { kind: 'file', id: 'F01' } }, area);
    state = openWindow(state, { appId: 'viewer', source: { kind: 'file', id: 'F02' } }, area);
    expect(state.windows).toHaveLength(3);
    expect(focusWindow(state, 'explorer').windows.at(-1)?.id).toBe('explorer');
    expect(closeWindow(state, 'file:F01').windows).toHaveLength(2);
  });
  it('최대화 후 이전 크기로 복원한다', () => {
    const state = openWindow(empty, { appId: 'explorer' }, area);
    const maximized = toggleMaximizeWindow(state, 'explorer', area);
    expect(maximized.windows[0].bounds).toEqual({ x: 0, y: 0, ...area });
    expect(toggleMaximizeWindow(maximized, 'explorer', area).windows[0].bounds).toEqual(state.windows[0].bounds);
  });
  it('화면이 줄어들면 전체 창과 닫기 버튼 공간을 보존한다', () => {
    const bounds = clampBounds({ x: 1650, y: 900, width: 680, height: 480 }, { width: 1280, height: 676 });
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(1280);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(676);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    const moved = moveWindow(openWindow(empty, { appId: 'explorer' }, area), 'explorer', 1800, 1000, area);
    const resized = resizeDesktop(moved, { width: 1280, height: 676 });
    expect(resized.windows[0].bounds.x + resized.windows[0].bounds.width).toBeLessThanOrEqual(1280);
    expect(resized.windows[0].bounds.y + resized.windows[0].bounds.height).toBeLessThanOrEqual(676);
  });
});
