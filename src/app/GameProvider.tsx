import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { lastAccessCase } from '../content/last-access/case';
import { createInitialState, gameReducer } from '../game/reducer';
import type { GameAction, GameState } from '../game/types';
import { deleteSave, loadSave, subscribeSaveChanges, writeSave } from '../persistence/save-adapter';

const StateContext = createContext<GameState | null>(null);
const DispatchContext = createContext<Dispatch<GameAction> | null>(null);
type SaveStatus = 'saved' | 'pending' | 'error';
type Session = { started: boolean; loadResult: ReturnType<typeof loadSave>; saveStatus: SaveStatus; saveConflict: boolean; flushSave: () => void; retrySave: () => void; startNewGame: () => boolean; resumeGame: () => void };
const SessionContext = createContext<Session | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [loadResult, setLoadResult] = useState(() => loadSave(lastAccessCase));
  const [state, setState] = useReducer((_previous: GameState, next: GameState) => next, lastAccessCase, createInitialState);
  const current = useRef(state);
  const enabled = useRef(false);
  const dirty = useRef(false);
  const stale = useRef(false);
  const [saveConflict, setSaveConflict] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [started, setStarted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(loadResult.status === 'unavailable' ? 'error' : 'saved');
  const cancelTimer = useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; }, []);
  const stopStaleSave = useCallback(() => {
    cancelTimer();
    stale.current = true;
    setSaveConflict(true);
    setSaveStatus('error');
  }, [cancelTimer]);
  const flushSave = useCallback(() => {
    cancelTimer();
    if (!enabled.current || stale.current || !dirty.current) return;
    const result = writeSave(current.current, lastAccessCase);
    if (!result.ok && result.conflict) { stopStaleSave(); return; }
    if (result.ok) dirty.current = false;
    setSaveStatus(result.ok ? 'saved' : 'error');
  }, [cancelTimer, stopStaleSave]);
  const dispatch = useCallback<Dispatch<GameAction>>((action) => {
    const next = gameReducer(current.current, action, lastAccessCase);
    if (next === current.current) return;
    current.current = next;
    dirty.current = true;
    setState(next);
    if (!enabled.current || stale.current) return;
    cancelTimer();
    if (action.type === 'UPDATE_NOTEBOOK') {
      setSaveStatus(previous => previous === 'error' ? 'error' : 'pending');
      timer.current = setTimeout(flushSave, 300);
    } else flushSave();
  }, [cancelTimer, flushSave]);
  const startNewGame = useCallback(() => {
    cancelTimer();
    if (stale.current) return false;
    if (started || loadResult.status === 'valid' || loadResult.status === 'invalid') {
      const result = deleteSave();
      if (!result.ok) {
        if (result.conflict) stopStaleSave(); else setSaveStatus('error');
        return false;
      }
    }
    const next = createInitialState(lastAccessCase);
    current.current = next;
    setState(next);
    enabled.current = true;
    dirty.current = true;
    setStarted(true);
    flushSave();
    return true;
  }, [cancelTimer, flushSave, loadResult.status, started, stopStaleSave]);
  const resumeGame = useCallback(() => {
    if (stale.current) return;
    const latest = loadSave(lastAccessCase);
    setLoadResult(latest);
    if (latest.status !== 'valid') { setSaveStatus(latest.status === 'unavailable' ? 'error' : 'saved'); return; }
    current.current = latest.envelope.game;
    setState(current.current);
    enabled.current = true;
    dirty.current = false;
    setSaveStatus('saved');
    setStarted(true);
  }, []);
  useEffect(() => subscribeSaveChanges(() => {
    if (enabled.current) stopStaleSave();
    else setLoadResult(loadSave(lastAccessCase));
  }), [stopStaleSave]);
  useEffect(() => {
    const hidden = () => { if (document.visibilityState === 'hidden') flushSave(); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', flushSave);
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', flushSave); cancelTimer(); };
  }, [cancelTimer, flushSave]);
  return <StateContext value={state}><DispatchContext value={dispatch}><SessionContext value={{ started, loadResult, saveStatus, saveConflict, flushSave, retrySave: flushSave, startNewGame, resumeGame }}>{children}</SessionContext></DispatchContext></StateContext>;
}
export function useGameState() { const value = useContext(StateContext); if (!value) throw new Error('GameProvider가 필요합니다.'); return value; }
export function useGameDispatch() { const value = useContext(DispatchContext); if (!value) throw new Error('GameProvider가 필요합니다.'); return value; }
export function useGameSession() { const value = useContext(SessionContext); if (!value) throw new Error('GameProvider가 필요합니다.'); return value; }
