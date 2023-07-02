import React, { useEffect } from 'react';
import styles from './ResultRenameDrawer.less';
import {
  Typography,
  Collapse,
  Drawer,
  DrawerProps,
  Space,
  Button,
  Descriptions,
  Empty,
  Form,
  theme,
  Divider,
  notification,
  Popconfirm,
  message,
} from 'antd';
import { ApiGroupNameMapping, NameMappingByGroup, RenameMapping } from '../../../../../src/types';
import { SyncOutlined, TagFilled } from '@ant-design/icons';
import MethodTag from '../../MethodTag';
import { isPlainObject } from 'lodash-es';
import RenameText from '../RenameText';
import { useBoolean, useMemoizedFn } from 'ahooks';
import { FetchResult } from '@/utils/vscode';
import { V2TSGenerateResult } from '@/services';

const { Text } = Typography;

const convertNameMappingList = (nameMappingList: ApiGroupNameMapping[]) => {
  const allGroupName = [...new Set(nameMappingList.map((name) => name.groupName))];
  const newGroup: NameMappingByGroup[] = [];
  allGroupName.forEach((groupName) => {
    newGroup.push({
      groupName,
      group: nameMappingList.filter((name) => name.groupName === groupName),
    });
  });

  return newGroup;
};

export interface ResultRenameDrawerProps extends Omit<DrawerProps, 'onClose'> {
  renameTypescript: (renameMapping: RenameMapping) => Promise<FetchResult<V2TSGenerateResult>>;
  nameMappingList?: ApiGroupNameMapping[];
  allDefNameMapping?: Record<string, string>;
  onClose?: () => void;
  onAfterRenameTs?: (result: V2TSGenerateResult) => void;
}

