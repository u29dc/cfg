import type { BezierOptions, BezierTuple, NumberOptions, Vector2, VectorOptions } from '@u29dc/cfg-core';
import { axis, clamp, el, number, snap, text, theme } from '@u29dc/cfg-core';

import { Base, type Owner } from '../base';
import { Binding, bezier, interval, vector } from '../binding';
import { fit, observeCanvas } from '../utils/canvas';
import { canvasTheme } from '../utils/theme';
import { numberInput } from './input';

const padSize = theme.metrics.padSize;
const bezierSize = theme.metrics.bezierSize;
const bezierSolverIterations = 6;
const bezierBinaryIterations = 8;

export class VectorControl<T extends Record<string, unknown>> extends Base<unknown> {
	readonly #binding: Binding<unknown>;
	readonly #axes: readonly string[];
	readonly #inputs = new Map<string, HTMLInputElement>();
	readonly #options: VectorOptions;

	constructor(owner: Owner, target: T, key: keyof T, options: VectorOptions, axes: readonly string[]) {
		const binding = new Binding(target, key, (value) => vector(value, axes, options));
		super(owner, `vector${axes.length}`, options, binding.get());
		this.#binding = binding;
		this.#axes = axes;
		this.#options = options;
		const row = el(owner.doc, 'div', 'cfg-vector');
		for (const axisName of axes) {
			row.append(this.#axis(axisName));
		}
		row.setAttribute('role', 'group');
		this.groupLabel(row);
		this.field.append(row);
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: unknown) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const value = this.get() as Record<string, number>;
		for (const axisName of this.#axes) {
			const axisInput = this.#inputs.get(axisName);
			if (axisInput) {
				axisInput.value = text(value[axisName] ?? 0);
			}
		}
	}

	#axis(axisName: string) {
		const axisInput = numberInput(this.owner.doc, undefined, this.#axisOptions(axisName), 'cfg-input cfg-input--axis');
		axisInput.disabled = this.disabled;
		this.#inputs.set(axisName, axisInput);
		axisInput.addEventListener('input', () => {
			const current = { ...(this.get() as Record<string, number>) };
			const value = number(axisInput.value, this.#axisOptions(axisName));
			if (this.#options.lock) {
				for (const locked of this.#axes) {
					current[locked] = value;
				}
			} else {
				current[axisName] = value;
			}
			this.#binding.set(current);
			this.render();
			this.emit('input');
		});
		axisInput.addEventListener('change', () => this.emit('change'));
		return axis(this.owner.doc, axisName.toUpperCase(), axisInput);
	}

	#axisOptions(axisName: string): NumberOptions {
		return vectorAxisOptions(this.#options, this.#axes.indexOf(axisName));
	}
}

export class XyPad<T extends Record<string, unknown>> extends Base<Vector2> {
	readonly #binding: Binding<Vector2>;
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	readonly #x: HTMLInputElement;
	readonly #y: HTMLInputElement;
	readonly #options: VectorOptions;

