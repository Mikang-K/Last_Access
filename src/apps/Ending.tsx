import { useEffect, useRef } from 'react';
import { lastAccessCase } from '../content/last-access/case';
import { canOpenSource } from '../game/rules';
import type { SourceRef } from '../game/types';
import { useGameState } from '../app/GameProvider';

export function Ending({ onContinue, onRestart, onOpenSource }: { onContinue: () => void; onRestart: () => void; onOpenSource: (source: SourceRef) => void }) {
  const state = useGameState();
  const container = useRef<HTMLElement>(null);
  useEffect(() => { container.current?.focus(); }, []);
  if (state.phase !== 'solved') return null;
  return <section ref={container} tabIndex={-1} className="ending-screen" aria-labelledby="ending-title"><div className="ending-paper"><p className="eyebrow">CASE CLOSED · LAST ACCESS</p><h1 id="ending-title">끊어진 접속,<br /><span>이어진 진실.</span></h1><p className="ending-lead">서윤이 기다리는 곳은 <strong>별관 지하 1층 자료실</strong>이었다.</p><p>정산표를 실제로 수정한 사람은 한도현. 서윤의 공용 작업 계정으로 설치비를 <strong>800,000원에서 1,800,000원</strong>으로 바꾸고, 서윤의 작업처럼 보이게 했다. 18:40 변경 기록과 같은 시각의 민지 목격 기록이 실제 작업자를 가리키고 있었다.</p><p>서윤은 원본과 제출본의 차이를 알아챘다. 19:20에 등록하고 20:30에 발송한 예약 메시지는 그 시각의 실시간 연락이 아니었다. 19:25에 휴대전화를 끄고 이동한 뒤, 남겨 둔 기록으로 도움을 청한 것이었다.</p><div className="ending-sources"><span>남겨진 마지막 기록</span>{['F13', 'F14'].map(id => { const file = lastAccessCase.files.find(item => item.id === id); const source: SourceRef = { kind: 'file', id }; return file && canOpenSource(state, source, lastAccessCase) ? <button key={id} onClick={() => { onContinue(); onOpenSource(source); }}>{file.name} ↗</button> : null; })}</div><p className="ending-postscript">이제, 약속한 장소로 갈 시간이다.</p><div className="ending-actions"><button className="primary" onClick={onContinue}>계속 조사</button><button onClick={onRestart}>처음부터</button></div></div></section>;
}
