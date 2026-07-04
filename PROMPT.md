# Build `cfg`

You are building a new standalone TypeScript library named `cfg`.

`cfg` is a compact, extremely high-performance runtime controls and diagnostics pane for animation-heavy websites, canvas/WebGL work, creative interfaces, and custom requestAnimationFrame runtimes.

The library is inspired by the utility and visual density of Tweakpane, the schema/store ideas of Leva, the simplicity of lil-gui/dat.GUI, and the profiling surface of small Tweakpane plugins. It must not copy source code, CSS, or branded implementation details from those libraries. Treat them as research references for product shape, API tradeoffs, and failure modes. If you intentionally use or derive any MIT-licensed source, preserve license notices and explicitly document the derivative path. The preferred path is clean-room implementation.

The reason this exists: an Astro website template currently uses Tweakpane for local/staging controls. Tweakpane is tasteful and useful, but its monitor model and plugin ecosystem are not ideal for first-class high-frequency frame diagnostics. `cfg` should be purpose-built for strict runtime control, frame-budget awareness, profiler surfaces, and external RAF-loop integration.

## Operating Standard

Before implementing, read and apply the project baseline from:

```text
/Users/han/Git/dot/agents/skills/align/SKILL.md
```

Also read and apply the thermo-nuclear code-quality review standard:

```text
https://raw.githubusercontent.com/cursor/plugins/refs/heads/main/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md
```

This is a maintainability gate for the whole build: keep files under 1000 lines
unless there is a compelling structural reason, decompose large changes into
clear modules, avoid spaghetti conditionals, avoid thin abstractions, and prefer
structural simplification over merely working code.

Also read and apply these frontend/design-engineering standards before any
styling, layout, interaction, or browser-QA work:

```text
https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-best-practices/SKILL.md
https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-best-practices/AGENTS.md
https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md
```

Use the `$align` skill if it is available. If the skill is not available as a callable tool, manually apply `/Users/han/Git/dot/agents/skills/align/SKILL.md`.

Apply the default TypeScript/library/package baseline. Do not choose Svelte, Next, Go, or Astro website variants. The target is a small library repository, not a website template.

Prefer a single core package for `v1.0`. If Bun workspaces are used, they must serve a concrete package-boundary reason and must not turn the project into a heavy monorepo. Future framework adapters should be architecturally planned, not implemented prematurely.

Apply the align standards for package ordering, `util:*` scripts, strict TypeScript, hooks, commitlint, lint-staged, gitignore, and concise repo-level agent documentation. The new repository's `AGENTS.md` must trace back to the align template while staying specific to `cfg`.

Run alignment checks again before final QA. Report any intentional deviations from the align contract with the reason.

Also use Bun's official docs index to discover the relevant current Bun documentation before choosing tooling details:

```text
https://bun.com/docs/llms.txt
```

At minimum, consult the relevant official Bun pages for:

- workspaces;
- package install and Git dependencies;
- GitHub Actions / CI installation;
- Vite integration;
- Bun test runner;
- TypeScript/runtime types;
- bundler/CSS handling if using Bun's bundler.

Prefer official Bun docs over stale blog posts or assumptions.

## Ecosystem References

Before finalizing the `cfg` architecture, study the relevant existing control-pane ecosystem. Use these as references for API shape, state import/export, visual density, component categories, profiling ideas, first-party component decisions, and failure modes.

Do not copy source code, CSS, branding, or exact implementation details unless intentionally taking and documenting an MIT-derived path.

Primary references:

- Tweakpane state/import/export: `https://tweakpane.github.io/docs/misc/#state`
- Leva: `https://github.com/pmndrs/leva`
- dat.GUI: `https://github.com/dataarts/dat.gui`
- lil-gui: `https://github.com/georgealways/lil-gui`
- Tweakpane: `https://github.com/cocopon/tweakpane`
- Tweakpane Essentials: `https://github.com/tweakpane/plugin-essentials`
- Tweakpane Profiler: `https://github.com/0b5vr/tweakpane-plugin-profiler`
- Tweakpane Chromatic: `https://github.com/brunoimbrizi/tweakpane-plugin-chromatic`
- Tweakpane Color Plus: `https://github.com/kitschpatrol/tweakpane-plugin-color-plus`

When reviewing these references, explicitly extract:

- what to borrow conceptually;
- what to avoid;
- what is too old, heavy, framework-specific, or incompatible with `cfg`;
- what `cfg` should do differently for performance, CSP, external RAF integration, multi-pane layout, state export/import, and frame diagnostics.

These references must not turn `cfg` into a plugin-host architecture. Borrow product lessons, not ecosystem complexity.

## Local Research Workspace

Inside the new `cfg` repository, create a local research scratch folder:

```text
.tmp/
```

Add `.tmp/` to `.gitignore`.

Use `.tmp/` for temporary reference material:

- cloned Tweakpane source;
- cloned Leva source;
- cloned lil-gui/dat.GUI source;
- cloned plugin source;
- package tarball inspection;
- benchmark notes;
- scratch experiments;
- local generated review output.

Rules:

- never commit `.tmp/`;
- never copy third-party source into `src/` unless intentionally taking a licensed derivative path and preserving notices;
- use cloned references for understanding architecture, API ideas, performance tradeoffs, and visual behavior;
- document only distilled decisions and citations in project docs, not raw copied source;
- delete or leave `.tmp/` as local ignored evidence at the end, but do not include it in release artifacts.

Keep the repository public-safe, small, and operational. Do not include private context, machine-local state, secrets, or irrelevant template website files.

## Product Definition

`cfg` is not a general admin UI framework and not a React component library. It is a precision instrument for tuning runtime settings and inspecting frame performance.

It should feel like a dense professional instrument panel:

- compact;
- sharp;
- technical;
- quiet;
- fast;
- high-detail;
- low-friction;
- stable under real animation load;
- aesthetically close in spirit to Tweakpane's compact pane layout;
- modernized with clean CSS and Geist Mono by default.

The design benchmark is Tweakpane's density and clarity, but the implementation must be leaner and more specialized.

The modernity requirement applies to the entire repository, not only the UI component. The build, test, package, CI, release, security posture, documentation, and demo must all feel like a current high-end TypeScript/Bun library. Do not build a modern-looking pane on top of stale, janky, loosely configured project infrastructure.

## Non-Negotiable Constraints

- Library name: `cfg`.
- Language: TypeScript.
- Runtime/tooling: Bun-first.
- Output: modern ESM with `.d.ts` types.
- Framework dependencies: none.
- React/Vue/Svelte dependencies: none.
- Legacy browser support: none.
- Browser target: latest modern browsers only.
- Rendering model: DOM for controls, canvas for high-frequency telemetry.
- Scheduler model: external RAF loop must be first-class.
- Standalone RAF mode may exist, but must not be the only path.
- No broad full-panel refresh on every frame.
- No hidden duplicate RAF loop when the host app provides one.
- No avoidable allocations in the telemetry hot path.
- No forced layout reads in the telemetry hot path.
- No per-point DOM or SVG for per-frame graphs.
- No large external plugin marketplace as a substitute for first-class components.
- No public plugin API, extension registry, plugin lifecycle, or compatibility layer in `v1.0`.
- No punting required controls or telemetry surfaces to plugins.
- No heavy theme-builder product surface unless the core production deliverables are already complete.
- No dependency bloat.
- No generated template-site complexity.
- No stale default scaffolding.
- No loose TypeScript.
- No casual CSP exceptions.
- No janky performance tricks.
- No hidden browser-engine footguns.

## Execution Expectation

This is not a prototype request.

This is not a quick scaffold.

This is not a "version zero" proof of concept.

Build `cfg` as a production-quality `v1.0` library. The expectation is that an autonomous AI engineering agent can work for many hours, continue through implementation details, self-review, polish, tests, docs, benchmarks, and release setup, and return with a complete result rather than a half-hour prototype.

The target is an overnight production build:

- full source implementation;
- complete public API;
- complete demo;
- complete benchmark/demo instrumentation;
- strict types;
- strong tests;
- clean styling;
- GitHub CI;
- release artifacts;
- docs;
- final self-review.

Do not stop after scaffolding. Do not stop after the easy controls. Do not leave core features as TODOs. Do not label missing production functionality as "future work" unless it is explicitly listed as an anti-goal.

If the implementation takes hours, continue. The desired output is a finished `v1.0` release candidate.

## Phased Autonomous Execution Loop

This should be completed in one continuous autonomous run. Han will set this as a goal for an AI agent and expects it to run overnight for as long as needed to deliver the finished `v1.0` result.

Do not require Han to babysit the work.

