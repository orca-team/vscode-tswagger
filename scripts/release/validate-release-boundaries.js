const changedFiles = (process.env.CHANGED_FILES || '')
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

const prTitle = process.env.PR_TITLE || '';
const prHeadRef = process.env.PR_HEAD_REF || '';
const npmVersionPrTitle = process.env.NPM_VERSION_PR_TITLE || 'chore: version npm packages';
const npmVersionPrBranch = process.env.NPM_VERSION_PR_BRANCH || 'changeset-release/master';
const extensionReleasePrTitlePrefix =
  process.env.EXTENSION_RELEASE_PR_TITLE_PREFIX || 'chore: release extension ';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const npmVersionPrTitlePattern = new RegExp(
  `^${escapeRegExp(npmVersionPrTitle)}(?: \\([^)]+\\))?$`
);
const isNpmVersionPr =
  prHeadRef === npmVersionPrBranch && npmVersionPrTitlePattern.test(prTitle);
const isExtensionReleasePr = prTitle.startsWith(extensionReleasePrTitlePrefix);

const isPublicPackageFile = (file) => /^packages\/(?:cli|core|types|mcp)\//.test(file);
const isChangesetFile = (file) => /^\.changeset\/(?!README\.md$).+\.md$/.test(file);
const isPackageReleaseArtifact = (file) =>
  /^packages\/(?:cli|core|types|mcp)\/(?:package\.json|CHANGELOG\.md)$/.test(file);

const publicPackageFiles = changedFiles.filter(isPublicPackageFile);
const changesetFiles = changedFiles.filter(isChangesetFile);
const packageReleaseArtifacts = changedFiles.filter(isPackageReleaseArtifact);

const errors = [];

if (publicPackageFiles.length > 0 && !isNpmVersionPr && changesetFiles.length === 0) {
  errors.push(
    [
      'Public npm package changes must include a changeset.',
      'Add a .changeset/*.md file unless this pull request is the npm version PR.',
      '',
      'Changed public package files:',
      ...publicPackageFiles.map((file) => `- ${file}`)
    ].join('\n')
  );
}

if (isExtensionReleasePr && packageReleaseArtifacts.length > 0) {
  errors.push(
    [
      'Extension Release PRs must not contain npm package release artifacts.',
      'Package-level versions and changelogs are managed only by Changesets.',
      '',
      'Unexpected files:',
      ...packageReleaseArtifacts.map((file) => `- ${file}`)
    ].join('\n')
  );
}

if (errors.length > 0) {
  console.error(errors.join('\n\n---\n\n'));
  process.exit(1);
}

console.log('Release boundary rules passed.');
