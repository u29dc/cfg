import type { BezierOptions, BezierTuple, NumberOptions, Vector2, VectorOptions } from '@u29dc/cfg-core';
import { axis, clamp, el, number, snap, text, theme } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding, bezier, interval, vector } from '../binding';

const padSize = theme.metrics.padSize;
const bezierSize = theme.metrics.bezierSize;

export class VectorControl<T extends Record<string, unknown>, K extends keyof T> extends Base<unknown> {
	readonly #binding: Binding<unknown>;
	readonly #axes: readonly string[];
	readonly #inputs = new Map<string, HTMLInputElement>();
	readonly #options: VectorOptions;

	constructor(owner: Owner, target: T, key: K, options: VectorOptions, axes: readonly string[]) {
		const binding = new Binding(target, key, (value) => vector(value, axes, options));
		super(owner, `vector${axes.length}`, options, binding.get());
		this.#binding = binding;
		this.#axes = axes;
		this.#options = options;
		const row = el(owner.doc, 'div', 'cfg-vector');
		for (const axisName of axes) {
			row.append(this.#axis(axisName));
		}
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
			const input = this.#inputs.get(axisName);
			if (input) {
				input.value = text(value[axisName] ?? 0);
			}
		}
	}

	#axis(axisName: string) {
		const input = this.owner.doc.createElement('input');
		input.type = 'number';
		input.className = 'cfg-input cfg-input--axis';
		input.step = String(this.#options.step ?? 0.01);
		input.disabled = this.disabled;
		this.#inputs.set(axisName, input);
		input.addEventListener('input', () => {
			const current = { ...(this.get() as Record<string, number>) };
			const value = number(input.value, this.#axisOptions(axisName));
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
		input.addEventListener('change', () => this.emit('change'));
		return axis(this.owner.doc, axisName.toUpperCase(), input);
	}

	#axisOptions(axisName: string): NumberOptions {
		const axisOptions = this.#options.axes?.[this.#axes.indexOf(axisName)];
		const result: NumberOptions = {};
		const min = axisOptions?.min ?? this.#options.min;
		const max = axisOptions?.max ?? this.#options.max;
		const step = axisOptions?.step ?? this.#options.step;
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
}

export class XyPad<T extends Record<string, unknown>, K extends keyof T> extends Base<Vector2> {
	readonly #binding: Binding<Vector2>;
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	readonly #x: HTMLInputElement;
	readonly #y: HTMLInputElement;
	readonly #options: VectorOptions;

	constructor(owner: Owner, target: T, key: K, options: VectorOptions = {}) {
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
		this.field.append(this.#canvas, fields);
		this.#x.addEventListener('input', () => this.#setField('x', this.#x.value));
		this.#y.addEventListener('input', () => this.#setField('y', this.#y.value));
		this.#canvas.addEventListener('pointerdown', (event) => this.#pointer(event));
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
		const value = { ...this.get(), [axisName]: number(raw, this.#options) };
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
			const min = this.#options.min ?? -1;
			const max = this.#options.max ?? 1;
			const x = clamp((pointer.clientX - bounds.left) / bounds.width, 0, 1);
			const yRaw = clamp((pointer.clientY - bounds.top) / bounds.height, 0, 1);
			const y = this.#options.invertY ? yRaw : 1 - yRaw;
			this.#binding.set({
				x: snap(min + x * (max - min), this.#options.step),
				y: snap(min + y * (max - min), this.#options.step),
			});
			this.render();
			this.emit('input');
		};
		const move = (pointer: PointerEvent) => update(pointer);
		const up = (pointer: PointerEvent) => {
			update(pointer);
			this.#canvas.releasePointerCapture(pointer.pointerId);
			this.#canvas.removeEventListener('pointermove', move);
			this.#canvas.removeEventListener('pointerup', up);
			this.emit('change');
		};
		this.#canvas.addEventListener('pointermove', move);
		this.#canvas.addEventListener('pointerup', up, { once: true });
		update(event);
	}
}

export class Interval<T extends Record<string, unknown>, K extends keyof T> extends Base<unknown> {
	readonly #binding: Binding<unknown>;
	readonly #min: HTMLInputElement;
	readonly #max: HTMLInputElement;
	readonly #options: NumberOptions;

	constructor(owner: Owner, target: T, key: K, options: NumberOptions = {}) {
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
		this.field.append(row);
		this.#min.addEventListener('input', () => this.#update());
		this.#max.addEventListener('input', () => this.#update());
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

export class Bezier<T extends Record<string, unknown>, K extends keyof T> extends Base<BezierTuple> {
	readonly #binding: Binding<BezierTuple>;
	readonly #inputs: HTMLInputElement[] = [];
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;

	constructor(owner: Owner, target: T, key: K, options: BezierOptions = {}) {
		const binding = new Binding(target, key, bezier);
		super(owner, 'cubic-bezier', options, binding.get());
		this.#binding = binding;
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-bezier';
		this.#canvas.width = bezierSize;
		this.#canvas.height = bezierSize;
		this.#canvas.setAttribute('aria-disabled', String(this.disabled));
		this.#ctx = this.#canvas.getContext('2d');
		this.field.append(this.#canvas, this.#fields(), this.#presets(options));
		this.#canvas.addEventListener('pointerdown', (event) => this.#pointer(event));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: BezierTuple) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const value = this.get();
		for (let index = 0; index < this.#inputs.length; index += 1) {
			const field = this.#inputs[index];
			if (field) {
				field.value = text(value[index] ?? 0);
			}
		}
		drawBezier(this.#ctx, value);
	}

	#fields() {
		const row = el(this.owner.doc, 'div', 'cfg-vector cfg-vector--bezier');
		for (const label of ['x1', 'y1', 'x2', 'y2']) {
			const field = input(this.owner.doc);
			field.step = '0.01';
			field.disabled = this.disabled;
			field.addEventListener('input', () => this.#update());
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
		this.#binding.set(this.#inputs.map((field) => Number(field.value)) as BezierTuple);
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
		const up = (pointer: PointerEvent) => {
			update(pointer);
			this.#canvas.releasePointerCapture(pointer.pointerId);
			this.#canvas.removeEventListener('pointermove', move);
			this.#canvas.removeEventListener('pointerup', up);
			this.emit('change');
		};
		this.#canvas.addEventListener('pointermove', move);
		this.#canvas.addEventListener('pointerup', up, { once: true });
		update(event);
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
	const node = doc.createElement('input');
	node.type = 'number';
	node.className = 'cfg-input cfg-input--axis';
	node.step = '0.01';
	return node;
}

function drawPad(ctx: CanvasRenderingContext2D | null, value: Vector2, options: VectorOptions) {
	if (!ctx) {
		return;
	}
	const min = options.min ?? -1;
	const max = options.max ?? 1;
	const x = ((value.x - min) / (max - min)) * padSize;
	const yRatio = (value.y - min) / (max - min);
	const y = (options.invertY ? yRatio : 1 - yRatio) * padSize;
	ctx.clearRect(0, 0, padSize, padSize);
	ctx.fillStyle = theme.canvas.panel;
	ctx.fillRect(0, 0, padSize, padSize);
	ctx.strokeStyle = theme.canvas.grid;
	ctx.beginPath();
	ctx.moveTo(padSize / 2, 0);
	ctx.lineTo(padSize / 2, padSize);
	ctx.moveTo(0, padSize / 2);
	ctx.lineTo(padSize, padSize / 2);
	ctx.stroke();
	ctx.fillStyle = theme.palette.blue;
	ctx.beginPath();
	ctx.arc(clamp(x, 0, padSize), clamp(y, 0, padSize), theme.metrics.bezierHandleRadius, 0, Math.PI * 2);
	ctx.fill();
}

function drawBezier(ctx: CanvasRenderingContext2D | null, value: BezierTuple) {
	if (!ctx) {
		return;
	}
	const domain = bezierDomain(value);
	const point = (x: number, y: number): [number, number] => [clamp(x, 0, 1) * bezierSize, yPixel(y, bezierSize, domain)];
	const x1 = value[0] ?? 0;
	const y1 = value[1] ?? 0;
	const x2 = value[2] ?? 0;
	const y2 = value[3] ?? 0;
	const [ax, ay] = point(0, 0);
	const [bx, by] = point(x1, y1);
	const [cx, cy] = point(x2, y2);
	const [dx, dy] = point(1, 1);
	ctx.clearRect(0, 0, bezierSize, bezierSize);
	ctx.fillStyle = theme.canvas.panel;
	ctx.fillRect(0, 0, bezierSize, bezierSize);
	ctx.lineWidth = 1;
	ctx.strokeStyle = theme.canvas.grid;
	ctx.beginPath();
	ctx.moveTo(0, yPixel(0, bezierSize, domain));
	ctx.lineTo(bezierSize, yPixel(1, bezierSize, domain));
	ctx.moveTo(bezierSize / 2, 0);
	ctx.lineTo(bezierSize / 2, bezierSize);
	ctx.moveTo(0, yPixel((domain.min + domain.max) / 2, bezierSize, domain));
	ctx.lineTo(bezierSize, yPixel((domain.min + domain.max) / 2, bezierSize, domain));
	ctx.stroke();
	ctx.strokeStyle = theme.canvas.guide;
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(bx, by);
	ctx.moveTo(dx, dy);
	ctx.lineTo(cx, cy);
	ctx.stroke();
	ctx.lineWidth = 2;
	ctx.strokeStyle = theme.palette.blue;
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.bezierCurveTo(bx, by, cx, cy, dx, dy);
	ctx.stroke();
	drawHandle(ctx, bx, by, theme.palette.gold);
	drawHandle(ctx, cx, cy, theme.palette.blue);
	drawHandle(ctx, ax, ay, theme.canvas.muted);
	drawHandle(ctx, dx, dy, theme.canvas.muted);
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

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string) {
	ctx.lineWidth = 2;
	ctx.fillStyle = fill;
	ctx.strokeStyle = theme.canvas.panel;
	ctx.beginPath();
	ctx.arc(x, y, theme.metrics.bezierHandleRadius, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
}
