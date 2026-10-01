import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 90000,
  workers: 1,
  use: { baseURL: process.env.LOOKHEP_TEST_URL || 'http://127.0.0.1:5173', channel: 'chrome', viewport: { width: 1440, height: 1100 }, launchOptions: { args: process.env.LOOKHEP_HARDWARE === '1' ? ['--enable-webgl', '--use-angle=d3d11', '--ignore-gpu-blocklist'] : ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
});
