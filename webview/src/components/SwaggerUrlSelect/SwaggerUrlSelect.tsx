import React, { useEffect, useMemo } from 'react';
import styles from './SwaggerUrlSelect.less';
import { Form, Select, SelectProps } from 'antd';
import { useGlobalState } from '@/states/globalState';
import { SwaggerUrlConfigItem, GroupedSwaggerDocItem } from '@/utils/types';

export const formatSwaggerConfigLabel = (item: SwaggerUrlConfigItem | GroupedSwaggerDocItem) => {
  const { name, url } = item;

  return name ? `${name} (${url})` : url;
};

export interface SwaggerUrlSelectProps extends SelectProps {}

const SwaggerUrlSelect: React.FC<SwaggerUrlSelectProps> = (props) => {
  const { className = '', ...otherProps } = props;

  const { extSetting } = useGlobalState();
  const { swaggerUrlList, groupSwaggerDocList } = extSetting;

  const [addForm] = Form.useForm();

  useEffect(() => {
    addForm.resetFields();
  }, [swaggerUrlList, groupSwaggerDocList]);

  // 构建分组选项数据
  const groupedOptions = useMemo(() => {
    const options: any[] = [];

    // 添加分组数据
    if (groupSwaggerDocList && groupSwaggerDocList.length > 0) {
      groupSwaggerDocList.forEach((group) => {
        if (group.docs && group.docs.length > 0) {
          options.push({
            label: group.name,
            options: group.docs.map((doc) => ({
              label: formatSwaggerConfigLabel(doc),
              value: doc.url,
              displayLabel: formatSwaggerConfigLabel(doc),
            })),
          });
        }
      });
    }

    // 添加未分组数据
    if (swaggerUrlList && swaggerUrlList.length > 0) {
      options.push({
        label: '未分组',
        options: swaggerUrlList.map((config) => ({
          label: formatSwaggerConfigLabel(config),
          value: config.url,
          displayLabel: formatSwaggerConfigLabel(config),
        })),
      });
    }

    return options;
  }, [swaggerUrlList, groupSwaggerDocList]);

  return (
    <Select
      className={`${styles.root} ${className}`}
      placeholder="请选择已有的接口地址或直接在下拉框中新增接口文档"
      {...otherProps}
      optionLabelProp="displayLabel"
      optionFilterProp="displayLabel"
      options={groupedOptions}
    />
  );
};

export default SwaggerUrlSelect;
