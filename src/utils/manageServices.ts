import * as vscode from 'vscode';

/**
 * 接管panel 中
 */
export function manageServicesFromPanel(webview: vscode.Webview) {
  return function registerService(serviceMethod: string, callback: (params: any) => Promise<any>) {
    webview.onDidReceiveMessage(async (message) => {
      const { method, token, params } = message;
      if (serviceMethod === method) {
        try {
          const result = await callback(params);
          webview.postMessage({
            token,
            method,
            errMsg: 'success',
            data: result,
            success: true,
          });
        } catch (error: any) {
          webview.postMessage({
            token,
            method,
            errMsg: error.message,
            data: null,
            success: false,
          });
        }
      }
    });
  };
}