	constructor(owner: Owner, target: T, key: keyof T, options: VectorOptions = {}) {
		const binding = new Binding(target, key, (value) => vector(value, ['x', 'y'], options) as unknown as Vector2);
		super(owner, 'xy-pad', options, binding.get());
		this.#binding = binding;
		this.#options = options;
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-pad';
		this.#canvas.width = padSize;
		this.#canvas.height = padSize;
		this.#canvas.setAttribute('aria-disabled', String(this.disabled));
		this.#ctx = this.#canvas.getContext('2d');
		this.#x = input(owner.doc);
		this.#y = input(owner.doc);
		this.#x.disabled = this.disabled;
		this.#y.disabled = this.disabled;
		const fields = el(owner.doc, 'div', 'cfg-vector cfg-vector--pad');
		fields.append(axis(owner.doc, 'X', this.#x), axis(owner.doc, 'Y', this.#y));
		this.#canvas.setAttribute('role', 'img');
		this.#canvas.setAttribute('aria-labelledby', this.labelId);
		this.groupLabel(this.#canvas);
		this.field.append(this.#canvas, fields);
		this.#x.addEventListener('input', () => this.#setField('x', this.#x.value));
		this.#y.addEventListener('input', () => this.#setField('y', this.#y.value));
		this.#x.addEventListener('change', () => this.emit('change'));
		this.#y.addEventListener('change', () => this.emit('change'));
		this.#canvas.addEventListener('pointerdown', (event) => this.#pointer(event));
		this.cleanup(observeCanvas(this.#canvas, () => this.render()));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: Vector2) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const value = this.get();
		this.#x.value = text(value.x);
		this.#y.value = text(value.y);
		drawPad(this.#ctx, value, this.#options);
	}

	#setField(axisName: 'x' | 'y', raw: string) {
		const value = { ...this.get(), [axisName]: number(raw, this.#axisOptions(axisName)) };
		this.#binding.set(value);
		this.render();
		this.emit('input');
	}

	#pointer(event: PointerEvent) {
		if (this.disabled) {
			return;
		}
		event.preventDefault();
		this.#canvas.setPointerCapture(event.pointerId);
		const bounds = measure(this.#canvas);
		const update = (pointer: PointerEvent) => {
			const xAxis = padAxis(this.#options, 0);
			const yAxis = padAxis(this.#options, 1);
			const x = clamp((pointer.clientX - bounds.left) / bounds.width, 0, 1);
			const yRaw = clamp((pointer.clientY - bounds.top) / bounds.height, 0, 1);
			const y = this.#options.invertY ? yRaw : 1 - yRaw;
			this.#binding.set({
				x: valueFromRatio(x, xAxis),
				y: valueFromRatio(y, yAxis),
			});
			this.render();
			this.emit('input');
		};
		const move = (pointer: PointerEvent) => update(pointer);
		let active = true;
		const finish = (pointer: PointerEvent, commit: boolean) => {
			if (!active) {
				return;
			}
			active = false;
			if (commit) {
				update(pointer);
			}
			if (this.#canvas.hasPointerCapture(pointer.pointerId)) {
				this.#canvas.releasePointerCapture(pointer.pointerId);
			}
			this.#canvas.removeEventListener('pointermove', move);
			this.#canvas.removeEventListener('pointerup', up);
			this.#canvas.removeEventListener('pointercancel', cancel);
			this.#canvas.removeEventListener('lostpointercapture', cancel);
			if (commit) {
				this.emit('change');
			}
		};
		const up = (pointer: PointerEvent) => finish(pointer, true);
		const cancel = (pointer: PointerEvent) => finish(pointer, false);
		this.#canvas.addEventListener('pointermove', move);
		this.#canvas.addEventListener('pointerup', up, { once: true });
		this.#canvas.addEventListener('pointercancel', cancel, { once: true });
		this.#canvas.addEventListener('lostpointercapture', cancel, { once: true });
		update(event);
	}

	#axisOptions(axisName: 'x' | 'y') {
		return vectorAxisOptions(this.#options, axisName === 'x' ? 0 : 1);
	}
}

export class Interval<T extends Record<string, unknown>> extends Base<unknown> {
	readonly #binding: Binding<unknown>;
	readonly #min: HTMLInputElement;
	readonly #max: HTMLInputElement;
	readonly #options: NumberOptions;

	constructor(owner: Owner, target: T, key: keyof T, options: NumberOptions = {}) {
		const binding = new Binding(target, key, (value) => interval(value, options));
		super(owner, 'interval', options, binding.get());
		this.#binding = binding;
		this.#options = options;
		this.#min = input(owner.doc);
		this.#max = input(owner.doc);
		this.#min.disabled = this.disabled;
		this.#max.disabled = this.disabled;
		const row = el(owner.doc, 'div', 'cfg-vector');
		row.append(axis(owner.doc, 'Min', this.#min), axis(owner.doc, 'Max', this.#max));
		row.setAttribute('role', 'group');
		this.groupLabel(row);
		this.field.append(row);
		this.#min.addEventListener('input', () => this.#update());
		this.#max.addEventListener('input', () => this.#update());
		this.#min.addEventListener('change', () => this.emit('change'));
		this.#max.addEventListener('change', () => this.emit('change'));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: unknown) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const value = this.get() as { min: number; max: number };
		this.#min.value = text(value.min);
		this.#max.value = text(value.max);
	}

	#update() {
		this.#binding.set({
			min: number(this.#min.value, this.#options),
			max: number(this.#max.value, this.#options),
		});
		this.render();
		this.emit('input');
	}
}

export class Bezier<T extends Record<string, unknown>> extends Base<BezierTuple> {
	readonly #binding: Binding<BezierTuple>;
	readonly #inputs: HTMLInputElement[] = [];
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	#preview = 0.5;
	#previewStart = -Infinity;

	constructor(owner: Owner, target: T, key: keyof T, options: BezierOptions = {}) {
		const binding = new Binding(target, key, bezier);
		super(owner, 'cubic-bezier', options, binding.get());
		this.#binding = binding;
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-bezier';
		this.#canvas.width = bezierSize;
		this.#canvas.height = bezierSize;
		this.#canvas.setAttribute('role', 'img');
		this.#canvas.setAttribute('aria-labelledby', this.labelId);
		this.#canvas.setAttribute('aria-disabled', String(this.disabled));
		this.groupLabel(this.#canvas);
		this.#ctx = this.#canvas.getContext('2d');
		this.field.append(this.#canvas, this.#fields(), this.#presets(options));
		this.#canvas.addEventListener('pointerdown', (event) => this.#pointer(event));
		this.cleanup(observeCanvas(this.#canvas, () => this.render()));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: BezierTuple) {
		this.#binding.set(value);
		this.#restartPreview();
		this.render();
		this.emit('change');
	}

	renderFrame(time: number) {
		if (this.#previewStart === -Infinity || !this.owner.visible()) {
			return;
		}
		this.#preview = this.#previewProgress(time);
		if (this.#preview >= 1) {
			this.#previewStart = -Infinity;
		}
		this.render();
	}

	protected render() {
		const value = this.get();
		for (let index = 0; index < this.#inputs.length; index += 1) {
			const field = this.#inputs[index];
			if (field) {
				field.value = text(value[index] ?? 0);
			}
		}
		drawBezier(this.#ctx, value, this.#previewProgress());
	}

	#fields() {
		const row = el(this.owner.doc, 'div', 'cfg-vector cfg-vector--bezier');
		for (const label of ['x1', 'y1', 'x2', 'y2']) {
			const field = input(this.owner.doc);
			field.step = '0.01';
			field.disabled = this.disabled;
			field.addEventListener('input', () => this.#update());
			field.addEventListener('change', () => this.emit('change'));
			this.#inputs.push(field);
			row.append(axis(this.owner.doc, label, field));
		}
		return row;
	}

	#presets(options: BezierOptions) {
		const row = el(this.owner.doc, 'div', 'cfg-choice-row cfg-choice-row--segmented');
		for (const preset of options.presets ?? []) {
			const button = this.owner.doc.createElement('button');
			button.type = 'button';
			button.className = 'cfg-choice';
			button.textContent = preset.label;
			button.disabled = this.disabled;
			button.addEventListener('click', () => this.set(preset.value));
			row.append(button);
		}
		return row;
	}

	#update() {
		this.#binding.set(this.#inputs.map((field) => Number(field.value)));
		this.#restartPreview();
		this.render();
		this.emit('input');
	}

	#pointer(event: PointerEvent) {
		if (this.disabled) {
			return;
		}
		event.preventDefault();
		const bounds = measure(this.#canvas);
		const value = this.get();
		const domain = bezierDomain(value);
		const first = handlePoint(bounds, value[0], value[1], domain);
		const second = handlePoint(bounds, value[2], value[3], domain);
		const h1 = Math.hypot(event.clientX - first.x, event.clientY - first.y);
		const h2 = Math.hypot(event.clientX - second.x, event.clientY - second.y);
		const handle = h1 <= theme.metrics.bezierHandleHitRadius || h1 <= h2 ? 0 : 2;
		this.#restartPreview();
		const update = (pointer: PointerEvent) => {
			const next: BezierTuple = [...this.get()];
			next[handle] = snap(clamp((pointer.clientX - bounds.left) / bounds.width, 0, 1), 0.01);
			next[handle + 1] = snap(clamp(yValue(pointer.clientY - bounds.top, bounds.height, domain), -2, 2), 0.01);
			this.#binding.set(next);
			this.render();
			this.emit('input');
		};
		this.#canvas.setPointerCapture(event.pointerId);
		const move = (pointer: PointerEvent) => update(pointer);
		let active = true;
		const finish = (pointer: PointerEvent, commit: boolean) => {
			if (!active) {
				return;
			}
			active = false;
			if (commit) {
				update(pointer);
			}
			if (this.#canvas.hasPointerCapture(pointer.pointerId)) {
				this.#canvas.releasePointerCapture(pointer.pointerId);
			}
			this.#canvas.removeEventListener('pointermove', move);
			this.#canvas.removeEventListener('pointerup', up);
			this.#canvas.removeEventListener('pointercancel', cancel);
			this.#canvas.removeEventListener('lostpointercapture', cancel);
			if (commit) {
				this.emit('change');
			}
		};
		const up = (pointer: PointerEvent) => finish(pointer, true);
		const cancel = (pointer: PointerEvent) => finish(pointer, false);
		this.#canvas.addEventListener('pointermove', move);
		this.#canvas.addEventListener('pointerup', up, { once: true });
		this.#canvas.addEventListener('pointercancel', cancel, { once: true });
		this.#canvas.addEventListener('lostpointercapture', cancel, { once: true });
		update(event);
	}

	#restartPreview() {
		this.#preview = 0;
		this.#previewStart = this.owner.clock();
	}

	#previewProgress(time = this.owner.clock()) {
		if (this.#previewStart === -Infinity) {
			return this.#preview;
		}
		return clamp((time - this.#previewStart) / theme.metrics.bezierPreviewDuration, 0, 1);
	}
}

function measure(canvas: HTMLCanvasElement) {
	const rect = canvas.getBoundingClientRect();
	return {
		left: rect.left,
		top: rect.top,
		width: Math.max(1, rect.width),
		height: Math.max(1, rect.height),
	};
}

function handlePoint(bounds: { left: number; top: number; width: number; height: number }, x: number, y: number, domain: { min: number; max: number }) {
	return {
		x: bounds.left + clamp(x, 0, 1) * bounds.width,
		y: bounds.top + yPixel(y, bounds.height, domain),
	};
}

function input(doc: Document) {
	return numberInput(doc, undefined, { step: 0.01 }, 'cfg-input cfg-input--axis');
}

function drawPad(ctx: CanvasRenderingContext2D | null, value: Vector2, options: VectorOptions) {
	if (!ctx) {
		return;
	}
	const size = fit(ctx.canvas, padSize, padSize);
	if (!size.fromLayout) {
		return;
	}
	const { width, height, scale } = size;
	const colors = canvasTheme(ctx.canvas);
	const xAxis = padAxis(options, 0);
	const yAxis = padAxis(options, 1);
	const x = ratioFromValue(value.x, xAxis) * width;
	const yRatio = ratioFromValue(value.y, yAxis);
	const y = (options.invertY ? yRatio : 1 - yRatio) * height;
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = colors.panel;
	ctx.fillRect(0, 0, width, height);
	ctx.lineWidth = Math.max(1, scale);
	ctx.strokeStyle = colors.grid;
	ctx.beginPath();
	ctx.moveTo(width / 2, 0);
	ctx.lineTo(width / 2, height);
	ctx.moveTo(0, height / 2);
	ctx.lineTo(width, height / 2);
	ctx.stroke();
	ctx.fillStyle = theme.palette.blue;
	ctx.beginPath();
	ctx.arc(clamp(x, 0, width), clamp(y, 0, height), theme.metrics.bezierHandleRadius * scale, 0, Math.PI * 2);
	ctx.fill();
}

function vectorAxisOptions(options: VectorOptions, axisIndex: number): NumberOptions {
	const axisOptions = options.axes?.[axisIndex];
	const result: NumberOptions = {};
	const min = axisOptions?.min ?? options.min;
	const max = axisOptions?.max ?? options.max;
	const step = axisOptions?.step ?? options.step;
	if (min !== undefined) {
		result.min = min;
	}
	if (max !== undefined) {
		result.max = max;
	}
	if (step !== undefined) {
		result.step = step;
	}
	return result;
}

interface PadAxis {
	min: number;
	max: number;
	step?: number;
}

function padAxis(options: VectorOptions, axisIndex: number): PadAxis {
	const axisOptions = vectorAxisOptions(options, axisIndex);
	const min = finiteNumber(axisOptions.min, -1);
	const max = finiteNumber(axisOptions.max, 1);
	const result = min <= max ? { min, max } : { min: max, max: min };
	if (axisOptions.step !== undefined) {
		return { ...result, step: axisOptions.step };
	}
	return result;
}

function finiteNumber(value: number | undefined, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function valueFromRatio(ratioValue: number, bounds: PadAxis) {
	return snap(bounds.min + clamp(ratioValue, 0, 1) * (bounds.max - bounds.min), bounds.step);
}

function ratioFromValue(value: number, bounds: PadAxis) {
	const span = bounds.max - bounds.min;
	if (!Number.isFinite(value) || span <= 0) {
		return 0;
	}
	return clamp((value - bounds.min) / span, 0, 1);
}

function drawBezier(ctx: CanvasRenderingContext2D | null, value: BezierTuple, preview: number) {
	if (!ctx) {
		return;
	}
	const size = fit(ctx.canvas, bezierSize, bezierSize);
	if (!size.fromLayout) {
		return;
	}
	const { width, height, scale } = size;
	const colors = canvasTheme(ctx.canvas);
	const domain = bezierDomain(value);
	const point = (x: number, y: number): [number, number] => [clamp(x, 0, 1) * width, yPixel(y, height, domain)];
	const x1 = value[0] ?? 0;
	const y1 = value[1] ?? 0;
	const x2 = value[2] ?? 0;
	const y2 = value[3] ?? 0;
	const [ax, ay] = point(0, 0);
	const [bx, by] = point(x1, y1);
	const [cx, cy] = point(x2, y2);
	const [dx, dy] = point(1, 1);
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = colors.panel;
	ctx.fillRect(0, 0, width, height);
	drawBezierGrid(ctx, width, height, scale, domain, colors.grid);
	drawTimingTicks(ctx, width, scale, colors.guide);
	drawControlGuides(ctx, bx, by, cx, cy, width, scale, colors.guide);
	ctx.strokeStyle = colors.guide;
	ctx.lineWidth = Math.max(1, scale);
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(bx, by);
	ctx.moveTo(dx, dy);
	ctx.lineTo(cx, cy);
	ctx.stroke();
	ctx.lineWidth = 2 * scale;
	ctx.strokeStyle = theme.palette.blue;
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.bezierCurveTo(bx, by, cx, cy, dx, dy);
	ctx.stroke();
	drawPreviewMarker(ctx, value, preview, width, height, scale, domain, colors);
	drawHandle(ctx, bx, by, theme.palette.gold, colors.panel, scale);
	drawHandle(ctx, cx, cy, theme.palette.blue, colors.panel, scale);
	drawHandle(ctx, ax, ay, colors.muted, colors.panel, scale);
	drawHandle(ctx, dx, dy, colors.muted, colors.panel, scale);
}

function bezierDomain(value: BezierTuple) {
	const min = Math.min(0, value[1] ?? 0, value[3] ?? 0);
	const max = Math.max(1, value[1] ?? 0, value[3] ?? 0);
	if (min === 0 && max === 1) {
		return { min, max };
	}
	const pad = (max - min) * 0.08;
	return { min: Math.max(-2, min - pad), max: Math.min(2, max + pad) };
}

function yPixel(value: number, height: number, domain: { min: number; max: number }) {
	return (1 - (clamp(value, domain.min, domain.max) - domain.min) / (domain.max - domain.min || 1)) * height;
}

function yValue(pixel: number, height: number, domain: { min: number; max: number }) {
	return domain.min + (1 - pixel / Math.max(1, height)) * (domain.max - domain.min);
}

function drawBezierGrid(ctx: CanvasRenderingContext2D, width: number, height: number, scale: number, domain: { min: number; max: number }, stroke: string) {
	ctx.save();
	ctx.lineWidth = Math.max(1, scale);
	ctx.strokeStyle = stroke;
	ctx.globalAlpha = 0.7;
	ctx.beginPath();
	ctx.moveTo(0, yPixel(0, height, domain));
	ctx.lineTo(width, yPixel(1, height, domain));
	ctx.moveTo(width / 2, 0);
	ctx.lineTo(width / 2, height);
	ctx.moveTo(0, yPixel((domain.min + domain.max) / 2, height, domain));
	ctx.lineTo(width, yPixel((domain.min + domain.max) / 2, height, domain));
	for (const ratio of [0.25, 0.75]) {
		const x = ratio * width;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
	}
	ctx.stroke();
	ctx.restore();
}

function drawTimingTicks(ctx: CanvasRenderingContext2D, width: number, scale: number, stroke: string) {
	const count = Math.max(2, theme.metrics.bezierTickCount);
	const tall = theme.metrics.bezierTickHeight * scale;
	const short = tall * 0.62;
	ctx.save();
	ctx.lineWidth = Math.max(1, scale);
	ctx.strokeStyle = stroke;
	ctx.globalAlpha = 0.72;
	ctx.beginPath();
	for (let index = 0; index <= count; index += 1) {
		const x = (index / count) * width;
		const height = index % 3 === 0 ? tall : short;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
	}
	ctx.stroke();
	ctx.restore();
}

function drawControlGuides(ctx: CanvasRenderingContext2D, bx: number, by: number, cx: number, cy: number, width: number, scale: number, stroke: string) {
	ctx.save();
	ctx.lineWidth = Math.max(1, scale);
	ctx.strokeStyle = stroke;
	ctx.globalAlpha = 0.46;
	ctx.setLineDash([2 * scale, 3 * scale]);
	ctx.beginPath();
	ctx.moveTo(bx, by);
	ctx.lineTo(width, by);
	ctx.moveTo(0, cy);
	ctx.lineTo(cx, cy);
	ctx.stroke();
	ctx.restore();
}

function drawPreviewMarker(
	ctx: CanvasRenderingContext2D,
	value: BezierTuple,
	preview: number,
	width: number,
	height: number,
	scale: number,
	domain: { min: number; max: number },
	colors: { guide: string; panel: string },
) {
	const progress = clamp(preview, 0, 1);
	const x1 = value[0] ?? 0;
	const y1 = value[1] ?? 0;
	const x2 = value[2] ?? 0;
	const y2 = value[3] ?? 0;
	const t = solveBezierX(x1, x2, progress);
	const x = progress * width;
	const y = yPixel(cubic(0, y1, y2, 1, t), height, domain);
	ctx.save();
	ctx.lineWidth = Math.max(1, scale);
	ctx.strokeStyle = colors.guide;
	ctx.globalAlpha = 0.38;
	ctx.setLineDash([2 * scale, 3 * scale]);
	ctx.beginPath();
	ctx.moveTo(x, 0);
	ctx.lineTo(x, height);
	ctx.stroke();
	ctx.globalAlpha = 1;
	ctx.fillStyle = theme.palette.gold;
	ctx.strokeStyle = colors.panel;
	ctx.lineWidth = 2 * scale;
	ctx.beginPath();
	ctx.arc(x, y, theme.metrics.bezierPreviewMarkerRadius * scale, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}

function solveBezierX(x1: number, x2: number, target: number) {
	let t = target;
	for (let index = 0; index < bezierSolverIterations; index += 1) {
		const x = cubic(0, x1, x2, 1, t) - target;
		const slope = cubicDerivative(0, x1, x2, 1, t);
		if (Math.abs(slope) < 0.000_001) {
			break;
		}
		t = clamp(t - x / slope, 0, 1);
	}
	let low = 0;
	let high = 1;
	for (let index = 0; index < bezierBinaryIterations; index += 1) {
		const x = cubic(0, x1, x2, 1, t);
		if (x < target) {
			low = t;
		} else {
			high = t;
		}
		t = (low + high) / 2;
	}
	return t;
}

function cubic(a: number, b: number, c: number, d: number, t: number) {
	const one = 1 - t;
	return one * one * one * a + 3 * one * one * t * b + 3 * one * t * t * c + t * t * t * d;
}

function cubicDerivative(a: number, b: number, c: number, d: number, t: number) {
	const one = 1 - t;
	return 3 * one * one * (b - a) + 6 * one * t * (c - b) + 3 * t * t * (d - c);
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string, stroke: string, scale: number) {
	ctx.lineWidth = 2 * scale;
	ctx.fillStyle = fill;
	ctx.strokeStyle = stroke;
	ctx.beginPath();
	ctx.arc(x, y, theme.metrics.bezierHandleRadius * scale, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
}
