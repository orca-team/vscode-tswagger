const { build } = require('esbuild');

async function main() {
  await build({
    entryPoints: ['src/bin.ts'],
    bundle: true,
    outfile: 'dist/bin.js',
    format: 'cjs',
    platform: 'node',
    banner: {
      js: '#!/usr/bin/env node',
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});