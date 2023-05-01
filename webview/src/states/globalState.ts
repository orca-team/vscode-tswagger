import { RemoteUrlConfigItem } from '@/utils/types';
import { useSetState } from 'ahooks';
import { createStore } from 'hox';

export type ExtSettingType = {
  remoteUrlList: RemoteUrlConfigItem[];
};

export const [useGlobalState, GlobalStateProvider] = createStore(() => {
  const [extSetting, setExtSetting] = useSetState<ExtSettingType>({
    remoteUrlList: [],
  });
  //   const [cache]

  return {
    extSetting,
    setExtSetting,
  };
});
