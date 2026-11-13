#!/usr/bin/env node
/**
 * release-management CLI
 * ======================
 * Command-line interface for autonomous release-management plugin.
 *
 * Usage:
 *   npx release-management --root /path/to/repo [options]
 *
 * Options:
 *   --default-branch <name>   Default branch name (default: auto-detect)
 *   --alpha <name>            Alpha pre-release branch (default: alpha)
 *   --beta <name>             Beta pre-release branch (default: beta)
 *   --private                 Skip npm publish step.
 *   --dry-run                 Show what would be done without writing files.
 *   --commit                  Commit generated files (requires GITHUB_TOKEN).
 *   --token <token>           GitHub API token for push operations.
 *   --remote <name>           Git remote name (default: origin)
 *   --help, -h                Show this help.
 */

import { setupReleaseManagement } from '../src/index.js';
import process from 'node:process';

function printUsageAndExit() {
  console.log(`
release-management CLI

Usage:
  npx release-management --root /path/to/repo [options]

Options:
  --default-branch <name>   Default branch name (default: auto-detect)
  --alpha <name>            Alpha pre-release branch (default: alpha)
  --beta <name>             Beta pre-release branch (default: beta)
  --private                 Skip npm publish step.
  --dry-run                 Show what would be done without writing files.
  --commit                  Commit generated files (requires GITHUB_TOKEN).
  --token <token>           GitHub API token for push operations.
  --remote <name>           Git remote name (default: origin)
  --help, -h                Show this help.

Examples:
  # Dry-run for inspection
  npx release-management --root . --dry-run

  # Full setup (writes files)
  npx release-management --root ./my-app

  # Full setup with commit (CI mode)
  GITHUB_TOKEN=ghp_xxx npx release-management --root . --commit
`);
  process.exit(0);
}

function parseArgs(args) {
  const opts = {
    root: undefined,
    defaultBranch: undefined,
    alphaBranch: 'alpha',
    betaBranch: 'beta',
    private: false,
    dryRun: false,
    commit: false,
    token: undefined,
    remote: 'origin',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsageAndExit();
        break;
      case '--root':
      case '-r':
        opts.root = args[++i];
        break;
      case '--default-branch':
      case '-d':
        opts.defaultBranch = args[++i];
        break;
      case '--alpha':
        opts.alphaBranch = args[++i];
        break;
      case '--beta':
        opts.betaBranch = args[++i];
        break;
      case '--private':
        opts.private = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--commit':
        opts.commit = true;
        break;
      case '--token':
      case '-t':
        opts.token = args[++i];
        break;
      case '--remote':
        opts.remote = args[++i];
        break;
      default:
        if (!opts.root) {
          opts.root = arg;
        }
    }
  }
  return opts;
}

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (!opts.root) {
    console.error('Error: --root is required');
    printUsageAndExit();
  }

  const root = opts.root.startsWith('/') || opts.root.startsWith('C:') ? opts.root : require('node:path').resolve(process.cwd(), opts.root);
  const token = opts.token || process.env.GITHUB_TOKEN;

  console.log(`Release Management Plugin starting...\nRepository: ${root}\n`);

  try {
    const result = await setupReleaseManagement({
      root,
      defaultBranch: opts.defaultBranch,
      alphaBranch: opts.alphaBranch,
      betaBranch: opts.betaBranch,
      private: opts.private,
      dryRun: opts.dryRun,
      commit: opts.commit,
      token,
      remote: opts.remote,
    });

    console.log('\n=== Detection ===');
    console.log(`Architecture: ${result.architecture.type}`);
    console.log(`Default branch: ${result.architecture.defaultBranch}`);
    if (result.architecture.markers.length) {
      console.log(`Monorepo markers: ${result.architecture.markers.join(', ')}`);
    }

    console.log('\n=== Generated Files ===');
    console.log(`  .releaserc.json   - Semantic-release configuration`);
    console.log(`  release.yml        - GitHub Actions workflow`);

    console.log('\n=== Files Written ===');
    result.filesWritten.forEach(f => console.log(`  ${f}`));

    if (result.dryRun) {
      console.log('\n[DRY RUN] No files were committed.');
    }

    console.log('\n✅ Release management setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();