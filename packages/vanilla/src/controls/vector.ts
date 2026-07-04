import type { BezierOptions, BezierTuple, NumberOptions, Vector2, VectorOptions } from '@u29dc/cfg-core';
import { axis, clamp, el, number, snap, text } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding, bezier, interval, vector } from '../binding';

const padSize = 96;
const bezierSize = 96;

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
		this.#ctx = this.#canvas.getContext('2d');
		this.#x = input(owner.doc);
		this.#y = input(owner.doc);
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
		event.preventDefault();
		this.#canvas.setPointerCapture(event.pointerId);
		const update = (pointer: PointerEvent) => {
			const rect = this.#canvas.getBoundingClientRect();
			const min = this.#options.min ?? -1;
			const max = this.#options.max ?? 1;
			const x = clamp((pointer.clientX - rect.left) / rect.width, 0, 1);
			const yRaw = clamp((pointer.clientY - rect.top) / rect.height, 0, 1);
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
		event.preventDefault();
		const rect = this.#canvas.getBoundingClientRect();
		const value = this.get();
		const h1 = Math.hypot(event.clientX - rect.left - value[0] * rect.width, event.clientY - rect.top);
		const h2 = Math.hypot(event.clientX - rect.left - value[2] * rect.width, event.clientY - rect.top);
		const handle = h1 <= h2 ? 0 : 2;
		const update = (pointer: PointerEvent) => {
			const bounds = this.#canvas.getBoundingClientRect();
			const next: BezierTuple = [...this.get()];
			next[handle] = snap(clamp((pointer.clientX - bounds.left) / bounds.width, 0, 1), 0.01);
			next[handle + 1] = snap(clamp(1 - (pointer.clientY - bounds.top) / bounds.height, -2, 2), 0.01);
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
	ctx.fillStyle = '#11161d';
	ctx.fillRect(0, 0, padSize, padSize);
	ctx.strokeStyle = '#303a45';
	ctx.beginPath();
	ctx.moveTo(padSize / 2, 0);
	ctx.lineTo(padSize / 2, padSize);
	ctx.moveTo(0, padSize / 2);
	ctx.lineTo(padSize, padSize / 2);
	ctx.stroke();
	ctx.fillStyle = '#78a6ff';
	ctx.beginPath();
	ctx.arc(clamp(x, 0, padSize), clamp(y, 0, padSize), 4, 0, Math.PI * 2);
	ctx.fill();
}

function drawBezier(ctx: CanvasRenderingContext2D | null, value: BezierTuple) {
	if (!ctx) {
		return;
	}
	const point = (x: number, y: number): [number, number] => [x * bezierSize, (1 - clamp(y, 0, 1)) * bezierSize];
	const x1 = value[0] ?? 0;
	const y1 = value[1] ?? 0;
	const x2 = value[2] ?? 0;
	const y2 = value[3] ?? 0;
	const [ax, ay] = point(0, 0);
	const [bx, by] = point(x1, y1);
	const [cx, cy] = point(x2, y2);
	const [dx, dy] = point(1, 1);
	ctx.clearRect(0, 0, bezierSize, bezierSize);
	ctx.fillStyle = '#11161d';
	ctx.fillRect(0, 0, bezierSize, bezierSize);
	ctx.strokeStyle = '#78a6ff';
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.bezierCurveTo(bx, by, cx, cy, dx, dy);
	ctx.stroke();
}
