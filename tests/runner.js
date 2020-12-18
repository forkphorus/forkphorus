const playwright = require("playwright");
const LocalWebServer = require('local-web-server');
const path = require('path');

const BROWSERS = ['chromium', 'firefox', 'webkit'];

// console log messages that match any of these regular expressions will be ignored
const IGNORE_LOG_MESSAGES = [
  // firefox will complain a lot about how we generate scripts, this is safe to ignore.
  /unreachable code after return statement/,
  // do not log warnings about the alternative parser, these are normal
  /alternative parser/,
];

// In order to run the browsers, we must setup a local HTTP server for them to run on.
// Browsers have a lot of restrictions on file:// URLs that we can't easily workaround and may break.
const PORT = 18930; // arbitrary
const ws = LocalWebServer.create({
  // @ts-ignore
  port: 18930,
  directory: path.dirname(__dirname),
});
console.log(`[Runner] [LWS] Server started on port ${PORT}`);

function exit(status) {
  ws.server.close();
  process.exit(status);
}

(async () => {

  const browsersWithErrors = new Set();
  const url = `http://localhost:${PORT}/tests/suite.html?automatedtest&nostart`;

  // If the tests take more than a few minutes, we can assume something went wrong and need to abort.
  // Eventually this time may need to be increased further.
  setTimeout(function() {
    console.error('[Runner] Test timed out');
    exit(1);
  }, 1000 * 60 * 5);

  for (const browserType of BROWSERS) {

    const LOG_PREFIX = `[Runner] [${browserType}]`;

    console.log('');
    console.log(`${LOG_PREFIX} Starting browser`);

    const browserStartTime = Date.now();
    const browser = await playwright[browserType].launch({
      headless: true,
    });
  
    console.log(`${LOG_PREFIX} Opening new page`);
    const page = await browser.newPage();
  
    // Route console log messages to the actual console
    let currentTest = 'no active test';
    page.on('console', (msg) => {
      const text = msg.text();
      for (const re of IGNORE_LOG_MESSAGES) {
        if (re.test(text)) {
          return;
        }
      }
      console.log(`${LOG_PREFIX} [${currentTest}] ${msg.text()}`);
    });
    
    // We use some undocumented query string arguments to change the tests behavior a little bit.
    // Notably we want to be absolutely certain that the tests won't start running before we setup the environment
    console.log(`${LOG_PREFIX} Going to URL: ${url}`);
    await page.goto(url);
    await page.exposeFunction('startProjectHook', async (projectMeta) => {
      const path = projectMeta.path;
      currentTest = path;
    });

    const projectStartTime = Date.now();
    let results = await new Promise(async (resolve, reject) => {
      // the test suite will run the global testsFinishedHook() method if it exists when the tests complete
      await page.exposeFunction('testsFinishedHook', async (results) => {
        await page.close();
        resolve(results.tests);
      });
      await page.evaluate(() => {
        // runTests() is a global in the test suite that starts the test
        // @ts-ignore
        runTests();
      });
    });

    // Workaround Firefox headless bug
    if (browserType === 'firefox') {
      results = results.filter((i) => i.path !== 'sb3/pen-color-shift.sb3');
    }

    const testsSuccessful = results.every((i) => i.success);

    for (const i of results) {
      const timeInfo = `${Math.round(i.totalTime)}/${Math.round(i.projectTime)}ms`;
      if (i.success) {
        console.log(`PASSED\t${i.path}\t${i.message} (${timeInfo})`)
      } else {
        console.log(`FAILED\t${i.path}\t${i.message} (${timeInfo})`)
      }
    }

    const totalBrowserTestTime = Date.now() - browserStartTime;
    const totalProjectTestTime = Date.now() - projectStartTime;
    const timeInfo = `${totalBrowserTestTime}/${totalProjectTestTime}ms`;
    if (testsSuccessful) {
      console.log(`${LOG_PREFIX} Tests passed in ${timeInfo}`);
    } else {
      console.error(`${LOG_PREFIX} Tests failed in ${timeInfo}`);
      browsersWithErrors.add(browserType);
    }
  }

  console.log('');

  if (browsersWithErrors.size === 0) {
    console.log('[Runner] All tests passed in all browsers.');
    exit(0);
  } else {
    console.log(`[Runner] Tests failed in browsers: ${Array.from(browsersWithErrors).join(', ')}.`);
    exit(1);
  }

})().catch((err) => {
  console.error(err.stack);
  exit(1);
});
