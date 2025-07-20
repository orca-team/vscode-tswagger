import React from 'react';
import styles from './Components.module.less';

export interface ComponentsProps extends
  Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {

}

const Components = (props: ComponentsProps) => {
  const { className = '', ...otherProps } = props;
  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>

    </div>
  );
};

export default Components;
