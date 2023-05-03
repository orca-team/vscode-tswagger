import * as vscode from 'vscode';
import { getAllConfiguration, getConfiguration, getGlobalState, setConfiguration } from './utils/vscodeUtil';
import { getGlobalContext } from './globalContext';
import dirTree from 'directory-tree';
import SwaggerParser from '@apidevtools/swagger-parser';

/**
 * vscode 发送消息类型，固定以 `vscode` 开头
 */
export type ExtensionMessage<D = any> = {
  method: `vscode-${string}`;
  data: Record<string, D> | null;
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
  };

  return {
    extensionService,
    postMessage,
  };
};

export default extensionEvent;
