# Last Access 구현 체크리스트

작성일: 2026-10-20. 상태: **M0~M4 구현·자동 검증 완료 / 일부 구현 전 실패 확인 및 초회 사용자 플레이테스트 미실시**.

- 상세 계약과 공통 제약: [구현 계획·상세 기술 스펙](2026-10-20-last-access.md).
- 원본 요구사항: [CODEX_DEV_SPEC_Last_Access.md](../../../CODEX_DEV_SPEC_Last_Access.md).
- 실행 방식: 이번 사용자 요청에 따라 루트 관제와 subagent 3개로 분담하고 공유 계약의 의존 순서와 최종 통합 검증을 관리했다. 본문 `1.x절`은 연결된 계획 문서의 기술 스펙을 가리킨다.
- 체크박스는 구현과 지정 검증을 마친 후에만 표시한다. 문서 검토 완료는 게임 구현 완료와 구분한다.

의존 순서: **T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10**. T01=M0, T04~T05=M1, T06~T07=M2, T08~T09=M3, T10=M4다. 규칙 검증 T02~T03은 M1 작업에 앞서 기반을 마련한다. 각 작업은 실행 가능한 앱 상태와 독립적으로 확인할 수 있는 산출물을 남긴다.

각 비자명한 동작은 실패 테스트 작성 → 실패 확인 → 최소 구현 → 통과 확인으로 진행한다. 설정·정적 문구는 실행 확인으로 충분하다. 커밋은 Git 사용이 정해지고 사용자 요청 범위에 포함될 때만 수행한다. 아래 커밋명은 제안이며 이 계획이 커밋·원격 공개를 지시하지 않는다.

### T01 — M0: 시작 화면과 실행 기반

**Files:** 생성 `package.json`, `package-lock.json`, `index.html`, `tsconfig*.json`, `vite.config.ts`, `playwright.config.ts`, `.gitignore`, `src/main.tsx`, `src/app/App.tsx`, `src/styles/base.css`, `tests/e2e/start.spec.ts`, `README.md`.

**Interfaces:** 입력은 기존 개발 명세와 로컬 Node/npm. 출력은 1.8절 scripts, App, Playwright local webServer 설정이다. 아직 없는 콘텐츠 검증 테스트는 T04 전까지 미완성임을 명시하고 통과로 보고하지 않는다.

- [x] Step 1: 패키지 engines·공식 가이드를 확인해 호환 버전을 선택하고 필요한 템플릿 파일만 생성한다. React/ReactDOM 외 런타임 의존성을 추가하지 않는다. README에 버전·설치·실행·Chromium 준비 절차를 적는다.
- [x] Step 2: `start.spec.ts`에 `새 게임` button과 제목 `마지막 접속`, 원본 2.1절 도입 문단이 보이는 검사를 작성한다. 첫 화면에 `TEAL04`, `한도현`, `별관 지하 1층 자료실`이 없음을 검사한다.
- [ ] Step 3: `npm.cmd run test:e2e -- tests/e2e/start.spec.ts` 실행. 시작 UI 부재로 assertion이 실패하는지 확인한다. 설치/브라우저 오류는 테스트의 의도된 실패로 세지 않는다.
- [x] Step 4: `App`에 시작 화면을 구현한다. 이어하기·새 게임 확인의 실제 동작은 T09에서 연결한다. 네이티브 버튼과 명세 도입만 사용한다.
- [x] Step 5: 같은 E2E 명령과 `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run dev`를 실행한다. 시작 화면 표시 및 종료 코드 0을 기록한다.
- [x] Step 6: 변경 파일을 검토하고 마일스톤 기록을 남긴다. 허용된 경우 커밋 제안: `chore: initialize Last Access app`.

### T02 — 접근 제어와 퍼즐 규칙

**Files:** 생성 `src/game/types.ts`, `src/game/rules.ts`, `tests/unit/rules.test.ts`.

