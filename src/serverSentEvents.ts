import directoryTree from 'directory-tree';
import * as vscode from 'vscode';

export const sendTsFileChangeMsg = (webview: vscode.Webview, data: directoryTree.DirectoryTree[]) => {
  webview.postMessage({
    data,
    method: 'webview-tsFileChange',
    errMsg: 'success',
    success: true,
  });
};

export const sendCurrTsGenProgressMsg = (webview: vscode.Webview, data: { total: number; current: number }) => {
  webview.postMessage({
    data,
    method: 'webview-tsGenProgress',
    errMsg: 'success',
    success: true,
  });
};

export const sendFetchFileGenMsg = (webview: vscode.Webview, data: boolean | null) => {
  webview.postMessage({
    data,
    method: 'webview-genFetchFile',
    errMsg: 'success',
    success: true,
  });
};
