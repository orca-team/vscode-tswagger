import { JSONSchema } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { buildAnyTypeSchema, buildBasicTypeSchema } from './buildSchema';
import { hasChinese, match$RefClassName, splitChineseAndEnglish } from './regexHelpers';
import translate from './translate';
import localTranslate from '../utils/localTranslate';

export const filterDefinitionName = async (definitionName: string) => {
  let definitionNames = splitChineseAndEnglish(definitionName) ?? [];

  if (hasChinese(definitionName)) {
    let result = '';
    for (const name of definitionNames) {
      if (hasChinese(name)) {
        const translatedName = localTranslate(name) ?? (await translate(name));
        result += translatedName;
        continue;
      }
      result += name;
    }
    return result;
  }

  return definitionNames?.join('') ?? '';
};

export const swaggerSchemaBasicTypes = ['string', 'boolean', 'number', 'integer'];

export const convertAPIV2Schema2JSONSchema = async (swaggerSchema: OpenAPIV2.SchemaObject): Promise<JSONSchema> => {
  const { $ref: $schemaRef, type: schemaType = '', title: schemaTitle, description, ...otherProps } = swaggerSchema;

  const mergeCommonJSONSchema = (additionalSchema: JSONSchema): JSONSchema => ({ title: schemaTitle, description, ...additionalSchema });

  if ($schemaRef) {
    const refClassName = match$RefClassName($schemaRef);
    return {
      $ref: `#/definitions/${await filterDefinitionName(refClassName)}`,
    };
  }

  if (Array.isArray(schemaType)) {
    return mergeCommonJSONSchema({
      type: schemaType,
      ...otherProps,
    } as JSONSchema);
  }

  // 基本类型
  if (swaggerSchemaBasicTypes.includes(schemaType)) {
    const { enum: swaggerEnum = [] } = swaggerSchema;
    return mergeCommonJSONSchema(!!swaggerEnum.length ? { enum: swaggerEnum } : buildBasicTypeSchema(schemaType));
  }

  // 数组类型
  if (schemaType === 'array') {
    const { items: arrayItems } = swaggerSchema;
    return mergeCommonJSONSchema({
      type: 'array',
      items: await convertAPIV2ToJSONSchema(arrayItems ?? {}),
    });
  }

  // 对象类型
  if (schemaType === 'object') {
    const properties: JSONSchema['properties'] = {};
    const requiredSet = new Set<string>();
    if (Array.isArray(swaggerSchema.required)) {
      swaggerSchema.required.forEach((requiredField) => {
        requiredSet.add(requiredField);
      });
    }
    for (const [key, value] of Object.entries(swaggerSchema.properties ?? {})) {
      properties[key] = await convertAPIV2ToJSONSchema(value);
      if (value.required) {
        requiredSet.add(key);
      }
    }

    return mergeCommonJSONSchema({
      type: 'object',
      properties,
      required: Array.from(requiredSet.values()),
    });
  }

  return mergeCommonJSONSchema(buildAnyTypeSchema());
};

export const convertAPIV2ToJSONSchema = async (swaggerSchema: OpenAPIV2.SchemaObject): Promise<JSONSchema> => {
  let JSONSchema = await convertAPIV2Schema2JSONSchema(swaggerSchema);
  if (swaggerSchema.definitions) {
    JSONSchema.definitions = await convertAPIV2Definitions(swaggerSchema.definitions as OpenAPIV2.DefinitionsObject);
  }

  return JSONSchema;
};

export const convertAPIV2Definitions = async (definitions: OpenAPIV2.DefinitionsObject): Promise<JSONSchema> => {
  const defs: JSONSchema = {};

  for (const [name, schema] of Object.entries(definitions)) {
    let currentName = await filterDefinitionName(name);
    defs[currentName] = await convertAPIV2ToJSONSchema(schema);
    defs[currentName].title = currentName;
  }

  return defs;
};
