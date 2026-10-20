# Last Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 기본 계획은 단일 실행자 순차 구현이다. 이번 구현은 사용자의 명시적인 요청에 따라 루트 관제 에이전트와 subagent 3개로 분담했다. 공유 타입·규칙 계약 이후 구현을 병행하고 최종 통합 검증을 수행했다. 실행 증거와 한계는 [개발 기록](../../development.md)에 있다.

**Goal:** 한국어 가상 컴퓨터에서 단서를 조사하고 두 잠금을 해제한 뒤 답과 근거로 첫 사건을 해결하는 정적 웹 게임을 구현한다.

**Architecture:** React UI는 게임 규칙과 정적 사건 데이터를 소비한다. 순수 reducer가 모든 진행 변경을 검증하고, 별도 저장 계층이 검증된 진행만 localStorage에 저장한다. 창 상태는 사건 진행과 분리한다.

**Tech Stack:** React, TypeScript, Vite, CSS, useReducer + Context, localStorage, Vitest, Playwright, npm.

**Spec:** [CODEX_DEV_SPEC_Last_Access.md](../../../CODEX_DEV_SPEC_Last_Access.md), 버전 1.0, 2026-10-19. 두 문서를 함께 읽는다.

작성일: 2026-10-20. 상태: **앱 구현·자동 검증 완료 / 초회 사용자 플레이테스트 미실시**. 실행 작업과 완료 표시는 [구현 체크리스트](2026-10-20-last-access-checklist.md)에서 관리한다.

## Global Constraints

- 이번 작업은 구현 계획 작성이다. 원본 명세 0·8·11절의 즉시 구현 지시는 이후 구현 요청에 적용한다.
- 데스크톱 브라우저, 한국어, 1인, 사건 1개, 정답 엔딩 1개, 저장 슬롯 1개. 15~30분은 플레이테스트 전 목표다.
- 사건 기준 시각은 `2026-10-18 20:45`, 표시 문구는 `기록 기준 시각`이다. 실제 시각은 `savedAt`에만 사용한다.
- 원본 명세 5절의 인물·시각·금액·자료 ID·증거 관계·정답을 유지한다. 변경 시 콘텐츠·테스트·공략을 함께 갱신한다.
- UI와 주석은 한국어, 콘텐츠 ID는 고정 영문 ID. 원본은 읽기 전용이고 사용자 노트만 편집한다.
- 서버·계정·DB·런타임 LLM·실제 파일 접근·외부 CDN·웹폰트·분석 서비스를 추가하지 않는다.
- 잠금은 게임 진행 장치다. 정적 번들에 정답이 포함되므로 암호화나 서버 보안으로 설명하지 않는다.
- 새 게임 및 손상 저장 초기화는 확인을 거친다. 취소 시 원본 저장을 보존하며 `localStorage.clear()`를 사용하지 않는다.
- 기본 검증 화면은 `1280×720`, `1920×1080`. 핵심 플레이는 키보드로 완주할 수 있어야 한다.
- 이번 계획 작성에서는 설치·Git 초기화·커밋·푸시·배포를 수행하지 않는다. 구현 중에도 사용자 파일을 삭제하는 스캐폴딩은 금지한다.

## Review Focus

다음 다섯 가지는 구현에서 놓치기 쉬운 실패 조건이며, [구현 체크리스트](2026-10-20-last-access-checklist.md)의 소유 작업 테스트에 포함한다.

1. 부모 폴더 잠금이 있는 자료를 원본 바로 열기 또는 액션 직접 호출로 접근: 본문·자식 목록·미발견 증거 제목을 노출하지 않는다. → T02·T06·T10.
2. JSON은 유효하지만 진행 관계가 모순인 저장: 미해결 잠금 안의 자료·증거, 잘못된 제출 참조를 거절하고 원본 바이트를 보존한다. → T08.
3. 메모 debounce 중 즉시 저장·새 게임·페이지 숨김 발생: 최신 메모를 저장하며 과거 타이머가 새 진행을 덮어쓰지 않는다. → T09.
4. 창을 끌던 중 화면 축소·포인터 해제: 닫기 버튼을 화면 안으로 보정하고 텍스트 선택·키보드 포커스를 보존한다. → T05·T10.
5. 필수 증거가 아닌 E08·E09 없이 정답 제출: 엔딩에 도달하며, 선택한 증거의 중복·초과 개수로 판정을 우회하지 못한다. → T03·T07·T10.