Do not stop after each phase unless truly blocked.

Work in phases so quality compounds rather than drifting. Maintain a visible plan/checklist and update it as each phase completes.

Recommended phases:

1. Research and baseline:
   - read this prompt fully;
   - read `$align`;
   - read relevant Bun official docs;
   - inspect Tweakpane, Leva, lil-gui, dat.GUI, Tweakpane Essentials, profiler/color plugins as references;
   - read `/Users/han/Git/_www_template/src/app/dev/pane.ts`;
   - read `/Users/han/Git/_www_template/src/app/app.ts`;
   - read `/Users/han/Git/_www_template/src/app/core/settings.ts`;
   - read `/Users/han/Git/_www_template/src/app/core/draft.ts`;
   - read the surrounding `_www_template` controls/theme/settings files needed to understand current Tweakpane behavior;
   - create a short read-only compatibility checklist before freezing the public API;
   - decide final package shape.

2. Repository setup:
   - create `/Users/han/Git/cfg`;
   - initialize package/tooling;
   - apply align baseline;
   - set strict TypeScript, linting, formatting, hooks, CI skeleton.

3. Architecture and public API:
   - implement manager, pane model, lifecycle, scheduler, package exports, CSS entry;
   - compile-test the public API examples.

4. Layout and styling:
   - implement pane shell, multi-pane top-right stacking, folders, tabs, collapse/expand, stable sizing, CSP-safe static CSS.

5. Control components:
   - implement required input controls, binding semantics, validation, settings import/export/reset.

6. Telemetry components:
   - implement graph primitive, FPS graph, frame graph, profiler, typed ring buffers, external RAF integration.

7. Demo and benchmark:
   - build the simple Vite demo;
   - show all controls and multiple panes;
   - add benchmark/performance mode.

8. Automated tests:
   - unit tests;
   - type tests;
   - browser smoke tests;
   - package install tests.

9. Manual browser QA:
   - launch browser;
   - test interactions;
   - capture screenshots;
   - profile performance.

10. GitHub remote setup:
    - create private `u29dc/cfg`;
    - push;
    - verify CI on the pushed branch.

11. Final audit:
    - run full local quality gate;
    - run Clawpatch read-only review;
    - ask final subagent(s) for fresh perspective;
    - fix validated important issues;
    - rerun checks and browser QA after fixes.

12. Final release:
    - run the final ship flow;
    - push the final main branch;
    - verify CI on the final commit;
    - tag `v1.0.0` only after all audits, fixes, downstream integration dry runs, checks, and final subagent review pass;
    - create the GitHub release;
    - verify the release page;
    - verify clean install from the tag.

After each meaningful phase:

- run the strongest relevant checks for that phase;
- run `bun run util:check` once it exists and whenever enough of the repo exists for it to be meaningful;
- run `bun run build` or package/demo build once build scripts exist;
- verify no TypeScript, lint, format, test, or build errors are being carried forward;
- ask at least one subagent for a fresh review of the phase output when subagents are available;
- incorporate valid feedback before moving on;
- record what was tested and what remains risky.

Use subagents as a snowball quality loop:

- after architecture/API design, ask a subagent to review API shape and package boundaries;
- after control components, ask a subagent to review binding semantics and edge cases;
- after telemetry/profiler, ask a subagent to review browser performance risks;
- after styling/layout, ask a subagent to review visual polish, CSP safety, and responsive behavior;
- after demo/browser QA, ask a subagent to review whether the demo proves every feature;
- before release, ask a subagent to perform a final repo-wide review.

Subagent feedback is advisory, not a reason to stall. The main agent must consolidate, decide, fix important issues, and continue.

## Commit And Ship Discipline

Use the ship skill contract from:

```text
/Users/han/Git/dot/agents/skills/ship/SKILL.md
```

Commit work regularly and coherently during the overnight run. Do not leave the entire project as one enormous uncommitted change until the end.

Commit rules:

- use deterministic batches;
- keep commits atomic and reviewable;
- do not mix unrelated concerns;
- follow conventional commit format: `type(scope): subject`;
- use lowercase imperative subjects;
- include commit bodies with rationale;
- write commit messages to `/tmp/commit-msg.txt`;
- commit with `git commit -F /tmp/commit-msg.txt`;
- remove the temp file after successful commit;
- preserve unrelated user work;
- avoid force-push;
- push to the configured remote after coherent milestones once the remote exists.

Suggested commit checkpoints:

- repository/tooling baseline;
- package/public API foundation;
- pane layout/styling;
- controls and settings;
- telemetry/profiler;
- demo/benchmark;
- browser QA/tests;
- GitHub release setup;
- final review fixes.

At final delivery, run the equivalent of `$ship` for the finished `cfg` repository: inspect status, batch any remaining changes coherently, validate, commit, push, and report commit SHAs and push target.

## Target Repository And Safety

Create the new project at:

```text
/Users/han/Git/cfg
```

This prompt lives inside `/Users/han/Git/_www_template`, but `_www_template` is only the source of context. Do not mutate `_www_template` while building `cfg`, except reading this prompt and any referenced context. Do not copy the Astro template repository structure into `cfg`.

If `/Users/han/Git/cfg` already exists:

- inspect it;
- preserve existing user work;
- do not delete it;
- do not run destructive resets;
- if it is not safe to continue, stop and report exactly why.

The repository must be public-safe even though the GitHub repo will be private initially. Do not encode private machine state, secrets, tokens, personal notes, or unrelated project context in source files, docs, or generated artifacts.

## GitHub Delivery Contract

The agent is responsible for creating and shipping the private GitHub repository.

Assume Han has installed and authenticated GitHub CLI. Verify this explicitly:

```sh
gh auth status
```

Create a private repository under the U29DC account:

```text
u29dc/cfg
```

The agent must:

- initialize git locally if needed;
- create or connect the private GitHub repository with `gh`;
- set `origin` to the `u29dc/cfg` remote;
- push the main branch;
- create a `v1.0.0` tag only after all checks, browser QA, Clawpatch review/fixes, final subagent review, and downstream `_www_template` integration dry runs pass;
- push the tag;
- create a GitHub release for `v1.0.0`;
- upload release artifacts if the build produces artifacts outside git;
- verify GitHub Actions CI runs and passes;
- verify the release page exists;
- verify a clean install from the pinned GitHub tag works in a temporary project.

Do not report GitHub delivery as complete unless the remote, branch, tag, release, and CI have actually been verified. If GitHub authentication, organization permission, or network access blocks this, report it as a blocker and do not pretend it passed.

The desired final morning state is:

```json
{
  "dependencies": {
    "cfg": "github:u29dc/cfg#v1.0.0"
  }
}
```

and the package is ready to be added to `_www_template` so Tweakpane can be replaced.

The preferred dependency spec is the pinned GitHub tag form above. If private-repo authentication makes the shorthand form unreliable in a downstream project, use the equivalent SSH Git URL:

```json
{
  "dependencies": {
    "cfg": "git+ssh://git@github.com/u29dc/cfg.git#v1.0.0"
  }
}
```

Do not use an unpinned branch, `latest`, or npm publishing as the default `v1.0` consumption path.

## Repository Shape

Create a clean standalone library repository.

Keep it simple:

```text
.
├── src/
│   ├── index.ts
│   ├── core/
│   ├── controls/
│   ├── telemetry/
│   ├── layout/
│   ├── styles/
│   └── utils/
├── demo/
│   ├── index.html
│   ├── src/main.ts
│   └── src/demo.css
├── tests/
├── benchmarks/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── AGENTS.md
└── docs/
    ├── architecture.md
    ├── framework-adapters.md
    ├── performance.md
    └── comparisons.md
```

Do not recreate the Astro template website. The demo should be a simple Vite HTML page that imports the built library or source entry and initializes one complete showcase.

## Package And Scripts

Use Bun. `package.json` must follow the `$align` field ordering convention:

```text
name > version > type > private > workspaces > repository > scripts > devDependencies > dependencies
```

Suggested package name:

```json
{
  "name": "cfg"
}
```

If publication is considered later, document the scoped alternative `@u29dc/cfg`, but do not require npm publishing for `v1.0`.

## Packaging Contract

The package must be consumable from a pinned GitHub tag without npm publishing.

`package.json` must define a real library package, not only a demo app. Include explicit fields for:

- `name`;
- `version`;
- `type`;
- `repository`;
- `exports`;
- `types`;
- `files`;
- `sideEffects`;
- `scripts`;
- `devDependencies`;
- `dependencies`.

