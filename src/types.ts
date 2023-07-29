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
 * <参数名称=实体名称>关联类型
 */
export type ParamRefDefNameType = {
  /**
   * 归属类型
   */
  type: keyof Pick<ApiGroupNameMapping, 'pathParamName' | 'pathQueryName' | 'requestBodyName' | 'responseBodyName'>;
  /**
   * 原归属实体类名
   */
  originRefName: string;
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
   * <参数名称=实体名称>关联列表
   */
  paramRefDefNameList: ParamRefDefNameType[];
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
   * FormData 数据 ts 名称
   */
  formDataName?: string;
  /**
   * 生成的接口名称
   */
  serviceName?: string;
};

/**
 * 不同分组下所依赖的实体名称映射
 */
export type ApiGroupDefNameMapping = {
  /**
   * 分组名称（即 tag 名称）
   */
  groupName: string;
  /**
   * 依赖实体名称映射
   */
  mapping: Record<string, string>;
};

/**
 * 接口生成结果
 */
export type ServiceResult = {
  /**
   * biaoq
   */
  tag: string;
  /**
   * 路径
   */
  path: string;
  /**
   * 请求方式
   */
  method: string;
  /**
   * 接口名称
   */
  serviceName: string;
  /**
   * 结果定义
   */
  tsDefs: string;
};

/**
 * 不同分组下的接口生成结果
 */
export type ApiGroupServiceResult = {
  /**
   * 分组名称（即 tag 名称）
   */
  groupName: string;

  /**
   * 生成接口列表
   */
  serviceList: ServiceResult[];
};

/**
 * 根据标签分组的接口各类型定义名称
 */
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

/**
 * 本地保存的接口文件 & 接口名称映射文件类型
 */
export type ServiceMapInfoYAMLJSONType = {
  /** 插件版本 */
  tswagger: string;
  /** 接口基本路径 */
  basePath?: string;
  /** 分组名称 */
  groupName: string;
  /** 生成时间 */
  createTime: string;
  /** 名称映射数据 */
  nameMappingList: ApiGroupNameMapping[];
  /** 依赖名称映射数据 */
  defNameMappingList: ApiGroupDefNameMapping[];
};

/**
 * 项目插件配置文件
 */
export type TSwaggerConfig = Partial<{
  /** fetch 路径地址，必须以别名开头，约定以 @ 开头，@ 表示 src 目录，默认为 @/utils/fetch */
  fetchFilePath: string;
  /** 是否自动为生成的接口文件增加前缀，默认为 true */
  addBasePathPrefix: boolean;
}>;
