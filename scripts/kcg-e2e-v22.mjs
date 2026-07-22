// KCG v22 prod e2e — playwright로 3D globe·프리셋 모달·주제 칩 실측
import { chromium } from 'playwright-core';

const URL = process.env.KCG_URL || 'https://kcg-monitor.onpod.ai';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 160)));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#mapDimensionToggle', { timeout: 60000 });
await page.waitForTimeout(12000); // 지도·패널 하이드레이션 대기

// 1) 주제 칩 실측
const chips = await page.$$eval('.kcg-topic-chip', (els) => els.map((e) => e.textContent));
console.log('topic chips:', JSON.stringify(chips));
const chipEls = await page.$$('.kcg-topic-chip');
let topicOk = 'n/a';
for (const el of chipEls) {
  const label = await el.textContent();
  if (label === '북한') {
    await el.click();
    await page.waitForTimeout(1500);
    const sources = await el.evaluate((chip) => {
      const panel = chip.closest('.panel');
      return Array.from(panel?.querySelectorAll('.item-source-name') ?? []).map((s) => s.textContent).slice(0, 6);
    });
    topicOk = JSON.stringify(sources);
    break;
  }
}
console.log('북한 chip sources:', topicOk);

// 2) 새 탭 + → 프리셋 모달
await page.click('.dashboard-tab-add');
await page.waitForTimeout(800);
const presetNames = await page.$$eval('.kcg-preset-choice-name', (els) => els.map((e) => e.textContent));
console.log('preset modal choices:', JSON.stringify(presetNames));
await page.screenshot({ path: '/tmp/kcg-v22-preset-modal.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// 3) 3D globe 토글
await page.click('.map-dim-btn[data-mode="globe"]');
await page.waitForTimeout(6000);
const projection = await page.evaluate(() => {
  try { return localStorage.getItem('kcg-globe-projection'); } catch { return 'err'; }
});
console.log('kcg-globe-projection stored:', projection);
// 줌아웃해서 globe 곡률 확인 (앱 자체 줌 버튼)
for (let i = 0; i < 7; i++) {
  await page.click('.map-btn.zoom-out').catch(() => {});
  await page.waitForTimeout(400);
}
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/kcg-v22-globe.png' });
console.log('screenshots saved');

await browser.close();
