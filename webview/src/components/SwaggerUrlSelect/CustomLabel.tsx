import React, { MouseEventHandler } from 'react';
import styles from './CustomLabel.less';
import { SwaggerUrlConfigItem } from '@/utils/types';
import { Form, Input, Modal, Space } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useBoolean } from 'ahooks';
import UrlConfigForm from './UrlConfigForm';
import useSwaggerUrlService from './useSwaggerUrlService';

export const formatSwaggerConfigLabel = (item: SwaggerUrlConfigItem) => {
  const { name, url } = item;

  return name ? `${name} (${url})` : url;
};

export interface CustomLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: SwaggerUrlConfigItem;
}

const CustomLabel: React.FC<CustomLabelProps> = (props) => {
  const { className = '', value, ...otherProps } = props;

  const [form] = Form.useForm();
  const swaggerService = useSwaggerUrlService();

  const [operationVisible, { setTrue: showOperation, setFalse: hideOperation }] = useBoolean(false);

  const handleEdit = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation();
    form.setFieldsValue(value);
    Modal.confirm({
      icon: null,
      title: '修改接口地址信息',
      zIndex: 9999,
      content: <UrlConfigForm form={form} />,
      onOk: async () => {
        const updatedValue = await form.validateFields();
        swaggerService.updateSwaggerUrl({ ...value, ...updatedValue });
      },
      cancelText: '取消',
      okText: '确定修改',
    });
  };

  return (
    <div className={`${styles.root} ${className}`} {...otherProps} onMouseEnter={showOperation} onMouseLeave={hideOperation}>
      <span className={styles.label}>{formatSwaggerConfigLabel(value)}</span>
      <Space className={styles.operation} size="middle" style={{ display: operationVisible ? 'flex' : 'none' }}>
        <EditOutlined onClick={handleEdit} />
        <DeleteOutlined
          onClick={(e) => {
            e.stopPropagation();
            swaggerService.delSwaggerUrl(value);
          }}
        />
      </Space>
    </div>
  );
};

export default CustomLabel;
