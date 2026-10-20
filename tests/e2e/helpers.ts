import { expect, type Page } from '@playwright/test';
import { lastAccessCase } from '../../src/content/last-access';

export async function showDesktop(page: Page) {
  for (const button of (await page.getByRole('button', { name: / 최소화$/ }).all()).reverse()) {
    if (await button.isVisible()) await button.click();
  }
}
export async function openApp(page: Page, name: string) {
  await showDesktop(page);
  await page.getByRole('navigation', { name: '바탕화면 앱' }).getByRole('button', { name, exact: true }).click();
  return page.getByRole('region', { name, exact: true });
}
export async function folder(page: Page, name: string) {
  const explorer = await openApp(page, '파일 탐색기');
  const back = explorer.getByRole('button', { name: '← 뒤로', exact: true });
  while (await back.isEnabled()) await back.click();
  if (name !== 'ROOT') {
    if (name === '백업') await explorer.getByRole('button', { name: '전시', exact: false }).click();
    await explorer.getByRole('button', { name, exact: false }).click();
  }
  return explorer;
}
export async function openFile(page: Page, id: string) {
  const file = lastAccessCase.files.find(item => item.id === id);
  if (!file) throw new Error(`자료 없음: ${id}`);
  const parents: Record<string, string> = { D01: '바탕화면', D02: '사진', D03: '전시', D04: '백업' };
  const explorer = await folder(page, parents[file.parentId ?? ''] ?? 'ROOT');
  await explorer.getByRole('button', { name: file.name, exact: false }).click();
  return page.getByRole('region', { name: file.name, exact: true });
}
export async function unlockBackup(page: Page, input = ' teal04 ') {
  const explorer = await folder(page, '백업');
  await explorer.getByRole('textbox').fill(input);
  await explorer.getByRole('button', { name: '잠금 해제', exact: true }).click();
  await expect(explorer.getByRole('button', { name: '백업 폴더 열기', exact: true })).toBeVisible();
  await explorer.getByRole('button', { name: '백업 폴더 열기', exact: true }).click();
}
export async function collectRequired(page: Page) {
  const messenger = await openApp(page, '메신저');
  await messenger.getByRole('button', { name: /민지와 서윤/ }).click();
  await messenger.getByRole('button', { name: /^증거 기록/ }).click();
  for (const id of ['F06', 'F10', 'F11', 'F08', 'F09', 'F07']) {
    const viewer = await openFile(page, id);
    await viewer.getByRole('button', { name: /^증거 기록/ }).click();
  }
}
export async function fillCorrectReport(page: Page) {
  const submit = await openApp(page, '진상 제출');
  for (const question of lastAccessCase.questions) {
    const group = submit.getByRole('group', { name: new RegExp(question.prompt.replace(/[?]/g, '\\?')) });
    const option = question.options.find(item => item.id === question.correctAnswerId)!;
    await group.getByRole('radio', { name: option.label, exact: true }).check();
    for (const id of question.requiredEvidenceIds) {
      await group.getByRole('checkbox', { name: lastAccessCase.evidence.find(item => item.id === id)!.title, exact: true }).check();
    }
  }
  return submit;
}