Required exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "docs"],
  "sideEffects": ["./dist/styles.css"]
}
```

The production package must produce:

```text
dist/index.js
dist/index.d.ts
dist/styles.css
```

Source maps are optional. Type declarations are not optional.

The library must be ESM-only.

Runtime dependencies should be zero. Any runtime dependency must be justified in `docs/architecture.md` and must survive a bundle/performance review.

Do not make Vite build only the demo. Separate library and demo builds clearly. For example:

```json
{
  "scripts": {
    "build": "bun run build:lib && bun run build:demo",
    "build:lib": "...",
    "build:demo": "vite build"
  }
}
```

For GitHub-tag consumption, prefer committing `dist/` on release tags so downstream installs do not depend on install-time build scripts, trusted lifecycle scripts, or the consuming project's toolchain. If the agent chooses an install-time build path anyway, it must document why that is better, handle Bun trusted dependency behavior explicitly, and prove clean downstream installation.

The final package must be tested from a clean temporary project with:

```sh
bun add github:u29dc/cfg#v1.0.0
```

and a minimal import check:

```ts
import { createCfg } from "cfg";
import "cfg/styles.css";
```

GitHub dependency installation must work even with local husky hooks. If the `prepare` script required by hooks conflicts with GitHub dependency installation, solve that cleanly and document the decision.

Scripts must use the `util:*` namespace for quality commands:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "bun run util:types && bun run build:lib && bun run build:demo",
    "build:lib": "...",
    "build:demo": "vite build",
    "test": "bun test",
    "prepare": "husky",
    "util:format": "...",
    "util:lint": "...",
    "util:types": "...",
    "util:test": "bun test",
    "util:check": "bun run util:format && bun run util:lint && bun run util:types && bun run util:test && bun run build"
  }
}
```

Use the leanest practical tooling that satisfies strict TypeScript and reliable checks.

Bun-first means:

- use `bun install`;
- commit `bun.lock`;
- use `bun run` scripts;
- use `bun test` unless a browser test genuinely requires Playwright;
- use Bun's official docs for package manager, workspaces, CI, tests, and bundler decisions;
- prefer Bun-native build/bundle paths where they satisfy the library output contract;
- use Vite only where it is the cleanest demo/dev-server harness, not because of stale default scaffolding.

Every tool in the repository should earn its place. If a tool is added, document why it is needed.

## GitHub And Release

Set up GitHub Actions:

- install Bun;
- install dependencies;
- run `bun run util:check`;
- build library artifacts;
- upload release artifacts when a version tag is pushed.

The library should be consumable from a pinned GitHub tag or commit:

```json
{
  "dependencies": {
    "cfg": "github:u29dc/cfg#v1.0.0"
  }
}
```

Do not recommend unpinned `latest` consumption. Reproducibility matters.

## CSP And Host Integration

`cfg` exists partly to avoid the Tweakpane injected-style CSP problem.

By default, styling must work under strict security headers like `_www_template` uses:

```text
style-src 'self'
style-src-elem 'self'
style-src-attr 'none'
script-src 'self'
```

Default behavior:

- no runtime `<style>` tag injection;
- no inline style attributes for normal layout/styling;
- no `eval`;
- no dynamic remote asset loading;
- no external font CDN;
- no hidden dependency on unsafe CSP allowances.

Ship static CSS:

```ts
import "cfg/styles.css";
```

If optional runtime style injection is ever added, it must be opt-in, nonce-aware, documented, and off by default.

SSR/import safety is required. Importing `cfg` in an Astro/Vite module graph must not touch `window`, `document`, `HTMLElement`, canvas contexts, or browser-only APIs at module evaluation time. Browser objects may only be accessed after explicit client-side creation, such as `createCfg()`.

Include one README example showing how `_www_template` would:

- import `cfg/styles.css`;
- create `cfg` after client boot;
- attach it to the existing central RAF lifecycle;
- dispose it cleanly;
- keep Tweakpane replacement scoped and reversible.

Do not port or recreate `_www_template`; this is only an integration example.

## Browser Engine And Security Engineering

Design with a precise mental model of browser engine behavior:

- JavaScript execution;
- style recalculation;
- layout;
- paint;
- raster;
- compositing;
- input event dispatch;
- RAF scheduling;
- microtasks/macrotasks;
- GPU/canvas upload costs;
- memory allocation and garbage collection.

The implementation must avoid accidental main-thread damage.

Required browser-engine constraints:

- batch DOM writes;
- avoid read-after-write layout thrash;
- avoid forced synchronous layout in hot paths;
- avoid measuring layout during telemetry draws;
- use CSS containment intentionally;
- use stable dimensions for pane controls and canvases;
- keep canvas backing-store resize outside the frame hot path;
- avoid broad selectors in per-frame code;
- avoid DOM tree walks during RAF;
- keep pointer/drag handlers minimal and allocation-conscious;
- keep wheel/pointer listeners scoped and disposed;
- prefer passive listeners where they do not need `preventDefault`;
- use pointer capture deliberately for drags;
- respect page scroll and text editing semantics;
- avoid long tasks inside the pane itself;
- surface profiler data without becoming the performance problem.

Security posture:

- strict CSP compatibility is a core feature, not an afterthought;
- no inline script requirements;
- no inline style requirements;
- no runtime CSS injection by default;
- no `eval`, `new Function`, or string-to-code patterns;
- no remote asset loading by default;
- no telemetry network calls;
- no localStorage/sessionStorage writes unless explicitly requested by the host API;
- no global mutable singleton;
- no global event listeners that survive disposal;
- all public input values must be validated before affecting DOM, CSS variables, canvas drawing, or class names.

CSS and DOM mutation must be structured:

- do not generate arbitrary class names from unvalidated user values;
- do not write invalid numeric CSS values such as `NaNpx` or `Infinitypx`;
- clamp numeric UI values before using them in styles or canvas;
- serialize colors through validated color helpers;
- isolate pane data attributes and class prefixes under a clear namespace;
- keep host-page side effects explicit and reversible.

If a browser API has subtle performance or security tradeoffs, document the decision in `docs/performance.md` or `docs/architecture.md`.

## Core Architectural Principle

Separate the runtime into three lanes.

### 1. Control Lane

The control lane is event-driven.

It owns:

- sliders;
- number inputs;
- text inputs;
- toggles;
- buttons;
- selects;
- folders;
- tabs;
- color controls;
- settings import/export;
- normal bound object writes.

The control lane may use DOM. It should update only when user input, bound data, or explicit refresh of a specific control requires it.

It must not be part of the per-frame hot path unless a specific control explicitly opts into high-frequency monitoring.

### 2. Telemetry Lane

The telemetry lane is per-frame capable.

It owns:

- FPS graph;
- frame-time graph;
- render duration graph;
- profiler bars;
- module timing;
- long-frame markers;
- dropped-frame indicators;
- optional browser performance samples.

Telemetry data must be sampled into fixed-size typed ring buffers. Use `Float32Array`, `Uint16Array`, or similar typed structures where appropriate.

Rendering high-frequency telemetry must use canvas by default. Avoid SVG polylines and per-sample DOM.

The telemetry lane must be able to update every frame without triggering a full pane refresh.

### 3. Text/Readout Lane

The text/readout lane is for human-readable monitors.

It may sample every frame internally, but DOM text updates should be throttled by default, for example at 4-10Hz.

Allow explicit high-frequency readouts, but make them opt-in and localized to that readout.

## Framework Extension Architecture

`cfg` must be vanilla-first in `v1.0`.

The core package must work without React, Next.js, Svelte, Vue, Astro components, or any framework runtime.

However, the architecture must make future framework connectors clean and obvious without becoming a plugin system. Later, Han may want:

- `cfg/react`;
- `cfg/next`;
- `cfg/svelte`;
- `cfg/astro`;
- or separate packages such as `@u29dc/cfg-react`, `@u29dc/cfg-svelte`, etc.

Design the core so these future adapters can wrap it without forking or duplicating the frame/telemetry engine. This means clean lifecycle and state boundaries, not a generic plugin registry.

Required principles:

- core owns the manager, panes, controls, scheduler, telemetry, profiler, settings, and disposal;
- adapters should only map framework lifecycle/state into the core API;
- adapters must be able to share the same external RAF loop model;
- adapters must not introduce duplicate loops;
- adapters must not reimplement telemetry;
- adapters must not require framework state for per-frame hot paths;
- core must expose lifecycle hooks sufficient for framework mount/unmount;
- core must expose typed state/binding APIs that adapters can wrap;
- core must remain import-safe in SSR/module evaluation contexts;
- CSS should remain framework-agnostic.

