export type WebviewMessage<P = any> = {
  method: `webview-${string}`;
  params: Record<string, P>;
};

// @ts-ignore
const vscode = acquireVsCodeApi();

/**
 * webview 发送消息（消息类型增强）
 * @param message webview 消息
 */
export const postMessage = (message: WebviewMessage) => {
  vscode.postMessage(message);
};
