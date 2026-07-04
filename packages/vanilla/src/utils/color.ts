import { theme } from '@u29dc/cfg-core';

const hex = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;

export function color(value: unknown) {
	if (typeof value !== 'string') {
		return theme.palette.black;
	}
	const next = value.trim();
	if (hex.test(next)) {
		return normalize(next);
	}
	if (rgb.test(next)) {
		return next;
	}
	return theme.palette.black;
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
	ctx.fillStyle = theme.canvas.surface;
	ctx.fillRect(0, 0, size, size);
	ctx.fillStyle = color(value);
	ctx.fillRect(2, 2, size - 4, size - 4);
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
