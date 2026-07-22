# Release Workflow

This repository uses two release systems:

- the VS Code extension release line for `tswagger`
- the npm package release line for `@tswagger/cli`, `@tswagger/core`, and `@tswagger/types`

## When To Add A Changeset

Add a changeset for any change that affects one or more public npm packages.

Do not add a changeset for extension-only work that only affects the VS Code extension release line.

## Extension Release

Use Release Please for extension releases. Local extension releases with `pnpm run release` are intentionally not supported.

Release Please is the source of truth for the root `package.json` version bump, root `CHANGELOG.md` update, Release PR, and the `extension-vX.Y.Z` tag.

Extension release notes are generated from Conventional Commits merged into `master`. Use `feat(extension): ...` or `fix(webview): ...` for extension-facing changes. The scope is for review clarity; release isolation is enforced by paths and PR checks.

The intended lifecycle is:

1. Develop on a feature branch.
2. Use Conventional Commit messages for extension-facing changes.
3. Open and merge the feature pull request to `master`.
4. The extension Release PR workflow creates or updates a PR titled `chore: release extension <version>`.
5. Review the generated root `CHANGELOG.md`, root `package.json`, and `.release-please-manifest.json` changes.
6. Merge the extension Release PR.
7. Release Please creates the `extension-vX.Y.Z` tag. The same workflow then packages, publishes, updates the GitHub Release asset, and sends the DingTalk notification.

The extension Release PR workflow uses the default GitHub Actions token. The repository must allow GitHub Actions read/write permissions so Release Please can update release pull requests, tags, and GitHub Releases. Publishing happens in the same workflow run, so no separate PAT is required to trigger a downstream tag workflow.

Use extension test tags manually when validating the extension release workflow without publishing:

```bash
pnpm run release:tag:extension:test
git push origin --tags
```

Do not create stable extension tags manually for normal releases. Stable `extension-vX.Y.Z` tags are created by Release Please when the extension Release PR is merged.

## Npm Package Release

Use Changesets for the public npm packages only.

Package-level `CHANGELOG.md` files are updated automatically by Changesets when `pnpm run release:npm:version` is executed.

The npm publish workflow uses npm trusted publishing with GitHub Actions OIDC. Do not configure `NPM_TOKEN` for this repository's npm release path.

The intended lifecycle is:

1. Develop on a feature branch.
2. If the change affects `@tswagger/cli`, `@tswagger/core`, or `@tswagger/types`, add a changeset on that branch.
3. Open a pull request. The npm package test workflow validates builds, tests, and pack checks before merge.
4. Merge the feature pull request to `master`.
5. A dedicated workflow creates or updates a maintainer-reviewed version PR titled `chore: version npm packages`.
6. Review and merge that version PR.
7. After the version PR lands on `master`, the npm publish workflow builds, tests, packs, publishes changed packages, creates an `npm-v<shortsha>` batch tag, pushes tags, and creates a GitHub Release for that npm publish batch.

This means npm package work is split into three phases: change intent is recorded on the feature branch, version bumps are reviewed in a dedicated version PR, and publish happens only after that version PR is merged.

### Feature Branch Workflow

On the feature branch:

```bash
pnpm install
pnpm changeset
pnpm --filter @tswagger/types run build
pnpm --filter @tswagger/core run build
pnpm --filter @tswagger/cli run build
git add .
git commit -m "feat: your change"
```

The important output here is the changeset file under `.changeset/`, not a version bump.

### Version PR Workflow

After the feature branch is reviewed and merged, the repository creates or updates a version PR automatically from `master`.

Maintainers should review that PR as the final confirmation point before publish.

The version PR contains:

- package version bumps
- package changelog updates
- deletion of consumed changeset files

The expected PR title is:

```text
chore: version npm packages
```

### Manual Fallback For Versioning

If the automatic version PR workflow needs to be bypassed temporarily, maintainers can still version on `master` manually:

```bash
pnpm install
pnpm run release:npm:status
pnpm run release:npm:version
pnpm test
git add .
git commit -m "chore: version npm packages"
git push origin master
```

Notes:

- `release:npm:status` shows which public npm packages will be bumped from the queued changesets.
- `release:npm:version` consumes the changeset files, updates package versions, and writes package changelogs.
- The normal path is the maintainer-reviewed version PR, not manual local versioning.
- The publish itself is not done from the developer machine. It is done by the npm release workflow after the version PR merge commit reaches `master`.
- The npm trusted publisher on npmjs.com must be configured against the `release-npm.yml` workflow filename.
- npm publish batches use a dedicated repository tag format: `npm-v<shortsha>`.
- npm package publish does not send DingTalk notifications.
- If no changeset exists for a changed public npm package, `release:npm:status` should fail. That is intentional.

### When To Add A Changeset

- Add one for any change that affects `@tswagger/cli`, `@tswagger/core`, or `@tswagger/types`.
- Do not add one for extension-only work.
- For shared changes, do both: add a changeset for the npm packages and use Conventional Commit messages that should appear in the extension release notes.

### Review Expectations For Npm Package Changes

When reviewing npm package work, check these points explicitly:

- a changeset exists when a public npm package behavior changes
- the touched package still builds to `dist`
- `pack:check` passes for the affected public package
- changelog and README intent still match the package role
- if the PR is the version PR, verify that the package bumps and generated changelog entries match the queued changesets

After the version PR merge commit lands on `master`, the npm release workflow builds, tests, packs, publishes changed npm packages, pushes the `npm-v<shortsha>` batch tag, and creates a GitHub Release summary for that publish batch.

## Choosing The Release Line

- Extension-only change: rely on the Release Please extension Release PR.
- npm package-only change: add a changeset and release only the npm packages.
- Shared change that affects both: use Conventional Commits for the extension release notes and add the needed changesets for the affected npm packages.

## Release Boundary Checks

- PRs that touch `packages/cli`, `packages/core`, or `packages/types` must include a `.changeset/*.md` file unless the PR is the npm version PR.
- Extension Release PRs must not include `packages/*/package.json` or `packages/*/CHANGELOG.md`.
- Conventional Commit scopes help reviewers understand intent, but path filters and PR checks are the enforcement layer.

## Recovery Notes

- If the extension publish fails after tagging, fix the issue, retag with a new extension version, and rerun the extension release flow.
- If npm package publish fails, fix the package or workflow issue, rerun validation, and retry from the next versioned commit on `master`.
