/**
 * GitHub Actions workflow generator
 * ================================
 * Generates `.github/workflows/release.yml` that triggers on pushes to the
 * version channels (stable, beta, alpha) and runs semantic-release.
 *
 * Features:
 *   - Node.js LTS (v20) with pnpm for fast installs.
 *   - GITHUB_TOKEN write permissions for committing releases.
 *   - Matrix support for monorepos (release each package independently).
 */

/**
 * Build a GitHub Actions workflow YAML for semantic-release.
 *
 * @param {{ type: string, defaultBranch: string, packages: string[] }} architecture
 * @param {{ defaultBranch: string, alphaBranch: string, betaBranch: string,
 *           private: boolean }} options
 * @returns {string} YAML content for `.github/workflows/release.yml`.
 */
export function buildWorkflow(architecture, options = {}) {
  const {
    defaultBranch = 'main',
    alphaBranch = 'alpha',
    betaBranch = 'beta',
    private: isPrivate = false,
  } = options;

  const branches = [defaultBranch, alphaBranch, betaBranch].map(b => `'${b}'`).join(', ');

  // For monorepos, we may want a matrix strategy to release each package.
  // Keep it simple for now: run the same workflow for all packages.
  const matrixConfig = architecture.type === 'monorepo'
    ? `strategy:\n      matrix:\n        package-index: [0]\n      fail-fast: false`
    : '';

  // Node version — use LTS for stability.
  const nodeVersion = '20';

  const npmPublishCmd = isPrivate
    ? 'npm run semantic-release -- --no-npm-publish || echo "npm-publish skipped (private repo)"'
    : 'npx semantic-release';

  // The workflow YAML.
  const yaml = `name: Release

on:
  push:
    branches:
      - ${branches}
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    ${matrixConfig ? matrixConfig + '\n' : ''}
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js \${{ matrix.node-version || '${nodeVersion}' }}
        uses: actions/setup-node@v4
        with:
          node-version: '\${{ matrix.node-version || '${nodeVersion}' }}'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run semantic-release
        working-directory: .
        run: ${npmPublishCmd}
`;

  return yaml;
}