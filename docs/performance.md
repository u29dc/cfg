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

Measured benchmark results and browser QA notes will be recorded after implementation.
