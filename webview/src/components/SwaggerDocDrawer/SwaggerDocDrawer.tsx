import React, { useState, useRef, useMemo } from 'react';
import styles from './SwaggerDocDrawer.module.less';
import { Button, Drawer, DrawerProps, Space, Collapse, Input, Popconfirm, theme, Empty, Badge, Tooltip, Alert, Modal } from 'antd';
import { useGlobalState } from '@/states/globalState';
import { PlusOutlined, DeleteOutlined, EditOutlined, FolderAddOutlined, SwapOutlined, InfoCircleOutlined } from '@ant-design/icons';
import useSwaggerUrlService from '@/hooks/useSwaggerUrlService';
import useGroupSwaggerDocService from '@/hooks/useGroupSwaggerDocService';
import DocCard from './DocCard';
import DocModal from './DocModal';
import ActionIcon from '@/components/ActionIcon';
import { useMemoizedFn } from 'ahooks';
import { SwaggerUrlConfigItem, GroupedSwaggerDocItem, SwaggerDocGroup, GroupedSwaggerDocList } from '@/utils/types';
import { SwaggerDocDrawerContext } from './context';
import { isEqual } from 'lodash-es';
import notification from '@/utils/notification';
import { SortableList } from '@orca-fe/dnd';
import { usePromisifyModal } from '@orca-fe/hooks';

type EditingDocData = {
  groupId: string;
  docIndex: number;
  isNew?: boolean;
  data?: Partial<SwaggerUrlConfigItem>;
};

const { Panel } = Collapse;

export interface SwaggerDocDrawerProps extends Omit<DrawerProps, 'onClose'> {
  onClose?: () => void;
  onSaveSuccess?: () => void;
}

const UNGROUPED_ID = 'ungrouped';
const UNGROUPED_NAME = '未分组';

