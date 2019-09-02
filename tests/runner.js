const puppeteer = require("puppeteer");
const path = require('path');

(async () => {
  setTimeout(function() {
    console.error('Test timed out');
    process.exit(1);
  }, 1000 * 60);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--allow-file-access-from-files',
    ],
  });

  const page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, 'suite.html?automatedtest')}`);

  const results = await new Promise(async (resolve, reject) => {
    await page.exposeFunction('testsFinishedHook', async (results) => {
      await page.close();
      resolve(results.tests);
    });
  });

  let failed = false;
  for (const i of results) {
    const time = `(${Math.round(i.totalTime)}/${Math.round(i.projectTime)}ms)`;
    if (i.success) {
      console.log(`${i.path}\tPASSED\t${i.message} ${time}`);
    } else {
      console.error(`${i.path}\tFAILED\t${i.message} ${time}`);
      failed = true;
    }
  }
  if (failed) {
    console.error('Tests failed.');
    process.exit(1);
  }

  console.log('All tests passed');
  process.exit(0);
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
