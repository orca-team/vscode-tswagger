import ApiGroupPanel from '@/components/ApiGroupPanel';
import ActionIcon from '@/components/ActionIcon';
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
import { DownOutlined, FolderAddOutlined, FormOutlined, LinkOutlined, ReloadOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons';
import { usePromisifyDrawer, usePromisifyModal } from '@orca-fe/hooks';
import { useBoolean, useDebounceEffect, useMap, useMemoizedFn, useMount, useToggle } from 'ahooks';
import {
  Affix,
  Button,
  Checkbox,
  Collapse,
  Empty,
  FloatButton,
  Form,
  Layout,
  Modal,
  Space,
  Spin,
  Tabs,
  Tooltip,
  Typography,
  Upload,
  theme,
} from 'antd';
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
import SwaggerDocDrawer from '@/components/SwaggerDocDrawer';
import SkeletonLoader from '@/components/SkeletonLoader';
import { Img } from '@orca-fe/pocket';
import logo from '@/assets/logo.png';

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
  const drawer = usePromisifyDrawer({ onOkField: 'onOk' });
  const [allApiGroup, setAllApiGroup] = useState<ApiGroupByTag[]>([]);
  const [currentApiGroup, setCurrentApiGroup] = useState<ApiGroupByTag[]>([]);
  const [swaggerDocs, setSwaggerDocs] = useState<OpenAPIV2.Document>();
  const [searchPanelKey, setSearchPanelKey] = useState<string>(PARSE_METHOD_DOCS);
  const [filters, setFilters] = useState<string[]>([SEARCH_FILTER.HIDE_EMPTY_GROUP]);
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
      {drawer.instance}
      <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Affix offsetTop={0}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.logoSection}>
                <Img src={logo} style={{ width: 36 }} />
                <div className={styles.titleSection}>
                  <h1 className={styles.title}>Swagger To TypeScript</h1>
                </div>
              </div>
              <div className={styles.headerActions}>
                <Tooltip title="设置">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    className={styles.headerButton}
                    onClick={() => {
                      modalController.show(<SettingModal />);
                    }}
                  />
                </Tooltip>
              </div>
            </div>
          </header>
        </Affix>
        <Layout className={styles.layout} style={{ flex: 1, overflow: 'auto' }}>
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
                            <ActionIcon
                              icon={<ReloadOutlined />}
                              title="刷新当前 swagger 接口的路径数据"
                              disabled={!currentSwaggerUrl}
                              style={{ display: 'inline-block' }}
                              onClick={refreshSwaggerSchema}
                            />
                            <ActionIcon
                              icon={<FormOutlined />}
                              title="管理文档地址"
                              style={{ display: 'inline-block' }}
                              onClick={() => {
                                drawer.show(
                                  <SwaggerDocDrawer
                                    onSaveSuccess={() => {
                                      drawer.hide();
                                      refreshSwaggerSchema();
                                    }}
                                  />,
                                );
                              }}
                            ></ActionIcon>
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
              />
              <Checkbox.Group
                value={filters}
                onChange={setFilters}
                options={ADVANCED_SEARCH_OPTIONS}
                style={{ margin: '8px 0 12px 0' }}
              ></Checkbox.Group>
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
            <div className={`${styles.actionBar} ${!expand ? styles.collapse : ''}`}>
              {/* <div className={styles.statsInfo}>
                {selectedApiMap.size > 0 && (
                  <Space size="small">
                    <span className={styles.statsText}>
                      已选择 <strong>{selectedApiMap.size}</strong> 个分组，共{' '}
                      <strong>{Array.from(selectedApiMap.values()).reduce((total, apis) => total + apis.length, 0)}</strong> 个接口
                    </span>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        resetSelectedApiMap();
                      }}
                    >
                      清空选择
                    </Button>
                  </Space>
                )}
              </div> */}
              <Space size="small" style={{ marginLeft: 'auto' }}>
                <Button
                  type="primary"
                  disabled={selectedApiMap.size === 0}
                  onClick={() => {
                    handleBeforeGenTs();
                  }}
                >
                  生成 TypeScript
                </Button>
                <Button type="link" icon={<DownOutlined rotate={expand ? 180 : 0} />} onClick={toggleExpand}>
                  {expand ? '收起' : '展开'}
                </Button>
              </Space>
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <SkeletonLoader loading={parseLoading}>
                <WebviewPageContext.Provider value={{ refreshDocFlag, filters }}>
                  {hasSwaggerDocs && <SwaggerInfo className={styles.swaggerInfo} v2Doc={swaggerDocs} />}
                  {!!currentApiGroup.length ? (
                    <>
                      {/* 暂不开放此功能 */}
                      <div style={{ display: 'none' }}>
                        <div className={styles.quickActions}>
                          <Space size="small">
                            <span className={styles.quickActionsLabel}>快速操作：</span>
                            <Button
                              size="small"
                              type="link"
                              onClick={() => {
                                currentApiGroup.forEach((item) => {
                                  setSelectedApiMap(item.tag.name, item.apiPathList);
                                });
                              }}
                            >
                              全选
                            </Button>
                            <Button
                              size="small"
                              type="link"
                              onClick={() => {
                                currentApiGroup.forEach((item) => {
                                  if (selectedApiMap.has(item.tag.name)) {
                                    removeSelectedApiMap(item.tag.name);
                                  } else {
                                    setSelectedApiMap(item.tag.name, item.apiPathList);
                                  }
                                });
                              }}
                            >
                              反选
                            </Button>
                            <Button
                              size="small"
                              type="link"
                              onClick={() => {
                                setOpenApiPanelKeys(currentApiGroup.map((_, index) => `${currentSwaggerUrl}-${index}`));
                              }}
                            >
                              展开全部
                            </Button>
                            <Button
                              size="small"
                              type="link"
                              onClick={() => {
                                setOpenApiPanelKeys([]);
                              }}
                            >
                              收起全部
                            </Button>
                          </Space>
                        </div>
                      </div>
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
                    </>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div className={styles.emptyDescription}>
                          <div>暂无 API 数据</div>
                          <div className={styles.emptyHint}>请选择 Swagger 文档或上传本地文件</div>
                        </div>
                      }
                    />
                  )}
                </WebviewPageContext.Provider>
              </SkeletonLoader>
            </div>
          </Content>
        </Layout>
      </Layout>
      <FloatButton.BackTop />
    </div>
  );
};

export default WebviewPage;
