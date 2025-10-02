import React, { useMemo } from 'react';
import styles from './SearchSuite.less';
import { ApiGroupByTag, ApiPathTypeV2 } from '../../../../src/types';
import { useControllableValue, useMemoizedFn } from 'ahooks';
import { AutoComplete, Select, SelectProps, Space } from 'antd';
import PathInfoItem from '../PathInfoItem';
import { DefaultOptionType } from 'antd/es/select';

const CONNECTOR = '____';

export type SearchValue = {
  tagNameList?: string[];
  keyword?: string;
};

export interface SearchKeywordOption extends DefaultOptionType {
  path?: string;
  summary?: string;
}

export interface GroupedSearchOption {
  label: string;
  options: SearchKeywordOption[];
}

export interface SearchSuiteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: SearchValue;

  onChange?: (value?: SearchValue) => void;

  allApiGroup?: ApiGroupByTag[];
}

const SearchSuite = (props: SearchSuiteProps) => {
  const { className = '', value: _v, onChange: _onC, allApiGroup = [], ...otherProps } = props;
  const [value, setValue] = useControllableValue<SearchValue | undefined>(props);
  const { tagNameList, keyword } = value ?? {};

  const renderKeywordLabel = useMemoizedFn((apiInfo: ApiPathTypeV2) => {
    return (
      <Space size={2}>
        <PathInfoItem apiPath={apiInfo} />
      </Space>
    );
  });

  const tagOptions = useMemo<SelectProps['options']>(() => allApiGroup?.map(({ tag }) => ({ label: tag.name, value: tag.name })), [allApiGroup]);
  const keywordOptions = useMemo<GroupedSearchOption[] | undefined>(() => {
    const currentGroups = allApiGroup?.filter(({ tag }) => tagNameList?.includes(tag.name)) ?? [];
    return currentGroups.map(({ tag, apiPathList }) => ({
      label: tag.name,
      options: apiPathList.map((apiPath) => {
        const { method, path, pathInfo } = apiPath;
        return {
          label: renderKeywordLabel(apiPath),
          value: [tag.name, method, path].join(CONNECTOR),
          path,
          summary: pathInfo.summary,
        };
      }),
    }));
  }, [allApiGroup, tagNameList]);

  return (
    <div className={`${styles.root} ${className}`} {...otherProps}>
      <Select
        placeholder="请选择标签"
        options={tagOptions}
        mode="multiple"
        value={tagNameList}
        onChange={(v) => {
          setValue({ tagNameList: v, keyword: v?.length ? keyword : undefined });
        }}
        style={{ width: '40%' }}
        allowClear
      />
      <span className={styles.divider}>-</span>
      <AutoComplete
        placeholder="请输入接口路径或接口说明"
        options={keywordOptions}
        filterOption={(inputValue, option) => {
          if (!inputValue) {
            return true;
          }
          // For grouped options, option will be the individual option, not the group
          const optionData = option as SearchKeywordOption;
          const { path, summary } = optionData ?? {};
          return Boolean(path?.includes(inputValue) || summary?.includes(inputValue));
        }}
        value={keyword}
        onChange={(v) => {
          setValue({ tagNameList, keyword: v });
        }}
        onSelect={(v) => {
          const [, , path] = v?.split(CONNECTOR) ?? [];
          setValue({ tagNameList, keyword: path });
        }}
        style={{ flex: 1 }}
        allowClear
      />
    </div>
  );
};

export default SearchSuite;