Do not implement React, Next.js, Svelte, or Vue bindings in `v1.0` unless every required core, demo, package, QA, GitHub, and release deliverable is already complete. Instead, include `docs/framework-adapters.md` explaining the intended adapter boundary and showing short pseudo-examples for future React/Svelte usage.

## Bun Workspace Readiness

Read the official Bun workspaces documentation before choosing the repository package layout:

```text
https://bun.com/docs/pm/workspaces
```

Bun supports a root `workspaces` key, commonly with package directories under `packages/*`, local package references through `workspace:*`, dependency de-duplication, and script execution across workspaces with `--filter` or `--workspaces`.

For `v1.0`, default to a single root package. This is the preferred shape because the required install target is:

```sh
bun add github:u29dc/cfg#v1.0.0
```

That command must resolve the actual `cfg` library package from the repository root.

If workspaces are used, keep them purposeful and small. A possible future-ready shape is:

```text
.
├── packages/
│   ├── cfg/
│   ├── cfg-react/      # future adapter, not required in v1.0
│   ├── cfg-svelte/     # future adapter, not required in v1.0
│   └── cfg-next/       # future adapter, not required in v1.0
├── demo/
└── package.json
```

Rules if using Bun workspaces:

- root `package.json` may define `"workspaces": ["packages/*"]`;
- the vanilla package remains the production `cfg` deliverable;
- `bun add github:u29dc/cfg#v1.0.0` must be proven to install the actual library correctly from the root repository;
- do not use a nested workspace layout if it breaks GitHub-tag dependency consumption;
- future adapter package names should be planned but not implemented prematurely;
- internal workspace references should use `workspace:*`;
- root scripts should be able to run checks across workspaces;
- package-specific scripts should be runnable with Bun filters;
- GitHub-tag installation of `cfg` must still work cleanly;
- do not make workspace structure interfere with simple consumption from `_www_template`.

## Scheduler Model

External scheduler mode is required and preferred.

Define scheduler semantics precisely.

`cfg.beginFrame(time)`:

- starts a frame sample;
- accepts RAF timestamp or equivalent monotonic milliseconds;
- computes `delta` from the previous accepted frame;
- clamps or guards invalid deltas;
- must not render DOM or canvas by itself.

`cfg.endFrame(time)`:

- closes the current frame sample;
- finalizes profiler totals;
- records frame duration into telemetry buffers;
- must tolerate a missing profiler section without corrupting state.

`cfg.renderFrame(time)`:

- renders only dirty visible telemetry surfaces and explicitly high-frequency readouts;
- must not refresh the entire pane tree;
- must not call user control `refresh()` globally;
- must skip hidden/collapsed telemetry surfaces.

Out-of-order calls, duplicate calls, or missing calls must be handled predictably. Either make them idempotent with clear semantics or throw contextual development errors. Document the chosen behavior.

External scheduler mode must create no hidden `requestAnimationFrame` loop. Prove this in tests or demo instrumentation.

Example:

```ts
import { createCfg } from "cfg";

const cfg = createCfg({
  scheduler: "external",
});

const controls = cfg.pane({
  title: "Controls",
});

const perf = cfg.pane({
  title: "Performance",
});

const fps = perf.fpsGraph({
  label: "FPS",
});

const frame = perf.frameGraph({
  label: "Frame",
  unit: "ms",
});

const profiler = perf.profiler({
  label: "Profiler",
});

function frameLoop(time: number) {
  cfg.beginFrame(time);

  profiler.measure("input", () => {
    input.update(time);
  });

  profiler.measure("scroll", () => {
    scroll.update(time);
  });

  profiler.measure("motion", () => {
    motion.update(time);
  });

  cfg.endFrame(time);
  cfg.renderFrame(time);

  requestAnimationFrame(frameLoop);
}

requestAnimationFrame(frameLoop);
```

Standalone mode may be:

```ts
const cfg = createCfg({
  scheduler: "internal",
});

cfg.start();
```

But standalone mode must be visibly secondary. The library exists to plug into serious apps with their own central loop.

## Multiple Panes

Multiple panes are first-class.

This must work:

```ts
const cfg = createCfg();

const controls = cfg.pane({
  title: "Controls",
});

const performance = cfg.pane({
  title: "Performance",
});

const scene = cfg.pane({
  title: "Scene",
});
```

Requirements:

- panes must not fight each other;
- panes must share one manager and one scheduler;
- panes must share one frame lifecycle;
- panes must be individually collapsible;
- panes must be individually disposable;
- pane IDs must be stable;
- duplicate pane titles must not break behavior;
- focus, pointer capture, drag/resize, keyboard handling, and z-index must be coordinated;
- one pane's refresh/render must not refresh every other pane unless explicitly requested.

### Default Pane Layout

Default placement:

- top-right corner;
- horizontal stack;
- first pane occupies the rightmost slot;
- second pane is placed to the left of the first;
- third pane is placed to the left of the second;
- more panes continue leftward;
- consistent gap between panes;
- no overlap by default;
- stable sizing;
- no layout shift during folder open/close;
- predictable behavior on narrow viewports.

Example visual order:

```text
[Pane 3] [Pane 2] [Pane 1]
                          ↑
                    right edge
```

Allow explicit placement configuration, but `v1.0` must make the default multi-pane behavior robust without extra user setup.

### Responsive Layout Contract

Desktop behavior:

- panes stack horizontally from the top-right toward the left;
- each pane keeps a stable width;
- panes do not overlap.

Narrow viewport behavior:

- panes may wrap to a second row or switch to a vertical stack;
- panes must remain reachable;
- no pane may render permanently offscreen;
- no control text may overflow incoherently;
- telemetry canvases must resize or clamp cleanly;
- collapse/expand must not cause horizontal page scroll unless explicitly configured.

Choose the exact narrow-viewport behavior during implementation, document it, and verify it in browser QA.

## Pane Behavior

Each pane should support:

- title;
- collapse/expand;
- optional width only if implemented without violating `style-src-attr 'none'`;
- optional position override only if implemented without unsafe inline styles;
- fixed-width layout by default;
- scroll containment without scrollbar flicker;
- keyboard-safe input focus;
- user-select disabled except inside text-editable fields;
- pointer interaction without accidental page drag/selection;
- deterministic disposal.

Folder expand/collapse must not cause horizontal shifting or temporary scrollbar jitter.

Prefer static size tokens, CSS classes, data attributes, and CSS variables declared in static CSS over arbitrary inline `style` attributes. If arbitrary numeric pane widths cannot be implemented cleanly under strict CSP, defer arbitrary widths and ship a small set of static width variants for `v1.0`.

## Public API Direction

Prefer a small, fluent, typed API.

Example:

```ts
const state = {
  theme: "system",
  quality: "high",
  anchor: "center",
  speed: 1,
  enabled: true,
  label: "Template",
  color: "#111111",
  point: { x: 0, y: 0 },
  position: { x: 0, y: 0, z: 0 },
  range: { min: 16, max: 48 },
  easing: [0.25, 0.1, 0.25, 1],
  image: "",
};

const pane = cfg.pane({
  title: "Runtime",
});

pane
  .folder("Basics")
  .toggle(state, "enabled", {
    label: "Enabled",
  })
  .number(state, "speed", {
    label: "Speed",
    min: 0,
    max: 4,
    step: 0.01,
  })
  .text(state, "label", {
    label: "Label",
  })
  .select(state, "theme", {
    label: "Theme",
    options: ["system", "light", "dark"],
  })
  .segmented(state, "quality", {
    label: "Quality",
    options: ["low", "medium", "high"],
  })
  .radioGrid(state, "anchor", {
    label: "Anchor",
    columns: 3,
    options: [
      "top-left",
      "top",
      "top-right",
      "left",
      "center",
      "right",
      "bottom-left",
      "bottom",
      "bottom-right",
    ],
  });

pane.folder("Color").color(state, "color", {
  label: "Accent",
  format: "hex",
});

pane.folder("Color").palette(state, "color", {
  label: "Palette",
  colors: ["#111111", "#ffffff", "#ff3300", "#0066ff"],
});

pane.folder("Vectors").point(state, "point", {
  label: "Offset",
});

pane.folder("Vectors").vector3(state, "position", {
  label: "Position",
});

pane.folder("Range").interval(state, "range", {
  label: "Frame Budget",
  min: 0,
  max: 100,
  step: 1,
});

pane.folder("Motion").cubicBezier(state, "easing", {
  label: "Easing",
});

pane.folder("Assets").image(state, "image", {
  label: "Preview Image",
});
```

API methods may return control handles:

