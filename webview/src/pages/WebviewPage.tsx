import ApiGroupPanel from '@/components/ApiGroupPanel';
import SwaggerInfo from '@/components/SwaggerInfo';
import TsGenerateSpin from '@/components/TsGenerateSpin';
import {
  apiCheckConfigJSON,
  apiGenerateV2ServiceFile,
  apiGenerateV2TypeScript,
  apiParseSwaggerJson,
  apiParseSwaggerUrl,
  apiQueryExtInfo,
  apiSaveConfigJSON,
} from '@/services';
import { useGlobalState } from '@/states/globalState';
import { parseOpenAPIV2 } from '@/utils/parseSwaggerDocs';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import { DownOutlined, FolderAddOutlined, LinkOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons';
import { usePromisifyModal } from '@orca-fe/hooks';
import { useBoolean, useDebounceEffect, useDebounceFn, useMap, useMemoizedFn, useMount, useToggle } from 'ahooks';
import { Affix, Button, Checkbox, Collapse, Empty, FloatButton, Form, Layout, Modal, Space, Spin, Tabs, Tooltip, Typography, Upload, theme } from 'antd';
import { OpenAPIV2 } from 'openapi-types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './WebviewPage.less';
import SwaggerUrlSelect from '@/components/SwaggerUrlSelect';
import TsResultModal from '@/components/TsResultModal';
import { RcFile } from 'antd/es/upload';
import { ApiGroupDefNameMapping, ApiGroupNameMapping, ApiGroupServiceResult, RenameMapping } from '../../../src/types';
import notification from '@/utils/notification';
import ConfigJsonForm from '@/components/ConfigJSONForm';
import useMessageListener from '@/hooks/useMessageListener';
import { WebviewPageContext } from './context';
import SettingModal from '@/components/SettingModal';
import { pick } from 'lodash-es';
import SearchSuite, { SearchValue } from '@/components/SearchSuite';
import { ADVANCED_SEARCH_OPTIONS, PARSE_METHOD_DOCS, PARSE_METHOD_LOCAL, SEARCH_FILTER } from './constants';
import { CheckboxValueType } from 'antd/es/checkbox/Group';

const { Header, Content } = Layout;
const { useForm, useWatch } = Form;
const { Text } = Typography;

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 18 },
};

export interface WebviewPageProps extends React.HTMLAttributes<HTMLDivElement> {}

