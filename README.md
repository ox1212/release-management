# 🚀 Release Management Plugin

[![npm version](https://badge.fury.io/js/release-management-plugin.svg)](https://badge.fury.io/js/release-management-plugin)
[![CI Status](https://github.com/tu-org/release-management-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-org/release-management-plugin/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![semantic-release](https://img.shields.io/badge/%20%20%F%F0%F%F--release-rose1.svg)](https://github.com/semantic-release/semantic-release)

Plugin reutilizable para **Release Management** y **Semantic Versioning** en repositorios Node.js. Funciona tanto para apps simples como para monorepos complejos con múltiples paquetes.

## ✨ Características

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Architecture Detection** | Detecta automáticamente monorepo vs app-normal | ✅ |
| **Multi-Channel Releases** | Soporta ramas stable, alpha y beta | ✅ |
| **Conventional Commits** | Parsea `feat:`, `fix:`, `BREAKING CHANGE:` | ✅ |
| **Auto-Changelog** | Genera CHANGELOG.md automáticamente | ✅ |
| **GitHub Releases** | Crea releases en GitHub con notas | ✅ |
| **Private Repos** | Omitir npm publish si el repo es privado | ✅ |
| **CLI Tool** | Uso desde terminal o scripts | ✅ |
| **API Reutilizable** | Integración en agentes de código | ✅ |

---

## 📦 Stack Técnico

```yaml
Runtime:
  Node.js: ^18.0.0 || >=20.0.0 LTS
  Package Manager: npm (v7+) o pnpm
  
Core Dependencies:
  semantic-release: ^21.0.0        # Release automation
  @semantic-release/commit-analyzer: ^11.0.0   # Conventional commits parser
  @semantic-release/release-notes-generator: ^12.0.0  # Generador de release notes
  @semantic-release/changelog: ^6.0.0         # Actualiza CHANGELOG.md
  @semantic-release/npm: ^12.0.0           # Publica a npm (opcional)
  @semantic-release/git: ^10.0.0          # Commit automática package.json
  @semantic-release/github: ^10.0.0         # Crea GitHub Release
  
Generated Workflows:
  actions/checkout@v4             # Checkout con fetch-depth: 0
  actions/setup-node@v4            # Node.js 20 LTS
  pnpm/action-setup@v4            # Instalación rápida
  
Testing:
  Node.js Test Runner            # Tests nativos sin dependencias externas
```

---

## 🛠️ Instalación

### Opción A: NPM (Recomendado)

```bash
# Desde cualquier directorio
npx release-management --root /ruta/a/tu/repo --dry-run

# Instalar globalmente
npm install -g release-management-plugin
release-management --root ./mi-app
```

### Opción B: Local en tu proyecto

```bash
cd tu-proyecto
npm install release-management-plugin
```

Luego usarlo en JavaScript:

```javascript
import { setupReleaseManagement } from 'release-management-plugin';

const result = await setupReleaseManagement({
  root: '.',
  defaultBranch: 'main',
});
```

### Opción C: Desde fuente (desarrollo)

```bash
git clone https://github.com/tu-org/release-management-plugin.git
cd release-management-plugin
npm install
npm run dev  # Ejecuta demo completo
```

---

## 🚀 Uso Rápido

### 1. Analizar repositorio existente

```bash
# Dry-run (solo muestra qué haría)
npx release-management --root . --dry-run

# Salida esperada:
# 🔍 Repository: /path/to/app
# Architecture: app-normal
# Files to create: .releaserc.json, .github/workflows/release.yml
```

### 2. Configurar release management

```bash
# Crear archivos de configuración
npx release-management --root ./mi-repo

# Con commit automático (requiere GITHUB_TOKEN)
GITHUB_TOKEN=tu_token_npm npx release-management --root . --commit
```

### 3. Crear primer release

```bash
# 1. Hacer cambios convencionales
git add .
git commit -m "feat: add user authentication"

# 2. Push a main
git push origin main

# 3. El workflow en GitHub ejecutará semantic-release automáticamente
#    y creará la versión v1.0.0
```

---

## ⚙️ Configuración de Canales

### Modelo de ramas

| Rama | Canal | Versión generada | Trigger |
|------|-------|-----------------|---------|
| `main` / `master` | stable | `1.2.3` | push/PR |
| `alpha` | alpha | `1.3.0-alpha.1` | push/PR |
| `beta` | beta | `1.3.0-beta.1` | push/PR |

### Comportamiento por tipo de commit

| Commit type | bump type | Ejemplo |
|-------------|-----------|---------|
| `feat:` | minor | `1.2.0 → 1.3.0` |
| `fix:` | patch | `1.3.0 → 1.3.1` |
| `perf:` | patch | `1.3.0 → 1.3.1` |
| `BREAKING CHANGE:` | major | `1.3.0 → 2.0.0` |
| `docs:`, `chore:` | no release | sin cambio |

---

## 🔄 Monorepos

### Detección automática

El plugin detecta automáticamente si tu repositorio es un monorepo basándose en:

- `pnpm-workspace.yaml`
- `lerna.json`
- `nx.json`
- Campo `workspaces` en `package.json`
- Múltiples `package.json` en `apps/`, `packages/`, `services/`, `libs/`

### Ejemplo de estructura monorepo

```
my-monorepo/
├── package.json              # Root with workspaces
├── pnpm-workspace.yaml       # (detectado como monorepo)
└── packages/
    ├── api-server/
    │   └── package.json      # { name: "@org/api", version: "1.0.0" }
    ├── web-ui/               # { name: "@org/web", version: "1.0.0" }
    └── shared-lib/           # { name: "@org/shared", version: "1.0.0" }
```

---

## 📝 Especificaciones Técnicas

### `.releaserc.json` generado

```json
{
  "$schema": "https://json.schemastore.org/releaserc",
  "branches": [
    { "name": "main", "channel": false, "prerelease": false },
    { "name": "alpha", "channel": "alpha", "prerelease": "alpha" },
    { "name": "beta", "channel": "beta", "prerelease": "beta" }
  ],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "releaseRules": [
        { "type": "feat", "release": "minor" },
        { "type": "fix", "release": "patch" },
        { "type": "perf", "release": "patch" },
        { "breaking": true, "release": "major" }
      ]
    }],
    ["@semantic-release/release-notes-generator", { "preset": "angular" }],
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md"
    }],
    ["@semantic-release/npm", { "npmPublish": false }],
    ["@semantic-release/git", {
      "assets": ["package.json", "CHANGELOG.md"],
      "message": "chore(release): ${nextRelease.version} [skip ci]"
    }],
    ["@semantic-release/github", {
      "assets": ["CHANGELOG.md"]
    }]
  ]
}
```

### `.github/workflows/release.yml` generado

```yaml
name: Release

on:
  push:
    branches: ['main', 'alpha', 'beta']
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: npx semantic-release
```

---

## 🔧 Opciones de Configuración

### Uso con Node.js API

```typescript
interface ReleaseOptions {
  root: string;                 // Path absoluto al repositorio (REQUERIDO)
  defaultBranch?: string;      // 'main' (default) o 'master'
  alphaBranch?: string;        // 'alpha' (default)
  betaBranch?: string;         // 'beta' (default)
  private?: boolean;           // Skip npm publish (default: false)
  dryRun?: boolean;            // Solo mostrar sin escribir (default: false)
  commit?: boolean;            // Auto-commit changes (default: false)
  token?: string;              // GitHub token (default: process.env.GITHUB_TOKEN)
  remote?: string;             // Remote git name (default: 'origin')
  overrides?: object;          // Campos extra para mergear en .releaserc.json
}
```

### Ejemplo avanzado con overrides

```javascript
import { setupReleaseManagement } from './src/index.js';

const result = await setupReleaseManagement({
  root: '/proyectos/mi-app',
  defaultBranch: 'develop',
  alphaBranch: 'dev',
  betaBranch: 'staging',
  private: true,
  overrides: {
    // Agregar plugin personalizado
    plugins: [
      ...basePlugins,
      ['@semantic-release/exec', {
        prepareCmd: 'echo VERSION=${nextRelease.version}'
      }]
    ]
  }
});

console.log('Architecture:', result.architecture.type);
console.log('Branches configured:', result.releaserc.branches.length);
```

---

## 📊 Casos de Uso

### Caso 1: App simple (no monorepo)

```bash
# Estructura típica
├── package.json
├── src/
└── test/

# Comando
npx release-management --root ./mi-app
```

### Caso 2: Monorepo con pnpm workspaces

```bash
# Estructura típica
├── package.json
├── pnpm-workspace.yaml
└── packages/
    ├── pkg-a/package.json
    ├── pkg-b/package.json
    └── pkg-c/package.json

# Comando
npx release-management --root ./monorepo
# → Detecta automáticamente como monorepo
# → Configura workspace detection
```

### Caso 3: Repo privado (sin publishing)

```bash
npx release-management --root ./internal-lib --private

# Resultado:
# • Se omite @semantic-release/npm
# • No se intenta publicar a npm
# • Aún se generan changelog y releases de GitHub
```

### Caso 4: Agentes automatizados (DevOps/IA)

```javascript
// En un agente de DevOps
async function configureRepo(repoPath) {
  const result = await setupReleaseManagement({
    root: repoPath,
    dryRun: false,
    commit: true,
    token: process.env.GITHUB_TOKEN,
  });
  
  return {
    success: result.filesWritten.length > 0,
    architecture: result.architecture.type,
    files: result.filesWritten,
  };
}
```

---

## 🐛 Troubleshooting

### Problema: Errores de permisos Git

```
Error: spawn EPERM
```
**Solución**: Asegúrate de que el token tiene permisos de escritura:
```bash
# Verificar token
gh auth status

# O configurar variables de entorno
export GITHUB_TOKEN="tu-token-con-permisos"
```

### Problema: Semantic-release no detecta commits

**Causa común**: Los commits no siguen el formato convencional.

**Formato requerido**:
```
type(scope?): description
tipo(ámbito?): descripción

[Ejemplos válidos]
- feat(auth): add JWT validation
- fix(api): handle null responses
- BREAKING CHANGE: remove old endpoints
```

### Problema: Conflictos de ramas

Si tienes muchas ramas, asegúrate de que solo las configuradas (`main`, `alpha`, `beta`) tengan el workflow activado.

---

## 🤝 Contribuir

Vemos contribuciones de dos formas:

### Reportar bugs
```bash
gh issue create --title "Bug: error message" --body "..."
```

### Enviar PRs
```bash
# 1. Fork + branch
git checkout -b feat/add-nuevo-pluggin

# 2. Desarrollar + testear
npm test
node demo.mjs

# 3. Commit con conventional format
git commit -m "feat(plugin): add new plugin support"

# 4. Push + PR
git push origin feat/add-nuevo-pluggin
gh pr create --title "feat: add nuevo plugin support"
```

---

## 📄 Licencia

MIT License — permite uso comercial, modificación y distribución.

---

## 🙏 Agradecimientos

Este plugin se basa en:
- [semantic-release](https://github.com/semantic-release/semantic-release) — Automatización de releases
- [conventionalcommits.org](https://conventionalcommits.org/) — Standard para mensajes de commit
- [GitHub Actions](https://github.com/features/actions) — CI/CD platform

---

**¿Listo para empezar?** → [Ver documentación completa](./README.md) | [Issues](https://github.com/tu-org/release-management-plugin/issues) | [Releases](https://github.com/tu-org/release-management-plugin/releases)