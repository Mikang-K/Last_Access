import { useState } from 'react';
import { lastAccessCase } from '../content/last-access/case';
import { validateSubmission } from '../game/rules';
import { useGameDispatch, useGameState } from '../app/GameProvider';

export function Submit() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [feedback, setFeedback] = useState('');
  const solved = state.phase === 'solved';
  const evidence = lastAccessCase.evidence.filter(item => state.collectedEvidenceIds.includes(item.id));
  const submit = () => {
    const result = validateSubmission(state, lastAccessCase);
    if (result.status === 'incomplete') {
      setFeedback('답을 고르고 필요한 개수만큼 근거를 선택해 줘.');
      const draft = state.submissionDraft[result.questionId];
      const target = document.getElementById(`question-${result.questionId}`);
      const input = target?.querySelector<HTMLInputElement>(draft?.answerId ? 'input[type="checkbox"]:not(:disabled)' : 'input[type="radio"]');
      if (input) input.focus(); else target?.focus();
      return;
    }
    dispatch({ type: 'SUBMIT_SOLUTION' });
    setFeedback(result.status === 'incorrect' ? '답 또는 근거를 다시 확인해 줘. 기록을 더 살펴볼 수 있어.' : '모든 기록이 하나의 이야기로 이어졌습니다.');
  };
  return <div className="submission-app app-padding"><header className="app-section-heading"><div><p className="eyebrow">CASE 01 · FINAL REPORT</p><h2>진상 제출</h2></div><span>{solved ? '✓ 사건 해결' : `제출 ${state.submissionAttempts}회`}</span></header><p className="muted">기록에서 확인한 답과 근거를 함께 골라 주세요. 각 질문의 증거는 필요한 개수만 선택할 수 있습니다.</p>{lastAccessCase.questions.map((question, index) => {
    const draft = state.submissionDraft[question.id] ?? { answerId: '', evidenceIds: [] };
    const limit = question.requiredEvidenceIds.length;
    return <fieldset key={question.id} id={`question-${question.id}`} tabIndex={-1} className="question-block" disabled={solved}><legend><span className="question-index">0{index + 1}</span>{question.prompt}</legend><div className="answer-options">{question.options.map(option => <label key={option.id}><input type="radio" name={question.id} value={option.id} checked={draft.answerId === option.id} onChange={() => dispatch({ type: 'UPDATE_SUBMISSION', questionId: question.id, answerId: option.id, evidenceIds: draft.evidenceIds })} /><span>{option.label}</span></label>)}</div><p className="evidence-caption">근거 선택 · {draft.evidenceIds.length}/{limit}개</p>{evidence.length === 0 && <p className="muted">먼저 자료에서 증거를 기록해 주세요.</p>}<div className="submission-evidence">{evidence.map(item => <label key={item.id}><input type="checkbox" checked={draft.evidenceIds.includes(item.id)} disabled={solved || (!draft.evidenceIds.includes(item.id) && draft.evidenceIds.length >= limit)} onChange={event => dispatch({ type: 'UPDATE_SUBMISSION', questionId: question.id, answerId: draft.answerId, evidenceIds: event.target.checked ? [...draft.evidenceIds, item.id] : draft.evidenceIds.filter(id => id !== item.id) })} /><span>{item.title}</span></label>)}</div></fieldset>;
  })}<div role="status" className="submission-feedback">{feedback}</div>{solved ? <p className="solved-note">해결한 답과 근거는 보존됩니다. 자료 조사와 메모는 계속할 수 있습니다.</p> : <button className="primary submit-button" onClick={submit}>답과 근거 제출하기 <span aria-hidden="true">→</span></button>}</div>;
}
