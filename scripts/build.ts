import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

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
	minify: true,
});

if (!build.success) {
	throw new Error('Bun library build failed');
}

await copyFile('packages/vanilla/src/styles/cfg.css', 'dist/styles.css');
await run('bunx', ['tsc', '-p', 'tsconfig.build.json']);
const types = await readFile('dist/types/core/src/types.d.ts', 'utf8');
await writeFile(
	'dist/index.d.ts',
	`${types}\nexport declare const theme: Theme;\nexport declare const defaultBezier: BezierTuple;\nexport declare const bezierPresets: readonly BezierPreset[];\nexport declare function createCfg(options?: CfgOptions): Cfg;\n`,
);
await rm('dist/types', { force: true, recursive: true });
