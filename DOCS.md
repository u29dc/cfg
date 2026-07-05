# cfg Usage

`cfg` is a compact TypeScript runtime controls and diagnostics pane for
animation-heavy browser work, canvas/WebGL projects, and custom
`requestAnimationFrame` loops.

It provides Tweakpane-like runtime controls with first-class frame diagnostics:
FPS graphs, frame-time graphs, waveform graphs, bounded logs, and a small
profiler surface. The package ships as ESM with type declarations and static
CSS. It has no runtime dependencies.

This is the human-facing usage guide. Repo instructions live in
[`AGENTS.md`](AGENTS.md); [`README.md`](README.md) and [`CLAUDE.md`](CLAUDE.md)
intentionally symlink to that file.

The repository uses Bun workspaces internally:

- `packages/core` owns framework-free state, settings, buffers, frame lifecycle,
  and profiler accounting.
- `packages/vanilla` owns DOM controls, canvas surfaces, and default styling.
- the root package is the install target and commits `dist/` for GitHub tag
  installs.

## Install

From the private GitHub tag:

```sh
bun add github:u29dc/cfg#v1.0.5
```

If private-repo auth requires SSH:

```sh
bun add git+ssh://git@github.com/u29dc/cfg.git#v1.0.5
```

## Quick Start

```ts
import { createCfg } from 'cfg';
import 'cfg/styles.css';

const state = {
	enabled: true,
	speed: 1,
	label: 'runtime',
};

const cfg = createCfg({ scheduler: 'external' });
const pane = cfg.pane({ title: 'Runtime' });

pane.toggle(state, 'enabled', { label: 'Enabled' });
pane.numberSlider(state, 'speed', {
	label: 'Speed',
	min: 0,
	max: 4,
	step: 0.01,
});
pane.text(state, 'label', { label: 'Label' });
```

Call `dispose()` when the host page or route is torn down:

```ts
cfg.dispose();
```

## External RAF

`cfg` defaults to external scheduler mode. It does not create a hidden RAF loop.
Wire it into the host loop:

```ts
const cfg = createCfg({ scheduler: 'external' });
const perf = cfg.pane({ title: 'Performance' });
const fps = perf.fpsGraph({ label: 'FPS', min: 0, max: 144, target: 60 });
const frame = perf.frameGraph({ label: 'Frame', min: 0, max: 40, target: 16.67 });
const profiler = perf.profiler({ label: 'Profiler' });

function loop(time: number) {
	cfg.beginFrame(time);

	profiler.measure('draw', () => {
		drawScene(time);
	});

	cfg.endFrame(time);
	cfg.renderFrame(time);
	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

For a self-contained tool, opt into an internal RAF loop:

```ts
const cfg = createCfg({ scheduler: 'internal' });
cfg.start();
```

## Multiple Panes

Panes stack from the top-right toward the left:

```ts
const controls = cfg.pane({ id: 'runtime', title: 'Runtime' });
const telemetry = cfg.pane({ id: 'telemetry', title: 'Telemetry' });

controls.folder('Basics').toggle(state, 'enabled');
telemetry.fpsGraph({ label: 'FPS', target: 60 });
```

## Controls

The vanilla adapter includes the v1 controls used by the demo:

```ts
const basics = pane.folder('Basics');
basics.toggle(state, 'enabled');
basics.number(state, 'speed', { min: 0, max: 4, step: 0.01 });
basics.slider(state, 'gain', { min: 0, max: 1, step: 0.001 });
basics.numberSlider(state, 'speed', { min: 0, max: 4, step: 0.01 });
basics.text(state, 'label');
basics.multiline(state, 'notes', { rows: 3 });

const choices = pane.folder('Choices');
choices.segmented(state, 'mode', { options: ['calm', 'normal', 'intense'] });
choices.select(state, 'density', { options: ['low', 'medium', 'high'] });
choices.radioGrid(state, 'place', {
	columns: 2,
	options: ['nw', 'ne', 'sw', 'se'],
});

const vectors = pane.folder('Vectors');
vectors.vector2(state, 'point');
vectors.vector3(state, 'position');
vectors.vector4(state, 'rotation');
vectors.xyPad(state, 'point', { min: -1, max: 1, step: 0.01 });
vectors.interval(state, 'range', { min: 0, max: 100, step: 1 });
vectors.cubicBezier(state, 'easing');

