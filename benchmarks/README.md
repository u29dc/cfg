# Benchmarks

Run `bun run bench` after `bun run build`.

The runner serves `dist` directly in headless Chromium, measures host RAF callback overhead across
baseline, pane, telemetry, profiler, many-control, and collapsed-pane scenarios, then writes JSON to
`artifacts/performance/`.

Current local evidence is summarized in `docs/performance.md`.
