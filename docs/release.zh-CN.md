# 发布流程

这个仓库有两套发布系统：

- `tswagger` VS Code extension 发布线
- `@tswagger/cli`、`@tswagger/core`、`@tswagger/types` 的 npm 包发布线

## 什么时候需要写 Changeset

只要改动影响到了公开 npm 包，就需要在功能分支补一份 changeset。

如果只是 extension 独有改动，不需要写 changeset。

## Extension 发布

extension 继续使用根目录 `CHANGELOG.md` 和 `release-it`。

`release-it` 会负责：

- 更新 extension 版本号
- 消费根 `CHANGELOG.md` 的 `## [Unreleased]`
- 生成 release commit
- 创建 `extension-vX.Y.Z` tag

发布前必须先把内容写进根 `CHANGELOG.md` 的 `## [Unreleased]`，否则 `@release-it/keep-a-changelog` 会拒绝执行。

典型流程：

```bash
pnpm install
pnpm test
pnpm run release
git push origin master --follow-tags
```

如果只是验证 extension 测试流水线，可以手动创建测试 tag：

```bash
pnpm run release:tag:extension:test
git push origin --tags
```

不要在 `pnpm run release` 之后再手动补打一遍 stable tag，稳定版 tag 已经由 `release-it` 创建。

## npm 包发布

npm 包使用 Changesets。

包级别的 `CHANGELOG.md` 会在执行 `pnpm run release:npm:version` 时由 Changesets 自动更新。

npm 发布流水线使用 GitHub Actions OIDC 对接 npm trusted publishing，不再使用 `NPM_TOKEN`。

整体链路是：

1. 在功能分支开发。
2. 如果改动影响了 `@tswagger/cli`、`@tswagger/core` 或 `@tswagger/types`，就在该分支执行 `pnpm changeset`。
3. 发起 PR，npm 包测试流水线会先做 build、test、pack 检查。
4. 把功能 PR 合并到 `master`。
5. 专门的 workflow 会自动创建或更新一张由维护者确认的 version PR，标题为 `chore: version npm packages`。
6. 维护者 review 并合并这张 version PR。
7. `release-npm.yml` 在 version PR 合并后的那次 `master` push 上完成构建、测试、打包、发布，并创建 npm 发布批次专属 tag 与 GitHub Release。

也就是说，changeset 文件是在功能分支记录“发布意图”，版本号变更先经过一张单独的 version PR 审核，真正的 npm publish 则发生在这张 PR 合并之后。

### 功能分支阶段

```bash
pnpm install
pnpm changeset
pnpm --filter @tswagger/types run build
pnpm --filter @tswagger/core run build
pnpm --filter @tswagger/cli run build
git add .
git commit -m "feat: your change"
```

这里最重要的产物是 `.changeset/` 里的 changeset 文件，而不是版本号变更。

### Version PR 阶段

功能分支合并后，仓库会自动创建或更新 version PR。维护者主要需要确认：

- 版本 bump 是否符合这批 changeset 的预期
- 生成的包级 changelog 是否合理
- 被消费掉的 changeset 文件是否正确

version PR 的预期标题是：

```text
chore: version npm packages
```

### 手动兜底的版本化方式

如果自动 version PR workflow 需要临时绕过，维护者仍然可以在 `master` 上手动执行：

```bash
pnpm install
pnpm run release:npm:status
pnpm run release:npm:version
pnpm test
git add .
git commit -m "chore: version npm packages"
git push origin master
```

补充说明：

- `release:npm:status` 用来检查这批 changeset 最终会影响哪些公开 npm 包。
- `release:npm:version` 会消费 changeset，更新包版本号，并自动写入包级 changelog。
- 正常流程应以维护者确认过的 version PR 为准，而不是每次都手工在本地 version。
- 实际 npm publish 不是在开发者本机完成，而是由 version PR 合并后的 `master` 发布流水线执行。
- npmjs.com 上的 trusted publisher 需要准确绑定到 `release-npm.yml` 这个 workflow 文件名。
- npm 发布批次使用单独的仓库 tag 前缀：`npm-v<shortsha>`。
- npm 发布暂时不发送钉钉通知。
- 每次 npm 发布批次会创建一份独立的 GitHub Release，用来汇总这次发布的包和版本。

## 如何判断走哪条发布线

- 只改 extension：只走 extension 发布。
- 只改公开 npm 包：补 changeset，只走 npm 包发布。
- 同时影响两边：根 `CHANGELOG.md` 和 changeset 都要更新。

## npm 包改动的 Review 要点

Review npm 包改动时，至少确认：

- 公开 npm 包行为变化时，是否补了 changeset
- 相关包是否还能正常构建到 `dist`
- 相关包的 `pack:check` 是否通过
- README 和 changelog 是否仍然符合包的定位
- 如果当前 PR 是 version PR，还要额外确认版本号和自动生成的 changelog 是否符合预期

## 失败恢复

- extension 发布失败：修复问题后，用新版本重新走 extension 发布流程。
- npm 发布失败：修复包或流水线问题后，重新从下一个 version commit 继续发布。