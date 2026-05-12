import { OpenAPIV2 } from 'openapi-types';

export type $RefType = '$REF_LOCAL' | '$REF_URL' | '$REF_REMOTE';

export type HandleSwaggerPathOptions = {
  requestParams: boolean;
  responseBody: boolean;
  service: boolean;
};

export type TranslateEngine = 'Bing' | 'Microsoft' | 'PrivateMicrosoft';

export type LocalTranslationMap = Record<string, string>;

export type LocalTranslationType = {
  engine: TranslateEngine;
  translation: LocalTranslationMap;
};

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

export type ApiNameMapping = {
  from: string;
  to: string;
};

export type ParamRefDefNameType = {
  type: keyof Pick<ApiGroupNameMapping, 'pathParamName' | 'pathQueryName' | 'requestBodyName' | 'responseBodyName'>;
  originRefName: string;
};

export type ApiGroupNameMapping = {
  path: string;
  method: HttpMethod;
  groupName: string;
  paramRefDefNameList: ParamRefDefNameType[];
  description?: string;
  pathParamName?: string;
  pathQueryName?: string;
  requestBodyName?: string;
  responseBodyName?: string;
  formDataName?: string;
  serviceName?: string;
};

export type ApiGroupDefNameMapping = {
  groupName: string;
  mapping: Record<string, string>;
};

export type ServiceResult = {
  tag: string;
  path: string;
  method: string;
  serviceName: string;
  tsDefs: string;
  localTsDefs?: string;
};

export type ApiGroupServiceResult = {
  groupName: string;
  serviceList: ServiceResult[];
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

export type ServiceMapInfoYAMLJSONType = {
  tswagger: string;
  basePath?: string;
  groupName: string;
  createTime: string;
  nameMappingList: ApiGroupNameMapping[];
  defNameMappingList: ApiGroupDefNameMapping[];
};

export interface GroupedSwaggerDocItem {
  key: number | string;
  name?: string;
  url: string;
  groupId?: string;
}

export interface SwaggerDocGroup {
  id: string;
  name: string;
  docs: GroupedSwaggerDocItem[];
}

export type GroupedSwaggerDocList = SwaggerDocGroup[];

type CurrentProjectSwaggerUrls = {
  url?: string;
  remark?: string;
};

export type TSwaggerConfig = Partial<{
  fetchFilePath: string;
  addBasePathPrefix: boolean;
  basePathMapping?: Record<string, string>;
  swaggerUrls?: CurrentProjectSwaggerUrls[];
}>;