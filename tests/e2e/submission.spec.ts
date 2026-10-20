import { expect, test } from '@playwright/test';
import { collectRequired, fillCorrectReport, openApp, openFile, unlockBackup } from './helpers';
import { lastAccessCase } from '../../src/content/last-access';
for (const standard of [true, false]) {
  test(`${standard ? '정규' : 'P01 생략'} 경로로 필수 증거만 수집해 엔딩`, async ({ page }, testInfo) => {
    const externalRequests: string[] = [];
    const errors: string[] = [];
    page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') externalRequests.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: '새 게임', exact: true }).click();
    if (standard) {
      const messenger = await openApp(page, '메신저');
      await expect(messenger).toContainText('4월 17일');
      const personal = await openFile(page, 'F03');
      await personal.getByRole('textbox').fill('0417');
      await personal.getByRole('button', { name: '잠금 해제' }).click();
      await expect(personal).toContainText('프로젝트 영문 코드');
    }
    const calendar = await openApp(page, '일정');
    await calendar.getByRole('button', { name: /TEAL 정산 검토/ }).click();
    await expect(calendar).toContainText('회의실 04');
    await unlockBackup(page);
    await collectRequired(page);
    if (standard) {
      const notebook = await openApp(page, '조사 노트');
      await notebook.getByRole('textbox', { name: '나의 추리 메모' }).fill('오답 후에도 남아야 하는 조사 메모');
    }
    let submit = await openApp(page, '진상 제출');
    await submit.getByRole('button', { name: /답과 근거 제출하기/ }).click();
    await expect(submit.getByRole('status')).toContainText('필요한 개수');
    submit = await fillCorrectReport(page);
    await page.screenshot({ path: testInfo.outputPath('submission.png') });
    if (standard) {
      const location = submit.getByRole('group', { name: /서윤을 찾아갈 장소/ });
      const evidenceName = (id: string) => lastAccessCase.evidence.find(item => item.id === id)!.title;
      await expect(location.getByRole('checkbox', { name: evidenceName('E03'), exact: true })).toBeDisabled();
      await location.getByRole('checkbox', { name: evidenceName('E01'), exact: true }).uncheck();
      await location.getByRole('checkbox', { name: evidenceName('E03'), exact: true }).check();
      await submit.getByRole('button', { name: /답과 근거 제출하기/ }).click();
      await expect(submit.getByRole('status')).toContainText('답 또는 근거를 다시 확인');
      await expect(location.getByRole('radio', { name: '별관 지하 1층 자료실', exact: true })).toBeChecked();
      await expect(location.getByRole('checkbox', { name: evidenceName('E03'), exact: true })).toBeChecked();
      await location.getByRole('checkbox', { name: evidenceName('E03'), exact: true }).uncheck();
      await location.getByRole('checkbox', { name: evidenceName('E01'), exact: true }).check();
      await submit.getByRole('radio', { name: '본관 카페', exact: true }).check();
      await submit.getByRole('button', { name: /답과 근거 제출하기/ }).click();
      await expect(submit.getByRole('status')).toContainText('답 또는 근거를 다시 확인');
      await submit.getByRole('radio', { name: '별관 지하 1층 자료실', exact: true }).check();
    }
    await submit.getByRole('button', { name: /답과 근거 제출하기/ }).click();
    await expect(page.getByRole('heading', { name: /끊어진 접속.*이어진 진실/ })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('ending.png') });
    await page.getByRole('button', { name: '계속 조사', exact: true }).click();
    const notebook = await openApp(page, '조사 노트');
    await expect(notebook).toContainText('기록한 증거 7개');
    if (standard) await expect(notebook.getByRole('textbox', { name: '나의 추리 메모' })).toHaveValue('오답 후에도 남아야 하는 조사 메모');
    await expect(notebook).not.toContainText('20:30 메시지는');
    expect(externalRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
