const { spawn } = require('child_process');
const path = require('path');
const fse = require('fs-extra');
const getPort = require('get-port');

const rootDir = path.resolve(__dirname, '..');
const webviewDir = path.join(rootDir, 'webview');
const portFilePath = path.join(webviewDir, '.PORT');

let childProcess;
let cleanedUp = false;

const cleanup = () => {
  if (cleanedUp) {
    return;
  }

  cleanedUp = true;
  fse.removeSync(portFilePath);
};

const forwardSignal = (signal) => {
  if (childProcess && !childProcess.killed) {
    childProcess.kill(signal);
    return;
  }

  process.exit(0);
};

const start = async () => {
  const preferredPorts = typeof getPort.makeRange === 'function' ? getPort.makeRange(8000, 8999) : Array.from({ length: 1000 }, (_, index) => 8000 + index);
  const port = await getPort({ port: preferredPorts });

  fse.writeFileSync(portFilePath, `${port}\n`);

  childProcess = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['--filter', 'tswagger-webview', 'dev'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      WDS_SOCKET_HOST: 'localhost',
      WDS_SOCKET_PORT: String(port),
      WDS_SOCKET_PATH: '/ws',
    },
    stdio: 'inherit',
  });

  childProcess.on('error', (error) => {
    cleanup();
    console.error(error);
    process.exit(1);
  });

  childProcess.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
};

process.on('exit', cleanup);
process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));
process.on('uncaughtException', (error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});

start().catch((error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});
