import * as vscode from 'vscode';

/**
 * 接管panel 中
 */
export function manageServicesFromPanel(webview: vscode.Webview) {
  return function registerService(serviceMethod: string, callback: (params: any) => Promise<any>) {
    webview.onDidReceiveMessage(async (message) => {
      console.info('[Message from umi webview]: ', message.method);
      console.info(message);
      const { method, token, params } = message;
      if (serviceMethod === method) {
        try {
          const result = await callback(params);
          console.log(`call ${method} success.`, token);
          webview.postMessage({
            token,
            method,
            errMsg: 'success',
            data: result,
            success: true,
          });
        } catch (error: any) {
          console.log(`call ${method} error.`);
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