```ts
const speed = pane.number(state, "speed", {
  min: 0,
  max: 4,
});

speed.on("change", (value) => {
  console.log(value);
});

speed.set(2);
speed.refresh();
speed.dispose();
```

Do not overcomplicate the public API. It should feel direct and obvious.

## Minimum Public API Contract

The public API must be stable enough for `_www_template` to consume directly after `v1.0.0`.

Export at least:

- `createCfg`;
- `Cfg`;
- `Pane`;
- `Control`;
- `TelemetryGraph`;
- `Profiler`;
- option types for every public constructor/control;
- settings snapshot types;
- event types.

The following must be a compile-tested example in the repo:

```ts
import { createCfg, type Cfg, type Pane } from "cfg";
import "cfg/styles.css";

const state = {
  enabled: true,
  speed: 1,
  mode: "normal",
  label: "Template",
  color: "#111111ff",
  point: { x: 0, y: 0 },
  position: { x: 0, y: 0, z: 0 },
  range: { min: 16, max: 48 },
  easing: [0.25, 0.1, 0.25, 1],
  image: "",
};

const cfg: Cfg = createCfg({ scheduler: "external" });
const controls: Pane = cfg.pane({ title: "Controls" });
const performance = cfg.pane({ title: "Performance" });

controls.folder("Basics").toggle(state, "enabled");
controls.number(state, "speed", { min: 0, max: 4, step: 0.01 });
controls.segmented(state, "mode", { options: ["calm", "normal", "intense"] });
controls.text(state, "label");
controls.color(state, "color", { format: "rgba" });
controls.point(state, "point");
controls.vector3(state, "position");
controls.interval(state, "range", { min: 0, max: 100, step: 1 });
controls.cubicBezier(state, "easing");
controls.image(state, "image");
controls.buttonGroup({
  label: "Actions",
  buttons: [
    { label: "Copy", action: () => cfg.copySettings() },
    { label: "Reset", action: () => cfg.resetSettings() },
  ],
});

const fps = performance.fpsGraph({ label: "FPS" });
const frame = performance.frameGraph({ label: "Frame", unit: "ms" });
const log = performance.logMonitor({ label: "Events", rows: 4, bufferSize: 20 });
const profiler = performance.profiler({ label: "Profiler" });

function loop(time: number) {
  cfg.beginFrame(time);
  profiler.measure("work", () => {
    Math.sqrt(time);
  });
  log.push(`frame ${Math.round(time)}`);
  cfg.endFrame(time);
  cfg.renderFrame(time);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

const snapshot = cfg.exportSettings();
cfg.applySettings(snapshot);
cfg.resetSettings();
cfg.dispose();
```

If a cleaner API emerges during implementation, it may be better than this exact shape, but the final repo must include an equivalent compile-tested public API example covering manager, panes, controls, telemetry, profiler, settings, and disposal.

## Binding And Settings Semantics

Define binding behavior explicitly.

Required semantics:

- control handles expose `get`, `set`, `refresh`, `dispose`, and event subscription;
- distinguish live `input` events from committed `change` events where relevant;
- number controls clamp min/max;
- number controls reject or sanitize `NaN`, `Infinity`, and invalid text input;
- step behavior is deterministic;
- select controls reject unknown options unless explicitly configured to allow them;
- external object mutation can be reflected with targeted `refresh()`;
- default values are snapshotted at control creation for reset;
- nested values are supported where public API examples require them;
- duplicate pane titles, folder labels, and control labels must not break settings export/import;
- settings snapshots use stable internal IDs, not only visible labels;
- settings snapshots are versioned;
- import handles unknown keys safely;
- import validates values before applying them;
- telemetry buffers are excluded from settings export by default.

## Required v1.0 Components

Implement the following in `v1.0`:

- root manager;
- pane;
- folder;
- tab;
- separator;
- button;
- button group/action row;
- toggle/boolean;
- number input;
- slider;
- combined number slider;
- string input;
- multiline string;
- select/list;
- segmented/radio group;
- radio grid;
- color input;
- palette/swatch group;
- point/vector input;
- explicit vector2, vector3, and vector4 inputs;
- xy pad/joystick input for vector2 values;
- interval/range input;
- cubic Bezier/easing curve input;
- image/asset input with preview;
- readonly monitor;
- buffered text/log monitor;
- graph primitive;
- multi-series/waveform graph;
- FPS graph;
- frame-time graph;
- profiler bars;
- export/copy settings action;
- import/apply settings helper;
- reset helper;
- external RAF integration;
- internal RAF fallback.

## First-Class Control Requirements

These controls must be treated as first-class `v1.0` features, not hidden examples or future plugin sketches.

### Segmented, Radio, And Grid Choices

Add a compact choice control family for values with a small finite option set:

- `segmented` for two to five common mode choices;
- `radioGroup` for explicit labeled choices;
- `radioGrid` for spatial or preset grids such as anchors, quality presets, alignment, scale, or nine-point placement;
- stable option IDs separate from visible labels;
- keyboard navigation and focus states;
- import/export validation that rejects unknown option values unless explicitly configured to allow them.

These are different from `select/list`: common mode choices should not require opening a dropdown.

### Button Groups

Add grouped action buttons for closely related commands:

- multiple buttons in one row;
- disabled states per button;
- deterministic one-shot action dispatch;
- optional confirmation hook for destructive actions;
- no settings serialization for action-only buttons unless explicitly configured.

This is required for settings actions such as copy, reset, import, export, snapshot, and diagnostics.

### Vectors And XY Pad

Do not leave vector support as a vague `point/vector` placeholder.

Required:

- `vector2`;
- `vector3`;
- `vector4`;
- object values such as `{x, y}`, `{x, y, z}`, `{x, y, z, w}`;
- tuple values such as `[x, y]`, `[x, y, z]`, `[x, y, z, w]` when explicitly configured;
- per-axis `min`, `max`, `step`, formatting, and labels;
- optional coordinate lock for uniform values;
- an `xyPad` or joystick-style picker for `vector2`;
- optional inverted Y behavior for screen-space controls.

The numeric field path and pointer picker path must stay synchronized and share validation.

### Cubic Bezier And Easing

Add a compact cubic Bezier control for animation timing:

- tuple value `[x1, y1, x2, y2]`;
- object value `{x1, y1, x2, y2}` if the API chooses to support it;
- graph/picker UI;
- text/number fallback;
- clamping or validation appropriate for CSS cubic-bezier control points;
- preset support for common easings;
- helper output compatible with CSS `cubic-bezier(...)`;
- no per-frame work unless the control is actively edited or rendered as telemetry.

This is core for animation-heavy sites and must not be delegated to a stale plugin.

### Image And Asset Input

Add a small image/asset input for visual tuning:

- URL/string value support;
- optional file selection for local demo use;
- preview thumbnail;
- clear/reset action;
- accepted MIME/type validation;
- settings export that stores only safe serializable values;
- no uncontrolled blob retention or unbounded base64 growth in persisted settings.

This is useful for swapping textures, hero images, localized imagery, and test assets. Keep it lean: it is not a DAM, uploader, or CMS.

### Palette And Swatch Groups

Add a compact palette control:

- curated swatch list;
- selected value bound to a color string or color object;
- read-only palette preview mode;
- optional grouped palette sections;
- stable swatch IDs where labels matter;
- accessible labels for swatches.

This is separate from the full color picker. It should make brand-token and theme-token picking fast.

### Buffered Logs And Multi-Series Graphs

Monitoring must include more than one scalar graph:

- buffered text/log monitor with bounded buffer size;
- throttled text rendering by default;
- explicit push API for event messages;
- multi-series graph or waveform graph for multiple numeric channels;
- fixed-size typed buffers for high-frequency numeric data;
- no per-sample allocation after initialization.

The text/log monitor is for human-readable diagnostics. High-frequency frame data belongs in canvas-backed graphs.

## Color Controls

`v1.0` must include a production-quality basic color control:

- HEX;
- RGB;
- alpha support;
- swatch;
- text input;
- compact popup picker.

`v1.0` must also include a compact palette/swatch group control for curated colors and theme tokens.

The architecture must also be ready for advanced color work:

- OKLCH;
- OKLab;
- Display-P3;
- Rec.2020;
- palette groups;
- gamut boundary visualization;
- color-profile-aware UI;
- conversion helpers;
- contrast/readability helpers.

Do not make the color architecture a dead end, but do not let advanced color spaces derail the required `v1.0` core. OKLCH, Display-P3, gamut visualization, and palette tooling may be implemented in `v1.0` only if the required core controls, telemetry, packaging, QA, and release delivery are already complete. Otherwise, document the extension seam clearly and keep the basic color control production-quality.

