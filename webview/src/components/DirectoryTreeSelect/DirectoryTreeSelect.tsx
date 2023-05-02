import React, { useMemo, useState } from 'react';
import styles from './DirectoryTreeSelect.less';
import { useMount } from 'ahooks';
import { postMessage } from '@/utils/vscode';
import useMessageListener from '@/hooks/useMessageListener';
import directoryTree from 'directory-tree';
import { TreeSelect, TreeSelectProps } from 'antd';
import { DefaultOptionType } from 'rc-tree-select/lib/TreeSelect';
import { FileOutlined, FolderFilled } from '@ant-design/icons';

export interface DirectoryTreeSelectProps extends TreeSelectProps {}

const DirectoryTreeSelect: React.FC<DirectoryTreeSelectProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const [dirTree, setDirTree] = useState<directoryTree.DirectoryTree[]>();

  useMount(() => {
    postMessage({
      method: 'webview-getCurrentDir',
      params: {},
    });
  });

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'vscode-currentDir') {
      setDirTree([vscodeMsg.data as directoryTree.DirectoryTree]);
    }
  });

  const handleDir2TreeData = (children: directoryTree.DirectoryTree[]): DefaultOptionType[] => {
    return children.map((dir) => ({
      icon: dir.type === 'directory' ? <FolderFilled /> : <FileOutlined />,
      title: dir.name,
      value: dir.path,
      path: dir.path,
      children: handleDir2TreeData(dir.children ?? []),
    }));
  };

  const dirTreeData: DefaultOptionType[] = useMemo(() => {
    return dirTree ? handleDir2TreeData(dirTree) : [];
  }, [dirTree]);

  return <TreeSelect treeIcon treeData={dirTreeData} treeNodeLabelProp="path" className={`${styles.root} ${className}`} {...otherProps} />;
};

export default DirectoryTreeSelect;
