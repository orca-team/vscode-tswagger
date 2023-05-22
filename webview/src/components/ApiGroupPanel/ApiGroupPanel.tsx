import React, { useEffect } from 'react';
import styles from './ApiGroupPanel.less';
import { Badge, Checkbox, Collapse, CollapsePanelProps, Space, Typography, theme } from 'antd';
import { ApiGroupByTag, ApiPathType } from '@/utils/types';
import MethodTag from '@/components/MethodTag';
import { useSelections } from 'ahooks';
import { OpenAPIV2 } from 'openapi-types';

const { Panel } = Collapse;
const { Text } = Typography;

export interface ApiGroupPanelProps extends Omit<CollapsePanelProps, 'header'> {
  apiGroupItem: ApiGroupByTag;
  onChange?: (tag: OpenAPIV2.TagObject, selected: ApiPathType[]) => void;
}

const ApiGroupPanel: React.FC<ApiGroupPanelProps> = (props) => {
  const { className = '', apiGroupItem, onChange, ...otherProps } = props;
  const { tag, apiPathList } = apiGroupItem;

  const { token } = theme.useToken();
  const { selected, toggleAll, allSelected, partiallySelected, isSelected, toggle } = useSelections(apiPathList);

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
    onChange?.(tag, selected);
  }, [selected]);

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
              toggleAll();
              e.stopPropagation();
            }}
          />
          <Text strong style={{ fontSize: 16 }}>
            {tag.name}
          </Text>
          <Badge count={apiPathList.length} style={{ backgroundColor: token.colorSuccess }} />
        </Space>
      }
    >
      <Space direction="vertical" size="middle">
        {apiPathList.map((apiPath, index) => (
          <div key={`${apiPath.path}-${index}`}>
            <Space size="small" className={styles.path}>
              <Checkbox
                checked={isSelected(apiPath)}
                onClick={() => {
                  toggle(apiPath);
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
