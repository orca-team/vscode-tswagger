import * as vscode from 'vscode';
import { join } from 'path';
import loadUmiHTML from './utils/loadUmiHTML';
import hotReloadWebview from './utils/hotReloadWebview';
import extensionEvent from './utils/extensionEvent';
import SwaggerParser from '@apidevtools/swagger-parser';
import dirTree from 'directory-tree';
import { getAllConfiguration, getConfiguration, getGlobalState, isDev, setConfiguration, setGlobalState } from './utils/vscodeUtil';
import { writeFileSync } from 'fs';
import { generateTypescriptFromAPIV2 } from './schema2ts/generateTypescript';
import { camelCase } from 'lodash-es';
import { OpenAPIV2 } from 'openapi-types';
import { setGlobalContext } from './globalContext';

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
      const { postMessage, onDidReceiveMessage } = extensionEvent(umiPanel);

      const remoteUrlList = getConfiguration('remoteUrlList');

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
            const allSetting = getAllConfiguration(['remoteUrlList']);
            const globalState = getGlobalState(context);
            postMessage({
              method: 'vscode-extInfo',
              data: { setting: allSetting, globalState },
              success: true,
            });
            break;
          }
          // webview 新增 apiDocs 接口
          case 'webview-addRemoteUrl': {
            try {
              setConfiguration('remoteUrlList', remoteUrlList.concat(params.list));
              const latestRemoteUrlList = getConfiguration('remoteUrlList') || [];
              postMessage({
                method: 'vscode-addRemoteUrl',
                data: { remoteUrlList: latestRemoteUrlList },
                success: true,
              });
            } catch (err) {
              postMessage({
                method: 'vscode-addApiDoc',
                data: null,
                success: false,
                errMsg: err as string,
              });
            }
            break;
          }
          // webview 解析 Swagger 远程接口返回的 schema
          case 'webview-querySwaggerSchema': {
            try {
              const apiResponse = await SwaggerParser.parse(params.url);
              console.log('API name: %s, Version: %s', apiResponse.info.title, apiResponse.info.version);
              postMessage({
                method: 'vscode-swaggerSchema',
                data: apiResponse,
                success: true,
              });
            } catch (err) {
              postMessage({
                method: 'vscode-swaggerSchema',
                data: null,
                success: false,
                errMsg: 'Swagger 接口获取失败，请稍后再试',
              });
              vscode.window.showErrorMessage(`Swagger 接口获取失败: ${err}`);
            }
          }
          // webview 读取当前工作目录
          case 'webview-queryCWD': {
            try {
              const workspaceFolders = vscode.workspace.workspaceFolders;
              const treeList: dirTree.DirectoryTree[] = [];
              if (!!workspaceFolders?.length) {
                workspaceFolders.forEach((workspaceFolder) => {
                  treeList.push(
                    dirTree(workspaceFolder.uri.fsPath, {
                      attributes: ['type', 'size'],
                      exclude: [/node_modules/, /.git/],
                      extensions: /\.(ts|tsx)$/,
                    }),
                  );
                });
              }
              postMessage({
                method: 'vscode-CWD',
                data: treeList,
                success: true,
              });
            } catch (err) {
              vscode.window.showErrorMessage(`当前目录获取失败: ${err}`);
            }
            break;
          }
          // 将 swagger schema 2.0 转成 ts
          case 'webview-generateAPIV2Ts': {
            const { outputPath, definitions, swaggerPathSchemaCollection = [] } = params;
            try {
              let tsDefs = '';
              const schemaCollection: OpenAPIV2.SchemaObject[] = [];
              // @ts-ignore
              swaggerPathSchemaCollection.forEach((swaggerPathSchema) => {
                const { apiPathList } = swaggerPathSchema;
                // @ts-ignore
                apiPathList.forEach((apiPath) => {
                  // 转换 params
                  const paramsSchemaName = camelCase(
                    [apiPath.method as string]
                      .concat(apiPath.path.split('/'))
                      .concat('params')
                      .filter((it) => !!it)
                      .join('__'),
                  );
                  const paramsSchema: Record<string, OpenAPIV2.SchemaObject> = {};
                  // @ts-ignore
                  apiPath.pathInfo.parameters?.forEach((parameter) => {
                    paramsSchema[parameter.name] = parameter.schema ? parameter.schema : parameter;
                  });
                  schemaCollection.push({
                    definitions,
                    type: 'object',
                    title: paramsSchemaName,
                    properties: paramsSchema,
                  });
                });
              });
              for (const schema of schemaCollection) {
                tsDefs += await generateTypescriptFromAPIV2(schema);
              }
              writeFileSync(outputPath as string, tsDefs, { encoding: 'utf-8' });
              postMessage({
                method: 'vscode-generateAPIV2Ts',
                data: {},
                success: true,
              });
            } catch (err) {
              console.log('err', err);
              vscode.window.showErrorMessage(`Schema 转换 Typescript 失败: ${err}`);
            }
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
      console.error('Startup Webview Hot Reload.');
      hotReloadWebview(context, umiPanel, umiHTML);
    }
  });

  context.subscriptions.push(generateTypescriptCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
