import type { ControlOptions, MultilineOptions, NumberOptions, TextOptions } from '@u29dc/cfg-core';
import { number as clean, text as format } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding, bool, string } from '../binding';

type RecordKey<T> = keyof T;

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

	constructor(owner: Owner, target: T, key: K, options: NumberOptions = {}, mode: 'number' | 'slider' | 'number-slider') {
		const binding = new Binding(target, key, (value) => clean(value, options));
		super(owner, mode, options, binding.get());
		this.#binding = binding;
		this.#options = options;

		if (mode !== 'slider') {
			this.#number = field(owner.doc, `${this.id}-input`, 'number', options);
			this.field.append(this.#number);
		}
		if (mode !== 'number') {
			this.#range = field(owner.doc, `${this.id}-range`, 'range', options);
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

function field(doc: Document, id: string, type: 'number' | 'range', options: NumberOptions) {
	const input = doc.createElement('input');
	input.id = id;
	input.type = type;
	input.className = type === 'range' ? 'cfg-range' : 'cfg-input cfg-input--number';
	if (options.min !== undefined) {
		input.min = String(options.min);
	}
	if (options.max !== undefined) {
		input.max = String(options.max);
	}
	input.step = String(options.step ?? (type === 'range' ? 0.01 : 'any'));
	return input;
}
