---
name: tswagger-extension
description: Use this skill when a developer wants to use or configure the tswagger VS Code extension, manage Swagger document URLs, generate TypeScript artifacts visually, configure config.json, set fetchFilePath/basePathMapping/swaggerUrls, or understand extension-generated files in an application project.
---

# TSwagger VS Code Extension

Use this skill for developers using the `tswagger` VS Code extension inside an application project. The extension is best when users want to browse Swagger operations visually, choose specific APIs, rename generated symbols, and save results into the current workspace.

## Recommended workflow

1. Open the extension from the command palette with `<TSwagger> Generate Typescript` or from the editor context menu.
2. Choose or manage Swagger document URLs in the extension UI.
3. Select the API operations to generate.
4. Review and rename generated type or service names when needed.
5. Save generated files into the project.

## Project config

The extension uses a project-level `config.json` that is created automatically on first generation when needed.

Important fields:

- `fetchFilePath`: Import path for the project's request helper. It should start with `@`, where `@` represents the project `src` directory. Default: `@/utils/fetch`.
- `addBasePathPrefix`: Whether generated service paths include the Swagger document `basePath`. Default: `true`.
- `basePathMapping`: Optional mapping for replacing Swagger base paths, such as mapping `/api-v1` to `/api`.
- `swaggerUrls`: Project-level Swagger document URL shortcuts for quick selection and synchronization.

Example:

```json
{
  "fetchFilePath": "@/utils/fetch",
  "addBasePathPrefix": true,
  "basePathMapping": {
    "/api-v1": "/api"
  },
  "swaggerUrls": [
    {
      "url": "https://api-dev.example.com/v2/api-docs",
      "remark": "dev"
    }
  ]
}
```

## Fetch helper contract

Generated service files expect the configured fetch module to export:

- request methods: `get`, `post`, `put`, and `del`
- a generic result type: `FetchResult`

The `post` helper should support `FormData` when the Swagger operation uses form data.

## When to suggest another TSwagger surface

- Suggest `@tswagger/cli` for CI, repeatable scripts, or batch generation without opening VS Code.
- Suggest `@tswagger/core` for custom generators, agent tools, or deeper integration.
- Suggest the output troubleshooting skill when the question is about unexpected generated names, imports, paths, or `service.map.yaml`.

## Safety notes

- Do not tell users to hand-edit `service.map.yaml` as a normal workflow. It preserves generated name mappings across regenerations.
- Keep application-specific request-layer advice focused on `fetchFilePath` and the fetch helper contract.
