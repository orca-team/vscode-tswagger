import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export type ServiceInfoMap = {
  basePath: string;
  path: string;
  method: string;
  serviceName: string;
  pathParam?: string;
  pathQuery?: string;
  requestBody?: string;
  response?: string;
  pathParamFields?: string[];
};

export type SwaggerCollectionType = 'path' | 'query' | 'body' | 'formData' | 'response';

export type SwaggerServiceInfoType = {
  type: SwaggerCollectionType;
  name: string;
  schemaList?: OpenAPIV2.SchemaObject[] | OpenAPIV3.SchemaObject[];
};

export type PathParamFieldType = {
  field: string;
  schema: OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject;
};

export type SwaggerCollectionGroupItem = {
  basePath: string;
  path: string;
  method: string;
  serviceName: string;
  serviceInfoList: SwaggerServiceInfoType[];
  tag: string;
  description?: string;
  summary?: string;
  pathParamFields?: PathParamFieldType[];
};

export type SwaggerCollectionItem = {
  basePath: string;
  tag: string;
  group: SwaggerCollectionGroupItem[];
};