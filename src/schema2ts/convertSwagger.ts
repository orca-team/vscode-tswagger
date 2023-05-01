import { JSONSchema } from 'json-schema-to-typescript';
import { OpenAPIV2 } from 'openapi-types';
import { buildAnyTypeSchema, buildBasicTypeSchema } from './buildSchema';

export const swaggerSchemaBasicTypes = ['string', 'boolean', 'number', 'integer'];

export const convertAPIV2Schema2JSONSchema = (swaggerSchema: OpenAPIV2.SchemaObject): JSONSchema => {
  const { $ref: $schemaRef, type: schemaType = '', title: schemaTitle, description, ...otherProps } = swaggerSchema;

  if ($schemaRef) {
    return {
      $ref: $schemaRef,
    };
  }

  if (Array.isArray(schemaType)) {
    return {
      title: schemaTitle,
      type: schemaType,
      description,
      ...otherProps,
    } as JSONSchema;
  }

  // 基本类型
  if (swaggerSchemaBasicTypes.includes(schemaType)) {
    const { enum: swaggerEnum = [] } = swaggerSchema;
    return !!swaggerEnum.length ? { description, enum: swaggerEnum } : buildBasicTypeSchema(schemaType, { description });
  }

  // 数组类型
  if (schemaType === 'array') {
    const { items: arrayItems } = swaggerSchema;
    return {
      title: schemaTitle,
      type: 'array',
      items: convertAPIV2ToJSONSchema(arrayItems ?? {}),
    };
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
    Object.entries(swaggerSchema.properties ?? {}).forEach(([key, value]) => {
      properties[key] = convertAPIV2ToJSONSchema(value);
      if (value.required) {
        requiredSet.add(key);
      }
    });

    return {
      title: schemaTitle,
      type: 'object',
      properties,
      required: Array.from(requiredSet.values()),
    };
  }

  return buildAnyTypeSchema({ description });
};

export const convertAPIV2ToJSONSchema = (swaggerSchema: OpenAPIV2.SchemaObject): JSONSchema => {
  let JSONSchema = convertAPIV2Schema2JSONSchema(swaggerSchema);
  if (swaggerSchema.definitions) {
    JSONSchema.definitions = convertAPIV2Definitions(swaggerSchema.definitions as OpenAPIV2.DefinitionsObject);
  }

  return JSONSchema;
};

export const convertAPIV2Definitions = (definitions: OpenAPIV2.DefinitionsObject): JSONSchema => {
  const defs: JSONSchema = {};
  Object.entries(definitions).forEach(([name, schema]) => {
    defs[name] = convertAPIV2ToJSONSchema(schema);
    defs[name].title = name;
  });

  return defs;
};
