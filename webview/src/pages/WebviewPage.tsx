import AddRemoteUrlModal from '@/components/AddRemoteUrlModal';
import ApiGroupPanel from '@/components/ApiGroupPanel';
import DirectoryTreeSelect from '@/components/DirectoryTreeSelect';
import SwaggerInfo from '@/components/SwaggerInfo';
import TsGenerateSpin from '@/components/TsGenerateSpin';
import { apiGenerateV2TypeScript, apiParseSwaggerJson, apiParseSwaggerUrl, apiQueryExtInfo, apiWriteTsFile } from '@/services';
import { useGlobalState } from '@/states/globalState';
import { parseOpenAPIV2 } from '@/utils/parseSwaggerDocs';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { usePromisifyModal } from '@orca-fe/hooks';
import { useBoolean, useMap, useMemoizedFn, useMount, useToggle } from 'ahooks';
import {
  Affix,
  Button,
  Checkbox,
  Collapse,
  Empty,
  FloatButton,
  Form,
  Layout,
  Select,
  Space,
  Spin,
  Tooltip,
  Upload,
  message,
  notification,
} from 'antd';
import { OpenAPIV2 } from 'openapi-types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './WebviewPage.less';
import { FetchResult, copyToClipboard } from '@/utils/vscode';

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

  const handleExtInfo = useMemoizedFn(async () => {
    const extInfoResp = await apiQueryExtInfo();
    setExtSetting({ remoteUrlList: extInfoResp.data.setting.remoteUrlList ?? [] });
  });

  const refreshSwaggerSchema = useMemoizedFn(async () => {
    if (!currentRemoteUrl) {
      return;
    }
    startParseLoading();
    resetSelectedApiMap();
    const resp = await apiParseSwaggerUrl(currentRemoteUrl);
    stopParseLoading();
    // TODO: `暂不支持大于 OpenAPIV2 版本解析`的提示
    if (!resp.success) {
      setSwaggerDocs(undefined);
      setApiGroup([]);
      notification.error({ message: resp.errMsg ?? 'Swagger 接口地址解析失败, 请稍后再试', duration: null });
      return;
    }
    const currentApiName = options.find((option) => option.value === currentRemoteUrl)?.label;
    message.success(`【${currentApiName}】 Swagger 接口地址解析成功`);
    const apiDocs = resp.data as OpenAPIV2.Document;
    setSwaggerDocs(apiDocs);
    setApiGroup(parseOpenAPIV2(apiDocs));
    _this.V2Document = apiDocs;
  });

  const generateTypescript = useMemoizedFn(async (successCallback: (result: FetchResult<string>) => void) => {
    await form.validateFields();
    startGenerateLoading();
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

    const result = await apiGenerateV2TypeScript({
      collection,
      options: outputOptions,
      V2Document: _this.V2Document!,
    });
    stopGenerateLoading();
    if (result.success) {
      successCallback(result);
    } else {
      notification.error({ message: result.errMsg ?? 'Typescript 生成失败，请稍后再试', duration: null });
    }
  });

  const generateTsCopy = useMemoizedFn(() => {
    generateTypescript((result) => {
      copyToClipboard(result.data);
      message.success('已复制至粘贴板');
    });
  });

  const generateTsFile = useMemoizedFn(() => {
    generateTypescript(async (result) => {
      const outputPath = form.getFieldValue('outputPath');
      const resp = await apiWriteTsFile({ tsDef: result.data, outputPath });
      if (resp.success) {
        message.success('已输出至对应 ts 文件');
      } else {
        notification.error({ message: resp.errMsg ?? 'ts 文件输出失败，请稍后再试', duration: null });
      }
    });
  });

  useEffect(() => {
    refreshSwaggerSchema();
  }, [currentRemoteUrl]);

  useMount(() => {
    handleExtInfo();
    form.setFieldValue('outputOptions', ['responseBody', 'requestParams']);
  });

  return (
    <TsGenerateSpin spinning={generateLoading}>
      <div className={`${styles.root} ${className}`} {...otherProps}>
        {modalController.instance}
        <Layout style={{ height: '100%' }}>
          <Header className={styles.header}>Swagger2.0 to Typescript</Header>
          <Layout className={styles.layout}>
            <Affix>
              <Content
                className={styles.content}
                style={{
                  border: `1px solid var(--vscode-widget-border, #303031)`,
                  backgroundColor: 'var(--vscode-editorHoverWidget-background, #252526)',
                }}
              >
                <Form form={form} layout="vertical" {...formItemLayout} style={{ overflow: 'hidden', height: expand ? 'unset' : 0 }}>
                  <FormItem
                    name="remoteUrl"
                    required
                    rules={[{ required: true, message: '请选择一个 Swagger 地址' }]}
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
                  <FormItem name="outputOptions" label="输出配置：" required rules={[{ required: true, message: '请至少选择一项输出配置' }]}>
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
                  <FormItem
                    required
                    rules={[{ required: true, message: '请选择需要输出的目标文件' }]}
                    name="outputPath"
                    label="输出至当前项目 ts 文件："
                  >
                    <DirectoryTreeSelect placeholder="请选择需要输出的 ts/tsx 文件" />
                  </FormItem>
                </Form>
                <div style={{ textAlign: 'right' }}>
                  <Space size="small">
                    <Upload
                      fileList={[]}
                      beforeUpload={async (file) => {
                        const jsonContent = await file.text();
                        const result = await apiParseSwaggerJson(jsonContent);
                        if (result.success) {
                          const apiDocs = result.data;
                          setSwaggerDocs(apiDocs);
                          setApiGroup(parseOpenAPIV2(apiDocs));
                          _this.V2Document = apiDocs;
                        }

                        return false;
                      }}
                    >
                      <Button type="primary">打開本地文件</Button>
                    </Upload>
                    <Button
                      icon={<PlusOutlined />}
                      type="default"
                      onClick={() => {
                        modalController.show(<AddRemoteUrlModal width="60%" />);
                      }}
                    >
                      添加新的 Swagger 接口
                    </Button>
                    <Button type="primary" disabled={selectedApiMap.size === 0} onClick={generateTsFile}>
                      生成 Typescript
                    </Button>
                    <Button type="primary" disabled={selectedApiMap.size === 0} onClick={generateTsCopy}>
                      複製 TypeScript
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
