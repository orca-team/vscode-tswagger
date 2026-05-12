import * as assert from 'assert';
import { OpenAPIV2 } from 'openapi-types';
import { convertAPIV2ToJSONSchema } from '../../schema2ts/convertSwagger';
import { generateTypescriptFromAPIV2 } from '../../schema2ts/generateTypescript';

const baseDocument: OpenAPIV2.Document = {
  swagger: '2.0',
  info: { title: 'unit-test', version: '1.0.0' },
  paths: {},
  definitions: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        profile: { $ref: '#/definitions/Profile' },
      },
      required: ['id'],
    },
    Profile: {
      type: 'object',
      properties: {
        nickname: { type: 'string' },
      },
    },
    NotUsed: {
      type: 'object',
      properties: {
        ignored: { type: 'string' },
      },
    },
  },
};

suite('schema2ts/generateTypescript', () => {
  const originalConsoleInfo = console.info;

  setup(() => {
    convertAPIV2ToJSONSchema.defRenameMapping = undefined;
    console.info = () => {};
  });

  teardown(() => {
    convertAPIV2ToJSONSchema.defRenameMapping = undefined;
    console.info = originalConsoleInfo;
  });

  test('returns tsDef markers, shaken depDefs, and mapped defNameMapping', async () => {
    const rootSchema: OpenAPIV2.SchemaObject = {
      type: 'object',
      properties: {
        data: { $ref: '#/definitions/User' },
      },
    };

    const mapping = {
      User: 'AccountUser',
      Profile: 'AccountProfile',
    };

    const { tsDef, depDefs, defNameMapping } = await generateTypescriptFromAPIV2(rootSchema, baseDocument, mapping, {
      title: 'ApiResponse',
    });

    assert.ok(tsDef.includes('ApiResponse'));
    assert.ok(tsDef.includes('AccountUser'));
    assert.ok(tsDef.includes('AccountProfile'));

    assert.ok('User' in depDefs);
    assert.ok('Profile' in depDefs);
    assert.ok(!('NotUsed' in depDefs));

    assert.strictEqual(defNameMapping.User, 'AccountUser');
    assert.strictEqual(defNameMapping.Profile, 'AccountProfile');
  });

  test('uses current filterString fallback naming when mapping is absent', async () => {
    const rootSchema: OpenAPIV2.SchemaObject = {
      type: 'object',
      properties: {
        data: { $ref: '#/definitions/Alpha_Beta' },
      },
    };

    const document: OpenAPIV2.Document = {
      ...baseDocument,
      definitions: {
        Alpha_Beta: {
          type: 'object',
          properties: {
            code: { type: 'string' },
          },
        },
      },
    };

    const { tsDef, depDefs, defNameMapping } = await generateTypescriptFromAPIV2(rootSchema, document, undefined, {
      title: 'AsciiRoot',
    });

    assert.ok(tsDef.includes('AsciiRoot'));
    assert.ok(Object.keys(depDefs).includes('Alpha_Beta'));
    assert.strictEqual(defNameMapping.Alpha_Beta, 'AlphaBeta');
  });

  test('resets defRenameMapping state between calls in same run', async () => {
    const rootSchema: OpenAPIV2.SchemaObject = {
      type: 'object',
      properties: {
        data: { $ref: '#/definitions/User' },
      },
    };

    const first = await generateTypescriptFromAPIV2(rootSchema, baseDocument, { User: 'MappedUser' }, { title: 'First' });
    assert.strictEqual(first.defNameMapping.User, 'MappedUser');

    convertAPIV2ToJSONSchema.defRenameMapping = undefined;

    const second = await generateTypescriptFromAPIV2(rootSchema, baseDocument, undefined, { title: 'Second' });
    assert.strictEqual(second.defNameMapping.User, 'User');
    assert.ok(second.tsDef.includes('User'));
  });
});