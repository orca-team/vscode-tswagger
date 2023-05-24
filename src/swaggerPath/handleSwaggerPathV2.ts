import { OpenAPIV2 } from 'openapi-types';
import { ApiPathTypeV2, HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from '../types';
import { composeNameByAPIPath, getV2RefTargetSchema } from './helpers';
import { filterString, groupV2Parameters, isLocal$ref, isV2RefObject } from '../utils/swaggerUtil';
import { ServiceInfoMap, SwaggerCollectionItem } from './types';
import { upperCase } from 'lodash-es';

const generateTsName = async (apiPath: ApiPathTypeV2, type: string) => {
  const { method, pathInfo, path } = apiPath;
  const { operationId } = pathInfo;
  if (operationId) {
    return composeNameByAPIPath('', await filterString(operationId), '');
  }
  return composeNameByAPIPath(method, path, type);
};

const generateTsDefDesc = (apiPath: ApiPathTypeV2, type: string) => {
  const { path, method } = apiPath;

  return `【${upperCase(method)}】${path} ${type}`;
};

const handleV2RequestProperties = (parameters: OpenAPIV2.Parameters) => {
  let properties: Record<string, OpenAPIV2.SchemaObject> = {};
  parameters.forEach((parameter) => {
    const { schema = {}, name } = parameter as OpenAPIV2.Parameter;
    // console.log('parameter', parameter);
    // 目前仅处理本地引用
    if (isLocal$ref(schema.$ref)) {
      // const className = match$RefClassName(schema.$ref);
      properties[name] = { $ref: schema.$ref };
    } else {
      const { name, schema, description, required } = parameter as OpenAPIV2.Parameter;
      properties[name] = schema || parameter || {};
      properties[name].description = description ?? '';
      properties[name].required = required ? [name] : [];
    }
  });

  return properties;
};

export const handleV2Parameters = (parameters: OpenAPIV2.Parameter[]) => {
  const result: OpenAPIV2.SchemaObject = {
    type: 'object',
  };
  const properties = handleV2RequestProperties(parameters);
  const requiredSet = new Set<string>();
  parameters.forEach((param) => {
    if (Array.isArray(param.required)) {
      param.required.forEach((requiredField) => {
        requiredSet.add(requiredField);
      });
    }
  });

  result.properties = properties;
  result.required = Array.from(requiredSet.values());

  return result;
};

export const handleV2Request = async (apiPath: ApiPathTypeV2, tag: string, V2Document: OpenAPIV2.Document) => {
  const { method, path, pathInfo } = apiPath;
  const { parameters } = pathInfo;
  if (!parameters) {
    return [];
  }
  const { pathParameters, queryParameters, bodyParameter } = groupV2Parameters(parameters);
  const collection: SwaggerCollectionItem[] = [];

  const basicInfo: Pick<SwaggerCollectionItem, 'tag' | 'targetPath'> = {
    tag,
    targetPath: path,
  };

  const merge = (target: Pick<SwaggerCollectionItem, 'type' | 'name' | 'schemaList'>) => ({ ...target, ...basicInfo });

  // 请求 Body (有且仅有一个 body)
  if (bodyParameter) {
    const paramsSchemaName = await generateTsName(apiPath, 'RequestBody');
    const { schema: bodySchema } = bodyParameter;
    if (isV2RefObject(bodySchema)) {
      const refSchema = await getV2RefTargetSchema(bodySchema, V2Document);
      collection.push(
        merge({
          type: 'body',
          name: refSchema.title,
          schemaList: [refSchema],
        }),
      );
    } else {
      collection.push(
        merge({
          type: 'body',
          name: paramsSchemaName,
          schemaList: [
            {
              definitions: V2Document.definitions,
              type: 'object',
              title: paramsSchemaName,
              description: generateTsDefDesc(apiPath, '请求体'),
              properties: bodySchema.properties,
              required: bodySchema.required,
            },
          ],
        }),
      );
    }
  }

  // 请求路径参数
  if (!!pathParameters.length) {
    const schemaList: OpenAPIV2.SchemaObject[] = [];
    const paramsSchemaName = await generateTsName(apiPath, 'RequestPath');
    const pathSchemaObject = handleV2Parameters(pathParameters);
    pathSchemaObject.title = paramsSchemaName;
    pathSchemaObject.description = generateTsDefDesc(apiPath, '路径参数');
    pathSchemaObject.definitions = V2Document.definitions;
    schemaList.push(pathSchemaObject);
    collection.push(
      merge({
        type: 'path',
        name: paramsSchemaName,
        schemaList,
      }),
    );
  }

  // 请求路径携带的参数
  if (!!queryParameters.length) {
    const schemaList: OpenAPIV2.SchemaObject[] = [];
    const paramsSchemaName = await generateTsName(apiPath, 'RequestQuery');
    const querySchemaObject = handleV2Parameters(queryParameters);
    querySchemaObject.title = paramsSchemaName;
    querySchemaObject.description = generateTsDefDesc(apiPath, '路径携带参数');
    querySchemaObject.definitions = V2Document.definitions;
    schemaList.push(querySchemaObject);
    collection.push(
      merge({
        type: 'query',
        name: paramsSchemaName,
        schemaList,
      }),
    );
  }

  return collection;
};

export const handleV2ResponseBody = (responses: OpenAPIV2.ResponsesObject) => {
  const successObject = (responses['200'] ? responses['200'] : responses.default ?? {}) as OpenAPIV2.ResponseObject;
  let responseSchema: OpenAPIV2.SchemaObject = {};
  const { schema = {} } = successObject;
  if (isV2RefObject(schema) && isLocal$ref(schema.$ref)) {
    responseSchema = { $ref: schema.$ref };
  } else {
    responseSchema = schema;
  }

  return responseSchema;
};

const defaultOptions: Partial<HandleSwaggerPathOptions> = {
  requestParams: true,
  responseBody: true,
  service: true,
};

const handleSwaggerPathV2 = async (
  collection: SwaggerPathSchemaV2[],
  V2Document: OpenAPIV2.Document,
  options: Partial<HandleSwaggerPathOptions> = defaultOptions,
): Promise<SwaggerCollectionItem[]> => {
  // const schemaCollection: OpenAPIV2.SchemaObject[] = [];
  const swaggerCollection: SwaggerCollectionItem[] = [];

  for (const { apiPathList, tag } of collection) {
    for (const apiPath of apiPathList) {
      const { method, path, pathInfo } = apiPath;
      const { parameters, responses } = pathInfo;
      let parameterCollection: SwaggerCollectionItem[] = [];
      let responseCollection: SwaggerCollectionItem[] = [];
      const serviceInfoMap: ServiceInfoMap = {
        path,
        method,
        basePath: V2Document.basePath ?? '',
        serviceName: pathInfo.operationId ? await filterString(pathInfo.operationId) : composeNameByAPIPath(method, path, 'API'),
      };
      // 处理入参
      if (options.requestParams && parameters) {
        parameterCollection = await handleV2Request(apiPath, tag, V2Document);
        swaggerCollection.push(...parameterCollection);
      }
      // 处理出参
      if (options.responseBody && responses) {
        const responseSchema = handleV2ResponseBody(responses);
        responseSchema.definitions = V2Document.definitions;
        if (isV2RefObject(responseSchema)) {
          const refSchema = await getV2RefTargetSchema(responseSchema, V2Document);
          responseCollection = [
            {
              tag,
              targetPath: path,
              type: 'response',
              name: refSchema.title,
              schemaList: [refSchema],
            },
          ];
        } else {
          responseSchema.type = 'object';
          responseSchema.title = composeNameByAPIPath(method, path, 'ResponseBody');
          responseSchema.description = generateTsDefDesc(apiPath, '返回数据');
          responseCollection = [
            {
              tag,
              targetPath: path,
              type: 'response',
              name: responseSchema.title,
              schemaList: [responseSchema],
            },
          ];
        }
        swaggerCollection.push(...responseCollection);
      }
      // 处理接口
      if (options.service) {
        serviceInfoMap.pathParam = parameterCollection.find((it) => it.type === 'path')?.name;
        serviceInfoMap.pathQuery = parameterCollection.find((it) => it.type === 'query')?.name;
        serviceInfoMap.requestBody = parameterCollection.find((it) => it.type === 'body')?.name;
        serviceInfoMap.response = responseCollection.find((it) => it.type === 'response')?.name;
        swaggerCollection.push({
          tag,
          type: 'service',
          targetPath: path,
          serviceInfoMap,
        });
      }
    }
  }

  return swaggerCollection;
};

export default handleSwaggerPathV2;
