import type { ControlOptions, MultilineOptions, NumberOptions, TextOptions } from '@u29dc/cfg-core';
import { number as clean, text as format } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding, bool, string } from '../binding';

type RecordKey<T> = keyof T;
const svgNs = 'http://www.w3.org/2000/svg';
const dragThreshold = 2;
const guideOffset = 20;

export class Toggle<T extends Record<string, unknown>, K extends RecordKey<T>> extends Base<boolean> {
	readonly #binding: Binding<boolean>;
	readonly #input: HTMLInputElement;

	constructor(owner: Owner, target: T, key: K, options: ControlOptions = {}) {
		const binding = new Binding(target, key, bool);
		super(owner, 'toggle', options, binding.get());
		this.#binding = binding;
		this.#input = owner.doc.createElement('input');
		this.#input.id = `${this.id}-input`;
		this.#input.className = 'cfg-toggle';
		this.#input.type = 'checkbox';
		this.#input.disabled = this.disabled;
		this.field.append(this.#input);
		this.#input.addEventListener('input', () => {
			this.#binding.set(this.#input.checked);
			this.emit('input');
		});
		this.#input.addEventListener('change', () => this.emit('change'));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: boolean) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		this.#input.checked = this.get();
	}
}

export class Numeric<T extends Record<string, unknown>, K extends RecordKey<T>> extends Base<number> {
	readonly #binding: Binding<number>;
	readonly #options: NumberOptions;
	readonly #number?: HTMLInputElement;
	readonly #range?: HTMLInputElement;
	readonly #drag?: NumberDragHandle;

	constructor(owner: Owner, target: T, key: K, options: NumberOptions = {}, mode: 'number' | 'slider' | 'number-slider') {
		const binding = new Binding(target, key, (value) => clean(value, options));
		super(owner, mode, options, binding.get());
		this.#binding = binding;
		this.#options = options;

		if (mode !== 'slider') {
			const numberField = createNumberField(owner.doc, `${this.id}-input`, options);
			this.#number = numberField.input;
			this.#drag = numberField.drag;
			this.field.append(numberField.element);
		}
		if (mode !== 'number') {
			this.#range = rangeInput(owner.doc, `${this.id}-range`, options);
			this.field.prepend(this.#range);
		}

		for (const input of [this.#number, this.#range]) {
			if (!input) {
				continue;
			}
			input.addEventListener('input', () => {
				this.#binding.set(input.value);
				this.render();
				this.emit('input');
			});
			input.addEventListener('change', () => this.emit('change'));
		}
		this.#number?.addEventListener('keydown', (event) => this.#key(event));
		this.#number?.addEventListener('keyup', (event) => {
			if (keyStep(this.#options, event) !== 0) {
				this.emit('change');
			}
		});
		this.#number?.addEventListener('pointerdown', (event) => this.#pointer(event));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: number) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const value = this.get();
		const display = this.#options.format ? this.#options.format(value) : format(value);
		if (this.#number && this.#number.value !== display) {
			this.#number.value = display;
		}
		if (this.#range && this.#range.value !== String(value)) {
			this.#range.value = String(value);
		}
	}

	#key(event: KeyboardEvent) {
		const step = keyStep(this.#options, event);
		if (step === 0) {
			return;
		}
		event.preventDefault();
		this.#binding.set(clean(this.get() + step, this.#options));
		this.render();
		this.emit('input');
	}

	#pointer(event: PointerEvent) {
		if (!this.#number || !this.#drag || this.disabled || event.button !== 0) {
			return;
		}
		const origin = this.get();
		const scale = pointerScale(this.#options, origin);
		const start = event.clientX;
		let dragging = false;
		this.#number.setPointerCapture(event.pointerId);
		const move = (pointer: PointerEvent) => {
			const delta = pointer.clientX - start;
			if (!dragging && Math.abs(delta) < dragThreshold) {
				return;
			}
			pointer.preventDefault();
			if (!dragging) {
				dragging = true;
				this.#number?.blur();
				this.#drag?.show();
			}
			const next = clean(origin + delta * scale, this.#options);
			this.#binding.set(next);
			this.render();
			this.#drag?.render(origin, next, scale, this.#format(next));
			this.emit('input');
		};
		const up = (pointer: PointerEvent) => {
			move(pointer);
			this.#number?.releasePointerCapture(pointer.pointerId);
			this.#number?.removeEventListener('pointermove', move);
			this.#number?.removeEventListener('pointerup', up);
			this.#drag?.hide();
			if (dragging) {
				this.emit('change');
			}
		};
		this.#number.addEventListener('pointermove', move);
		this.#number.addEventListener('pointerup', up, { once: true });
	}

	#format(value: number) {
		return this.#options.format ? this.#options.format(value) : format(value);
	}
}

export class Textual<T extends Record<string, unknown>, K extends RecordKey<T>> extends Base<string> {
	readonly #binding: Binding<string>;
	readonly #input: HTMLInputElement | HTMLTextAreaElement;

