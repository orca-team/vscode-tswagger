import React, { Key, useEffect, useState } from 'react';
import styles from './TsResultModal.less';
import MonacoEditor, { DiffEditor, loader } from '@monaco-editor/react';
import { Badge, Button, Empty, Modal, ModalProps, Space, Tooltip, Tree, Typography, theme, Spin, Alert } from 'antd';
import { useBoolean, useMemoizedFn, useMount, useSetState } from 'ahooks';
import { FetchResult } from '@/utils/vscode';
import { CheckCircleOutlined, FormOutlined, QuestionCircleFilled } from '@ant-design/icons';
import { usePromisifyDrawer } from '@orca-fe/hooks';
import ResultRenameDrawer, { ResultRenameDrawerProps } from './ResultRenameDrawer';
import { V2TSGenerateResult } from '../../../../src/controllers/generate/v2';
import { ApiGroupDefNameMapping, ApiGroupNameMapping, ApiGroupServiceResult, RenameMapping, ServiceMapInfoYAMLJSONType } from '../../../../src/types';
import { collectAllDefNameMapping } from '@/utils';
import type { DataNode } from 'antd/es/tree';
import notification from '@/utils/notification';
import { OpenAPIV2 } from 'openapi-types';
import { useGlobalState } from '@/states/globalState';
import { apiReadServiceMapInfo } from '@/services';

const { Text } = Typography;

type EditorContent = {
  originalContent: string;
  modifiedContent?: string;
};

export interface TsResultModalProps extends ModalProps, V2TSGenerateResult {
  renameTypescript: (renameMapping: RenameMapping) => Promise<FetchResult<V2TSGenerateResult>>;
  saveTypescript: (
    newServiceResult: ApiGroupServiceResult[],
    newNameMappingList: ApiGroupNameMapping[],
    newDefNameMappingList: ApiGroupDefNameMapping[],
  ) => Promise<FetchResult<boolean>>;
  V2Docs?: OpenAPIV2.Document;
}

