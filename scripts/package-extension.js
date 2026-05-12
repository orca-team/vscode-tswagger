const { spawnSync } = require('node:child_process');

const args = ['package', '--no-dependencies'];

if (process.env.PRE_RELEASE === 'true') {
  args.push('--pre-release');
}

const result = spawnSync('vsce', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  console.error(result.error.message);
}

process.exit(1);
