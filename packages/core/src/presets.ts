import type { BezierPreset, BezierTuple } from './types';

export const defaultBezier: BezierTuple = [0.25, 0.1, 0.25, 1];

export const bezierPresets = [
	{ label: 'Standard', value: defaultBezier },
	{ label: 'Out', value: [0, 0, 0.2, 1] },
] as const satisfies readonly BezierPreset[];
