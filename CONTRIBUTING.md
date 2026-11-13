# Contributing to Release Management Plugin

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/tu-org/release-management-plugin.git
cd release-management-plugin

# Install dependencies
npm install

# Run tests
npm test

# Run demo
npm run dev
```

## Available Scripts

- `npm test` - Run the test suite
- `npm run dev` - Run the demo script
- `npm start` - Run the CLI tool

## Release Process

This project uses semantic-release for automated versioning and publishing.

### For Plugin Maintainers

1. **Prepare release branch:**
   ```bash
   git checkout -b release/v1.0.0
   ```

2. **Create conventional commits:**
   ```bash
   git commit -m "feat: add new feature X"
   git commit -m "fix: resolve bug Y"
   git commit -m "docs: update README"
   ```

3. **Merge to main:**
   ```bash
   git checkout main
   git merge release/v1.0.0
   git push origin main
   ```

4. **Semantic-release will:**
   - Analyze commits
   - Bump version
   - Update CHANGELOG.md
   - Create GitHub Release
   - Publish to npm

### Testing Your Changes

```bash
# Test app-normal scenario
node demo.mjs  # Tests sample-app

# Test monorepo scenario  
node test-monorepo.mjs  # Tests sample-monorepo
```

## Version Channels

| Channel | Branch | Version Format |
|---------|--------|----------------|
| Stable | main | v1.2.3 |
| Beta | beta | v1.2.3-beta.1 |
| Alpha | alpha | v1.2.3-alpha.1 |

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Code Style

- Use ES modules (import/export)
- Follow conventional commits
- Use meaningful variable names
- Add JSDoc comments for public functions

## License

By contributing, you agree your contributions will be licensed under MIT.