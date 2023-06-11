import { Options } from 'json-schema-to-typescript';
import { JSONSchema, compile } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { convertAPIV2ToJSONSchema } from './convertSwagger';
import { ServiceInfoMap } from '../swaggerPath/types';
import { toLower, upperCase } from 'lodash-es';
import { shakeV2RefsInSchema } from '../utils/swaggerUtil';

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
  options?: GenerateOptions,
) => {
  const shakedDefs = shakeV2RefsInSchema(swaggerSchema, V2Document.definitions ?? {});
  const shakedSchema: OpenAPIV2.SchemaObject = { ...swaggerSchema, definitions: shakedDefs };
  const shakedDocument: OpenAPIV2.Document = { ...V2Document, definitions: shakedDefs };
  const JSONSchema = await convertAPIV2ToJSONSchema(shakedSchema, shakedDocument);
  console.info('[JSONSchema Result]: ');
  console.info(JSONSchema);
  const tsDef = await generateTsFromJSONSchema(JSONSchema, options);

  return tsDef;
};

/**
 * 组合方法中使用到的请求方法，并从目标路径导入(TODO: sourcePath 配置化)
 * @param serviceInfoMapCollection 接口参数映射集合
 * @param source 请求方法导入地址
 * @returns import 头
 */
export const generateServiceImport = (serviceInfoMapCollection: ServiceInfoMap[], sourcePath: string = '@/utils/fetch.ts') => {
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

  return `import { ${[...usedMethods].join(', ')} } from '${sourcePath}';\n\n`;
};

/**
 * 简化接口生成方式:
 * get 和 delete 请求默认只有 query 没有 body
 * post 和 pust 请求默认只要 body 没有 query
 * @param method 请求方式
 * @param requestOptionsStr 所有类型的请求对象字符串
 * @returns 接口默认请求参数
 */
const composeServiceParams = (method: string, requestOptionsStr: string) => {
  if (['get', 'delete'].includes(method)) {
    return 'query';
  }
  return 'data';
};

/**
 * 生成接口
 * @param serviceInfoMap 入参、出参、接口名称映射信息
 * @returns service 字符串
 */
export const generateServiceFromAPIV2 = async (serviceInfoMap: ServiceInfoMap) => {
  const { path, method, pathParam, pathParamFields = [], pathQuery, requestBody, serviceName, response } = serviceInfoMap;
  const comment = `【${upperCase(method)}】${serviceInfoMap.path} 接口`;
  const currentMethod = toLower(method);
  const isDeleteMethod = currentMethod === 'delete';
  const requestParams: string[] = pathParamFields.map((field) => `${field}: number | string`);
  let requestOptionsStr = '';
  let url = path;
  if (pathParam) {
    url = url.replace(/\{(\w+)\}/g, (_, $1) => `\${${$1}}`);
  }
  if (pathQuery) {
    requestParams.push(`query: ${pathQuery}`);
    requestOptionsStr += `params: query, `;
  }
  if (requestBody) {
    requestParams.push(`data: ${requestBody}`);
    requestOptionsStr += `data`;
  }

  return `
/**
 * ${comment}
 */
export const ${serviceName} = (${requestParams.join(', ')}) => {
  return ${isDeleteMethod ? 'del' : currentMethod}<${response ?? 'any'}>(\`${url}\`${
    requestOptionsStr ? `, ${composeServiceParams(currentMethod, requestOptionsStr)}` : ''
  })
}
`;
};
