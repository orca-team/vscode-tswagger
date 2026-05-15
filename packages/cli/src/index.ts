import SwaggerParser from '@apidevtools/swagger-parser';
import {
  configure,
  generateServiceFromAPIV2,
  generateServiceImport,
  generateTypescriptFromAPIV2,
  handleSwaggerPathV2,
} from '@tswagger/core';
import { ApiGroupByTag, ApiPathTypeV2, GenerateTypescriptConfig, HttpMethod, SwaggerPathSchemaV2 } from '@tswagger/types';
import { mkdirSync, writeFileSync } from 'fs';
import { OpenAPIV2 } from 'openapi-types';
import { dirname, join, resolve } from 'path';
import { createBingTranslator, TranslatorLogger } from './translate';

export type CliMode = 'types' | 'services' | 'all';

export type CliLogger = Pick<Console, 'log' | 'warn' | 'error'>;

export type CliOptions = {
  input: string;
  output: string;
  mode: CliMode;
  tags: string[];
  paths: string[];
  methods: HttpMethod[];
  translate: boolean;
  cacheDir?: string;
};

export type CliRunDependencies = {
  cwd?: string;
  logger?: CliLogger;
  translateText?: (text: string) => Promise<string>;
};

export type CliRunResult = {
  mode: CliMode;
  documentTitle: string;
  selectedOperationCount: number;
  generatedFileCount: number;
  outputFiles: string[];
};

type Artifact = {
  relativePath: string;
  content: string;
};

const HTTP_METHODS: HttpMethod[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

const FETCH_TEMPLATE = `export type FetchResult<T> = T;

const withQuery = (url: string, params?: Record<string, any>) => {
  if (!params || !Object.keys(params).length) {
    return url;
  }

  return \`${'${url}'}?${'${new URLSearchParams(params as Record<string, string>).toString()}'}\`;
};

const request = async <T>(url: string, init: RequestInit = {}) => {
  const response = await fetch(url, init);
  return (await response.json()) as T;
};

export const get = <T>(url: string, params?: Record<string, any>, init?: RequestInit) => request<T>(withQuery(url, params), init);
export const post = <T>(url: string, data?: Record<string, any> | FormData, init?: RequestInit) =>
  request<T>(url, { ...init, method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data ?? {}) });
export const put = <T>(url: string, data?: Record<string, any>, init?: RequestInit) =>
  request<T>(url, { ...init, method: 'PUT', body: JSON.stringify(data ?? {}) });
export const del = <T>(url: string, data?: Record<string, any>, init?: RequestInit) =>
  request<T>(url, { ...init, method: 'DELETE', body: JSON.stringify(data ?? {}) });
`;

const createRootIndex = (entries: string[]): string => {
  return `${entries.map((entry) => `export * from './${entry}';`).join('\n')}\n`;
};

const createGroupIndex = (serviceNames: string[]): string => {
  return `${serviceNames.map((serviceName) => `export * from './${serviceName}';`).join('\n')}\n`;
};

const ensureMode = (value: string): CliMode => {
  if (value === 'types' || value === 'services' || value === 'all') {
    return value;
  }

  throw new Error(`Unsupported mode: ${value}`);
};

const normalizeMethod = (value: string): HttpMethod => {
  const normalized = value.toLowerCase() as HttpMethod;
  if (!HTTP_METHODS.includes(normalized)) {
    throw new Error(`Unsupported method filter: ${value}`);
  }

  return normalized;
};

const appendValues = (target: string[], raw: string): void => {
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => target.push(item));
};

export const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    input: '',
    output: '',
    mode: 'types',
    tags: [],
    paths: [],
    methods: [],
    translate: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case '--input':
        options.input = nextValue();
        break;
      case '--output':
        options.output = nextValue();
        break;
      case '--mode':
        options.mode = ensureMode(nextValue());
        break;
      case '--tag':
        appendValues(options.tags, nextValue());
        break;
      case '--path':
        appendValues(options.paths, nextValue());
        break;
      case '--method':
        appendValues(options.methods, nextValue());
        options.methods = options.methods.map(normalizeMethod);
        break;
      case '--cache-dir':
        options.cacheDir = nextValue();
        break;
      case '--no-translate':
        options.translate = false;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.input) {
    throw new Error('Missing required argument: --input');
  }
  if (!options.output) {
    throw new Error('Missing required argument: --output');
  }

  return options;
};

