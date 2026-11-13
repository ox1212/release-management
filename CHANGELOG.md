# Changelog

All notable changes to the release-management-plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0.html),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.1] - 2026-11-13

### Added
- **Core Architecture Detection**
  - Auto-detects monorepo vs. app-normal repositories
  - Supports: pnpm-workspace.yaml, lerna.json, nx.json, npm workspaces field
  - Scans apps/, packages/, services/, libs/, components/ directories

- **Multi-Channel Release Configuration**
  - `main`/`master` → stable releases (v1.2.3)
  - `alpha` → prerelease (v1.2.3-alpha.1)
  - `beta` → prerelease (v1.2.3-beta.1)

- **Semantic Release Pipeline**
  - `@semantic-release/commit-analyzer` – Conventional Commits parsing → version bump decision
  - `@semantic-release/release-notes-generator` – Changelog from commits
  - `@semantic-release/changelog` – Updates CHANGELOG.md
  - `@semantic-release/npm` – Package publishing (skippable for private repos)
  - `@semantic-release/git` – Commits with `[skip ci]` marker
  - `@semantic-release/github` – Creates GitHub Release

- **GitHub Actions Workflow Generator**
  - Node.js 20 LTS with pnpm caching
  - GITHUB_TOKEN write permissions
  - Triggers on main, alpha, beta branches
  - fetch-depth: 0 for full git history

- **Git Operations**
  - Atomic file injection for `.releaserc.json` and `.github/workflows/release.yml`
  - Optional commit and push via GitHub API
  - Dry-run mode for inspection

- **CLI Tool** (`release-management`)
  - Command-line interface for autonomous setup
  - Options: --dry-run, --commit, --private, --token, etc.

- **Programmatic API** (`setupReleaseManagement`)
  - JavaScript API for integration in DevOps agents
  - Full TypeScript-like documentation

### Security
- Uses `[skip ci]` marker in release commits to prevent infinite loops

## [Unreleased]

### Planned
- Matrix workflows for monorepo packages (release each package independently)
- Support for Lerna v7, Nx, Rush workspaces
- Configuration validation and linting
- Integration tests for actual GitHub repositories