---

## 1. 상세 기술 스펙

### 1.1 확인된 출발점과 기술 선택

최초 계획 작성 전 작업 폴더에는 `CODEX_DEV_SPEC_Last_Access.md`만 있었고 앱 소스·package.json·lockfile은 없다. 상위 경로와 현재 폴더에서 적용 가능한 AGENTS.md는 발견되지 않았다. `git rev-parse --is-inside-work-tree`는 Git 저장소가 아니라고 반환했다.

로컬 확인값은 Node.js `v24.18.1`, npm `11.16.0`이다. Windows 명령 예시는 `npm.cmd`·`npx.cmd`를 사용한다. 기존 자료가 있는 루트에 생성기를 강제 실행하지 않고, Vite React TypeScript 템플릿의 필요한 파일만 추가한다.

| 항목 | 결정 | 확인/고정 방법 |
| --- | --- | --- |
| 런타임 | 현재 Node 24 환경에서 호환되는 안정 버전 | T01에서 패키지 engines와 공식 요구사항 확인, engines.node와 README에 지원 범위 기록 |
| 패키지 매니저 | npm | package-lock.json 커밋 대상, 실제 설치 버전은 packageManager·README에 기록 |
| 앱 상태 | React reducer + Context | 게임 상태·dispatch Context 분리, 앱 창 내부의 선택·스크롤은 로컬 상태 |
| 스타일 | 일반 CSS | 자체 아이콘·로컬 SVG, UI 프레임워크·드래그 라이브러리 추가 없음 |
| 테스트 | Vitest node 환경 + Playwright Chromium | 순수 함수는 단위 검사, 실제 포커스·화면·완주는 브라우저 검사 |
| 경로 | 단일 페이지, URL 라우터 없음 | 앱·파일 창 식별자는 내부 ID 사용 |
| 저장 | localStorage 단일 키 | 시작 시 검증, 중요한 변경 즉시 저장, 노트 300ms debounce |

