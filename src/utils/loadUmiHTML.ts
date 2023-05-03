import * as vscode from 'vscode';
import { getPathInVsCode, isDev } from './vscodeUtil';

const loadUmiHTML = (context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel) => {
  const getUmiFilePath = (fileName: string) => {
    const filePath = getPathInVsCode(context, webviewPanel, `webview/dist/${fileName}`);
    return filePath;
  };

  return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            ${isDev ? '' : `<link rel="stylesheet" href="${getUmiFilePath('umi.css')}" />`}
        </head>
        <body>
            <div id="root"></div>
            <script src="${getUmiFilePath('umi.js')}"></script>
        </body>
    </html>
  `;
};

export default loadUmiHTML;
