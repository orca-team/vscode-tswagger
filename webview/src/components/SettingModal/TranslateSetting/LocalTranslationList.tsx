import React from 'react';
import styles from './LocalTranslationList.less';
import { List, Space, Typography } from 'antd';
import { LocalTranslationMap } from '../../../../../src/types';

const { Text } = Typography;

export interface LocalTranslationListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  translation: LocalTranslationMap;
}

const LocalTranslationList = (props: LocalTranslationListProps) => {
  const { className = '', translation, ...otherProps } = props;
  const translationArray = Object.entries(translation).map(([key, value]) => {
    return {
      originalText: key,
      translation: value,
    };
  });

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <List
        size="small"
        dataSource={translationArray}
        renderItem={(item, index) => (
          <List.Item key={index}>
            <Space direction="vertical" size={2}>
              <Text>{item.originalText}</Text>
              <Text type="secondary" italic>
                {item.translation}
              </Text>
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
};

export default LocalTranslationList;
