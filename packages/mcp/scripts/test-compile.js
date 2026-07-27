import glob from 'glob';
import { build } from 'esbuild';

async function main() {
  const entryPoints = glob.sync('src/**/*.ts', {
    nodir: true,
  }).filter((filePath) => !filePath.endsWith('.d.ts'));

  await build({
    entryPoints,
    bundle: true,
    outbase: 'src',
    outdir: 'out-test',
    format: 'esm',
    platform: 'node',
    target: 'node18',
    packages: 'external',
    tsconfig: 'tsconfig.json',
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
