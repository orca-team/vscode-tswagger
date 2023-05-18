import { OpenAPIV2 } from 'openapi-types';
import { ApiPathTypeV2, HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from '../types';
import { composeNameByAPIPath } from './helper';
import { filterString, groupV2Parameters, isLocal$ref, isV2RefObject, match$RefClassName } from '../utils/swaggerUtil';

const generateTsName = async (apiPath: ApiPathTypeV2, type: string) => {
  const { method, pathInfo, path } = apiPath;
  const { operationId } = pathInfo;
  if (operationId) {
    return composeNameByAPIPath('', await filterString(operationId), type);
  }
  return composeNameByAPIPath(method, path, type);
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

export const handleV2Request = async (apiPath: ApiPathTypeV2, V2Document: OpenAPIV2.Document) => {
  const { method, path, pathInfo } = apiPath;
  const { parameters } = pathInfo;
  if (!parameters) {
    return [];
  }
  const { pathParameters, queryParameters, bodyParameter } = groupV2Parameters(parameters);
  const collection: OpenAPIV2.SchemaObject[] = [];

  // 请求 Body (有且仅有一个 body)
  if (bodyParameter) {
    const paramsSchemaName = await generateTsName(apiPath, 'RequestBody');
    const { schema: bodySchema } = bodyParameter;
    if (!isV2RefObject(bodySchema)) {
      collection.push({
        definitions: V2Document.definitions,
        type: 'object',
        title: paramsSchemaName,
        description: `【${method}】${path} 请求体`,
        properties: bodySchema.properties,
        required: bodySchema.required,
      });
    }
  }

  // 请求路径参数
  if (!!pathParameters.length) {
    const paramsSchemaName = await generateTsName(apiPath, 'RequestPath');
    const pathSchemaObject = handleV2Parameters(pathParameters);
    pathSchemaObject.title = paramsSchemaName;
    pathSchemaObject.description = `【${method}】${path} 路径参数`;
    pathSchemaObject.definitions = V2Document.definitions;
    collection.push(pathSchemaObject);
  }

  // 请求路径携带的参数
  if (!!queryParameters.length) {
    const paramsSchemaName = await generateTsName(apiPath, 'RequestQuery');
    const querySchemaObject = handleV2Parameters(queryParameters);
    querySchemaObject.title = paramsSchemaName;
    querySchemaObject.description = `【${method}】${path} 路径携带参数`;
    querySchemaObject.definitions = V2Document.definitions;
    collection.push(querySchemaObject);
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
};

const handleSwaggerPathV2 = async (
  collection: SwaggerPathSchemaV2[],
  V2Document: OpenAPIV2.Document,
  options: Partial<HandleSwaggerPathOptions> = defaultOptions,
): Promise<OpenAPIV2.SchemaObject[]> => {
  const schemaCollection: OpenAPIV2.SchemaObject[] = [];

  for (const { apiPathList } of collection) {
    for (const apiPath of apiPathList) {
      const { method, path, pathInfo } = apiPath;
      const { parameters, responses } = pathInfo;
      // 处理入参
      if (options.requestParams && parameters) {
        const allParamsCollection = await handleV2Request(apiPath, V2Document);
        schemaCollection.push(...allParamsCollection);
      }
      // 处理出参
      if (options.responseBody && responses) {
        const responseSchema = handleV2ResponseBody(responses);
        responseSchema.definitions = V2Document.definitions;
        if (isV2RefObject(responseSchema)) {
          const className = match$RefClassName(responseSchema.$ref);
          const refSchema = V2Document.definitions?.[className] ?? {};
          // refSchema.definitions = V2Document.definitions;
          schemaCollection.push(refSchema);
        } else {
          responseSchema.title = composeNameByAPIPath(method, path, 'ResponseBody');
          responseSchema.type = 'object';
          responseSchema.description = `【${method}】${path} 返回数据`;
          schemaCollection.push(responseSchema);
        }
      }
    }
  }

  return schemaCollection;
};

export default handleSwaggerPathV2;
