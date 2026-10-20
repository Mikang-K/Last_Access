import { expect, test, type Locator, type Page } from '@playwright/test';
import { lastAccessCase } from '../../src/content/last-access';

async function keyboard(button: Locator) { await button.focus(); await button.press('Enter'); }
async function keyboardApp(page: Page, name: string) {
  await keyboard(page.getByRole('navigation', { name: '바탕화면 앱' }).getByRole('button', { name, exact: true }));
  return page.getByRole('region', { name, exact: true });
}
async function keyboardFolder(page: Page, name: string) {
  const explorer = await keyboardApp(page, '파일 탐색기');
  const back = explorer.getByRole('button', { name: '← 뒤로', exact: true });
  while (await back.isEnabled()) await keyboard(back);
  if (name === '백업') await keyboard(explorer.getByRole('button', { name: '전시', exact: false }));
  await keyboard(explorer.getByRole('button', { name, exact: false }));
  return explorer;
}
async function keyboardFile(page: Page, id: string) {
  const file = lastAccessCase.files.find(item => item.id === id)!;
  const explorer = await keyboardFolder(page, file.parentId === 'D04' ? '백업' : '전시');
  await keyboard(explorer.getByRole('button', { name: file.name, exact: false }));
  return page.getByRole('region', { name: file.name, exact: true });
}

test('키보드로 앱·힌트·확인창을 조작하고 취소 후 초점이 복귀한다', async ({ page }) => {
  await page.goto('/');
  await keyboard(page.getByRole('button', { name: '새 게임', exact: true }));
  await keyboard(page.getByRole('navigation', { name: '바탕화면 앱' }).getByRole('button', { name: '힌트', exact: true }));
  const hints = page.getByRole('region', { name: '힌트', exact: true });
  const reveal = hints.getByRole('button', { name: '다음 힌트 열기 (1/3)', exact: true });
  await keyboard(reveal);
  const dialog = page.getByRole('dialog', { name: '힌트를 공개할까요?' });
  const cancel = dialog.getByRole('button', { name: '취소', exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: '힌트 공개', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(reveal).toBeFocused();
  await keyboard(reveal);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(hints.getByRole('button', { name: '다음 힌트 열기 (2/3)' })).toBeVisible();
  await keyboard(page.getByRole('button', { name: '새 게임', exact: true }));
  const reset = page.getByRole('dialog', { name: '처음부터 시작할까요?' });
  await expect(reset.getByRole('button', { name: '취소', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '새 게임', exact: true })).toBeFocused();
});

test('최종 제출의 미완성 입력에 초점 안내와 발견 증거 비노출을 제공한다', async ({ page }) => {
  await page.goto('/');
  await keyboard(page.getByRole('button', { name: '새 게임', exact: true }));
  await keyboard(page.getByRole('navigation', { name: '바탕화면 앱' }).getByRole('button', { name: '진상 제출', exact: true }));
  const submit = page.getByRole('region', { name: '진상 제출', exact: true });
  await keyboard(submit.getByRole('button', { name: '답과 근거 제출하기', exact: true }));
  await expect(submit.getByRole('radio').first()).toBeFocused();
  await expect(submit.getByRole('status')).toContainText('답을 고르고');
  await expect(submit.getByRole('checkbox')).toHaveCount(0);
  await expect(submit.getByText('승인 원본의 설치비 800,000원', { exact: true })).toHaveCount(0);
});

test('키보드만으로 실제 자료 조사·잠금 해제·증거 수집·최종 제출까지 완주한다', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await keyboard(page.getByRole('button', { name: '새 게임', exact: true }));
  const calendar = await keyboardApp(page, '일정');
  await keyboard(calendar.getByRole('button', { name: /TEAL 정산 검토/ }));
  await expect(calendar).toContainText('회의실 04');
  const explorer = await keyboardFolder(page, '백업');
  const password = explorer.getByRole('textbox');
  await password.focus();
  await password.pressSequentially('TEAL04');
  await password.press('Enter');
  await keyboard(explorer.getByRole('button', { name: '백업 폴더 열기', exact: true }));
  const messenger = await keyboardApp(page, '메신저');
  await keyboard(messenger.getByRole('button', { name: /민지와 서윤/ }));
  await keyboard(messenger.getByRole('button', { name: /^증거 기록/ }));
  for (const id of ['F06', 'F10', 'F11', 'F08', 'F09', 'F07']) {
    const viewer = await keyboardFile(page, id);
    await keyboard(viewer.getByRole('button', { name: /^증거 기록/ }));
  }
  const submit = await keyboardApp(page, '진상 제출');
  for (const question of lastAccessCase.questions) {
    const group = submit.getByRole('group', { name: new RegExp(question.prompt.replace(/[?]/g, '\\?')) });
    const answer = question.options.find(option => option.id === question.correctAnswerId)!;
    const radio = group.getByRole('radio', { name: answer.label, exact: true });
    await radio.focus();
    await radio.press('Space');
    for (const id of question.requiredEvidenceIds) {
      const checkbox = group.getByRole('checkbox', { name: lastAccessCase.evidence.find(item => item.id === id)!.title, exact: true });
      await checkbox.focus();
      await checkbox.press('Space');
    }
  }
  await keyboard(submit.getByRole('button', { name: '답과 근거 제출하기', exact: true }));
  await expect(page.getByRole('heading', { name: /끊어진 접속.*이어진 진실/ })).toBeVisible();
  await keyboard(page.getByRole('button', { name: '계속 조사', exact: true }));
  const notebook = await keyboardApp(page, '조사 노트');
  await expect(notebook).toContainText('기록한 증거 7개');
});
