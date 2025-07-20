import { OpenAPIV2 } from 'openapi-types';
import { HttpMethod } from '../../../src/types';

export type SwaggerUrlConfigItem = {
  key: number | string;
  url: string;
  name?: string;
};

/**
 * 分组类型的 Swagger 文档配置项
 * groupId 为可选，没有 groupId 的文档被认为是未分组
 * key 用于唯一标识文档，在数据操作和 React 渲染中都有重要作用
 */
export type GroupedSwaggerDocItem = {
  key: number | string;
  url: string;
  name?: string;
  groupId?: string;
};

/**
 * Swagger 文档分组
 */
export type SwaggerDocGroup = {
  id: string;
  name: string;
  docs: GroupedSwaggerDocItem[];
};

/**
 * 分组类型的 Swagger 文档列表
 */
export type GroupedSwaggerDocList = SwaggerDocGroup[];

export type ApiPathType = {
  method: HttpMethod;
  path: string;
  pathInfo: OpenAPIV2.OperationObject;
};

export type ApiGroupByTag = {
  tag: OpenAPIV2.TagObject;
  apiPathList: ApiPathType[];
};

export type SwaggerPathSchema = {
  tag: string;
  apiPathList: ApiPathType[];
};
