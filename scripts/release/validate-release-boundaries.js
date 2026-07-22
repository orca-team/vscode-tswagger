const changedFiles = (process.env.CHANGED_FILES || '')
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

const prTitle = process.env.PR_TITLE || '';
const npmVersionPrTitle = process.env.NPM_VERSION_PR_TITLE || 'chore: version npm packages';
const extensionReleasePrTitlePrefix =
  process.env.EXTENSION_RELEASE_PR_TITLE_PREFIX || 'chore: release extension ';

const isNpmVersionPr = prTitle === npmVersionPrTitle;
const isExtensionReleasePr = prTitle.startsWith(extensionReleasePrTitlePrefix);

const isPublicPackageFile = (file) => /^packages\/(?:cli|core|types)\//.test(file);
const isChangesetFile = (file) => /^\.changeset\/(?!README\.md$).+\.md$/.test(file);
const isPackageReleaseArtifact = (file) =>
  /^packages\/(?:cli|core|types)\/(?:package\.json|CHANGELOG\.md)$/.test(file);

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
