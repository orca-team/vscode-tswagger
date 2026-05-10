import { OpenAPIV2 } from 'openapi-types';
import {
  type ApiGroupByTag,
  type ApiPathTypeV2,
  type GroupedSwaggerDocItem,
  type GroupedSwaggerDocList,
  type HttpMethod,
  type SwaggerDocGroup,
  type SwaggerPathSchemaV2,
} from '@tswagger/types';

export type SwaggerUrlConfigItem = {
  key: number | string;
  url: string;
  name?: string;
};

export type ApiPathType = ApiPathTypeV2;

export type SwaggerPathSchema = SwaggerPathSchemaV2;

export type { ApiGroupByTag, ApiPathTypeV2, GroupedSwaggerDocItem, GroupedSwaggerDocList, HttpMethod, SwaggerDocGroup, SwaggerPathSchemaV2 };
