import * as vscode from 'vscode';
import { sendTsFileChangeMsg } from './serverSentEvents';
import { queryCwd } from './controllers/common';

export const listenTsFileChange = (webview: vscode.Webview) => {
  const tsFileWatcher = vscode.workspace.createFileSystemWatcher(
    // new vscode.RelativePattern(vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor?.document.uri), '/.(ts|tsx)$/'),
    '**/*.{ts,tsx}',
    false,
    false,
    false,
  );

  tsFileWatcher.onDidCreate(async (uri) => {
    sendTsFileChangeMsg(webview, await queryCwd());
  });

  tsFileWatcher.onDidDelete(async (uri) => {
    sendTsFileChangeMsg(webview, await queryCwd());
  });
};
