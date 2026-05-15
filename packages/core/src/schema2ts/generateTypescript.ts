import { JSONSchema, compile } from 'json-schema-to-typescript';
import { Options } from 'json-schema-to-typescript';
import { toLower, toUpper } from 'lodash-es';
import { OpenAPIV2 } from 'openapi-types';
import { TSwaggerConfig } from '@tswagger/types';
import { convertAPIV2ToJSONSchema } from './convertSwagger';
import { FILE_DESCRIPTION, JSON_TO_FORM_DATA } from './constants';
import { SwaggerCollectionGroupItem } from '../swaggerPath/types';
import { filterString } from '../utils/filterString';
import { shakeV2RefsInSchema } from '../utils/swaggerUtil';

export type GenerateOptions = Partial<Options & { title: string }>;

const isSchemaDebugEnabled = () => process.env.TSWAGGER_DEBUG_SCHEMA === '1';

const defaultGenerateOptions: GenerateOptions = {
  title: '',
  bannerComment: '',
  additionalProperties: false,
};

export const generateTsFromJSONSchema = async (schema: JSONSchema, options: GenerateOptions = defaultGenerateOptions) => {
  const { title = '', ...compileOptions } = options;

  return compile(schema, title, compileOptions);
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
  const jsonSchema = await convertAPIV2ToJSONSchema(shakedSchema, shakedDocument);
  if (isSchemaDebugEnabled()) {
    console.info('[JSONSchema Result]: ');
    console.info(jsonSchema);
  }
  const tsDef = await generateTsFromJSONSchema(jsonSchema, options);

  const defNameMapping: Record<string, string> = {};

  for (const defName of Object.keys(shakedDefs)) {
    defNameMapping[defName] = mapping?.[defName] ?? (await filterString(defName));
  }

  return { tsDef, depDefs: shakedDefs, defNameMapping };
};

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
  const isCompatibleMethod = ['post', 'put', 'delete'].includes(method);
  const replacedPathParamUrl = hasPathParam ? url.replace(/\{(\w+)\}/g, (_, pathKey) => `\${${pathKey}}`) : '';
  const replacedPathParamUrlQuery = isCompatibleMethod && hasPathQuery ? `?\${new URLSearchParams(query).toString()}` : '';
  const isAddTemplateString = hasPathParam || (isCompatibleMethod && hasPathQuery);

  return isAddTemplateString ? `\`${(replacedPathParamUrl || url) + replacedPathParamUrlQuery}\`` : `'${url}'`;
};

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

type ParamsType = {
  inParamName: string;
  outParamName: 'query' | 'data' | 'formData';
  paramTsTypeName: string;
};

const generateRequestParams = (method: string, paramsConfig: ParamsType[], isFormData?: boolean) => {
  let result;
  if (paramsConfig.length === 1) {
    result = ['post', 'put', 'delete'].includes(method) && paramsConfig[0].outParamName === 'query' ? undefined : paramsConfig[0].outParamName;
  }
  if (paramsConfig.length === 2) {
    result = isFormData ? 'formData' : 'data';
  }

  return result ? `, ${result}` : '';
};

export const generateServiceFromAPIV2 = async (serviceInfo: SwaggerCollectionGroupItem, config: TSwaggerConfig = {}) => {
  const { basePath, path, method, pathParamFields = [], serviceInfoList, serviceName } = serviceInfo;
  const pathParam = serviceInfoList.find((info) => info.type === 'path')?.name;
  const pathQuery = serviceInfoList.find((info) => info.type === 'query')?.name;
  const requestBody = serviceInfoList.find((info) => info.type === 'body')?.name;
  const formDataBody = serviceInfoList.find((info) => info.type === 'formData')?.name;
  const response = serviceInfoList.find((info) => info.type === 'response')?.name;

  const serviceDescription = formatServiceDescription(serviceInfo);
  const currentMethod = toLower(method);
  const isDeleteMethod = currentMethod === 'delete';
  const pathParams: string[] = pathParamFields.map((item) => `${item.field}: ${item.schema.type === 'string' ? 'string' : 'number'}`);
  const url = addBasePathPrefixUrl(path, basePath, config);
  const hasPathParam = !!pathParam;
  const hasPathQuery = !!pathQuery;
  const hasRequestBody = !!requestBody;

  const paramsConfig: ParamsType[] = [];

  if (pathQuery) {
    paramsConfig.push({ inParamName: 'query', outParamName: 'query', paramTsTypeName: pathQuery });
  }
  if (hasRequestBody) {
    paramsConfig.push({ inParamName: 'data', outParamName: 'data', paramTsTypeName: requestBody });
  } else if (formDataBody) {
    paramsConfig.push({ inParamName: 'data', outParamName: 'data', paramTsTypeName: formDataBody });
  }

  const serviceReturnStr = `return ${isDeleteMethod ? 'del' : currentMethod}<FetchResult<${response ?? 'any'}>>(${formatServicePath(
    url,
    currentMethod,
    { hasPathParam, hasPathQuery },
  )}${generateRequestParams(currentMethod, paramsConfig, !!formDataBody)})`;

  const allInParams = pathParams.concat(paramsConfig.map((param) => `${param.inParamName}: ${param.paramTsTypeName}`));

  return `
${serviceDescription}
export const ${serviceName} = (${allInParams.join(', ')}) => {
  ${formDataBody ? `${JSON_TO_FORM_DATA}  ${serviceReturnStr}` : serviceReturnStr};
}
`;
};