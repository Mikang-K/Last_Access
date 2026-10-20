import { expect, test } from '@playwright/test';
test('시작 화면은 정답을 노출하지 않는다', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /마지막.*접속/ })).toBeVisible();
  await expect(page.getByText('약속 장소에 나타나지 않은 친구가 예약 메시지를 남겼다.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: '새 게임', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/TEAL04|한도현|별관 지하 1층 자료실/);
  await page.screenshot({ path: testInfo.outputPath('start.png') });
});
