import { OpenAPIV2 } from 'openapi-types';
import { HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from '../types';
import { composeNameByAPIPath } from './helper';
import { filterString, isLocal$ref, isV2RefObject, match$RefClassName } from '../utils/swaggerUtil';

const handleV2RequestParams = (parameters: OpenAPIV2.Parameters) => {
  let properties: Record<string, OpenAPIV2.SchemaObject> = {};
  parameters.forEach((parameter) => {
    const { schema = {}, name } = parameter as OpenAPIV2.Parameter;
    // console.log('parameter', parameter);
    // 目前仅处理本地引用
    if (isLocal$ref(schema.$ref)) {
      // const className = match$RefClassName(schema.$ref);
      properties[name] = { $ref: schema.$ref };
    } else {
      // in 类型: path | query | header | cookie
      // 统一处理成 Object 作为入参 (TODO: body 处理)
      const { name, schema, description, required } = parameter as OpenAPIV2.Parameter;
      properties[name] = schema || parameter || {};
      properties[name].description = description ?? '';
      properties[name].required = required ? [name] : [];
    }
  });

  return properties;
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
        const properties = handleV2RequestParams(parameters);
        const paramsSchemaName = composeNameByAPIPath(
          method,
          // TODO: 若没有 operationId 则临时采用 path 作为主体名称
          pathInfo.operationId ? await filterString(pathInfo.operationId) : path,
          'RequestParams',
        );
        schemaCollection.push({
          definitions: V2Document.definitions,
          type: 'object',
          title: paramsSchemaName,
          description: `${path} 请求参数`,
          properties,
        });
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
          responseSchema.description = `${path} 返回数据`;
          schemaCollection.push(responseSchema);
        }
      }
    }
  }

  return schemaCollection;
};

export default handleSwaggerPathV2;