const TsResultModal: React.FC<TsResultModalProps> = (props) => {
  const {
    className = '',
    V2Docs,
    serviceResult: originalServiceResult,
    nameMappingList,
    defNameMappingList,
    renameTypescript,
    saveTypescript,
    onCancel,
    ...otherProps
  } = props;

  const currentBasePath = V2Docs?.basePath ?? '';
  const { token } = theme.useToken();
  const drawer = usePromisifyDrawer();
  const { tswaggerConfig } = useGlobalState();
  const mappedBasePathList = Object.keys(tswaggerConfig.basePathMapping ?? {});
  // 是否映射了 basePath
  const hasMappedBasePath = mappedBasePathList.includes(currentBasePath) && tswaggerConfig.addBasePathPrefix;
  // 映射后的 basePath
  const mappedBasePath = tswaggerConfig?.basePathMapping?.[currentBasePath] ?? currentBasePath;
  const [renameDrawerProps, setRenameDrawerProps] = useSetState<Partial<ResultRenameDrawerProps>>({});
  const [apiPathTree, setApiPathTree] = useState<DataNode[]>([]);
  const [pathKey, setPathKey] = useState<Key>();
  const [editorContent, setEditorContent] = useSetState<EditorContent>({ originalContent: '' });
  const [diffState, { setTrue: showTsDefDiff, setFalse: hideTsDefDiff }] = useBoolean(false);
  const [saving, { setTrue: startSaving, setFalse: stopSaving }] = useBoolean(false);
  const [monacoLoading, { setTrue: startMonacoLoading, setFalse: stopMonacoLoading }] = useBoolean(true);
  const [monacoError, setMonacoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [_this] = useState<{ latestTsResult: V2TSGenerateResult; localServiceInfo: ServiceMapInfoYAMLJSONType[] }>({
    latestTsResult: {
      nameMappingList,
      defNameMappingList,
      serviceResult: [],
    },
    localServiceInfo: [],
  });

  const handleLocalServiceInfo = useMemoizedFn(async () => {
    const groupNameList: string[] = originalServiceResult.map((item) => item.groupName);
    const response = await apiReadServiceMapInfo({ mappedBasePath, groupNameList });
    _this.localServiceInfo = response.data ?? [];
  });

  const handleApiPathTree = useMemoizedFn(async (serviceResult: ApiGroupServiceResult[]) => {
    const newTreeData: DataNode[] = [];
    await handleLocalServiceInfo();
    serviceResult.forEach((result) => {
      const { groupName, serviceList } = result;

      newTreeData.push({
        title: (
          <Text ellipsis={{ tooltip: true }} style={{ fontSize: 16, maxWidth: 200 }}>
            {groupName}
          </Text>
        ),
        key: groupName,
        selectable: false,
        children: serviceList.map(({ serviceName, path, method }, serviceIndex) => {
          // 本地是否已生成过
          const isLocalGenerated = _this.localServiceInfo.some(
            (item) => item.groupName === groupName && item.nameMappingList.some((service) => service.path === path && service.method === method),
          );

          return {
            title: (
              <div className={styles.serviceTitle}>
                {isLocalGenerated ? <Badge color="green" className={styles.tipIcon} /> : <Badge color="red" className={styles.tipIcon} />}
                <Text ellipsis={{ tooltip: true }} className={styles.text}>
                  {serviceName}
                </Text>
              </div>
            ),
            key: [groupName, serviceIndex].join(','),
          };
        }),
      });
    });
    setApiPathTree(newTreeData);
    const firstKey = newTreeData?.[0]?.children?.[0]?.key?.toString();
    if (firstKey === pathKey) {
      // 手动触发一下
      handleEditContent(firstKey);
    } else {
      setPathKey(firstKey);
    }
  });

  const handleAfterRenameTs = useMemoizedFn((result: V2TSGenerateResult) => {
    const { serviceResult: newServiceResult, nameMappingList, defNameMappingList } = result;
    _this.latestTsResult = result;
    handleApiPathTree(newServiceResult);
    showTsDefDiff();
    setRenameDrawerProps({ nameMappingList, allDefNameMapping: collectAllDefNameMapping(defNameMappingList) });
  });

  const handleSave = useMemoizedFn(async () => {
    const { serviceResult: _serviceResult, nameMappingList, defNameMappingList } = _this.latestTsResult;
    const serviceResult = _serviceResult.length > 0 ? _serviceResult : originalServiceResult;
    startSaving();
    const result = await saveTypescript(serviceResult, nameMappingList, defNameMappingList);
    stopSaving();
    if (result.success) {
      notification.success('接口文件已保存至项目中');
      // @ts-expect-error
      onCancel?.(null);
    } else {
      notification.error(result.errMsg ?? '保存失败');
    }
  });

  const handleEditContent = (latestPathKey?: Key) => {
    if (!latestPathKey) {
      return;
    }
    const [groupName, index] = latestPathKey.toString().split(',');
    const serviceIndex = Number(index);
    const originalResult = originalServiceResult.find((it) => it.groupName === groupName)?.serviceList?.[serviceIndex];
    const originalContent = originalResult?.tsDefs ?? '';
    const localContent = originalResult?.localTsDefs ?? '';
    const modifiedContent = _this.latestTsResult.serviceResult.find((it) => it.groupName === groupName)?.serviceList?.[serviceIndex]?.tsDefs ?? '';
    if (localContent || modifiedContent) {
      showTsDefDiff();
    } else {
      hideTsDefDiff();
    }
    setEditorContent({
      originalContent: localContent || originalContent,
      modifiedContent: modifiedContent || originalContent,
    });
  };

  useEffect(() => {
    if (pathKey) {
      handleEditContent(pathKey);
    }
  }, [pathKey]);

  // Monaco Editor 初始化配置
  const initializeMonaco = useMemoizedFn(async () => {
    try {
      startMonacoLoading();
      setMonacoError(null);

      // 配置 Monaco Editor CDN
      loader.config({
        paths: {
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs',
        },
      });

      // 预加载 Monaco Editor
      await loader.init();

      stopMonacoLoading();
    } catch (error) {
      console.error('Monaco Editor 初始化失败：', error);
      setMonacoError(error instanceof Error ? error.message : '未知错误');
      stopMonacoLoading();
    } finally {
      stopMonacoLoading();
    }
  });

  // 重试 Monaco Editor 初始化
  const retryMonacoInit = useMemoizedFn(() => {
    if (retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      // 清理之前的实例
      loader.config({ paths: { vs: '' } });
      setTimeout(
        () => {
          initializeMonaco();
        },
        1000 * (retryCount + 1),
      ); // 递增延迟重试
    }
  });

  useMount(() => {
    setRenameDrawerProps({
      nameMappingList,
      allDefNameMapping: collectAllDefNameMapping(defNameMappingList),
    });
    handleApiPathTree(originalServiceResult);
    initializeMonaco();
  });

  return (
    <Modal
      className={`${styles.root} ${className}`}
      title={
        <div className={styles.title}>
          <Tooltip
            overlayClassName={styles.statusTipContainer}
            title={
              <div className={styles.statusTip}>
                <Text strong>状态说明：</Text>
                <br />
                <div className={styles.statusItem}>
                  <Badge color="green" className={styles.statusBadge} />
                  <Text>本地已被记录过的接口</Text>
                </div>
                <div className={styles.statusItem}>
                  <Badge color="red" className={styles.statusBadge} />
                  <Text>本地未被记录过的接口</Text>
                </div>
              </div>
            }
          >
            <QuestionCircleFilled style={{ cursor: 'pointer', marginRight: 6, color: token.colorPrimary }} />
          </Tooltip>
          <Text>结果预览</Text>
          {hasMappedBasePath ? (
            <Text type="warning">
              （检测到路径前缀映射配置，已自动将 {currentBasePath} 替换为 {mappedBasePath} ）
            </Text>
          ) : null}
        </div>
      }
      width="95%"
      wrapClassName={styles.wrap}
      maskClosable={false}
      footer={null}
      destroyOnClose
      onCancel={onCancel}
      {...otherProps}
    >
      {drawer.instance}
      <Space className={styles.header}>
        <Tooltip title="对插件自动生成的 ts 类型名称和接口名称不满意？来试试重命名功能吧！">
          <Button
            icon={<FormOutlined />}
            type="dashed"
            disabled={saving}
            onClick={() => {
              drawer.show(
                <ResultRenameDrawer
                  {...renameDrawerProps}
                  renameTypescript={renameTypescript}
                  onAfterRenameTs={handleAfterRenameTs}
                  localServiceInfo={_this.localServiceInfo}
                />,
              );
            }}
          >
            重命名
          </Button>
        </Tooltip>
        <Button icon={<CheckCircleOutlined />} type="primary" loading={saving} onClick={handleSave}>
          保存至项目
        </Button>
      </Space>
      <div className={styles.container}>
        <div className={styles.pathTree}>
          {apiPathTree.length ? (
            <Tree
              showLine
              defaultExpandAll
              selectedKeys={pathKey ? [pathKey] : []}
              onSelect={(selectedKeys) => {
                setPathKey(selectedKeys[0]);
              }}
              treeData={apiPathTree}
            />
          ) : (
            <Empty />
          )}
        </div>
        <div className={styles.editor}>
          {monacoLoading && (
            <div
              style={{
                height: '75vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <Spin size="large" />
              <Text type="secondary">正在加载编辑器...</Text>
            </div>
          )}

          {monacoError && (
            <div style={{ height: '75vh', padding: 16 }}>
              <Alert
                message="编辑器加载失败"
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>错误信息：{monacoError}</div>
                    <div style={{ marginBottom: 8 }}>这可能是由于网络问题或浏览器兼容性导致的。</div>
                    <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                      <Text style={{ color: '#52c41a' }}>
                        💡 提示：编辑器预览失败不会影响接口代码的生成和保存功能，您可以稍后重试或直接保存代码到项目中。
                      </Text>
                    </div>
                    <Space>
                      <Button type="primary" size="small" disabled={retryCount >= 3} onClick={retryMonacoInit}>
                        重试 ({retryCount}/3)
                      </Button>
                    </Space>
                  </div>
                }
                type="error"
                showIcon
              />
            </div>
          )}

          {!monacoLoading && !monacoError && !diffState && (
            <MonacoEditor
              value={editorContent.originalContent}
              height="75vh"
              theme="vs-dark"
              language="typescript"
              options={{
                readOnly: true,
              }}
            />
          )}

          {!monacoLoading && !monacoError && diffState && (
            <DiffEditor
              original={editorContent.originalContent}
              modified={editorContent.modifiedContent}
              height="75vh"
              theme="vs-dark"
              language="typescript"
              options={{
                readOnly: true,
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TsResultModal;
