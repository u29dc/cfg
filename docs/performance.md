# Performance

`cfg` is designed around a strict split between event-driven controls and per-frame telemetry.

Performance rules:

- no full pane refresh in `renderFrame()`;
- no per-sample DOM or SVG graph rendering;
- no forced layout reads in telemetry hot paths;
- fixed-size typed buffers for numeric samples;
- canvas rendering only for dirty visible graphs;
- throttled DOM text readouts by default;
- hidden or collapsed panes skip visible canvas drawing.

## Benchmark Runner

Run:

```sh
bun run build
bun run bench
```

The benchmark serves the built `dist` bundle directly in headless Chromium and records JSON under
`artifacts/performance/`. It measures RAF callback cost for:

- host baseline;
- one pane without telemetry;
- three panes without telemetry;
- active FPS/frame graphs;
- active profiler;
- many controls;
- collapsed telemetry pane.

Latest local run:

- artifact: `artifacts/performance/benchmark-2026-07-04T22-30-36.102Z.json`;
- browser: HeadlessChrome 149.0.7827.55;
- frames: 180 measured after 30 warmup frames;
- host baseline average: `0.001ms`;
- one pane, no telemetry average: `0.007ms`;
- three panes, no telemetry average: `0.005ms`;
- FPS graph active average/p95/max: `0.076ms / 0.2ms / 0.2ms`;
- profiler active average/p95/max: `0.05ms / 0.1ms / 0.2ms`;
- many controls average: `0.007ms`;
- collapsed pane average: `0.009ms`.

These numbers are local evidence, not a universal guarantee. Re-run on the target browser/machine
before treating them as a performance budget.
