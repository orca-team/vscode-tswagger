import { apiAddSwaggerUrl, apiDelSwaggerUrl, apiUpdateSwaggerUrl } from '@/services';
import { useGlobalState } from '@/states/globalState';
import notification from '@/utils/notification';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useMemoizedFn } from 'ahooks';

export interface UseSwaggerUrlServiceProps {}

function useSwaggerUrlService(props: UseSwaggerUrlServiceProps = {}) {
  const { setExtSetting } = useGlobalState();

  const addSwaggerUrl = useMemoizedFn(async (item: Omit<SwaggerUrlConfigItem, 'id'>) => {
    const resp = await apiAddSwaggerUrl({ ...item, key: Date.now() });
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      notification.success(`${item.name || item.url} 新增成功`);
    } else {
      notification.error('新增失败请稍后再试');
    }
  });

  const delSwaggerUrl = useMemoizedFn(async (item: SwaggerUrlConfigItem) => {
    const resp = await apiDelSwaggerUrl(item);
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      notification.success(`${item.name || item.url} 删除成功`);
    } else {
      notification.error('删除失败请稍后再试');
    }
  });

  const updateSwaggerUrl = useMemoizedFn(async (item: SwaggerUrlConfigItem) => {
    const resp = await apiUpdateSwaggerUrl(item);
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      notification.success(`${item.name || item.url} 更新成功`);
    } else {
      notification.error('更新失败请稍后再试');
    }
  });

  return {
    addSwaggerUrl,
    delSwaggerUrl,
    updateSwaggerUrl,
  };
}

export default useSwaggerUrlService;
