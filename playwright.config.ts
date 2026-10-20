import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  // OneDrive가 실행 중인 trace 파일을 잠그지 않도록 임시 폴더에 기록한다.
  outputDir: join(tmpdir(), 'last-access-playwright'),
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium-720', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } },
    { name: 'chromium-1080', use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } } }
  ],
  webServer: { command: 'npm.cmd run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }
});
