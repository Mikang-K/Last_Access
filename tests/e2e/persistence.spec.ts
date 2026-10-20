import { expect, test, type Page } from '@playwright/test';
import { collectRequired, fillCorrectReport, openApp, openFile, unlockBackup } from './helpers';
import { lastAccessCase } from '../../src/content/last-access';

const key = 'last-access:save:v1';
async function start(page: Page) { await page.goto('/'); await page.getByRole('button', { name: '새 게임', exact: true }).click(); }
const app = openApp;
async function game(page: Page) { return page.evaluate(saveKey => JSON.parse(localStorage.getItem(saveKey) ?? '{}').game, key); }
async function resume(page: Page) { await page.reload(); await page.getByRole('button', { name: '이어하기', exact: true }).click(); }
async function stopClock(page: Page) { await page.clock.install({ time: new Date('2026-10-20T00:00:00Z') }); await page.clock.pauseAt(new Date('2026-10-20T00:00:01Z')); }

test('시작 화면을 오래 열어 둔 탭도 이어하기 시 최신 저장을 읽는다', async ({ page, context }) => {
  await start(page);
  const other = await context.newPage();
  await other.addInitScript(() => window.addEventListener('storage', event => event.stopImmediatePropagation(), true));
  await other.goto('/');
  const note = (await app(page, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' });
  await note.fill('다른 탭을 연 뒤 저장한 최신 메모');
  await note.press('Tab');
  await page.goto('about:blank');
  await other.getByRole('button', { name: '이어하기', exact: true }).click();
  await expect((await app(other, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('다른 탭을 연 뒤 저장한 최신 메모');
  await other.goto('about:blank');
  await page.goto('/');
  expect((await game(page)).notebookText).toBe('다른 탭을 연 뒤 저장한 최신 메모');
});

test('다른 탭의 저장 변경은 이전 탭의 타이머·재시도·초기화를 막고 메모리를 보존한다', async ({ page, context }) => {
  await start(page);
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('button', { name: '이어하기', exact: true }).click();
  await stopClock(other);
  const pending = (await app(other, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' });
  await pending.fill('이전 탭의 아직 저장하지 않은 메모');
  const latest = (await app(page, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' });
  await latest.fill('보존해야 하는 최신 저장');
  await latest.press('Tab');
  await expect(other.getByRole('alert')).toContainText('다른 탭에서 저장이 변경');
  await expect(pending).toHaveValue('이전 탭의 아직 저장하지 않은 메모');
  await expect(other.getByRole('button', { name: '새 게임', exact: true })).toBeDisabled();
  await expect(other.getByRole('button', { name: '저장 재시도', exact: true })).toHaveCount(0);
  await other.clock.runFor(500);
  await other.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect((await game(page)).notebookText).toBe('보존해야 하는 최신 저장');
  await other.getByRole('button', { name: '저장 다시 불러오기', exact: true }).click();
  await other.getByRole('button', { name: '이어하기', exact: true }).click();
  await expect((await app(other, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('보존해야 하는 최신 저장');
});

test('메모 debounce와 blur·pagehide·페이지 숨김은 최신 문자열을 저장한다', async ({ page }) => {
  await stopClock(page);
  await start(page);
  const notebook = await app(page, '조사 노트');
  const note = notebook.getByRole('textbox', { name: '나의 추리 메모' });
  await note.fill('300ms 뒤 최신 메모');
  expect((await game(page)).notebookText).toBe('');
  await page.clock.runFor(299);
  expect((await game(page)).notebookText).toBe('');
  await page.clock.runFor(1);
  await expect.poll(async () => (await game(page)).notebookText).toBe('300ms 뒤 최신 메모');
  await note.fill('blur 최신 메모');
  await note.press('Tab');
  expect((await game(page)).notebookText).toBe('blur 최신 메모');
  await note.fill('pagehide 최신 메모');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect((await game(page)).notebookText).toBe('pagehide 최신 메모');
  await note.fill('숨김 최신 메모');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  expect((await game(page)).notebookText).toBe('숨김 최신 메모');
  await resume(page);
  const restored = await app(page, '조사 노트');
  await expect(restored.getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('숨김 최신 메모');
  await restored.getByRole('textbox', { name: '나의 추리 메모' }).fill('증거 기록 직전 최신 메모');
  const map = await openFile(page, 'F06');
  await map.getByRole('button', { name: /^증거 기록/ }).click();
  expect((await game(page)).notebookText).toBe('증거 기록 직전 최신 메모');
  expect((await game(page)).collectedEvidenceIds).toContain('E02');
  await page.clock.runFor(300);
  expect((await game(page)).notebookText).toBe('증거 기록 직전 최신 메모');
});

test('HTML 형태 메모가 저장·복원 후에도 일반 텍스트이며 새 게임 뒤 이전 타이머가 되살리지 않는다', async ({ page }) => {
  await stopClock(page);
  await start(page);
  const notebook = await app(page, '조사 노트');
  const text = '<img src=x onerror="document.body.dataset.injection=1"><script>alert(1)</script>';
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).fill(text);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await resume(page);
  const restored = await app(page, '조사 노트');
  await expect(restored.getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue(text);
  expect(await page.locator('body').getAttribute('data-injection')).toBeNull();
  await restored.getByRole('textbox', { name: '나의 추리 메모' }).fill('새 게임으로 가져가면 안 되는 메모');
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await page.getByRole('dialog', { name: '처음부터 시작할까요?' }).getByRole('button', { name: '초기화하고 시작', exact: true }).click();
  await page.clock.runFor(500);
  expect((await game(page)).notebookText).toBe('');
  await resume(page);
  await expect((await app(page, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('');
});

test('손상 저장은 취소 시 바이트 그대로 보존하고 확인한 키만 초기화한다', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(saveKey => { localStorage.setItem(saveKey, '{broken original'); localStorage.setItem('unrelated-save', 'preserve'); }, key);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('저장 데이터를 불러올 수 없어');
  const reset = page.getByRole('button', { name: '초기화하고 시작', exact: true });
  await reset.click();
  await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
  expect(await page.evaluate(saveKey => localStorage.getItem(saveKey), key)).toBe('{broken original');
  await reset.click();
  await page.getByRole('dialog').getByRole('button', { name: '초기화하고 시작', exact: true }).click();
  await expect(page.getByRole('main', { name: '서윤의 컴퓨터' })).toBeVisible();
  expect((await game(page)).phase).toBe('investigating');
  expect(await page.evaluate(() => localStorage.getItem('unrelated-save'))).toBe('preserve');
});

test('쓰기 실패는 메모리 진행과 오류를 유지하고 재시도 성공 후 저장됨으로 바뀐다', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('blocked', 'QuotaExceededError'); };
    window.addEventListener('restore-write', () => { Storage.prototype.setItem = original; }, { once: true });
  });
  const notebook = await app(page, '조사 노트');
  const note = notebook.getByRole('textbox', { name: '나의 추리 메모' });
  await note.fill('저장 실패해도 메모리는 유지');
  await note.press('Tab');
  await expect(page.getByText('현재 진행을 저장할 수 없어. 창을 닫으면 진행이 사라질 수 있어.', { exact: true })).toBeVisible();
  await expect(note).toHaveValue('저장 실패해도 메모리는 유지');
  expect((await game(page)).notebookText).toBe('');
  await page.evaluate(() => window.dispatchEvent(new Event('restore-write')));
  await expect(page.getByRole('button', { name: '저장 재시도' })).toBeVisible();
  await page.getByRole('button', { name: '저장 재시도' }).click();
  await expect(page.getByText('진행 저장됨', { exact: true })).toBeVisible();
  expect((await game(page)).notebookText).toBe('저장 실패해도 메모리는 유지');
});

test('초기화 삭제 실패는 기존 메모·저장과 조사 화면을 보존한다', async ({ page }) => {
  await start(page);
  const notebook = await app(page, '조사 노트');
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).fill('삭제 실패 시 보존할 메모');
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).press('Tab');
  const before = await page.evaluate(saveKey => localStorage.getItem(saveKey), key);
  await page.evaluate(() => { Storage.prototype.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); }; });
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '초기화하고 시작', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText('기존 진행을 유지');
  expect(await page.evaluate(saveKey => localStorage.getItem(saveKey), key)).toBe(before);
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(notebook.getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('삭제 실패 시 보존할 메모');
});

test('저장소 getter 차단에도 메모리에서 플레이할 수 있다', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('현재 진행을 저장할 수 없어');
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  const notebook = await app(page, '조사 노트');
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).fill('메모리 플레이');
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).press('Tab');
  await expect(notebook.getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('메모리 플레이');
  await expect(page.getByRole('button', { name: '저장 재시도' })).toBeVisible();
});

test('힌트 단계와 노트가 복원되고 창 배치는 기본으로 돌아온다', async ({ page }) => {
  await start(page);
  const hints = await app(page, '힌트');
  for (let level = 1; level <= 3; level++) {
    await hints.getByRole('button', { name: `다음 힌트 열기 (${level}/3)`, exact: true }).click();
    await page.getByRole('dialog', { name: '힌트를 공개할까요?' }).getByRole('button', { name: '힌트 공개', exact: true }).click();
  }
  await expect(hints.getByRole('button', { name: '모든 힌트를 확인했어요' })).toBeDisabled();
  await hints.getByRole('button', { name: '진상 제출', exact: true }).click();
  await hints.getByRole('button', { name: '다음 힌트 열기 (1/3)', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '힌트 공개', exact: true }).click();
  expect((await game(page)).hintLevels).toMatchObject({ P01: 3, final: 1 });
  await resume(page);
  await expect(page.getByRole('region', { name: '힌트', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: '먼저 읽어줘.txt', exact: true })).toBeVisible();
  const restored = await app(page, '힌트');
  await expect(restored.getByRole('button', { name: '모든 힌트를 확인했어요' })).toBeDisabled();
  await restored.getByRole('button', { name: '진상 제출', exact: true }).click();
  await expect(restored.getByRole('button', { name: '다음 힌트 열기 (2/3)', exact: true })).toBeVisible();
});

test('두 잠금 직후·정답 초안·클리어 뒤 계속 조사한 최신 메모를 순차 복원한다', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page);
  const personal = await openFile(page, 'F03');
  await personal.getByRole('textbox').fill('0417');
  await personal.getByRole('button', { name: '잠금 해제', exact: true }).click();
  await expect(personal).toContainText('프로젝트 영문 코드');
  await resume(page);
  await expect(await openFile(page, 'F03')).toContainText('프로젝트 영문 코드');
  expect((await game(page)).solvedPuzzleIds).toEqual(['P01']);
  await unlockBackup(page);
  await resume(page);
  const original = await openFile(page, 'F08');
  await expect(original.getByRole('table')).toContainText('800,000');
  expect((await game(page)).solvedPuzzleIds).toEqual(['P01', 'P02']);
  await collectRequired(page);
  await fillCorrectReport(page);
  await resume(page);
  const submit = await openApp(page, '진상 제출');
  for (const question of lastAccessCase.questions) {
    const group = submit.getByRole('group', { name: new RegExp(question.prompt.replace(/[?]/g, '\\?')) });
    const answer = question.options.find(option => option.id === question.correctAnswerId)!;
    await expect(group.getByRole('radio', { name: answer.label, exact: true })).toBeChecked();
    for (const id of question.requiredEvidenceIds) await expect(group.getByRole('checkbox', { name: lastAccessCase.evidence.find(item => item.id === id)!.title, exact: true })).toBeChecked();
  }
  await submit.getByRole('button', { name: '답과 근거 제출하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: /끊어진 접속.*이어진 진실/ })).toBeVisible();
  await page.getByRole('button', { name: '계속 조사', exact: true }).click();
  const notebook = await openApp(page, '조사 노트');
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).fill('사건 해결 후에도 유지되는 최신 조사 메모');
  await notebook.getByRole('textbox', { name: '나의 추리 메모' }).press('Tab');
  await resume(page);
  await expect(page.getByRole('heading', { name: /끊어진 접속.*이어진 진실/ })).toBeVisible();
  await page.getByRole('button', { name: '계속 조사', exact: true }).click();
  await expect((await openApp(page, '조사 노트')).getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('사건 해결 후에도 유지되는 최신 조사 메모');
  const solved = await openApp(page, '진상 제출');
  await expect(solved.getByText('✓ 사건 해결', { exact: true })).toBeVisible();
  await expect(solved.getByRole('radio', { checked: true })).toHaveCount(3);
  await expect(solved.getByRole('checkbox', { checked: true })).toHaveCount(7);
  for (const input of await solved.getByRole('radio').all()) await expect(input).toBeDisabled();
  expect((await game(page)).phase).toBe('solved');
});
