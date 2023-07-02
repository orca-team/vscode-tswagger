import { JSONSchema } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { buildAnyTypeSchema, buildBasicTypeSchema } from './buildSchema';
import { filterString, match$RefClassName } from '../utils/swaggerUtil';
import { isArray } from 'lodash-es';

const filterStringByMapping = async (text: string | string[]) =>
  isArray(text)
    ? Promise.all(text.map((t) => convertAPIV2ToJSONSchema.defRenameMapping?.[t] ?? filterString(t))).then((r) => r.join(''))
    : convertAPIV2ToJSONSchema.defRenameMapping?.[text] ?? filterString(text);

export const swaggerSchemaBasicTypes = ['string', 'boolean', 'number', 'integer'];

export const convertAPIV2Schema2JSONSchema = async (swaggerSchema: OpenAPIV2.SchemaObject): Promise<JSONSchema> => {
  const { $ref: $schemaRef, type: schemaType = '', title: schemaTitle, description, ...otherProps } = swaggerSchema;
  const mergeCommonJSONSchema = (additionalSchema: JSONSchema): JSONSchema => ({ title: schemaTitle, description, ...additionalSchema });

  if ($schemaRef) {
    const refClassName = match$RefClassName($schemaRef);
    return {
      $ref: `#/definitions/${await filterStringByMapping(refClassName)}`,
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

export const convertAPIV2ToJSONSchema = async (swaggerSchema: OpenAPIV2.SchemaObject, V2Document?: OpenAPIV2.Document): Promise<JSONSchema> => {
  const JSONSchema = await convertAPIV2Schema2JSONSchema(swaggerSchema);
  JSONSchema.definitions = await convertAPIV2Definitions(
    (swaggerSchema.definitions ? (swaggerSchema.definitions as OpenAPIV2.DefinitionsObject) : V2Document?.definitions) ?? {},
  );

  return JSONSchema;
};

/**
 * 依赖名称映射集合
 */
convertAPIV2ToJSONSchema.defRenameMapping = {} as Record<string, string> | undefined;

export const convertAPIV2Definitions = async (definitions: OpenAPIV2.DefinitionsObject): Promise<JSONSchema> => {
  const defs: JSONSchema = {};

  for (const [name, schema] of Object.entries(definitions)) {
    let currentName = await filterStringByMapping(name);
    defs[currentName] = await convertAPIV2ToJSONSchema(schema);
    defs[currentName].title = currentName;
  }

  return defs;
};
