import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=all', '--', 'dist'], {
	encoding: 'utf8',
});

if (result.status !== 0) {
	process.stderr.write(result.stderr);
	throw new Error(`git status -- dist failed with status ${result.status}`);
}

const status = result.stdout.trim();
if (status) {
	process.stderr.write(`${status}\n`);
	throw new Error('dist has uncommitted or untracked changes');
}
