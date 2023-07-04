import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { ApiGroupNameMapping, ApiPathTypeV2, GenerateTypescriptConfig } from '../types';
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

// TODO: 逻辑待优化
export const handleV2Request = async (
  apiPath: ApiPathTypeV2,
  tag: string,
  V2Document: OpenAPIV2.Document,
  mappingInfo: {
    nameMapping: ApiGroupNameMapping;
    renameMapping?: ApiGroupNameMapping;
    associatedDefNameMapping?: Record<string, string>;
  },
) => {
  const { nameMapping, renameMapping, associatedDefNameMapping } = mappingInfo;
  const { path, pathInfo } = apiPath;
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
    const { schema: bodySchema } = bodyParameter;
    if (isV2RefObject(bodySchema)) {
      const { originRefName, refSchema } = await getV2RefTargetSchema(bodySchema, V2Document, renameMapping?.requestBodyName);
      const finalName = refSchema.title;
      associatedDefNameMapping && (associatedDefNameMapping[originRefName] = finalName ?? '');
      nameMapping.requestBodyName = finalName;
      nameMapping.paramRefDefNameList.push({
        type: 'requestBodyName',
        originRefName,
      });
      collection.push(
        merge({
          type: 'body',
          name: finalName,
          schemaList: [refSchema],
        }),
      );
    } else {
      const finalName = renameMapping?.requestBodyName ?? (await generateTsName(apiPath, 'RequestBody'));
      nameMapping.requestBodyName = finalName;
      collection.push(
        merge({
          type: 'body',
          name: finalName,
          schemaList: [
            {
              definitions: V2Document.definitions,
              type: 'object',
              title: finalName,
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
    const finalName = renameMapping?.pathParamName ?? (await generateTsName(apiPath, 'RequestPath'));
    nameMapping.pathParamName = finalName;
    const pathSchemaObject = handleV2Parameters(pathParameters);
    pathSchemaObject.title = finalName;
    pathSchemaObject.description = generateTsDefDesc(apiPath, '路径参数');
    pathSchemaObject.definitions = V2Document.definitions;
    schemaList.push(pathSchemaObject);
    collection.push(
      merge({
        type: 'path',
        name: finalName,
        schemaList,
      }),
    );
  }

  // 请求路径携带的参数
  if (!!queryParameters.length) {
    const schemaList: OpenAPIV2.SchemaObject[] = [];
    const finalName = renameMapping?.pathQueryName ?? (await generateTsName(apiPath, 'RequestQuery'));
    nameMapping.pathQueryName = finalName;
    const querySchemaObject = handleV2Parameters(queryParameters);
    querySchemaObject.title = finalName;
    querySchemaObject.description = generateTsDefDesc(apiPath, '路径携带参数');
    querySchemaObject.definitions = V2Document.definitions;
    schemaList.push(querySchemaObject);
    collection.push(
      merge({
        type: 'query',
        name: finalName,
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

export const parsePathParamFields = (schema: OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject) => {
  const pathParamFields: string[] = [];
  const { properties = {} } = schema;
  Object.entries(properties).forEach(([key, value]) => {
    if (!value.$ref) {
      pathParamFields.push(key);
    }
  });

  return pathParamFields;
};

const handleSwaggerPathV2 = async (
  config: GenerateTypescriptConfig,
): Promise<{
  /** 根据标签、路径对接口的出入参进行分类处理的结果集 */
  swaggerCollection: SwaggerCollectionItem[];
  /** 接口出入参各类名称映射集 */
  nameMappingList: ApiGroupNameMapping[];
  /** 关联实体名称，即接口出入参直接为已定义的实体名称 */
  associatedDefNameMapping: Record<string, string>;
}> => {
  const { V2Document, collection, options, renameMapping } = config;

  const { nameGroup: renameGroup } = renameMapping ?? {};

  const swaggerCollection: SwaggerCollectionItem[] = [];
  const nameMappingList: ApiGroupNameMapping[] = [];
  const associatedDefNameMapping: Record<string, string> = {};

  for (const { apiPathList, tag } of collection) {
    const targetMappingGroup = renameGroup?.find((it) => it.groupName === tag)?.group;
    for (const apiPath of apiPathList) {
      const { method, path, pathInfo } = apiPath;
      const { summary, parameters, responses } = pathInfo;

      // 接口各类型名称映射
      const nameMapping: ApiGroupNameMapping = { path, method, groupName: tag, paramRefDefNameList: [], description: summary };

      // 重命名名称映射
      const mapping = targetMappingGroup?.find((it) => it.path === path && it.method === method);

      let parameterCollection: SwaggerCollectionItem[] = [];
      let responseCollection: SwaggerCollectionItem[] = [];
      const serviceInfoMap: ServiceInfoMap = {
        path,
        method,
        basePath: V2Document.basePath ?? '',
        serviceName:
          mapping?.serviceName ?? (pathInfo.operationId ? await filterString(pathInfo.operationId) : composeNameByAPIPath(method, path, 'API')),
      };

      // 处理入参
      if (options.requestParams && parameters) {
        parameterCollection = await handleV2Request(apiPath, tag, V2Document, { nameMapping, renameMapping: mapping, associatedDefNameMapping });
        swaggerCollection.push(...parameterCollection);
      }
      // 处理出参
      if (options.responseBody && responses) {
        const responseSchema = handleV2ResponseBody(responses);
        responseSchema.definitions = V2Document.definitions;
        if (isV2RefObject(responseSchema)) {
          const { originRefName, refSchema } = await getV2RefTargetSchema(responseSchema, V2Document, mapping?.responseBodyName);
          const finalName = refSchema.title;
          associatedDefNameMapping[originRefName] = finalName ?? '';
          nameMapping.responseBodyName = finalName;
          nameMapping.paramRefDefNameList.push({
            type: 'responseBodyName',
            originRefName,
          });
          responseCollection = [
            {
              tag,
              targetPath: path,
              type: 'response',
              name: finalName,
              schemaList: [refSchema],
            },
          ];
        } else {
          responseSchema.title = mapping?.responseBodyName ?? composeNameByAPIPath(method, path, 'ResponseBody');
          const finalName = responseSchema.title;
          nameMapping.responseBodyName = finalName;
          responseSchema.description = generateTsDefDesc(apiPath, '返回数据');
          responseCollection = [
            {
              tag,
              targetPath: path,
              type: 'response',
              name: finalName,
              schemaList: [responseSchema],
            },
          ];
        }
        swaggerCollection.push(...responseCollection);
      }
      // 处理接口
      if (options.service) {
        serviceInfoMap.pathParam = parameterCollection.find((it) => it.type === 'path')?.name;
        serviceInfoMap.pathParamFields = parsePathParamFields(parameterCollection.find((it) => it.type === 'path')?.schemaList?.[0] ?? {});
        serviceInfoMap.pathQuery = parameterCollection.find((it) => it.type === 'query')?.name;
        serviceInfoMap.requestBody = parameterCollection.find((it) => it.type === 'body')?.name;
        serviceInfoMap.response = responseCollection.find((it) => it.type === 'response')?.name;
        nameMapping.serviceName = mapping?.serviceName ?? serviceInfoMap.serviceName;
        swaggerCollection.push({
          tag,
          type: 'service',
          targetPath: path,
          serviceInfoMap,
        });
      }

      nameMappingList.push(nameMapping);
    }
  }

  return { swaggerCollection, nameMappingList, associatedDefNameMapping };
};

export default handleSwaggerPathV2;
