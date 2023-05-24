import { Options } from 'json-schema-to-typescript';
import { JSONSchema, compile } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { convertAPIV2ToJSONSchema } from './convertSwagger';
import { ServiceInfoMap } from '../swaggerPath/types';
import { toLower, upperCase } from 'lodash-es';

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
  const JSONSchema = await convertAPIV2ToJSONSchema(swaggerSchema, V2Document);
  console.info('[JSONSchema Result]: ');
  console.info(JSONSchema);
  const tsDef = await generateTsFromJSONSchema(JSONSchema, options);

  return tsDef;
};

export const generateServiceFromAPIV2 = async (serviceInfoMap: ServiceInfoMap) => {
  const { path, method, pathParam, pathQuery, requestBody, serviceName, response } = serviceInfoMap;
  const comment = `【${upperCase(method)}】${serviceInfoMap.path} 接口`;
  const currentMethod = toLower(method);
  let requestParamsStr = '';
  let configsStr = '';
  let url = path;
  if (pathParam) {
    requestParamsStr += `params: ${pathParam}, `;
    url = url.replace(/\{(\w+)\}/g, (_, $1) => `\${params['${$1}']}`);
  }
  if (pathQuery) {
    requestParamsStr += `query: ${pathQuery}, `;
    configsStr += `params: query, `;
  }
  if (requestBody) {
    requestParamsStr += `data: ${requestBody}`;
    configsStr += `data`;
  }

  return `
/**
 * ${comment}
 */
export const ${serviceName} = (${requestParamsStr}) => {
  return ${currentMethod === 'delete' ? 'del' : currentMethod}<${response ?? 'any'}>(\`${url}\`${configsStr ? `, { ${configsStr} }` : ''})
}
`;
};