계획 작성 시 공식 문서를 열어 확인했다. [Vite 가이드](https://vite.dev/guide/)의 Node 요구사항은 20.19+ 또는 22.12+이며 템플릿별 추가 조건은 설치 때 재확인한다. [React 공식 패턴](https://react.dev/learn/scaling-up-with-reducer-and-context)에 따라 reducer와 Context를 조합한다. [Vitest 가이드](https://vitest.dev/guide/)로 설치 호환성을, [Playwright Assertions](https://playwright.dev/docs/test-assertions)로 재시도 가능한 UI 검증 방식을 확인한다. 라이브러리의 정확한 버전은 아직 설치하지 않았으므로 확정하지 않는다.

### 1.2 파일 배치와 책임

아래 경로는 모두 신규 생성 예정이다. 원본 명세와 계획·체크리스트는 보존한다. 범용 플러그인 계층·이벤트 버스·서버 API는 만들지 않는다.

| 경로 | 책임 / 주 사용처 |
| --- | --- |
| `package.json`, `package-lock.json`, `index.html`, `tsconfig*.json`, `vite.config.ts`, `.gitignore` | 프로젝트 실행·타입 검사·단위 테스트 설정 |
| `playwright.config.ts` | Chromium, 로컬 webServer, 두 기준 해상도 프로젝트, 실패 trace·스크린샷 |
| `src/main.tsx`, `src/app/App.tsx` | 진입점, 시작 화면·게임 화면·엔딩 표시 |
| `src/app/GameProvider.tsx` | game reducer, 초기 로드, 저장 예약·상태 표시, 진행·dispatch Context |
| `src/app/ConfirmDialog.tsx` | 초기화·힌트 확인에 사용하는 접근 가능한 확인 대화상자 |
| `src/game/types.ts` | 원본 4.3절 타입, CaseContent·액션·결과 타입 |
| `src/game/rules.ts` | 접근 가능 여부, 비밀번호 정규화, 제출 완성·정답 판정 |
| `src/game/reducer.ts` | 초기 GameState 생성, 유효한 액션만 적용 |
| `src/game/content-validator.ts` | ID·부모·참조·표 열 수·도식 에셋 검사 |
| `src/content/last-access/{case,files,conversations,calendar,puzzles,evidence,solution}.ts` | 고정 콘텐츠와 모음 객체 `lastAccessCase` |
| `src/content/last-access/assets/{first-exhibition,annex-map}.svg` | 외부 요청 없는 포스터·안내도, 동등한 텍스트 제공 |
| `src/desktop/{types,window-state}.ts` | 창 상태와 순수 창 조작·경계 보정 함수 |
| `src/desktop/{Desktop,Taskbar,WindowFrame}.tsx` | 앱 실행, 창 정렬·드래그·최소화·최대화·복원 |
| `src/apps/{Explorer,Viewer,Messenger,Calendar,Notebook,Hints,Submit,Ending}.tsx` | 명세에 정의된 앱별 UI. Ending은 결과 화면 |
| `src/persistence/{schema-validation,save-adapter}.ts` | unknown 저장값 검증, 키 단위 읽기·쓰기·삭제, 실패 분류 |
| `src/styles/{base,desktop,apps}.css` | 공통 토큰·포커스·창·문서·표·앱 레이아웃 |
| `tests/unit/{content,rules,reducer,submission,window-state,viewer,save}.test.ts` | 게임 규칙·저장·창 경계·문서 렌더링·콘텐츠 회귀 |
| `tests/e2e/{start,desktop,investigation,submission,persistence,accessibility}.spec.ts` | 실제 브라우저 상호작용 검사 |
| `tests/e2e/helpers.ts` | UI로 파일 열기·증거 기록·정답 제출하는 공통 절차만 추출 |
| `README.md`, `docs/development.md`, `docs/walkthrough.spoilers.md` | 실행법·구조/검증 기록·스포일러 공략 분리 |

별도 콘텐츠 실행기 의존성을 추가하지 않는다. `check:content`는 `vitest run tests/unit/content.test.ts`로 콘텐츠 검증 테스트를 한 번 실행하고 종료한다.

### 1.3 데이터·상태·공개 인터페이스

`Condition`, `FileNode`, `FileContent`, `Evidence`, `Puzzle`, `GameState`, `SaveEnvelope`는 원본 4.3절을 그대로 출발점으로 사용한다. 원본의 예시 타입은 다음 항목만 구체화한다.

- `SourceRef = Evidence['source']`, `SourceKey = string`. 키 생성은 `sourceKey(source)` 한 곳에서 `file:F06`, `conversation:C02`, `calendar:CAL02` 형식으로 수행한다. `openedSourceIds`는 이 키를 저장한다.
- `HintTargetId = 'P01' | 'P02' | 'final'`. `hintLevels`는 세 대상의 공개 개수 0~3이다. `final`을 퍼즐 참조로 취급하지 않는다.
- `CaseContent`는 `id`, `version`, `referenceTime`, `files`, `conversations`, `calendar`, `puzzles`, `evidence`, `questions`, `hints`, `assets`를 보유한다. `id='last-access'`, `version=1`로 시작한다.
- `Question`은 `id`, `prompt`, `options: {id,label}[]`, `correctAnswerId`, `requiredEvidenceIds`를 가진다. 선택 개수는 `requiredEvidenceIds.length`에서 얻는다.
- `Puzzle`에 `targetId`를 추가해 P01→F03, P02→D04를 명시한다. D04의 `access`는 P02 해결 조건이고 해당 퍼즐 입력 UI는 접근 가능한 부모 D03에서 연다.
- `GameAction`은 `OPEN_SOURCE {source}`, `TRY_PUZZLE {puzzleId,input}`, `COLLECT_EVIDENCE {evidenceId}`, `UPDATE_NOTEBOOK {text}`, `REVEAL_HINT {targetId}`, `UPDATE_SUBMISSION {questionId,answerId,evidenceIds}`, `SUBMIT_SOLUTION`의 판별 유니온이다. 초안의 미선택 답은 빈 문자열로 표현한다.
- `createInitialState(content): GameState`는 빈 조사 상태를 만든다. `gameReducer(state, action, content): GameState`는 React·저장 API를 호출하지 않는다. Provider는 content를 고정한 reducer를 사용한다.
- `normalizePuzzleInput(input, normalization): string | null`, `canOpenSource(state, source, content): boolean`, `canAttemptPuzzle(state, puzzleId, content): boolean`, `canCollectEvidence(state, evidenceId, content): boolean`을 UI와 reducer가 공유한다.
- `validateSubmission(state, content): {status:'incomplete',questionId:string} | {status:'incorrect'} | {status:'correct'}`. 불완전 입력의 첫 위치를 안내하고 정답 여부를 실시간 노출하지 않는다.
- `validateContent(content): string[]`는 오류별 ID와 경로를 반환한다. 개발 진입점에서는 오류가 있으면 화면 진입 대신 오류를 알리고, 테스트에서는 빈 배열을 기대한다.

UI는 클릭·선택 시 액션을 dispatch한다. 순수 규칙 검사로 사용자 메시지를 정하고, reducer에서도 같은 검사를 수행해 잘못된 액션을 무시한다. 퍼즐 오답 메시지는 해당 앱의 일시 상태이며 저장하지 않는다. 불완전 제출은 시도 횟수를 늘리지 않는다. 완성된 제출은 `submissionAttempts + 1`, 정답일 때만 phase를 `solved`로 바꾼다. solved 이후에는 제출 결과를 읽기 전용으로 표시하고 `UPDATE_SUBMISSION`·`SUBMIT_SOLUTION`을 무시한다. 따라서 계속 조사 중에도 성공한 답·근거가 유지되어 저장 검증과 충돌하지 않는다. 자료 조사·추가 증거 수집·메모 편집·힌트 공개는 계속 허용한다.

### 1.4 접근·퍼즐·증거 규칙

1. 폴더 열람은 자기 및 모든 조상의 access를 확인한다. 파일 본문은 이 검사와 파일 자체 puzzleId 해결을 모두 만족해야 한다.
2. 잠긴 F03과 D04의 이름은 표시한다. F03 본문과 D04 자식 목록·파일 이름·증거 요약은 렌더링하지 않는다. 숨긴 DOM이나 title/aria-label에도 내용을 넣지 않는다.
3. D04의 퍼즐 입력 가능 여부는 대상 자체 잠금 대신 부모 접근으로 검사한다. P01 해결을 P02의 선행 조건으로 넣지 않는다.
4. `OPEN_SOURCE`는 본문/대화/일정이 표시된 뒤 기록한다. 파일은 본문 mount, 대화는 선택 후 내용 표시, 일정은 상세를 연 시점이다. 렌더 중 dispatch하지 않는다.
5. `COLLECT_EVIDENCE`는 해당 sourceKey가 열람 목록에 있고 현재 본문 접근도 가능해야 한다. 증거 목록에는 수집한 항목만 보이며 원본 다시 열기도 공통 접근 검사를 거친다.
6. 반복 열기·수집·퍼즐 해제는 집합처럼 동작한다. F03은 증거 매핑이 없으므로 존재하지 않는 증거를 만들어 테스트하지 않고 잠금 전 열람 거절과 수집 액션 무효를 검사한다.

| 퍼즐 | 정규화 | 허용/성공 예 | 실패 예 |
| --- | --- | --- | --- |
| P01 | NFKC → trim → ASCII 숫자 4자리 검사 | `0417`, `０４１７`, ` 0417 ` | `417`, `04/17`, `04 17`, 숫자 외 입력 |
| P02 | NFKC → trim → ASCII a-z만 대문자 변환 → ASCII 영문 코드+숫자 2자리 검사 | `TEAL04`, ` teal04 ` | `TEAL 04`, `TEAL-04`, 비ASCII 문자, 다른 코드 |

정규화된 문자열을 정답과 비교한다. 구두점·내부 공백을 지워 오답을 정답으로 바꾸지 않는다. 오답 횟수 제한·대기시간·진행 초기화는 없다.

### 1.5 사건 콘텐츠·최종 판정

자료 본문은 원본 5.4절, 대화·일정은 같은 절, 힌트는 5.5절을 구현 데이터에 옮긴다. F01~F14 14개, 폴더 ROOT/D01~D04 5개, 대화 C01/C02 2개, 일정 CAL01~CAL03 3개, 퍼즐 P01/P02 2개, 증거 E01~E09 9개, 질문 Q01~Q03 3개다.

| 질문 | 정답 ID | 정확한 증거 집합 | 필요 개수 |
| --- | --- | --- | --- |
| Q01 | `A_LOCATION_ARCHIVE` | E01(C02), E02(F06) | 2 |
| Q02 | `A_ACTOR_DOHYEON` | E03(F10), E04(F11) | 2 |
| Q03 | `A_METHOD_INFLATE` | E05(F08), E06(F09), E07(F07) | 3 |

- 오답 선택지는 원본 5.6절을 사용한다. 같은 질문 안에서 ID가 유일하고, 모든 선택지 ID도 전체 콘텐츠에서 중복되지 않게 한다.
- 선택 증거는 중복 없는 정확한 개수, 모두 수집한 증거여야 한다. 순서를 무시한 집합 비교로 판정한다. 답 ID만 맞거나 증거만 맞으면 실패한다.
- 한 증거를 다른 질문에서 재사용하는 것은 허용한다. 질문별 할당량을 넘으면 추가 선택을 막고 현재 개수를 알린다.
- E08/F13·E09/F14는 보조 자료다. P01 해결 여부·모든 자료 열람 여부·힌트 사용 여부도 정답 제출 조건으로 추가하지 않는다.
- 엔딩은 장소, 한도현의 실제 작업, 설치비 800,000→1,800,000원 변경, 예약 메시지의 의미를 설명한다. 미수집 보조 증거는 조사 노트에 자동 추가하지 않는다. 엔딩에서 연결하는 원본도 일반 접근 규칙을 적용한다.
- 18:55 수령증 F12를 18:40 알리바이로 설명하지 않는다. 실제 작업자 근거는 F10/F11이다.
- `계속 조사`는 solved 진행을 유지하고 결과 화면만 닫는다. `처음부터`는 확인 후 새로운 GameState로 교체한다.

콘텐츠 검증은 참조의 구조적 정확성을 담당한다. 이야기의 도달 가능성은 규칙을 통해 초기 상태부터 실행하는 별도 완주 테스트로 증명한다. P01의 대체 출처 C01/F02/CAL01, P02의 CAL02 또는 F04+F05, 그리고 P01 생략 경로를 각각 검사한다.

### 1.6 창·앱·접근성

`DesktopState`는 `windows: WindowState[]`, `activeWindowId: string | null`을 가진다. `WindowState`는 `id`, `appId`, 선택적 `source`, `bounds`, `restoreBounds`, `minimized`, `maximized`를 가진다. 배열의 마지막 창이 최상단이고 활성화 시 끝으로 옮긴다. 앱 ID 또는 `sourceKey`로 중복 실행을 합친다.

`openWindow(desktop, request, workArea)`, `focusWindow(desktop,id)`, `minimizeWindow(desktop,id)`, `toggleMaximizeWindow(desktop,id,workArea)`, `closeWindow(desktop,id)`, `clampBounds(bounds,workArea)`는 새 DesktopState/Bounds를 반환한다. 이동은 `moveWindow(desktop,id,x,y,workArea)`가 처리한다. 기본 앱 크기는 탐색기 680×460, 문서 640×480, 나머지 앱 720×500이며 실제 작업영역을 초과하면 축소한다. 작업표시줄 높이 44px을 작업영역에서 제외한다.

- Pointer Events와 pointer capture로 타이틀바 드래그를 처리하고 pointercancel도 종료 처리한다. 타이틀바 버튼에서 시작한 이벤트는 드래그하지 않는다.
- 최소화는 창 컴포넌트를 보존하고 화면과 탭 순서에서 제외한다. 닫기는 창만 제거하며 GameState를 변경하지 않는다.
- 문서 창은 서로 다른 파일을 동시에 표시한다. 원본 다시 열기는 해당 파일 창, 대화 상대, 일정 항목을 정확히 선택한다.
- 뒤로 이동은 탐색기 내부 이력으로 처리한다. 잠긴 폴더에 진입하기 전 비밀번호 UI를 표시한다.
- 문서 본문은 텍스트·시맨틱 table·로컬 SVG+대체 텍스트로 렌더링한다. 원본 문자열을 HTML로 삽입하지 않는다.
- `Viewer.tsx`의 `DocumentContent({ content }: { content: FileContent })`는 본문 렌더링만 담당하고 Context·접근 제어를 참조하지 않는다. Viewer가 접근을 검사한 뒤 이 컴포넌트를 호출한다. M1에서는 `react-dom/server`의 `renderToStaticMarkup`으로 테스트 fixture의 텍스트·표·도식을 검사하고, 실제 F08의 UI 열람은 T06에서 확인한다. 테스트용 자료나 우회 경로는 플레이 화면에 추가하지 않는다.
- 일정 3건, 대화 2개는 기록으로 표시한다. 메신저 입력창·현재 온라인 표시를 만들지 않는다.
- 노트는 최대 20,000자이며 UI와 reducer·저장 검증에서 동일 한도를 적용한다. UTF-16 문자열 length 기준으로 계산하고 화면에 사용량을 표시한다.
- 모달은 네이티브 dialog 기반으로 초점을 진입시키고 Esc/취소 및 닫힌 뒤 실행 버튼으로 복귀시킨다. 일반 창은 모달처럼 초점을 가두지 않는다.
- 앱 실행은 button, 잠금/저장 상태는 아이콘+텍스트, 오류는 live region으로 전달한다. 본문 기본 16px, 한국어 시스템 폰트, 남색/회색+청록으로 구성한다.
- 창 전체가 화면 안에 들어오도록 위치·크기를 보정한다. 내용은 스크롤하고 최대화와 작업표시줄로 드래그 없이 접근 가능하게 한다.

### 1.7 저장·복원·실패 처리

키는 `last-access:save:v1`. `SaveEnvelope`는 `schemaVersion:1`, ISO `savedAt`, `game`을 가진다. GameState만 저장하며 창 배치·앱 선택·포커스는 새 세션 기본값으로 돌아간다.

공개 계약:

```ts
type LoadResult =
  | { status: 'empty' }
  | { status: 'valid'; envelope: SaveEnvelope }
  | { status: 'invalid'; reason: string }
  | { status: 'unavailable'; reason: string };
type WriteResult = { ok: true } | { ok: false; reason: string; conflict?: true };
// 위 타입과 아래 함수는 save-adapter.ts에서 export한다.
declare function loadSave(content: CaseContent): LoadResult;
declare function writeSave(state: GameState, content: CaseContent): WriteResult;
declare function deleteSave(): WriteResult;
declare function subscribeSaveChanges(onChange: () => void): () => void;
// schema-validation.ts: 파싱된 unknown을 구조·참조·진행 관계로 검증한다.
declare function validateSave(value: unknown, content: CaseContent):
  { ok: true; envelope: SaveEnvelope } | { ok: false; reason: string };
```

어댑터 함수가 localStorage 접근과 예외 처리를 독점한다. 테스트는 어댑터의 브라우저 저장소 경계를 stub으로 대체한다. 실제 Storage 객체 획득 자체가 실패하는 경우도 catch 범위에 넣는다. 저장 시각은 어댑터에서 생성한다.

2026-10-20 리뷰 수정: 어댑터는 각 탭에서 마지막으로 읽거나 쓴 원문을 기억하고 쓰기·삭제 직전 현재 값과 비교한다. 변경됐다면 `conflict: true`로 원본을 보존한다. Provider는 해당 게임 키의 외부 변경을 구독해 타이머·자동 저장·재시도·초기화를 중지하고 메모리 진행을 유지한다. 사용자가 메모를 복사한 뒤 다시 불러오도록 안내한다. 시작 화면의 이어하기도 실행 직전에 최신 저장을 검증한다. 변경 없는 상태는 pagehide 등에서 다시 쓰지 않는다. 저장 키·스키마는 유지한다. 이 정책은 오래된 탭의 덮어쓰기를 방지하는 검사이며, localStorage 비교·쓰기를 원자적 트랜잭션으로 만들거나 동시 편집을 병합하지는 않는다.

| 상황 | 처리 |
| --- | --- |
| 저장 없음 | 새 게임 제공. 자동 저장은 명시적으로 게임을 시작한 뒤 활성화 |
| 정상 저장 | 이어하기 제공. 사용자가 선택한 뒤 복원하고 기본 바탕화면 표시 |
| 손상 JSON·스키마/사건 버전 불일치 | `저장 데이터를 불러올 수 없어`. 자동 저장 중지, 원본 보존. 확인한 초기화만 허용 |
| 읽기 접근 불가 | 저장소 사용 불가 안내, 메모리 플레이 허용, 저장 불가 상태 유지 |
| 쓰기 용량 초과·차단 | 메모리 진행 유지, 지속적인 저장 실패 안내, 재시도 버튼 제공 |
| 초기화 삭제 실패 | 실패 안내와 기존 진행 보존. 성공한 것처럼 시작 화면을 교체하지 않음 |
| 새 게임 확인 취소 | 메모리 상태·저장 모두 보존 |

검증 순서는 unknown 객체/배열 구조 → 필드 타입/길이/허용 값 → 사건 ID/버전 → 참조 ID/중복 → 진행 관계다. 배열 항목 수는 각 콘텐츠의 가능한 항목 수, 힌트 0~3, 시도 횟수는 0 이상의 안전한 정수로 제한한다. `savedAt`은 ISO 시각으로 검증한다.

진행 관계 검증은 해결된 퍼즐을 반영한 상태에서 열린 모든 자료가 접근 가능하고, 수집 증거의 원본이 열린 목록에 있으며, 초안의 답이 해당 질문의 선택지이고 증거가 수집 목록에 포함되는지 검사한다. 초안은 미완성 상태를 허용하되 최대 개수·중복은 거절한다. solved 상태는 최종 제출이 correct이며 제출 횟수가 1 이상인지 확인한다. 조사 중 초안이 정답인 것은 아직 제출하지 않은 정상 상태로 허용한다. 이벤트 발생 순서 자체를 저장 로그로 증명하려 하지는 않는다.

저장 시점은 다음과 같이 고정한다.

- 퍼즐 해결·증거 수집·힌트 공개·제출 초안 변경·완성된 제출·자료 열람 변경은 최신 상태를 즉시 저장한다.
- 메모 입력은 상태를 즉시 갱신하고 저장만 300ms 지연한다. blur, document hidden, pagehide에서 최신 상태를 flush한다.
- Provider가 최신 상태 ref와 타이머 하나를 관리한다. 즉시 저장 시 기존 타이머를 취소하고 최신 메모까지 함께 저장한다. 초기화 시 타이머를 취소해 이전 게임의 저장이 재발하지 않게 한다.
- 표시 상태는 `saved | pending | error`다. 실패 후에는 변경 이벤트가 없어도 error를 유지하고 재시도 성공 후에만 saved로 바꾼다. 로드되지 않은 손상 저장에는 flush도 쓰지 않는다.
- 모듈 평가 시 저장하지 않는다. React 개발 모드 재실행도 손상 저장을 덮어쓰지 않아야 한다.

### 1.8 검증 명령과 완료 정의

| 명령 | 예정 script / 합격 조건 |
| --- | --- |
| `npm.cmd run dev` | `vite --host 127.0.0.1`, 시작 화면 접근 가능 |
| `npm.cmd run typecheck` | `tsc -b --pretty false`, 종료 코드 0 |
| `npm.cmd run check:content` | `vitest run tests/unit/content.test.ts`, 콘텐츠 참조·사실·경로 검사 통과 |
| `npm.cmd run test:unit` | `vitest run tests/unit`, watch 없이 종료 코드 0 |
| `npm.cmd run test:e2e` | `playwright test`, 두 기준 해상도 프로젝트 통과 |
| `npm.cmd run build` | `tsc -b && vite build`, 정적 dist 생성 |
| `npm.cmd run preview -- --host 127.0.0.1` | `vite preview`, 빌드 산출물에서 시작·자료 열람 확인 |

처음 설치는 `npm.cmd install`, 이후 재현은 `npm.cmd ci`. 브라우저 준비는 `npx.cmd playwright install chromium`. 테스트의 webServer는 로컬 dev 서버를 사용하고, 최종 단계에서 preview 산출물도 별도 확인한다. 테스트는 role/name 중심 locator와 재시도 assertion을 사용하며 고정 sleep을 넣지 않는다. 전체 Chromium 검사 통과를 Firefox·Safari까지의 검증으로 표현하지 않는다.

---

## 2. 문서 분리 후 검토·수정 기록

문서 작성 후 원본 명세의 접근·판정·저장·마일스톤·검증 요구사항과 두 문서를 다시 대조했다. 다음 문제를 수정했다.

| 발견 사항 | 수정 내용 | 연결 작업 |
| --- | --- | --- |
| 기술 스펙과 실행 체크박스가 한 파일에 혼재 | 기존 경로는 기술 계획으로 유지하고 작업·최종 인수표를 별도 체크리스트로 이동. 양방향 상대 링크 추가 | 전체 |
| M1의 표 렌더링 검증을 M2 작업으로 미뤄 마일스톤 완료가 불명확 | M1에서 독립 본문 렌더러를 기존 react-dom/server로 검사. 실제 잠긴 F08 UI 검사는 T06에서 추가 수행 | T05/T06 |
| solved 이후 초안 수정이 가능하면 성공 상태의 저장 검증에서 거절될 수 있음 | 클리어 후 제출 결과와 제출 액션은 고정하고 조사·메모는 허용. 클리어 후 메모 변경·저장·복원 회귀 검사 추가 | T03/T07/T08/T09 |
| 작성 시점의 폴더 상태가 현재 상태처럼 서술됨 | 최초 계획 작성 전의 관찰임을 명시하고 현재 문서 2개와 구분 | 1.1절 |

검토 결과, 원본의 P01 생략 경로, E08·E09 선택 수집, 정확한 증거 집합 판정, 손상 저장 보존은 유지했다. 구현하지 않은 앱과 테스트는 완료로 표시하지 않았다.

### 원본 요구사항 대응과 검증 범위

- 원본 1~3절 → UI·콘텐츠·접근성 스펙과 T05~T10, 4절 → 타입·모듈·T01~T03, 5절 → T04/T06/T07, 6절 → T08/T09, 7절 → T02/T04/T08, 8~10절 → 마일스톤·최종 인수표·T10에 대응한다.
- 원본 11절의 즉시 구현 프롬프트는 이번 계획 작성 범위에 실행하지 않았다. 12절 확장 후보는 MVP 밖으로 유지한다.
- 인터페이스 이름·저장 키·ID·단서 관계를 계획과 체크리스트 사이에서 통일했다. 규칙·스키마의 검증은 구현 후 테스트로 확인할 대상이다.
- 실제 수행한 검토: 개발 명세 전체 읽기, 현재 파일/지침 확인, Node/npm/Git 상태 확인, 관련 공식 문서 확인, 요구사항과 작업 매핑 검토.
- 수행하지 않은 작업: 앱 생성, 의존성 설치, 게임 구현, 자동 테스트 실행, 브라우저 플레이, 커밋·푸시·배포.
