---
name: tswagger-output
description: Use this skill when a developer needs to troubleshoot or explain tswagger generated TypeScript output, including service names, type names, imports, fetchFilePath, FetchResult, get/post/put/del helpers, basePath prefixes, basePathMapping, query/body/formData handling, or service.map.yaml behavior.
---

# TSwagger Generated Output

Use this skill when the developer already generated files and wants to understand or fix the output. Start from the generated code and project config before recommending changes.

## Triage order

1. Identify which surface generated the files: VS Code extension, CLI, MCP, or custom `@tswagger/core` integration.
2. Inspect the relevant generated service file and the source Swagger operation.
3. Check project config for `fetchFilePath`, `addBasePathPrefix`, and `basePathMapping`.
4. Check whether names come from `operationId`, path/method composition, translation, or existing mapping.
5. If regeneration changed names unexpectedly, inspect `service.map.yaml`.

## Generated service contract

Service files are built around a fetch helper that exports:

- `get`
- `post`
- `put`
- `del`
- `FetchResult`

Swagger `delete` operations are emitted through `del` to avoid using `delete` as an imported function name.

## Parameter shapes

- Path params become direct function arguments and are interpolated into the URL.
- Query params are passed as `query`.
- Body params are passed as `data`.
- Form data params are converted to `FormData` before request execution.
- For `post`, `put`, and `delete`, query params may be appended to the URL with `URLSearchParams`.

## Naming behavior

- Prefer stable `operationId` values in Swagger documents when developers need stable service names.
- If `operationId` is missing, TSwagger composes names from the HTTP method and path.
- Chinese or non-ASCII names may be translated, depending on the surface and configuration.
- Existing rename mappings can preserve names across regeneration.

## Base path behavior

- If `addBasePathPrefix` is false, generated request paths should not include the Swagger `basePath`.
- If `addBasePathPrefix` is true and `basePathMapping` contains the Swagger `basePath`, the mapped value is used.
- If `addBasePathPrefix` is true and there is no mapping, the Swagger `basePath` is prepended as-is.

## service.map.yaml

`service.map.yaml` records generated service/type mappings for a grouped API output. It lets TSwagger preserve renamed service and type names on later regeneration.

Do not recommend manual edits as the default fix. Prefer regenerating through the extension rename flow or fixing the source Swagger naming. Manual edits are only appropriate when the developer explicitly understands they are migrating mappings.

## Common fixes

- Wrong import path: update `fetchFilePath` in project config, then regenerate.
- Wrong URL prefix: update `addBasePathPrefix` or `basePathMapping`, then regenerate.
- Unstable names: add stable `operationId` values, preserve translation cache, or use the extension rename workflow.
- Missing form data handling: verify the fetch helper's `post` method supports `FormData`.
