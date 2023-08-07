import React, { useRef } from 'react';
import styles from './UrlConfigForm.less';
import { Form, FormProps, Input } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useGlobalState } from '@/states/globalState';
import { useMount } from 'ahooks';

export interface UrlConfigFormProps extends FormProps {}

const UrlConfigForm: React.FC<UrlConfigFormProps> = (props) => {
  const { className = '', form, ...otherProps } = props;

  const { extSetting } = useGlobalState();
  const { swaggerUrlList } = extSetting;
  const originalValueRef = useRef<SwaggerUrlConfigItem>();

  useMount(() => {
    originalValueRef.current = form?.getFieldsValue();
  });

  return (
    <Form<SwaggerUrlConfigItem>
      form={form}
      layout="horizontal"
      labelAlign="left"
      labelCol={{ span: 8 }}
      className={`${styles.root} ${className}`}
      {...otherProps}
    >
      <Form.Item label="地址别名" name="name">
        <Input placeholder="请输入接口地址别名" />
      </Form.Item>
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
              const otherUrlList = swaggerUrlList.filter((it) => it.url !== originalValueRef.current?.url);
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
    </Form>
  );
};

export default UrlConfigForm;
