import React from 'react';
import styles from './DocCard.module.less';
import { Card, CardProps, Space, Typography, Popconfirm, theme, Dropdown } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { EditOutlined, DeleteOutlined, DragOutlined, SwapOutlined } from '@ant-design/icons';
import ActionIcon from '@/components/ActionIcon';
import { SortHandle } from '@orca-fe/dnd';

export interface DocCardProps extends Omit<CardProps, 'extra'> {
  data: Partial<SwaggerUrlConfigItem>;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: (targetGroupId: string) => void;
  moveTargetOptions?: Array<{ label: string; value: string }>;
}

const DocCard = (props: DocCardProps) => {
  const { className = '', data, onEdit, onDelete, onMove, moveTargetOptions, ...otherProps } = props;
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
              title="排序"
              style={{
                cursor: 'grab',
                color: token.yellow,
              }}
            />
          </SortHandle>
          <ActionIcon icon={<EditOutlined />} title="编辑" onClick={onEdit} />
          {onMove && moveTargetOptions && moveTargetOptions.length > 0 && (
            <Dropdown
              menu={{
                items: moveTargetOptions.map((option) => ({
                  key: option.value,
                  label: option.label,
                  onClick: () => onMove(option.value),
                })),
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <ActionIcon icon={<SwapOutlined />} title="移动至其他分组" style={{ color: token.colorPrimary }} />
            </Dropdown>
          )}
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
