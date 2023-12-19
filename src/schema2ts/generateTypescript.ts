import { Options } from 'json-schema-to-typescript';
import { JSONSchema, compile } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { convertAPIV2ToJSONSchema } from './convertSwagger';
import { SwaggerCollectionGroupItem } from '../swaggerPath/types';
import { toLower, toUpper } from 'lodash-es';
import { filterString, shakeV2RefsInSchema } from '../utils/swaggerUtil';
import { TSwaggerConfig } from '../types';
import { FILE_DESCRIPTION, JSON_TO_FORM_DATA } from './constants';

export type GenerateOptions = Partial<Options & { title: string }>;

const defaultGenerateOptions: GenerateOptions = {
  title: '',
  bannerComment: '',
  additionalProperties: false,
};

export const generateTsFromJSONSchema = async (schema: JSONSchema, options: GenerateOptions = defaultGenerateOptions) => {
  const { title = '', ...compileOptions } = options;

  const tsDef = await compile(schema, title, compileOptions);

  return tsDef;
};

export const generateTypescriptFromAPIV2 = async (
  swaggerSchema: OpenAPIV2.SchemaObject,
  V2Document: OpenAPIV2.Document,
  mapping?: Record<string, string>,
  options?: GenerateOptions,
) => {
  const shakedDefs = shakeV2RefsInSchema(swaggerSchema, V2Document.definitions ?? {});
  const shakedSchema: OpenAPIV2.SchemaObject = { ...swaggerSchema, definitions: shakedDefs };
  const shakedDocument: OpenAPIV2.Document = { ...V2Document, definitions: shakedDefs };
  convertAPIV2ToJSONSchema.defRenameMapping = mapping;
  const JSONSchema = await convertAPIV2ToJSONSchema(shakedSchema, shakedDocument);
  console.info('[JSONSchema Result]: ');
  console.info(JSONSchema);
  const tsDef = await generateTsFromJSONSchema(JSONSchema, options);

  const defNameMapping: Record<string, string> = {};

  for (const defName of Object.keys(shakedDefs)) {
    defNameMapping[defName] = mapping?.[defName] ?? (await filterString(defName));
  }

  return { tsDef, depDefs: shakedDefs, defNameMapping };
};

/**
 * 组合方法中使用到的请求方法，并从目标路径导入(TODO: sourcePath 配置化)
 * @param serviceInfoMapCollection 接口参数映射集合
 * @param source 请求方法导入地址
 * @returns import 头
 */
export const generateServiceImport = (serviceInfoMapCollection: SwaggerCollectionGroupItem[], sourcePath: string) => {
  const methodsExceptDel: string[] = ['get', 'post', 'put'];
  const usedMethods = new Set<string>();
  for (const { method } of serviceInfoMapCollection) {
    if (method === 'delete') {
      usedMethods.add('del');
    }
    if (methodsExceptDel.includes(method)) {
      usedMethods.add(method);
    }
    if (usedMethods.size === 4) {
      break;
    }
  }

  return `${FILE_DESCRIPTION}import { ${[...usedMethods].join(', ')} } from '${sourcePath || ''}';
import type { FetchResult } from '${sourcePath || ''}';\n\n`;
};

/**
 * 简化接口生成方式:
 * get 和 delete 请求默认只有 query 没有 body
 * post 和 put 请求默认只要 body 没有 query，特殊情况下携带了 query 参数，生成结果会为 path 添加和转换参数
 * @param method 请求方式
 * @param isFormData 是否是 FormData 类型的数据
 * @returns 接口默认请求参数
 */
const composeServiceParams = (method: string, isFormData?: boolean) => {
  if (['get', 'delete'].includes(method)) {
    return 'query';
  }
  return isFormData ? 'formData' : 'data';
};

const formatServiceDescription = (serviceInfo: SwaggerCollectionGroupItem) => {
  const { description, summary, tag, serviceName, method, path } = serviceInfo;

  return `/**
 * @tag ${tag}
 * @summary ${summary ? summary : 'No Summary'}
 * @description ${description ? description : 'No Description'}
 * @serviceName ${serviceName}
 * @method ${toUpper(method)}
 * @path ${path}
 */`;
};