**Interfaces:** 입력은 1.3절 CaseContent/GameState. 출력은 `sourceKey`, `normalizePuzzleInput`, `canOpenSource`, `canAttemptPuzzle`, `canCollectEvidence`다. 최소 테스트 fixture는 테스트 파일 안에 두며 실제 전체 사건 검사는 T04에서 추가한다.

- [x] Step 1: `rules.test.ts`에 다음 핵심 assertion을 포함한 테이블 테스트를 작성한다.

```ts
expect(normalizePuzzleInput('０４１７', 'date4')).toBe('0417');
expect(normalizePuzzleInput('417', 'date4')).toBeNull();
expect(normalizePuzzleInput('04/17', 'date4')).toBeNull();
expect(normalizePuzzleInput(' teal04 ', 'asciiCode')).toBe('TEAL04');
expect(normalizePuzzleInput('TEAL 04', 'asciiCode')).toBeNull();
expect(normalizePuzzleInput('TEAL-04', 'asciiCode')).toBeNull();
```

- [x] Step 2: 같은 파일에 잠금 전 F03 및 F08의 직접 접근 false, D04의 P02 입력 가능 true, P01 미해결+P02 해결 시 F08 접근 true, 원본 미열람 증거 수집 false를 검사한다. 알 수 없는 source/puzzle/evidence ID는 모두 false다.
- [ ] Step 3: `npm.cmd exec -- vitest run tests/unit/rules.test.ts`로 대상 테스트가 규칙 구현 부재 때문에 실패하는지 확인한다.
- [x] Step 4: 1.4절의 정확한 정규화와 조상 순회 검사를 구현한다. 잘못된 부모·순환 참조는 접근을 거절하며 무한 루프에 빠지지 않는다.
- [x] Step 5: `npm.cmd exec -- vitest run tests/unit/rules.test.ts`, `npm.cmd run typecheck`가 통과하는지 확인한다. 대상 명령은 테스트 중복 실행을 피하려면 직접 vitest 명령을 사용한다.
- [x] Step 6: diff 검토 및 기록. 커밋 제안: `feat: add access and puzzle rules`.

### T03 — 진행 reducer와 답·근거 판정

**Files:** 생성 `src/game/reducer.ts`, `tests/unit/reducer.test.ts`, `tests/unit/submission.test.ts`; 수정 `src/game/types.ts`, `src/game/rules.ts`.

**Interfaces:** T02 규칙을 소비한다. `createInitialState`, `gameReducer`, `validateSubmission`과 1.3절 GameAction을 제공한다. Provider는 T06에서 연결한다.

- [x] Step 1: 테스트에 동일 퍼즐 재해결·증거 재수집 시 ID 1개 유지, 잠긴 source 열기 및 증거 위조 수집 무효, 노트 20,000자 제한, final 힌트 0→1→2→3 후 정지, 잘못된 힌트 ID 무효를 작성한다.
- [x] Step 2: 제출 fixture의 정확한 답·증거로 `correct`, E01/E02 순서를 바꿔도 `correct`, 답만/근거만 틀리면 `incorrect`, 미선택은 `incomplete`를 검사한다. 미수집 증거·중복·초과 선택은 액션으로 상태에 들어가지 않고, 조작된 state도 판정에서 성공하지 않음을 검사한다.
- [ ] Step 3: `npm.cmd exec -- vitest run tests/unit/reducer.test.ts tests/unit/submission.test.ts`가 구현 부재로 실패하는지 확인한다.
- [x] Step 4: 액션별 참조·접근·허용 개수 검사와 집합 비교를 구현한다. 조사 상태를 유지하는 오답, 완성 제출 횟수 증가, solved 이후 제출 결과 고정을 적용한다.
- [x] Step 5: 같은 단위 명령과 타입 검사를 통과시킨다. 불완전 제출 시 횟수 유지, 정답 초안만으로 자동 solved가 되지 않음, solved 이후 UPDATE_SUBMISSION/SUBMIT_SOLUTION 무효와 메모 갱신 허용을 테스트로 확인한다.
- [x] Step 6: diff 검토 및 기록. 커밋 제안: `feat: validate investigation and evidence submissions`.

