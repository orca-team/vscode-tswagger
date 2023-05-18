import * as vscode from 'vscode';
import { join } from 'path';
import loadUmiHTML from './utils/loadUmiHTML';
import hotReloadWebview from './utils/hotReloadWebview';
import extensionEvent, { parseSwaggerJson } from './extensionEvent';
import { isDev } from './utils/vscodeUtil';
import { setGlobalContext } from './globalContext';
import { manageServicesFromPanel } from './utils/manageServices';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "swagger-typescript-generator" is now active!');

  setGlobalContext(context);

  let umiPanel: vscode.WebviewPanel | undefined;
  let umiHTML: string = '';

  let generateTypescriptCommand = vscode.commands.registerCommand('swagger-typescript-generator.generateTypescript', () => {
    const activeViewColumn = vscode.window.activeTextEditor?.viewColumn;

    if (umiPanel) {
      umiPanel.reveal(activeViewColumn);
    } else {
      umiPanel = vscode.window.createWebviewPanel('generate-typescript', 'GenerateTypescriptForSwagger', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(join(context.extensionPath, 'webview'))],
      });
      umiHTML = loadUmiHTML(context, umiPanel);
      umiPanel.webview.html = umiHTML;

      const { onDidDispose } = umiPanel;
      const { onDidReceiveMessage } = umiPanel.webview;
      const { extensionService, postMessage } = extensionEvent(umiPanel);

      const registerService = manageServicesFromPanel(umiPanel.webview);

      // 解析 Swagger Json 字符串
      registerService('webview-parseSwaggerJson', parseSwaggerJson);

      // webview 销毁时
      onDidDispose(
        () => {
          umiPanel = undefined;
        },
        null,
        context.subscriptions,
      );

      // 监听 webview 发送的事件
      onDidReceiveMessage(async (message) => {
        console.info('[Message from umi webview]: ', message);
        const { params } = message;
        switch (message.method) {
          // 获取插件配置等相关信息
          case 'webview-queryExtInfo': {
            extensionService.sendExtInfo();
            break;
          }
          // webview 新增 apiDocs 接口
          case 'webview-addRemoteUrl': {
            extensionService.addRemoteUrlList(params.list);
            break;
          }
          // webview 解析 Swagger 远程接口返回的 schema
          case 'webview-querySwaggerSchema': {
            await extensionService.parseSwaggerUrl(params.url);
            break;
          }
          // webview 读取当前工作目录
          case 'webview-queryCWD': {
            extensionService.sendCwdTreeData();
            break;
          }
          // 将 swagger2.0 转成 ts
          case 'webview-generateAPIV2Ts': {
            const { outputPath, outputOptions, V2Document, collection = [] } = params;
            await extensionService.generateAPIV2Ts(collection, V2Document, outputPath, outputOptions);
            break;
          }
        }
      });
    }

    /**
     * temp: 临时热更新方案，监听 umi 文件输出变化
     * 在 webview 中使用 umi4 的热更新尚有问题，待解决
     */
    if (isDev && umiPanel) {
      console.info('Startup Hot Reload Webview.');
      hotReloadWebview(context, umiPanel, umiHTML);
    }
  });

  context.subscriptions.push(generateTypescriptCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
