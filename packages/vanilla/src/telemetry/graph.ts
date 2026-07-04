import type { GraphOptions, TelemetryGraph } from '@u29dc/cfg-core';
import { clamp, output, Series, text, theme } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { fit } from '../utils/canvas';
import { color } from '../utils/color';

type Mode = 'graph' | 'waveform' | 'fps' | 'frame';

export class Graph extends Base<readonly number[]> implements TelemetryGraph {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	readonly #readout: HTMLElement;
	readonly #series: Series[];
	readonly #options: GraphOptions;
	readonly #mode: Mode;
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
		const series = options.series?.length ? options.series : [{ label: options.label ?? mode }];
		this.#series = series.map((item, index) => new Series(seriesOptions(item, index, history)));
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-graph';
		this.#canvas.width = theme.metrics.graphWidth;
		this.#canvas.height = theme.metrics.graphHeight;
		this.#ctx = this.#canvas.getContext('2d');
		this.#readout = output(owner.doc, 'cfg-graph-readout');
		this.field.append(this.#canvas, this.#readout);
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
		if (typeof value === 'number') {
			this.#series[0]?.ring.push(value);
		} else {
			for (let index = 0; index < this.#series.length; index += 1) {
				this.#series[index]?.ring.push(Number(value[index] ?? 0));
			}
		}
		this.#dirty = true;
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
		const { width, height } = fit(this.#canvas, theme.metrics.graphWidth, theme.metrics.graphHeight);
		const range = this.#range();
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = theme.telemetry.background;
		ctx.fillRect(0, 0, width, height);
		if (this.#options.target !== undefined) {
			const y = yOf(this.#options.target, range.min, range.max, height);
			ctx.strokeStyle = theme.telemetry.target;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}
		for (const series of this.#series) {
			drawSeries(ctx, series, range.min, range.max, width, height);
		}
	}

	#readoutText() {
		let result = '';
		for (let index = 0; index < this.#series.length; index += 1) {
			const series = this.#series[index];
			if (!series) {
				continue;
			}
			result += `${index === 0 ? '' : ' / '}${text(series.ring.latest())}`;
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
}

function yOf(value: number, min: number, max: number, canvasHeight: number) {
	return canvasHeight - clamp((value - min) / (max - min || 1), 0, 1) * canvasHeight;
}

function drawSeries(ctx: CanvasRenderingContext2D, series: Series, min: number, max: number, width: number, height: number) {
	const count = series.ring.count;
	if (count < 2) {
		return;
	}
	const columns = Math.max(2, Math.min(count, Math.floor(width)));
	ctx.strokeStyle = series.color;
	ctx.beginPath();
	for (let column = 0; column < columns; column += 1) {
		const value = sample(series, column, columns, count);
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

function sample(series: Series, column: number, columns: number, count: number) {
	if (count <= columns) {
		return series.ring.at(column);
	}
	const start = Math.floor((column / columns) * count);
	const end = Math.max(start + 1, Math.floor(((column + 1) / columns) * count));
	let total = 0;
	for (let index = start; index < end; index += 1) {
		total += series.ring.at(index);
	}
	return total / (end - start);
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
