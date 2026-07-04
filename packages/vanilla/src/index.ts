import type { CfgOptions } from '@u29dc/cfg-core';
import { Manager } from './manager';

export function createCfg(options: CfgOptions = {}) {
	return new Manager(options);
}

export type * from '@u29dc/cfg-core';
