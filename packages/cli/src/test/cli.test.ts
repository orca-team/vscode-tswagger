import * as assert from 'assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runCli } from '../index';
import { getDefaultCacheFilePath } from '../translate';

suite('@tswagger/cli', () => {
  let tempRoot = '';

  setup(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'tswagger-cli-'));
  });

  teardown(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('uses the hierarchical default cache path', () => {
    assert.strictEqual(getDefaultCacheFilePath(tempRoot), join(tempRoot, '.tswagger', 'cli', 'translation-cache.json'));
  });

  test('generates type artifacts with translated names and persistent cache', async () => {
    const inputPath = join(tempRoot, 'swagger.json');
    const outputPath = join(tempRoot, 'generated');
    const secondOutputPath = join(tempRoot, 'generated-second');
    const cacheDir = join(tempRoot, 'cache');
    const translateCalls: string[] = [];

    writeFileSync(
      inputPath,
      JSON.stringify({
        swagger: '2.0',
        info: { title: 'cli-test', version: '1.0.0' },
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
              id: { type: 'string' },
            },
          },
        },
      }),
    );

    const createTranslateText = () => async (text: string) => {
      translateCalls.push(text);
      if (text === '查询用户') {
        return 'GetUser';
      }
      if (text === '用户信息') {
        return 'UserInfo';
      }
      return text;
    };

    const silentLogger = {
      log: () => {},
      warn: () => {},
      error: () => {},
    };

    const firstRun = await runCli(['--input', inputPath, '--output', outputPath, '--mode', 'types', '--cache-dir', cacheDir], {
      logger: silentLogger,
      translateText: createTranslateText(),
    });

    assert.strictEqual(firstRun.selectedOperationCount, 1);
    const generatedTypePath = join(outputPath, 'types', '用户', 'GetUser.ts');
    const generatedTypeContent = readFileSync(generatedTypePath, 'utf8');
    assert.ok(generatedTypeContent.includes('interface UserInfo'));
    assert.ok(translateCalls.includes('查询用户'));
    assert.ok(translateCalls.includes('用户信息'));

    translateCalls.length = 0;

    const secondRun = await runCli(['--input', inputPath, '--output', secondOutputPath, '--mode', 'types', '--cache-dir', cacheDir], {
      logger: silentLogger,
      translateText: createTranslateText(),
    });

    assert.strictEqual(secondRun.generatedFileCount, firstRun.generatedFileCount);
    assert.deepStrictEqual(translateCalls, []);
  });
});