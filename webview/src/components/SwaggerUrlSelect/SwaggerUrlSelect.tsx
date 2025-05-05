import React, { useEffect } from 'react';
import styles from './SwaggerUrlSelect.less';
import { Form, Select, SelectProps } from 'antd';
import { useGlobalState } from '@/states/globalState';
import { SwaggerUrlConfigItem } from '@/utils/types';

export const formatSwaggerConfigLabel = (item: SwaggerUrlConfigItem) => {
  const { name, url } = item;

  return name ? `${name} (${url})` : url;
};

export interface SwaggerUrlSelectProps extends SelectProps {}

const SwaggerUrlSelect: React.FC<SwaggerUrlSelectProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const { extSetting } = useGlobalState();
  const { swaggerUrlList } = extSetting;

  const [addForm] = Form.useForm();

  useEffect(() => {
    addForm.resetFields();
  }, [swaggerUrlList]);

  return (
    <Select
      className={`${styles.root} ${className}`}
      placeholder="请选择已有的接口地址或直接在下拉框中新增接口文档"
      {...otherProps}
      optionLabelProp="displayLabel"
      optionFilterProp="displayLabel"
      options={swaggerUrlList.map((config, index) => ({
        label: formatSwaggerConfigLabel(config),
        value: config.url,
        displayLabel: formatSwaggerConfigLabel(config),
      }))}
    />
  );
};

export default SwaggerUrlSelect;
