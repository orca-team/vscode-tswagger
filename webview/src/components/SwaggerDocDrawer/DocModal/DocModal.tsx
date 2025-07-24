import React from 'react';
import { Modal, Form, Input, FormProps, ModalProps } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useMemoizedFn } from 'ahooks';

export interface DocModalProps extends Omit<ModalProps, 'onOk'> {
  open?: boolean;
  data?: Partial<SwaggerUrlConfigItem>;
  title?: string;
  onCancel?: () => void;
  onOk?: (data: SwaggerUrlConfigItem) => Promise<boolean | void> | boolean | void;
  validateUrl?: (url: string) => string | undefined;
}

const DocModal = (props: DocModalProps) => {
  const { open, data, title = '编辑文档', onCancel, onOk, validateUrl, ...otherProps } = props;
  const [form] = Form.useForm();

  const handleOk = useMemoizedFn(async () => {
    try {
      const values = await form.validateFields();
      const result = await onOk?.(values);
      // 只有保存成功时才关闭弹窗
      if (result !== false) {
        onCancel?.();
      }
    } catch (error) {
      // 表单验证失败，不关闭弹窗
    }
  });

  const handleCancel = useMemoizedFn(() => {
    form.resetFields();
    onCancel?.();
  });

  return (
    <Modal title={title} open={open} onOk={handleOk} onCancel={handleCancel} okText="保存" cancelText="取消" maskClosable={false} {...otherProps}>
      <Form form={form} layout="vertical" initialValues={data} preserve={false}>
        <Form.Item name="key" hidden />

        <Form.Item label="接口地址别名" name="name" rules={[{ required: true, message: '请输入接口地址别名' }]}>
          <Input placeholder="请输入接口地址别名" />
        </Form.Item>

        <Form.Item
          label="文档接口地址"
          name="url"
          rules={[
            { required: true, message: '请输入文档接口地址' },
            { type: 'url', message: '请输入有效的URL地址' },
            ...(validateUrl
              ? [
                  {
                    validator: (_: any, value: any) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const error = validateUrl(value);
                      return error ? Promise.reject(new Error(error)) : Promise.resolve();
                    },
                  },
                ]
              : []),
          ]}
        >
          <Input placeholder="请输入接口地址，如：http://localhost:3000/api-docs" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DocModal;