### T04 — 전체 사건 데이터와 콘텐츠 검사

**Files:** 생성 `src/content/last-access/*` 및 두 SVG, `src/game/content-validator.ts`, `tests/unit/content.test.ts`.

**Interfaces:** T02~T03 타입/규칙을 소비한다. `lastAccessCase: CaseContent`, `validateContent(content): string[]`를 제공한다. 모든 앱과 저장 검증은 같은 content 객체를 사용한다.

- [x] Step 1: 콘텐츠 테스트에 자료 14개·폴더 5개·대화 2개·일정 3개·퍼즐 2개·증거 9개·질문 3개, P01/P02 target, Q01~Q03 정답과 증거의 정확한 매핑을 assertion으로 고정한다.
- [x] Step 2: 중복 ID, 누락 부모/ROOT, 폴더 순환, 잘못된 access/puzzle/source/answer/evidence, 표 행 열 수 불일치, 누락 도식 에셋을 각각 변조한 fixture에서 ID/위치 포함 오류가 나오는 테스트를 작성한다.
- [ ] Step 3: `npm.cmd run check:content`가 데이터·검증기 부재로 실패하는지 확인한다.
- [x] Step 4: 원본 5절을 데이터로 옮기고 두 SVG 및 동등한 텍스트를 작성한다. F08 800,000원/17:50, F09 1,800,000원/18:45, F10 18:40, F11 18:40~18:43, F13 19:20 등록/20:30 발송, F14 19:25를 내용 테스트로 고정한다.
- [x] Step 5: 초기 상태에서 UI와 동일한 액션으로 정규 경로와 P01 생략 경로를 실행하는 테스트를 추가한다. E01~E07만 수집해도 최종 correct, E08·E09 미수집을 확인한다. 대체 단서들이 잠금 밖에 있는지도 검사한다.
- [x] Step 6: `npm.cmd run check:content`, `npm.cmd run test:unit`, `npm.cmd run typecheck` 통과. 커밋 제안: `feat: add validated first case content`.

### T05 — M1: 가상 바탕화면·창·문서 기반

**Files:** 생성 `src/desktop/*`, `src/apps/Explorer.tsx`, `src/apps/Viewer.tsx`, `src/styles/desktop.css`, `src/styles/apps.css`, `tests/unit/window-state.test.ts`, `tests/unit/viewer.test.ts`, `tests/e2e/desktop.spec.ts`; 수정 `src/app/App.tsx`.

**Interfaces:** T04 콘텐츠와 T02 접근 규칙을 소비한다. 1.6절 창 함수들, `Desktop`, Viewer.tsx의 `DocumentContent({ content }: { content: FileContent })`를 제공한다. Viewer는 `source: SourceRef`를 받고 Explorer는 창 열기 콜백을 사용한다. 임시 진행 상태가 필요하면 조사 초기값만 사용하고 잠금 우회 버튼을 만들지 않는다.

- [x] Step 1: 창 단위 테스트에 앱 중복 실행 1개, 다른 파일 창 2개, 최소화 후 같은 인스턴스 복원, 최대화/복원, 1920×1080→1280×720 경계 보정을 작성한다. 위치·크기는 작업영역 안이고 닫기 버튼 공간이 남아야 한다.
- [x] Step 2: `desktop.spec.ts`에 F01 텍스트·F02 도식 표시, 창 열기/최소화/복원/닫기/나란히 비교, 타이틀바만 드래그, 본문 텍스트 선택과 스크롤 검사를 작성한다. `viewer.test.ts`에는 DocumentContent의 text/table/diagram fixture를 renderToStaticMarkup으로 렌더링하여 본문, `<table>`·열 제목·`800,000`, 이미지 대체 텍스트가 포함되는지 검사한다.
- [ ] Step 3: `npm.cmd exec -- vitest run tests/unit/window-state.test.ts tests/unit/viewer.test.ts`, `npm.cmd run test:e2e -- tests/e2e/desktop.spec.ts`의 의도된 실패를 확인한다.
- [x] Step 4: 경계 보정 함수·WindowFrame·Taskbar·탐색기·뷰어를 구현한다. `새 게임`으로 바탕화면과 F01을 열고 기록 기준 시각을 표시한다. 문서 재실행은 기존 창을 활성화한다.
- [x] Step 5: 같은 검사와 build를 통과시킨다. M1에서 텍스트·표·도식 렌더링 검사와 창 조작 UI 검사를 완료한다. 실제 잠긴 F08의 퍼즐 해제 후 표 열람은 T06에서 추가 검증한다.
- [x] Step 6: 실행 가능한 M1 상태와 다음 완료 기준 기록. 커밋 제안: `feat: add desktop windows and document browsing`.

