import React from 'react';
import styles from './SettingAction.less';
import { Button, ButtonProps, Divider, Typography, theme } from 'antd';

export interface SettingActionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  onSave?: () => void;

  saveButtonProps?: ButtonProps;
}

const SettingAction = (props: SettingActionProps) => {
  const { className = '', style = {}, onSave, saveButtonProps = {}, ...otherProps } = props;
  const { token } = theme.useToken();

  return (
    <div className={`${styles.root} ${className}`} style={{ backgroundColor: token.colorBgElevated, ...style }} {...otherProps}>
      <Divider dashed>
        <Typography.Text type="secondary">****</Typography.Text>
      </Divider>
      <div className={styles.actions}>
        <Button type="primary" onClick={onSave} {...saveButtonProps}>
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default SettingAction;
