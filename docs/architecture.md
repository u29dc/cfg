# Architecture

`cfg` uses Bun workspaces while keeping the repository root as the installable `cfg` package. `packages/core` owns the framework-free engine and `packages/vanilla` adapts that engine to DOM controls and canvas telemetry.

Runtime dependencies are currently zero in the shipped root package. Internal workspaces are build-time source boundaries only; the release tag commits `dist/` so downstream GitHub installs do not run a build.

The runtime is split into three lanes:

- control lane: event-driven DOM controls and settings;
- telemetry lane: per-frame typed buffers and canvas drawing;
- readout lane: throttled text monitors for human-readable diagnostics.

This document will be expanded as the implementation lands.
