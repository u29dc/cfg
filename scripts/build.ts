import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { transform } from 'lightningcss';
import { minify } from 'oxc-minify';

async function run(command: string, args: string[]) {
	const child = spawn(command, args, { stdio: 'inherit' });
	const status = await new Promise<number | null>((resolve) => {
		child.on('exit', resolve);
	});
	if (status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed with status ${status}`);
	}
}

await rm('dist', { force: true, recursive: true });
await mkdir('dist', { recursive: true });

const build = await Bun.build({
	entrypoints: ['packages/vanilla/src/index.ts'],
	outdir: 'dist',
	target: 'browser',
	format: 'esm',
	splitting: false,
	minify: false,
});

if (!build.success) {
	throw new Error('Bun library build failed');
}

await minifyJavaScript('dist/index.js');
await minifyCss('dist/styles.css', await readCss('packages/vanilla/src/styles/cfg.css'));
await writeFile('dist/styles.css.d.ts', 'export {};\n');
await run('bunx', ['tsc', '-p', 'tsconfig.build.json']);
const types = await readFile('dist/types/core/src/types.d.ts', 'utf8');
await writeFile(
	'dist/index.d.ts',
	`${types}\nexport declare const theme: Theme;\nexport declare const defaultBezier: BezierTuple;\nexport declare const bezierPresets: readonly BezierPreset[];\nexport declare function createCfg(options?: CfgOptions): Cfg;\n`,
);
await rm('dist/types', { force: true, recursive: true });

async function minifyJavaScript(file: string) {
	const source = await readFile(file, 'utf8');
	const result = await minify(file, source, {
		module: true,
		compress: {
			target: 'esnext',
			dropDebugger: true,
			treeshake: {
				annotations: true,
				propertyReadSideEffects: true,
				propertyWriteSideEffects: true,
				unknownGlobalSideEffects: true,
			},
		},
		mangle: {
			toplevel: true,
		},
		codegen: {
			removeWhitespace: true,
			legalComments: 'none',
		},
		sourcemap: false,
	});
	if (result.errors.length > 0) {
		throw new Error(result.errors.map((error) => error.message).join('\n'));
	}
	await writeFile(file, compactJavaScript(result.code));
}

async function minifyCss(file: string, source: string) {
	const result = transform({
		filename: file,
		code: Buffer.from(source),
		minify: true,
		sourceMap: false,
	});
	await writeFile(file, `${new TextDecoder().decode(result.code)}\n`);
}

async function readCss(file: string, seen = new Set<string>()): Promise<string> {
	if (seen.has(file)) {
		return '';
	}
	seen.add(file);
	const source = await readFile(file, 'utf8');
	const lines = await Promise.all(
		source.split('\n').map(async (line) => {
			const match = line.match(/^@import\s+["'](.+)["'];$/);
			const imported = match?.[1];
			return imported ? readCss(join(dirname(file), imported), seen) : line;
		}),
	);
	return `${lines.join('\n').trimEnd()}\n`;
}

function compactJavaScript(code: string) {
	const compact = code.trimEnd();
	if (compact.includes('\n')) {
		throw new Error('Oxc emitted a physical newline in dist/index.js; remove the source pattern instead of rewriting minified JavaScript.');
	}
	return `${compact}\n`;
}
