import React from 'react';
import styles from './ConfigJsonForm.less';
import { Form, FormProps, Input, Radio } from 'antd';
import { DEFAULT_CONFIG_JSON } from '../../../../src/constants';

export interface ConfigJsonFormProps extends FormProps {}

const ConfigJsonForm = (props: ConfigJsonFormProps) => {
  const { className = '', ...otherProps } = props;

  return (
    <Form className={`${styles.root} ${className}`} layout="vertical" labelAlign="left" initialValues={DEFAULT_CONFIG_JSON} {...otherProps}>
      <Form.Item
        label="fetch 文件别名路径"
        name="fetchFilePath"
        validateFirst
        rules={[
          { required: true, message: '请输入 fetch 文件路径' },
          {
            validator(_, value) {
              if (value.startsWith('@')) {
                return Promise.resolve();
              }

              return Promise.reject(new Error('不符合约定的 fetch 文件路径，请以 @ 开头'));
            },
          },
        ]}
        help="约定以别名 @ 开头，@ 表示 src 目录"
      >
        <Input placeholder="请输入" />
      </Form.Item>
      <Form.Item label="自动添加接口路径前缀" name="addBasePathPrefix" rules={[{ required: true }]} style={{ paddingTop: 8 }}>
        <Radio.Group>
          <Radio value={true}>是</Radio>
          <Radio value={false}>否</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

export default ConfigJsonForm;
