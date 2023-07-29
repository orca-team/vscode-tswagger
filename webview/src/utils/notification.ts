import { notification as AntdNotification } from 'antd';
import { ArgsProps } from 'antd/es/notification/interface';

export type NoticeMethod = 'success' | 'info' | 'warning' | 'error';

export type NoticeFunc = (description?: string, config?: Partial<ArgsProps>) => void;

export type Notification = Record<NoticeMethod, NoticeFunc>;

const notification: Notification = {
  // 成功提示默认 5 秒后关闭
  success: (description, config) => {
    AntdNotification.success({ message: '操作成功', description, duration: 5, ...config });
  },
  // 信息提示默认 5 秒后关闭
  info: (description, config) => {
    AntdNotification.success({ message: '提示信息', description, duration: 5, ...config });
  },
  // 警告信息默认 5 秒后关闭
  warning: (description, config) => {
    AntdNotification.success({ message: '警告信息', description, duration: 5, ...config });
  },
  // 错误信息默认不关闭
  error: (description, config) => {
    AntdNotification.success({ message: '错误提示', description, duration: null, ...config });
  },
};

export default notification;
