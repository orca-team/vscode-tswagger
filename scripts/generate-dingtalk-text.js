const packageVersion = process.env.PACKAGE_VERSION || '';
const changes = process.env.CHANGELOG_CHANGES || '';

const text = `### TSwagger v${packageVersion} Published

**tswagger@${packageVersion}** has been published to the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=OrcaTeam.tswagger).

> **Note**: It might take a few minutes to appear on the marketplace.

---

**Changes in this release:**

${changes}`;

process.stdout.write(JSON.stringify(text));
