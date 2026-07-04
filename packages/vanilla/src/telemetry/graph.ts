import type { GraphOptions, TelemetryGraph } from '@u29dc/cfg-core';
import { clamp, output, Series, text, theme } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { fit, observeCanvas } from '../utils/canvas';
import { color } from '../utils/color';

type Mode = 'graph' | 'waveform' | 'fps' | 'frame';

export class Graph extends Base<readonly number[]> implements TelemetryGraph {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	readonly #readout: HTMLElement;
	readonly #series: Series[];
	readonly #options: GraphOptions;
	readonly #mode: Mode;
	readonly #smoothing: number;
	readonly #readoutMode: 'smoothed' | 'raw';
	#dirty = true;
	#paused = false;

	constructor(owner: Owner, options: GraphOptions, mode: Mode) {
		super(
			owner,
			mode === 'waveform' ? 'waveform-graph' : `${mode}-graph`,
			{
				...options,
				serialize: false,
			},
			[],
		);
		this.#options = options;
		this.#mode = mode;
		const history = Math.floor(clamp(options.history ?? theme.metrics.graphHistory, theme.metrics.graphMinHistory, theme.metrics.graphHistoryMax));
		const defaultSmoothing = mode === 'fps' || mode === 'frame' ? theme.metrics.graphSmoothing : 1;
		this.#smoothing = options.smoothing === false ? 1 : Math.max(1, Math.floor(options.smoothing ?? defaultSmoothing));
		this.#readoutMode = options.readout ?? (this.#smoothing > 1 ? 'smoothed' : 'raw');
		const series = options.series?.length ? options.series : [{ label: options.label ?? mode }];
		this.#series = series.map((item, index) => new Series(seriesOptions(item, index, history)));
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-graph';
		this.#canvas.width = theme.metrics.graphWidth;
		this.#canvas.height = theme.metrics.graphHeight;
		this.#ctx = this.#canvas.getContext('2d');
		this.#readout = output(owner.doc, 'cfg-graph-readout');
		this.field.append(this.#canvas, this.#readout);
		this.cleanup(
			observeCanvas(this.#canvas, () => {
				this.#dirty = true;
				this.render();
			}),
		);
		this.render();
	}

	get() {
		return this.#series.map((series) => series.ring.latest());
	}

	set(value: readonly number[]) {
		this.push(value);
		this.emit('change');
	}

