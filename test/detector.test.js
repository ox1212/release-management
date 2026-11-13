import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { writeFile, rm } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { detectArchitecture } from '../src/detector.js';
import { buildReleaserc } from '../src/config-generator.js';
import { buildWorkflow } from '../src/workflow-generator.js';

describe('Architecture Detector', () => {
  it('should identify app-normal for a single package.json root', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'app-normal-'));
    await writeFile(join(tmpRoot, 'package.json'), JSON.stringify({ name: 'test-app', version: '0.0.1' }));
    const result = await detectArchitecture(tmpRoot);
    assert.strictEqual(result.type, 'app-normal');
    assert.ok(['main', 'master'].includes(result.defaultBranch));
    rm(tmpRoot, { recursive: true, force: true });
  });

  it('should identify monorepo with lerna.json', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'lerna-monorepo-'));
    await writeFile(join(tmpRoot, 'package.json'), JSON.stringify({ name: 'lerna-monorepo' }));
    await writeFile(join(tmpRoot, 'lerna.json'), JSON.stringify({ npmClient: 'pnpm' }));
    const result = await detectArchitecture(tmpRoot);
    assert.strictEqual(result.type, 'monorepo');
    assert.ok(result.markers.includes('lerna.json'));
    rm(tmpRoot, { recursive: true, force: true });
  });

  it('should identify monorepo with pnpm-workspace.yaml', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'pnpm-monorepo-'));
    await writeFile(join(tmpRoot, 'package.json'), JSON.stringify({ name: 'pnpm-monorepo', workspaces: ['packages/*'] }));
    await writeFile(join(tmpRoot, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n');
    const result = await detectArchitecture(tmpRoot);
    assert.strictEqual(result.type, 'monorepo');
    rm(tmpRoot, { recursive: true, force: true });
  });
});

describe('Config Generator', () => {
  it('should generate releaserc with branch channels', () => {
    const config = buildReleaserc({ type: 'app-normal', defaultBranch: 'main', packages: ['.'] }, {
      defaultBranch: 'main',
      alphaBranch: 'alpha',
      betaBranch: 'beta',
      private: false,
    });
    assert.ok(Array.isArray(config.branches));
    assert.ok(config.branches.find(b => b.name === 'main' && b.channel === false));
    assert.ok(config.branches.find(b => b.name === 'alpha' && b.prerelease === 'alpha'));
    assert.ok(config.branches.find(b => b.name === 'beta' && b.prerelease === 'beta'));
    assert.ok(Array.isArray(config.plugins));
  });

  it('should skip npm publish when private', () => {
    const config = buildReleaserc({ type: 'app-normal', defaultBranch: 'main', packages: ['.'] }, {
      defaultBranch: 'main',
      private: true,
    });
    const npmPlugin = config.plugins.find(p => Array.isArray(p) && p[0] === '@semantic-release/npm');
    assert.strictEqual(npmPlugin[1].npmPublish, false);
  });

  it('should include git plugin with skip ci message', () => {
    const config = buildReleaserc({ type: 'app-normal', defaultBranch: 'main', packages: ['.'] }, {});
    const gitPlugin = config.plugins.find(p => Array.isArray(p) && p[0] === '@semantic-release/git');
    assert.ok(gitPlugin);
    assert.ok(gitPlugin[1].message.includes('[skip ci]'));
  });
});

describe('Workflow Generator', () => {
  it('should generate valid YAML workflow', () => {
    const yaml = buildWorkflow({ type: 'app-normal', defaultBranch: 'main', packages: [] }, {
      defaultBranch: 'main',
      private: false,
    });
    assert.ok(yaml.includes('semantic-release'));
    assert.ok(yaml.includes('fetch-depth: 0'));
    assert.ok(yaml.includes('contents: write'));
  });

  it('should include all trigger branches', () => {
    const yaml = buildWorkflow({ type: 'app-normal', defaultBranch: 'main', packages: [] }, {
      defaultBranch: 'main',
      private: false,
    });
    assert.ok(yaml.includes("'main'"));
    assert.ok(yaml.includes("'alpha'"));
    assert.ok(yaml.includes("'beta'"));
  });

  it('should skip npm publish in private repos', () => {
    const yaml = buildWorkflow({ type: 'app-normal', defaultBranch: 'main', packages: [] }, {
      defaultBranch: 'main',
      private: true,
    });
    assert.ok(yaml.includes('npm-publish skipped (private repo)'));
  });
});

// Pure function tests - no child processes
describe('Module exports', () => {
  it('should export setupReleaseManagement as function', async () => {
    const { setupReleaseManagement } = await import('../src/index.js');
    assert.strictEqual(typeof setupReleaseManagement, 'function');
  });
});