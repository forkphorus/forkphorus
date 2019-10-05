const puppeteer = require("puppeteer");
const path = require('path');

(async () => {
  // If the tests take more than a minute, we can assume something went wrong and need to abort.
  // In the future this might not be enough time, but for now it's much, much more than required.
  setTimeout(function() {
    console.error('[Runner] Test timed out');
    process.exit(1);
  }, 1000 * 60);

  console.log('[Runner] Starting puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      // Tests will be fetched from file:// URLs, which are normally too strict for this to work.
      '--allow-file-access-from-files',
    ],
  });

  console.log('[Runner] Opening new page');
  const page = await browser.newPage();

  var currentTest = 'no active test';
  page.on('console', (msg) => {
    console.log('[Log]', '[' + currentTest + ']', msg.text());
  });

  // We use some undocumented query string arguments to change the tests behavior a little bit.
  // Notably we want to be absolutedly certain that the tests won't start running before we setup the environment
  const file = path.join(__dirname, 'suite.html?automatedtest&nostart');
  console.log('[Runner] Opening file: ' + file);
  await page.goto(`file:${file}`);
  await page.exposeFunction('startProjectHook', async (projectMeta) => {
    const path = projectMeta.path;
    currentTest = path;
  });

  const results = await new Promise(async (resolve, reject) => {
    await page.exposeFunction('testsFinishedHook', async (results) => {
      await page.close();
      resolve(results.tests);
    });
    await page.evaluate(() => {
      runTests();
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
