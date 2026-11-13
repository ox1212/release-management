# 🚀 Setup Guide for Release Management Plugin

## Prerequisites

```bash
# Node.js 18+ (recomendado Node.js 20 LTS)
node --version

# npm
npm --version
```

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/tu-org/release-management-plugin.git
cd release-management-plugin

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Run demo
npm run dev
```

## Publishing to npm

### First time setup

```bash
# Create npm organization (if not exists)
npm org create tu-org

# Login to npm
npm login
```

### Publish Beta Version

```bash
# Publish as beta tag (install with: npm install -g release-management-plugin@beta)
npm run publish-beta
```

### Publish Stable Version

```bash
# When ready for stable release
npm version major   # or minor or patch
npm run publish
```

## GitHub Integration

### Required Secrets

Add these secrets to your GitHub repo:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm authentication token (for publishing) |
| `GITHUB_TOKEN` | Used automatically by GitHub Actions |

### CI/CD Workflow

The plugin includes a ready-to-use GitHub Actions workflow in `.github/workflows/ci.yml` that:

1. Runs tests on every push
2. Creates beta releases on `beta` branch pushes
3. Creates stable releases on `main` branch pushes

## Usage in Other Projects

```bash
# Install beta version
npm install release-management-plugin@beta

# Or use via npx
npx release-management --root /path/to/repo --dry-run
```

## API Usage

```javascript
import { setupReleaseManagement } from 'release-management-plugin';

const result = await setupReleaseManagement({
  root: '/path/to/repo',
  defaultBranch: 'main',
  alphaBranch: 'alpha',
  betaBranch: 'beta',
  private: false,        // skip npm publish for private repos
  dryRun: true,          // set to false to write files
  commit: true,          // set to true to auto-commit
});
```

## Version Channels

| Channel | Branch | Install Command |
|---------|--------|-----------------|
| Beta | `beta` | `npm install release-management-plugin@beta` |
| Alpha | `alpha` | `npm install release-management-plugin@alpha` |
| Stable | `main` | `npm install release-management-plugin` |
| Next | `next` | `npm install release-management-plugin@next` |