const color = pane.folder('Color');
color.color(state, 'color', { alpha: true });
color.palette(state, 'accent', {
	colors: ['#78a6ff', '#ffcc66', '#ff6b8b', '#7ee787'],
});
color.image(state, 'image', { accept: 'image/png,image/jpeg,image/webp' });
```

Tabs own real page panes:

```ts
const views = pane.tab({ id: 'views', tabs: ['Main', 'Debug'] });
views.page('Main').monitor({ label: 'State', get: () => state.mode });
views.page('Debug').monitor({ label: 'Frame', get: () => frameCount });
```

## Telemetry

Telemetry controls are designed for frame diagnostics, not general dashboards:

```ts
const log = telemetry.logMonitor({ label: 'Events', rows: 5, bufferSize: 50 });
const wave = telemetry.waveformGraph({
	label: 'Wave',
	min: -1,
	max: 1,
	series: [{ label: 'sin' }, { label: 'cos' }],
});

log.push('scene loaded');
wave.push([Math.sin(time), Math.cos(time)]);
```

Text monitors are throttled by default:

```ts
telemetry.monitor({
	label: 'Work ms',
	get: () => workloadCost,
	format: (value) => `${value.toFixed(2)}ms`,
});
```

## Settings

Serializable controls participate in settings export/import. Telemetry buffers
are excluded by default.

```ts
const snapshot = cfg.exportSettings();
await cfg.copySettings();

cfg.applySettings(snapshot);
cfg.resetSettings();
```

## Theme

The default theme follows the system preference. Hosts can force or synchronize
the pane theme:

```ts
const cfg = createCfg({ theme: 'system' });