const ResultRenameDrawer: React.FC<ResultRenameDrawerProps> = (props) => {
  const { className = '', nameMappingList, allDefNameMapping = {}, onClose, onAfterRenameTs, renameTypescript, ...otherProps } = props;

  const { token } = theme.useToken();
  const [form] = Form.useForm<RenameMapping>();

  const [generateLoading, { setTrue: startGenerateLoading, setFalse: stopGenerateLoading }] = useBoolean(false);

  const handleReGenTypescript = useMemoizedFn(async () => {
    startGenerateLoading();
    const renameMapping = form.getFieldsValue();
    const resp = await renameTypescript(renameMapping);
    stopGenerateLoading();

    if (resp.success) {
      message.success('Typescript 重新生成成功');
      onClose?.();
      onAfterRenameTs?.(resp.data);
    } else {
      notification.error({ message: resp.errMsg ?? 'Typescript 重新生成失败，请稍后再试', duration: null });
    }
  });

  useEffect(() => {
    form.setFieldValue('nameGroup', convertNameMappingList(nameMappingList ?? []));
  }, [nameMappingList]);

  useEffect(() => {
    form.setFieldValue('allDefNameMapping', allDefNameMapping);
  }, [allDefNameMapping]);

  return (
    <Drawer
      title="重命名"
      className={`${styles.root} ${className}`}
      width="80%"
      destroyOnClose
      onClose={onClose}
      maskClosable={false}
      closeIcon={null}
      {...otherProps}
      footer={
        <Space style={{ marginLeft: 'auto' }}>
          <Button type="primary" icon={<SyncOutlined />} loading={generateLoading} onClick={handleReGenTypescript}>
            重新生成
          </Button>
          <Popconfirm
            title="确定取消重命名吗？已更改的名称将不会被保存。"
            onConfirm={() => {
              onClose?.();
            }}
          >
            <Button>取消</Button>
          </Popconfirm>
        </Space>
      }
      footerStyle={{ width: '100%', display: 'flex' }}
    >
      <Form form={form}>
        <Collapse className={styles.collapse} defaultActiveKey="deps" size="small" style={{ marginBottom: 24 }}>
          <Collapse.Panel
            key="deps"
            className={styles.panel}
            header={
              <Text strong style={{ fontSize: 16 }}>
                依赖的所有实体名称映射
              </Text>
            }
          >
            {isPlainObject(allDefNameMapping) && Object.keys(allDefNameMapping).length ? (
              <Descriptions size="small" title={null} bordered labelStyle={{ width: 300 }}>
                {Object.entries(allDefNameMapping ?? {}).map(([defName, filteredDefName], index) => (
                  <Descriptions.Item key={index} label={`<过滤前> ${defName}`} span={3}>
                    <Form.Item name={['allDefNameMapping', defName]} noStyle>
                      <RenameText />
                    </Form.Item>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Empty description="无依赖实体" />
            )}
          </Collapse.Panel>
        </Collapse>
        <Collapse className={styles.collapse} size="small" defaultActiveKey="apis">
          <Collapse.Panel
            key="apis"
            className={styles.panel}
            header={
              <Text strong style={{ fontSize: 16 }}>
                接口信息
              </Text>
            }
          >
            <Form.List name="nameGroup">
              {(groupFields) => (
                <>
                  {groupFields.map((groupField) => {
                    const groupIndex = groupField.name;
                    const groupName = form.getFieldValue(['nameGroup', groupIndex, 'groupName']);
                    const childApiGroupName = ['nameGroup', groupIndex, 'group'];

                    return (
                      <div className={styles.tagGroup} {...groupField}>
                        <Divider>
                          <div
                            className={styles.tagHeader}
                            style={{ border: `1px solid ${token.colorBorder}`, backgroundColor: token.colorBgTextActive }}
                          >
                            <TagFilled style={{ fontSize: 20 }} />
                            <Text strong style={{ fontSize: 18, marginLeft: 4 }}>
                              {groupName}
                            </Text>
                          </div>
                        </Divider>
                        <Form.List name={[groupIndex, 'group']}>
                          {(fields) => (
                            <>
                              {fields.map((field) => {
                                const itemName = field.name;
                                const { path, method, serviceName, pathParamName, pathQueryName, requestBodyName, responseBodyName, description } =
                                  form.getFieldValue([...childApiGroupName, itemName]);

                                return (
                                  <Descriptions
                                    {...field}
                                    className={styles.serviceGroup}
                                    title={
                                      <div className={styles.apiPath}>
                                        <MethodTag method={method} />
                                        <Text style={{ fontSize: 16 }}>{`<路径> ${path}`}</Text>
                                        {description && <Text style={{ fontSize: 14, opacity: 0.85 }}>{`（${description}）`}</Text>}
                                      </div>
                                    }
                                    size="small"
                                    labelStyle={{ width: 160 }}
                                    bordered
                                  >
                                    {serviceName && (
                                      <Descriptions.Item label="接口方法名称" span={3}>
                                        <Form.Item name={[itemName, 'serviceName']} noStyle>
                                          <RenameText />
                                        </Form.Item>
                                      </Descriptions.Item>
                                    )}
                                    {pathParamName && (
                                      <Descriptions.Item label="路径参数类型名称" span={3}>
                                        <Form.Item name={[itemName, 'pathParamName']} noStyle>
                                          <RenameText />
                                        </Form.Item>
                                      </Descriptions.Item>
                                    )}
                                    {pathQueryName && (
                                      <Descriptions.Item label="携带参数类型名称" span={3}>
                                        <Form.Item name={[itemName, 'pathQueryName']} noStyle>
                                          <RenameText />
                                        </Form.Item>
                                      </Descriptions.Item>
                                    )}
                                    {requestBodyName && (
                                      <Descriptions.Item label="请求体数据类型名称" span={3}>
                                        <Form.Item name={[itemName, 'requestBodyName']} noStyle>
                                          <RenameText />
                                        </Form.Item>
                                      </Descriptions.Item>
                                    )}
                                    {responseBodyName && (
                                      <Descriptions.Item label="返回体数据类型名称" span={3}>
                                        <Form.Item name={[itemName, 'responseBodyName']} noStyle>
                                          <RenameText />
                                        </Form.Item>
                                      </Descriptions.Item>
                                    )}
                                  </Descriptions>
                                );
                              })}
                            </>
                          )}
                        </Form.List>
                      </div>
                    );
                  })}
                </>
              )}
            </Form.List>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Drawer>
  );
};

export default ResultRenameDrawer;
