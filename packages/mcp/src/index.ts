import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools.js';

export * from './operations.js';
export * from './types.js';

export const createServer = (): McpServer => {
  const server = new McpServer(
    {
      name: 'tswagger-mcp',
      version: '1.0.0-beta.0',
    },
    {
      instructions:
        'Use tswagger tools to inspect OpenAPI v2 contracts before editing API code. Preview generation is read-only; only tswagger_generate writes files.',
    },
  );

  registerTools(server);

  return server;
};
