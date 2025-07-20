import React from 'react';
import { Button, Tooltip, ButtonProps } from 'antd';

export interface ActionIconProps extends Omit<ButtonProps, 'title'> {
  /** 图标组件 */
  icon: React.ReactNode;
  /** 提示文本 */
  title: string;
  /** 是否显示提示 */
  showTooltip?: boolean;
  /** 子元素 */
  children?: React.ReactNode;
}

const ActionIcon: React.FC<ActionIconProps> = ({ icon, title, showTooltip = true, type = 'link', size = 'small', children, ...otherProps }) => {
  const buttonElement = (
    <Button type={type} size={size} icon={icon} {...otherProps}>
      {children}
    </Button>
  );

  if (!showTooltip) {
    return buttonElement;
  }

  return <Tooltip title={title}>{buttonElement}</Tooltip>;
};

export default ActionIcon;
