# Performance

`cfg` is designed for pages that already care about frame budget. It must not
become the thing that makes the frame budget worse.

The performance model is a strict split:

- controls are event-driven;
- telemetry sampling is fixed-size and allocation-conscious;
- canvas surfaces draw only when dirty and visible;
- text readouts are throttled;
- hidden and collapsed panes skip visible work.

## Frame Budget Goals

The target is not "zero cost"; it is predictable and small overhead:

- no hidden RAF loop in external scheduler mode;
- no full pane refresh from `renderFrame()`;
- no per-sample DOM nodes;
- no SVG graph point churn;
- no telemetry network calls;
- no layout reads in graph draw loops;
- no unbounded log or history growth.

Local benchmark data is expected to stay well below 1ms average overhead for the
representative demo scenarios. Re-run on the target host because browser,
display refresh rate, and hardware matter.

## External Scheduler

External mode is the default:

```ts
const cfg = createCfg({ scheduler: "external" });
```

The host loop controls timing:

```ts
function loop(time: number) {
  cfg.beginFrame(time);
  update();
  render();
  cfg.endFrame(time);
  cfg.renderFrame(time);
  requestAnimationFrame(loop);
}
```

This avoids a duplicate RAF loop. It also means FPS, frame-time, and profiler
surfaces describe the real host loop rather than a separate library clock.

## Hot Path Rules

The per-frame path is intentionally small:

- `Engine.beginFrame(time)` records the frame sample and FPS sample;
- registered profilers receive frame begin;
- `Engine.endFrame()` records duration and frame graph samples;
- `Engine.renderFrame(time)` asks renderable controls to draw if dirty.

Graph samples are stored in fixed-size typed ring buffers. Pushing a numeric
sample does not create DOM nodes or grow arrays without bound.

## Canvas Graphs

Graphs, XY pad, Bezier editor, color picker surfaces, and profiler bars are
canvas-backed.

Canvas fitting is centralized:

- backing stores scale by clamped device pixel ratio;
- layout is read through `getBoundingClientRect()`;
- `ResizeObserver` resyncs when pane widths change;
- a short first-layout sync handles CSS and visibility settlement;
- hidden tab pages refresh when shown.

The graph draw path receives already-sized canvas dimensions and draws lines,
target guides, bars, and markers directly.

## Text Readouts

Text monitors and logs are useful, but DOM text is not the right surface for
high-frequency numeric streams. `monitor()` and `logMonitor()` throttle visible
updates by default.

Use canvas graphs for per-frame data. Use logs for human-readable events:

```ts
const log = pane.logMonitor({ rows: 5, bufferSize: 50 });
log.push("loaded shader cache");
```

The log keeps newest messages when the buffer is full.

## Visibility Gating

Every visible render checks pane visibility:

- collapsed panes are hidden from visible drawing;
- hidden tab pages are hidden from visible drawing;
- disposed panes unregister controls;
- off-pane telemetry state can keep sampling, but visible drawing is skipped.

This lets a user collapse a diagnostics pane without paying the full canvas draw
cost.

## Settings And Import

Settings export/import runs on user action, not frame paths. Imports validate
values before committing them. If one imported value fails validation, earlier
values from the same import are rolled back.

Telemetry buffers are not serialized by default.

## Browser APIs

Current v1 uses:

- RAF timestamp supplied by the host or internal scheduler;
- `performance.now()` through the engine clock;
- `ResizeObserver` for canvas resize synchronization;
- static canvas and DOM APIs.

Long Animation Frames, Long Tasks, Event Timing, Layout Shift, and Resource
Timing are intentionally not first-party v1 panels. They can be useful, but
their signal and browser support need product-specific interpretation. Adding
them later should happen behind focused surfaces, not a broad dashboard.

## Benchmark Runner

Run:

```sh
bun run build
bun run bench
```

The benchmark serves the built `dist` bundle directly in headless Chromium and
records JSON under `artifacts/performance/`. It measures RAF callback cost for:

- host baseline;
- one pane without telemetry;
- three panes without telemetry;
- active FPS/frame graphs;
- active profiler;
- many controls;
- collapsed telemetry pane.

Latest local run:

| Scenario | Average | p95 | Max |
| --- | ---: | ---: | ---: |
| host baseline | `0.002ms` | `0ms` | `0.1ms` |
| one pane, no telemetry | `0.018ms` | `0.1ms` | `0.2ms` |
| three panes, no telemetry | `0.017ms` | `0.1ms` | `0.2ms` |
| FPS graph active | `0.371ms` | `0.6ms` | `0.7ms` |
| profiler active | `0.223ms` | `0.6ms` | `0.7ms` |
| many controls | `0.012ms` | `0.1ms` | `0.2ms` |
| collapsed pane | `0.02ms` | `0.1ms` | `0.1ms` |

Artifact:

```text
artifacts/performance/benchmark-2026-07-05T01-07-29.557Z.json
```

Environment:

- browser: HeadlessChrome 149.0.7827.55;
- measured frames: 180;
- warmup frames: 30.

These numbers are local evidence, not a universal guarantee. Re-run the
benchmark and browser QA on the target machine before treating them as a
performance budget.

## Manual QA Evidence

Recent browser QA captured:

- canvas first-paint DPR-2 backing-store verification;
- hidden pane scrollbar check;
- full-width pad/easing canvases;
- graph readouts and profiler/log layout;
- image clear behavior;
- mobile compact typography.

Artifacts live under `artifacts/browser-qa/` and are ignored by Git by default.

## Residual Risk

Known residual risks before release:

- GitHub Actions is currently disabled for `u29dc/cfg` by repository or
  organization policy, so remote CI cannot yet prove the pushed commit or tag.
- Clean install from `github:u29dc/cfg#v1.0.0` still needs final verification in
  the intended private-repository auth path before the release can be called
  complete.
- `_www_template` integration passed from a disposable local tarball dry run;
  repeat it from the final GitHub tag once private tag installation is unblocked.
- Clawpatch and final subagent review may identify additional performance or
  architecture fixes.
