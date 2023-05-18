import { useEventListener } from "ahooks";

export type VsCodeMessage<D = any> = {
  token?: string;
  method: string;
  data: Record<string, D>;
  success: boolean;
  errMsg?: string;
};

export type MessageCallback = (vscodeMsg: VsCodeMessage) => void;

function useMessageListener(callback: MessageCallback) {
  useEventListener("message", (event) => {
    callback(event.data);
  });
}

export default useMessageListener;
