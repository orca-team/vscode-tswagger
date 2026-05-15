const { mkdirSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');

const localTestDir = resolve(__dirname, '..', 'local-test');
const targetFile = join(localTestDir, 'swagger-cn.json');

const swaggerDocument = {
  swagger: '2.0',
  info: {
    title: '中文测试',
    version: '1.0.0',
  },
  tags: [{ name: '用户' }],
  paths: {
    '/users/{id}': {
      get: {
        tags: ['用户'],
        operationId: '查询用户',
        summary: '查询用户',
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
            schema: {
              $ref: '#/definitions/用户信息',
            },
          },
        },
      },
    },
  },
  definitions: {
    用户信息: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    },
  },
};

mkdirSync(localTestDir, { recursive: true });
writeFileSync(targetFile, `${JSON.stringify(swaggerDocument, null, 2)}\n`, 'utf8');
process.stdout.write(`${targetFile}\n`);