	push(value: number | readonly number[]) {
		if (this.#paused) {
			return;
		}
		let changed = false;
		if (typeof value === 'number') {
			changed = pushSample(this.#series[0], value);
		} else {
			for (let index = 0; index < this.#series.length; index += 1) {
				const next = value[index] === undefined ? 0 : Number(value[index]);
				changed = pushSample(this.#series[index], next) || changed;
			}
		}
		if (changed) {
			this.#dirty = true;
		}
	}

	clear() {
		for (const series of this.#series) {
			series.ring.clear();
		}
		this.#dirty = true;
		this.emit('change');
	}

	pause(paused = true) {
		this.#paused = paused;
	}

	sample(kind: 'fps' | 'frame', value: number) {
		if (this.#mode === kind) {
			this.push(value);
		}
	}

	renderFrame() {
		if (!this.#dirty || !this.owner.visible()) {
			return;
		}
		this.#dirty = false;
		this.render();
	}

	protected render() {
		this.#draw();
		this.#readout.textContent = this.#readoutText();
	}

	#draw() {
		const ctx = this.#ctx;
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(this.#canvas, theme.metrics.graphWidth, theme.metrics.graphHeight);
		const range = this.#range();
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = theme.telemetry.background;
		ctx.fillRect(0, 0, width, height);
		this.#drawTarget(ctx, range, width, height, scale);
		for (const series of this.#series) {
			drawSeries(ctx, series, range.min, range.max, width, height, this.#smoothing);
		}
	}

	#readoutText() {
		let result = '';
		for (let index = 0; index < this.#series.length; index += 1) {
			const series = this.#series[index];
			if (!series) {
				continue;
			}
			const value = this.#readoutMode === 'raw' ? series.ring.latest() : latest(series, this.#smoothing);
			result += `${index === 0 ? '' : ' / '}${readout(value, this.#mode)}`;
		}
		return `${result}${this.#options.unit ?? ''}`;
	}

	#range() {
		if (!this.#options.autoscale) {
			return { min: this.#options.min ?? 0, max: this.#options.max ?? (this.#mode === 'fps' ? theme.metrics.fpsMax : theme.metrics.frameMax) };
		}
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;
		for (const series of this.#series) {
			for (let index = 0; index < series.ring.count; index += 1) {
				const value = series.ring.at(index);
				min = Math.min(min, value);
				max = Math.max(max, value);
			}
		}
		return Number.isFinite(min) && Number.isFinite(max) && min !== max ? { min, max } : { min: 0, max: 1 };
	}

	#drawTarget(ctx: CanvasRenderingContext2D, range: { min: number; max: number }, width: number, height: number, scale: number) {
		const target = this.#options.target;
		if (target === undefined) {
			return;
		}
		const y = yOf(target, range.min, range.max, height);
		ctx.save();
		ctx.lineWidth = Math.max(1, scale);
		ctx.strokeStyle = theme.telemetry.target;
		ctx.setLineDash([3 * scale, 3 * scale]);
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.restore();
	}
}

function pushSample(series: Series | undefined, value: number) {
	if (!series || !Number.isFinite(value)) {
		return false;
	}
	series.ring.push(value);
	return true;
}

function yOf(value: number, min: number, max: number, canvasHeight: number) {
	return canvasHeight - clamp((value - min) / (max - min || 1), 0, 1) * canvasHeight;
}

function drawSeries(ctx: CanvasRenderingContext2D, series: Series, min: number, max: number, width: number, height: number, smoothing: number) {
	const count = series.ring.count;
	if (count < 2) {
		return;
	}
	const columns = Math.max(2, Math.min(count, Math.floor(width)));
	ctx.strokeStyle = series.color;
	ctx.beginPath();
	for (let column = 0; column < columns; column += 1) {
		const value = sample(series, column, columns, count, smoothing);
		const x = (column / Math.max(1, columns - 1)) * width;
		const y = yOf(value, min, max, height);
		if (column === 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}
	}
	ctx.stroke();
}

function sample(series: Series, column: number, columns: number, count: number, smoothing: number) {
	if (count <= columns) {
		return average(series, Math.max(0, column - smoothing + 1), column + 1);
	}
	const start = Math.floor((column / columns) * count);
	const end = Math.max(start + 1, Math.floor(((column + 1) / columns) * count));
	return average(series, Math.max(0, start - smoothing + 1), end);
}

function average(series: Series, start: number, end: number) {
	let total = 0;
	for (let index = start; index < end; index += 1) {
		total += series.ring.at(index);
	}
	return total / (end - start);
}

function latest(series: Series, smoothing: number) {
	const count = series.ring.count;
	return count === 0 ? 0 : average(series, Math.max(0, count - smoothing), count);
}

function readout(value: number, mode: Mode) {
	if (mode === 'fps') {
		return `${Math.round(value)} FPS`;
	}
	if (mode === 'frame') {
		return value.toFixed(1);
	}
	return text(value);
}

function seriesOptions(item: { id?: string; label?: string; color?: string }, index: number, size: number) {
	const result: { id?: string; label?: string; color: string; size: number } = {
		color: color(item.color ?? theme.palette.series[index % theme.palette.series.length] ?? theme.palette.blue),
		size,
	};
	if (item.id !== undefined) {
		result.id = item.id;
	}
	if (item.label !== undefined) {
		result.label = item.label;
	}
	return result;
}
