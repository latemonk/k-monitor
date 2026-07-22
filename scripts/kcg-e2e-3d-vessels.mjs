// 3D(globe) 전환 후에도 deck 레이어(선박 화살표)가 렌더되는지 픽셀 실측.
// 사용: node scripts/kcg-e2e-3d-vessels.mjs  → /tmp/kcg-2d.png, /tmp/kcg-3d.png
import { chromium } from 'playwright-core';

const URL = process.env.KCG_URL || 'https://kcg-monitor.onpod.ai';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#regionSelect', { timeout: 60000 });
await page.waitForTimeout(15000);

// 서해로 이동(선박 밀집 해역) — 두 모드 동일 뷰 보장
await page.selectOption('#regionSelect', 'kr_west');
await page.waitForTimeout(6000);
await page.screenshot({ path: '/tmp/kcg-2d.png', clip: { x: 0, y: 90, width: 950, height: 800 } });

await page.click('.map-dim-btn[data-mode="globe"]');
await page.waitForTimeout(4000);
// 3D 진입 연출로 줌아웃됨 — 같은 해역으로 복귀
await page.selectOption('#regionSelect', 'global');
await page.waitForTimeout(500);
await page.selectOption('#regionSelect', 'kr_west');
await page.waitForTimeout(6000);
await page.screenshot({ path: '/tmp/kcg-3d.png', clip: { x: 0, y: 90, width: 950, height: 800 } });

await browser.close();
console.log('saved /tmp/kcg-2d.png /tmp/kcg-3d.png');
