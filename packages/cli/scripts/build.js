const { chmodSync, readFileSync, writeFileSync } = require('fs');

const SHEBANG = '#!/usr/bin/env node';
const BIN_FILE = 'dist/bin.js';

async function main() {
  const content = readFileSync(BIN_FILE, 'utf8');
  const normalized = content.startsWith(SHEBANG) ? content : `${SHEBANG}\n${content}`;

  writeFileSync(BIN_FILE, normalized);
  chmodSync(BIN_FILE, 0o755);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
