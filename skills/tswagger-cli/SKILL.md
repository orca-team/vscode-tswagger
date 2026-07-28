---
name: tswagger-cli
description: Use this skill when a developer wants to generate TypeScript types or service request files from Swagger/OpenAPI v2 with the @tswagger/cli package, automate generation in local scripts or CI, filter generation by tag/path/method, manage translation caching, or troubleshoot CLI arguments and output layout.
---

# TSwagger CLI

Use this skill for scriptable TSwagger generation. Prefer the VS Code extension when the developer wants a visual workflow, selective point-and-click generation, or project-level UI configuration. Prefer `@tswagger/core` only when the developer is building their own integration.

## First checks

1. Confirm the input document is Swagger/OpenAPI v2. The CLI currently rejects non-v2 documents.
2. Confirm whether the developer wants only types, only service files, or both.
3. Ask for or infer the output directory before suggesting commands.
4. If generated names are Chinese or unstable, check whether translation should stay enabled and whether a persistent cache directory is configured.

## Common commands

Generate types only:

```sh
tswagger --input ./swagger.json --output ./src/.tswagger --mode types
```

Generate service request files and the default fetch helper:

```sh
tswagger --input ./swagger.json --output ./src/.tswagger --mode services
```

Generate both types and services:

```sh
tswagger --input ./swagger.json --output ./src/.tswagger --mode all
```

Filter operations:

```sh
tswagger --input ./swagger.json --output ./src/.tswagger --tag User --method get
tswagger --input ./swagger.json --output ./src/.tswagger --path /users
```

Disable translation or make translation caching stable:

```sh
tswagger --input ./swagger.json --output ./src/.tswagger --no-translate
tswagger --input ./swagger.json --output ./src/.tswagger --cache-dir ./.tswagger-cache
```

## CLI options

- `--input`: Required. Local path or HTTP(S) URL for the Swagger/OpenAPI v2 document.
- `--output`: Required. Directory where generated artifacts are written.
- `--mode`: `types`, `services`, or `all`. Defaults to `types`.
- `--tag`: Include only matching tag names. Accepts comma-separated values.
- `--path`: Include operations whose path contains the provided value. Accepts comma-separated values.
- `--method`: Include matching HTTP methods. Accepts comma-separated values.
- `--no-translate`: Disable translation-based naming.
- `--cache-dir`: Persist translation cache in a chosen directory.

## Output expectations

- `types` mode writes files under `types/<tag>/<serviceName>.ts`.
- `services` mode writes files under `services/<tag>/<serviceName>.ts` and creates `services/fetch.ts`.
- `all` mode writes both trees.
- The CLI groups operations by Swagger tags. Operations without tags are grouped under `default`.

## Troubleshooting

- If no files are generated, check whether `--tag`, `--path`, or `--method` filters excluded every operation.
- If the CLI reports unsupported input, inspect whether the document is OpenAPI v3 instead of Swagger/OpenAPI v2.
- If service names change between runs, use stable `operationId` values in the Swagger document and keep translation cache persistent.
- If service imports do not match a project-specific request layer, adjust generated files after generation or use the VS Code extension configuration workflow for `fetchFilePath`.
