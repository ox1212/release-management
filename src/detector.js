/**
 * Architecture detection — Monorepo vs. App Normal
 * =================================================
 * Scans the repository root and classifies it so the rest of the plugin can
 * adapt its configuration strategy.
 *
 * Detection rules (evaluated in order):
 *   1. Explicit workspace markers: pnpm-workspace.yaml, lerna.json, nx.json,
 *      rush.json, npm "workspaces" field in root package.json.
 *   2. Multiple package.json files under known package directories
 *      (apps/, packages/, services/, libs/, components/).
 *   3. Fallback: exactly one package.json at the root -> App Normal.
 */

import { promises as fs } from 'node:fs';
import { join, dirname, basename } from 'node:path';

/** Marker files that unambiguously signal a monorepo. */
const MONOREPO_MARKERS = [
  'pnpm-workspace.yaml',
  'pnpm-workspace.yml',
  'lerna.json',
  'nx.json',
  'rush.json',
  'beachball.config.js',
  'beachball.config.json',
  'changeset.config.js',
  'changeset.config.json',
];

/** Directories that, when present, are scanned for nested package.json files. */
const PACKAGE_DIRS = [
  'apps',
  'packages',
  'services',
  'libs',
  'libraries',
  'components',
  'modules',
  'plugins',
  'extensions',
];

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonSafe(path) {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Find all package.json files under specific directories.
 * Returns relative paths from root.
 */
async function findPackagesInDirs(root) {
  const found = [];

  for (const dir of PACKAGE_DIRS) {
    const dirPath = join(root, dir);
    if (await fileExists(dirPath)) {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pkgPath = join(dirPath, entry.name, 'package.json');
            if (await fileExists(pkgPath)) {
              found.push(join(dir, entry.name, 'package.json'));
            }
          }
        }
      } catch {
        // Directory not readable
      }
    }
  }
  return found;
}

// Helper to get unique values
function unique(arr) {
  return [...new Set(arr)];
}

/**
 * Detect the repository architecture.
 *
 * @param {string} root Absolute repository root path.
 * @param {{ defaultBranch?: string }} options
 * @returns {Promise<{ type: 'monorepo'|'app-normal', packages: string[],
 *          markers: string[], defaultBranch: string, packageDirs: string[] }>}
 */
export async function detectArchitecture(root, { defaultBranch } = {}) {
  const markers = [];
  let isMonorepo = false;

  // 1. Explicit workspace markers
  for (const marker of MONOREPO_MARKERS) {
    if (await fileExists(join(root, marker))) {
      markers.push(marker);
      isMonorepo = true;
    }
  }

  // 2. Root package.json "workspaces" field
  const rootPkgPath = join(root, 'package.json');
  const rootPkg = await readJsonSafe(rootPkgPath);
  if (rootPkg && Array.isArray(rootPkg.workspaces)) {
    isMonorepo = true;
    markers.push('package.json#workspaces');
  }

  // 3. Look for nested package.json files under known package directories
  const nestedPackages = await findPackagesInDirs(root);
  const packageDirs = unique(nestedPackages.map(p => dirname(p)));

  if (nestedPackages.length > 1) {
    isMonorepo = true;
    markers.push(`multiple-package.json (${nestedPackages.length})`);
  }

  // 4. Determine default branch
  let resolvedDefault = defaultBranch;
  if (!resolvedDefault) {
    // Heuristic: prefer main over master
    resolvedDefault = 'main';
  }

  const type = isMonorepo ? 'monorepo' : 'app-normal';

  return {
    type,
    packages: packageDirs.length > 0 ? packageDirs : (rootPkg ? ['.'] : []),
    markers,
    defaultBranch: resolvedDefault,
    packageDirs,
  };
}

export const ARCH_TYPES = Object.freeze({
  MONOREPO: 'monorepo',
  APP_NORMAL: 'app-normal',
});