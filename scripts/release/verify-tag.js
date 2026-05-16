const { resolve } = require('path');

const product = process.argv[2];
const tag = process.argv[3];

if (product !== 'extension' || !tag) {
  console.error('Usage: node scripts/release/verify-tag.js extension <tag>');
  process.exit(1);
}

const packageJsonPath = resolve(__dirname, '../../package.json');
const packageVersion = require(packageJsonPath).version;
const stableTag = `extension-v${packageVersion}`;
const isTestTag = tag.endsWith('-test');
const baseTag = isTestTag ? tag.slice(0, -5) : tag;
const prereleasePrefix = `${stableTag}-`;
const isStableTag = baseTag === stableTag;
const isPrereleaseTag = baseTag.startsWith(prereleasePrefix) && baseTag.length > prereleasePrefix.length;

if (!isStableTag && !isPrereleaseTag) {
  console.error(`Invalid extension tag: ${tag}. Expected ${stableTag}, ${stableTag}-<prerelease>, or those forms with -test.`);
  process.exit(1);
}

process.stdout.write(
  JSON.stringify({
    product,
    tag,
    version: packageVersion,
    isPrerelease: isPrereleaseTag,
    isTest: isTestTag,
  }),
);
