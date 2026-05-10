import * as assert from 'assert';
import { OpenAPIV2 } from 'openapi-types';
import { convertAPIV2Definitions, convertAPIV2Schema2JSONSchema, convertAPIV2ToJSONSchema } from '../../schema2ts/convertSwagger';

const refSchema = (name: string) => ({ $ref: `#/definitions/${name}` }) as OpenAPIV2.SchemaObject;

suite('schema2ts/convertSwagger', () => {
  setup(() => {
    convertAPIV2ToJSONSchema.defRenameMapping = undefined;
  });

  teardown(() => {
    convertAPIV2ToJSONSchema.defRenameMapping = undefined;
  });

  test('converts $ref with and without defRenameMapping', async () => {
    convertAPIV2ToJSONSchema.defRenameMapping = { User: 'MappedUser' };

    const mappedRef = await convertAPIV2Schema2JSONSchema(refSchema('User'));
    assert.strictEqual(mappedRef.$ref, '#/definitions/MappedUser');

    convertAPIV2ToJSONSchema.defRenameMapping = undefined;

    const plainRef = await convertAPIV2Schema2JSONSchema(refSchema('User'));
    assert.strictEqual(plainRef.$ref, '#/definitions/User');
  });

  test('converts primitive enum schema branch', async () => {
    const result = await convertAPIV2Schema2JSONSchema({
      type: 'string',
      title: 'Status',
      enum: ['OPEN', 'CLOSED'],
    } as OpenAPIV2.SchemaObject);

    assert.strictEqual(result.title, 'Status');
    assert.deepStrictEqual(result.enum, ['OPEN', 'CLOSED']);
  });

  test('converts type-array schema branch', async () => {
    const result = await convertAPIV2Schema2JSONSchema({
      type: ['string', 'null'],
    } as unknown as OpenAPIV2.SchemaObject);

    assert.deepStrictEqual(result.type, ['string', 'null']);
  });

  test('converts file schema branch', async () => {
    const result = await convertAPIV2Schema2JSONSchema({
      type: 'file',
    } as OpenAPIV2.SchemaObject);

    assert.strictEqual(result.type, 'any');
    assert.strictEqual(result.tsType, 'File');
  });

  test('falls back to any for unknown or empty schema', async () => {
    const result = await convertAPIV2Schema2JSONSchema({} as OpenAPIV2.SchemaObject);

    assert.strictEqual(result.type, 'any');
  });

  test('locks current required propagation behavior from child.required', async () => {
    const result = await convertAPIV2Schema2JSONSchema({
      type: 'object',
      properties: {
        child: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        plain: {
          type: 'string',
        },
      },
    } as OpenAPIV2.SchemaObject);

    const required = Array.isArray(result.required) ? result.required : [];
    assert.ok(required.includes('child'));
    assert.ok(!required.includes('plain'));
  });

  test('converts definitions with renamed keys and title assignment', async () => {
    convertAPIV2ToJSONSchema.defRenameMapping = { User: 'Account' };

    const result = await convertAPIV2Definitions({
      User: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    });

    assert.ok('Account' in result);
    assert.strictEqual((result.Account as any).title, 'Account');
    assert.ok(!('User' in result));
  });

  test('uses schema-local definitions before document definitions', async () => {
    convertAPIV2ToJSONSchema.defRenameMapping = undefined;

    const fromSchema = await convertAPIV2ToJSONSchema(
      {
        type: 'object',
        definitions: {
          LocalEntity: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      } as OpenAPIV2.SchemaObject,
      {
        swagger: '2.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {},
        definitions: {
          GlobalEntity: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    );

    assert.ok(fromSchema.definitions);
    assert.ok('LocalEntity' in (fromSchema.definitions as Record<string, unknown>));
    assert.ok(!('GlobalEntity' in (fromSchema.definitions as Record<string, unknown>)));

    const fromDocument = await convertAPIV2ToJSONSchema(
      {
        type: 'object',
      } as OpenAPIV2.SchemaObject,
      {
        swagger: '2.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {},
        definitions: {
          GlobalEntity: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    );

    assert.ok(fromDocument.definitions);
    assert.ok('GlobalEntity' in (fromDocument.definitions as Record<string, unknown>));
  });
});