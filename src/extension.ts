/* eslint-disable no-console */
import * as vscode from 'vscode';
import { join } from 'path';
import loadUmiHTML from './utils/loadUmiHTML';
import hotReloadWebview from './utils/hotReloadWebview';
import { isDev } from './utils/vscodeUtil';
import { setGlobalContext } from './globalContext';
import { manageServicesFromPanel } from './utils/manageServices';
import { listenTsFileChange } from './listeners';
import {
  addSwaggerUrl,
  checkConfigJSON,
  delSwaggerUrl,
  parseSwaggerJson,
  parseSwaggerUrl,
  queryCwd,
  queryExtInfo,
  queryLocalTranslation,
  readLocalServiceInfoByGroup,
  saveConfigJSON,
  updateSwaggerUrl,
  updateSwaggerUrlList,
  updateTranslationConfig,
  writeTsFile,
  // 分组文档相关接口
  addGroupSwaggerDoc,
  delGroupSwaggerDoc,
  updateGroupSwaggerDoc,
  updateSwaggerDocGroup,
  updateGroupSwaggerDocList,
  createSwaggerDocGroup,
  deleteSwaggerDocGroup,
} from './controllers/common';
import { generateV2ServiceFile, generateV2TypeScript } from './controllers/generate/v2';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "tswagger" is now active!');

  setGlobalContext(context);

  let umiPanel: vscode.WebviewPanel | undefined;
  let umiHTML: string = '';

  let generateTypescriptCommand = vscode.commands.registerCommand('tswagger.generateTypescript', () => {
    const activeViewColumn = vscode.window.activeTextEditor?.viewColumn;

    if (umiPanel) {
      umiPanel.reveal(activeViewColumn);
    } else {
      umiPanel = vscode.window.createWebviewPanel('generate-typescript', 'tswagger', vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(join(context.extensionPath, 'webview'))],
      });
      umiPanel.iconPath = vscode.Uri.file(join(context.extensionPath, 'assets/images/logo.svg'));
      umiHTML = loadUmiHTML(context, umiPanel);
      umiPanel.webview.html = umiHTML;

      const { onDidDispose } = umiPanel;
      const { onDidReceiveMessage } = umiPanel.webview;

      const registerService = manageServicesFromPanel(umiPanel.webview);

      // 获取插件配置、全局状态等信息
      registerService('webview-queryExtInfo', async () => await queryExtInfo(context));
      // 读取本地翻译缓存
      registerService('webview-queryLocalTranslation', queryLocalTranslation);
      // 更新翻译配置
      registerService('webview-updateTranslationConfig', updateTranslationConfig);
      // 读取当前目录树
      registerService('webview-queryCwd', queryCwd);
      // 添加swagger接口
      registerService('webview-addSwaggerUrl', addSwaggerUrl);
      // 删除swagger接口
      registerService('webview-delSwaggerUrl', delSwaggerUrl);
      // 更新swagger接口
      registerService('webview-updateSwaggerUrl', updateSwaggerUrl);
      // 全量更新swagger接口列表
      registerService('webview-updateSwaggerUrlList', updateSwaggerUrlList);
      // 解析远程接口
      registerService('webview-parseSwaggerUrl', parseSwaggerUrl);
      // 解析 Swagger Json 字符串
      registerService('webview-parseSwaggerJson', parseSwaggerJson);
      // 生成 OpenAPI2.0 版本的 Typescript
      registerService('webview-generateV2TypeScript', (config) => generateV2TypeScript(umiPanel!.webview, config));
      // 写入 ts 文件
      registerService('webview-writeTsFile', writeTsFile);
      // 生成接口文件
      registerService('webview-generateV2ServiceFile', (data) => generateV2ServiceFile(umiPanel!.webview, data));
      // 检查 config.json 是否存在
      registerService('webview-checkConfigJSON', checkConfigJSON);
      // 写入 config.json
      registerService('webview-saveConfigJSON', saveConfigJSON);
      // 获取不同分组下的 service.map.yaml 文件信息
      registerService('webview-readLocalServiceInfo', readLocalServiceInfoByGroup);
      
      // ==================== 分组文档相关接口 ====================
      // 添加分组文档
      registerService('webview-addGroupSwaggerDoc', addGroupSwaggerDoc);
      // 删除分组文档
      registerService('webview-delGroupSwaggerDoc', delGroupSwaggerDoc);
      // 更新分组文档
      registerService('webview-updateGroupSwaggerDoc', updateGroupSwaggerDoc);
      // 更新分组信息
      registerService('webview-updateSwaggerDocGroup', updateSwaggerDocGroup);
      // 全量更新分组文档列表
      registerService('webview-updateGroupSwaggerDocList', updateGroupSwaggerDocList);
      // 创建新分组
      registerService('webview-createSwaggerDocGroup', createSwaggerDocGroup);
      // 删除分组
      registerService('webview-deleteSwaggerDocGroup', deleteSwaggerDocGroup);

      // 开始监听 ts 文件变化
      listenTsFileChange(umiPanel.webview);

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
