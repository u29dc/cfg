import type { GraphOptions, TelemetryGraph } from '@u29dc/cfg-core';
import { clamp, output, ratio, Series, text } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { color } from '../utils/color';

type Mode = 'graph' | 'waveform' | 'fps' | 'frame';
const height = 42;
const colors = ['#78a6ff', '#ffcc66', '#ff6b8b', '#7ee787'];

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
		const history = Math.max(16, Math.floor(options.history ?? 180));
		const series = options.series?.length ? options.series : [{ label: options.label ?? mode }];
		this.#series = series.map((item, index) => new Series(seriesOptions(item, index, history)));
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-graph';
		this.#canvas.width = history;
		this.#canvas.height = height * ratio();
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
		this.#readout.textContent = `${this.get().map(text).join(' / ')}${this.#options.unit ?? ''}`;
	}

	#draw() {
		const ctx = this.#ctx;
		if (!ctx) {
			return;
		}
		const width = this.#canvas.width;
		const canvasHeight = this.#canvas.height;
		const range = this.#range();
		ctx.clearRect(0, 0, width, canvasHeight);
		ctx.fillStyle = '#0f141a';
		ctx.fillRect(0, 0, width, canvasHeight);
		if (this.#options.target !== undefined) {
			const y = yOf(this.#options.target, range.min, range.max, canvasHeight);
			ctx.strokeStyle = '#7d8590';
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}
		for (const series of this.#series) {
			if (series.ring.count < 2) {
				continue;
			}
			ctx.strokeStyle = series.color;
			ctx.beginPath();
			for (let offset = 0; offset < series.ring.count; offset += 1) {
				const x = (offset / Math.max(1, series.ring.data.length - 1)) * width;
				const y = yOf(series.ring.at(offset), range.min, range.max, canvasHeight);
				if (offset === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}
	}

	#range() {
		if (!this.#options.autoscale) {
			return { min: this.#options.min ?? 0, max: this.#options.max ?? (this.#mode === 'fps' ? 144 : 40) };
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

function seriesOptions(item: { id?: string; label?: string; color?: string }, index: number, size: number) {
	const result: { id?: string; label?: string; color: string; size: number } = {
		color: color(item.color ?? colors[index % colors.length] ?? colors[0]),
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
