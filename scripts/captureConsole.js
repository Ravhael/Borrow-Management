const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log(`PAGE_CONSOLE: ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => console.log(`PAGE_ERROR: ${err.stack || err}`));

  try {
    const url = process.argv[2] || 'http://localhost:3001/formflow';
    console.log('Visiting', url);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // wait additional time to allow client scripts to run
    await page.waitForTimeout(3000);
  } catch (e) {
    console.error('ERROR DURING NAVIGATION', e);
  } finally {
    await browser.close();
  }
})();
