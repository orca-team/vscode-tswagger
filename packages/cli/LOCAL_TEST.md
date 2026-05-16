# `@tswagger/cli` 本地 Swagger 验证

本文档记录 `@tswagger/cli` 的本地验证方式，包括：

- 英文 Swagger 文档验证
- 中文 Swagger 文档验证
- 本地中文测试数据初始化
- Schema 调试日志开关

## 准备中文本地测试数据

在仓库根目录执行：

```bash
pnpm --filter @tswagger/cli run local-test:init
```

执行后会生成：

```text
packages/cli/local-test/swagger-cn.json
```

`packages/cli/local-test/` 已加入仓库根 `.gitignore`，可用于放置本地测试输入、输出和缓存文件。

## 英文 Swagger 验证

在仓库根目录执行：

```bash
pnpm --filter @tswagger/cli run build && node packages/cli/dist/bin.js --input https://petstore.swagger.io/v2/swagger.json --output packages/cli/local-test/out-en --mode all --no-translate
```

验证结果可在以下目录查看：

```text
packages/cli/local-test/out-en
```

## 中文 Swagger 验证

先初始化中文测试数据，再在仓库根目录执行：

```bash
pnpm --filter @tswagger/cli run local-test:init && pnpm --filter @tswagger/cli run build && node packages/cli/dist/bin.js --input packages/cli/local-test/swagger-cn.json --output packages/cli/local-test/out-cn --mode all --cache-dir packages/cli/local-test/cache
```

验证结果可在以下目录查看：

```text
packages/cli/local-test/out-cn
```

缓存文件可在以下路径查看：

```text
packages/cli/local-test/cache/translation-cache.json
```

## 默认缓存目录验证

如果希望顺手验证默认缓存目录 `.tswagger/cli`，可以去掉中文验证命令里的 `--cache-dir` 参数。

## Schema 调试日志

CLI 默认不会输出 `[JSONSchema Result]`。

如果需要排查 schema 转换问题，可以在执行命令时打开调试开关：

```bash
TSWAGGER_DEBUG_SCHEMA=1 pnpm --filter @tswagger/cli run build && TSWAGGER_DEBUG_SCHEMA=1 node packages/cli/dist/bin.js --input packages/cli/local-test/swagger-cn.json --output packages/cli/local-test/out-cn-debug --mode all --cache-dir packages/cli/local-test/cache-debug
```
