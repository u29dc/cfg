# Architecture

`cfg` uses Bun workspaces while keeping the repository root as the installable `cfg` package. `packages/core` owns the framework-free engine and `packages/vanilla` adapts that engine to DOM controls and canvas telemetry.

Runtime dependencies are currently zero in the shipped root package. Internal workspaces are build-time source boundaries only; the release tag commits `dist/` so downstream GitHub installs do not run a build.

The runtime is split into three lanes:

- control lane: event-driven DOM controls and settings;
- telemetry lane: per-frame typed buffers and canvas drawing;
- readout lane: throttled text monitors for human-readable diagnostics.

## Default Skin

The default CSS skin intentionally adapts Tweakpane's MIT-licensed compact theme
mechanics to cfg's own class names and DOM. The shipped CSS preserves the
Tweakpane MIT notice and keeps Geist Mono as cfg's default font. This is a
styling derivative only; cfg does not embed Tweakpane's JavaScript runtime,
plugin system, or class names.

Theme mode is managed at the cfg root with `data-cfg-theme` and exposed through
`createCfg({ theme })`, `cfg.getTheme()`, and `cfg.setTheme(theme)`. The default
theme is `system`, while explicit `light` and `dark` modes are intended for host
theme toggles such as `_www_template`'s site-wide theme switch.

The default skin keeps Tweakpane's compact 11px root scale as the label baseline,
then uses explicit CSS typography tokens for cfg's Geist Mono adjustment:
`--cfg-font-size-root`, `--cfg-font-size-title`, `--cfg-font-size-control`,
`--cfg-font-size-axis`, and `--cfg-font-size-readout`. Controls and buttons use
the 12px control tier so numeric values stay readable without changing pane
density or relying on ad hoc per-control font sizes.

This document will be expanded as the implementation lands.
