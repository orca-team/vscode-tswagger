import { JSONSchema } from 'json-schema-to-typescript';

// 构建基本类型的 schema
export const buildBasicTypeSchema = (type: string, otherSchemaConfig: Record<string, any> = {}): JSONSchema => {
  return {
    type,
    ...otherSchemaConfig,
  } as JSONSchema;
};

// 构建基本类型数组的 schema
export const buildBasicArrayTypeSchema = (type: string, otherSchemaConfig: Record<string, any> = {}): JSONSchema => {
  return {
    type: 'array',
    items: {
      type,
    },
    ...otherSchemaConfig,
  } as JSONSchema;
};

// 构建对象类型的 schema
export const buildObjectTypeSchema = ({ title = '', ...otherSchemaConfig }): JSONSchema => {
  return {
    title,
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
    ...otherSchemaConfig,
  } as JSONSchema;
};

// 构建 any 类型的 schema
export const buildAnyTypeSchema = (otherSchemaConfig: Record<string, any> = {}): JSONSchema => {
  return {
    type: 'any',
    ...otherSchemaConfig,
  } as JSONSchema;
};
