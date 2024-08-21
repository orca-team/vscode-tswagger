import React, { useContext, useEffect } from 'react';
import styles from './ApiGroupPanel.less';
import { Badge, Checkbox, Collapse, CollapsePanelProps, Space, Typography, theme } from 'antd';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import MethodTag from '@/components/MethodTag';
import { useSelections } from 'ahooks';
import { OpenAPIV2 } from 'openapi-types';
import { WebviewPageContext } from '@/pages/context';

const { Panel } = Collapse;
const { Text } = Typography;

const genSelectKey = (apiPathItem: ApiPathType) => {
  const { method, path } = apiPathItem;

  return `${method}_@@_${path}`;
};

const parseSelectKey = (selectedKey: string) => {
  const [method, path] = selectedKey.split('_@@_');

  return { method, path };
};

export interface ApiGroupPanelProps extends Omit<CollapsePanelProps, 'header'> {
  apiGroupItem: ApiGroupByTag;
  onChange?: (tag: OpenAPIV2.TagObject, selected: ApiPathType[]) => void;
}

const ApiGroupPanel: React.FC<ApiGroupPanelProps> = (props) => {
  const { className = '', apiGroupItem, onChange, ...otherProps } = props;
  const { refreshDocFlag } = useContext(WebviewPageContext);
  const { tag, apiPathList } = apiGroupItem;
  const { token } = theme.useToken();
  const { selected, toggleAll, unSelectAll, allSelected, partiallySelected, isSelected, toggle } = useSelections(apiPathList.map(genSelectKey));

  const displayPathInfo = (path: string, pathInfo: OpenAPIV2.OperationObject) => {
    const { summary } = pathInfo;

    return (
      <>
        <Text style={{ fontSize: 14 }} strong>
          {path}
        </Text>
        {summary && <Text style={{ fontSize: 14, opacity: 0.85 }}>{`（${summary}）`}</Text>}
      </>
    );
  };

  useEffect(() => {
    onChange?.(
      tag,
      selected.map((key) => {
        const { method, path } = parseSelectKey(key);
        return apiPathList.find((api) => api.method === method && api.path === path)!;
      }),
    );
  }, [selected]);

  useEffect(() => {
    unSelectAll();
  }, [refreshDocFlag]);

  return (
    <Panel
      className={`${styles.root} ${className}`}
      {...otherProps}
      header={
        <Space size="small" className={styles.tag}>
          <Checkbox
            checked={allSelected}
            indeterminate={partiallySelected}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={() => {
              toggleAll();
            }}
          />
          <Text strong style={{ fontSize: 16 }}>
            {tag.name}
          </Text>
          <Badge count={apiPathList.length} overflowCount={999} style={{ backgroundColor: token.colorSuccess }} />
        </Space>
      }
    >
      <Space direction="vertical" size="middle">
        {apiPathList.map((apiPath, index) => (
          <div key={`${apiPath.path}-${index}`}>
            <Space size="small" className={styles.path}>
              <Checkbox
                checked={isSelected(genSelectKey(apiPath))}
                onChange={() => {
                  toggle(genSelectKey(apiPath));
                }}
              />
              <MethodTag method={apiPath.method} className={styles[`httpMethod-${apiPath.method}`]}>
                {apiPath.method}
              </MethodTag>
              <Text style={{ fontSize: 14 }}>{displayPathInfo(apiPath.path, apiPath.pathInfo)}</Text>
            </Space>
          </div>
        ))}
      </Space>
    </Panel>
  );
};

export default ApiGroupPanel;