cfg.setTheme('dark');
cfg.setTheme('light');
cfg.setTheme('system');
```

## Demo And Checks

```sh
bun install
bun run dev
bun run build
bun test
bun run test:browser
bun run util:check
```

`build` produces the package artifacts in `dist/`. `util:check` is the fast
local aggregate: formatting, type-aware linting, typechecking, unit tests, the
package build, and package smoke. `test:browser` is explicit because it launches
Chromium through Vite and takes longer. Browser screenshots live in
`.tmp/tests/browser/`.

Performance evidence:

```sh
bun run build
bun run bench
```

## Architecture

`cfg` is split by package boundary, not by framework:

```text
packages/core      framework-free engine, types, settings, buffers, profiler
packages/vanilla   DOM controls, panes, canvas surfaces, default CSS
dist/              committed root package output for GitHub tag installs
```

`createCfg()` returns a manager that owns one engine, one owned `.cfg-root`
element, panes, controls, theme mode, settings, and either an external or
internal scheduler bridge. Imports are SSR-safe: module evaluation does not touch
`window`, `document`, canvas, or RAF.

When a `root` option is provided, `cfg` treats it as a host container and appends
an owned `.cfg-root` child. It does not mutate the supplied host into the root.
That keeps host sizing rules, such as a 20rem site dev panel, from squeezing
`cfg`'s internal pane stack.

Panes are top-level surfaces or nested folders. They contain controls, tabs,
monitors, graphs, and profiler surfaces. Hidden tab pages and collapsed panes
remain registered, but visible canvas drawing is skipped.

Controls share the same contract: `get()`, `set()`, `refresh()`, `dispose()`,
and `on("input" | "change", handler)`. Bound values are validated before being
written back: numbers are finite and clamped, choices reject unknown values,
vectors normalize object and tuple input, colors reject invalid strings, and
image controls release object URLs after clear or disposal.

Settings export/import uses stable internal IDs and excludes telemetry buffers.
If imported values fail validation, earlier writes from the same import are
rolled back.

The default skin is static CSS imported as `cfg/styles.css`. The vanilla adapter
does not inject `<style>` tags, use inline style attributes for normal layout,
use `eval`, use `new Function`, load external font CDNs, or send telemetry over
the network. Theme mode is carried by `data-cfg-theme` and can be `system`,
`light`, or `dark`.

Canvas sizing is centralized: backing stores are scaled by clamped DPR, layout is
read through `getBoundingClientRect()`, `ResizeObserver` handles width changes,
and first-layout sync avoids stretched first-paint bitmaps.

## Performance

The frame path is deliberately small:

- external scheduler mode creates no hidden RAF loop;
- controls update from user input or explicit refresh, not full pane refreshes;
- graph samples use fixed-size typed buffers;
- telemetry draws to canvas only when dirty and visible;
- text monitors and logs throttle DOM updates;
- collapsed panes and hidden tab pages skip visible rendering.

Run the local benchmark after building:

```sh
bun run build
bun run bench
```

The runner lives at `scripts/bench.ts`, serves `dist` directly in headless
Chromium, and writes JSON to `.tmp/bench/`.

Latest local evidence:

| Scenario                  |   Average |     p95 |     Max |
| ------------------------- | --------: | ------: | ------: |
| host baseline             | `0.002ms` |   `0ms` | `0.1ms` |
| one pane, no telemetry    | `0.013ms` | `0.1ms` | `0.3ms` |
| three panes, no telemetry | `0.014ms` | `0.1ms` | `0.1ms` |
| FPS graph active          | `0.228ms` | `0.6ms` | `0.7ms` |
| profiler active           | `0.159ms` | `0.4ms` | `0.7ms` |
| many controls             | `0.006ms` | `0.1ms` | `0.1ms` |
| collapsed pane            | `0.011ms` | `0.1ms` | `0.2ms` |

Artifact:

```text
.tmp/bench/benchmark-2026-07-05T09-14-27.758Z.json
```

These numbers are local evidence, not a universal guarantee. Re-run the
benchmark and browser QA on the target machine before treating them as a budget.

The build toolchain is explicit: Oxfmt formats, type-aware Oxlint lints,
`tsgo --noEmit` typechecks, Oxc minifies `dist/index.js`, and Lightning CSS
minifies `dist/styles.css`. Vite+ was reviewed as a possible future experiment,
but v1 keeps the release path explicit for committed `dist/`, GitHub tag
installs, and downstream smoke tests.

## Framework Adapters

`cfg` v1 is vanilla-first. Future adapters should wrap lifecycle and state, not
fork telemetry or profiler behavior.

Adapters should own:

- framework mount and unmount lifecycle;
- passing a root element when the host wants one;
- binding framework state to plain objects or callbacks;
- synchronizing host theme changes into `cfg.setTheme()`;
- forwarding the host RAF loop to `beginFrame()`, `endFrame()`, and
  `renderFrame()`.

Adapters should not own graph storage, profiler accounting, settings semantics,
canvas drawing, or a second RAF loop.

React and Next wrappers should create `cfg` only after client mount and dispose
from the effect cleanup. Svelte wrappers should create it in `onMount()`. Astro
projects should instantiate it only in client-side runtime code and wire it to
the central animation loop.

The disposable downstream-template dry run used a clean temporary checkout,
installed the local release-candidate tarball, replaced the Tweakpane dev pane
with `cfg`, and wired external scheduler calls into the existing app loop. It
passed `bun run util:check` and Chromium QA for `/?controls=1` and
`/about/?controls=1`, including clean console, strict CSP headers, theme
propagation, nonblank telemetry canvases, real profiler labels, and unsqueezed
pane widths. Screenshot evidence lives under `.tmp/tests/browser/`.

Likely future package names:

- `@u29dc/cfg-react`;
- `@u29dc/cfg-svelte`;
- `@u29dc/cfg-next`;
- `@u29dc/cfg-astro`.

The root `cfg` package should stay the lean vanilla install target.

## Ecosystem Notes

Tweakpane is the strongest visual and interaction reference: compact panes,
clear blade hierarchy, subtle light/dark defaults, state import/export, and good
density. `cfg` follows those lessons while making RAF-native telemetry,
fixed-size graph buffers, throttled text monitors, static CSS, and profiler
surfaces first-party.

Leva is excellent for React and React Three Fiber projects. `cfg` deliberately
does not put React state or React rendering on the per-frame path.

lil-gui and dat.GUI are useful for simple direct controls. `cfg` keeps that low
ceremony while adding typed settings, vector controls, color/image controls,
canvas graphs, and release-verified package boundaries.

Tweakpane Essentials and profiler plugins show that compact diagnostics are
valuable. `cfg` keeps FPS, frame-time, waveform, log, and profiler surfaces in
the core package instead of requiring a plugin marketplace in v1.

The default CSS skin uses cfg-owned class names and DOM while following compact
runtime-pane conventions: dense rows, clear hierarchy, restrained light/dark
contrast, and direct control states. The JavaScript runtime, plugin system, and
class names are cfg-specific.
