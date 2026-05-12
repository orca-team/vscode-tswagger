import React, { useMemo, useState } from 'react';
import styles from './ProjectSwaggerUrlsModal.less';
import { Alert, Button, Form, Input, Modal, ModalProps, Select, Space, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useBoolean, useMemoizedFn } from 'ahooks';
import { useGlobalState } from '@/states/globalState';
import useGroupSwaggerDocService from '@/hooks/useGroupSwaggerDocService';
import { TSwaggerConfig } from '@tswagger/types';

const { Text } = Typography;

type ProjectSwaggerUrlItem = NonNullable<TSwaggerConfig['swaggerUrls']>[number];

type AddTargetState = {
  url: string;
  remark?: string;
};

export interface ProjectSwaggerUrlsModalProps extends ModalProps {
  swaggerUrls: NonNullable<TSwaggerConfig['swaggerUrls']>;
  onSelectSwaggerUrl?: (url: string) => void;
}

const ProjectSwaggerUrlsModal: React.FC<ProjectSwaggerUrlsModalProps> = (props) => {
  const { className = '', swaggerUrls, onCancel, onSelectSwaggerUrl, ...otherProps } = props;
  const { extSetting } = useGlobalState();
  const groupService = useGroupSwaggerDocService();
  const [form] = Form.useForm();
  const [pendingAddItem, setPendingAddItem] = useState<AddTargetState>();
  const [submitting, { setTrue: startSubmitting, setFalse: stopSubmitting }] = useBoolean(false);

  const validSwaggerUrls = useMemo(
    () => swaggerUrls.filter((item): item is ProjectSwaggerUrlItem => Boolean(item.url?.trim())).map((item) => ({ ...item, url: item.url!.trim() })),
    [swaggerUrls],
  );

  const legacyUrlSet = useMemo(() => new Set(extSetting.swaggerUrlList.map((item) => item.url)), [extSetting.swaggerUrlList]);

  const groupedUrlSet = useMemo(() => {
    const urls: string[] = [];
    extSetting.groupSwaggerDocList.forEach((group) => {
      group.docs.forEach((doc) => {
        urls.push(doc.url);
      });
    });
    return new Set(urls);
  }, [extSetting.groupSwaggerDocList]);

  const groupOptions = useMemo(
    () => extSetting.groupSwaggerDocList.map((group) => ({ label: group.name, value: group.id })),
    [extSetting.groupSwaggerDocList],
  );

  const handleSelectAddItem = useMemoizedFn((item: ProjectSwaggerUrlItem) => {
    setPendingAddItem({ url: item.url!.trim(), remark: item.remark?.trim() });
    form.resetFields();
  });

  const handleCancelAdd = useMemoizedFn(() => {
    setPendingAddItem(undefined);
    form.resetFields();
  });

  const handleUseSwaggerUrl = useMemoizedFn((url: string) => {
    onSelectSwaggerUrl?.(url);
    onCancel?.(undefined as any);
  });

  const handleAddToGroup = useMemoizedFn(async () => {
    if (!pendingAddItem) {
      return;
    }

    const values = (await form.validateFields().catch(() => undefined)) as { groupId?: string; groupName?: string } | undefined;
    if (!values) {
      return;
    }

    const groupName = values.groupName?.trim();
    let groupId = values.groupId;
    let targetGroupName = groupName;
    const selectedGroup = groupId ? extSetting.groupSwaggerDocList.find((group) => group.id === groupId) : undefined;
    if (selectedGroup) {
      targetGroupName = selectedGroup.name;
    }

    if (!groupId && !groupName) {
      form.setFields([
        { name: 'groupId', errors: ['请选择已有分组或输入新分组名称'] },
        { name: 'groupName', errors: ['请选择已有分组或输入新分组名称'] },
      ]);
      return;
    }

    startSubmitting();

    if (!groupId && groupName) {
      const existedGroup = extSetting.groupSwaggerDocList.find((group) => group.name === groupName);
      groupId = existedGroup?.id ?? undefined;
      targetGroupName = existedGroup?.name ?? groupName;
      if (!groupId) {
        const createdGroupResult = await groupService.createSwaggerDocGroup({ name: groupName });
        if (!createdGroupResult.success) {
          stopSubmitting();
          return;
        }
        groupId = createdGroupResult.groupId ?? undefined;
      }
    }

    if (!groupId) {
      stopSubmitting();
      return;
    }

    const addSuccess = await groupService.addGroupSwaggerDoc({
      groupId,
      groupName: targetGroupName,
      url: pendingAddItem.url,
      name: pendingAddItem.remark || undefined,
    });

    stopSubmitting();
    if (addSuccess) {
      handleCancelAdd();
    }
  });

  return (
    <Modal
      className={`${styles.root} ${className}`}
      title="当前工程接口文档配置"
      width={760}
      maskClosable={false}
      destroyOnClose
      footer={null}
      onCancel={onCancel}
      {...otherProps}
    >
      <Alert
        type="info"
        showIcon
        message="已检测到当前工程配置了 swaggerUrls，可在此查看并按需同步到用户 settings。"
        className={styles.intro}
      />
      <div className={styles.list}>
        {validSwaggerUrls.map((item, index) => {
          const legacyExists = legacyUrlSet.has(item.url);
          const groupedExists = groupedUrlSet.has(item.url);
          const existsInSettings = legacyExists || groupedExists;
          const statusText = existsInSettings ? '已存在于 settings' : '未存在于 settings';

          return (
            <div
              key={`${item.url}-${index}`}
              className={`${styles.row} ${existsInSettings ? styles.clickableRow : ''}`}
              onClick={existsInSettings ? () => handleUseSwaggerUrl(item.url) : undefined}
              role={existsInSettings ? 'button' : undefined}
              tabIndex={existsInSettings ? 0 : undefined}
              onKeyDown={
                existsInSettings
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleUseSwaggerUrl(item.url);
                      }
                    }
                  : undefined
              }
            >
              <div className={styles.rowMain}>
                <div className={styles.urlBlock}>
                  <Space size={8} align="start" className={styles.urlLine}>
                    <Tooltip title={statusText}>
                      {existsInSettings ? <CheckCircleOutlined className={styles.successIcon} /> : <CloseCircleOutlined className={styles.mutedIcon} />}
                    </Tooltip>
                    {existsInSettings ? (
                      <Text className={styles.url}>{item.url}</Text>
                    ) : (
                      <Text className={styles.url} copyable>
                        {item.url}
                      </Text>
                    )}
                  </Space>
                  {item.remark ? <Text type="secondary">{item.remark}</Text> : null}
                </div>
              </div>
              <div className={styles.rowAction}>
                {existsInSettings ? null : (
                  <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => handleSelectAddItem(item)}>
                    添加到分组
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {pendingAddItem ? (
        <div className={styles.addPanel}>
          <Text strong className={styles.addTitle}>
            添加到分组
          </Text>
          <Text type="secondary" className={styles.addTarget}>
            {pendingAddItem.url}
          </Text>
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item label="选择已有分组" name="groupId">
              <Select
                allowClear
                placeholder={groupOptions.length ? '请选择已有分组' : '当前暂无可选分组'}
                options={groupOptions}
                onChange={() => {
                  form.setFieldValue('groupName', undefined);
                  form.setFields([
                    { name: 'groupId', errors: [] },
                    { name: 'groupName', errors: [] },
                  ]);
                }}
              />
            </Form.Item>
            <Form.Item label="或新建分组" name="groupName" rules={[{ whitespace: true, message: '分组名称不能为空白字符' }]}>
              <Input
                placeholder="请输入新分组名称"
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue.trim()) {
                    form.setFieldValue('groupId', undefined);
                  }
                  form.setFields([
                    { name: 'groupId', errors: [] },
                    { name: 'groupName', errors: [] },
                  ]);
                }}
              />
            </Form.Item>
            <div className={styles.addActions}>
              <Button onClick={handleCancelAdd}>取消</Button>
              <Button type="primary" loading={submitting} onClick={handleAddToGroup}>
                确认添加
              </Button>
            </div>
          </Form>
        </div>
      ) : null}
    </Modal>
  );
};

export default ProjectSwaggerUrlsModal;
