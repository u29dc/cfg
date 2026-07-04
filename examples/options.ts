import { bezierPresets, defaultBezier, theme } from 'cfg';

export const modeOptions = ['calm', 'normal', 'intense'] as const;
export const densityOptions = ['low', 'medium', 'high'] as const;
export const placementOptions = ['nw', 'ne', 'sw', 'se'] as const;

export const paletteOptions = [
	{ label: 'Blue', value: theme.palette.blue },
	{ label: 'Gold', value: theme.palette.gold },
	{ label: 'Rose', value: theme.palette.rose },
	{ label: 'Green', value: theme.palette.green },
] as const;

export { bezierPresets, defaultBezier };
