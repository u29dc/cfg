import type { Theme } from './types';

const palette = {
	blue: '#78a6ff',
	gold: '#ffcc66',
	rose: '#ff6b8b',
	green: '#7ee787',
	black: '#000000',
	ink: '#101316',
	text: '#e6e8eb',
	white: '#ffffff',
} as const;

const canvas = {
	surface: '#0f141a',
	panel: '#11161d',
	grid: '#303a45',
	guide: '#7d8590',
	muted: '#aab4c0',
} as const;

export const theme = {
	palette: {
		...palette,
		series: [palette.blue, palette.gold, palette.rose, palette.green],
	},
	canvas,
	telemetry: {
		background: canvas.surface,
		target: canvas.guide,
		text: '#f1f4f8',
		warning: palette.rose,
		ok: palette.blue,
	},
	metrics: {
		frameBudget: 16.67,
		fpsTarget: 60,
		fpsMax: 144,
		frameMax: 40,
		graphHeight: 42,
		graphHistory: 180,
		graphMinHistory: 16,
		profileHistory: 120,
		profilerWidth: 280,
		profilerHeight: 70,
		padSize: 96,
		bezierSize: 96,
	},
} as const satisfies Theme;
