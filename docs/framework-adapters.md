# Framework Adapters

`cfg` v1 is vanilla-first. That is intentional.

The core problem is runtime control plus frame diagnostics inside animation-heavy
websites. The first release needs one precise browser adapter, not a set of thin
framework wrappers that duplicate lifecycle and telemetry rules.

Future adapters should wrap the core manager and vanilla lifecycle instead of
forking behavior.

## Adapter Boundary

An adapter should own only:

- framework mount and unmount lifecycle;
- passing a root element when the host wants one;
- binding framework state to plain objects or explicit callbacks;
- synchronizing host theme changes into `cfg.setTheme()`;
- connecting the host RAF loop to `cfg.beginFrame()`, `cfg.endFrame()`, and
  `cfg.renderFrame()`.

An adapter should not own:

- graph storage;
- profiler accounting;
- settings import/export semantics;
- validation rules;
- canvas drawing;
- a second RAF loop when the host already has one.

## Core APIs To Wrap

The important stable surface is small:

```ts
const cfg = createCfg({ root, scheduler: "external", theme: "system" });
const pane = cfg.pane({ title: "Runtime" });

cfg.beginFrame(time);
cfg.endFrame(time);
cfg.renderFrame(time);
cfg.dispose();
```

Control handles already expose refresh and cleanup:

```ts
const speed = pane.number(state, "speed", { min: 0, max: 4 });

speed.on("change", (value) => {
  console.log(value);
});

speed.refresh();
speed.dispose();
```

Adapters should keep these handles available when possible rather than hiding
them behind framework-only abstractions.

## React

A future React adapter should create `cfg` only after client mount and dispose it
from the effect cleanup:

```tsx
function RuntimePane({ state }: { state: RuntimeState }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const cfg = createCfg({
      root: rootRef.current,
      scheduler: "external",
      theme: "system",
    });

    const pane = cfg.pane({ title: "Runtime" });
    pane.numberSlider(state, "speed", { min: 0, max: 4, step: 0.01 });

    return () => cfg.dispose();
  }, [state]);

  return <div ref={rootRef} />;
}
```

React state should not be required on the per-frame hot path. If a project needs
React state synchronization, prefer event handlers on controls or explicit
snapshots at human interaction frequency.

## Next.js

Next.js adapters must be client-only. Importing `cfg` is SSR-safe, but creating
the manager requires a browser document.

```tsx
"use client";

import { createCfg } from "cfg";
import "cfg/styles.css";
```

The adapter should create the manager in an effect, not at module scope. Route
transition cleanup must call `dispose()`.

## Svelte

A Svelte wrapper should create `cfg` in `onMount()` and clean up from the
returned function:

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { createCfg } from "cfg";
  import "cfg/styles.css";

  let root: HTMLDivElement;
  const state = { speed: 1 };

  onMount(() => {
    const cfg = createCfg({ root, scheduler: "external" });
    cfg.pane({ title: "Runtime" }).numberSlider(state, "speed");

    return () => cfg.dispose();
  });
</script>

<div bind:this={root}></div>
```

## Astro

Astro projects should instantiate `cfg` only inside client-side scripts. For
template-level runtime controls, prefer a single central instance connected to
the template's existing RAF loop.

The expected `_www_template` integration shape is:

1. Import `cfg` and `cfg/styles.css` from the site runtime entry.
2. Create one manager from the browser runtime setup.
3. Replace local Tweakpane controls with `cfg` panes/folders.
4. Forward the site theme into `cfg.setTheme()`.
5. Feed the existing RAF loop into the external scheduler lifecycle.
6. Dispose on hot reload or route/runtime teardown.

### `_www_template` Dry-Run Evidence

The 2026-07-05 disposable integration dry run used a clean copy under
`.tmp/www-template-cfg-dryrun` and installed the local `cfg` release-candidate
tarball:

```sh
bun add /Users/han/Git/cfg/.tmp/package-smoke/pack/cfg-1.0.0.tgz
```

The dry run replaced the Tweakpane dev pane with `cfg`, imported
`cfg/styles.css`, and wired `cfg` into the existing `App` RAF loop with
`createCfg({ scheduler: "external" })`.

Files that would need downstream changes:

- `package.json` and `bun.lock` for the `cfg` dependency;
- `src/app/dev/pane.ts` for the controls, settings actions, and diagnostics
  panes;
- `src/app/dev/dev.ts` for `beginFrame`, `endFrame`, `renderFrame`, and
  profiler forwarding;
- `src/app/core/app.ts` for a module-update profiling hook;
- `src/app/app.ts` for central loop wiring.

The dry run passed:

```sh
bun run util:check
```

Browser QA opened `/?controls=1` and `/about/?controls=1` in Chromium. It
verified a clean console, strict CSP response headers, visible `runtime` and
`telemetry` panes, external scheduler mode, nonblank FPS/frame/profiler
canvases, theme propagation from the site theme control into `cfg`, settings
mutation, and profiler labels from real runtime phases including
`performance.begin`, `device`, and `theme`.

Screenshot evidence:

```text
artifacts/browser-qa/www-template-cfg-dryrun-2026-07-05.png
```

The source `_www_template` checkout was left clean. Final downstream
installation should be repeated from `v1.0.1` after the patch tag is pushed and
GitHub CI has run.

## Avoiding Duplicate RAF Loops

Adapters should default to:

```ts
createCfg({ scheduler: "external" });
```

Then the host loop drives `cfg`:

```ts
function frame(time: number) {
  cfg.beginFrame(time);
  update();
  render();
  cfg.endFrame(time);
  cfg.renderFrame(time);
  requestAnimationFrame(frame);
}
```

Use `scheduler: "internal"` only for standalone examples or simple pages that do
not already have a frame loop.

## Theme Synchronization

Adapters should expose the manager's native theme methods:

```ts
cfg.setTheme("system");
cfg.setTheme("light");
cfg.setTheme("dark");
```

This lets a host theme button update the page and the panel with one state
change. Adapters should not invent separate theme stores unless the framework
already requires one.

## SSR Safety

Safe:

```ts
import { createCfg } from "cfg";
import "cfg/styles.css";
```

Unsafe during SSR:

```ts
const cfg = createCfg();
```

`createCfg()` needs a browser document unless a real browser root element is
passed. Framework adapters must defer creation until client mount.

## Future Package Names

If adapter packages are added later, keep them small and explicit:

- `@u29dc/cfg-react`;
- `@u29dc/cfg-svelte`;
- `@u29dc/cfg-next`;
- `@u29dc/cfg-astro`.

They should depend on the released core behavior and remain optional. The root
`cfg` package should stay the lean vanilla install target.
