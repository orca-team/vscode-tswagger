const { execFileSync } = require('child_process');
const { resolve } = require('path');

const product = process.argv[2];
const args = process.argv.slice(3);

const createTag = (tag, shouldCreate) => {
  if (shouldCreate) {
    execFileSync('git', ['tag', tag], { stdio: 'inherit' });
  }

  process.stdout.write(`${tag}\n`);
};

const shouldCreate = args.includes('--create');

if (product === 'npm') {
  const refIndex = args.indexOf('--ref');
  const ref = refIndex >= 0 ? args[refIndex + 1] : 'HEAD';
  const shortSha = execFileSync('git', ['rev-parse', '--short', ref], { encoding: 'utf8' }).trim();
  const tag = `npm-v${shortSha}`;

  createTag(tag, shouldCreate);
  process.exit(0);
}

if (product !== 'extension') {
  console.error('Usage: node scripts/release/create-tag.js <extension|npm> [--suffix <value>] [--ref <sha>] [--create]');
  process.exit(1);
}

const suffixIndex = args.indexOf('--suffix');
const suffix = suffixIndex >= 0 ? args[suffixIndex + 1] : '';
const packageJsonPath = resolve(__dirname, '../../package.json');
const packageVersion = require(packageJsonPath).version;
const tag = `extension-v${packageVersion}${suffix ? `-${suffix}` : ''}`;

createTag(tag, shouldCreate);
