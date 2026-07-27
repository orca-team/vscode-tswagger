import {
  Artifact,
  CliOptions,
  collectApiGroups,
  filterApiGroups,
  generateArtifactsFromGroups,
  loadSwaggerV2Document,
  writeArtifacts,
} from '@tswagger/cli';
import { ApiGroupByTag, ApiPathTypeV2, HttpMethod } from '@tswagger/types';
import { existsSync } from 'fs';
import { OpenAPIV2 } from 'openapi-types';
import { join, resolve } from 'path';
import {
  CommonDocumentInput,
  GenerateInput,
  GenerateMode,
  GeneratePreviewInput,
  OperationDetailInput,
  OperationFilterInput,
  OperationSearchInput,
  OperationSummary,
  ToolSuccess,
} from './types.js';

const HTTP_METHODS: HttpMethod[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];
const SERVICE_GENERATION_METHODS: HttpMethod[] = ['get', 'put', 'post', 'delete'];
const DEFAULT_PREVIEW_LENGTH = 240;

const getCwd = (cwd?: string): string => cwd ?? process.cwd();

const countOperations = (groups: ApiGroupByTag[]): number => groups.reduce((count, group) => count + group.apiPathList.length, 0);

const hasResponseSchema = (operation: OpenAPIV2.OperationObject): boolean => {
  return Object.values(operation.responses ?? {}).some((response) => !!(response as OpenAPIV2.ResponseObject).schema);
};

const summarizeOperation = (tag: string, apiPath: ApiPathTypeV2): OperationSummary => {
  const { method, path, pathInfo } = apiPath;

  return {
    tag,
    method,
    path,
    operationId: pathInfo.operationId,
    summary: pathInfo.summary,
    description: pathInfo.description,
    hasParameters: !!pathInfo.parameters?.length,
    hasResponseSchema: hasResponseSchema(pathInfo),
  };
};

const createFilterOptions = (input: OperationFilterInput): CliOptions => ({
  input: input.input,
  output: '',
  mode: 'types',
  tags: input.tags ?? [],
  paths: input.paths ?? [],
  methods: input.methods ?? [],
  translate: true,
});

const loadGroups = async (input: OperationFilterInput): Promise<{ document: OpenAPIV2.Document; groups: ApiGroupByTag[] }> => {
  const document = await loadSwaggerV2Document(input.input, getCwd(input.cwd));
  const groups = filterApiGroups(collectApiGroups(document), createFilterOptions(input));

  return { document, groups };
};

const normalizeMode = (mode?: GenerateMode): GenerateMode => mode ?? 'types';

const validateServiceGenerationMethods = (groups: ApiGroupByTag[], mode: GenerateMode): void => {
  if (mode === 'types') {
    return;
  }

  const unsupportedOperations = groups.flatMap((group) =>
    group.apiPathList
      .filter((apiPath) => !SERVICE_GENERATION_METHODS.includes(apiPath.method))
      .map((apiPath) => `${apiPath.method.toUpperCase()} ${apiPath.path}`),
  );

  if (unsupportedOperations.length) {
    throw new Error(
      [
        'tswagger service generation currently supports only get, post, put, and delete.',
        `Unsupported selected operations: ${unsupportedOperations.join(', ')}`,
      ].join(' '),
    );
  }
};

const getArtifacts = async (input: GeneratePreviewInput): Promise<{ document: OpenAPIV2.Document; groups: ApiGroupByTag[]; artifacts: Artifact[] }> => {
  const { document, groups } = await loadGroups(input);
  if (!groups.length) {
    throw new Error('No API operations matched the current filters.');
  }

  const mode = normalizeMode(input.mode);
  validateServiceGenerationMethods(groups, mode);

  const artifacts = await generateArtifactsFromGroups(
    document,
    groups,
    {
      mode,
      translate: input.translate !== false,
      cacheDir: input.cacheDir,
    },
    {
      cwd: getCwd(input.cwd),
    },
  );

  return { document, groups, artifacts };
};

const normalizeMethod = (method: string): HttpMethod => {
  const normalized = method.toLowerCase() as HttpMethod;
  if (!HTTP_METHODS.includes(normalized)) {
    throw new Error(`Unsupported method: ${method}`);
  }

  return normalized;
};

const collectRefs = (value: unknown, refs: Set<string> = new Set()): string[] => {
  if (!value || typeof value !== 'object') {
    return Array.from(refs);
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectRefs(item, refs));
    return Array.from(refs);
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
    if (key === '$ref' && typeof nestedValue === 'string') {
      const match = nestedValue.match(/^#\/definitions\/(.+)$/);
      refs.add(match ? decodeURIComponent(match[1]) : nestedValue);
      return;
    }

    collectRefs(nestedValue, refs);
  });

  return Array.from(refs);
};

const groupParameters = (parameters: OpenAPIV2.Parameters = []) => {
  const result: Record<string, OpenAPIV2.Parameters> = {
    path: [],
    query: [],
    body: [],
    formData: [],
    header: [],
    other: [],
  };

  parameters.forEach((parameter) => {
    const currentParameter = parameter as OpenAPIV2.Parameter;
    const location = currentParameter.in ?? 'other';
    const group = result[location] ?? result.other;
    group.push(currentParameter);
  });

  return result;
};

const findOperation = (document: OpenAPIV2.Document, path: string, method: HttpMethod): ApiPathTypeV2 | undefined => {
  const apiPathItem = document.paths?.[path];
  const operation = apiPathItem?.[method] as OpenAPIV2.OperationObject | undefined;
  if (!operation) {
    return undefined;
  }

  return {
    method,
    path,
    pathInfo: operation,
  };
};

