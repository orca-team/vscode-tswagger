import React from 'react';
import styles from './RenameText.less';
import { Typography } from 'antd';
import { useControllableValue } from 'ahooks';
import { EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface RenameTextProps {
  className?: string;
  value?: string;
  onChange?: (modifiedText: string) => void;
}

const RenameText: React.FC<RenameTextProps> = (props) => {
  const { className = '' } = props;

  const [textValue, setTextValue] = useControllableValue<string>(props, { defaultValue: '' });

  return (
    <Text
      className={`${styles.root} ${className}`}
      underline
      editable={{
        icon: <EditOutlined style={{ paddingLeft: 6, fontSize: 16 }} />,
        onChange(value) {
          setTextValue(value);
        },
      }}
    >
      {textValue}
    </Text>
  );
};

export default RenameText;
