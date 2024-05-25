import React, { useEffect } from 'react';
import styles from './ResultRenameDrawer.less';
import { Typography, Collapse, Drawer, DrawerProps, Space, Button, Descriptions, Empty, Form, theme, Divider, Tooltip, Modal } from 'antd';
import { ApiGroupNameMapping, NameMappingByGroup, RenameMapping, ServiceMapInfoYAMLJSONType } from '../../../../../src/types';
import { CheckCircleFilled, DownOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import MethodTag from '../../MethodTag';
import { isPlainObject } from 'lodash-es';
import RenameText from '../RenameText';
import { useBoolean, useMemoizedFn, useSetState } from 'ahooks';
import { FetchResult } from '@/utils/vscode';
import { V2TSGenerateResult } from '../../../../../src/controllers/generate/v2';
import { Rule } from 'antd/es/form';
import { apiGroupItemConfigs } from './constants';
import notification from '@/utils/notification';
import { NamePath } from 'antd/es/form/interface';
import { OpenBox } from '@orca-fe/pocket';

const { Text } = Typography;

const allDefNameMappingFormKey = 'allDefNameMapping';
const nameGroupFormKey = 'nameGroup';

const serviceNameReg = new RegExp(/^[a-zA-Z][a-zA-Z0-9]+$/);
const serviceRenameRule: Rule = {
  pattern: serviceNameReg,
  message: '接口名称只能包含英文和数字, 且必须以英文开头',
};

const tsTypeNameReg = new RegExp(/^[A-Z][a-zA-Z0-9]+$/);
const tsTypeRenameRule: Rule = {
  pattern: tsTypeNameReg,
  message: '类型名称只能包含英文和数字, 且首字母必须大写',
};

type ValidateServiceNameInfo = {
  groupName: string;
  method: string;
  path: string;
};

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

const convertRelatedGroupItem = (groupItem: ApiGroupNameMapping, defNameMapping: Record<string, string>) => {
  const { paramRefDefNameList } = groupItem;
  const newGroupItem = { ...groupItem };
  paramRefDefNameList.forEach(({ type: nameField, originRefName }) => {
    newGroupItem[nameField] = defNameMapping[originRefName] ?? '';
  });

  return newGroupItem;
};

export interface ResultRenameDrawerProps extends Omit<DrawerProps, 'onClose'> {
  renameTypescript: (renameMapping: RenameMapping) => Promise<FetchResult<V2TSGenerateResult>>;
  nameMappingList?: ApiGroupNameMapping[];
  allDefNameMapping?: Record<string, string>;
  onClose?: () => void;
  onAfterRenameTs?: (result: V2TSGenerateResult) => void;
  localServiceInfo?: ServiceMapInfoYAMLJSONType[];
}

const ResultRenameDrawer: React.FC<ResultRenameDrawerProps> = (props) => {
  const {
    className = '',
    nameMappingList,
    allDefNameMapping = {},
    onClose,
    onAfterRenameTs,
    renameTypescript,
    localServiceInfo = [],
    ...otherProps
  } = props;

  const { token } = theme.useToken();
  const [form] = Form.useForm<RenameMapping>();
  const latestDefNameMapping = Form.useWatch(allDefNameMappingFormKey, form);

  const [generateLoading, { setTrue: startGenerateLoading, setFalse: stopGenerateLoading }] = useBoolean(false);
  const [groupCloseState, setGroupCloseState] = useSetState<Record<number, boolean>>({});

  const handleReGenTypescript = useMemoizedFn(async () => {
    const renameMapping = await form.validateFields();
    startGenerateLoading();
    const resp = await renameTypescript(renameMapping);
    stopGenerateLoading();

    if (resp.success) {
      notification.success('Typescript 重新生成成功');
      onClose?.();
      onAfterRenameTs?.(resp.data);
    } else {
      notification.error(resp.errMsg ?? 'Typescript 重新生成失败，请稍后再试');
    }
  });

  const validateSameServiceName = (info: ValidateServiceNameInfo, groupNamePath: NamePath, serviceName?: string) => {
    const { groupName, method, path } = info;
    const currentGroup = (form.getFieldValue(groupNamePath) ?? []) as ApiGroupNameMapping[];
    const hasSameServiceName = currentGroup.filter((item) => item.serviceName === serviceName).length > 1;

    if (serviceName && hasSameServiceName) {
      return Promise.reject(new Error(`<${groupName}>分组下存在相同的接口方法名称，请重新命名`));
    }

    const localGroup = localServiceInfo.find((item) => item.groupName === groupName);
    if (localGroup && localGroup.nameMappingList.some((item) => item.serviceName === serviceName && (item.method !== method || item.path !== path))) {
      return Promise.reject(new Error(`本地<${groupName}>分组下存在相同名称的接口文件，请重新命名`));
    }

    return Promise.resolve();
  };

  // 关联实体类的名称同步进行修改
  useEffect(() => {
    const currentNameGroup = (form.getFieldValue(nameGroupFormKey) ?? []) as NameMappingByGroup[];
    const newNameGroup: NameMappingByGroup[] = currentNameGroup.map(({ group, ...otherProps }) => ({
      ...otherProps,
      group: group.map((item) => convertRelatedGroupItem(item, latestDefNameMapping)),
    }));
    form.setFieldValue(nameGroupFormKey, newNameGroup);
  }, [latestDefNameMapping]);

  useEffect(() => {
    form.setFieldValue(nameGroupFormKey, convertNameMappingList(nameMappingList ?? []));
  }, [nameMappingList]);

  useEffect(() => {
    form.setFieldValue(allDefNameMappingFormKey, allDefNameMapping);
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
          <Button
            onClick={() => {
              Modal.confirm({
                title: '提示',
                content: '确定取消重命名吗？已更改的名称将不会被保存。',
                onOk: () => {
                  onClose?.();
                },
              });
            }}
          >
            取消
          </Button>
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
                  <Descriptions.Item
                    key={index}
                    label={
                      <Tooltip title={defName}>
                        <Text ellipsis style={{ maxWidth: 300 }}>{`<过滤前> ${defName}`}</Text>
                      </Tooltip>
                    }
                    span={3}
                  >
                    <Form.Item
                      className={styles.formItem}
                      name={[allDefNameMappingFormKey, defName]}
                      rules={[{ required: true, message: `请输入新的 ${defName} 名称` }, tsTypeRenameRule]}
                    >
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
            <Form.List name={nameGroupFormKey}>
              {(groupFields) => (
                <>
                  {groupFields.map((groupField) => {
                    const groupIndex = groupField.name;
                    const groupName = form.getFieldValue([nameGroupFormKey, groupIndex, 'groupName']);
                    const childApiGroupName = [nameGroupFormKey, groupIndex, 'group'];

                    return (
                      <div className={styles.tagGroup} {...groupField}>
                        <Divider orientation="left">
                          <div
                            className={styles.tagHeader}
                            style={{ border: `1px solid ${token.colorBorder}`, backgroundColor: token.colorBgTextActive }}
                          >
                            <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 18 }} />
                            <Text strong style={{ fontSize: 18, marginLeft: 6 }}>
                              {groupName}
                            </Text>
                            <DownOutlined
                              className={styles.openIcon}
                              style={{ color: token.colorTextSecondary, transform: groupCloseState[groupIndex] ? 'rotate(-90deg)' : undefined }}
                              onClick={() => {
                                setGroupCloseState({ [groupIndex]: !groupCloseState[groupIndex] });
                              }}
                            />
                          </div>
                        </Divider>
                        <OpenBox open={!groupCloseState[groupIndex]}>
                          <Form.List name={[groupIndex, 'group']}>
                            {(fields) => (
                              <>
                                {fields.map((field) => {
                                  const itemName = field.name;
                                  const { path, method, description, paramRefDefNameList, ...apiNameMapping } = form.getFieldValue([
                                    ...childApiGroupName,
                                    itemName,
                                  ]) as ApiGroupNameMapping;

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
                                      labelStyle={{ width: 200 }}
                                      bordered
                                    >
                                      {apiGroupItemConfigs.map(({ key: nameField, label }) => {
                                        const relatedDefInfo = paramRefDefNameList.find((it) => it.type === nameField);
                                        const renameValue = apiNameMapping[nameField];

                                        const validationRule: Rule[] = [];

                                        const isRelatedDefName = !!relatedDefInfo; // 是否关联实体名称
                                        if (!isRelatedDefName) {
                                          validationRule.push(
                                            { required: true, message: `请输入新的${label}` },
                                            nameField === 'serviceName' ? serviceRenameRule : tsTypeRenameRule,
                                          );
                                        }

                                        const isServiceName = nameField === 'serviceName'; // 是否接口名称
                                        if (isServiceName) {
                                          validationRule.push({
                                            validator: (_, value) =>
                                              validateSameServiceName(groupName, [nameGroupFormKey, groupIndex, 'group'], value),
                                          });
                                        }

                                        return apiNameMapping[nameField] ? (
                                          <Descriptions.Item key={nameField} label={label} span={3}>
                                            <div className={styles.serviceDescItem}>
                                              {isRelatedDefName && (
                                                <Tooltip title={`${renameValue} 直接关联实体类，请在依赖实体名称映射中进行名称修改`}>
                                                  <ExclamationCircleOutlined className={styles.infoIcon} style={{ color: token.colorWarning }} />
                                                </Tooltip>
                                              )}
                                              <Form.Item
                                                name={[itemName, nameField]}
                                                className={styles.formItem}
                                                dependencies={[allDefNameMappingFormKey, relatedDefInfo?.originRefName ?? '']}
                                                rules={validationRule}
                                                style={{ width: '100%' }}
                                              >
                                                {isRelatedDefName ? <RenameText underline={false} disabled /> : <RenameText />}
                                              </Form.Item>
                                            </div>
                                          </Descriptions.Item>
                                        ) : null;
                                      })}
                                    </Descriptions>
                                  );
                                })}
                              </>
                            )}
                          </Form.List>
                        </OpenBox>
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
