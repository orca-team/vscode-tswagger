import { SwaggerUrlConfigItem } from '@/utils/types';
import { useSetState } from 'ahooks';
import { createGlobalStore } from 'hox';
import { TSwaggerConfig, TranslateEngine } from '../../../src/types';

export type ExtTranslationConfig = {
  engine: TranslateEngine;

  'Ocp-Apim-Subscription-Key'?: string;

  Authorization?: string;
};

export type ExtSettingType = {
  /**
   * swagger 接口文档地址信息
   */
  swaggerUrlList: SwaggerUrlConfigItem[];

  /** 翻译配置信息 */
  translation: ExtTranslationConfig;
};

/**
 * 全局状态
 * 存放用户插件配置和变量等数据
 */
export const [useGlobalState] = createGlobalStore(() => {
  // 插件 settings 配置
  const [extSetting, setExtSetting] = useSetState<ExtSettingType>({
    swaggerUrlList: [],
    translation: {
      engine: 'Bing',
    },
  });
  // 当前项目配置
  const [tswaggerConfig, setTswaggerConfig] = useSetState<TSwaggerConfig>({});

  return {
    extSetting,
    setExtSetting,
    tswaggerConfig,
    setTswaggerConfig,
  };
});
