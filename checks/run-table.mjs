// checks/run-table.mjs — Automated verification of Done means rows 1–8, empty, and parallel requests.
import { spawn } from 'node:child_process';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT_DIR = path.resolve('.');

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function setMode(mode) {
  const res = await fetch('http://localhost:5050/__mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  return res.json();
}

async function main() {
  console.log('Starting server.mjs...');
  const server = spawn('node', ['server.mjs'], { cwd: ROOT_DIR, stdio: 'inherit' });
  await wait(1200);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const summary = {};

  for (const v of ['a', 'b', 'c']) {
    console.log(`\n--- Testing Version ${v.toUpperCase()} ---`);
    summary[v] = {};
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    const stockTimes = [];
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.url().includes('/api/stock/')) {
        stockTimes.push(Date.now());
      }
      req.continue();
    });

    // 1. Normal mode (Rows 1, 2, 3, Parallel)
    await setMode('normal');
    await page.goto(`http://localhost:5050/?v=${v}`, { waitUntil: 'domcontentloaded' });
    await wait(1500);

    const cards = await page.$$eval('#catalogue .card', (els) => els.length);
    const stock = await page.$eval('#stock-value', (el) => el.textContent);
    const status = await page.$eval('#status', (el) => el.textContent);
    const lastCardText = await page.$$eval('#catalogue .card .name', (els) => els[els.length - 1]?.textContent);
    const hasItalic = await page.$$eval('#catalogue .card .name i', (els) => els.length > 0);

    const spread = stockTimes.length > 0 ? Math.max(...stockTimes) - Math.min(...stockTimes) : 0;
    summary[v].row1 = cards === 8 && status === '' ? 'PASS' : `FAIL (${cards} cards)`;
    summary[v].row2 = stock === '12.360.000 đ' ? 'PASS' : `FAIL (${stock})`;
    summary[v].row3 = lastCardText === 'Scarf <i>limited</i>' && !hasItalic ? 'PASS' : 'FAIL';
    summary[v].parallel = stockTimes.length === 8 && spread < 50 ? `PASS (${spread} ms spread)` : `FAIL (${spread} ms)`;

    // 4. Slow mode (Row 4)
    await setMode('slow');
    const slowNav = page.goto(`http://localhost:5050/?v=${v}`, { waitUntil: 'domcontentloaded' });
    await wait(300);
    const slowStatusStart = await page.$eval('#status', (el) => el.textContent);
    await slowNav;
    await wait(3500);
    const slowStatusEnd = await page.$eval('#status', (el) => el.textContent);
    summary[v].row4 = slowStatusStart === 'Loading products…' && slowStatusEnd === '' ? 'PASS' : 'FAIL';

    // 5. Error mode & Retry (Row 5)
    await setMode('error');
    await page.goto(`http://localhost:5050/?v=${v}`, { waitUntil: 'domcontentloaded' });
    await wait(600);
    const errStatus = await page.$eval('#status', (el) => el.textContent);
    const retryVisible = await page.$eval('#retry', (el) => !el.hidden);
    await setMode('normal');
    await page.click('#retry');
    await wait(1500);
    const afterRetryStatus = await page.$eval('#status', (el) => el.textContent);
    const afterRetryCards = await page.$$eval('#catalogue .card', (els) => els.length);
    summary[v].row5 = errStatus === 'Could not load products.' && retryVisible && afterRetryCards === 8 ? 'PASS' : 'FAIL';

    // 6. Hang mode (Row 6)
    await setMode('hang');
    const startHang = Date.now();
    await page.goto(`http://localhost:5050/?v=${v}`, { waitUntil: 'domcontentloaded' });
    let hangAborted = false;
    let hangDuration = 0;
    for (let i = 0; i < 20; i++) {
      await wait(500);
      const curStatus = await page.$eval('#status', (el) => el.textContent);
      const isRetry = await page.$eval('#retry', (el) => !el.hidden);
      if (curStatus === 'Could not load products.' && isRetry) {
        hangAborted = true;
        hangDuration = (Date.now() - startHang) / 1000;
        break;
      }
    }
    summary[v].row6 = hangAborted && hangDuration >= 4.5 && hangDuration <= 6.5 ? `PASS (${hangDuration.toFixed(1)}s)` : `FAIL (${hangDuration.toFixed(1)}s)`;

    // Empty mode
    await setMode('empty');
    await page.goto(`http://localhost:5050/?v=${v}`, { waitUntil: 'domcontentloaded' });
    await wait(600);
    const emptyStatus = await page.$eval('#status', (el) => el.textContent);
    const emptyStock = await page.$eval('#stock-value', (el) => el.textContent);
    summary[v].empty = emptyStatus === 'No products yet.' && emptyStock === '0 đ' ? 'PASS' : 'FAIL';

    await page.close();
  }

  await browser.close();
  server.kill();

  console.log('\n================ Automated Test Summary ================');
  console.table(summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

