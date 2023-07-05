import { OpenAPIV2 } from 'openapi-types';
import { HttpMethod } from '../../../src/types';

export type SwaggerUrlConfigItem = {
  id: number;
  url: string;
  name?: string;
};

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
