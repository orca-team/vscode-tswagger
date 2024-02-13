import React, { ReactNode } from 'react';
import styles from './SectionLayout.less';
import SectionTitle, { SectionTitleProps } from './SectionTitle';
import SectionContent from './SectionContent';

export interface SectionLayoutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'defaultValue' | 'onChange'> {
  title: SectionTitleProps['title'];

  titleProps?: Omit<SectionTitleProps, 'title'>;
}

const SectionLayout = (props: SectionLayoutProps) => {
  const { className = '', title, children, titleProps, ...otherProps } = props;

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <SectionTitle title={title} {...titleProps} />
      <SectionContent>{children}</SectionContent>
    </div>
  );
};

SectionLayout.Title = SectionTitle;
SectionLayout.Content = SectionContent;

export default SectionLayout;
