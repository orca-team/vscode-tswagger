import { VsCodeMessage } from '@/hooks/useMessageListener';
import { notification } from 'antd';
notification.config({});

export type WebviewMessage<P = any> = {
  method: `webview-${string}`;
  params?: Record<string, P>;
};

export type FetchResult<D = any> = {
  token?: string;
  method: string;
  data: D;
  success: boolean;
  errMsg?: string;
};


// @ts-ignore
const vscode = window['acquireVsCodeApi']?.();

/**
 * webview 发送消息（消息类型增强）
 * @param message webview 消息
 */
export const postMessage = (message: WebviewMessage) => {
  if (vscode) {
    vscode?.postMessage(message);
  } else {
    notification.info({
      message: '非 vscode 环境提示',
      description: message.method,
    });
  }
};

const timeout = (ms: number) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => reject(new Error(`Call Service timeout ${ms}ms.`)), ms);
  });

/**
 * 調用 vscode 後端方法（模擬 http 請求）
 * @param method 方法名稱
 * @param params 參數
 * @returns
 */
export const callService = async <T>(method: string, params?: any): Promise<T> => {
  const token = `${Date.now()}_${Math.random()}`;
  let promiseResolve: (value: T) => void;
  const callback = (event: MessageEvent) => {
    const vscodeMsg: VsCodeMessage<T> = event.data;
    console.log(vscodeMsg, token, vscodeMsg.token == token, promiseResolve);
    if (vscodeMsg.token == token) {
      if (promiseResolve) {
        promiseResolve(event.data);
      }
    }
  };

  return new Promise<T>((resolve, reject) => {
    if (vscode) {
      promiseResolve = resolve;
      window.addEventListener('message', callback);
      vscode?.postMessage({
        token,
        method,
        params,
      });
    } else {
      notification.info({
        message: '非 vscode 环境提示',
        description: method,
      });
      // mock
      resolve({} as T);
    }
    timeout(10000).catch(reject);
  }).finally(() => {
    window.removeEventListener('message', callback);
  });
};
