import React, { Key, useEffect, useState } from 'react';
import styles from './TsResultModal.less';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { Button, Modal, ModalProps, Space, Tooltip, Tree, Typography, message, notification } from 'antd';
import { useBoolean, useMemoizedFn, useMount, useSetState } from 'ahooks';
import { FetchResult } from '@/utils/vscode';
import { CheckCircleOutlined, FormOutlined } from '@ant-design/icons';
import { usePromisifyDrawer } from '@orca-fe/hooks';
import ResultRenameDrawer, { ResultRenameDrawerProps } from './ResultRenameDrawer';
import { V2TSGenerateResult } from '../../../../src/controllers';
import { ApiGroupDefNameMapping, ApiGroupNameMapping, ApiGroupServiceResult, RenameMapping } from '../../../../src/types';
import { collectAllDefNameMapping } from '@/utils';
import type { DataNode } from 'antd/es/tree';

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
}

const TsResultModal: React.FC<TsResultModalProps> = (props) => {
  const {
    className = '',
    serviceResult: originalServiceResult,
    nameMappingList,
    defNameMappingList,
    renameTypescript,
    saveTypescript,
    onCancel,
    ...otherProps
  } = props;

  const drawer = usePromisifyDrawer();
  const [renameDrawerProps, setRenameDrawerProps] = useSetState<Partial<ResultRenameDrawerProps>>({});
  const [apiPathTree, setApiPathTree] = useState<DataNode[]>([]);
  const [pathKey, setPathKey] = useState<Key>();
  const [editorContent, setEditorContent] = useSetState<EditorContent>({ originalContent: '' });
  const [diffState, { setTrue: showTsDefDiff, setFalse: hideTsDefDiff }] = useBoolean(false);
  const [saving, { setTrue: startSaving, setFalse: stopSaving }] = useBoolean(false);
  const [_this] = useState<{ latestTsResult: V2TSGenerateResult }>({
    latestTsResult: {
      nameMappingList,
      defNameMappingList,
      serviceResult: originalServiceResult,
    },
  });

  const handleApiPathTree = useMemoizedFn((serviceResult: ApiGroupServiceResult[]) => {
    const newTreeData: DataNode[] = [];
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
        children: serviceList.map(({ serviceName }) => ({
          title: (
            <Text ellipsis={{ tooltip: true }} style={{ fontSize: 14, maxWidth: 180, letterSpacing: 1 }}>
              {serviceName}
            </Text>
          ),
          key: `${groupName},${serviceName}`,
        })),
      });
    });
    setApiPathTree(newTreeData);
    setPathKey(newTreeData?.[0]?.children?.[0]?.key?.toString());
  });

  const handleAftreRenameTs = useMemoizedFn((result: V2TSGenerateResult) => {
    const { serviceResult: newServiceResult, nameMappingList, defNameMappingList } = result;
    _this.latestTsResult = result;
    handleApiPathTree(newServiceResult);
    showTsDefDiff();
    setRenameDrawerProps({ nameMappingList, allDefNameMapping: collectAllDefNameMapping(defNameMappingList) });
  });

  const handleSave = useMemoizedFn(async () => {
    const { serviceResult, nameMappingList, defNameMappingList } = _this.latestTsResult;
    startSaving();
    const result = await saveTypescript(serviceResult, nameMappingList, defNameMappingList);
    stopSaving();
    if (result.success) {
      message.success('已保存至项目中');
      // @ts-expect-error
      onCancel?.(null);
    } else {
      notification.error({ message: result.errMsg ?? '保存失败', duration: null });
    }
  });

  useEffect(() => {
    if (!pathKey) {
      return;
    }
    const [groupName, serviceName] = pathKey.toString().split(',');
    const originalContent =
      originalServiceResult.find((it) => it.groupName === groupName)?.serviceList.find((it) => it.serviceName === serviceName)?.tsDefs ?? '';
    const modifiedContent = _this.latestTsResult.serviceResult
      .find((it) => it.groupName === groupName)
      ?.serviceList.find((it) => it.serviceName === serviceName)?.tsDefs;
    setEditorContent({
      originalContent,
      modifiedContent,
    });
  }, [pathKey]);

  useMount(() => {
    setRenameDrawerProps({
      nameMappingList,
      allDefNameMapping: collectAllDefNameMapping(defNameMappingList),
    });
    handleApiPathTree(originalServiceResult);
  });

  return (
    <Modal
      className={`${styles.root} ${className}`}
      title="Typescript 结果预览"
      width="100%"
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
              drawer.show(<ResultRenameDrawer {...renameDrawerProps} renameTypescript={renameTypescript} onAfterRenameTs={handleAftreRenameTs} />);
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
          <Tree
            showLine
            defaultExpandAll
            selectedKeys={pathKey ? [pathKey] : []}
            onSelect={(selectedKeys) => {
              setPathKey(selectedKeys[0]);
            }}
            treeData={apiPathTree}
          />
        </div>
        <div className={styles.editor}>
          {!diffState && (
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
          {diffState && (
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
