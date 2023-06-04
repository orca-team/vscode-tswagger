import { SwaggerUrlConfigItem } from '@/utils/types';
import { useSetState } from 'ahooks';
import { createGlobalStore } from 'hox';

export type ExtSettingType = {
  swaggerUrlList: SwaggerUrlConfigItem[];
};

export const [useGlobalState] = createGlobalStore(() => {
  const [extSetting, setExtSetting] = useSetState<ExtSettingType>({
    swaggerUrlList: [],
  });

  return {
    extSetting,
    setExtSetting,
  };
});
