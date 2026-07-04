# cfg

`cfg` is a compact TypeScript runtime controls and diagnostics pane for animation-heavy browser work. The repo is split into a framework-free core engine and a vanilla DOM adapter, then bundled as the root `cfg` package for GitHub-tag consumption.

The production package exports ESM, type declarations, and static CSS:

```ts
import { createCfg } from "cfg";
import "cfg/styles.css";
```

The full public API, demo, benchmark notes, and release verification are implemented in this repository. See [`docs/architecture.md`](docs/architecture.md) and [`docs/performance.md`](docs/performance.md) for the current design notes while the v1 build is completed.

## Install From GitHub Tag

```sh
bun add github:u29dc/cfg#v1.0.0
```

If private-repo auth requires SSH:

```sh
bun add git+ssh://git@github.com/u29dc/cfg.git#v1.0.0
```

## Development

```sh
bun install
bun run dev
bun run util:check
```