## Graph And Telemetry Components

The graph primitive must be suitable for FPS and frame-time display.

Requirements:

- canvas-backed;
- fixed pixel ratio handling;
- no per-frame DOM node creation;
- no per-sample string building;
- no forced layout in draw path;
- support min/max;
- support autoscale as optional;
- support target line, e.g. 16.67ms;
- support warning threshold coloring;
- support ring-buffer history length;
- support one or more numeric series where the public API exposes multi-series graphs;
- support paused/hidden state;
- support resize without hot-path layout reads.

FPS graph:

- sample every frame when active;
- show rolling FPS;
- show instantaneous frame time if useful;
- support 60/120/144Hz displays without assumptions;
- avoid Date objects in hot path; use RAF timestamp or `performance.now()`.

Frame-time graph:

- show duration in milliseconds;
- highlight over-budget frames;
- optionally show long animation frame markers when available.

Multi-series/waveform graph:

- support multiple named numeric channels;
- support stable color assignment per channel;
- support hidden/visible channel toggles if implemented without layout churn;
- use typed fixed-size buffers;
- avoid per-point DOM, SVG, string, or object allocation in the sample path.

Buffered text/log monitor:

- support bounded buffer size;
- support explicit `push(message)` API;
- throttle visible DOM updates by default;
- preserve newest messages when the buffer is full;
- avoid being used for per-frame numeric telemetry unless the caller explicitly accepts throttling.

Profiler:

- support `measure(label, fn)`;
- support manual `begin(label)` / `end(label)`;
- support nested or repeated labels carefully;
- expose current frame totals;
- display module bars compactly;
- track rolling average, max, and latest values;
- avoid allocations in per-frame measurement if possible.

Example:

```ts
const profiler = pane.profiler({ label: "Modules" });

profiler.begin("scroll");
scroll.update();
profiler.end("scroll");

profiler.measure("motion", () => {
  motion.update();
});
```

## Browser Performance Data

Explore modern browser APIs and include production-quality support where the signal is useful and implementation is robust.

Potential data sources:

- `performance.now()`;
- `PerformanceObserver`;
- Long Animation Frames API where available;
- Long Tasks where available;
- Event Timing where useful;
- layout shift information if useful;
- resource timing if useful for a future network panel.

Do not add fragile dashboards just to claim coverage. Include the browser-derived metrics that can be implemented cleanly and reliably, and document any APIs that are intentionally excluded because support or signal quality is not strong enough.

## Settings Import/Export

Settings export is required.

Support:

- export current bound values to JSON;
- copy JSON to clipboard;
- import/apply JSON;
- reset to original defaults;
- stable serialization;
- optional filtering by pane/folder;
- avoid serializing telemetry buffers by default.

Example:

```ts
const snapshot = cfg.exportSettings();
await cfg.copySettings();
cfg.applySettings(snapshot);
cfg.resetSettings();
```

## Demo Page

The demo must be a simple Vite HTML page.

Do not build a full marketing website.
Do not port the Astro template.
Do not add routing.
Do not add CMS.

The demo should:

- import the library;
- create a single `cfg` manager;
- create multiple panes;
- show every `v1.0` component;
- show multiple folders;
- show tabs;
- show all input types;
- show all graph/telemetry types;
- show import/export actions;
- run a simple RAF loop;
- include a fake workload toggle so profiler bars visibly move;
- include one canvas animation or simple moving block to make frame behavior observable;
- demonstrate external scheduler mode;
- demonstrate default multi-pane top-right horizontal stacking.

Suggested demo panes:

1. `Controls`
   - booleans;
   - numbers;
   - sliders;
   - strings;
   - multiline;
   - select/list;
   - segmented/radio groups;
   - radio grids;
   - colors;
   - palette/swatch groups;
   - point/vector;
   - explicit vector2, vector3, and vector4 examples;
   - xy pad/joystick for vector2;
   - interval/range;
   - cubic Bezier/easing curve;
   - image/asset input;
   - buttons;
   - button groups;
   - separators;
   - tabs.

2. `Performance`
   - FPS graph;
   - frame-time graph;
   - multi-series/waveform graph;
   - profiler;
   - readonly monitors;
   - buffered log monitor;
   - fake workload controls.

3. `Theme`
   - color controls;
   - compact palette/swatch controls;
   - basic future-facing color API examples.

This is one demo page, not an app.

## Benchmark Page

Add a minimal benchmark page or benchmark mode.

It should measure:

- idle pane cost;
- cost with one pane and no telemetry;
- cost with three panes and no telemetry;
- cost with FPS graph active;
- cost with profiler active;
- cost with many controls;
- cost of collapsed panes;
- cost when hidden.

Keep the benchmark simple but honest.

Report:

- average frame time overhead;
- max observed overhead;
- memory/allocation notes where measurable;
- browser and machine caveats.

## Performance Verification Contract

High performance must be measured, not asserted.

Benchmark against a host RAF loop with `cfg` disabled and enabled. Report:

- average overhead;
- p95 overhead;
- max overhead;
- visible heap behavior;
- bundle size;
- canvas draw cost where measurable;
- browser and machine details.

Targets:

- no-telemetry pane idle overhead should be near the browser measurement noise floor;
- active FPS graph should not cause sustained heap growth;
- active frame-time graph should not cause sustained heap growth;
- active profiler should not allocate per measured label per frame after warmup;
- hidden/collapsed panes should skip visible canvas drawing;
- external scheduler mode must create no internal RAF;
- text readouts should be throttled by default;
- control lane must not refresh globally on every frame.

Hot-path forbidden operations:

- no `Date` object creation in per-frame telemetry;
- no per-sample object allocation after initialization;
- no `getBoundingClientRect()` in per-frame telemetry;
- no `offsetWidth`, `offsetHeight`, `clientWidth`, or `clientHeight` reads in per-frame telemetry;
- no canvas resize in per-frame draw path unless dimensions actually changed;
- no `querySelectorAll` or full-tree DOM traversal per frame;
- no per-point DOM or SVG path rebuilding for high-frequency graphs.

If any target is missed, report it as a defect or explicit residual risk, not as polish.

## Browser QA And Manual Testing

Automated tests are not enough.

After implementation, the agent must run the full production build, launch the demo in a real browser, and manually verify the product end-to-end. Use Playwright, Chrome DevTools Protocol, a browser automation MCP, or equivalent real-browser tooling. Do not rely only on jsdom or unit tests.

Also add an executable browser smoke test, preferably Playwright, that verifies:

- demo page loads;
- console has no errors;
- expected panes are visible;
- top-right multi-pane ordering is correct;
- folder collapse/expand works;
- representative controls mutate visible/bound state;
- color picker opens and applies a color;
- segmented/radio controls update bound state;
- radio grid updates bound state;
- button groups dispatch the intended action once;
- cubic Bezier edits update bound state and serialized output;
- image/asset input previews and clears a safe serializable value;
- palette/swatch control updates the bound color;
- vector2, vector3, vector4, and xy pad controls stay synchronized with numeric fields;
- buffered log monitor appends and caps messages;
- multi-series/waveform graph is nonblank and updates from bounded buffers;
- FPS/frame canvases are nonblank by pixel sampling;
- external RAF telemetry changes over time;
- disposal removes demo-created pane DOM.

Save browser screenshots and QA artifacts under a deterministic folder such as:

```text
artifacts/browser-qa/
```

Treat browser QA artifacts as local evidence by default. Add `artifacts/` to `.gitignore` unless a small curated artifact is intentionally committed for documentation.

Required browser QA flow:

