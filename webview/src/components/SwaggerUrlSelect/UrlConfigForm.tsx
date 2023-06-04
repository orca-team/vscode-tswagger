import React from 'react';
import styles from './UrlConfigForm.less';
import { Form, FormProps, Input } from 'antd';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { useGlobalState } from '@/states/globalState';

export interface UrlConfigFormProps extends FormProps {
  editMode?: boolean;
}

const UrlConfigForm: React.FC<UrlConfigFormProps> = (props) => {
  const { className = '', editMode, ...otherProps } = props;

  const { extSetting } = useGlobalState();
  const { swaggerUrlList } = extSetting;

  return (
    <Form<SwaggerUrlConfigItem>
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
        rules={
          !editMode
            ? [
                {
                  required: true,
                  validator(rule, value, callback) {
                    if (!value) {
                      callback('文档接口地址不能为空');
                    }
                    if (swaggerUrlList.find((it) => it.url === value)) {
                      callback('重复的文档接口地址');
                    }

                    callback();
                  },
                },
              ]
            : []
        }
      >
        <Input placeholder="请输入接口地址" disabled={!!editMode} />
      </Form.Item>
    </Form>
  );
};

export default UrlConfigForm;
