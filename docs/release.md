# Release Workflow

This repository uses two release systems:

- the VS Code extension release line for `tswagger`
- the npm package release line for `@tswagger/cli`, `@tswagger/core`, and `@tswagger/types`

## When To Add A Changeset

Add a changeset for any change that affects one or more public npm packages.

Do not add a changeset for extension-only work that only affects the VS Code extension release line.

## Extension Release

Use the root `CHANGELOG.md` and the existing `release-it` flow for extension releases.

`release-it` is the source of truth for the extension version bump, changelog update, release commit, and the `extension-vX.Y.Z` tag.

Before running an extension release, add the release notes to the `## [Unreleased]` section in the root `CHANGELOG.md`. The `@release-it/keep-a-changelog` plugin will refuse to run if that section is empty.

Typical sequence:

```bash
pnpm install
pnpm test
pnpm run release
git push origin master --follow-tags
```

Use extension test tags manually when validating the extension release workflow without publishing:

```bash
pnpm run release:tag:extension:test
git push origin --tags
```

Do not create a second stable extension tag manually after `pnpm run release`. The stable extension tag is already created by `release-it`.

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
- For shared changes, do both: add a changeset for the npm packages and update the root `CHANGELOG.md` for the extension.

### Review Expectations For Npm Package Changes

When reviewing npm package work, check these points explicitly:

- a changeset exists when a public npm package behavior changes
- the touched package still builds to `dist`
- `pack:check` passes for the affected public package
- changelog and README intent still match the package role
- if the PR is the version PR, verify that the package bumps and generated changelog entries match the queued changesets

After the version PR merge commit lands on `master`, the npm release workflow builds, tests, packs, publishes changed npm packages, pushes the `npm-v<shortsha>` batch tag, and creates a GitHub Release summary for that publish batch.

## Choosing The Release Line

- Extension-only change: release only the extension.
- npm package-only change: add a changeset and release only the npm packages.
- Shared change that affects both: update the root changelog for the extension and add the needed changesets for the affected npm packages.

## Recovery Notes

- If the extension publish fails after tagging, fix the issue, retag with a new extension version, and rerun the extension release flow.
- If npm package publish fails, fix the package or workflow issue, rerun validation, and retry from the next versioned commit on `master`.