export const parseDocument = async (input: CommonDocumentInput): Promise<ToolSuccess<Record<string, unknown>>> => {
  const document = await loadSwaggerV2Document(input.input, getCwd(input.cwd));
  const groups = collectApiGroups(document);
  const operationCount = countOperations(groups);
  const data = {
    title: document.info.title,
    version: document.info.version,
    basePath: document.basePath,
    tagCount: groups.length,
    operationCount,
    definitionCount: Object.keys(document.definitions ?? {}).length,
  };

  return {
    text: `Parsed ${document.info.title} with ${operationCount} operations.`,
    data,
  };
};

export const listOperations = async (input: OperationFilterInput): Promise<ToolSuccess<Record<string, unknown>>> => {
  const { document, groups } = await loadGroups(input);
  const operations = groups.map((group) => ({
    tag: group.tag,
    operations: group.apiPathList.map((apiPath) => summarizeOperation(group.tag.name, apiPath)),
  }));
  const operationCount = countOperations(groups);

  return {
    text: `Found ${operationCount} operations in ${document.info.title}.`,
    data: {
      title: document.info.title,
      operationCount,
      groups: operations,
    },
  };
};

export const searchOperations = async (input: OperationSearchInput): Promise<ToolSuccess<Record<string, unknown>>> => {
  const query = input.query.trim().toLowerCase();
  if (!query) {
    throw new Error('Missing required search query.');
  }

  const { document, groups } = await loadGroups(input);
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  const results = groups
    .flatMap((group) =>
      group.apiPathList.map((apiPath) => {
        const summary = summarizeOperation(group.tag.name, apiPath);
        const exactPathOrMethod = summary.path.toLowerCase() === query || summary.method.toLowerCase() === query;
        const operationIdHit = summary.operationId?.toLowerCase().includes(query) ?? false;
        const summaryHit = summary.summary?.toLowerCase().includes(query) ?? false;
        const descriptionHit = summary.description?.toLowerCase().includes(query) ?? false;
        const pathHit = summary.path.toLowerCase().includes(query);
        const tagHit = summary.tag.toLowerCase().includes(query);
        const score = exactPathOrMethod ? 100 : operationIdHit ? 80 : pathHit ? 70 : summaryHit || descriptionHit ? 60 : tagHit ? 40 : 0;

        return { score, operation: summary };
      }),
    )
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.operation.path.localeCompare(right.operation.path))
    .slice(0, limit)
    .map((item) => item.operation);

  return {
    text: `Found ${results.length} matching operations in ${document.info.title}.`,
    data: {
      title: document.info.title,
      query: input.query,
      results,
    },
  };
};

export const getOperationDetail = async (input: OperationDetailInput): Promise<ToolSuccess<Record<string, unknown>>> => {
  const document = await loadSwaggerV2Document(input.input, getCwd(input.cwd));
  const method = normalizeMethod(input.method);
  const apiPath = findOperation(document, input.path, method);
  if (!apiPath) {
    throw new Error(`Operation not found: ${method.toUpperCase()} ${input.path}`);
  }

  const operation = apiPath.pathInfo;
  const tag = operation.tags?.[0] ?? 'default';
  const parameterGroups = groupParameters(operation.parameters);
  const referencedDefinitions = collectRefs({
    parameters: operation.parameters,
    responses: operation.responses,
  });
  const data = {
    tag,
    method,
    path: input.path,
    operationId: operation.operationId,
    summary: operation.summary,
    description: operation.description,
    consumes: operation.consumes ?? document.consumes,
    produces: operation.produces ?? document.produces,
    parameters: parameterGroups,
    responses: operation.responses,
    referencedDefinitions,
  };

  return {
    text: `Loaded contract for ${method.toUpperCase()} ${input.path}.`,
    data,
  };
};

export const previewGenerate = async (input: GeneratePreviewInput): Promise<ToolSuccess<Record<string, unknown>>> => {
  const { document, groups, artifacts } = await getArtifacts(input);
  const files = artifacts.map((artifact) => ({
    relativePath: artifact.relativePath,
    byteLength: Buffer.byteLength(artifact.content, 'utf8'),
    preview: artifact.content.slice(0, DEFAULT_PREVIEW_LENGTH),
  }));

  return {
    text: `Previewed ${artifacts.length} files from ${countOperations(groups)} operations in ${document.info.title}.`,
    data: {
      mode: normalizeMode(input.mode),
      title: document.info.title,
      selectedOperationCount: countOperations(groups),
      generatedFileCount: artifacts.length,
      files,
    },
  };
};

export const generate = async (input: GenerateInput): Promise<ToolSuccess<Record<string, unknown>>> => {
  const { document, groups, artifacts } = await getArtifacts(input);
  const outputDir = resolve(getCwd(input.cwd), input.output);
  const targetFiles = artifacts.map((artifact) => join(outputDir, artifact.relativePath));
  const conflicts = targetFiles.filter((filePath) => existsSync(filePath));

  if (conflicts.length && !input.overwrite) {
    throw new Error(`Refusing to overwrite ${conflicts.length} existing files: ${conflicts.join(', ')}`);
  }

  const outputFiles = writeArtifacts(outputDir, artifacts);

  return {
    text: `Generated ${outputFiles.length} files from ${countOperations(groups)} operations in ${document.info.title}.`,
    data: {
      mode: normalizeMode(input.mode),
      title: document.info.title,
      selectedOperationCount: countOperations(groups),
      generatedFileCount: outputFiles.length,
      outputFiles,
    },
  };
};
