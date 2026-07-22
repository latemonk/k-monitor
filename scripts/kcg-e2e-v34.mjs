// KCG v34 prod e2e — 실시간 속보 위젯·프리셋 브리프 커스터마이징·브리프 클릭 모달 실측
import { chromium } from 'playwright-core';

const URL = process.env.KCG_URL || 'https://k-monitor.onpod.ai';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 160)));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(14000); // 지도·패널 하이드레이션 대기

// 1) 실시간 속보 패널 렌더 + 아이템 실측
const brkCount = await page.$$eval('.kcg-brk-item', (els) => els.length).catch(() => -1);
const brkFirst = await page.$eval('.kcg-brk-item .kcg-brk-title', (el) => el.textContent).catch(() => 'NONE');
console.log('breaking items:', brkCount, '| first:', String(brkFirst).slice(0, 50));

// 2) 속보 주제 칩 (속보 패널 안)
const brkChips = await page.$$eval('.kcg-brk-list', () => {
  const panel = document.querySelector('.kcg-brk-list')?.closest('.panel');
  return Array.from(panel?.querySelectorAll('.kcg-topic-chip') ?? []).map((c) => c.textContent);
}).catch(() => []);
console.log('breaking chips:', JSON.stringify(brkChips));

// 3) 칩 클릭 → 주제 전환 (항공)
await page.evaluate(() => {
  const panel = document.querySelector('.kcg-brk-list')?.closest('.panel');
  const chip = Array.from(panel?.querySelectorAll('.kcg-topic-chip') ?? []).find((c) => c.textContent === '항공');
  chip?.click();
});
await page.waitForTimeout(6000);
const brkAfter = await page.$eval('.kcg-brk-item .kcg-brk-title', (el) => el.textContent).catch(() => 'NONE');
console.log('after 항공 chip first item:', String(brkAfter).slice(0, 50));

// 4) 인사이트 주제 브리프 카드 존재 + 클릭 → 모달
const briefKeys = await page.$$eval('.kcg-topic-brief', (els) => els.map((e) => e.dataset.kcgBrief));
console.log('brief cards (default tab):', JSON.stringify(briefKeys));
if (briefKeys.length) {
  await page.click('.kcg-topic-brief');
  await page.waitForTimeout(800);
  const modalTitle = await page.$eval('.kcg-modal-title, .kcg-modal h3, .kcg-modal-header', (el) => el.textContent).catch(() => 'NO-MODAL-TITLE');
  const modalOpen = await page.$('.kcg-modal-overlay, .kcg-panel-overlay') !== null;
  console.log('brief modal open:', modalOpen, '| title:', String(modalTitle).slice(0, 40));
  await page.screenshot({ path: '/tmp/kcg-v34-brief-modal.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

// 5) 새 탭 + → 해양 감시 프리셋 생성 → 브리프 카드가 해양 구성으로 교체됐는지
await page.click('.dashboard-tab-add');
await page.waitForTimeout(800);
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.kcg-preset-choice'));
  const target = btns.find((b) => b.textContent?.includes('해양 감시'));
  target?.click();
});
await page.waitForTimeout(8000);
const presetBriefKeys = await page.$$eval('.kcg-topic-brief', (els) => els.map((e) => e.dataset.kcgBrief)).catch(() => []);
console.log('brief cards (maritime tab):', JSON.stringify(presetBriefKeys));
const brkCountMaritime = await page.$$eval('.kcg-brk-item', (els) => els.length).catch(() => -1);
console.log('maritime tab breaking items:', brkCountMaritime);
await page.screenshot({ path: '/tmp/kcg-v34-maritime-tab.png', fullPage: false });

await browser.close();
console.log('done');
