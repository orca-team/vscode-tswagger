import React from 'react';
import styles from './SectionTitle.less';
import { theme } from 'antd';

export interface SectionTitleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'defaultValue' | 'onChange'> {
  title: React.ReactNode;

  extra?: React.ReactNode;
}

const SectionTitle = (props: SectionTitleProps) => {
  const { className = '', title, extra, ...otherProps } = props;
  const { token } = theme.useToken();

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <div className={styles.prefix} style={{ backgroundColor: token.colorPrimary }}></div>
      <div className={styles.title}>{title}</div>
      <div className={styles.extra}>{extra}</div>
    </div>
  );
};

export default SectionTitle;
