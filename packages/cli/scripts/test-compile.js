const glob = require('glob');
const { build } = require('esbuild');

async function main() {
  const entryPoints = glob.sync('src/**/*.ts', {
    nodir: true,
  });

  await build({
    entryPoints,
    bundle: true,
    outbase: 'src',
    outdir: 'out-test',
    format: 'cjs',
    platform: 'node',
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});