import ApiGroupPanel from '@/components/ApiGroupPanel';
import SwaggerInfo from '@/components/SwaggerInfo';
import TsGenerateSpin from '@/components/TsGenerateSpin';
import { apiGenerateV2TypeScript, apiParseSwaggerJson, apiParseSwaggerUrl, apiQueryExtInfo } from '@/services';
import { useGlobalState } from '@/states/globalState';
import { parseOpenAPIV2 } from '@/utils/parseSwaggerDocs';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import { DownOutlined, FolderAddOutlined, LinkOutlined, UploadOutlined } from '@ant-design/icons';
import { usePromisifyModal } from '@orca-fe/hooks';
import { useBoolean, useDebounce, useMap, useMemoizedFn, useMount, useToggle } from 'ahooks';
import {
  Affix,
  Button,
  Checkbox,
  Collapse,
  Empty,
  FloatButton,
  Form,
  Input,
  Layout,
  Space,
  Spin,
  Tabs,
  Tooltip,
  Upload,
  message,
  notification,
} from 'antd';
import { OpenAPIV2 } from 'openapi-types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './WebviewPage.less';
import fuzzysort from 'fuzzysort';
import SwaggerUrlSelect from '@/components/SwaggerUrlSelect';
import TsResultModal from '@/components/TsResultModal';

const { Header, Content } = Layout;
const { useForm, useWatch } = Form;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 18 },
};

const PARSE_METHOD_DOCS = 'swagger docs';
const PARSE_METHOD_LOCAL = 'local file';

export interface WebviewPageProps extends React.HTMLAttributes<HTMLDivElement> {}

