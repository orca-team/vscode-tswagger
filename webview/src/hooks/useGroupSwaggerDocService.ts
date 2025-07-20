import {
  apiAddGroupSwaggerDoc,
  apiDelGroupSwaggerDoc,
  apiUpdateGroupSwaggerDoc,
  apiUpdateSwaggerDocGroup,
  apiUpdateGroupSwaggerDocList,
  apiCreateSwaggerDocGroup,
  apiDeleteSwaggerDocGroup,
} from '@/services';
import { useGlobalState } from '@/states/globalState';
import notification from '@/utils/notification';
import { GroupedSwaggerDocItem, SwaggerDocGroup, GroupedSwaggerDocList } from '@/utils/types';
import { useMemoizedFn } from 'ahooks';

const generateKey = () => {
  return Date.now();
};

const generateGroupId = () => {
  return `group_${Date.now()}`;
};

export interface UseGroupSwaggerDocServiceProps {}

function useGroupSwaggerDocService(props: UseGroupSwaggerDocServiceProps = {}) {
  const { setExtSetting } = useGlobalState();

  // 添加分组文档
  const addGroupSwaggerDoc = useMemoizedFn(async (item: Omit<GroupedSwaggerDocItem, 'key'>) => {
    const docData = { ...item, key: generateKey() };
    const resp = await apiAddGroupSwaggerDoc(docData);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success(`${item.name || item.url} 添加到分组成功`);
    } else {
      notification.error('添加失败请稍后再试');
    }
  });

  // 删除分组文档
  const delGroupSwaggerDoc = useMemoizedFn(async (item: GroupedSwaggerDocItem) => {
    const resp = await apiDelGroupSwaggerDoc(item);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success(`${item.name || item.url} 删除成功`);
    } else {
      notification.error('删除失败请稍后再试');
    }
  });

  // 更新分组文档
  const updateGroupSwaggerDoc = useMemoizedFn(async (item: GroupedSwaggerDocItem) => {
    const resp = await apiUpdateGroupSwaggerDoc(item);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success(`${item.name || item.url} 更新成功`);
    } else {
      notification.error('更新失败请稍后再试');
    }
  });

  // 更新分组信息
  const updateSwaggerDocGroup = useMemoizedFn(async (group: SwaggerDocGroup) => {
    const resp = await apiUpdateSwaggerDocGroup(group);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success(`分组 ${group.name} 更新成功`);
    } else {
      notification.error('更新分组失败请稍后再试');
    }
  });

  // 全量更新分组文档列表
  const updateGroupSwaggerDocList = useMemoizedFn(async (list: GroupedSwaggerDocList) => {
    const resp = await apiUpdateGroupSwaggerDocList(list);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success('分组文档列表更新成功');
    } else {
      notification.error('更新失败请稍后再试');
    }
  });

  // 创建新分组
  const createSwaggerDocGroup = useMemoizedFn(async (groupData: Omit<SwaggerDocGroup, 'id' | 'docs'>) => {
    const newGroup = {
      ...groupData,
      id: generateGroupId(),
    };
    const resp = await apiCreateSwaggerDocGroup(newGroup);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success(`分组 ${groupData.name} 创建成功`);
      return newGroup.id;
    } else {
      notification.error('创建分组失败请稍后再试');
      return null;
    }
  });

  // 删除分组
  const deleteSwaggerDocGroup = useMemoizedFn(async (groupId: string, groupName?: string) => {
    const resp = await apiDeleteSwaggerDocGroup(groupId);
    if (resp.success) {
      setExtSetting({
        groupSwaggerDocList: resp.data ?? [],
      });
      notification.success(`分组 ${groupName || groupId} 删除成功`);
    } else {
      notification.error('删除分组失败请稍后再试');
    }
  });

  return {
    generateKey,
    generateGroupId,
    addGroupSwaggerDoc,
    delGroupSwaggerDoc,
    updateGroupSwaggerDoc,
    updateSwaggerDocGroup,
    updateGroupSwaggerDocList,
    createSwaggerDocGroup,
    deleteSwaggerDocGroup,
  };
}

export default useGroupSwaggerDocService;