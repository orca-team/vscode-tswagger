import * as assert from 'assert';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  generate,
  getOperationDetail,
  listOperations,
  parseDocument,
  previewGenerate,
  searchOperations,
} from '../operations.js';

const createSwaggerFixture = () => ({
  swagger: '2.0',
  info: {
    title: 'mcp-test',
    version: '1.0.0',
  },
  basePath: '/api',
  tags: [{ name: 'users' }, { name: 'orders' }],
  paths: {
    '/users/{id}': {
      get: {
        tags: ['users'],
        operationId: 'getUser',
        summary: 'Get user detail',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
          },
          {
            name: 'includeOrders',
            in: 'query',
            required: false,
            type: 'boolean',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            schema: {
              $ref: '#/definitions/User',
            },
          },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['orders'],
        operationId: 'createOrder',
        summary: 'Create an order',
        parameters: [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: {
              $ref: '#/definitions/CreateOrderRequest',
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            schema: {
              $ref: '#/definitions/Order',
            },
          },
        },
      },
    },
    '/users/{id}/avatar': {
      patch: {
        tags: ['users'],
        operationId: 'updateUserAvatar',
        summary: 'Update user avatar',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          200: {
            description: 'OK',
            schema: {
              $ref: '#/definitions/User',
            },
          },
        },
      },
    },
  },
  definitions: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
    CreateOrderRequest: {
      type: 'object',
      properties: {
        sku: { type: 'string' },
      },
    },
    Order: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  },
});

suite('@tswagger/mcp', () => {
  let tempRoot = '';
  let inputPath = '';

  setup(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'tswagger-mcp-'));
    inputPath = join(tempRoot, 'swagger.json');
    writeFileSync(inputPath, JSON.stringify(createSwaggerFixture()));
  });

  teardown(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('parses and lists operations without project config', async () => {
    const parsed = await parseDocument({ input: inputPath });
    assert.strictEqual((parsed.data as { operationCount: number }).operationCount, 3);

    const listed = await listOperations({ input: inputPath, tags: ['users'] });
    const data = listed.data as { operationCount: number; groups: Array<{ operations: unknown[] }> };
    assert.strictEqual(data.operationCount, 2);
    assert.strictEqual(data.groups[0].operations.length, 2);
  });

  test('searches operations and returns operation contract detail', async () => {
    const searched = await searchOperations({ input: inputPath, query: 'order' });
    const searchData = searched.data as { results: Array<{ path: string }> };
    assert.strictEqual(searchData.results[0].path, '/orders');

    const detail = await getOperationDetail({ input: inputPath, path: '/orders', method: 'post' });
    const detailData = detail.data as {
      parameters: { body: unknown[] };
      referencedDefinitions: string[];
    };
    assert.strictEqual(detailData.parameters.body.length, 1);
    assert.deepStrictEqual(detailData.referencedDefinitions.sort(), ['CreateOrderRequest', 'Order']);
  });

  test('can inspect patch contracts but rejects unsupported service generation methods', async () => {
    const detail = await getOperationDetail({ input: inputPath, path: '/users/{id}/avatar', method: 'patch' });
    const detailData = detail.data as { method: string; path: string };
    assert.strictEqual(detailData.method, 'patch');
    assert.strictEqual(detailData.path, '/users/{id}/avatar');

    await assert.rejects(
      () =>
        previewGenerate({
          input: inputPath,
          mode: 'services',
          paths: ['/avatar'],
          translate: false,
        }),
      /supports only get, post, put, and delete/,
    );
  });

  test('previews generation without writing files', async () => {
    const output = join(tempRoot, 'generated');
    const preview = await previewGenerate({
      input: inputPath,
      paths: ['/users'],
      translate: false,
    });
    const data = preview.data as { selectedOperationCount: number; generatedFileCount: number };

    assert.strictEqual(data.selectedOperationCount, 2);
    assert.ok(data.generatedFileCount > 0);
    assert.strictEqual(existsSync(output), false);
  });

  test('generates files and protects existing output by default', async () => {
    const output = join(tempRoot, 'generated');
    const firstRun = await generate({
      input: inputPath,
      output,
      paths: ['/users'],
      translate: false,
    });
    const firstData = firstRun.data as { outputFiles: string[] };

    assert.ok(firstData.outputFiles.length > 0);
    assert.ok(readFileSync(firstData.outputFiles[0], 'utf8').includes('interface User'));

    await assert.rejects(
      () =>
        generate({
          input: inputPath,
          output,
          paths: ['/users'],
          translate: false,
        }),
      /Refusing to overwrite/,
    );
  });
});
