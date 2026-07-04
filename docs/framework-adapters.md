# Framework Adapters

`cfg` v1 is vanilla-first. Future React, Next, Svelte, Vue, or Astro adapters should wrap the core lifecycle rather than reimplementing controls or telemetry.

Adapters should:

- create the core manager after client mount;
- pass a host root element when needed;
- call `dispose()` on unmount;
- attach to the host RAF loop when one exists;
- avoid duplicate RAF loops;
- share the core profiler and telemetry engine.

This document will be expanded with pseudo-examples after the public API is finalized.
