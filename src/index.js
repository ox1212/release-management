/**
 * release-management-plugin — Public API
 * ======================================
 * Reusable CI/CD plugin for Release Management and Semantic Versioning.
 *
 * Designed to be consumed by any code agent (or directly via the CLI in
 * `bin/release-management.mjs`). Each public method is self-contained and
 * idempotent, so an agent can call it repeatedly across many repositories.
 *
 * Flow executed autonomously per repository:
 *   1. detectArchitecture(root)          -> { type: 'monorepo'|'app-normal', packages: [...] }
 *   2. buildReleaserc(arch, options)     -> .releaserc.json document
 *   3. buildWorkflow(arch, options)      -> .github/workflows/release.yml document
 *   4. injectIntoRepo(root, files, opts) -> writes files, commits, pushes via Git/GitHub API
 */

import { detectArchitecture } from './detector.js';
import { buildReleaserc } from './config-generator.js';
import { buildWorkflow } from './workflow-generator.js';
import { injectIntoRepo } from './git-ops.js';

export const ARCH_TYPES = Object.freeze({
  MONOREPO: 'monorepo',
  APP_NORMAL: 'app-normal',
});

export const BRANCH_ROLES = Object.freeze({
  STABLE: 'stable', // main / master
  ALPHA: 'alpha',
  BETA: 'beta',
});

/**
 * Run the full autonomous release-management setup for a repository.
 *
 * @param {object} options
 * @param {string} options.root              Absolute path to the repository root.
 * @param {string} [options.defaultBranch]   'main' | 'master' — overrides detection.
 * @param {string} [options.alphaBranch]     'alpha' — alpha pre-release channel.
 * @param {string} [options.betaBranch]      'beta'  — beta pre-release channel.
 * @param {boolean} [options.private=false]  Skip npm publishing.
 * @param {boolean} [options.dryRun=false]   Compute artifacts without writing to disk.
 * @param {boolean} [options.commit=false]   Commit + push generated files when true.
 * @param {string}  [options.token]          GitHub token (GITHUB_TOKEN) for push/API.
 * @param {string}  [options.remote]         'origin' remote name to push to.
 * @param {object}  [options.overrides]      Extra fields merged into .releaserc.json.
 * @returns {Promise<{architecture, releaserc, workflow, injected, filesWritten: string[]}>}
 */
export async function setupReleaseManagement(options = {}) {
  const {
    root,
    defaultBranch,
    alphaBranch = 'alpha',
    betaBranch = 'beta',
    private: isPrivate = false,
    dryRun = false,
    commit = false,
    token,
    remote = 'origin',
    overrides = {},
  } = options;

  if (!root) throw new Error('setupReleaseManagement: options.root is required');

  // 1. Architecture detection
  const architecture = await detectArchitecture(root, { defaultBranch });

  // 2 + 3. Generate configuration artifacts
  const releaserc = buildReleaserc(architecture, {
    defaultBranch: architecture.defaultBranch,
    alphaBranch,
    betaBranch,
    private: isPrivate,
    overrides,
  });
  const workflow = buildWorkflow(architecture, {
    defaultBranch: architecture.defaultBranch,
    alphaBranch,
    betaBranch,
    private: isPrivate,
  });

  // 4. Inject into the repository (write / commit / push)
  const injected = await injectIntoRepo(root, { releaserc, workflow }, {
    dryRun,
    commit,
    token,
    remote,
  });

  return {
    architecture,
    releaserc,
    workflow,
    injected,
    filesWritten: injected.filesWritten,
  };
}

// Re-export individual modules for agents that want granular control.
export { detectArchitecture } from './detector.js';
export { buildReleaserc } from './config-generator.js';
export { buildWorkflow } from './workflow-generator.js';
export { injectIntoRepo } from './git-ops.js';