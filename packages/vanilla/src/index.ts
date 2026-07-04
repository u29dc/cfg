import type { CfgOptions } from '@u29dc/cfg-core';
import { Manager } from './manager';

export { bezierPresets, defaultBezier, theme } from '@u29dc/cfg-core';

export function createCfg(options: CfgOptions = {}) {
	return new Manager(options);
}

export type * from '@u29dc/cfg-core';
