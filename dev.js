'use strict';

// A **very** barebones "development" server for forkphorus.
// Automatically starts a small (and probably insecure) HTTP server,
// and starts the typescript compiler in watch mode.
// npm install is run when node_modules doesn't exist

const childProcess = require('child_process');
const http = require('http');
const promisify = require('util').promisify;
const fs = require('fs');
const pathUtil = require('path');

const lstat = promisify(fs.lstat);
const readFile = promisify(fs.readFile);

async function run() {
  await checkDependencies();
  startServer();
  spawnCompiler();
}

function spawnCompiler() {
  childProcess.spawn(pathUtil.join(__dirname, 'node_modules/.bin/tsc'), ['-w', '--preserveWatchOutput'], {
    shell: true,
    stdio: 'inherit',
  });
}

function startServer() {
  const port = 8080;
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
    '.ico': 'image/vnd.microsoft.icon',
    '.wav': 'audio/wav',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.md': 'text/plain',
  };
  const defaultContentType = 'application/octet-stream';

  class HttpError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      this.message = message;
    }
  }

  class Http404 extends HttpError {
    constructor() {
      super(404, '404 Not Found');
    }
  }

  async function findFile(root, path) {
    const indexes = ['index.html', 'README.md'];

    // remove escape codes
    path = unescape(path);

    // remove query string
    if (path.indexOf('?') !== -1) {
      path = path.substr(0, path.indexOf('?'));
    }

    path = pathUtil.join(root, path);

    try {
      if ((await lstat(path)).isDirectory()) {
        // try to find an index file
        let found = false;
        let origPath = path;
        for (const i of indexes) {
          try {
            path = pathUtil.join(origPath, i);
            if ((await lstat(path)).isFile()) {
              found = true;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
        if (!found) return null;
      }
    } catch (e) {
      return null;
    }

    return path;
  }

  async function handler(req, res) {
    const path = await findFile(__dirname, req.url || '/');
    if (path === null) throw new Http404();

    const data = await readFile(path);
    const extension = pathUtil.extname(path);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Content-Type', contentTypes[extension] || defaultContentType);
    res.setHeader('Cache-Control', 'no-store');
    res.write(data);
  };

  const server = http.createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      if (e.code) {
        res.statusCode = e.code;
        res.write(e.message);
      } else {
        res.statusCode = 500;
        res.write('internal server error');
        console.error(e.stack || e);
      }
    }
    res.end();
  });
  server.listen(port);
  
  portConnectionInfo(port);
}

function portConnectionInfo(port) {
  console.log('='.repeat(80));
  console.log('Visit any of these links in your browser:');
  console.log(`    http://localhost:${port}/`);
  console.log(`    http://127.0.0.1:${port}/`);
  console.log('Changes to .ts files automatically retrigger a build. Refresh to view changes.');
  console.log('='.repeat(80));
  console.log('Compiler output:');
}

async function checkDependencies() {
  try {
    await lstat(pathUtil.join(__dirname, 'node_modules'))
  } catch (e) {
    installDependencies();
  }
}

function installDependencies() {
  console.log('Installing dependencies');
  childProcess.spawnSync('npm', ['install'], {
    stdio: 'inherit',
    shell: true,
  });
}

run()
  .catch((err) => {
    console.error('ERROR');
    console.error(err.stack || err);
    process.exit(1);
  });
