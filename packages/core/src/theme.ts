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

const canvasDark = {
	surface: '#0f141a',
	panel: '#11161d',
	grid: '#303a45',
	guide: '#7d8590',
	muted: '#aab4c0',
	text: '#f1f4f8',
} as const;

const canvasLight = {
	surface: '#e6e7ec',
	panel: '#f3f4f7',
	grid: '#c6c9d1',
	guide: '#7a818f',
	muted: '#8d93a0',
	text: '#262a33',
} as const;

const canvas = {
	...canvasDark,
	light: canvasLight,
	dark: canvasDark,
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
		frameDeltaMax: 1_000,
		fpsTarget: 60,
		fpsMax: 144,
		frameMax: 40,
		millisPerSecond: 1_000,
		graphWidth: 180,
		graphHeight: 42,
		graphHistory: 180,
		graphHistoryMax: 720,
		graphMinHistory: 16,
		graphSmoothing: 5,
		profileHistory: 120,
		profileLabelMax: 80,
		profilerRows: 8,
		profilerReadout: 3,
		profilerFontSize: 10,
		profilerInset: 4,
		profilerBarInset: 2,
		profilerWidth: 280,
		profilerHeight: 70,
		padSize: 96,
		bezierSize: 96,
		bezierHandleRadius: 4,
		bezierHandleHitRadius: 10,
		bezierTickCount: 12,
		bezierTickHeight: 7,
		bezierPreviewDuration: 1_200,
		bezierPreviewMarkerRadius: 3,
		colorSwatchSize: 20,
		paletteSwatchSize: 18,
		colorPickerWidth: 320,
		colorPickerHeight: 160,
		colorSliderHeight: 18,
		colorCheckerSize: 6,
		monitorHz: 8,
		logRows: 4,
		logRowsMax: 12,
		logBuffer: 100,
	},
} as const satisfies Theme;
