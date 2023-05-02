import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export type RemoteUrlConfigItem = {
  name: string;
  url: string;
};

export type HttpMethod = Lowercase<'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH'>;

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
