/**
 * .releaserc.json generator
 * ========================
 * Builds a semantic-release configuration document adapted to the detected
 * architecture and the requested version channels (alpha / beta / stable).
 *
 * Branch model:
 *   - `main` / `master`        -> stable releases (no prerelease)
 *   - `alpha`                 -> prerelease channel `alpha`
 *   - `beta`                  -> prerelease channel `beta`
 *
 * Each branch carries `"prerelease": <channel>` (or `true` for the alpha
 * shorthand) so semantic-release emits versions like `1.2.3-alpha.1`,
 * `1.2.3-beta.4` and promotes them onto the stable channel on merge.
 */

/**
 * Build the semantic-release branch configuration array.
 *
 * @param {{ defaultBranch: string, alphaBranch: string, betaBranch: string }} branches
 * @returns {object[]} branch objects for `.releaserc.json`.
 */
function buildBranches({ defaultBranch, alphaBranch, betaBranch }) {
  const branches = [];

  // Stable channel — main/master, no prerelease.
  branches.push({
    name: defaultBranch,
    channel: false,
    prerelease: false,
  });

  // Pre-release channels.
  branches.push({
    name: alphaBranch,
    channel: 'alpha',
    prerelease: 'alpha',
  });
  branches.push({
    name: betaBranch,
    channel: 'beta',
    prerelease: 'beta',
  });

  return branches;
}

/**
 * Build the semantic-release plugin pipeline.
 *
 * @param {{ private: boolean, isMonorepo: boolean }} options
 * @returns {object[]} plugin array.
 */
function buildPlugins({ isPrivate, isMonorepo }) {
  const plugins = [
    // 1. Analyzes Conventional Commits -> determines next version bump.
    ['@semantic-release/commit-analyzer', { releaseRules: [
      { type: 'feat', release: 'minor' },
      { type: 'fix', release: 'patch' },
      { type: 'perf', release: 'patch' },
      { type: 'revert', release: 'patch' },
      { type: 'docs', release: false },
      { type: 'style', release: false },
      { type: 'refactor', release: false },
      { type: 'test', release: false },
      { type: 'chore', release: false },
      { type: 'build', release: false },
      { type: 'ci', release: false },
      { breaking: true, release: 'major' },
    ] }],
    // 2. Generates release notes from commits.
    ['@semantic-release/release-notes-generator', {
      preset: 'angular',
      writerOpts: {
        // Emits the conventional-commits BREAKING CHANGE footer as a breaking
        // section so the analyzer can detect major bumps reliably.
        compareFull: true,
      },
    }],
    // 3. Updates CHANGELOG.md.
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      changelogTitle: '# Changelog\n\nAll notable changes to this project will be documented in this file.\n',
    }],
  ];

  // 4. npm — publish unless the app/library is private.
  if (!isPrivate) {
    plugins.push(['@semantic-release/npm', { npmPublish: true }]);
  } else {
    plugins.push(['@semantic-release/npm', { npmPublish: false }]);
  }

  // 5. git — commit package.json + CHANGELOG.md with a [skip ci] marker so the
  //    release commit itself does not trigger another workflow run.
  plugins.push(['@semantic-release/git', {
    assets: ['package.json', 'CHANGELOG.md'],
    message: 'chore(release): ${nextRelease.version} [skip ci]',
  }]);

  // 6. github — create the GitHub release + release notes.
  plugins.push(['@semantic-release/github', {
    assets: ['CHANGELOG.md'],
    addReleases: 'top',
  }]);

  return plugins;
}

/**
 * Build the full `.releaserc.json` document.
 *
 * @param {{ type: string, defaultBranch: string, packages: string[] }} architecture
 * @param {{ defaultBranch: string, alphaBranch: string, betaBranch: string,
 *           private: boolean, overrides?: object }} options
 * @returns {object} Parsed JSON document for `.releaserc.json`.
 */
export function buildReleaserc(architecture, options = {}) {
  const {
    defaultBranch,
    alphaBranch = 'alpha',
    betaBranch = 'beta',
    private: isPrivate = false,
    overrides = {},
  } = options;

  const branches = buildBranches({
    defaultBranch,
    alphaBranch,
    betaBranch,
  });

  const plugins = buildPlugins({
    isPrivate,
    isMonorepo: architecture.type === 'monorepo',
  });

  const config = {
    $schema: 'https://json.schemastore.org/releaserc',
    branches,
    plugins,
    // Multi-package repos release each package independently.
    ...(architecture.type === 'monorepo' ? { pkgRoot: '.' } : {}),
  };

  return { ...config, ...overrides };
}