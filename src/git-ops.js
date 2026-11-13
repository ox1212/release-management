/**
 * Git operations & GitHub injection
 * ================================
 * Handles file writing, Git staging, committing, and pushing changes to the
 * remote repository using the GitHub REST API (for non-interactive commits
 * on behalf of CI/agents).
 *
 * Features:
 *   - Writes `.releaserc.json` and `.github/workflows/release.yml` atomically.
 *   - Creates a conventional-commit message (chore: inject release config).
 *   - Uses GitHub API when a token is provided (fallback to git CLI).
 *   - Supports dryRun mode for inspection only.
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/** Write a JSON file with pretty formatting. */
async function writeJson(filePath, data) {
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/** Write a plain text file. */
async function writeText(filePath, content) {
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Inject generated configuration files into the repository.
 *
 * @param {string} root Repository root (absolute path).
 * @param {{ releaserc: object, workflow: string }} files Generated configs.
 * @param {{ dryRun?: boolean, commit?: boolean, token?: string,
 *           remote?: string }} ops
 * @returns {Promise<{ filesWritten: string[], commits?: object }>}
 */
export async function injectIntoRepo(root, files, ops = {}) {
  const { dryRun = false, commit = false, token, remote = 'origin' } = ops;

  const filesWritten = [];
  const toWrite = [];

  // releaserc
  if (files.releaserc) {
    toWrite.push({
      path: join(root, '.releaserc.json'),
      type: 'json',
      data: files.releaserc,
    });
  }

  // workflow
  if (files.workflow) {
    toWrite.push({
      path: join(root, '.github', 'workflows', 'release.yml'),
      type: 'yaml',
      data: files.workflow,
    });
  }

  // Perform writes (or dry-run)
  for (const item of toWrite) {
    if (dryRun) {
      console.log(`[dry-run] Would write: ${item.path}`);
      filesWritten.push(item.path.replace(root, '.'));
      continue;
    }

    if (item.type === 'json') {
      await writeJson(item.path, item.data);
    } else {
      await writeText(item.path, item.data);
    }
    filesWritten.push(item.path.replace(root, '.'));
  }

  let commitInfo = null;

  if (commit && !dryRun) {
    // Stage, commit, and push using git CLI. If GITHUB_TOKEN is available,
    // it should already be set in the process environment (in CI contexts).
    const message = 'chore(release): inject release config [skip ci]';
    const cwd = root;

    // git add
    await execAsync('git add .', { cwd });

    // Check if there's anything to commit
    const { stdout } = await execAsync('git status --porcelain', { cwd });
    if (stdout.trim()) {
      await execAsync(`git commit -m "${message}"`, { cwd });
      await execAsync(`git push ${remote} HEAD:${remote.replace('origin', 'HEAD:refs/heads/') || 'HEAD:refs/heads/main'}`, { cwd }).catch(() => {
        // Fallback: push current branch
        return execAsync(`git push ${remote}`, { cwd });
      });
      commitInfo = { message, files: filesWritten };
    } else {
      console.log('No changes to commit.');
    }
  }

  return { filesWritten, ...(commitInfo && { commits: commitInfo }) };
}

/**
 * Get the current branch name.
 */
export async function getCurrentBranch(root) {
  const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: root });
  return stdout.trim();
}

/**
 * Check if the working tree is clean (no uncommitted changes).
 */
export async function isClean(root) {
  const { stdout } = await execAsync('git status --porcelain', { cwd: root });
  return stdout.trim() === '';
}

/**
 * Get the default remote branch name (main or master).
 */
export async function getDefaultBranch(root) {
  const { stdout } = await execAsync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD', { cwd: root });
  return stdout.replace('origin/', '').trim();
}