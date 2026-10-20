import { useEffect, useId, useRef, type ReactNode } from 'react';

export function ConfirmDialog({ open, title, children, confirmLabel = '확인', onConfirm, onCancel }: { open: boolean; title: string; children: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previous = document.activeElement;
    element.showModal();
    cancel.current?.focus();
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={titleId} className="confirm-dialog" onCancel={event => { event.preventDefault(); onCancel(); }} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><p className="eyebrow">확인해 주세요</p><h2 id={titleId}>{title}</h2><div>{children}</div><div className="dialog-actions"><button ref={cancel} onClick={onCancel}>취소</button><button className="primary" onClick={onConfirm}>{confirmLabel}</button></div></dialog>;
}