const formatServicePath = (url: string, method: string, options = { hasPathParam: false, hasPathQuery: false }) => {
  const { hasPathParam, hasPathQuery } = options;
  const isCompatibleMethod = ['post', 'put'].includes(method);

  // 路径存在参数则替换为模板字符串
  const replacedPathParamUrl = hasPathParam ? url.replace(/\{(\w+)\}/g, (_, $1) => `\${${$1}}`) : '';
  // 路径存在查询参数则增加 URLSearchParams（仅对非 get 和 delete 请求又有携带路径参数的情况进行兼容）
  const replacedPathParamUrlQuery = isCompatibleMethod && hasPathQuery ? `?\${new URLSearchParams(query).toString()}` : '';
  // 是否添加模板字符串：1. 路径中存在参数；2. 需要兼容的 method 请求中携带查询参数
  const isAddTemplateString = hasPathParam || (isCompatibleMethod && hasPathQuery);

  return isAddTemplateString ? `\`${(replacedPathParamUrl || url) + replacedPathParamUrlQuery}\`` : `'${url}'`;
};

/**
 * 为接口路径添加前缀
 * @param path 路径
 * @param basePath 路径前缀
 * @param config tswagger 配置信息
 * @returns 拼接前缀后的路径
 */
const addBasePathPrefixUrl = (path: string, basePath?: string, config: TSwaggerConfig = {}) => {
  const { addBasePathPrefix, basePathMapping } = config;
  if (!addBasePathPrefix || !basePath) {
    return path;
  }
  if (basePathMapping?.[basePath]) {
    return `${basePathMapping[basePath]}${path}`;
  }

  return `${basePath}${path}`;
};

/**
 * 生成接口
 * @param serviceInfo 入参、出参、接口名称映射信息
 * @returns service 字符串
 */
export const generateServiceFromAPIV2 = async (serviceInfo: SwaggerCollectionGroupItem, config: TSwaggerConfig = {}) => {
  const { basePath, path, method, pathParamFields = [], serviceInfoList, serviceName } = serviceInfo;
  const { addBasePathPrefix } = config;
  // 路径上参数 ts 名称
  const pathParam = serviceInfoList.find((info) => info.type === 'path')?.name;
  // 路径携带参数 ts 名称
  const pathQuery = serviceInfoList.find((info) => info.type === 'query')?.name;
  // 请求体参数 ts 名称
  const requestBody = serviceInfoList.find((info) => info.type === 'body')?.name;
  // formData ts 名称
  const formDataBody = serviceInfoList.find((info) => info.type === 'formData')?.name;
  // 响应体参数 ts 名称
  const response = serviceInfoList.find((info) => info.type === 'response')?.name;

  const serviceDescription = formatServiceDescription(serviceInfo);
  const currentMethod = toLower(method);
  const isDeleteMethod = currentMethod === 'delete';
  const requestParams: string[] = pathParamFields.map((field) => `${field}: number | string`);
  let requestOptionsStr = '';
  let url = addBasePathPrefixUrl(path, basePath, config);
  const hasPathParam = !!pathParam;
  const hasPathQuery = !!pathQuery;

  if (pathQuery) {
    requestParams.push(`query: ${pathQuery}`);
    requestOptionsStr += `params: query, `;
  }
  if (requestBody) {
    requestParams.push(`data: ${requestBody}`);
    requestOptionsStr += `data`;
  } else if (formDataBody) {
    requestParams.push(`data: ${formDataBody}`);
    requestOptionsStr += `data`;
  }

  const serviceReturnStr = `return ${isDeleteMethod ? 'del' : currentMethod}<FetchResult<${response ?? 'any'}>>(${formatServicePath(
    url,
    currentMethod,
    { hasPathParam, hasPathQuery },
  )}${requestOptionsStr ? `, ${composeServiceParams(currentMethod, !!formDataBody)}` : ''})`;

  return `
${serviceDescription}
export const ${serviceName} = (${requestParams.join(', ')}) => {
  ${formDataBody ? `${JSON_TO_FORM_DATA}  ${serviceReturnStr}` : serviceReturnStr};
}
`;
};