const SwaggerDocDrawer = (props: SwaggerDocDrawerProps) => {
  const { className = '', onClose, onSaveSuccess, ...otherProps } = props;
  const modal = usePromisifyModal();
  const { token } = theme.useToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const { extSetting } = useGlobalState();

  // 状态管理
  const [groupSwaggerDocList, setGroupSwaggerDocList] = useState<GroupedSwaggerDocList>(extSetting.groupSwaggerDocList || []);
  const [swaggerUrlList, setSwaggerUrlList] = useState<Partial<SwaggerUrlConfigItem>[]>(extSetting.swaggerUrlList);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  // 当前编辑的文档信息
  const [editingDoc, setEditingDoc] = useState<EditingDocData | null>(null);

  // URL 验证逻辑
  const validateUrl = useMemoizedFn((url: string, editingDocData: Pick<EditingDocData, 'groupId' | 'docIndex' | 'isNew'>) => {
    const { groupId, docIndex, isNew } = editingDocData;

    if (groupId === UNGROUPED_ID) {
      const exists = swaggerUrlList.some((doc, index) => (isNew || index !== docIndex) && doc.url === url);
      return exists ? '当前组中已存在相同地址的文档' : undefined;
    } else {
      const currentGroup = groupSwaggerDocList.find((group) => group.id === groupId);
      if (currentGroup) {
        const exists = currentGroup.docs.some((doc, index) => (isNew || index !== docIndex) && doc.url === url);
        return exists ? '当前组中已存在相同地址的文档' : undefined;
      }
    }
    return undefined;
  });

  const swaggerService = useSwaggerUrlService();
  const groupService = useGroupSwaggerDocService();

  // 保存原始数据用于比较
  const originalGroupDataRef = useRef(extSetting.groupSwaggerDocList || []);
  const originalSwaggerDataRef = useRef(extSetting.swaggerUrlList);

  // 合并未分组数据到分组列表中
  const mergedGroupList = useMemo(() => {
    const groups = [...groupSwaggerDocList];

    // 如果有未分组的数据，添加到列表末尾
    if (swaggerUrlList.length > 0) {
      const ungroupedGroup: SwaggerDocGroup = {
        id: UNGROUPED_ID,
        name: UNGROUPED_NAME,
        docs: swaggerUrlList.map((item) => ({
          ...item,
          // 不需要额外赋予 groupId，没有 groupId 的就是未分组
        })) as GroupedSwaggerDocItem[],
      };
      groups.push(ungroupedGroup);
    }

    return groups;
  }, [groupSwaggerDocList, swaggerUrlList]);

  // 检查是否有未保存的更改
  const hasUnsavedChanges = useMemoizedFn(() => {
    return !isEqual(groupSwaggerDocList, originalGroupDataRef.current) || !isEqual(swaggerUrlList, originalSwaggerDataRef.current);
  });

  // 检查是否有正在编辑的项
  const hasEditingItems = useMemoizedFn(() => {
    return editingGroupId !== null;
  });

  // 处理保存
  const handleSave = useMemoizedFn(async () => {
    if (hasEditingItems()) {
      notification.warning('有未保存的更改');
      return;
    }

    // 检查分组数据是否有变更
    const groupDataChanged = !isEqual(groupSwaggerDocList, originalGroupDataRef.current);
    // 检查未分组数据是否有变更
    const swaggerDataChanged = !isEqual(swaggerUrlList, originalSwaggerDataRef.current);

    // 只保存有变更的数据
    if (groupDataChanged) {
      await groupService.updateGroupSwaggerDocList(groupSwaggerDocList);
    }
    if (swaggerDataChanged) {
      await swaggerService.updateSwaggerUrlList(swaggerUrlList as SwaggerUrlConfigItem[]);
    }

    onSaveSuccess?.();
    onClose?.();
  });

  // 处理关闭
  const handleClose = useMemoizedFn(() => {
    if (hasUnsavedChanges()) {
      Modal.confirm({
        title: '确认关闭',
        content: '有未保存的更改，是否确认关闭？',
        onOk: () => {
          onClose?.();
        },
      });
      return;
    }
    onClose?.();
  });

  // 创建新分组
  const handleCreateGroup = useMemoizedFn(() => {
    if (!newGroupName.trim()) {
      notification.warning('请输入分组名称');
      return;
    }

    const newGroup: SwaggerDocGroup = {
      id: groupService.generateGroupId(),
      name: newGroupName.trim(),
      docs: [],
    };

    // 新增的分组置于前面
    setGroupSwaggerDocList([newGroup, ...groupSwaggerDocList]);
    setNewGroupName('');
  });

  // 删除分组
  const handleDeleteGroup = useMemoizedFn((groupId: string) => {
    const group = groupSwaggerDocList.find((g) => g.id === groupId);
    if (group && group.docs.length > 0) {
      notification.warning('分组中还有文档，请先移除所有文档后再删除分组');
      return;
    }

    setGroupSwaggerDocList(groupSwaggerDocList.filter((g) => g.id !== groupId));
  });

  // 重命名分组
  const handleRenameGroup = useMemoizedFn((groupId: string, newName: string) => {
    if (!newName.trim()) {
      notification.warning('分组名称不能为空');
      return;
    }

    setGroupSwaggerDocList(groupSwaggerDocList.map((group) => (group.id === groupId ? { ...group, name: newName.trim() } : group)));
    setEditingGroupId(null);
  });

  // 添加文档到分组
  const handleAddDocToGroup = useMemoizedFn(async (groupId: string) => {
    const newDoc: Partial<SwaggerUrlConfigItem> = {
      key: groupService.generateKey(),
    };

    let editingDocData: EditingDocData;
    if (groupId === UNGROUPED_ID) {
      const docIndex = swaggerUrlList.length;
      editingDocData = {
        groupId,
        docIndex,
        data: newDoc,
        isNew: true,
      };
    } else {
      const group = groupSwaggerDocList.find((g) => g.id === groupId);
      const docIndex = group ? group.docs.length : 0;
      editingDocData = {
        groupId,
        docIndex,
        data: { ...newDoc, groupId } as Partial<GroupedSwaggerDocItem>,
        isNew: true,
      };
    }

    setEditingDoc(editingDocData);

    try {
      const newDocData = await modal.show<SwaggerUrlConfigItem>(
        <DocModal
          title="添加文档"
          data={editingDocData.data}
          validateUrl={(url: string) =>
            validateUrl(url, { groupId: editingDocData.groupId, docIndex: editingDocData.docIndex, isNew: editingDocData.isNew })
          }
        />,
      );

      if (newDocData && newDocData.key && newDocData.url) {
        handleSaveDoc(newDocData);
      }
    } catch (error) {
      // 用户取消了操作
    } finally {
      setEditingDoc(null);
    }
  });

  // 删除文档
  const handleDeleteDoc = useMemoizedFn((groupId: string, docIndex: number) => {
    if (groupId === UNGROUPED_ID) {
      setSwaggerUrlList(swaggerUrlList.filter((_, i) => i !== docIndex));
    } else {
      setGroupSwaggerDocList(
        groupSwaggerDocList.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              docs: group.docs.filter((_, i) => i !== docIndex),
            };
          }
          return group;
        }),
      );
    }
  });

  // 编辑文档
  const handleEditDoc = useMemoizedFn(async (groupId: string, docIndex: number) => {
    const isUngrouped = groupId === UNGROUPED_ID;
    const docs = isUngrouped ? swaggerUrlList : groupSwaggerDocList.find((g) => g.id === groupId)?.docs || [];
    const docData = docs[docIndex];

    const editingDocData: EditingDocData = {
      groupId,
      docIndex,
      data: docData,
      isNew: false,
    };

    setEditingDoc(editingDocData);

    try {
      const updatedDocData = await modal.show<SwaggerUrlConfigItem>(
        <DocModal
          title="编辑文档"
          data={editingDocData.data}
          validateUrl={(url: string) =>
            validateUrl(url, { groupId: editingDocData.groupId, docIndex: editingDocData.docIndex, isNew: editingDocData.isNew })
          }
        />,
      );

      if (updatedDocData && updatedDocData.key && updatedDocData.url) {
        handleSaveDoc(updatedDocData);
      }
    } catch (error) {
      // 用户取消了操作
    } finally {
      setEditingDoc(null);
    }
  });

  // 移动文档到其他分组
  const handleMoveDocToGroup = useMemoizedFn((sourceGroupId: string, docIndex: number, targetGroupId: string) => {
    const isSourceUngrouped = sourceGroupId === UNGROUPED_ID;
    const sourceDocs = isSourceUngrouped ? swaggerUrlList : groupSwaggerDocList.find((g) => g.id === sourceGroupId)?.docs || [];
    const docData = sourceDocs[docIndex];

    if (!docData) {
      notification.error('文档不存在');
      return;
    }

    if (targetGroupId === sourceGroupId) {
      return;
    }

    // 从源分组中删除文档
    if (isSourceUngrouped) {
      setSwaggerUrlList(swaggerUrlList.filter((_, i) => i !== docIndex));
    } else {
      setGroupSwaggerDocList(
        groupSwaggerDocList.map((group) => {
          if (group.id === sourceGroupId) {
            return {
              ...group,
              docs: group.docs.filter((_, i) => i !== docIndex),
            };
          }
          return group;
        }),
      );
    }

    // 添加到目标分组
    if (targetGroupId === UNGROUPED_ID) {
      // 移动到未分组，移除 groupId
      const { groupId, ...docWithoutGroupId } = docData as GroupedSwaggerDocItem;
      setSwaggerUrlList([...swaggerUrlList, docWithoutGroupId]);
    } else {
      // 移动到指定分组，设置 groupId
      const docWithGroupId = { ...docData, groupId: targetGroupId } as GroupedSwaggerDocItem;
      setGroupSwaggerDocList(
        groupSwaggerDocList.map((group) => {
          if (group.id === targetGroupId) {
            return {
              ...group,
              docs: [...group.docs, docWithGroupId],
            };
          }
          return group;
        }),
      );
    }

    notification.success('文档移动成功');
  });

  // 获取可移动的目标分组选项
  const getMoveTargetOptions = useMemoizedFn((sourceGroupId: string) => {
    return [
      { label: UNGROUPED_NAME, value: UNGROUPED_ID },
      ...groupSwaggerDocList.map((group) => ({ label: group.name, value: group.id })),
    ].filter((option) => option.value !== sourceGroupId);
  });

  // 保存文档
  const handleSaveDoc = useMemoizedFn((data: SwaggerUrlConfigItem) => {
    if (!editingDoc) {
      return false;
    }

    const { groupId, docIndex, isNew } = editingDoc;

    if (groupId === UNGROUPED_ID) {
      // 未分组文档不设置 groupId
      if (isNew) {
        setSwaggerUrlList([...swaggerUrlList, data]);
      } else {
        setSwaggerUrlList((prev) => {
          const newList = [...prev];
          newList[docIndex] = data;
          return newList;
        });
      }
    } else {
      // 分组文档设置对应的 groupId
      const docWithGroupId = { ...data, groupId } as GroupedSwaggerDocItem;
      if (isNew) {
        setGroupSwaggerDocList(
          groupSwaggerDocList.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                docs: [...group.docs, docWithGroupId],
              };
            }
            return group;
          }),
        );
      } else {
        setGroupSwaggerDocList(
          groupSwaggerDocList.map((group) => {
            if (group.id === groupId) {
              const newDocs = [...group.docs];
              newDocs[docIndex] = docWithGroupId;
              return {
                ...group,
                docs: newDocs,
              };
            }
            return group;
          }),
        );
      }
    }

    return true;
  });

  // 渲染分组内容
  const renderGroupContent = useMemoizedFn((group: SwaggerDocGroup) => {
    const isUngrouped = group.id === UNGROUPED_ID;
    const docs = isUngrouped ? swaggerUrlList : group.docs;
    const hasOtherGroups = groupSwaggerDocList.length > 0 || (isUngrouped && groupSwaggerDocList.length > 0);

    return (
      <div className={styles.groupContent}>
        {/* 未分组提示信息 */}
        {isUngrouped && docs.length > 0 && (
          <Alert
            message="未分组的文档是为了兼容旧版本配置，推荐使用分组管理功能来更好地组织您的文档。"
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            banner
            style={{ marginBottom: 12, fontSize: '12px' }}
            closable
          />
        )}
        <div className={styles.docList}>
          {docs.length === 0 ? (
            <Empty description="暂无文档信息" />
          ) : (
            <SortableList data={docs} customHandle>
              {(doc, index) => {
                const editingKey = `${group.id}_${index}`;
                return (
                  <div key={editingKey} className={styles.docItem} style={{ marginTop: index ? 8 : 0 }}>
                    <DocCard
                      data={doc}
                      onEdit={() => handleEditDoc(group.id, index)}
                      onDelete={() => handleDeleteDoc(group.id, index)}
                      onMove={hasOtherGroups ? (targetGroupId) => handleMoveDocToGroup(group.id, index, targetGroupId) : undefined}
                      moveTargetOptions={hasOtherGroups ? getMoveTargetOptions(group.id) : undefined}
                    />
                  </div>
                );
              }}
            </SortableList>
          )}
        </div>
      </div>
    );
  });

  // 渲染标题栏
  const renderTitle = () => {
    const hasChanges = hasUnsavedChanges();
    return (
      <Space>
        <span>Swagger 文档地址管理</span>
        <Tooltip title={hasChanges ? '有未保存的更改' : '文档列表是最新的'}>
          <Badge status={hasChanges ? 'warning' : 'success'} className={hasChanges ? styles.pulsingBadge : ''} />
        </Tooltip>
      </Space>
    );
  };

  return (
    <Drawer
      className={`${styles.root} ${className}`}
      title={renderTitle()}
      width="80%"
      maskClosable={false}
      onClose={handleClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        </div>
      }
      {...otherProps}
    >
      {modal.instance}
      <div className={styles.container} ref={containerRef}>
        <div className={styles.groupedContent}>
          {/* 创建新分组 */}
          <div className={styles.createGroup} style={{ borderColor: token.colorBorder }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入新分组名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onPressEnter={handleCreateGroup}
              />
              <Button type="primary" icon={<FolderAddOutlined />} onClick={handleCreateGroup}>
                创建分组
              </Button>
            </Space.Compact>
          </div>

          {/* 分组列表 */}
          <div className={styles.groupList}>
            <SwaggerDocDrawerContext.Provider value={{ swaggerUrlList: [] }}>
              <Collapse defaultActiveKey={mergedGroupList.map((g) => g.id)}>
                {mergedGroupList.map((group) => (
                  <Panel
                    key={group.id}
                    header={
                      editingGroupId === group.id ? (
                        <Input
                          size="small"
                          defaultValue={group.name}
                          onPressEnter={(e) => handleRenameGroup(group.id, (e.target as HTMLInputElement).value)}
                          onBlur={(e) => handleRenameGroup(group.id, e.target.value)}
                          autoFocus
                          style={{ width: 200 }}
                        />
                      ) : (
                        <Space>
                          <span>{group.name}</span>
                          <span className={styles.docCount}>({group.docs.length})</span>
                        </Space>
                      )
                    }
                    extra={
                      <Space
                        size="small"
                        split={group.id !== UNGROUPED_ID ? <span style={{ color: '#d9d9d9' }}>|</span> : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {/* 文档操作 */}
                        <ActionIcon
                          icon={<PlusOutlined />}
                          title="添加文档"
                          onClick={() => handleAddDocToGroup(group.id)}
                          style={{ color: '#1890ff' }}
                        />
                        {/* 分组操作 */}
                        {group.id !== UNGROUPED_ID && (
                          <>
                            <ActionIcon
                              icon={<EditOutlined />}
                              title="编辑分组名称"
                              onClick={() => setEditingGroupId(group.id)}
                              type="text"
                              style={{ color: '#52c41a' }}
                            />
                            <Popconfirm title="确认删除此分组？" onConfirm={() => handleDeleteGroup(group.id)} disabled={group.docs.length > 0}>
                              <ActionIcon
                                icon={<DeleteOutlined />}
                                title="删除分组"
                                disabled={group.docs.length > 0}
                                type="text"
                                style={{ color: group.docs.length > 0 ? '#d9d9d9' : '#ff4d4f' }}
                              />
                            </Popconfirm>
                          </>
                        )}
                      </Space>
                    }
                  >
                    {renderGroupContent(group)}
                  </Panel>
                ))}
              </Collapse>
            </SwaggerDocDrawerContext.Provider>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default SwaggerDocDrawer;
