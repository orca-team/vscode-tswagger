import { join } from 'path';
import * as vscode from 'vscode';

/**
 * 判断是否为开发环境
 */
export const isDev = process.env.NODE_ENV === 'development';

/**
 * 将文件路径转换为 webview URI 并返回
 * @param context - VS Code 扩展上下文
 * @param webviewPanel - webview 面板
 * @param path - 文件路径
 * @returns 文件的 webview URI
 */
export const getPathInVsCode = (context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, path: string): vscode.Uri => {
  return webviewPanel.webview.asWebviewUri(vscode.Uri.file(join(context.extensionPath, path)));
};

export const getConfiguration = <T = any>(configName: string = '') => {
  const settingsConfig = vscode.workspace.getConfiguration('SwaggerTypescriptGenerator');
  const config = settingsConfig.get(configName) ?? [];

  return config as T;
};

export const getAllConfiguration = (configNameList: string[] = []) => {
  const allConfigs: Record<string, any> = {};
  configNameList.forEach((configName) => {
    allConfigs[configName] = getConfiguration(configName);
  });
  return allConfigs;
};

export const setConfiguration = (configName: string, configValue: any) => {
  const settingsConfig = vscode.workspace.getConfiguration('SwaggerTypescriptGenerator');
  settingsConfig.update(configName, configValue, true);
};

export const getGlobalState = (context: vscode.ExtensionContext, key: string = '') => {
  return context.globalState.get(`SwaggerTypescriptGenerator${key ? `.${key}` : ''}`);
};

export const setGlobalState = (context: vscode.ExtensionContext, key: string = '', value: any) => {
  context.globalState.update(`SwaggerTypescriptGenerator${key ? `.${key}` : ''}`, value);
};
