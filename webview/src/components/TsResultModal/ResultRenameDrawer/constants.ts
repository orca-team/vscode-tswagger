import { ApiGroupNameMapping } from '../../../../../src/types';

export type ApiGroupItemConfigType = {
  label: string;
  key: keyof Pick<ApiGroupNameMapping, 'serviceName' | 'pathParamName' | 'pathQueryName' | 'requestBodyName' | 'responseBodyName' | 'formDataName'>;
};

export const apiGroupItemConfigs: ApiGroupItemConfigType[] = [
  {
    label: '接口方法名称',
    key: 'serviceName',
  },
  {
    label: '路径参数类型名称',
    key: 'pathParamName',
  },
  {
    label: '携带参数类型名称',
    key: 'pathQueryName',
  },
  {
    label: '请求体数据类型名称',
    key: 'requestBodyName',
  },
  {
    label: '返回体数据类型名称',
    key: 'responseBodyName',
  },
  {
    label: 'FormData 数据类型名称',
    key: 'formDataName',
  },
];
