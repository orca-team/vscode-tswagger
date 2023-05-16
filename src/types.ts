import { OpenAPIV2 } from 'openapi-types';

export const $REF_LOCAL = '$REF_LOCAL';
export const $REF_URL = '$REF_URL';
export const $REF_REMOTE = '$REF_REMOTE';

export type $RefType = typeof $REF_LOCAL | typeof $REF_URL | typeof $REF_REMOTE;

export type HandleSwaggerPathOptions = {
  requestParams: boolean;
  responseBody: boolean;
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
