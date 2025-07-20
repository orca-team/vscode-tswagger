import React from 'react';
import styles from './DocCard.module.less';
import { Card, CardProps, Form, Input, Space, Typography, Popconfirm, theme } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useControllableValue, useMemoizedFn } from 'ahooks';
import { EditOutlined, SaveOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import ActionIcon from '@/components/ActionIcon';
import { useSwaggerDocDrawerContext } from '../context';

export interface DocCardProps extends Omit<CardProps, 'extra'> {
  data: Partial<SwaggerUrlConfigItem>;

  editing?: boolean;

  onEditingChange?: (editing?: boolean) => void;
  onDelete?: () => void;

  onSave?: (data: SwaggerUrlConfigItem) => boolean | void;
}

const DocCard = (props: DocCardProps) => {
  const { className = '', data, editing: _e, onEditingChange: _onE, onSave, onDelete, ...otherProps } = props;
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const [editing, setEditing] = useControllableValue<boolean>(props, {
    defaultValue: false,
    valuePropName: 'editing',
    trigger: 'onEditingChange',
  });

  const { swaggerUrlList } = useSwaggerDocDrawerContext();

  const handleSave = useMemoizedFn(async () => {
    const value = await form.validateFields();
    const saveResult = onSave?.(value);
    // 只有保存成功时才退出编辑态
    if (saveResult !== false) {
      setEditing(false);
    }
  });

  return (
    <Form form={form} initialValues={data}>
      <Form.Item name="key" hidden />
      <Card
        className={`${styles.root} ${className}`}
        size="small"
        title={
          editing ? (
            <Form.Item name="name" style={{ margin: 0 }}>
              <Input size="small" placeholder="请输入接口地址别名" />
            </Form.Item>
          ) : (
            <Typography.Text className={styles.name} ellipsis={{ tooltip: true }} strong>
              {data.name}
            </Typography.Text>
          )
        }
        extra={
          <Space size="small">
            <ActionIcon
              icon={<DragOutlined />}
              title="移动"
              style={{
                cursor: editing ? 'not-allowed' : 'grab',
                color: editing ? '#d9d9d9' : token.yellow,
              }}
              disabled={editing}
            />
            {editing ? (
              <ActionIcon icon={<SaveOutlined />} title="保存" onClick={handleSave}></ActionIcon>
            ) : (
              <ActionIcon
                icon={<EditOutlined />}
                title="编辑"
                onClick={() => {
                  setEditing(true);
                }}
              ></ActionIcon>
            )}
            <Popconfirm
              title="确认删除"
              description="是否确认删除？"
              onConfirm={onDelete}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <ActionIcon icon={<DeleteOutlined />} title="删除" danger></ActionIcon>
            </Popconfirm>
          </Space>
        }
        {...otherProps}
      >
        {editing ? (
          <Form.Item
            label="文档接口地址"
            name="url"
            rules={[
              {
                required: true,
                validator(rule, value, callback) {
                  if (!value) {
                    callback('文档接口地址不能为空');
                  }
                  const values = form.getFieldsValue();
                  const otherUrlList = swaggerUrlList.filter((it) => it.key !== values.key);
                  if (otherUrlList.find(({ url }) => url === value)) {
                    callback('重复的文档接口地址');
                  }

                  callback();
                },
              },
            ]}
          >
            <Input size="small" placeholder="请输入接口地址" />
          </Form.Item>
        ) : (
          <Typography.Text
            className={styles.url}
            underline
            copyable
            style={{ color: token.colorTextBase }}
            ellipsis={{
              tooltip: true,
            }}
          >
            {data.url}
          </Typography.Text>
        )}
      </Card>
    </Form>
  );
};

export default DocCard;
