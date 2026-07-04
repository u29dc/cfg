import { clamp, theme } from '@u29dc/cfg-core';
import { canvasTheme } from './theme';

const hex = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;

export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}

export interface Hsv {
	h: number;
	s: number;
	v: number;
}

export function color(value: unknown) {
	return parseColor(value) ?? theme.palette.black;
}

export function parseColor(value: unknown) {
	if (typeof value !== 'string') {
		return undefined;
	}
	const next = value.trim();
	if (hex.test(next)) {
		return normalize(next);
	}
	if (rgb.test(next)) {
		return next;
	}
	return undefined;
}

export function rgba(value: unknown): Rgba {
	if (typeof value !== 'string') {
		return { r: 0, g: 0, b: 0, a: 1 };
	}
	const next = normalize(value.trim());
	if (next.startsWith('#')) {
		return rgbaHex(next);
	}
	const match = rgb.exec(next);
	if (!match) {
		return { r: 0, g: 0, b: 0, a: 1 };
	}
	const [, r, g, b, a] = match;
	return {
		r: channel(Number(r)),
		g: channel(Number(g)),
		b: channel(Number(b)),
		a: alpha(a === undefined ? 1 : Number(a)),
	};
}

export function format(rgbaValue: Rgba, mode: 'hex' | 'rgba' = 'hex') {
	const value = cleanRgba(rgbaValue);
	if (mode === 'rgba') {
		return `rgba(${value.r}, ${value.g}, ${value.b}, ${trimAlpha(value.a)})`;
	}
	const channels = [value.r, value.g, value.b].map((item) => item.toString(16).padStart(2, '0')).join('');
	if (value.a >= 1) {
		return `#${channels}`;
	}
	return `#${channels}${Math.round(value.a * 255)
		.toString(16)
		.padStart(2, '0')}`;
}

export function six(value: string) {
	const parsed = color(value);
	if (parsed.startsWith('#')) {
		return parsed.slice(0, 7);
	}
	const match = rgb.exec(parsed);
	if (!match) {
		return theme.palette.black;
	}
	const [, r, g, b] = match;
	return `#${[r, g, b].map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`;
}

export function swatch(ctx: CanvasRenderingContext2D | null, value: string, size: number) {
	if (!ctx) {
		return;
	}
	ctx.clearRect(0, 0, size, size);
	ctx.fillStyle = canvasTheme(ctx.canvas).surface;
	ctx.fillRect(0, 0, size, size);
	ctx.fillStyle = color(value);
	ctx.fillRect(2, 2, size - 4, size - 4);
}

export function hsvFromRgb(value: Rgba): Hsv {
	const r = channel(value.r) / 255;
	const g = channel(value.g) / 255;
	const b = channel(value.b) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	let h = 0;
	if (delta !== 0) {
		if (max === r) {
			h = 60 * (((g - b) / delta) % 6);
		} else if (max === g) {
			h = 60 * ((b - r) / delta + 2);
		} else {
			h = 60 * ((r - g) / delta + 4);
		}
	}
	return {
		h: h < 0 ? h + 360 : h,
		s: max === 0 ? 0 : delta / max,
		v: max,
	};
}

export function rgbFromHsv(value: Hsv, a = 1): Rgba {
	const h = ((value.h % 360) + 360) % 360;
	const s = clamp(value.s, 0, 1);
	const v = clamp(value.v, 0, 1);
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;
	const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return cleanRgba({
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
		a,
	});
}

export function css(value: Rgba) {
	const next = cleanRgba(value);
	return `rgba(${next.r}, ${next.g}, ${next.b}, ${trimAlpha(next.a)})`;
}

export function preview(value: string, allowRemote = false) {
	if (!value) {
		return '';
	}
	if (/^data:image\/(?:png|jpeg|jpg|gif|webp|avif|svg\+xml);base64,/i.test(value)) {
		return value;
	}
	if (value.startsWith('blob:') || value.startsWith('/') || value.startsWith('./')) {
		return value;
	}
	if (allowRemote && /^https?:\/\//i.test(value)) {
		return value;
	}
	return '';
}

function normalize(value: string) {
	const lower = value.toLowerCase();
	if (lower.length === 4 || lower.length === 5) {
		return `#${[...lower.slice(1)].map((char) => `${char}${char}`).join('')}`;
	}
	return lower;
}

function rgbaHex(value: string): Rgba {
	const body = value.slice(1);
	const r = Number.parseInt(body.slice(0, 2), 16);
	const g = Number.parseInt(body.slice(2, 4), 16);
	const b = Number.parseInt(body.slice(4, 6), 16);
	const a = body.length >= 8 ? Number.parseInt(body.slice(6, 8), 16) / 255 : 1;
	return cleanRgba({ r, g, b, a });
}

function cleanRgba(value: Rgba): Rgba {
	return {
		r: channel(value.r),
		g: channel(value.g),
		b: channel(value.b),
		a: alpha(value.a),
	};
}

function channel(value: number) {
	return Math.round(clamp(value, 0, 255));
}

function alpha(value: number) {
	return clamp(value, 0, 1);
}

function trimAlpha(value: number) {
	return Number(alpha(value).toFixed(3)).toString();
}
