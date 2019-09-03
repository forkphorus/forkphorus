const puppeteer = require("puppeteer");
const path = require('path');

(async () => {
  setTimeout(function() {
    console.error('[Runner] Test timed out');
    process.exit(1);
  }, 1000 * 60);

  console.log('[Runner] Starting puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--allow-file-access-from-files',
    ],
  });

  console.log('[Runner] Opening new page');
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log('[Log]', msg.text());
  });

  const file = path.join(__dirname, 'suite.html?automatedtest');
  console.log('[Runner] Opening file: ' + file);
  await page.goto(`file:${file}`);

  const results = await new Promise(async (resolve, reject) => {
    await page.exposeFunction('testsFinishedHook', async (results) => {
      await page.close();
      resolve(results.tests);
    });
  });

  let failed = false;
  console.log('');
  for (const i of results) {
    const time = `${Math.round(i.totalTime)}/${Math.round(i.projectTime)}ms`;
    if (i.success) {
      console.log(`PASSED\t${i.path}\t${i.message} (${time})`)
    } else {
      console.log(`FAILED\t${i.path}\t${i.message} (${time})`)
      failed = true;
    }
  }
  console.log('');
  if (failed) {
    console.error('[Runner] Tests failed.');
    process.exit(1);
  }

  console.log('[Runner] All tests passed');
  process.exit(0);
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
