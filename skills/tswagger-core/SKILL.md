---
name: tswagger-core
description: Use this skill when a developer wants to integrate @tswagger/core into custom tooling, build a generator around Swagger/OpenAPI v2 documents, call handleSwaggerPathV2/generateTypescriptFromAPIV2/generateServiceFromAPIV2, configure translation, or decide between @tswagger/core, @tswagger/cli, MCP, and the VS Code extension.
---

# TSwagger Core

Use this skill for custom integrations built on `@tswagger/core`. Prefer the CLI for ordinary scriptable generation and the VS Code extension for visual project workflows.

## When to use core

Use `@tswagger/core` when the developer needs to:

- embed TSwagger generation into another tool
- control the input Swagger document and operation collection directly
- preview generated artifacts without using the VS Code extension
- build an agent or service around TSwagger primitives

Do not use core for VS Code workspace behavior, UI state, or filesystem conventions that belong to the extension.

## Main primitives

- `configure({ translate })`: Provides the translation function used by name filtering.
- `handleSwaggerPathV2(config)`: Groups operations and builds request/response/service metadata.
- `generateTypescriptFromAPIV2(schema, document, mapping?, options?)`: Converts a Swagger v2 schema into TypeScript definitions.
- `generateServiceImport(collection, sourcePath)`: Creates imports for used request helpers and `FetchResult`.
- `generateServiceFromAPIV2(serviceInfo, config?)`: Creates a service request function for a single operation.

## Integration flow

1. Parse or receive a Swagger/OpenAPI v2 document.
2. Build a collection of operations grouped by tag.
3. Call `configure` if translation is required.
4. Call `handleSwaggerPathV2` with request params, response body, and service options.
5. For each service schema, call `generateTypescriptFromAPIV2`.
6. If service functions are needed, call `generateServiceImport` and `generateServiceFromAPIV2`.
7. Write or return artifacts in the host tool's preferred layout.

## Important boundaries

- Core expects OpenAPI v2 shapes from `openapi-types`.
- Core does not parse remote documents by itself; parsing belongs in the host integration or CLI.
- Core does not manage VS Code settings, project `config.json`, webviews, or `service.map.yaml` files.
- Keep translation deterministic in automation by supplying a stable translate function or cache at the host layer.

## When MCP is a better fit

If an AI agent needs to inspect a Swagger document, list/search operations, preview generated artifacts, or generate files through a tool interface, suggest `@tswagger/mcp` instead of building a custom core wrapper from scratch.
