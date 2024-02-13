import React from 'react';
import styles from './SectionContent.less';

export interface SectionContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {}

const SectionContent = (props: SectionContentProps) => {
  const { className = '', children, ...otherProps } = props;

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      {children}
    </div>
  );
};

export default SectionContent;
