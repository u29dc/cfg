# Ecosystem Comparisons

`cfg` is in the runtime-control pane family, but it has a narrower target than
most existing tools: compact controls plus first-class frame diagnostics for
custom animation loops.

The comparison below is not a ranking. Tweakpane, Leva, lil-gui, dat.GUI, and
Tweakpane plugins are useful, proven tools with different goals.

## Summary

| Tool | Strong fit | `cfg` difference |
| --- | --- | --- |
| Tweakpane | Tasteful compact controls and blades | `cfg` adds RAF-native telemetry and avoids runtime style injection |
| Leva | React state/schema authoring | `cfg` is framework-free and does not put React on frame paths |
| lil-gui | Small immediate controls | `cfg` adds typed settings, richer controls, and diagnostics |
| dat.GUI | Classic simple debugging UI | `cfg` targets modern ESM, static CSS, and denser diagnostics |
| Tweakpane Essentials | Useful graph/plugin controls | `cfg` keeps key telemetry in the core package |
| Tweakpane profiler plugins | Compact profiling ideas | `cfg` integrates profiler accounting with the frame lifecycle |

## Tweakpane

Reference:

- <https://github.com/cocopon/tweakpane>
- <https://tweakpane.github.io/docs/>

Tweakpane is the strongest visual and interaction reference. It has a compact
pane model, clear blade hierarchy, good defaults, and a large enough user base to
prove that dense debug UI can still feel polished.

`cfg` follows these lessons:

- compact pane and folder density;
- subdued light and dark defaults;
- explicit labels with controls aligned to the right;
- state import/export as a first-class workflow;
- small animation details for collapse and interaction feedback.

`cfg` intentionally differs:

- telemetry is part of the core package, not a plugin afterthought;
- external RAF integration is a primary API shape;
- graph data uses fixed-size typed buffers;
- text monitors are throttled;
- styling is imported as static CSS rather than injected at runtime;
- no generic plugin host is included in v1.

The default CSS skin adapts Tweakpane's MIT-licensed compact theme mechanics to
`cfg` class names and DOM, and the stylesheet carries the MIT notice. The
JavaScript runtime, plugin system, and class names are not copied.

## Leva

Reference:

- <https://github.com/pmndrs/leva>

Leva is a strong fit for React and React Three Fiber projects. Its schema/store
model is convenient when controls are part of a React application and the
developer wants declarative control definitions.

`cfg` follows these lessons:

- controls should be quick to declare;
- bound values should remain easy to inspect;
- grouping and folders matter;
- future adapters should have a clean state boundary.

`cfg` intentionally differs:

- v1 is not a React component library;
- controls bind to plain objects and handles;
- framework adapters must be optional wrappers;
- React state is not required for per-frame telemetry;
- external RAF data stays outside framework render cycles.

## lil-gui

Reference:

- <https://github.com/georgealways/lil-gui>

lil-gui is a small, practical successor-style tool for simple runtime tweaking.
It is easy to add and easy to understand.

`cfg` follows these lessons:

- small API surface;
- direct object binding;
- low ceremony for booleans, numbers, strings, and choices.

`cfg` intentionally differs:

- includes typed settings snapshots;
- includes vector, XY pad, Bezier, image, palette, and color controls;
- includes RAF-aware graphs and profiler surfaces;
- uses the project-specific compact skin instead of generic browser controls;
- treats package, CSS, and SSR boundaries as release surfaces.

## dat.GUI

Reference:

- <https://github.com/dataarts/dat.gui>

dat.GUI is the classic runtime debugging pane. It is familiar and simple, but it
comes from an earlier JavaScript packaging and styling era.

`cfg` follows these lessons:

- simple direct controls still matter;
- debugging panes should be disposable;
- small local runtime tools should not require an application framework.

`cfg` intentionally differs:

- ESM-first package with type declarations;
- static CSS import;
- no runtime dependencies;
- modern browser QA and package install verification;
- frame diagnostics are core behavior.

## Tweakpane Essentials

Reference:

- <https://github.com/tweakpane/plugin-essentials>

Tweakpane Essentials shows that graphs and richer controls are useful in the
Tweakpane ecosystem. It also shows the tradeoff of relying on plugins for
diagnostics that an animation runtime may need every day.

`cfg` follows these lessons:

- graphs should be compact;
- FPS and frame-time readouts should be close to controls;
- diagnostics should be visible without opening browser DevTools.

`cfg` intentionally differs:

- FPS and frame-time graphs are first-party;
- multi-series waveform graphs are first-party;
- graph sampling is designed around the host frame lifecycle;
- plugin loading and plugin compatibility are out of scope for v1.

## Tweakpane Profiler Plugins

References:

- <https://github.com/0b5vr/tweakpane-plugin-profiler>

Profiler plugins prove that small in-pane profiling surfaces can be useful while
tuning visual work.

`cfg` follows these lessons:

- labels should be short and readable;
- latest, average, and max values are more useful than a single number;
- profiler output must stay compact.

`cfg` intentionally differs:

- profiler accounting is shared with `cfg.beginFrame()` and `cfg.endFrame()`;
- `measure(label, fn)` and manual `begin()`/`end()` use the same model;
- hidden panes skip visible rendering;
- profiler display is designed not to become the workload being measured.

## Why No Plugin Marketplace In v1

The v1 goal is a lean replacement for a Tweakpane setup in a high-craft website
template. A plugin host would add API surface, compatibility questions, docs,
tests, and performance risk before the core replacement is proven.

The extension path is instead:

- keep `packages/core` framework-free;
- keep controls modular inside `packages/vanilla`;
- keep future framework adapters outside the root runtime;
- document advanced color and telemetry seams without shipping unstable plugin
  contracts.