const isRemoteInput = (input: string): boolean => /^https?:\/\//.test(input);

const resolveInput = (input: string, cwd: string): string => {
  return isRemoteInput(input) ? input : resolve(cwd, input);
};

const resolveOutput = (output: string, cwd: string): string => {
  return resolve(cwd, output);
};

const toApiGroupCollection = (groups: ApiGroupByTag[]): SwaggerPathSchemaV2[] => {
  return groups.map(({ tag, apiPathList }) => ({
    tag: tag.name,
    apiPathList,
  }));
};

export const collectApiGroups = (document: OpenAPIV2.Document): ApiGroupByTag[] => {
  const apiMapByTag = new Map<string, ApiPathTypeV2[]>();
  const tagInfoMap = new Map<string, OpenAPIV2.TagObject>();
  const { tags = [], paths = {} } = document;

  tags.forEach((tag) => {
    apiMapByTag.set(tag.name, []);
    tagInfoMap.set(tag.name, tag);
  });

  Object.entries(paths).forEach(([apiPath, apiPathItem]) => {
    Object.entries(apiPathItem).forEach(([method, pathInfo]) => {
      if (!HTTP_METHODS.includes(method as HttpMethod)) {
        return;
      }

      const operation = pathInfo as OpenAPIV2.OperationObject;
      const currentTags = operation.tags?.length ? operation.tags : ['default'];

      currentTags.forEach((currentTag) => {
        if (!apiMapByTag.has(currentTag)) {
          apiMapByTag.set(currentTag, []);
          tagInfoMap.set(currentTag, { name: currentTag });
        }

        apiMapByTag.get(currentTag)?.push({
          method: method as HttpMethod,
          path: apiPath,
          pathInfo: operation,
        });
      });
    });
  });

  return Array.from(apiMapByTag.entries()).map(([tagName, apiPathList]) => ({
    tag: tagInfoMap.get(tagName) as OpenAPIV2.TagObject,
    apiPathList,
  }));
};

export const filterApiGroups = (groups: ApiGroupByTag[], options: CliOptions): ApiGroupByTag[] => {
  return groups
    .filter((group) => (options.tags.length ? options.tags.includes(group.tag.name) : true))
    .map((group) => ({
      ...group,
      apiPathList: group.apiPathList.filter((api) => {
        const pathMatched = options.paths.length ? options.paths.some((path) => api.path.includes(path)) : true;
        const methodMatched = options.methods.length ? options.methods.includes(api.method) : true;
        return pathMatched && methodMatched;
      }),
    }))
    .filter((group) => group.apiPathList.length > 0);
};

const loadDocument = async (input: string): Promise<OpenAPIV2.Document> => {
  const document = await SwaggerParser.parse(input);
  if (!('swagger' in document) || document.swagger !== '2.0') {
    throw new Error('Only OpenAPI v2 documents are currently supported by the CLI.');
  }

  return document as OpenAPIV2.Document;
};

const buildTypeContent = async (groupItem: Awaited<ReturnType<typeof handleSwaggerPathV2>>['swaggerCollection'][number]['group'][number], document: OpenAPIV2.Document) => {
  let content = '';

  for (const serviceInfo of groupItem.serviceInfoList) {
    if (serviceInfo.type === 'path') {
      continue;
    }

    for (const schema of (serviceInfo.schemaList ?? []) as OpenAPIV2.SchemaObject[]) {
      const { tsDef } = await generateTypescriptFromAPIV2(schema, document);
      content += tsDef.endsWith('\n') ? tsDef : `${tsDef}\n`;
    }
  }

  return content || 'export {};\n';
};

