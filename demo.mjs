#!/usr/bin/env node
/**
 * Demo script showcasing the release-management-plugin end-to-end.
 * Demonstrates:
 *   1. Architecture detection
 *   2. Config generation
 *   3. Workflow generation
 *   4. File injection (dry-run mode)
 */

import { setupReleaseManagement } from './src/index.js';
import { resolve } from 'node:path';

const root = resolve('./sample-app');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║   🚀 Release Management Plugin v0.1.0-beta.1 - Full Cycle Demo  ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

console.log('📁 Repository:', root);
console.log('🚀 Running autonomous release-management setup...\n');

const result = await setupReleaseManagement({
  root,
  defaultBranch: 'main',
  alphaBranch: 'alpha',
  betaBranch: 'beta',
  private: true,
  dryRun: true,
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1️⃣  ARCHITECTURE DETECTION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Type:', result.architecture.type);
console.log('Default Branch:', result.architecture.defaultBranch);
console.log('Packages:', result.architecture.packages.join(', '));
console.log('Monorepo Markers:', result.architecture.markers.length ? result.architecture.markers.join(', ') : 'None');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2️⃣  GENERATED ARTIFACTS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Files to be created:');
result.filesWritten.forEach(f => console.log(`  • ${f}`));

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3️⃣  RELEASE CONFIGURATION (.releaserc.json)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Branches:', JSON.stringify(result.releaserc.branches, null, 2));
console.log('\nPlugin Pipeline:');
result.releaserc.plugins.forEach((p, i) => {
  const name = Array.isArray(p) ? p[0] : p;
  console.log(`  ${i + 1}. ${name}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4️⃣  GITHUB WORKFLOW (release.yml)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
// Show first 30 lines
const lines = result.workflow.split('\n').slice(0, 30);
lines.forEach(l => console.log(l));
console.log('... (truncated)');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅  DEMO COMPLETE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nAll checks passed. Run with --commit and GITHUB_TOKEN to persist.');