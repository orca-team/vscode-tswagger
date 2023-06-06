import React from 'react';
import styles from './TsResultModal.less';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { Button, Modal, ModalProps, Space, message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { copyToClipboard } from '@/utils/vscode';

export interface TsResultModalProps extends ModalProps {
  content: string;
}

const TsResultModal: React.FC<TsResultModalProps> = (props) => {
  const { className = '', content: originalContent, ...otherProps } = props;

  const handleCopy = useMemoizedFn((result: string) => {
    copyToClipboard(result);
    message.success('已复制至粘贴板');
  });

  return (
    <Modal
      className={`${styles.root} ${className}`}
      title="Typescript 结果预览"
      width="90%"
      wrapClassName={styles.wrap}
      maskClosable={false}
      {...otherProps}
    >
      <div className={styles.header}>
        <Button
          type="primary"
          onClick={() => {
            handleCopy(originalContent);
          }}
        >
          一键复制
        </Button>
      </div>
      <MonacoEditor
        value={originalContent}
        height="75vh"
        theme="vs-dark"
        language="typescript"
        options={{
          readOnly: true,
        }}
      />
      {/* <DiffEditor
        original=""
        modified={originalContent}
        height="75vh"
        theme="vs-dark"
        language="typescript"
        options={{
          readOnly: true,
        }}
      /> */}
    </Modal>
  );
};

export default TsResultModal;
