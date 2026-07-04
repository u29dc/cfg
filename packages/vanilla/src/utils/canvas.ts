import { ratio } from '@u29dc/cfg-core';

export interface CanvasSize {
	width: number;
	height: number;
	scale: number;
	cssWidth: number;
	cssHeight: number;
	fromLayout: boolean;
}

export function fit(canvas: HTMLCanvasElement, fallbackWidth: number, fallbackHeight: number): CanvasSize {
	const scale = ratio();
	const size = cssSize(canvas, fallbackWidth, fallbackHeight);
	const width = Math.max(1, Math.round(size.width * scale));
	const height = Math.max(1, Math.round(size.height * scale));
	if (canvas.width !== width) {
		canvas.width = width;
	}
	if (canvas.height !== height) {
		canvas.height = height;
	}
	return { width, height, scale, cssWidth: size.width, cssHeight: size.height, fromLayout: size.fromLayout };
}

export function observeCanvas(canvas: HTMLCanvasElement, render: () => void): () => void {
	const view = canvas.ownerDocument.defaultView;
	if (!view) {
		render();
		return () => {};
	}
	let frame: number | undefined;
	const timers = new Set<number>();
	const schedule = () => {
		if (frame !== undefined) {
			return;
		}
		frame = view.requestAnimationFrame(() => {
			frame = undefined;
			render();
		});
	};
	const scheduleAfter = (delay: number) => {
		const timer = view.setTimeout(() => {
			timers.delete(timer);
			schedule();
		}, delay);
		timers.add(timer);
	};
	schedule();
	for (const delay of [16, 64, 180, 420]) {
		scheduleAfter(delay);
	}
	const ResizeObserverCtor = view.ResizeObserver;
	if (!ResizeObserverCtor) {
		return () => {
			if (frame !== undefined) {
				view.cancelAnimationFrame(frame);
			}
			for (const timer of timers) {
				view.clearTimeout(timer);
			}
		};
	}
	const observer = new ResizeObserverCtor((entries) => {
		const rect = entries[0]?.contentRect;
		if (!rect || (rect.width > 0 && rect.height > 0)) {
			schedule();
		}
	});
	observer.observe(canvas);
	if (canvas.parentElement) {
		observer.observe(canvas.parentElement);
	}
	return () => {
		observer.disconnect();
		if (frame !== undefined) {
			view.cancelAnimationFrame(frame);
		}
		for (const timer of timers) {
			view.clearTimeout(timer);
		}
	};
}

function cssSize(canvas: HTMLCanvasElement, fallbackWidth: number, fallbackHeight: number) {
	const rect = canvas.getBoundingClientRect();
	const width = positive(rect.width) ?? positive(canvas.clientWidth) ?? fallbackWidth;
	const height = positive(rect.height) ?? positive(canvas.clientHeight) ?? fallbackHeight;
	return {
		width,
		height,
		fromLayout: rect.width > 0 && rect.height > 0,
	};
}

function positive(value: number) {
	return Number.isFinite(value) && value > 0 ? value : undefined;
}
