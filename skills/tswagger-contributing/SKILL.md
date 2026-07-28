---
name: tswagger-contributing
description: Use this skill when contributing code to the orca-team/vscode-tswagger repository, changing the VS Code extension, @tswagger/cli, @tswagger/core, @tswagger/types, @tswagger/mcp, the webview, tests, changesets, release workflows, or repository documentation.
---

# Contributing to TSwagger

Use this skill only when the user is modifying the `orca-team/vscode-tswagger` repository itself. For application-level usage questions, use one of the other TSwagger skills.

## Repository map

- Root package `tswagger`: VS Code extension. Entry: `src/extension.ts`. Generation controller: `src/controllers/generate/v2.ts`.
- `@tswagger/core`: Shared generation primitives in `packages/core/src`.
- `@tswagger/cli`: Scriptable generation package in `packages/cli/src`.
- `@tswagger/types`: Shared public TypeScript contracts in `packages/types/src`.
- `@tswagger/mcp`: MCP server for agent inspection and generation in `packages/mcp/src`.
- `tswagger-webview`: Private extension webview workspace in `webview/src`.

## Implementation guidance

- Put shared Swagger parsing, naming, schema, and service-generation behavior in `@tswagger/core`.
- Keep CLI argument parsing, document loading, output layout, and translation cache behavior in `@tswagger/cli`.
- Keep VS Code commands, workspace config, webview messaging, and file-writing behavior in the root extension package.
- Keep agent tool schemas and MCP-specific orchestration in `@tswagger/mcp`.
- Update `@tswagger/types` when a public cross-package contract changes.
- Add focused regression tests near the package whose behavior changed.

## Validation commands

Choose the smallest meaningful set:

```sh
pnpm --filter @tswagger/core run test-compile
pnpm --filter @tswagger/core run test
pnpm --filter @tswagger/cli run test
pnpm --filter @tswagger/cli run build
pnpm --filter @tswagger/types run build
pnpm --filter @tswagger/mcp run test
pnpm --filter @tswagger/mcp run build
pnpm run webview-build
pnpm run test-compile
pnpm run lint
```

Use `pnpm run package` only when extension packaging confidence is needed.

## Release and changeset rules

- Extension releases use Release Please. Root `package.json` and root `CHANGELOG.md` belong to the extension release line.
- Public npm package changes use Changesets.
- Add a `.changeset/*.md` file for behavior or API changes in `packages/cli`, `packages/core`, `packages/types`, or `packages/mcp`.
- Do not manually edit package-level versions or package `CHANGELOG.md` files on normal feature branches.
- The npm version PR title is `chore: version npm packages`.
- Extension release PRs must not include package-level release artifacts.

## Repository rules

- Do not create or suggest a branch name that starts with `codex`.
- Use the `gh` command when reading GitHub workflows, CI status, or other GitHub-hosted status.
- Avoid reverting unrelated user changes in a dirty worktree.
- Keep generated build output out of commits unless the repository already tracks it for the touched package.
