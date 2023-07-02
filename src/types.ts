import { OpenAPIV2 } from 'openapi-types';

export const $REF_LOCAL = '$REF_LOCAL';
export const $REF_URL = '$REF_URL';
export const $REF_REMOTE = '$REF_REMOTE';

export type $RefType = typeof $REF_LOCAL | typeof $REF_URL | typeof $REF_REMOTE;

export type HandleSwaggerPathOptions = {
  requestParams: boolean;
  responseBody: boolean;
  service: boolean;
};

export type GlobalStateKey = 'localTranslation';

export type TranslateEngine = 'Bing';

export type LocalTranslationMap = Record<string, string>;

export type LocalTranslationType = {
  engine: TranslateEngine;
  translation: LocalTranslationMap;
};

// TODO: webview types 统一管理

export type HttpMethod = Lowercase<'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH'>;

export type ApiPathTypeV2 = {
  method: HttpMethod;
  path: string;
  pathInfo: OpenAPIV2.OperationObject;
};

export type ApiGroupByTag = {
  tag: OpenAPIV2.TagObject;
  apiPathList: ApiPathTypeV2[];
};

export type SwaggerPathSchemaV2 = {
  tag: string;
  apiPathList: ApiPathTypeV2[];
};

/**
 * api 各参数名称映射
 */
export type ApiNameMapping = {
  /**
   * 原名称
   */
  from: string;
  /**
   * 生成的名称
   */
  to: string;
};

/**
 * 接口入参、出参、接口名称映射
 */
export type ApiGroupNameMapping = {
  /**
   * 接口路径
   */
  path: string;
  /**
   * 请求方式
   */
  method: HttpMethod;
  /**
   * 分组名称（即 tag 名称）
   */
  groupName: string;
  /**
   * 接口描述
   */
  description?: string;
  /**
   * 路径参数 ts 名称
   */
  pathParamName?: string;
  /**
   * 路径携带参数 ts 名称
   */
  pathQueryName?: string;
  /**
   * 请求体参数 ts 名称
   */
  requestBodyName?: string;
  /**
   * 响应体参数 ts 名称
   */
  responseBodyName?: string;
  /**
   * 生成的接口名称
   */
  serviceName?: string;
};

export type NameMappingByGroup = {
  groupName: string;
  group: ApiGroupNameMapping[];
};

export type RenameMapping = {
  allDefNameMapping: Record<string, string>;
  nameGroup: NameMappingByGroup[];
};

export type GenerateTypescriptConfig = {
  collection: SwaggerPathSchemaV2[];
  V2Document: OpenAPIV2.Document;
  options: Partial<HandleSwaggerPathOptions>;
  renameMapping?: RenameMapping;
};
