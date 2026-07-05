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
bun add github:u29dc/cfg#v1.0.3
```

If private-repo auth requires SSH:

```sh
bun add git+ssh://git@github.com/u29dc/cfg.git#v1.0.3
```

## Quick Start

```ts
import { createCfg } from "cfg";
import "cfg/styles.css";

const state = {
  enabled: true,
  speed: 1,
  label: "runtime",
};

const cfg = createCfg({ scheduler: "external" });
const pane = cfg.pane({ title: "Runtime" });

pane.toggle(state, "enabled", { label: "Enabled" });
pane.numberSlider(state, "speed", {
  label: "Speed",
  min: 0,
  max: 4,
  step: 0.01,
});
pane.text(state, "label", { label: "Label" });
```

Call `dispose()` when the host page or route is torn down:

```ts
cfg.dispose();
```

## External RAF

`cfg` defaults to external scheduler mode. It does not create a hidden RAF loop.
Wire it into the host loop:

```ts
const cfg = createCfg({ scheduler: "external" });
const perf = cfg.pane({ title: "Performance" });
const fps = perf.fpsGraph({ label: "FPS", min: 0, max: 144, target: 60 });
const frame = perf.frameGraph({ label: "Frame", min: 0, max: 40, target: 16.67 });
const profiler = perf.profiler({ label: "Profiler" });

function loop(time: number) {
  cfg.beginFrame(time);

  profiler.measure("draw", () => {
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
const cfg = createCfg({ scheduler: "internal" });
cfg.start();
```

## Multiple Panes

Panes stack from the top-right toward the left:

```ts
const controls = cfg.pane({ id: "runtime", title: "Runtime" });
const telemetry = cfg.pane({ id: "telemetry", title: "Telemetry" });

controls.folder("Basics").toggle(state, "enabled");
telemetry.fpsGraph({ label: "FPS", target: 60 });
```

## Controls

The vanilla adapter includes the v1 controls used by the demo:

```ts
const basics = pane.folder("Basics");
basics.toggle(state, "enabled");
basics.number(state, "speed", { min: 0, max: 4, step: 0.01 });
basics.slider(state, "gain", { min: 0, max: 1, step: 0.001 });
basics.numberSlider(state, "speed", { min: 0, max: 4, step: 0.01 });
basics.text(state, "label");
basics.multiline(state, "notes", { rows: 3 });

const choices = pane.folder("Choices");
choices.segmented(state, "mode", { options: ["calm", "normal", "intense"] });
choices.select(state, "density", { options: ["low", "medium", "high"] });
choices.radioGrid(state, "place", {
  columns: 2,
  options: ["nw", "ne", "sw", "se"],
});

const vectors = pane.folder("Vectors");
vectors.vector2(state, "point");
vectors.vector3(state, "position");
vectors.vector4(state, "rotation");
vectors.xyPad(state, "point", { min: -1, max: 1, step: 0.01 });
vectors.interval(state, "range", { min: 0, max: 100, step: 1 });
vectors.cubicBezier(state, "easing");

const color = pane.folder("Color");
color.color(state, "color", { alpha: true });
color.palette(state, "accent", {
  colors: ["#78a6ff", "#ffcc66", "#ff6b8b", "#7ee787"],
});
color.image(state, "image", { accept: "image/png,image/jpeg,image/webp" });
```

Tabs own real page panes:

```ts
const views = pane.tab({ id: "views", tabs: ["Main", "Debug"] });
views.page("Main").monitor({ label: "State", get: () => state.mode });
views.page("Debug").monitor({ label: "Frame", get: () => frameCount });
```

## Telemetry

Telemetry controls are designed for frame diagnostics, not general dashboards:

```ts
const log = telemetry.logMonitor({ label: "Events", rows: 5, bufferSize: 50 });
const wave = telemetry.waveformGraph({
  label: "Wave",
  min: -1,
  max: 1,
  series: [{ label: "sin" }, { label: "cos" }],
});

log.push("scene loaded");
wave.push([Math.sin(time), Math.cos(time)]);
```

Text monitors are throttled by default:

```ts
telemetry.monitor({
  label: "Work ms",
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
const cfg = createCfg({ theme: "system" });

cfg.setTheme("dark");
cfg.setTheme("light");
cfg.setTheme("system");
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

Performance evidence:

```sh
bun run build
bun run bench
```

## More

- [Agent instructions](AGENTS.md)
- [Architecture](docs/architecture.md)
- [Performance](docs/performance.md)
- [Framework adapters](docs/framework-adapters.md)
- [Ecosystem comparisons](docs/comparisons.md)