### T06 — 실제 조사·잠금 해제·증거와 노트

**Files:** 생성 `src/app/GameProvider.tsx`, `src/apps/Messenger.tsx`, `src/apps/Calendar.tsx`, `src/apps/Notebook.tsx`, `tests/e2e/investigation.spec.ts`, `tests/e2e/helpers.ts`; 수정 App/Explorer/Viewer/Desktop.

**Interfaces:** T03 reducer와 T04 lastAccessCase를 소비한다. `useGameState(): GameState`, `useGameDispatch(): Dispatch<GameAction>`를 export한다. Provider 저장 연결은 T09에서 추가한다. 실제 source 열람 기록은 본문 표시 후 수행한다.

- [x] Step 1: E2E에 초기 F03 본문 없음·D04 자식 제목 없음, P01 `417` 오답 뒤 `０４１７` 성공, P02 `TEAL-04` 오답 뒤 ` teal04 ` 성공을 작성한다. 비활성 버튼만이 아니라 DOM에 잠긴 본문이 없음을 검사한다.
- [x] Step 2: C02 선택→E01 기록, F06 열기→E02 기록, 재기록 중복 없음, 원본 다시 열기에서 C02 선택 복귀를 검사한다. F08을 퍼즐 해제 후 열어 시맨틱 table의 800,000원이 보이는지 검사한다.
- [ ] Step 3: `npm.cmd run test:e2e -- tests/e2e/investigation.spec.ts`가 앱/기능 부재로 실패하는지 확인한다.
- [x] Step 4: Provider를 실제 UI에 연결하고 대화·일정·노트·비밀번호 폼·증거 버튼을 구현한다. 사용자 노트만 편집하며 20,000자 한도와 사용량을 표시한다. 원본 열기 경로 모두 공통 접근 규칙을 사용한다.
- [x] Step 5: 대상 E2E, 단위 검사, 타입 검사를 통과시킨다. 열린 파일 창을 닫아도 증거/메모 유지, 최소화 복원 시 메신저 선택 유지, 대화별 스크롤 유지, C01 온라인 표시 없음 확인.
- [x] Step 6: 실제 F08 표 열람과 증거 기록의 통합 검사 결과를 기록한다. 커밋 제안: `feat: connect investigation apps and evidence collection`.

### T07 — M2: 최종 제출과 엔딩 완주

**Files:** 생성 `src/apps/Submit.tsx`, `src/apps/Ending.tsx`, `tests/e2e/submission.spec.ts`; 수정 Desktop/App 및 e2e/helpers.

**Interfaces:** T03 validateSubmission과 T06 Context를 소비한다. Submit은 GameAction으로 초안을 편집하고 제출한다. Ending은 solved 상태를 소비하며 계속 조사 콜백과 초기화 요청 콜백을 받는다.

