import { apiAddSwaggerUrl, apiDelSwaggerUrl, apiUpdateSwaggerUrl } from '@/services';
import { useGlobalState } from '@/states/globalState';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import React from 'react';

export interface UseSwaggerUrlServiceProps {}

function useSwaggerUrlService(props: UseSwaggerUrlServiceProps = {}) {
  const { setExtSetting } = useGlobalState();

  const addSwaggerUrl = useMemoizedFn(async (item: Omit<SwaggerUrlConfigItem, 'id'>) => {
    const resp = await apiAddSwaggerUrl({ ...item, id: Date.now() });
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      message.success(`${item.name || item.url} 新增成功`);
    } else {
      message.error('新增失败请稍后再试');
    }
  });

  const delSwaggerUrl = useMemoizedFn(async (item: SwaggerUrlConfigItem) => {
    const resp = await apiDelSwaggerUrl(item);
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      message.success(`${item.name || item.url} 删除成功`);
    } else {
      message.error('删除失败请稍后再试');
    }
  });

  const updateSwaggerUrl = useMemoizedFn(async (item: SwaggerUrlConfigItem) => {
    const resp = await apiUpdateSwaggerUrl(item);
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      message.success(`${item.name || item.url} 更新成功`);
    } else {
      message.error('更新失败请稍后再试');
    }
  });

  return {
    addSwaggerUrl,
    delSwaggerUrl,
    updateSwaggerUrl,
  };
}

export default useSwaggerUrlService;