1. Install dependencies.
2. Run formatting, linting, typechecking, unit tests, and build.
3. Start the demo/preview server.
4. Open the demo page in a real browser.
5. Verify there are no browser console errors.
6. Verify all panes render with the correct default top-right horizontal stacking.
7. Verify multiple panes do not overlap or fight for focus.
8. Verify pane collapse/expand works.
9. Verify folders expand/collapse without layout shift or scrollbar flicker.
10. Verify tabs switch correctly.
11. Verify boolean toggles update bound state.
12. Verify number inputs update bound state.
13. Verify sliders update bound state smoothly.
14. Verify combined number/slider controls stay in sync.
15. Verify string and multiline inputs work.
16. Verify select/list controls update bound state.
17. Verify segmented/radio groups update bound state.
18. Verify radio grids update bound state.
19. Verify point/vector controls update bound state.
20. Verify vector2, vector3, vector4, and xy pad controls stay synchronized with numeric fields.
21. Verify interval/range controls update bound state.
22. Verify cubic Bezier/easing controls update bound state and export/import correctly.
23. Verify image/asset input previews, clears, and serializes safe values only.
24. Verify button actions fire once per click.
25. Verify button groups dispatch the intended action once per click.
26. Verify separator and layout spacing are visually clean.
27. Verify color selector opens, edits colors, closes correctly, and updates bound state.
28. Verify palette/swatch controls update bound colors and expose accessible labels.
29. Verify import/export copies and reapplies settings correctly.
30. Verify reset restores initial defaults.
31. Verify FPS graph updates from the host RAF loop.
32. Verify frame-time graph updates from the host RAF loop.
33. Verify multi-series/waveform graphs update from bounded buffers.
34. Verify buffered log monitor appends, caps, and throttles visible updates.
35. Verify profiler bars update with real measured sections.
36. Verify fake workload changes are visible in profiler and frame graphs.
37. Verify canvas graphs are nonblank, correctly scaled, and do not use per-point DOM.
38. Verify hidden/collapsed panes reduce visible/render work.
39. Verify disposal removes DOM nodes and listeners.
40. Verify keyboard focus and text editing are sane.
41. Verify pointer dragging does not accidentally select text or scroll the page.
42. Verify resize behavior at desktop and narrower viewport widths.
43. Capture screenshots of the demo in the key states.
44. Run a short browser performance profile with telemetry enabled.
45. Report measured overhead and any residual risk.

The final report must include:

- commands run;
- browser used;
- demo URL;
- screenshots or screenshot paths;
- console status;
- interaction checklist result;
- performance profile summary;
- known residual issues, if any.

Do not claim the library is complete without this browser QA pass.

## Downstream Integration Gate Against `_www_template`

`cfg` is not complete until it has been tested against the real target repository:

```text
/Users/han/Git/_www_template
```

This is a downstream integration dry run. The goal is to prove that `cfg` can replace the current Tweakpane setup in `_www_template` without hassle, and that `cfg` can integrate into the template's real central runtime loop for frame-by-frame diagnostics.

This is not sufficient:

- pane renders;
- settings controls appear;
- a standalone `cfg` internal loop runs;
- a fake demo FPS graph updates independently.

The integration must prove that `cfg` can attach to `_www_template`'s existing runtime lifecycle and measure real frame/module work.

Do not commit or push changes in `_www_template`.

Do not treat `_www_template` as the primary project. The primary deliverable remains `/Users/han/Git/cfg` and the private `u29dc/cfg` release.

Before modifying anything in `_www_template`:

- run `git status --short --branch`;
- read the repo `AGENTS.md`;
- inspect package scripts and current dependency setup;
- inspect the current Tweakpane integration;
- preserve any user changes;
- avoid destructive resets;
- stage nothing;
- commit nothing;
- push nothing.

Read enough of `_www_template` to understand the architecture and purpose before integrating:

- `AGENTS.md`;
- `package.json`;
- `astro.config.ts`;
- `src/app/app.ts`;
- `src/app/dev/pane.ts`;
- `src/app/dev/theme.ts`;
- `src/app/core/settings.ts`;
- `src/app/core/draft.ts`;
- `src/app/core/namespace.ts`;
- `src/app/systems/theme.ts`;
- `src/app/systems/scroll.ts`;
- `src/app/systems/motion.ts`;
- `src/app/core/app.ts`;
- `src/app/core/module.ts`;
- `src/app/ui/base.ts`;
- relevant style files under `src/styles/`;
- `public/_headers`;
- any other file needed to understand controls, settings persistence, theme boot, CSP, and RAF lifecycle.

Prefer a disposable integration branch, temporary worktree, or temporary clone if that keeps `_www_template` clean. If directly editing `_www_template`, record the initial status, make only the dry-run changes needed to test integration, and revert only your own dry-run changes afterward unless Han explicitly asks to keep them.

Integration tasks:

- install `cfg` from the current release candidate or GitHub tag;
- import `cfg/styles.css`;
- remove or bypass Tweakpane imports;
- wire `cfg` into the existing controls/settings surface;
- preserve current settings defaults;
- preserve current local settings draft behavior;
- preserve reset settings behavior;
- preserve copy/export settings behavior;
- preserve theme mode/color controls;
- preserve scroll controls;
- preserve motion controls;
- add FPS graph and frame/profiler telemetry;
- connect telemetry to the existing central RAF/runtime lifecycle;
- use external scheduler mode when integrating into `_www_template`;
- ensure `cfg` does not create its own RAF loop inside `_www_template`;
- feed `cfg.beginFrame`, profiler section timing, `cfg.endFrame`, and `cfg.renderFrame` from the existing runtime loop;
- instrument real runtime phases/modules where appropriate: input, device, route, scroll, motion, theme/UI, controls, and any existing module lifecycle sections exposed by `RuntimeApp`;
- show profiler timing for real modules/phases, not only synthetic demo work;
- expose frame time, FPS, and module timing in the pane;
- verify that collapsed/hidden telemetry surfaces stop drawing but frame collection remains well behaved if configured;
- avoid duplicate RAF loops;
- keep CSP compatible with `_www_template` headers;
- keep `?controls=1` behavior or replace it with an equally clean equivalent;
- keep production removable/disableable behavior.

Then run `_www_template` validation:

- install dependencies if needed;
- run its full local quality gate;
- run build;
- run dev server;
- open the app in a real browser with controls enabled;
- verify console is clean;
- verify panes render correctly;
- verify current controls work;
- verify settings persist/reset/export correctly;
- verify FPS/frame/profiler graphs update from `_www_template`'s real runtime loop;
- verify profiler labels correspond to real runtime modules/phases;
- verify changing runtime settings changes the measured runtime behavior where applicable;
- verify no duplicate RAF loop or duplicate event/timer path was introduced;
- verify frame diagnostics still work across Astro route transitions if the template has multiple routes available;
- verify no visual/layout regressions;
- verify strict CSP compatibility remains intact for production output.

If the integration exposes `cfg` API gaps, package problems, CSS/CSP problems, performance issues, or missing behavior:

- go back to `/Users/han/Git/cfg`;
- fix `cfg` properly;
- rerun `cfg` checks, tests, browser QA, package install checks, and Clawpatch if the changes are material;
- rerun the `_www_template` integration dry run;
- repeat until integration is clean.

If a GitHub release tag already exists and integration exposes a required fix, do not force-move the tag. Create a new patch tag such as `v1.0.1`, update the install verification, and report the final correct tag.

Final output from the future builder agent must include:

- whether `_www_template` integration dry run passed;
- which `cfg` tag was used;
- what files would need to change in `_www_template`;
- what checks were run in `_www_template`;
- what browser QA was performed in `_www_template`;
- how `cfg` was connected to `_www_template`'s central loop;
- which real modules/phases were profiled;
- proof that no standalone duplicate RAF loop was used for integration;
- whether `_www_template` was left clean or what dry-run changes remain;
- any remaining integration risks.

## Final Clawpatch Review Gate

Before declaring `cfg` complete, run a full read-only Clawpatch review of the finished codebase.

Use this exact instruction block:

```md
Read `https://clawpatch.ai/` and `https://github.com/openclaw/clawpatch`, then run a full read-only review of my codebase using Clawpatch.

Clawpatch is an automated review tool that dispatches many subagents in parallel to perform comprehensive codebase reviews. I want you to:

* Read the full documentation and understand how the tool works.
* Explore the available commands and parameters.
* Run a full read-only review on my codebase.
    * Use the highest reasoning level and highest available settings the tool allows.
    * Configure the agents to use `5.5 xhigh` if supported.
    * Do not run `apply` mode or apply any fixes.
    * It is fine if the tool creates a `.clawpatch` folder with JSON or other output files.
    * Run only the phases needed to find, verify, and validate findings.
* After Clawpatch finishes, read all reports yourself as a sanity check to confirm the findings are valid and important.
* Then launch a separate subagent to get a second fresh opinion on all findings.
* Report back only with validated, verified, important findings.
```

Treat `.clawpatch/` as local review evidence and gitignore it by default unless a small curated summary is intentionally committed.

After Clawpatch reports validated important findings:

- read every report yourself;
- consolidate raw findings into high-level root causes;
- remove duplicates, false positives, and low-importance noise;
- pass the consolidated findings to a fresh subagent for independent analysis and prioritization;
- compare the subagent feedback against your own read;
- decide which findings are valid, important, and worth fixing;
- fix all validated important findings properly;
- do not apply Clawpatch auto-fixes blindly;
- rerun all relevant tests, build, browser QA, package install checks, and performance checks;
- rerun or refresh review if the fixes materially change architecture;
- commit the validated review fixes as a coherent batch using the ship discipline;
- document final residual risk.

Then, after all validated Clawpatch findings are fixed and checks pass:

- ask a fresh subagent for a final full-codebase perspective;
- provide it with the final codebase state, Clawpatch summary, fixes made, tests run, browser QA results, package/release state, and known residual risk;
- address any final validated important feedback;
- rerun checks affected by any final changes;
- make a final coherent commit if changes were made;
- only then declare completion.

## Styling Requirements

Visual direction:

- compact;
- modern;
- dense;
- technical;
- low radius;
- crisp typography;
- restrained color;
- clear hierarchy;
- small controls;
- predictable spacing;
- no decorative gradients;
- no visual fluff;
- no card-in-card feel;
- no large marketing UI.

Default typeface:

```css
font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

