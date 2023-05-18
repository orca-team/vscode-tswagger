import * as vscode from 'vscode';
import { getAllConfiguration, getConfiguration, getGlobalState, setConfiguration } from './utils/vscodeUtil';
import { getGlobalContext } from './globalContext';
import dirTree from 'directory-tree';
import SwaggerParser from '@apidevtools/swagger-parser';
import handleSwaggerPathV2 from './swaggerPath/handleSwaggerPathV2';
import { HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from './types';
import { OpenAPIV2 } from 'openapi-types';
import { generateTypescriptFromAPIV2 } from './schema2ts/generateTypescript';
import { writeFileSync } from 'fs';

/**
 * vscode 发送消息类型，固定以 `vscode` 开头
 */
export type ExtensionMessage<D = any> = {
  method: `vscode-${string}`;
  data: Record<string, D> | boolean | null;
  success: boolean;
  errMsg?: string;
};

/**
 * vscode 收发消息
 * @param panel - webview 面板
 * @returns 封装过后的 vscode 消息事件方法
 */
const extensionEvent = (panel: vscode.WebviewPanel) => {
  const { webview } = panel;
  const context = getGlobalContext();

  const postMessage = (message: ExtensionMessage) => {
    webview.postMessage(message);
  };

  const extensionService = {
    /**
     * 发送插件配置等信息给 webview 端
     */
    sendExtInfo() {
      const allSetting = getAllConfiguration(['remoteUrlList']);
      const globalState = getGlobalState(context);
      postMessage({
        method: 'vscode-extInfo',
        data: { setting: allSetting, globalState },
        success: true,
      });
    },

    /**
     * 添加新的 swagger 远程接口
     */
    addRemoteUrlList(newUrlList: any[]) {
      try {
        const remoteUrlList = getConfiguration('remoteUrlList');
        setConfiguration('remoteUrlList', remoteUrlList.concat(newUrlList));
        const latestRemoteUrlList = getConfiguration('remoteUrlList') || [];
        postMessage({
          method: 'vscode-addRemoteUrl',
          data: { remoteUrlList: latestRemoteUrlList },
          success: true,
        });
      } catch (err) {
        postMessage({
          method: 'vscode-addRemoteUrl',
          data: null,
          success: false,
        });
        vscode.window.showErrorMessage(`Swagger 远程接口添加失败: ${err}`);
      }
    },

    /**
     * 解析 swagger 接口
     */
    async parseSwaggerUrl(remoteUrl: string) {
      try {
        const apiResponse = await SwaggerParser.parse(remoteUrl);
        console.info('API name: %s, Version: %s', apiResponse.info.title, apiResponse.info.version);
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
    },

    /**
     * 发送当前工作空间目录树数据
     */
    sendCwdTreeData() {
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
    },

    /**
     * 当前 ts 生成进度
     */
    sendCurrentTsProgress(total: number, current: number) {
      postMessage({
        method: 'vscode-currentTsProgress',
        data: {
          total,
          current,
        },
        success: true,
      });
    },

    /**
     * OpenAPI2.0 转 ts
     */
    async generateAPIV2Ts(
      collection: SwaggerPathSchemaV2[],
      V2Document: OpenAPIV2.Document,
      outputPath: string,
      options: Partial<HandleSwaggerPathOptions>,
    ) {
      try {
        let tsDefs = '';
        const schemaCollection = await handleSwaggerPathV2(collection, V2Document, options);
        for (const [index, schema] of schemaCollection.entries()) {
          tsDefs += await generateTypescriptFromAPIV2(schema, V2Document);
          this.sendCurrentTsProgress(schemaCollection.length, index);
        }
        writeFileSync(outputPath as string, tsDefs, { encoding: 'utf-8' });
        postMessage({
          method: 'vscode-generateAPIV2Ts',
          data: true,
          success: true,
        });
      } catch (err) {
        postMessage({
          method: 'vscode-generateAPIV2Ts',
          data: null,
          success: false,
        });
        console.error('err', err);
        vscode.window.showErrorMessage(`Swagger2.0 Typescript 转换失败: ${err}`);
      }
    },
  };

  const tsFileWatcher = vscode.workspace.createFileSystemWatcher(
    // new vscode.RelativePattern(vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor?.document.uri), '/.(ts|tsx)$/'),
    '**/*.{ts,tsx}',
    false,
    false,
    false,
  );

  tsFileWatcher.onDidCreate((uri) => {
    console.info('[Typescript File Create]: ', uri.path);
    extensionService.sendCwdTreeData();
  });

  tsFileWatcher.onDidDelete((uri) => {
    console.info('[Typescript File Delete]: ', uri.path);
    extensionService.sendCwdTreeData();
  });

  return {
    extensionService,
    postMessage,
  };
};

export default extensionEvent;


export const parseSwaggerJson = async (swaggerJsonStr: string) => {
  const apiResponse = await SwaggerParser.parse(JSON.parse(swaggerJsonStr));
  return apiResponse;
}