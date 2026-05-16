const releaseKind = process.env.RELEASE_KIND || 'extension';

const createExtensionText = () => {
  const packageVersion = process.env.PACKAGE_VERSION || '';
  const changes = process.env.CHANGELOG_CHANGES || '';
  const vscodePublishStatus = process.env.VSCODE_PUBLISH_STATUS || 'success';
  const openvsxPublishStatus = process.env.OPENVSX_PUBLISH_STATUS || 'unknown';

  const marketplaceStatuses = [
    {
      label: 'VS Code Marketplace',
      url: 'https://marketplace.visualstudio.com/items?itemName=OrcaTeam.tswagger',
      status: vscodePublishStatus,
    },
    {
      label: 'OpenVSX',
      url: 'https://open-vsx.org/extension/OrcaTeam/tswagger',
      status: openvsxPublishStatus,
    },
  ];

  const publishedMarketplaces = marketplaceStatuses.filter(({ status }) => status === 'success');
  const unpublishedMarketplaces = marketplaceStatuses.filter(({ status }) => status !== 'success' && status !== 'unknown');

  const publishedText = publishedMarketplaces.length
    ? `**Published in this run:**\n\n${publishedMarketplaces.map(({ label, url }) => `- [${label}](${url})`).join('\n')}`
    : '';

  const unpublishedText = unpublishedMarketplaces.length
    ? `**Not published in this run:**\n\n${unpublishedMarketplaces.map(({ label }) => `- ${label}`).join('\n')}`
    : '';

  return `### TSwagger Extension v${packageVersion} Release Completed

${[publishedText, unpublishedText].filter(Boolean).join('\n\n')}

> **Note**: It might take a few minutes to appear on the marketplaces.

---

**Changes in this release:**

${changes}`;
};

const createNpmText = () => {
  const publishedPackages = (process.env.PUBLISHED_PACKAGES || '').trim();
  const npmPublishStatus = process.env.NPM_PUBLISH_STATUS || 'success';
  const publishedText = publishedPackages || '- No published packages reported';

  return `### TSwagger Npm Publish Completed

**Status:** ${npmPublishStatus}

**Packages in this run:**

${publishedText}`;
};

const text = releaseKind === 'npm' ? createNpmText() : createExtensionText();

process.stdout.write(JSON.stringify(text));
