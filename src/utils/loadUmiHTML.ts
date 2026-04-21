import * as fse from 'fs-extra';
import { join } from 'path';
import * as vscode from 'vscode';
import { getPathInVsCode, isDev } from './vscodeUtil';

const getDevServerPort = (context: vscode.ExtensionContext) => {
  const portFilePath = join(context.extensionPath, 'webview', '.PORT');
  if (!fse.existsSync(portFilePath)) {
    return undefined;
  }

  const port = fse.readFileSync(portFilePath, 'utf8').trim();
  if (!/^\d+$/.test(port)) {
    return undefined;
  }

  return port;
};

const getDevServerErrorHTML = () => {
  return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
        </head>
        <body>
            <div id="root">tswagger webview dev server is not running. Please start it with pnpm webview-watch.</div>
        </body>
    </html>
  `;
};

const loadUmiHTML = (context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel) => {
  if (isDev) {
    const port = getDevServerPort(context);
    if (!port) {
      return getDevServerErrorHTML();
    }

    const devServerOrigin = `http://localhost:${port}`;
    const devServerSocketOrigin = `ws://localhost:${port}`;
    const { cspSource } = webviewPanel.webview;

    return `
      <!DOCTYPE html>
      <html>
          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} ${devServerOrigin} https: data:; style-src ${cspSource} ${devServerOrigin} 'unsafe-inline'; font-src ${cspSource} ${devServerOrigin} data:; script-src ${cspSource} ${devServerOrigin} 'unsafe-inline' 'unsafe-eval'; connect-src ${cspSource} ${devServerOrigin} ${devServerSocketOrigin} https:;">
          </head>
          <body>
              <div id="root"></div>
              <script>
                /**
                 * HMR WebSocket 连接修复
                 *
                 * 问题背景：
                 *   VS Code webview 运行在一个沙箱化的 iframe 中，其 window.location.host
                 *   是一个随机 hash（如 "0bgp0ndk...csq"），而非 "localhost"。
                 *   Umi 4 的 HMR client 在构建时未能从配置中读取 webSocketURL，
                 *   默认回退到 window.location.host，导致尝试连接
                 *   ws://<hash>/ 而非 ws://localhost:<port>/ws。
                 *   这条连接会被 CSP 拦截，从而造成 HMR 完全失效。
                 *
                 * 解决方案：
                 *   在 umi.js 加载前包装原生 WebSocket 构造函数，
                 *   将所有非 localhost/127.0.0.1 的 ws 连接重定向到实际的 dev server 地址。
                 */
                (function() {
                  var RealWS = window.WebSocket;
                  var devWsUrl = '${devServerSocketOrigin}/ws';
                  window.WebSocket = function(url, protocols) {
                    var target = (url && url.indexOf('localhost') === -1 && url.indexOf('127.0.0.1') === -1) ? devWsUrl : url;
                    return protocols ? new RealWS(target, protocols) : new RealWS(target);
                  };
                  // 保留 prototype 及静态常量，确保 instanceof 等行为与原生一致
                  window.WebSocket.prototype = RealWS.prototype;
                  window.WebSocket.CONNECTING = RealWS.CONNECTING;
                  window.WebSocket.OPEN = RealWS.OPEN;
                  window.WebSocket.CLOSING = RealWS.CLOSING;
                  window.WebSocket.CLOSED = RealWS.CLOSED;
                })();
              </script>
              <script src="${devServerOrigin}/umi.js"></script>
          </body>
      </html>
    `;
  }

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
          <link rel="stylesheet" href="${getUmiFilePath('umi.css')}" />
        </head>
        <body>
            <div id="root"></div>
            <script src="${getUmiFilePath('umi.js')}"></script>
        </body>
    </html>
  `;
};

export default loadUmiHTML;
