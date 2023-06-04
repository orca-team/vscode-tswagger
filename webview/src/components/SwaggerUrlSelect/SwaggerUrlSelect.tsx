import React from 'react';
import styles from './SwaggerUrlSelect.less';
import { Button, Divider, Form, Select, SelectProps, Space } from 'antd';
import { useGlobalState } from '@/states/globalState';
import { PlusOutlined } from '@ant-design/icons';
import CustomLabel from './CustomLabel';
import UrlConfigForm from './UrlConfigForm';
import useSwaggerUrlService from './useSwaggerUrlService';

export interface SwaggerUrlSelectProps extends SelectProps {}

const SwaggerUrlSelect: React.FC<SwaggerUrlSelectProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const { extSetting } = useGlobalState();
  const { swaggerUrlList } = extSetting;

  const [addForm] = Form.useForm();
  const swaggerService = useSwaggerUrlService();

  const handleAdd = async () => {
    const value = await addForm.validateFields();
    swaggerService.addSwaggerUrl(value);
  };

  return (
    <Select
      className={`${styles.root} ${className}`}
      placeholder="请选择已有的接口地址或直接在下拉框中新增接口文档"
      {...otherProps}
      options={swaggerUrlList.map((config, index) => ({
        label: <CustomLabel value={config} />,
        value: config.url,
      }))}
      dropdownRender={(menu) => {
        return (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Space className={styles.dropdownForm}>
              <UrlConfigForm form={addForm} layout="inline" labelCol={{ span: 9 }} />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginLeft: 'auto' }}>
                添加
              </Button>
            </Space>
          </>
        );
      }}
    />
  );
};

export default SwaggerUrlSelect;
