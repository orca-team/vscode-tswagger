import React from 'react';
import styles from './RenameText.less';
import { Typography } from 'antd';
import { useControllableValue } from 'ahooks';
import { EditOutlined } from '@ant-design/icons';
import { TextProps } from 'antd/es/typography/Text';

const { Text } = Typography;

export interface RenameTextProps extends Omit<TextProps, 'onChange' | 'editable'> {
  className?: string;
  value?: string;
  onChange?: (modifiedText: string) => void;
}

const RenameText: React.FC<RenameTextProps> = (props) => {
  const { className = '', underline = true, disabled, ...otherProps } = props;

  const [textValue, setTextValue] = useControllableValue<string>(props, { defaultValue: '' });

  return (
    <Text
      className={`${styles.root} ${className}`}
      underline={underline}
      disabled={disabled}
      editable={
        disabled
          ? false
          : {
              icon: <EditOutlined style={{ paddingLeft: 6, fontSize: 16 }} />,
              triggerType: ['icon', 'text'],
              onChange(value) {
                setTextValue(value);
              },
            }
      }
      {...otherProps}
      onChange={() => {}}
    >
      {textValue}
    </Text>
  );
};

export default RenameText;
