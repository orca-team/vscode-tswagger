import React, { useState } from 'react';
import styles from './TsResultModal.less';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { Button, Modal, ModalProps, Space, Tooltip, message, notification } from 'antd';
import { useBoolean, useMemoizedFn, useMount, useSetState } from 'ahooks';
import { FetchResult } from '@/utils/vscode';
import { CheckCircleOutlined, CopyOutlined, FormOutlined } from '@ant-design/icons';
import { usePromisifyDrawer } from '@orca-fe/hooks';
import ResultRenameDrawer, { ResultRenameDrawerProps } from './ResultRenameDrawer';
import { V2TSGenerateResult } from '../../../../src/controllers';
import { ApiGroupDefNameMapping, ApiGroupNameMapping, RenameMapping } from '../../../../src/types';
import { collectAllDefNameMapping, copyToClipboard } from '@/utils';

export interface TsResultModalProps extends ModalProps, V2TSGenerateResult {
  renameTypescript: (renameMapping: RenameMapping) => Promise<FetchResult<V2TSGenerateResult>>;
  saveTypescript: (
    newTsDefs: string,
    newNameMappingList: ApiGroupNameMapping[],
    newDefNameMappingList: ApiGroupDefNameMapping[],
  ) => Promise<FetchResult<boolean>>;
}

const TsResultModal: React.FC<TsResultModalProps> = (props) => {
  const {
    className = '',
    tsDefs: originalContent,
    nameMappingList,
    defNameMappingList,
    renameTypescript,
    saveTypescript,
    onCancel,
    ...otherProps
  } = props;

  const drawer = usePromisifyDrawer();
  const [renameDrawerProps, setRenameDrawerProps] = useSetState<Partial<ResultRenameDrawerProps>>({});
  const [diffState, { setTrue: showTsDefDiff, setFalse: hideTsDefDiff }] = useBoolean(false);
  const [saving, { setTrue: startSaving, setFalse: stopSaving }] = useBoolean(false);
  const [modifiedContent, setModifiedContent] = useState(originalContent);
  const [_this] = useState<{ latestTsResult: V2TSGenerateResult }>({
    latestTsResult: {
      nameMappingList,
      defNameMappingList,
      tsDefs: originalContent,
    },
  });

  const handleCopy = useMemoizedFn((result: string) => {
    copyToClipboard(result);
    message.success('已复制至粘贴板');
  });

  const handleAftreRenameTs = useMemoizedFn((result: V2TSGenerateResult) => {
    const { tsDefs: newTsDefs, nameMappingList, defNameMappingList } = result;
    _this.latestTsResult = result;
    setModifiedContent(newTsDefs);
    showTsDefDiff();
    setRenameDrawerProps({ nameMappingList, allDefNameMapping: collectAllDefNameMapping(defNameMappingList) });
  });

  const handleSave = useMemoizedFn(async () => {
    const { nameMappingList, defNameMappingList } = _this.latestTsResult;
    startSaving();
    const result = await saveTypescript(modifiedContent, nameMappingList, defNameMappingList);
    stopSaving();
    if (result.success) {
      message.success('已保存至项目中');
      // @ts-expect-error
      onCancel?.(null);
    } else {
      notification.error({ message: result.errMsg ?? '保存失败', duration: null });
    }
  });

  useMount(() => {
    setRenameDrawerProps({
      nameMappingList,
      allDefNameMapping: collectAllDefNameMapping(defNameMappingList),
    });
  });

  return (
    <Modal
      className={`${styles.root} ${className}`}
      title="Typescript 结果预览"
      width="90%"
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
        <Button
          icon={<CopyOutlined />}
          type="default"
          disabled={saving}
          onClick={() => {
            handleCopy(modifiedContent ?? originalContent);
          }}
        >
          一键复制
        </Button>
        <Button icon={<CheckCircleOutlined />} type="primary" loading={saving} onClick={handleSave}>
          保存至项目
        </Button>
      </Space>
      {!diffState && (
        <MonacoEditor
          value={originalContent}
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
          original={originalContent}
          modified={modifiedContent}
          height="75vh"
          theme="vs-dark"
          language="typescript"
          options={{
            readOnly: true,
          }}
        />
      )}
    </Modal>
  );
};

export default TsResultModal;
