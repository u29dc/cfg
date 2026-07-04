import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, '.tmp', 'package-smoke');
const packDir = join(tmp, 'pack');
const consumer = join(tmp, 'consumer');

rmSync(tmp, { force: true, recursive: true });
mkdirSync(packDir, { recursive: true });
mkdirSync(consumer, { recursive: true });

run(root, 'bun', ['pm', 'pack', '--destination', packDir]);
const archiveName = readdirSync(packDir).find((name) => name.endsWith('.tgz'));
if (!archiveName) {
	throw new Error(`package smoke expected a tarball in ${packDir}`);
}
const archive = join(packDir, archiveName);
if (!existsSync(archive)) {
	throw new Error(`package smoke expected archive at ${archive}`);
}

writeFileSync(join(consumer, 'package.json'), `${JSON.stringify({ type: 'module', private: true, dependencies: {} }, null, '\t')}\n`);
writeFileSync(
	join(consumer, 'tsconfig.json'),
	`${JSON.stringify(
		{
			compilerOptions: {
				target: 'ESNext',
				lib: ['DOM', 'DOM.Iterable', 'ESNext'],
				module: 'ESNext',
				moduleResolution: 'Bundler',
				strict: true,
				noEmit: true,
				skipLibCheck: true,
				verbatimModuleSyntax: true,
			},
			include: ['index.ts'],
		},
		null,
		'\t',
	)}\n`,
);
writeFileSync(
	join(consumer, 'index.ts'),
	[
		"import { createCfg, type Cfg, type Control, type ThemeMode, theme } from 'cfg';",
		"import stylesheet from 'cfg/styles.css';",
		'',
		"const mode: ThemeMode = 'system';",
		'const factory: (options?: Parameters<typeof createCfg>[0]) => Cfg = createCfg;',
		'const palette: string = theme.palette.blue;',
		'const css: string = stylesheet;',
		'const controls: Control<unknown>[] = [];',
		'',
		'void mode;',
		'void factory;',
		'void palette;',
		'void css;',
		'void controls;',
	].join('\n'),
);
writeFileSync(
	join(consumer, 'ssr.mjs'),
	[
		"const mod = await import('cfg');",
		"if (typeof mod.createCfg !== 'function') {",
		"	throw new Error('createCfg export missing');",
		'}',
		'try {',
		'	mod.createCfg();',
		"	throw new Error('createCfg unexpectedly succeeded without a browser document');",
		'} catch (error) {',
		'	const message = error instanceof Error ? error.message : String(error);',
		"	if (!message.includes('requires a browser document')) {",
		'		throw error;',
		'	}',
		'}',
	].join('\n'),
);

run(consumer, 'bun', ['add', archive]);
run(root, 'bunx', ['tsgo', '--noEmit', '-p', join(consumer, 'tsconfig.json')]);
run(consumer, 'bun', ['ssr.mjs']);

const installed = readdirSync(join(consumer, 'node_modules', 'cfg', 'dist'));
for (const file of ['index.js', 'index.d.ts', 'styles.css', 'styles.css.d.ts']) {
	if (!installed.includes(file)) {
		throw new Error(`package smoke missing dist/${file}`);
	}
}

function run(cwd: string, command: string, args: string[]) {
	const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`);
	}
}
