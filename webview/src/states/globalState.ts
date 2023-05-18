import { RemoteUrlConfigItem } from '@/utils/types';
import { useSetState } from 'ahooks';
import { createGlobalStore } from 'hox';

export type ExtSettingType = {
  remoteUrlList: RemoteUrlConfigItem[];
};

export const [useGlobalState] = createGlobalStore(() => {
  const [extSetting, setExtSetting] = useSetState<ExtSettingType>({
    remoteUrlList: [],
  });
  //   const [cache]

  return {
    extSetting,
    setExtSetting,
  };
});
