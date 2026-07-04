import { ratio } from '@u29dc/cfg-core';

export interface CanvasSize {
	width: number;
	height: number;
	scale: number;
}

export function fit(canvas: HTMLCanvasElement, fallbackWidth: number, fallbackHeight: number): CanvasSize {
	const scale = ratio();
	const width = Math.max(1, Math.round((canvas.clientWidth || fallbackWidth) * scale));
	const height = Math.max(1, Math.round((canvas.clientHeight || fallbackHeight) * scale));
	if (canvas.width !== width) {
		canvas.width = width;
	}
	if (canvas.height !== height) {
		canvas.height = height;
	}
	return { width, height, scale };
}