const WebviewPage: React.FC<WebviewPageProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const [apiGroup, setApiGroup] = useState<ApiGroupByTag[]>([]);
  const [swaggerDocs, setSwaggerDocs] = useState<OpenAPIV2.Document>();
  const _this = useRef<{ V2Document?: OpenAPIV2.Document }>({}).current;

  const [form] = useForm();
  const currentSwaggerUrl = useWatch<string>('swaggerUrl', form);
  const currentSearchKey = useWatch<string>('searchKey', form);

  const debounceSearchKey = useDebounce(currentSearchKey, { wait: 300 });
  const { extSetting, setExtSetting } = useGlobalState();
  const [parseLoading, { setTrue: startParseLoading, setFalse: stopParseLoading }] = useBoolean(false);
  const [generateLoading, { setTrue: startGenerateLoading, setFalse: stopGenerateLoading }] = useBoolean(false);
  const modalController = usePromisifyModal();
  const [expand, { toggle: toggleExpand }] = useToggle(true);
  const [selectedApiMap, { set: setSelectedApiMap, remove: removeSelectedApiMap, reset: resetSelectedApiMap }] = useMap<
    OpenAPIV2.TagObject['name'],
    ApiPathType[]
  >();

  const hasSwaggerDocs = !!swaggerDocs;

  const options = useMemo(() => {
    return extSetting.swaggerUrlList.map(({ name, url }) => ({
      label: name,
      value: url,
    }));
  }, [extSetting.swaggerUrlList]);

  const currentApiGroup = useMemo(
    () => (debounceSearchKey ? fuzzysort.go(debounceSearchKey, apiGroup, { keys: ['apiPathList.path', 'tag.name'] }).map((it) => it.obj) : apiGroup),
    [apiGroup, debounceSearchKey],
  );

  const handleExtInfo = useMemoizedFn(async () => {
    const extInfoResp = await apiQueryExtInfo();
    setExtSetting({ swaggerUrlList: extInfoResp.data.setting.swaggerUrlList ?? [] });
  });

  const refreshSwaggerSchema = useMemoizedFn(async () => {
    if (!currentSwaggerUrl) {
      return;
    }
    startParseLoading();
    resetSelectedApiMap();
    const resp = await apiParseSwaggerUrl(currentSwaggerUrl);
    console.log('resp', resp);
    stopParseLoading();
    // TODO: `暂不支持大于 OpenAPIV2 版本解析`的提示
    if (!resp.success) {
      setSwaggerDocs(undefined);
      setApiGroup([]);
      notification.error({ message: resp.errMsg ?? 'Swagger 文档解析失败, 请稍后再试', duration: null });
      return;
    }
    const currentApiName = options.find((option) => option.value === currentSwaggerUrl)?.label;
    message.success(`【${currentApiName}】 Swagger 文档解析成功`);
    const apiDocs = resp.data as OpenAPIV2.Document;
    const apiGroup = parseOpenAPIV2(apiDocs);
    setSwaggerDocs(apiDocs);
    setApiGroup(apiGroup);
    _this.V2Document = apiDocs;
  });

  const generateTypescript = useMemoizedFn(async () => {
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
    const currentOutputOptions = form.getFieldValue('outputOptions') as string[];
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
      // successCallback(result);
      modalController.show(<TsResultModal content={result.data} />);
    } else {
      notification.error({ message: result.errMsg ?? 'Typescript 生成失败，请稍后再试', duration: null });
    }
  });

  useEffect(() => {
    refreshSwaggerSchema();
  }, [currentSwaggerUrl]);

  useMount(() => {
    handleExtInfo();
    form.setFieldValue('outputOptions', ['responseBody', 'requestParams', 'service']);
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
                  <Tabs
                    defaultActiveKey={PARSE_METHOD_DOCS}
                    items={[
                      {
                        key: PARSE_METHOD_DOCS,
                        label: (
                          <span>
                            <LinkOutlined />
                            Swagger 文档地址
                          </span>
                        ),
                        children: (
                          <Form.Item
                            name="swaggerUrl"
                            required
                            rules={[{ required: true, message: '请选择一个 Swagger 地址' }]}
                            style={{ marginTop: 4 }}
                            label={
                              <Space>
                                <span>文档接口地址：</span>
                                <Tooltip title="刷新当前 swagger 接口的路径数据">
                                  <Button
                                    type="link"
                                    disabled={!currentSwaggerUrl}
                                    style={{ display: 'inline-block' }}
                                    onClick={refreshSwaggerSchema}
                                  >
                                    刷新
                                  </Button>
                                </Tooltip>
                              </Space>
                            }
                          >
                            <SwaggerUrlSelect showSearch />
                          </Form.Item>
                        ),
                      },
                      {
                        key: PARSE_METHOD_LOCAL,
                        label: (
                          <span>
                            <FolderAddOutlined />
                            本地文件
                          </span>
                        ),
                        children: (
                          <Upload
                            className={styles.localFileBtn}
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
                            <Button type="primary" icon={<UploadOutlined />}>
                              打开本地文件
                            </Button>
                          </Upload>
                        ),
                      },
                    ]}
                  />
                  <Form.Item name="outputOptions" label="输出配置：" required rules={[{ required: true, message: '请至少选择一项输出配置' }]}>
                    <Checkbox.Group>
                      <Checkbox value="requestParams">生成 RequestParams</Checkbox>
                      <Checkbox value="responseBody">生成 ResponseBody</Checkbox>
                      <Checkbox value="service">生成 Service</Checkbox>
                    </Checkbox.Group>
                  </Form.Item>
                  <Form.Item label="模糊筛选" name="searchKey">
                    <Input allowClear placeholder="请输入 标签名称 / API路径名称 进行模糊筛选" />
                  </Form.Item>
                </Form>
                <div style={{ textAlign: 'right' }}>
                  <Space size="small">
                    <Button type="primary" disabled={selectedApiMap.size === 0} onClick={generateTypescript}>
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
              {hasSwaggerDocs && <SwaggerInfo className={styles.swaggerInfo} v2Doc={swaggerDocs} />}
              {!!currentApiGroup.length ? (
                <Collapse className={styles.apiList}>
                  {currentApiGroup.map((item, index) => (
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