	constructor(owner: Owner, target: T, key: K, options: TextOptions | MultilineOptions = {}, multiline = false) {
		const binding = new Binding(target, key, string);
		super(owner, multiline ? 'multiline' : 'text', options, binding.get());
		this.#binding = binding;
		this.#input = multiline ? owner.doc.createElement('textarea') : owner.doc.createElement('input');
		this.#input.id = `${this.id}-input`;
		this.#input.className = multiline ? 'cfg-textarea' : 'cfg-input';
		if (!multiline) {
			(this.#input as HTMLInputElement).type = 'text';
		}
		if (multiline && 'rows' in options && options.rows) {
			(this.#input as HTMLTextAreaElement).rows = options.rows;
		}
		if (options.placeholder) {
			this.#input.placeholder = options.placeholder;
		}
		this.#input.disabled = this.disabled;
		this.field.append(this.#input);
		this.#input.addEventListener('input', () => {
			this.#binding.set(this.#input.value);
			this.emit('input');
		});
		this.#input.addEventListener('change', () => this.emit('change'));
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: string) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const value = this.get();
		if (this.#input.value !== value) {
			this.#input.value = value;
		}
	}
}

export function numberInput(doc: Document, id: string | undefined, options: NumberOptions, className = 'cfg-input cfg-input--number') {
	const input = doc.createElement('input');
	if (id !== undefined) {
		input.id = id;
	}
	input.type = 'text';
	input.className = className;
	input.disabled = options.disabled ?? false;
	input.inputMode = 'decimal';
	input.autocomplete = 'off';
	input.spellcheck = false;
	if (options.min !== undefined) {
		input.min = String(options.min);
	}
	if (options.max !== undefined) {
		input.max = String(options.max);
	}
	input.step = String(options.step ?? 'any');
	return input;
}

function rangeInput(doc: Document, id: string, options: NumberOptions) {
	const input = doc.createElement('input');
	input.id = id;
	input.type = 'range';
	input.className = 'cfg-range';
	input.disabled = options.disabled ?? false;
	if (options.min !== undefined) {
		input.min = String(options.min);
	}
	if (options.max !== undefined) {
		input.max = String(options.max);
	}
	input.step = String(options.step ?? 0.01);
	return input;
}

interface NumberField {
	element: HTMLElement;
	input: HTMLInputElement;
	drag: NumberDragHandle;
}

interface NumberDragHandle {
	show: () => void;
	hide: () => void;
	render: (origin: number, value: number, scale: number, label: string) => void;
}

function createNumberField(doc: Document, id: string, options: NumberOptions): NumberField {
	const element = doc.createElement('div');
	element.className = 'cfg-number';
	const input = numberInput(doc, id, options);
	const guide = doc.createElementNS(svgNs, 'svg');
	guide.classList.add('cfg-number-guide');
	guide.setAttribute('aria-hidden', 'true');
	guide.setAttribute('hidden', '');
	const body = path(guide, 'cfg-number-guide__body');
	const head = path(guide, 'cfg-number-guide__head');
	const bubble = doc.createElementNS(svgNs, 'g');
	bubble.classList.add('cfg-number-guide__bubble');
	const rect = doc.createElementNS(svgNs, 'rect');
	rect.classList.add('cfg-number-guide__bubble-bg');
	const text = doc.createElementNS(svgNs, 'text');
	text.classList.add('cfg-number-guide__bubble-text');
	bubble.append(rect, text);
	guide.append(body, head, bubble);
	element.append(input, guide);
	return {
		element,
		input,
		drag: {
			show: () => {
				element.dataset['cfgDragging'] = 'true';
				guide.removeAttribute('hidden');
			},
			hide: () => {
				delete element.dataset['cfgDragging'];
				guide.setAttribute('hidden', '');
			},
			render: (origin, value, scale, label) => {
				renderNumberGuide(element, guide, body, head, rect, text, origin, value, scale, label);
			},
		},
	};
}

function path(svg: SVGSVGElement, className: string) {
	const node = svg.ownerDocument.createElementNS(svgNs, 'path');
	node.classList.add(className);
	return node;
}

function renderNumberGuide(
	element: HTMLElement,
	guide: SVGSVGElement,
	body: SVGPathElement,
	head: SVGPathElement,
	rect: SVGRectElement,
	text: SVGTextElement,
	origin: number,
	value: number,
	scale: number,
	label: string,
) {
	const bounds = element.getBoundingClientRect();
	const width = Math.max(1, Math.round(bounds.width));
	const height = Math.max(1, Math.round(bounds.height));
	const guideHeight = height + guideOffset;
	const center = width / 2;
	const middle = guideOffset + height / 2;
	const delta = scale === 0 ? 0 : (value - origin) / scale;
	const x = center + delta;
	const direction = Math.sign(delta);
	const arrowOffset = direction === 0 ? 0 : -direction;
	const bend = clampNumber(-(delta + arrowOffset), -4, 4);
	const bubbleWidth = Math.max(34, Math.round(label.length * 7 + 10));
	guide.setAttribute('viewBox', `0 0 ${width} ${guideHeight}`);
	body.setAttribute('d', `M ${center},${middle} L ${x},${middle}`);
	head.setAttribute(
		'd',
		[`M ${x + arrowOffset + bend},${middle - 4} L ${x + arrowOffset},${middle} L ${x + arrowOffset + bend},${middle + 4}`, `M ${x},${middle - 6} L ${x},${middle + 6}`].join(' '),
	);
	rect.setAttribute('x', String(x - bubbleWidth / 2));
	rect.setAttribute('y', '1');
	rect.setAttribute('width', String(bubbleWidth));
	rect.setAttribute('height', '15');
	rect.setAttribute('rx', '2');
	text.setAttribute('x', String(x));
	text.setAttribute('y', '8.5');
	text.textContent = label;
}

function keyStep(options: NumberOptions, event: KeyboardEvent) {
	const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
	if (direction === 0) {
		return 0;
	}
	const base = options.keyScale ?? options.step ?? 1;
	return direction * base * (event.altKey ? 0.1 : 1) * (event.shiftKey ? 10 : 1);
}

function pointerScale(options: NumberOptions, value: number) {
	if (options.pointerScale !== undefined) {
		return options.pointerScale;
	}
	const base = Math.abs(options.step ?? value);
	return base === 0 ? 0.1 : 10 ** (Math.floor(Math.log10(base)) - 1);
}

function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}
