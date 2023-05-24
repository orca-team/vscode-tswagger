import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

/**
 * 生成接口所需的映射信息
 * 其中接口所需的参数包含了 pathParam | pathQuery | requestBody 的类型名称映射 (TODO: headers)
 * 同时包含返回体参数名称 response
 */
export type ServiceInfoMap = {
  basePath: string;
  path: string;
  method: string;
  serviceName: string;
  pathParam?: string;
  pathQuery?: string;
  requestBody?: string;
  response?: string;
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
