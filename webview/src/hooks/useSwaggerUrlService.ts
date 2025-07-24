import { apiAddSwaggerUrl, apiDelSwaggerUrl, apiUpdateSwaggerUrl, apiUpdateSwaggerUrlList } from '@/services';
import { useGlobalState } from '@/states/globalState';
import notification from '@/utils/notification';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useMemoizedFn } from 'ahooks';

const generateKey = () => {
  return Date.now();
};

export interface UseSwaggerUrlServiceProps {}

function useSwaggerUrlService(props: UseSwaggerUrlServiceProps = {}) {
  const { setExtSetting } = useGlobalState();

  const addSwaggerUrl = useMemoizedFn(async (item: Omit<SwaggerUrlConfigItem, 'id'>) => {
    const resp = await apiAddSwaggerUrl({ ...item, key: generateKey() });
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

  const updateSwaggerUrlList = useMemoizedFn(async (list: SwaggerUrlConfigItem[]) => {
    const mergedList = list.map((item) => ({ ...item, key: item.key ?? generateKey() }));
    const resp = await apiUpdateSwaggerUrlList(mergedList);
    if (resp.success) {
      setExtSetting({
        swaggerUrlList: resp.data ?? [],
      });
      notification.success('未分组的文档地址列表更新成功');
    } else {
      notification.error('更新失败请稍后再试');
    }
  });

  return {
    generateKey,
    addSwaggerUrl,
    delSwaggerUrl,
    updateSwaggerUrl,
    updateSwaggerUrlList,
  };
}

export default useSwaggerUrlService;
