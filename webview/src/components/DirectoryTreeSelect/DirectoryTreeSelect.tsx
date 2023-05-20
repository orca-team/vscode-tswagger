import React, { useMemo, useState } from 'react';
import styles from './DirectoryTreeSelect.less';
import { useMount } from 'ahooks';
import useMessageListener from '@/hooks/useMessageListener';
import directoryTree from 'directory-tree';
import { TreeSelect, TreeSelectProps } from 'antd';
import { FileOutlined, FolderFilled } from '@ant-design/icons';
import { apiQueryCwd } from '@/services';

export interface DirectoryTreeSelectProps extends TreeSelectProps {}

const DirectoryTreeSelect: React.FC<DirectoryTreeSelectProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const [dirTree, setDirTree] = useState<directoryTree.DirectoryTree[]>();

  const getCwdTreeData = async () => {
    const resp = await apiQueryCwd();
    if (resp.success) {
      setDirTree(resp.data);
    }
  };

  useMount(() => {
    getCwdTreeData();
  });

  useMessageListener((vscodeMsg) => {
    if (vscodeMsg.method === 'webview-tsFileChange') {
      setDirTree(vscodeMsg.data as directoryTree.DirectoryTree[]);
    }
  });

  const handleDir2TreeData = (children: directoryTree.DirectoryTree[]): TreeSelectProps['treeData'] => {
    return children.map(({ type, name, path, children }) => {
      const isDirectory = type === 'directory';
      return {
        path,
        icon: isDirectory ? <FolderFilled /> : <FileOutlined />,
        title: name,
        value: path,
        disabled: isDirectory,
        children: handleDir2TreeData(children ?? []),
      };
    });
  };

  const dirTreeData: TreeSelectProps['treeData'] = useMemo(() => {
    return dirTree ? handleDir2TreeData(dirTree) : [];
  }, [dirTree]);

  return (
    <TreeSelect
      treeIcon
      treeDefaultExpandAll
      treeData={dirTreeData}
      treeNodeLabelProp="path"
      className={`${styles.root} ${className}`}
      {...otherProps}
    />
  );
};

export default DirectoryTreeSelect;