const buildServiceContent = async (groupItem: Awaited<ReturnType<typeof handleSwaggerPathV2>>['swaggerCollection'][number]['group'][number], document: OpenAPIV2.Document) => {
  const typeContent = await buildTypeContent(groupItem, document);
  const serviceImport = generateServiceImport([groupItem], '../fetch');
  const serviceContent = await generateServiceFromAPIV2(groupItem, {});

  return `${serviceImport}${typeContent}${serviceContent}`;
};

export const generateArtifacts = async (document: OpenAPIV2.Document, collection: SwaggerPathSchemaV2[], mode: CliMode): Promise<Artifact[]> => {
  const config: GenerateTypescriptConfig = {
    collection,
    V2Document: document,
    options: {
      requestParams: true,
      responseBody: true,
      service: mode !== 'types',
    },
  };

  const { swaggerCollection } = await handleSwaggerPathV2(config);
  const artifacts: Artifact[] = [];
  const typeGroups: string[] = [];
  const serviceGroups: string[] = [];

  for (const { tag, group } of swaggerCollection) {
    const typeServiceNames: string[] = [];
    const serviceNames: string[] = [];

    for (const groupItem of group) {
      if (mode === 'types' || mode === 'all') {
        artifacts.push({
          relativePath: join('types', tag, `${groupItem.serviceName}.ts`),
          content: await buildTypeContent(groupItem, document),
        });
        typeServiceNames.push(groupItem.serviceName);
      }

      if (mode === 'services' || mode === 'all') {
        artifacts.push({
          relativePath: join('services', tag, `${groupItem.serviceName}.ts`),
          content: await buildServiceContent(groupItem, document),
        });
        serviceNames.push(groupItem.serviceName);
      }
    }

    if (typeServiceNames.length) {
      artifacts.push({
        relativePath: join('types', tag, 'index.ts'),
        content: createGroupIndex(typeServiceNames),
      });
      typeGroups.push(tag);
    }

    if (serviceNames.length) {
      artifacts.push({
        relativePath: join('services', tag, 'index.ts'),
        content: createGroupIndex(serviceNames),
      });
      serviceGroups.push(tag);
    }
  }

  if (typeGroups.length) {
    artifacts.push({
      relativePath: join('types', 'index.ts'),
      content: createRootIndex(typeGroups),
    });
  }

  if (serviceGroups.length) {
    artifacts.push({
      relativePath: join('services', 'index.ts'),
      content: createRootIndex(serviceGroups),
    });
    artifacts.push({
      relativePath: join('services', 'fetch.ts'),
      content: FETCH_TEMPLATE,
    });
  }

  return artifacts;
};

export const writeArtifacts = (outputDir: string, artifacts: Artifact[]): string[] => {
  const writtenFiles: string[] = [];

  for (const artifact of artifacts) {
    const filePath = join(outputDir, artifact.relativePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, artifact.content, 'utf8');
    writtenFiles.push(filePath);
  }

  return writtenFiles;
};

export const runCli = async (argv: string[], deps: CliRunDependencies = {}): Promise<CliRunResult> => {
  const cwd = deps.cwd ?? process.cwd();
  const logger = deps.logger ?? console;
  const options = parseArgs(argv);
  const translator = createBingTranslator({
    cacheDir: options.cacheDir,
    cwd,
    disabled: !options.translate,
    logger: logger as TranslatorLogger,
    translateText: deps.translateText,
  });

  configure({
    translate: translator.translate,
  });

  const document = await loadDocument(resolveInput(options.input, cwd));
  const groups = filterApiGroups(collectApiGroups(document), options);
  if (!groups.length) {
    throw new Error('No API operations matched the current filters.');
  }

  const artifacts = await generateArtifacts(document, toApiGroupCollection(groups), options.mode);
  const outputFiles = writeArtifacts(resolveOutput(options.output, cwd), artifacts);

  logger.log(`[tswagger-cli] Generated ${outputFiles.length} files from ${groups.reduce((count, group) => count + group.apiPathList.length, 0)} operations.`);

  return {
    mode: options.mode,
    documentTitle: document.info.title,
    selectedOperationCount: groups.reduce((count, group) => count + group.apiPathList.length, 0),
    generatedFileCount: outputFiles.length,
    outputFiles,
  };
};