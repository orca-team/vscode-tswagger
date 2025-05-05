import React from 'react';
import styles from './DocCard.module.less';
import { Button, Card, CardProps, Form, Input, Space, Typography, Popconfirm } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useControllableValue, useMemoizedFn } from 'ahooks';
import { useGlobalState } from '@/states/globalState';
import { ArrowDownOutlined, ArrowUpOutlined, EditOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSwaggerDocDrawerContext } from '../context';

export interface DocCardProps extends Omit<CardProps, 'extra'> {
  data: Partial<SwaggerUrlConfigItem>;

  editing?: boolean;

  moveUpDisabled?: boolean;
  moveDownDisabled?: boolean;

  onEditingChange?: (editing?: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;

  onSave?: (data: SwaggerUrlConfigItem) => void;
}

const DocCard = (props: DocCardProps) => {
  const {
    className = '',
    data,
    editing: _e,
    onEditingChange: _onE,
    moveDownDisabled,
    moveUpDisabled,
    onMoveUp,
    onMoveDown,
    onSave,
    onDelete,
    ...otherProps
  } = props;
  const [form] = Form.useForm();
  const [editing, setEditing] = useControllableValue<boolean>(props, {
    defaultValue: false,
    valuePropName: 'editing',
    trigger: 'onEditingChange',
  });

  const { swaggerUrlList } = useSwaggerDocDrawerContext();

  const handleSave = useMemoizedFn(async () => {
    const value = await form.validateFields();
    onSave?.(value);
    setEditing(false);
  });

  return (
    <Form form={form} initialValues={data}>
      <Form.Item name="key" hidden />
      <Card
        className={`${styles.root} ${className}`}
        title={
          editing ? (
            <Form.Item name="name">
              <Input placeholder="请输入接口地址别名" />
            </Form.Item>
          ) : (
            <Typography.Text className={styles.name} ellipsis={{ tooltip: true }} strong>
              {data.name}
            </Typography.Text>
          )
        }
        extra={
          <Space>
            <Button type="link" icon={<ArrowUpOutlined />} disabled={moveUpDisabled} onClick={onMoveUp}>
              上移
            </Button>
            <Button type="link" icon={<ArrowDownOutlined />} disabled={moveDownDisabled} onClick={onMoveDown}>
              下移
            </Button>
            {editing ? (
              <Button type="link" icon={<SaveOutlined />} onClick={handleSave}>
                保存
              </Button>
            ) : (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(true);
                }}
              >
                编辑
              </Button>
            )}
            <Popconfirm
              title="确认删除"
              description="是否确认删除？"
              onConfirm={onDelete}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
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
            <Input placeholder="请输入接口地址" />
          </Form.Item>
        ) : (
          <Typography.Text className={styles.url} underline copyable>
            {data.url}
          </Typography.Text>
        )}
      </Card>
    </Form>
  );
};

export default DocCard;
