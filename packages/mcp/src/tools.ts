import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  generate,
  getOperationDetail,
  listOperations,
  parseDocument,
  previewGenerate,
  searchOperations,
} from './operations.js';
type Handler<TInput> = (input: TInput) => Promise<{ text: string; data: Record<string, unknown> }>;

const allMethodSchema = z.enum(['get', 'put', 'post', 'delete', 'options', 'head', 'patch']);
const serviceMethodSchema = z.enum(['get', 'put', 'post', 'delete']);
const modeSchema = z.enum(['types', 'services', 'all']);

const commonInputSchema = {
  input: z.string().describe('Swagger/OpenAPI v2 document URL or local file path.'),
  cwd: z.string().optional().describe('Base directory for resolving local relative paths.'),
};

const filterInputSchema = {
  ...commonInputSchema,
  tags: z.array(z.string()).optional(),
  paths: z.array(z.string()).optional(),
  methods: z.array(allMethodSchema).optional(),
};

const previewInputSchema = {
  ...commonInputSchema,
  tags: z.array(z.string()).optional(),
  paths: z.array(z.string()).optional(),
  methods: z.array(serviceMethodSchema).optional(),
  mode: modeSchema.optional(),
  translate: z.boolean().optional(),
  cacheDir: z.string().optional(),
};

const toToolResult = async <TInput>(handler: Handler<TInput>, input: TInput) => {
  try {
    const result = await handler(input);

    return {
      content: [{ type: 'text' as const, text: result.text }],
      structuredContent: result.data,
    };
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }],
      isError: true,
    };
  }
};

export const registerTools = (server: McpServer): void => {
  server.registerTool(
    'tswagger_parse_document',
    {
      title: 'Parse Swagger Document',
      description: 'Read an OpenAPI v2 document and return document-level facts without writing files.',
      inputSchema: commonInputSchema,
    },
    (input) => toToolResult(parseDocument, input),
  );

  server.registerTool(
    'tswagger_list_operations',
    {
      title: 'List Swagger Operations',
      description: 'List OpenAPI v2 operations grouped by tag, optionally filtered by tag, path substring, or HTTP method.',
      inputSchema: filterInputSchema,
    },
    (input) => toToolResult(listOperations, input),
  );

  server.registerTool(
    'tswagger_search_operations',
    {
      title: 'Search Swagger Operations',
      description: 'Search OpenAPI v2 operations by path, method, operationId, summary, description, or tag.',
      inputSchema: {
        ...commonInputSchema,
        query: z.string(),
        limit: z.number().optional(),
      },
    },
    (input) => toToolResult(searchOperations, input),
  );

  server.registerTool(
    'tswagger_get_operation_detail',
    {
      title: 'Get Swagger Operation Detail',
      description: 'Return the exact request and response contract for one OpenAPI v2 path and method.',
      inputSchema: {
        ...commonInputSchema,
        path: z.string(),
        method: allMethodSchema,
      },
    },
    (input) => toToolResult(getOperationDetail, input),
  );

  server.registerTool(
    'tswagger_preview_generate',
    {
      title: 'Preview tswagger Generation',
      description: 'Generate deterministic tswagger artifacts in memory and return file summaries without writing files.',
      inputSchema: previewInputSchema,
      annotations: {
        readOnlyHint: true,
      },
    },
    (input) => toToolResult(previewGenerate, input),
  );

  server.registerTool(
    'tswagger_generate',
    {
      title: 'Generate tswagger Artifacts',
      description: 'Write deterministic tswagger artifacts to an output directory. Existing files are protected unless overwrite is true.',
      inputSchema: {
        ...previewInputSchema,
        output: z.string(),
        overwrite: z.boolean().optional(),
      },
      annotations: {
        destructiveHint: true,
      },
    },
    (input) => toToolResult(generate, input),
  );
};
