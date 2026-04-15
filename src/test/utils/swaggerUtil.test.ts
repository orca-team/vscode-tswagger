import * as assert from 'assert';
import { OpenAPIV2 } from 'openapi-types';
import { shakeV2RefsInSchema } from '../../utils/swaggerUtil';

suite('utils/swaggerUtil: shakeV2RefsInSchema', () => {
  const originalWarn = console.warn;

  setup(() => {
    console.warn = () => {};
  });

  teardown(() => {
    console.warn = originalWarn;
  });

  test('keeps only transitive referenced definitions', () => {
    const schema: OpenAPIV2.SchemaObject = {
      type: 'object',
      properties: {
        user: { $ref: '#/definitions/User' },
      },
    };

    const definitions: OpenAPIV2.DefinitionsObject = {
      User: {
        type: 'object',
        properties: {
          profile: { $ref: '#/definitions/Profile' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          nickname: { type: 'string' },
        },
      },
      Unused: {
        type: 'object',
        properties: {
          skip: { type: 'string' },
        },
      },
    };

    const result = shakeV2RefsInSchema(schema, definitions);

    assert.ok('User' in result);
    assert.ok('Profile' in result);
    assert.ok(!('Unused' in result));
  });

  test('handles circular dependencies without recursion overflow', () => {
    const schema: OpenAPIV2.SchemaObject = {
      type: 'object',
      properties: {
        node: { $ref: '#/definitions/A' },
      },
    };

    const definitions: OpenAPIV2.DefinitionsObject = {
      A: {
        type: 'object',
        properties: {
          b: { $ref: '#/definitions/B' },
        },
      },
      B: {
        type: 'object',
        properties: {
          a: { $ref: '#/definitions/A' },
        },
      },
    };

    const result = shakeV2RefsInSchema(schema, definitions);

    assert.ok('A' in result);
    assert.ok('B' in result);
  });

  test('truncates when dependency depth exceeds maxDepth', () => {
    const schema: OpenAPIV2.SchemaObject = {
      type: 'object',
      properties: {
        top: { $ref: '#/definitions/D0' },
      },
    };

    const definitions: OpenAPIV2.DefinitionsObject = {};
    const chainLength = 56;

    for (let i = 0; i < chainLength; i++) {
      const current = `D${i}`;
      const next = `D${i + 1}`;
      definitions[current] = {
        type: 'object',
        properties:
          i + 1 < chainLength
            ? {
                next: { $ref: `#/definitions/${next}` },
              }
            : {
                terminal: { type: 'string' },
              },
      };
    }

    const result = shakeV2RefsInSchema(schema, definitions);

    assert.ok('D0' in result);
    assert.ok(!('D55' in result));
  });
});
