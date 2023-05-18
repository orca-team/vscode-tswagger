import { watch } from 'chokidar';
import { join } from 'path';
import * as vscode from 'vscode';

const isDev = process.env.NODE_ENV === 'development';

const emptyHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title></title>
    </head>
    <body>
    </body>
    </html>
`;

/**
 * 重新加载 webview
 * @param webviewPanel - webview 面板
 * @param webviewHTML - webview 页面
 */
export const reloadWebview = (webviewPanel: vscode.WebviewPanel, webviewHTML: string) => {
  webviewPanel.webview.html = emptyHTML;
  webviewPanel.webview.html = webviewHTML;
};

/**
 * 热加载 webview
 * @param context - vscode 插件上下文
 * @param webviewPanel webview 面板
 * @param webviewHTML webview 页面
 */
const hotReloadWebview = (context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, webviewHTML: string) => {
  if (!isDev) {
    return;
  }

  // const umiDistPath = join(context.extensionPath, 'webview/dist');
  // const umiDistWatcher = watch(umiDistPath);
  // umiDistWatcher.on('change', () => {
  //   console.info('Hot Reload Webview.');
  //   reloadWebview(webviewPanel, webviewHTML);
  // });
};

export default hotReloadWebview;
