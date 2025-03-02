import { CheckboxOptionType } from "antd";

export const PARSE_METHOD_DOCS = 'swagger docs';
export const PARSE_METHOD_LOCAL = 'local file';

export const SEARCH_FILTER = {
    HIDE_EMPTY_GROUP: 'hideEmptyGroup'
};

export const ADVANCED_SEARCH_OPTIONS: CheckboxOptionType[] = [
    {
        label: '隐藏无接口的分组',
        value: SEARCH_FILTER.HIDE_EMPTY_GROUP
    }
];