const WebviewPage: React.FC<WebviewPageProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const { token } = theme.useToken();
  const [allApiGroup, setAllApiGroup] = useState<ApiGroupByTag[]>([]);
  const [currentApiGroup, setCurrentApiGroup] = useState<ApiGroupByTag[]>([]);
  const [swaggerDocs, setSwaggerDocs] = useState<OpenAPIV2.Document>();
  const [searchPanelKey, setSearchPanelKey] = useState<string>(PARSE_METHOD_DOCS);
  const [filters, setFilters] = useState<CheckboxValueType[]>([SEARCH_FILTER.HIDE_EMPTY_GROUP]);
  const [openApiPanelKeys, setOpenApiPanelKeys] = useState<string[]>([]);
  const _this = useRef<{ V2Document?: OpenAPIV2.Document }>({}).current;

  const [form] = useForm();
  const [configForm] = useForm();
  const currentSwaggerUrl = useWatch<string>('swaggerUrl', form);
  const searchParams = useWatch<SearchValue | undefined>('searchParams', form);

  const { extSetting, setExtSetting, setTswaggerConfig } = useGlobalState();
  const [parseLoading, { setTrue: startParseLoading, setFalse: stopParseLoading }] = useBoolean(false);
  const [generateLoading, { setTrue: startGenerateLoading, setFalse: stopGenerateLoading }] = useBoolean(false);
  const modalController = usePromisifyModal();
  const [expand, { toggle: toggleExpand }] = useToggle(true);
  // 是否重刷新解析文档
  const [refreshDocFlag, { toggle: toggleRefreshDoc }] = useToggle(false);
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

  // 切换 api 时重置页面状态
  const resetPageWhenChange = useMemoizedFn(() => {
    setSwaggerDocs(undefined);
    setCurrentApiGroup([]);
    resetSelectedApiMap();
    setOpenApiPanelKeys([]);
    form.resetFields(['searchParams']);
  });

  const handleExtInfo = useMemoizedFn(async () => {
    const extInfoResp = await apiQueryExtInfo();
    setExtSetting(pick(extInfoResp.data.setting ?? {}, ['swaggerUrlList', 'translation']));
    setTswaggerConfig(extInfoResp.data.config ?? {});
  });

  const handleV2DocumentData = (apiDocs: OpenAPIV2.Document) => {
    const apiGroup = parseOpenAPIV2(apiDocs);
    setSwaggerDocs(apiDocs);
    setCurrentApiGroup(apiGroup);
    setAllApiGroup(apiGroup);
    _this.V2Document = apiDocs;
  };

  const refreshSwaggerSchema = useMemoizedFn(async () => {
    if (!currentSwaggerUrl) {
      return;
    }
    startParseLoading();
    const resp = await apiParseSwaggerUrl(currentSwaggerUrl);
    toggleRefreshDoc();
    stopParseLoading();
    resetPageWhenChange();
    const swaggerDocs = resp.data;
    if (!resp.success || !resp.data) {
      notification.error(resp.errMsg ?? 'Swagger 文档解析失败，请稍后再试');
      return;
    }
    if (!('swagger' in swaggerDocs)) {
      notification.warning('暂不支持大于 OpenAPIV2 版本的 swagger 文档解析，敬请期待后续更新！');
      return;
    }
    const currentApiName = options.find((option) => option.value === currentSwaggerUrl)?.label;
    notification.success(`【${currentApiName}】Swagger 文档解析成功`);
    handleV2DocumentData(swaggerDocs as OpenAPIV2.Document);
  });

  useDebounceEffect(
    () => {
      resetSelectedApiMap();
      toggleRefreshDoc();
      const { tagNameList, keyword } = searchParams ?? {};
      if (!tagNameList?.length && !keyword) {
        setCurrentApiGroup(allApiGroup);
        return;
      }
      let filteredGroup: ApiGroupByTag[] = allApiGroup;
      if ((tagNameList?.length ?? 0) > 0) {
        filteredGroup = filteredGroup.filter((it) => tagNameList?.includes(it.tag.name));
      }
      if (keyword) {
        filteredGroup = filteredGroup.map(({ apiPathList, ...rest }) => ({
          ...rest,
          apiPathList: apiPathList.filter((api) => api.path.includes(keyword) || api.pathInfo.summary?.includes(keyword)),
        }));
      }
      setCurrentApiGroup(filteredGroup);
    },
    [searchParams],
    { wait: 500 },
  );

  const handleOpenLocalFile = useMemoizedFn(async (file: RcFile) => {
    const jsonContent = await file.text();
    const result = await apiParseSwaggerJson(jsonContent);
    if (result.success) {
      handleV2DocumentData(result.data);
    }

    return false;
  });

  const generateV2Typescript = useMemoizedFn(async (renameMapping?: RenameMapping) => {
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
      renameMapping,
    });

    return result;
  });

  const saveTypescript = useMemoizedFn(
    async (serviceResult: ApiGroupServiceResult[], nameMappingList: ApiGroupNameMapping[], defNameMappingList: ApiGroupDefNameMapping[]) => {
      return apiGenerateV2ServiceFile({ swaggerInfo: _this.V2Document!, data: { serviceResult, nameMappingList, defNameMappingList } });
    },
  );

  const generateTypescript = useMemoizedFn(async () => {
    if (searchPanelKey === PARSE_METHOD_DOCS) {
      await form.validateFields();
    }
    startGenerateLoading();
    const result = await generateV2Typescript();
    stopGenerateLoading();
    if (result.success) {
      modalController.show(
        <TsResultModal {...result.data} V2Docs={swaggerDocs} renameTypescript={generateV2Typescript} saveTypescript={saveTypescript} />,
      );
    } else {
      notification.error(result.errMsg ?? 'Typescript 生成失败，请稍后再试');
    }
  });

  const handleBeforeGenTs = useMemoizedFn(async () => {
    startGenerateLoading();
    const hasExistConfigJSON = !!(await apiCheckConfigJSON()).data;
    if (hasExistConfigJSON) {
      generateTypescript();
    } else {
      stopGenerateLoading();
      configForm.resetFields();
      Modal.info({
        title: '提示',
        width: 480,
        closable: true,
        content: (
          <div>
            <Text strong style={{ fontSize: 16 }}>
              检测到本项目是首次生成接口文件，请先确认以下配置
            </Text>
            <ConfigJsonForm form={configForm} style={{ marginTop: 12 }} />
          </div>
        ),
        okText: '确定并继续生成 Typescript',
        onOk: async () => {
          const values = await configForm.validateFields();
          const resp = await apiSaveConfigJSON(values);

          if (resp.success) {
            notification.success('config.json 文件已生成至项目中');
            generateTypescript();
            return Promise.resolve();
          } else {
            notification.error(resp.errMsg ?? 'config.json 文件生成失败');
          }

          return Promise.reject();
        },
      });
    }
  });

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'webview-genFetchFile') {
      notification.info('检测到当前项目未配置 fetch 文件路径，已自动为您生成模板 fetch 文件，请在 src/utils 下查看');
    }
  });

  useEffect(() => {
    refreshSwaggerSchema();
  }, [currentSwaggerUrl]);

  useEffect(() => {
    if (searchPanelKey) {
      resetPageWhenChange();
    }
  }, [searchPanelKey]);

  useMount(() => {
    handleExtInfo();
    form.setFieldValue('outputOptions', ['responseBody', 'requestParams', 'service']);
  });

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <TsGenerateSpin spinning={generateLoading} />
      {modalController.instance}
      <Layout style={{ height: '100%' }}>
        <Header className={styles.header}>Swagger To Typescript</Header>
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
                  onChange={(key) => {
                    setSearchPanelKey(key);
                  }}
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
                          style={{ marginTop: 4, marginBottom: 0 }}
                          label={
                            <Space>
                              <span>文档接口地址：</span>
                              <Tooltip title="刷新当前 swagger 接口的路径数据">
                                <Button type="link" disabled={!currentSwaggerUrl} style={{ display: 'inline-block' }} onClick={refreshSwaggerSchema}>
                                  刷新
                                </Button>
                              </Tooltip>
                            </Space>
                          }
                        >
                          <SwaggerUrlSelect showSearch disabled={parseLoading} />
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
                        <Upload className={styles.localFileBtn} fileList={[]} beforeUpload={handleOpenLocalFile}>
                          <Button type="primary" icon={<UploadOutlined />}>
                            打开本地文件
                          </Button>
                        </Upload>
                      ),
                    },
                  ]}
                  tabBarExtraContent={
                    <Tooltip title="设置">
                      <SettingOutlined
                        className={styles.settingIcon}
                        style={{ color: token.colorPrimary }}
                        onClick={() => {
                          modalController.show(<SettingModal />);
                        }}
                      />
                    </Tooltip>
                  }
                />
                  <Checkbox.Group value={filters} onChange={setFilters} options={ADVANCED_SEARCH_OPTIONS} style={{ margin: '8px 0 12px 0'}}></Checkbox.Group>
                <Form.Item
                  name="searchParams"
                  label={
                    <Space>
                      <span>高级查询：</span>
                      <Button
                        type="link"
                        disabled={Boolean(!searchParams?.tagNameList?.length && !searchParams?.keyword)}
                        style={{ display: 'inline-block' }}
                        onClick={() => {
                          form.resetFields(['searchParams']);
                        }}
                      >
                        重置
                      </Button>
                    </Space>
                  }
                >
                  <SearchSuite allApiGroup={allApiGroup} />
                </Form.Item>
              </Form>
              <div style={{ textAlign: 'right' }}>
                <Space size="small">
                  <Button
                    type="primary"
                    disabled={selectedApiMap.size === 0}
                    onClick={() => {
                      handleBeforeGenTs();
                    }}
                  >
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
            <WebviewPageContext.Provider value={{ refreshDocFlag, filters }}>
              {hasSwaggerDocs && <SwaggerInfo className={styles.swaggerInfo} v2Doc={swaggerDocs} />}
              {!!currentApiGroup.length ? (
                <Collapse
                  className={styles.apiList}
                  activeKey={openApiPanelKeys}
                  onChange={(key) => {
                    setOpenApiPanelKeys(Array.isArray(key) ? key : [key]);
                  }}
                >
                  {currentApiGroup.map((item, index) => (
                    <ApiGroupPanel
                      key={`${currentSwaggerUrl}-${index}`}
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
            </WebviewPageContext.Provider>
          </Spin>
        </Layout>
      </Layout>
      <FloatButton.BackTop />
    </div>
  );
};

export default WebviewPage;
