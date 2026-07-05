import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'demo',
	publicDir: false,
	resolve: {
		alias: [
			{ find: 'cfg/styles.css', replacement: resolve(import.meta.dirname, 'packages/vanilla/src/styles/cfg.css') },
			{ find: /^cfg$/, replacement: resolve(import.meta.dirname, 'packages/vanilla/src/index.ts') },
			{ find: '@cfg/core', replacement: resolve(import.meta.dirname, 'packages/core/src/index.ts') },
			{ find: '@cfg/vanilla', replacement: resolve(import.meta.dirname, 'packages/vanilla/src/index.ts') },
			{ find: '@u29dc/cfg-core', replacement: resolve(import.meta.dirname, 'packages/core/src/index.ts') },
			{ find: '@u29dc/cfg-vanilla', replacement: resolve(import.meta.dirname, 'packages/vanilla/src/index.ts') },
		],
	},
	server: {
		host: '127.0.0.1',
	},
});
