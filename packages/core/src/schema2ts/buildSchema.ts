import { JSONSchema } from 'json-schema-to-typescript';

export const buildBasicTypeSchema = (type: string, otherSchemaConfig: Record<string, any> = {}): JSONSchema => {
  return {
    type,
    ...otherSchemaConfig,
  } as JSONSchema;
};

export const buildBasicArrayTypeSchema = (type: string, otherSchemaConfig: Record<string, any> = {}): JSONSchema => {
  return {
    type: 'array',
    items: {
      type,
    },
    ...otherSchemaConfig,
  } as JSONSchema;
};

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

export const buildAnyTypeSchema = (otherSchemaConfig: Record<string, any> = {}): JSONSchema => {
  return {
    type: 'any',
    ...otherSchemaConfig,
  } as JSONSchema;
};