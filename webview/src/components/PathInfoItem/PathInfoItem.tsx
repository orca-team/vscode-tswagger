import React from 'react';
import styles from './PathInfoItem.less';
import { Typography } from 'antd';
import { ApiPathType } from '@/utils/types';
import MethodTag from '../MethodTag';

const { Text } = Typography;

export interface PathInfoItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  apiPath: ApiPathType;
}

const PathInfoItem = (props: PathInfoItemProps) => {
  const { className = '', apiPath, ...otherProps } = props;
  const { method, path, pathInfo } = apiPath;
  const { summary, deprecated } = pathInfo;

  const titleText = `${path}${summary ? `（${summary}）` : ''}`;

  return (
    <div className={`${styles.root} ${className}`} title={titleText} {...otherProps}>
      <MethodTag method={method} className={styles.method}>
        {method}
      </MethodTag>
      <Text style={{ fontSize: 14 }} type={deprecated ? 'secondary' : undefined} strong delete={deprecated}>
        {path}
      </Text>
      {summary && <Text style={{ fontSize: 14, opacity: 0.85 }}>{`（${summary}）`}</Text>}
    </div>
  );
};

export default PathInfoItem;
