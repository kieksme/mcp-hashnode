# Changelog

## [2.0.1](https://github.com/kieksme/mcp-hashnode/compare/hashnode-mcp-v2.0.0...hashnode-mcp-v2.0.1) (2026-10-30)


### Documentation

* trim 2.0.0 changelog to changes since mcp-hashnode-v1.2.0 ([#11](https://github.com/kieksme/mcp-hashnode/issues/11)) ([481cb01](https://github.com/kieksme/mcp-hashnode/commit/481cb01fbc9b413d1c181badc68aaa4ece2eb22a))


### Miscellaneous Chores

* **deps:** bump @kieksme/mcp-http-kit to 0.3.0 ([#14](https://github.com/kieksme/mcp-hashnode/issues/14)) ([14b8155](https://github.com/kieksme/mcp-hashnode/commit/14b815504c360a8e7e14c0e56b1200f2d77a2fab))

## [2.0.0](https://github.com/kieksme/mcp-hashnode/compare/mcp-hashnode-v1.2.0...hashnode-mcp-v2.0.0) (2026-10-21)


### ⚠ BREAKING CHANGES

* package is now @kieksme/hashnode-mcp (was @kieksme/mcp-hashnode). CLI binary is hashnode-mcp; mcp-hashnode remains as a compatibility alias. Requires Node >=22.14 and MCP TypeScript SDK v2. HTTP mode uses the shared kit (MCP_AUTH_TOKEN, PORT, Host/Origin allowlists, MCP_HTTP_HOST default 127.0.0.1). Legacy MCP_HTTP_AUTH_TOKEN / MCP_HTTP_PORT / HEALTH_ENDPOINT still work as deprecated aliases. HASHNODE_TOKEN is resolved per request (optional HASHNODE_CREDENTIAL_MODE=header + X-Hashnode-Token for multi-tenant HTTP).

### Features

* migrate to @kieksme/mcp-http-kit and rename to hashnode-mcp ([#9](https://github.com/kieksme/mcp-hashnode/issues/9)) ([6887c13](https://github.com/kieksme/mcp-hashnode/commit/6887c1343b178f32d3f98a7066478e16c696a09b))


### Documentation

* add trust badges to README ([995623a](https://github.com/kieksme/mcp-hashnode/commit/995623a5d370d5e47461fed5a7d5ef89a0478870))


### Continuous Integration

* allow manual release-please runs ([1ea62c4](https://github.com/kieksme/mcp-hashnode/commit/1ea62c49a9966baedeba7011bd00b5607ed4fa9c))

## [1.2.0](https://github.com/kieksme/mcp-hashnode/compare/mcp-hashnode-v1.1.1...mcp-hashnode-v1.2.0) (2026-09-14)


### Features

* **transport:** add remote MCP client configurations ([4b4c8d3](https://github.com/kieksme/mcp-hashnode/commit/4b4c8d318cbbd99ab4740537f4e003a09a0cabe9))


### Documentation

* add Pro plan requirement notice to README ([84424ff](https://github.com/kieksme/mcp-hashnode/commit/84424ff905dbb36f0cc976c5666f6ba1ac9357f6))

## [1.1.1](https://github.com/kieksme/mcp-hashnode/compare/mcp-hashnode-v1.1.0...mcp-hashnode-v1.1.1) (2026-06-26)


### Bug Fixes

* publish scoped npm package with --access public ([ff981dc](https://github.com/kieksme/mcp-hashnode/commit/ff981dce8e24c73248e72e825a4796239ecc7c51))
* return clear error when Hashnode API requires Pro plan ([9b126ea](https://github.com/kieksme/mcp-hashnode/commit/9b126ea9a988ad8b8c924db6c9edafb50cbb3b8f))


### Miscellaneous Chores

* ignore .pnpm-store ([108214e](https://github.com/kieksme/mcp-hashnode/commit/108214efa3ca0537c24f68eb2d0212721db1402d))

## [1.1.0](https://github.com/kieksme/mcp-hashnode/compare/mcp-hashnode-v1.0.0...mcp-hashnode-v1.1.0) (2026-06-26)


### Features

* initial release of hashnode-mcp-server v1.0.0 ([5944535](https://github.com/kieksme/mcp-hashnode/commit/594453533edb9c0f76aa70fc0bef64506b6690d4))


### Documentation

* add AGENTS.md with trunk-based development guidelines ([240ccdb](https://github.com/kieksme/mcp-hashnode/commit/240ccdbdb42d1e0887cfb08862df37ef953f6365))
* add MCP client setup instructions for Cursor, VS Code, and Windsurf ([dd14040](https://github.com/kieksme/mcp-hashnode/commit/dd140409501fac3b257cc37e0cbf9c8b7120d8be))
* add MCP client setup instructions for Cursor, VS Code, and Windsurf ([e937633](https://github.com/kieksme/mcp-hashnode/commit/e93763363f4fff0a1195f3a1882624a4d83b3ef9))
* add MCP client setup instructions for Cursor, VS Code, and Windsurf ([161f7d1](https://github.com/kieksme/mcp-hashnode/commit/161f7d1fc3ea2322094ecba4016041018eabb5b9))
* add npm/npx install instructions and release-please docs ([b22d07c](https://github.com/kieksme/mcp-hashnode/commit/b22d07ce06df1c48eb515fa4fd0d8dd6cb7abf2c))
* update clone URL after repo transfer to kieksme ([5e6c59d](https://github.com/kieksme/mcp-hashnode/commit/5e6c59dd9dc91cb8b18d76adf579a56a4205187c))


### Miscellaneous Chores

* add npm publish metadata (files, repository, keywords, license) ([620369d](https://github.com/kieksme/mcp-hashnode/commit/620369dd0b36c83ddcaf5e7bb98554af71340f5a))
* add package-lock.json for reproducible CI builds ([8a10429](https://github.com/kieksme/mcp-hashnode/commit/8a1042934a22641288940e9aa4c6f6ee1059c7cc))
* complete baseline validation ([1e9e8d7](https://github.com/kieksme/mcp-hashnode/commit/1e9e8d77e937dc11517b8e568f1230bf2a710f6a))
* **main:** release 1.0.0 ([e4b114e](https://github.com/kieksme/mcp-hashnode/commit/e4b114e4595da8f8bdd58c0ee95efa0a4b012e08))
* **main:** release 1.0.0 ([a7869a6](https://github.com/kieksme/mcp-hashnode/commit/a7869a6280ea8ba130065f1befe745d7c13bf6c8))
* migrate from npm to pnpm ([6c1b953](https://github.com/kieksme/mcp-hashnode/commit/6c1b953751ab4543b6945d972e80528874d6c8ce))
* rename package references ([2e4fbf7](https://github.com/kieksme/mcp-hashnode/commit/2e4fbf79fd253c729911c390164e71c60fb2b8e3))

## 1.0.0 (2026-06-26)


### Features

* initial release of @kieksme/mcp-hashnode v1.0.0 ([5944535](https://github.com/kieksme/mcp-hashnode/commit/594453533edb9c0f76aa70fc0bef64506b6690d4))