- [x] Step 1: 정규 경로 완주와 별도 P01 생략 경로 완주를 작성한다. UI로 P02를 풀고 E01~E07만 수집해 Q01/Q02/Q03 답과 정확한 증거를 제출한다. E08·E09 수집 없이 엔딩 표시를 기대한다.
- [x] Step 2: 답 미선택/증거 부족 시 해당 입력 초점, 정답+잘못된 근거 또는 오답+정확한 근거의 일반 오류, 수정 제출 성공, 잘못된 제출 뒤 초안·증거·노트 보존을 검사한다. 모든 증거 선택 시도로 개수 제한을 우회할 수 없음을 확인한다.
- [ ] Step 3: `npm.cmd run test:e2e -- tests/e2e/submission.spec.ts`의 실패를 확인한다.
- [x] Step 4: 질문별 radio/checkbox UI와 개수 제한, 원본 5.6절 오답 문구, 세부 정답을 누설하지 않는 피드백을 구현한다. 엔딩 문구와 원본 링크·계속 조사 버튼을 연결한다. solved 이후 제출 결과는 읽기 전용으로 표시한다. 처음부터의 확인은 T09에서 완성한다.
- [x] Step 5: 단위 검사와 대상 E2E를 통과시킨다. 시작 화면부터 실제 조사로 엔딩까지 가고 개발용 state 주입·엔딩 바로가기 없이 동작하는지 확인한다.
- [x] Step 6: M2 완주 결과 기록. 커밋 제안: `feat: complete evidence based ending`.

### T08 — 저장 스키마와 어댑터

**Files:** 생성 `src/persistence/schema-validation.ts`, `src/persistence/save-adapter.ts`, `tests/unit/save.test.ts`.

**Interfaces:** T02~T04 규칙·콘텐츠를 소비한다. 1.7절의 LoadResult/WriteResult, validateSave/loadSave/writeSave/deleteSave를 제공한다. 브라우저 저장소에 직접 접근하는 코드는 이 어댑터에만 둔다.

- [x] Step 1: save 단위 테스트에 정상 왕복, 빈 저장, 손상 JSON, null/배열/오류 타입, 잘못된 schemaVersion/caseVersion/caseId, 알 수 없는 자료/증거/힌트 ID, 중복 ID, 음수/비정수 횟수, 노트 초과를 작성한다.
- [x] Step 2: 잠금 미해결인데 F08 열람·E05 수집된 저장, 열지 않은 source의 증거, 미수집 증거를 가진 초안, 잘못된 질문 선택지, 판정 incorrect인 solved 저장을 거절한다. 미완성 초안과 P01 미해결+P02 해결 저장은 정상으로 검사한다. 정답 제출 후 계속 조사에서 메모와 추가 증거를 갱신한 solved 상태도 저장 왕복에 성공하는지 검사한다.
- [x] Step 3: getItem/setItem/removeItem 및 localStorage getter가 throw하는 경우를 검사한다. invalid 로드 뒤 setItem/removeItem 호출 0회, 원본 문자열 동일, deleteSave가 게임 키만 삭제함을 검사한다.
- [ ] Step 4: `npm.cmd exec -- vitest run tests/unit/save.test.ts`가 구현 부재로 실패하는지 확인한다.
- [x] Step 5: unknown 검증과 read/write/delete 예외 처리를 구현한다. 버전 자동 변환·복구 추정은 넣지 않고 명시적 초기화를 요구한다.
- [x] Step 6: 같은 단위 명령과 typecheck 통과. 커밋 제안: `feat: validate and persist game saves`.

### T09 — M3: 이어하기·자동 저장·힌트·초기화

**Files:** 생성 `src/app/ConfirmDialog.tsx`, `src/apps/Hints.tsx`, `tests/e2e/persistence.spec.ts`; 수정 Provider/App/Ending/Notebook/Desktop 및 start E2E.

**Interfaces:** T08 저장 API와 T06 Context를 소비한다. Provider는 `saveStatus: 'saved'|'pending'|'error'`, `flushSave(): void`, `retrySave(): void`, `startNewGame(): void`를 앱 내부 콜백/Context로 제공한다. 시작 화면의 load 상태와 조사 phase는 분리한다.

