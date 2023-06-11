import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

/**
 * 生成接口所需的映射信息
 * 其中接口所需的参数包含了 pathParam | pathQuery | requestBody 的类型名称映射 (TODO: headers)
 * 同时包含返回体参数名称 response
 */
export type ServiceInfoMap = {
  /**
   * 基础路径
   */
  basePath: string;
  /**
   * api 路径
   */
  path: string;
  /**
   * 请求方式
   */
  method: string;
  /**
   * 生成的接口名称
   */
  serviceName: string;
  /**
   * 接口路径参数
   */
  pathParam?: string;
  /**
   * 接口携带参数
   */
  pathQuery?: string;
  /**
   * 请求体数据
   */
  requestBody?: string;
  /**
   * 响应体数据
   */
  response?: string;
  /**
   * 接口路径参数值集合
   */
  pathParamFields?: string[];
};

export type SwaggerCollectionType = 'path' | 'query' | 'body' | 'response' | 'service';

export type SwaggerCollectionItem = {
  type: SwaggerCollectionType;
  tag: string;
  targetPath: string;
  name?: string;
  schemaList?: OpenAPIV2.SchemaObject[] | OpenAPIV3.SchemaObject[];
  serviceInfoMap?: ServiceInfoMap;
};
