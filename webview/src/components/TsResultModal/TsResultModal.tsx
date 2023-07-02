import React, { useState } from 'react';
import styles from './TsResultModal.less';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { Button, Modal, ModalProps, Space, Tooltip, message } from 'antd';
import { useBoolean, useMemoizedFn, useMount, useSetState } from 'ahooks';
import { FetchResult, copyToClipboard } from '@/utils/vscode';
import { CopyOutlined, FormOutlined } from '@ant-design/icons';
import { usePromisifyDrawer } from '@orca-fe/hooks';
import ResultRenameDrawer, { ResultRenameDrawerProps } from './ResultRenameDrawer';
import { V2TSGenerateResult } from '@/services';
import { RenameMapping } from '../../../../src/types';

export interface TsResultModalProps extends ModalProps, V2TSGenerateResult {
  renameTypescript: (renameMapping: RenameMapping) => Promise<FetchResult<V2TSGenerateResult>>;
}

const TsResultModal: React.FC<TsResultModalProps> = (props) => {
  const { className = '', tsDefs: originalContent, nameMappingList, allDefNameMapping, renameTypescript, ...otherProps } = props;

  const drawer = usePromisifyDrawer();
  const [renameDrawerProps, setRenameDrawerProps] = useSetState<Partial<ResultRenameDrawerProps>>({});
  const [diffState, { setTrue: showTsDefDiff, setFalse: hideTsDefDiff }] = useBoolean(false);
  const [modifiedContent, setModifiedContent] = useState('');

  const handleCopy = useMemoizedFn((result: string) => {
    copyToClipboard(result);
    message.success('已复制至粘贴板');
  });

  const handleAftreRenameTs = useMemoizedFn((result: V2TSGenerateResult) => {
    const { tsDefs: newTsDefs, nameMappingList, allDefNameMapping } = result;
    setModifiedContent(newTsDefs);
    showTsDefDiff();
    setRenameDrawerProps({ nameMappingList, allDefNameMapping });
  });

  useMount(() => {
    setRenameDrawerProps({
      nameMappingList,
      allDefNameMapping,
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
      {...otherProps}
    >
      {drawer.instance}
      <Space className={styles.header}>
        <Tooltip title="对插件自动生成的 ts 类型名称和接口名称不满意？来试试重命名功能吧！">
          <Button
            icon={<FormOutlined />}
            type="primary"
            onClick={() => {
              drawer.show(<ResultRenameDrawer {...renameDrawerProps} renameTypescript={renameTypescript} onAfterRenameTs={handleAftreRenameTs} />);
            }}
          >
            TS 重命名
          </Button>
        </Tooltip>
        <Button
          icon={<CopyOutlined />}
          type="primary"
          onClick={() => {
            handleCopy(modifiedContent ?? originalContent);
          }}
        >
          一键复制
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
