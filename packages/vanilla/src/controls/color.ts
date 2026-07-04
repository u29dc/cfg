import type { ColorOptions, PaletteColor, PaletteOptions, PaletteSection } from '@u29dc/cfg-core';
import { el, theme } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding } from '../binding';
import { color, six, swatch } from '../utils/color';

export class ColorControl<T extends Record<string, unknown>, K extends keyof T> extends Base<string> {
	readonly #binding: Binding<string>;
	readonly #text: HTMLInputElement;
	readonly #picker: HTMLInputElement;
	readonly #canvas: HTMLCanvasElement;

	constructor(owner: Owner, target: T, key: K, options: ColorOptions = {}) {
		const binding = new Binding(target, key, color);
		super(owner, 'color', options, binding.get());
		this.#binding = binding;
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-swatch-canvas';
		this.#canvas.width = 20;
		this.#canvas.height = 20;
		this.#picker = owner.doc.createElement('input');
		this.#picker.type = 'color';
		this.#picker.className = 'cfg-color-picker';
		this.#text = owner.doc.createElement('input');
		this.#text.id = `${this.id}-input`;
		this.#text.type = 'text';
		this.#text.className = 'cfg-input cfg-input--color';
		this.field.append(this.#canvas, this.#picker, this.#text);
		this.#text.addEventListener('input', () => this.#set(this.#text.value, 'input'));
		this.#text.addEventListener('change', () => this.emit('change'));
		this.#picker.addEventListener('input', () => this.#set(this.#picker.value, 'change'));
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
		this.#text.value = value;
		this.#picker.value = six(value);
		swatch(this.#canvas.getContext('2d'), value, 20);
	}

	#set(value: string, event: 'input' | 'change') {
		this.#binding.set(value);
		this.render();
		this.emit(event);
	}
}

export class PaletteControl<T extends Record<string, unknown>, K extends keyof T> extends Base<string> {
	readonly #binding: Binding<string>;
	readonly #buttons: HTMLButtonElement[] = [];

	constructor(owner: Owner, target: T, key: K, options: PaletteOptions) {
		const items = flatten(options.colors);
		const binding = new Binding(target, key, (value) => {
			const parsed = color(value);
			return items.some((item) => item.value === parsed) ? parsed : (items[0]?.value ?? theme.palette.black);
		});
		super(owner, 'palette', options, binding.get());
		this.#binding = binding;
		const row = el(owner.doc, 'div', 'cfg-palette');
		for (const item of items) {
			const button = owner.doc.createElement('button');
			button.type = 'button';
			button.className = 'cfg-swatch';
			button.ariaLabel = item.label ?? item.value;
			button.dataset['cfgValue'] = item.value;
			button.disabled = options.readonly ?? false;
			const canvas = owner.doc.createElement('canvas');
			canvas.width = 18;
			canvas.height = 18;
			canvas.className = 'cfg-swatch-canvas';
			swatch(canvas.getContext('2d'), item.value, 18);
			button.append(canvas);
			button.addEventListener('click', () => this.#choose(item.value));
			this.#buttons.push(button);
			row.append(button);
		}
		this.field.append(row);
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
		const current = this.get();
		for (const button of this.#buttons) {
			button.dataset['cfgSelected'] = String(button.dataset['cfgValue'] === current);
		}
	}

	#choose(value: string) {
		this.#binding.set(value);
		this.render();
		this.emit('input');
		this.emit('change');
	}
}

function flatten(items: readonly (string | PaletteColor | PaletteSection)[]) {
	const colors: PaletteColor[] = [];
	for (const item of items) {
		if (typeof item === 'string') {
			colors.push({ label: item, value: color(item) });
		} else if ('colors' in item) {
			for (const nested of item.colors) {
				colors.push(typeof nested === 'string' ? { label: `${item.label} ${nested}`, value: color(nested) } : { ...nested, value: color(nested.value) });
			}
		} else {
			colors.push({ ...item, value: color(item.value) });
		}
	}
	return colors;
}
