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

export function observeCanvas(canvas: HTMLCanvasElement, render: () => void): () => void {
	const view = canvas.ownerDocument.defaultView;
	if (!view) {
		render();
		return () => {};
	}
	let frame: number | undefined;
	const schedule = () => {
		if (frame !== undefined) {
			return;
		}
		frame = view.requestAnimationFrame(() => {
			frame = undefined;
			render();
		});
	};
	schedule();
	const ResizeObserverCtor = view.ResizeObserver;
	if (!ResizeObserverCtor) {
		return () => {
			if (frame !== undefined) {
				view.cancelAnimationFrame(frame);
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
	return () => {
		observer.disconnect();
		if (frame !== undefined) {
			view.cancelAnimationFrame(frame);
		}
	};
}
