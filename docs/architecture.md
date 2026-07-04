# Architecture

`cfg` is a vanilla TypeScript runtime controls and diagnostics library. It uses
Bun workspaces for source boundaries while keeping the root package as the
single production install target.

```text
packages/core      framework-free engine, types, settings, buffers, profiler
packages/vanilla   DOM controls, panes, canvas surfaces, default CSS
dist/              committed root package output for GitHub tag installs
```

The shipped root package has zero runtime dependencies. Internal workspaces are
build-time boundaries only; downstream projects import `cfg` and
`cfg/styles.css`.

## Manager

`createCfg()` returns a manager. It owns:

- one root element with `cfg-root`;
- one `Engine` instance;
- registered panes and controls;
- the current theme mode;
- the scheduler bridge for external or internal RAF usage.

The manager is SSR-safe at module evaluation time. Importing `cfg` does not touch
`window`, `document`, canvas, or RAF. Creating an instance requires a browser
document or an explicit root element.

```ts
const cfg = createCfg({
  scheduler: "external",
  theme: "system",
});
```

The manager exposes the public frame lifecycle:

```ts
cfg.beginFrame(time);
cfg.endFrame(time);
cfg.renderFrame(time);
```

It also owns settings:

```ts
cfg.exportSettings();
cfg.applySettings(snapshot);
cfg.resetSettings();
cfg.copySettings();
```

## Panes

`cfg.pane()` creates a top-level pane. Top-level panes are appended to the root
and displayed as a horizontal stack from the top-right toward the left. This
keeps telemetry and runtime controls visible at the same time without requiring
the host application to manage layout slots.

Panes can contain folders, tabs, controls, monitors, graphs, and profiler
surfaces. Folders are nested panes with the same lifecycle and collapse model.

```ts
const runtime = cfg.pane({ id: "runtime", title: "Runtime" });
const telemetry = cfg.pane({ id: "telemetry", title: "Telemetry" });
```

Collapse state is local to the pane. Collapsed or hidden panes remain registered,
but visible canvas drawing is skipped through `owner.visible()`.

## Controls

Every control extends the same small contract:

```ts
interface Control<T> {
  readonly id: string;
  readonly label: string;
  readonly element: HTMLElement;
  get(): T;
  set(value: T): void;
  refresh(): void;
  dispose(): void;
  on(event: "input" | "change", handler: (value: T) => void): () => void;
}
```

Controls bind to user-provided objects through a typed `Binding`. The binding
normalizes values before writing them back:

- booleans are coerced through toggle validation;
- numbers are finite, clamped, and snapped;
- choices reject unknown imported values unless `allowUnknown` is explicit;
- vectors normalize object and tuple-like values;
- colors reject invalid strings before committing drafts;
- image controls avoid retaining object URLs after clear or disposal.

The control lane is event-driven. User input updates the bound object, rerenders
only the affected control, and emits `input` or `change`.

## Tabs

Tabs own real page panes, not just visual button state. A tab group contains a
button row and one pane per page. Inactive pages are hidden and excluded from
visible telemetry work; active pages are refreshed when they become visible so
canvas backing stores match their final layout.

```ts
const views = pane.tab({ id: "views", tabs: ["Main", "Debug"] });
views.page("Main").monitor({ label: "State", get: () => state.mode });
views.page("Debug").monitor({ label: "Frame", get: () => frameCount });
```

## Telemetry Lane

The telemetry lane is separate from regular controls. It handles:

- FPS and frame-time sampling;
- multi-series numeric graphs;
- waveform graphs;
- bounded text logs;
- profiler entries and rolling summaries.

Numeric graph data is stored in fixed-size typed ring buffers. Canvas surfaces
draw only when dirty and visible. Text monitors and logs are throttled by
default so a human-readable readout cannot become a per-frame DOM workload.

The profiler tracks named sections:

```ts
profiler.begin("update");
update();
profiler.end("update");

profiler.measure("draw", () => draw());
```

Profiler entries keep latest, average, and max values. The visible control draws
compact bars and a short textual summary.

## Scheduler

External scheduler mode is the default and preferred model:

```ts
const cfg = createCfg({ scheduler: "external" });
```

In this mode `cfg` never starts its own RAF loop. The host calls
`beginFrame()`, `endFrame()`, and `renderFrame()` from the real animation loop.
This avoids duplicate loops and lets `cfg` report on the actual application
frame.

Internal scheduler mode is opt-in:

```ts
const cfg = createCfg({ scheduler: "internal" });
cfg.start();
cfg.stop();
```

It is intended for standalone demos and simple pages, not for a site that already
has a central runtime loop.

## Lifecycle

The lifecycle is deliberately small:

1. Import `cfg` and `cfg/styles.css`.
2. Create a manager after a browser document exists.
3. Add panes and controls.
4. Feed the frame lifecycle if using external scheduler mode.
5. Call `dispose()` on route teardown, hot reload cleanup, or test cleanup.

`dispose()` stops internal scheduling, unregisters panes and controls, clears
runtime item sets, removes an owned root, and releases control cleanups.

## Static CSS And CSP

`cfg` exists partly to avoid runtime style injection. The default skin is a
static CSS file:

```ts
import "cfg/styles.css";
```

The vanilla adapter does not inject `<style>` tags, use `eval`, use
`new Function`, or require an external font CDN. Layout and themes are driven by
classes, data attributes, and CSS custom properties in the static stylesheet.

The default CSS skin adapts Tweakpane's MIT-licensed compact theme mechanics to
`cfg` class names and DOM. The shipped CSS preserves the Tweakpane MIT notice and
keeps Geist Mono as the intentional `cfg` font choice. This is a styling
derivative only; `cfg` does not embed Tweakpane's JavaScript runtime, plugin
system, or class names.

Theme mode is managed at the root with `data-cfg-theme` and exposed through
`createCfg({ theme })`, `cfg.getTheme()`, and `cfg.setTheme(theme)`. The default
mode is `system`; explicit `light` and `dark` modes are for host theme toggles.

## Default Skin Tokens

The skin uses compact Tweakpane-like density with `cfg` tokens:

- `--cfg-font-size-root`;
- `--cfg-font-size-title`;
- `--cfg-font-size-control`;
- `--cfg-font-size-axis`;
- `--cfg-font-size-readout`;
- `--cfg-unit`;
- `--cfg-unit-gap`;
- `--cfg-pane-width`;
- `--cfg-pad-size`;
- `--cfg-graph-height`;
- `--cfg-profiler-height`.

Controls and buttons use the 12px control tier so numeric values stay readable
without changing pane density or relying on per-control font-size overrides.

## Canvas Surfaces

Graphs, profiler bars, the XY pad, color maps, and cubic Bezier editor are
canvas-backed. Canvas sizing is centralized in `utils/canvas.ts`:

- backing stores are scaled by clamped device pixel ratio;
- layout size is read from `getBoundingClientRect()`;
- `ResizeObserver` handles pane width changes;
- a short first-layout sync handles stylesheet and visibility settlement;
- hidden tab pages and expanded folders refresh visible canvases.

This keeps draw math local while avoiding stretched first-paint bitmaps.

## Package Boundary

`packages/core` contains no DOM-specific implementation. It is the boundary that
future adapters should wrap:

- public types;
- settings import/export;
- frame lifecycle;
- fixed-size buffers;
- profiler accounting;
- math, DOM-neutral parsing, and theme constants.

`packages/vanilla` is the only v1 adapter. It maps the core model to DOM controls
and canvas rendering.

Future adapters should depend on the shared core concepts and wrap lifecycle
instead of reimplementing telemetry or profiler behavior.
