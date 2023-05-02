import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './WebviewPage.less';
import { Layout, Form, Select, Row, Col, message, Spin, Collapse, Typography, Checkbox, Space, Affix, Empty, Button, Tooltip, theme } from 'antd';
import { useGlobalState } from '@/states/globalState';
import useMessageListener from '@/hooks/useMessageListener';
import { useBoolean, useMap, useMemoizedFn, useMount, useToggle } from 'ahooks';
import { OpenAPIV2 } from 'openapi-types';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import { parseOpenAPIV2 } from '@/utils/parseSwaggerDocs';
import ApiGroupPanel from '@/components/ApiGroupPanel';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { usePromisifyModal } from '@orca-fe/hooks';
import AddApiDocModal from '@/components/AddApiDocModal';
import DirectoryTreeSelect from '@/components/DirectoryTreeSelect';
import webviewService from '@/services';

const { Header, Content } = Layout;
const { Item: FormItem, useForm, useWatch } = Form;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 18 },
};

export interface WebviewPageProps extends React.HTMLAttributes<HTMLDivElement> {}

const WebviewPage: React.FC<WebviewPageProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const [form] = useForm();
  const currentRemoteUrl = useWatch('remoteUrl', form);

  const { extSetting, setExtSetting } = useGlobalState();
  const { token } = theme.useToken();
  const [parseLoading, { setTrue: startParseLoading, setFalse: stopParseLoading }] = useBoolean(false);

  const [apiGroup, setApiGroup] = useState<ApiGroupByTag[]>([]);
  const modalController = usePromisifyModal();
  const [expand, { toggle: toggleExpand }] = useToggle(true);
  const [selectedApiMap, { set: setSelectedApiMap, remove: removeSelectedApiMap }] = useMap<OpenAPIV2.TagObject['name'], ApiPathType[]>();

  const _this = useRef<{ definitions: OpenAPIV2.DefinitionsObject }>({ definitions: {} }).current;

  const options = useMemo(() => {
    return extSetting.remoteUrlList.map(({ name, url }) => ({
      label: name,
      value: url,
    }));
  }, [extSetting.remoteUrlList]);

  useEffect(() => {
    if (!currentRemoteUrl) {
      return;
    }
    startParseLoading();

    webviewService.querySwaggerSchema(currentRemoteUrl);
  }, [currentRemoteUrl]);

  useMessageListener((vscodeMsg) => {
    const { method } = vscodeMsg;
    switch (method) {
      case 'vscode-extInfo': {
        setExtSetting({ remoteUrlList: vscodeMsg.data.setting.remoteUrlList ?? [] });
        break;
      }
      case 'vscode-swaggerSchema': {
        stopParseLoading();
        if (!vscodeMsg.success) {
          message.error(vscodeMsg.errMsg);
          return;
        }
        const currentApiName = options.find((option) => option.value === currentRemoteUrl)?.label;
        message.success(`【${currentApiName}】 Swagger 接口地址解析成功`);
        const apiDocs = vscodeMsg.data as OpenAPIV2.Document;
        setApiGroup(parseOpenAPIV2(apiDocs));
        _this.definitions = apiDocs.definitions ?? {};
        break;
      }
      case 'vscode-generateAPIV2Ts': {
        message.success('转换成功');
        break;
      }
    }
  });

  useMount(() => {
    webviewService.queryExtInfo();
    form.setFieldValue('outputConfig', ['responseBody', 'requestParams']);
  });

  const handleGenerateTs = useMemoizedFn(() => {
    const swaggerPathSchemaCollection: Array<{ tag: string; apiPathList: ApiPathType[] }> = [];
    selectedApiMap.forEach((apiPathList, tagName) => {
      swaggerPathSchemaCollection.push({
        tag: tagName,
        apiPathList,
      });
    });

    webviewService.generateAPIV2Ts(swaggerPathSchemaCollection, _this.definitions, form.getFieldValue('outputPath'));
  });

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      {modalController.instance}
      <Layout style={{ height: '100%' }}>
        <Header className={styles.header}>Swagger2.0 to Typescript</Header>
        <Layout className={styles.layout}>
          <Affix>
            <Content className={styles.content} style={{ border: `1px solid ${token.colorBorder}`, backgroundColor: token.colorBgElevated }}>
              <Form form={form} layout="vertical" {...formItemLayout} style={{ overflow: 'hidden', height: expand ? 'unset' : 0 }}>
                <Row gutter={24}>
                  <Col span={24}>
                    <FormItem
                      name="remoteUrl"
                      labelCol={{ span: 24 }}
                      label={
                        <Space>
                          <span>Swagger API：</span>
                          <Button type="link" disabled={!currentRemoteUrl} style={{ display: 'inline-block' }}>
                            刷新
                          </Button>
                        </Space>
                      }
                    >
                      <Select placeholder="请选择一个 swagger 远程地址接口" showSearch optionFilterProp="label" options={options} />
                    </FormItem>
                  </Col>
                </Row>
                {/* <Row gutter={24}>
                  <Col span={24}>
                    <FormItem name="outputConfig" label="输出配置：">
                      <Checkbox.Group>
                        <Checkbox value="requestParams">生成 RequestParams</Checkbox>

                        <Checkbox value="responseBody">生成 ResponseBody</Checkbox>
                        <Tooltip title="敬请期待">
                          <Checkbox value="service" disabled>
                            生成 Service
                          </Checkbox>
                        </Tooltip>
                      </Checkbox.Group>
                    </FormItem>
                  </Col>
                </Row> */}
                <Row gutter={24}>
                  <Col span={24}>
                    <FormItem name="outputPath" label="输出至当前项目 ts 文件：">
                      <DirectoryTreeSelect placeholder="请选择" />
                    </FormItem>
                  </Col>
                </Row>
              </Form>
              <div style={{ textAlign: 'right' }}>
                <Space size="small">
                  <Button
                    icon={<PlusOutlined />}
                    type="default"
                    onClick={() => {
                      modalController.show(<AddApiDocModal width="60%" />);
                    }}
                  >
                    添加新的 Swagger 接口
                  </Button>
                  <Button type="primary" disabled={selectedApiMap.size === 0} onClick={handleGenerateTs}>
                    生成 Typescript
                  </Button>
                  <Button type="link" icon={<DownOutlined rotate={expand ? 180 : 0} />} onClick={toggleExpand}>
                    {expand ? '收起' : '展开'}
                  </Button>
                </Space>
              </div>
            </Content>
          </Affix>
          <Spin spinning={parseLoading}>
            {!!apiGroup.length ? (
              <Collapse className={styles.apiList}>
                {apiGroup.map((item, index) => (
                  <ApiGroupPanel
                    key={index}
                    onChange={(tag, selected) => {
                      if (selected.length) {
                        setSelectedApiMap(tag.name, selected);
                      } else {
                        removeSelectedApiMap(tag.name);
                      }
                    }}
                    apiGroupItem={item}
                  />
                ))}
              </Collapse>
            ) : (
              <Empty className={styles.empty} />
            )}
          </Spin>
        </Layout>
      </Layout>
    </div>
  );
};

export default WebviewPage;
