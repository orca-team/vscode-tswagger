import { WebviewPanel } from 'vscode';

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
 * 简单封装一下 vscode 的收发消息方法
 * @param panel - webview 面板
 * @returns 封装过后的 vscode 消息事件方法
 */
const extensionEvent = (panel: WebviewPanel) => {
  const { webview } = panel;

  const { onDidReceiveMessage } = webview;

  const postMessage = (message: ExtensionMessage) => {
    webview.postMessage(message);
  };

  return {
    postMessage,
    onDidReceiveMessage,
  };
};

export default extensionEvent;
