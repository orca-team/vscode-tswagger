import React from 'react';
import styles from './DocCard.module.less';
import { Card, CardProps, Space, Typography, Popconfirm, theme } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { EditOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import ActionIcon from '@/components/ActionIcon';
import { SortHandle } from '@orca-fe/dnd';

export interface DocCardProps extends Omit<CardProps, 'extra'> {
  data: Partial<SwaggerUrlConfigItem>;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DocCard = (props: DocCardProps) => {
  const { className = '', data, onEdit, onDelete, ...otherProps } = props;
  const { token } = theme.useToken();

  return (
    <Card
      className={`${styles.root} ${className}`}
      size="small"
      title={
        <Typography.Text className={styles.name} ellipsis={{ tooltip: true }} strong>
          {data.name || '未命名文档'}
        </Typography.Text>
      }
      extra={
        <Space size="small">
          <SortHandle>
            <ActionIcon
              icon={<DragOutlined />}
              title="移动"
              style={{
                cursor: 'grab',
                color: token.yellow,
              }}
            />
          </SortHandle>
          <ActionIcon
            icon={<EditOutlined />}
            title="编辑"
            onClick={onEdit}
          />
          <Popconfirm
            title="确认删除"
            description="是否确认删除？"
            onConfirm={onDelete}
            okText="确认"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <ActionIcon icon={<DeleteOutlined />} title="删除" danger />
          </Popconfirm>
        </Space>
      }
      {...otherProps}
    >
      <Typography.Text
        className={styles.url}
        underline
        copyable
        style={{ color: token.colorTextBase }}
        ellipsis={{
          tooltip: true,
        }}
      >
        {data.url || '未设置地址'}
      </Typography.Text>
    </Card>
  );
};

export default DocCard;
