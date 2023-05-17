import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './WebviewPage.less';
import {
  Layout,
  Form,
  Select,
  message,
  Spin,
  Collapse,
  Typography,
  Checkbox,
  Space,
  Affix,
  Empty,
  Button,
  Tooltip,
  theme,
  FloatButton,
  Modal,
} from 'antd';
import { useGlobalState } from '@/states/globalState';
import useMessageListener from '@/hooks/useMessageListener';
import { useBoolean, useMap, useMemoizedFn, useMount, useToggle } from 'ahooks';
import { OpenAPIV2 } from 'openapi-types';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import { parseOpenAPIV2 } from '@/utils/parseSwaggerDocs';
import ApiGroupPanel from '@/components/ApiGroupPanel';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { usePromisifyModal } from '@orca-fe/hooks';
import AddRemoteUrlModal from '@/components/AddRemoteUrlModal';
import DirectoryTreeSelect from '@/components/DirectoryTreeSelect';
import webviewService from '@/services';
import SwaggerInfo from '@/components/SwaggerInfo';
import TsGenerateSpin from '@/components/TsGenerateSpin';

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
  const currentOutputOptions = useWatch<string[]>('outputOptions', form);

  const { extSetting, setExtSetting } = useGlobalState();
  const { token } = theme.useToken();
  const [parseLoading, { setTrue: startParseLoading, setFalse: stopParseLoading }] = useBoolean(false);
  const [generateLoading, { setTrue: startGenerateLoading, setFalse: stopGenerateLoading }] = useBoolean(false);

  const [apiGroup, setApiGroup] = useState<ApiGroupByTag[]>([]);
  const [swaggerDocs, setSwaggerDocs] = useState<OpenAPIV2.Document>();
  const modalController = usePromisifyModal();
  const [expand, { toggle: toggleExpand }] = useToggle(true);
  const [selectedApiMap, { set: setSelectedApiMap, remove: removeSelectedApiMap, reset: resetSelectedApiMap }] = useMap<
    OpenAPIV2.TagObject['name'],
    ApiPathType[]
  >();

  const _this = useRef<{ V2Document?: OpenAPIV2.Document }>({}).current;

  const options = useMemo(() => {
    return extSetting.remoteUrlList.map(({ name, url }) => ({
      label: name,
      value: url,
    }));
  }, [extSetting.remoteUrlList]);

  const refreshSwaggerSchema = useMemoizedFn(() => {
    if (!currentRemoteUrl) {
      return;
    }
    startParseLoading();
    resetSelectedApiMap();
    webviewService.querySwaggerSchema(currentRemoteUrl);
  });

  useEffect(() => {
    refreshSwaggerSchema();
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
          setSwaggerDocs(undefined);
          setApiGroup([]);
          return;
        }
        const currentApiName = options.find((option) => option.value === currentRemoteUrl)?.label;
        message.success(`【${currentApiName}】 Swagger 接口地址解析成功`);
        const apiDocs = vscodeMsg.data as OpenAPIV2.Document;
        setSwaggerDocs(apiDocs);
        setApiGroup(parseOpenAPIV2(apiDocs));
        _this.V2Document = apiDocs;
        break;
      }
      case 'vscode-generateAPIV2Ts': {
        stopGenerateLoading();
        if (vscodeMsg.success) {
          message.success('转换成功');
        }
        break;
      }
    }
  });

  useMount(() => {
    webviewService.queryExtInfo();
    form.setFieldValue('outputOptions', ['responseBody', 'requestParams']);
  });

  const handleGenerateTs = useMemoizedFn(async () => {
    startGenerateLoading();
    await form.validateFields();
    const collection: Array<{ tag: string; apiPathList: ApiPathType[] }> = [];
    selectedApiMap.forEach((apiPathList, tagName) => {
      collection.push({
        tag: tagName,
        apiPathList,
      });
    });

    const outputOptions: Record<string, boolean> = {};
    currentOutputOptions.forEach((option) => {
      outputOptions[option] = true;
    });

    webviewService.generateAPIV2Ts(collection, form.getFieldValue('outputPath'), _this.V2Document, outputOptions);
  });

  return (
    <TsGenerateSpin spinning={generateLoading}>
      <div className={`${styles.root} ${className}`} {...otherProps}>
        {modalController.instance}
        <Layout style={{ height: '100%' }}>
          <Header className={styles.header}>Swagger2.0 to1 Typescript</Header>
          <Layout className={styles.layout}>
            <Affix>
              <Content className={styles.content} style={{ border: `1px solid ${token.colorBorder}`, backgroundColor: token.colorBgContainer }}>
                <Form form={form} layout="vertical" {...formItemLayout} style={{ overflow: 'hidden', height: expand ? 'unset' : 0 }}>
                  <FormItem
                    name="remoteUrl"
                    required
                    rules={[{ required: true }]}
                    label={
                      <Space>
                        <span>Swagger API：</span>
                        <Tooltip title="刷新当前 swagger 接口的路径数据">
                          <Button type="link" disabled={!currentRemoteUrl} style={{ display: 'inline-block' }} onClick={refreshSwaggerSchema}>
                            刷新
                          </Button>
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Select placeholder="请选择一个 swagger 远程地址接口" showSearch optionFilterProp="label" options={options} />
                  </FormItem>
                  <FormItem name="outputOptions" label="输出配置：" required rules={[{ required: true }]}>
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
                  <FormItem required rules={[{ required: true }]} name="outputPath" label="输出至当前项目 ts 文件：">
                    <DirectoryTreeSelect placeholder="请选择需要输出的 ts/tsx 文件" />
                  </FormItem>
                </Form>
                <div style={{ textAlign: 'right' }}>
                  <Space size="small">
                    <Button
                      icon={<PlusOutlined />}
                      type="default"
                      onClick={() => {
                        modalController.show(<AddRemoteUrlModal width="60%" />);
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
              {!!swaggerDocs ? <SwaggerInfo className={styles.swaggerInfo} v2Doc={swaggerDocs} /> : null}
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
        <FloatButton.BackTop />
      </div>
    </TsGenerateSpin>
  );
};

export default WebviewPage;
