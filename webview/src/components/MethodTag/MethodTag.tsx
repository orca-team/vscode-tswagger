import React from 'react';
import styles from './MethodTag.less';
import { Tag, TagProps } from 'antd';
import { HttpMethod } from '@tswagger/types';

const methodClassMap: Record<HttpMethod, string> = {
  get: styles.methodGet,
  post: styles.methodPost,
  put: styles.methodPut,
  delete: styles.methodDelete,
  patch: styles.methodPatch,
  options: styles.methodOptions,
  head: styles.methodHead,
};

export interface MethodTagProps extends TagProps {
  method: HttpMethod;
}

const MethodTag: React.FC<MethodTagProps> = (props) => {
  const { className = '', method, ...otherProps } = props;

  return (
    <Tag className={`${styles.root} ${methodClassMap[method] ?? ''} ${className}`} {...otherProps}>
      {method.toUpperCase()}
    </Tag>
  );
};

export default MethodTag;
