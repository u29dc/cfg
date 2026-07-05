> `cfg` is a vanilla TypeScript/Bun library for compact runtime controls, settings, and frame diagnostics. It ships as an ESM package with static CSS, no runtime dependencies, and no framework runtime.

## 1. Documentation

- Product contract: [`PROMPT.md`](PROMPT.md)
- Human usage guide: [`DOCS.md`](DOCS.md)
- Architecture docs: [`docs/architecture.md`](docs/architecture.md), [`docs/performance.md`](docs/performance.md), [`docs/framework-adapters.md`](docs/framework-adapters.md)
- Package entry: [`src/index.ts`](src/index.ts)
- Demo entry: [`demo/src/main.ts`](demo/src/main.ts)
- [`README.md`](README.md) and [`CLAUDE.md`](CLAUDE.md) intentionally symlink to this file so the root agent contract has one canonical source.
- This file follows the align template from `/Users/han/Git/dot/agents/skills/align/references/templates/AGENTS.md`.

## 2. Repository Structure

```text
.
├── packages/     core engine and vanilla adapter workspaces
├── demo/         Vite showcase and benchmark mode
├── tests/        Bun unit tests and Playwright browser smoke tests
├── benchmarks/   performance notes and helpers
├── scripts/      build and local hook scripts
├── docs/         architecture, performance, comparisons, adapters
└── dist/         committed release package artifacts
```

- Keep the root package as the production `cfg` GitHub install target. `packages/core` owns the engine and `packages/vanilla` owns browser DOM rendering.
- Treat `.tmp/`, `artifacts/`, and `.clawpatch/` as local evidence only.
- Keep `dist/` committed on release tags so GitHub dependency installs do not need lifecycle builds.

## 3. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | TypeScript + Bun | Bun-first scripts, install, tests, and bundling |
| Library output | ESM + `.d.ts` + static CSS | `dist/index.js`, `dist/index.d.ts`, `dist/styles.css` |
| Demo | Vite HTML page | No app router or framework runtime |
| Tests | `bun test` + Playwright | Unit tests for core semantics; real-browser smoke for UI/canvas |
| Formatting | Biome | Extends the shared dot config |

## 4. Commands

- `bun install` - install dependencies and local hooks
- `bun run dev` - run the demo on `127.0.0.1`
- `bun run build:lib` - build the package artifacts
- `bun run build` - build library and demo
- `bun test` - run unit tests
- `bun run test:browser` - run Playwright browser smoke tests
- `bun run util:check` - run format, lint, typecheck, tests, and build

## 5. Architecture

- `packages/core/src/` owns framework-free types, math, settings, frame state, typed buffers, and profiler accounting.
- `packages/vanilla/src/` owns DOM panes, controls, canvas telemetry surfaces, and CSP-safe browser lifecycle.
- `packages/vanilla/src/styles/cfg.css` is the only default styling path. Do not inject `<style>` tags or inline style attributes for normal layout.
- Keep one-word filenames where possible and keep every source file below 1000 lines unless a structural exception is documented.

## 6. Runtime And State

- Imports must be SSR-safe: no `window`, `document`, DOM constructors, canvas contexts, or RAF access at module evaluation time.
- External scheduler mode is preferred. It must not create a hidden RAF loop.
- Internal scheduler mode is allowed only through explicit `cfg.start()`.
- Settings export/import uses stable internal IDs and excludes telemetry buffers by default.
- No localStorage/sessionStorage writes unless a host calls an explicit API that documents the behavior.

## 7. Conventions

- Prefer direct typed modules over broad abstractions or plugin infrastructure.
- Keep control-lane DOM updates event-driven and targeted.
- Keep telemetry sample paths allocation-conscious and canvas-backed.
- Use `cfg-` class and data-attribute prefixes for all library-owned DOM.
- Validate public values before they reach DOM text, class names, CSS variables, canvas drawing, or bound objects.

## 8. Constraints

- No React, Vue, Svelte, Next, Astro component, or plugin-marketplace dependency in `v1.0`.
- No runtime dependencies without documenting the reason in [`docs/architecture.md`](docs/architecture.md).
- No `eval`, `new Function`, runtime CSS injection, inline style attributes for normal styling, external font CDN, or telemetry network calls.
- Do not mutate `/Users/han/Git/_www_template` except for an explicitly temporary dry-run integration; commit nothing there.
- Treat GitHub release tags, CI config, package exports, CSP behavior, and downstream install checks as high-risk surfaces.

## 9. Validation

- Required local gate before completion: `bun run util:check`.
- Required browser gate after UI changes: `bun run build`, `bun run test:browser`, then manual browser QA with screenshots under `artifacts/browser-qa/`.
- Required release gate: clean temporary install from the current GitHub release tag and import check for `createCfg` plus `cfg/styles.css`.
- Required downstream gate: `_www_template` integration dry run from a clean temporary path or carefully reverted local edits.