If bundling Geist Mono is too heavy for the library itself, document the expected font loading approach and keep fallback sane. Do not block the library on font loading.

Use modern CSS:

- CSS custom properties;
- cascade layers if helpful;
- `contain`;
- `content-visibility` where appropriate;
- fixed control heights;
- stable pane width;
- no layout shift during interactions;
- no scroll flicker;
- no accidental text selection;
- text selection allowed only in text inputs/textareas;
- pointer cursors and focus states must be polished.

Avoid broad theme-builder infrastructure unless all production requirements are already complete. A small, well-designed token set is enough.

## Accessibility And Input

Although this is a developer/debug tool, it should still be solid:

- labels tied to controls;
- keyboard focus works;
- Escape/Enter behavior is sensible;
- tab order is predictable;
- inputs expose appropriate native semantics;
- buttons are real buttons;
- text fields are real inputs/textareas;
- color input has text fallback;
- pointer capture is handled correctly for sliders/ranges;
- no page scroll hijack while dragging controls;
- cleanup listeners on dispose.

## Internal Engineering Rules

- Prefer direct, typed code over abstract machinery.
- Use discriminated unions for component definitions.
- Use branded IDs or stable internal IDs where useful.
- Keep component lifecycle explicit: create, mount, update, dispose.
- Keep hot-path telemetry separate from DOM controls.
- Keep state ownership clear.
- Avoid mutation leaks between panes.
- Avoid global singleton state except an explicit manager instance.
- Make disposal deterministic.
- Make errors contextual.
- Validate public inputs.
- Keep runtime errors from one control from breaking the pane.

## Suggested Internal Model

Possible core types:

```ts
type CfgScheduler = "external" | "internal";

interface CfgOptions {
  scheduler?: CfgScheduler;
  root?: HTMLElement;
  position?: "top-right";
}

interface PaneOptions {
  id?: string;
  title: string;
  width?: number;
  collapsed?: boolean;
}

interface FrameContext {
  time: number;
  delta: number;
  frame: number;
}

interface Disposable {
  dispose(): void;
}
```

Possible root:

```ts
const cfg = createCfg(options);
const pane = cfg.pane(options);

cfg.beginFrame(time);
cfg.endFrame(time);
cfg.renderFrame(time);
cfg.dispose();
```

Possible control handle:

```ts
interface Control<T> extends Disposable {
  get(): T;
  set(value: T): void;
  refresh(): void;
  on(event: "change", handler: (value: T) => void): () => void;
}
```

This is guidance, but the implemented public API must satisfy the Minimum Public API Contract above and all public examples must compile.

## Testing

Write meaningful tests for:

- value binding;
- control value validation;
- number clamping;
- slider step handling;
- select option validation;
- import/export roundtrip;
- reset behavior;
- multi-pane registration;
- pane layout slot assignment;
- disposal cleanup;
- telemetry ring buffer;
- profiler begin/end pairing;
- frame lifecycle;
- external scheduler mode;
- hidden/collapsed behavior.

Use browser-like tests only where necessary. Do not make the test setup heavier than the library.

## Documentation

Create:

- `README.md`;
- `docs/architecture.md`;
- `docs/framework-adapters.md`;
- `docs/performance.md`;
- `docs/comparisons.md`;

`README.md` should include:

- what `cfg` is;
- installation from GitHub tag;
- quick start;
- external RAF example;
- multi-pane example;
- controls example;
- telemetry example;
- import/export example;
- demo instructions;
- check/build/test instructions.

`architecture.md` should explain:

- manager;
- panes;
- controls;
- telemetry lane;
- scheduler;
- lifecycle;
- disposal;
- multi-pane layout.

`framework-adapters.md` should explain:

- why `v1.0` is vanilla-first;
- which core APIs future adapters should wrap;
- how React/Next/Svelte adapters should attach/detach lifecycle;
- how adapters should avoid duplicate RAF loops;
- how adapters should share the core telemetry/profiler engine;
- how SSR-safe imports should work.

`performance.md` should explain:

- no full refresh;
- no hot-path allocation;
- canvas graphs;
- typed ring buffers;
- throttled text;
- visibility gating;
- frame budget goals.

`comparisons.md` should compare:

- Tweakpane;
- Leva;
- lil-gui;
- dat.GUI;
- Tweakpane Essentials;
- Tweakpane profiler plugins.

Be factual and fair. Do not dunk on other libraries. Explain why `cfg` has a different target.

## Definition Of Done For v1.0

`v1.0` is done only when:

- the library builds as ESM;
- types are emitted;
- demo runs in Vite;
- all required `v1.0` controls exist;
- segmented/radio, radio grid, and button group controls work in demo and tests;
- vector2, vector3, vector4, and xy pad controls work in demo and tests;
- cubic Bezier/easing, image/asset, and palette/swatch controls work in demo and tests;
- buffered log monitors and multi-series/waveform graphs work in demo and tests;
- multiple panes stack correctly from top-right toward the left;
- real-browser QA has been completed against the demo;
- screenshots have been captured for key demo states;
- browser console is clean during demo interactions;
- external RAF mode works;
- FPS graph updates from the host loop;
- frame graph updates from the host loop;
- profiler can measure named blocks;
- import/export works;
- disposal works;
- tests pass;
- `bun run util:check` passes;
- GitHub CI passes;
- README and architecture docs are accurate;
- release artifact workflow exists;
- private `u29dc/cfg` GitHub repository exists;
- `origin` points to `u29dc/cfg`;
- main branch is pushed;
- `v1.0.0` tag is pushed;
- GitHub release for `v1.0.0` exists;
- GitHub Actions CI passes on the pushed commit/tag;
- clean temporary install from `github:u29dc/cfg#v1.0.0` succeeds;
- temporary project can import `createCfg` and `cfg/styles.css`;
- package exports, types, files, and CSS entry are verified;
- package is safe to import in SSR/module evaluation contexts;
- default styling is CSP-compatible without runtime style injection;
- performance notes describe measured behavior and residual risk;
- downstream `_www_template` integration dry run was completed;
- `_www_template` dry run did not commit or push changes;
- any `cfg` gaps found during `_www_template` integration were fixed in `cfg`;
- final install tag was verified inside `_www_template` or a disposable `_www_template` worktree/clone;
- phased execution checklist was completed;
- subagent reviews were requested at major phases where available;
- final Clawpatch read-only review was run;
- validated important Clawpatch findings were manually reviewed;
- consolidated Clawpatch findings were sent to a fresh subagent for analysis;
- validated important findings were fixed or explicitly documented as residual risk;
- final checks were rerun after Clawpatch-related fixes;
- final fresh subagent full-codebase review was completed after Clawpatch fixes;
- final ship flow committed and pushed the completed repository.

## Anti-Goals For v1.0

Do not build:

- a full website;
- a CMS;
- routing;
- React bindings in the core `v1.0` delivery;
- Next.js bindings in the core `v1.0` delivery;
- Svelte bindings in the core `v1.0` delivery;
- Vue bindings in the core `v1.0` delivery;
- npm publishing automation;
- full external plugin marketplace;
- a heavy visual theme-builder product;
- a massive observability suite that compromises the core frame budget;
- a full DevTools replacement;
- a huge benchmark suite if a focused honest one is enough.

## Final Instruction

Build `cfg` as a finished production `v1.0` release candidate.

The goal is not to produce a prototype and defer the hard parts. The goal is to create a clean, strict, beautiful, fast, full-featured controls and diagnostics library that can replace Tweakpane in a high-craft website template after one serious overnight build-and-polish pass.

The intended morning outcome is that Han can open `_www_template`, add:

```json
{
  "dependencies": {
    "cfg": "github:u29dc/cfg#v1.0.0"
  }
}
```

import `cfg/styles.css`, replace the current Tweakpane wiring, and start integrating without discovering that the library is only a prototype.
