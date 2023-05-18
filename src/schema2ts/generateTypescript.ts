import { Options } from 'json-schema-to-typescript';
import { JSONSchema, compile } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { convertAPIV2ToJSONSchema } from './convertSwagger';

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
