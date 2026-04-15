import * as path from 'path';
import { existsSync, readdirSync } from 'fs';

import { runTests } from '@vscode/test-electron';

function resolveCachedVSCodeExecutablePath(extensionDevelopmentPath: string) {
  if (process.platform !== 'darwin') {
    return undefined;
  }

  const vscodeTestRoot = path.join(extensionDevelopmentPath, '.vscode-test');
  if (!existsSync(vscodeTestRoot)) {
    return undefined;
  }

  for (const entry of readdirSync(vscodeTestRoot)) {
    const executablePath = path.join(vscodeTestRoot, entry, 'Contents', 'MacOS', 'Code');
    if (existsSync(executablePath)) {
      return executablePath;
    }
  }

  const localVSCodeExecutablePath = '/Applications/Visual Studio Code.app/Contents/MacOS/Electron';
  return existsSync(localVSCodeExecutablePath) ? localVSCodeExecutablePath : undefined;
}

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    const vscodeExecutablePath = resolveCachedVSCodeExecutablePath(extensionDevelopmentPath);

    // Download VS Code, unzip it and run the integration test
    await runTests({ extensionDevelopmentPath, extensionTestsPath, vscodeExecutablePath });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

main();