- [x] Step 1: P01 직후, P02 직후, 제출 직전 각각 reload→이어하기→상태 보존을 검사한다. 클리어 후 계속 조사→메모 변경→reload→이어하기에서도 solved와 정답 제출 결과·최신 메모가 복원되는지 검사한다. 메모·증거·힌트·초안·solved 모두 복원하고 창 배치는 기본값으로 돌아가는지 확인한다.
- [x] Step 2: 메모 입력 즉시 증거 기록, 메모 입력 후 blur, visibilitychange, pagehide에서 마지막 문자열이 저장되는 검사를 작성한다. debounce 대기 중 새 게임 확인 후 이전 메모가 되살아나지 않게 검사한다. Playwright Clock으로 300ms를 제어하며 고정 sleep을 넣지 않는다.
- [x] Step 3: 손상 저장을 주입하고 오류 안내·초기화 취소 시 원문 보존·확인 시 해당 키 초기화를 검사한다. Storage 실패를 주입하면 메모리 플레이와 error 유지, 재시도 성공 후 saved 전환을 검사한다. UI 완주를 state 주입으로 대체하지 않는다.
- [ ] Step 4: `npm.cmd run test:e2e -- tests/e2e/persistence.spec.ts`의 의도된 실패를 확인한다.
- [x] Step 5: 1.7절 저장 정책을 Provider에 연결한다. 확인 모달과 초점 복귀, 새 게임/처음부터, P01/P02/final 각 3단계 힌트 및 공개 전 스포일러 안내를 구현한다.
- [x] Step 6: 대상 E2E와 전체 단위 검사를 통과시킨다. 저장 실패 문구 `현재 진행을 저장할 수 없어. 창을 닫으면 진행이 사라질 수 있어.`가 유지되고 이전 저장을 최신으로 안내하지 않음을 확인한다.
- [x] Step 7: M3 복원·오류·힌트 결과 기록. 커밋 제안: `feat: add resume hints and safe save recovery`.

### T10 — M4: 접근성·화면·최종 회귀와 사용 문서

**Files:** 생성 `tests/e2e/accessibility.spec.ts`, `docs/development.md`, `docs/walkthrough.spoilers.md`; 수정 CSS/WindowFrame/ConfirmDialog/README와 기존 테스트의 발견된 결함 소유 파일.

**Interfaces:** 앞 작업의 실제 앱과 scripts를 소비한다. 출력은 최종 실행 가능한 게임, 공략·개발 문서 및 실제 검사 결과 기록이다. 기능 확장 없이 명세의 미완료 조건만 처리한다.

- [x] Step 1: 키보드만으로 앱 실행→대화 선택→퍼즐 제출→증거 선택→최종 제출→엔딩에 도달하는 테스트를 작성한다. 모달 초점 진입·Tab 순환·Esc 취소·실행 버튼 복귀를 검사한다.
- [x] Step 2: 두 해상도에서 창 드래그 도중 resize, pointercancel 후 재조작, 닫기 버튼 경계, 긴 문서 스크롤·표 가독성 검사를 작성한다. 닫기 버튼 bounding box가 작업영역 안임을 assertion으로 확인한다. 원본 바로 열기와 잠금 콘텐츠 DOM 미노출도 재확인한다.
- [x] Step 3: 대상 E2E의 실패를 확인하고 필요한 최소 CSS·초점·포인터 처리를 수정한다. 스크린샷으로 시작 화면, 바탕화면, 잠금 UI, 문서 비교, 제출 화면, 엔딩을 직접 확인한다.
- [x] Step 4: `npm.cmd run check:content`, `npm.cmd run typecheck`, `npm.cmd run test:unit`, `npm.cmd run test:e2e`, `npm.cmd run build`를 차례로 실행해 명령·결과·미실행 사유를 docs/development.md에 기록한다.
- [x] Step 5: `npm.cmd run preview -- --host 127.0.0.1`로 dist를 열어 시작·문서·표·도식 에셋을 확인한다. 외부 요청 없이 필수 플레이가 되는지 브라우저 네트워크 기록을 확인한다. 정적 서비스 실행을 file:// 더블클릭 지원으로 표현하지 않는다.
- [x] Step 6: README에 npm ci/dev/typecheck/check:content/test:unit/test:e2e/build/preview, Chromium 설치, 지원 환경, 저장 위치/슬롯, 창 배치 초기화, 저장 차단 시 제한을 적는다. README 첫 화면에 정답을 넣지 않고 스포일러 공략으로 연결한다.
- [x] Step 7: 공략에 정규 경로·P01 생략 경로·비밀번호·정확한 증거 조합·예약 메시지 해석을 적는다. 개발 문서에는 정적 번들 정답 포함, 보안 기능 아님, 자동 검사와 수동 검사의 범위를 기록한다.
- [ ] Step 8: 가능한 경우 처음 보는 사람 1명에게 힌트 없이 플레이를 요청해 소요 시간과 막힌 지점을 기록한다. 미실시 시 15~30분은 미검증 목표라고 남긴다.
- [x] Step 9: 아래 최종 인수표를 실제 증거로 갱신한다. 커밋이 허용된 경우 제안: `test: verify complete Last Access playthrough`.

