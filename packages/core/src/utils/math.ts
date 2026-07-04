import type { NumberOptions } from '../types';

export function finite(value: unknown, fallback = 0) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) {
		return min;
	}
	return Math.min(max, Math.max(min, value));
}

export function snap(value: number, step = 0) {
	if (!step || !Number.isFinite(step)) {
		return value;
	}
	return Math.round(value / step) * step;
}

export function number(value: unknown, options: NumberOptions = {}) {
	const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : 0;
	const stepped = snap(finite(parsed), options.step);
	return clamp(stepped, options.min ?? Number.NEGATIVE_INFINITY, options.max ?? Number.POSITIVE_INFINITY);
}

export function text(value: number) {
	if (!Number.isFinite(value)) {
		return '0';
	}
	return Number(value.toFixed(4)).toString();
}

export function ratio() {
	return Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1));
}
