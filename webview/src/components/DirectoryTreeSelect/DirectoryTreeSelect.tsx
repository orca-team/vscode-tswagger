import React, { useMemo, useState } from 'react';
import styles from './DirectoryTreeSelect.less';
import { useMount } from 'ahooks';
import useMessageListener from '@/hooks/useMessageListener';
import directoryTree from 'directory-tree';
import { TreeSelect, TreeSelectProps } from 'antd';
import { DefaultOptionType } from 'rc-tree-select/lib/TreeSelect';
import { FileOutlined, FolderFilled } from '@ant-design/icons';
import webviewService from '@/services';

export interface DirectoryTreeSelectProps extends TreeSelectProps {}

const DirectoryTreeSelect: React.FC<DirectoryTreeSelectProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const [dirTree, setDirTree] = useState<directoryTree.DirectoryTree[]>();

  useMount(() => {
    webviewService.queryCWD();
  });

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'vscode-CWD') {
      setDirTree(vscodeMsg.data as directoryTree.DirectoryTree[]);
    }
  });

  const handleDir2TreeData = (children: directoryTree.DirectoryTree[]): DefaultOptionType[] => {
    return children.map(({ type, name, path, children }) => ({
      path,
      icon: type === 'directory' ? <FolderFilled /> : <FileOutlined />,
      title: name,
      value: path,
      children: handleDir2TreeData(children ?? []),
    }));
  };

  const dirTreeData: DefaultOptionType[] = useMemo(() => {
    return dirTree ? handleDir2TreeData(dirTree) : [];
  }, [dirTree]);

  return <TreeSelect treeIcon treeData={dirTreeData} treeNodeLabelProp="path" className={`${styles.root} ${className}`} {...otherProps} />;
};

export default DirectoryTreeSelect;