### 최종 인수 체크리스트

| 확인 항목 | 소유 작업 | 완료 |
| --- | --- | --- |
| README로 설치·개발 서버·정적 빌드 재현 | T01/T10 | [x] |
| 타입·콘텐츠·단위·브라우저·빌드 검사 통과 | T10 | [x] |
| 자료 14개·대화 2개·일정 3개·퍼즐 2개·증거 9개 구현 | T04/T06 | [x] |
| 정규 경로와 P01 생략 경로 모두 실제 UI로 엔딩 | T07/T10 | [x] |
| 답+정확한 증거 집합 동시 검증, E08/E09 없이 성공 | T03/T07 | [x] |
| 오답·재열람·중복 수집으로 진행 손실 없음 | T02/T03/T06/T07 | [x] |
| 잠긴 본문·자식 목록·미발견 증거 제목 비노출 | T02/T06/T10 | [x] |
| 각 잠금 직후·제출 직전·클리어 후 복원 | T08/T09 | [x] |
| 저장 차단·손상·버전 불일치·초기화 취소/확인 | T08/T09 | [x] |
| 노트 최신값 flush 및 초기화 뒤 과거 타이머 차단 | T09 | [x] |
| 힌트 순차 공개·동의·저장, FINAL 별도 대상 | T03/T09 | [x] |
| 두 기준 해상도에서 창·문서·버튼 접근 가능 | T05/T10 | [x] |
| 키보드 완주·모달 초점·원본 이동·스크롤 확인 | T06/T10 | [x] |
| README와 별도 스포일러 공략 제공 | T10 | [x] |
| 외부 계정·API 키·실제 파일·런타임 외부 요청 불필요 | T10 | [x] |
| 플레이 시간은 관찰 결과와 미검증 목표를 구분 | T10 | [x] |

## 문서 검토 결과

2026-10-20 코드리뷰 후 오래된 탭의 저장 덮어쓰기 및 동일 증거의 반복 원본 이동을 수정했다. 이번 회귀 검사는 구현 전 의도된 실패를 확인하고 수정했다. 콘텐츠 6개·단위 36개·Chromium E2E 40개와 타입·빌드가 통과했으며 상세 실행 증거와 동시 쓰기 범위 제한은 [개발 기록](../../development.md#2026-10-20-코드리뷰-수정)에 있다. 초기 구현의 미실시 체크박스는 소급해서 변경하지 않는다.

작성 후 검토에서 M1 표 렌더링 검증의 단계 의존성과 클리어 후 제출 초안 변경에 따른 저장 검증 충돌을 발견해 위 작업에 반영했다. 상세 변경 이유와 원본 요구사항 대응표는 [계획 문서의 검토·수정 기록](2026-10-20-last-access.md#2-문서-분리-후-검토수정-기록)에 있다. 구현 및 지정 검증을 확인한 항목만 체크했다. 구현 전 의도된 실패를 확인하지 못한 단계와 초회 사용자 플레이테스트는 미체크로 남긴다. 실제 명령·결과·검증 한계는 [개발 기록](../../development.md)에 있다.
