# @tswagger/mcp

MCP server for inspecting Swagger/OpenAPI v2 documents and generating deterministic TypeScript artifacts with tswagger.

This package is useful even when the target project does not use tswagger. Agents can query API contracts, inspect operation details, preview generated artifacts, and only write files when explicitly asked to generate.

## Usage

```json
{
  "servers": {
    "tswagger": {
      "type": "stdio",
      "command": "npx",
      "args": ["@tswagger/mcp"]
    }
  }
}
```

## Local inspection

From the repository root:

```sh
pnpm run mcp-inspect
```

This builds `@tswagger/mcp` and launches MCP Inspector against `node dist/bin.js`.

## Tools

- `tswagger_parse_document`
- `tswagger_list_operations`
- `tswagger_search_operations`
- `tswagger_get_operation_detail`
- `tswagger_preview_generate`
- `tswagger_generate`

OpenAPI v2 is supported in the first release.
