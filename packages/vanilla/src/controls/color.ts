import type { ColorOptions, PaletteColor, PaletteOptions, PaletteSection } from '@u29dc/cfg-core';
import { axis, clamp, el, number, theme } from '@u29dc/cfg-core';

import { Base, type Owner } from '../base';
import { Binding } from '../binding';
import { fit } from '../utils/canvas';
import { color, createSwatch, css, format, hsvFromRgb, parseColor, type Rgba, rgba, rgbFromHsv, swatch } from '../utils/color';
import { numberInput } from './input';

type Picker = {
	readonly root: HTMLElement;
	readonly map: HTMLCanvasElement;
	readonly hue: HTMLCanvasElement;
	readonly alpha: HTMLCanvasElement;
	readonly red: HTMLInputElement;
	readonly green: HTMLInputElement;
	readonly blue: HTMLInputElement;
	readonly opacity: HTMLInputElement;
	owner: ColorControl<Record<string, unknown>> | undefined;
};

export class ColorControl<T extends Record<string, unknown>> extends Base<string> {
	static readonly #pickers = new WeakMap<Document, Picker>();
	readonly #binding: Binding<string>;
	readonly #text: HTMLInputElement;
	readonly #swatch: HTMLSpanElement;
	readonly #toggle: HTMLButtonElement;
	readonly #options: ColorOptions;
	#open = false;
	#editing = false;
	#committed: string;

	constructor(owner: Owner, target: T, key: keyof T, options: ColorOptions = {}) {
		const binding = new Binding(target, key, color);
		super(owner, 'color', options, binding.get());
		this.#binding = binding;
		this.#options = options;
		this.#committed = binding.get();
		this.#swatch = createSwatch(owner.doc);
		this.#toggle = owner.doc.createElement('button');
		this.#toggle.type = 'button';
		this.#toggle.className = 'cfg-color-toggle';
		this.#toggle.disabled = this.disabled;
		this.#toggle.ariaLabel = 'Open color picker';
		this.#toggle.setAttribute('aria-expanded', 'false');
		this.#toggle.append(this.#swatch);
		this.#text = owner.doc.createElement('input');
		this.#text.id = `${this.id}-input`;
		this.#text.type = 'text';
		this.#text.className = 'cfg-input cfg-input--color';
		this.#text.disabled = this.disabled;
		const row = el(owner.doc, 'div', 'cfg-color-row');
		row.append(this.#toggle, this.#text);
		this.#toggle.setAttribute('aria-controls', `${this.id}-panel`);
		this.field.append(row);
		this.#toggle.addEventListener('click', () => this.#setOpen(!this.#open));
		this.#toggle.addEventListener('keydown', (event) => this.#closeKey(event));
		const closeOutside = (event: PointerEvent) => {
			const targetNode = event.target instanceof Node ? event.target : null;
			const targetElement = event.target instanceof Element ? event.target : null;
			if (this.#open && targetNode && !this.element.contains(targetNode) && !targetElement?.closest('[data-cfg-control="color"]')) {
				this.#setOpen(false);
			}
		};
		owner.doc.addEventListener('pointerdown', closeOutside, true);
		this.cleanup(() => owner.doc.removeEventListener('pointerdown', closeOutside, true));
		this.#text.addEventListener('focus', () => {
			this.#editing = true;
		});
		this.#text.addEventListener('input', () => this.#textInput());
		this.#text.addEventListener('change', () => this.#textChange());
		this.#text.addEventListener('blur', () => this.#textChange());
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: string) {
		this.#binding.set(value);
		this.render();
		this.#commit();
	}

	protected render() {
		const value = this.get();
		if (!this.#editing) {
			this.#text.value = value;
		}
		swatch(this.#swatch, value);
		this.#toggle.setAttribute('aria-expanded', String(this.#open));
		this.#renderChannels(rgba(value));
		this.#drawPanel();
	}

	override dispose() {
		const picker = this.#activePicker();
		if (picker) {
			picker.root.hidden = true;
			picker.owner = undefined;
		}
		super.dispose();
	}

	#set(value: string, event: 'input' | 'change') {
		this.#binding.set(value);
		this.#editing = false;
		this.render();
		if (event === 'change') {
			this.#commit();
		} else {
			this.emit(event);
		}
	}

	#textInput() {
		const next = parseColor(this.#text.value);
		if (!next) {
			return;
		}
		this.#binding.set(next);
		this.render();
		this.emit('input');
	}

	#textChange() {
		this.#editing = false;
		this.#text.value = this.get();
		this.render();
		this.#commit();
	}

	#setOpen(open: boolean, restoreFocus = false) {
		if (open) {
			const picker = ColorControl.#picker(this.owner.doc);
			if (picker.owner && picker.owner !== this) {
				picker.owner.#open = false;
				picker.owner.#toggle.setAttribute('aria-expanded', 'false');
			}
			picker.owner = this;
			picker.root.hidden = false;
			picker.root.id = `${this.id}-panel`;
			picker.root.setAttribute('aria-label', `${this.label} color picker`);
			picker.alpha.hidden = this.#options.alpha === false;
			this.#toggle.setAttribute('aria-controls', picker.root.id);
			this.element.append(picker.root);
			this.#open = true;
			this.render();
			requestAnimationFrame(() => picker.root.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
			return;
		}
		const picker = this.#activePicker();
		this.#open = false;
		if (picker) {
			picker.root.hidden = true;
			picker.owner = undefined;
		}
		this.render();
		if (restoreFocus) {
			this.#toggle.focus();
		}
	}

	#closeKey(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !this.#open) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		this.#setOpen(false, true);
	}

	#activePicker() {
		const picker = ColorControl.#pickers.get(this.owner.doc);
		return picker?.owner === this ? picker : undefined;
	}

	static #picker(doc: Document) {
		const existing = ColorControl.#pickers.get(doc);
		if (existing) {
			return existing;
		}
		const panel = el(doc, 'div', 'cfg-color-panel');
		panel.hidden = true;
		panel.setAttribute('role', 'group');
		const map = doc.createElement('canvas');
		map.className = 'cfg-color-map';
		map.width = theme.metrics.colorPickerWidth;
		map.height = theme.metrics.colorPickerHeight;
		const hue = doc.createElement('canvas');
		hue.className = 'cfg-color-slider cfg-color-slider--hue';
		hue.width = theme.metrics.colorPickerWidth;
		hue.height = theme.metrics.colorSliderHeight;
		const alpha = doc.createElement('canvas');
		alpha.className = 'cfg-color-slider cfg-color-slider--alpha';
		alpha.width = theme.metrics.colorPickerWidth;
		alpha.height = theme.metrics.colorSliderHeight;
		const red = channel(doc, 'R', 255, 1);
		const green = channel(doc, 'G', 255, 1);
		const blue = channel(doc, 'B', 255, 1);
		const opacity = channel(doc, 'A', 1, 0.01);
		const channels = el(doc, 'div', 'cfg-color-channels');
		channels.append(axis(doc, 'R', red), axis(doc, 'G', green), axis(doc, 'B', blue), axis(doc, 'A', opacity));
		panel.append(map, hue, channels, alpha);
		const picker: Picker = { root: panel, map, hue, alpha, red, green, blue, opacity, owner: undefined };
		panel.addEventListener('keydown', (event) => {
			const active = picker.owner;
			if (active) {
				active.#closeKey(event);
			}
		});
		map.addEventListener('pointerdown', (event) => {
			const active = picker.owner;
			if (active) {
				active.#mapPointer(event);
			}
		});
		hue.addEventListener('pointerdown', (event) => {
			const active = picker.owner;
			if (active) {
				active.#sliderPointer(event, 'hue');
			}
		});
		alpha.addEventListener('pointerdown', (event) => {
			const active = picker.owner;
			if (active) {
				active.#sliderPointer(event, 'alpha');
			}
		});
		for (const input of [red, green, blue, opacity]) {
			input.addEventListener('input', () => {
				const active = picker.owner;
				if (active) {
					active.#channelInput();
				}
			});
			input.addEventListener('change', () => {
				const active = picker.owner;
				if (active) {
					active.#commit();
				}
			});
		}
		ColorControl.#pickers.set(doc, picker);
		return picker;
	}

	#renderChannels(value: Rgba) {
		const picker = this.#activePicker();
		if (!picker) {
			return;
		}
		for (const input of [picker.red, picker.green, picker.blue, picker.opacity]) {
			input.disabled = this.disabled;
		}
		const current = clean(value);
		picker.red.value = String(current.r);
		picker.green.value = String(current.g);
		picker.blue.value = String(current.b);
		picker.opacity.value = Number(current.a.toFixed(2)).toString();
	}

	#channelInput() {
		const picker = this.#activePicker();
		if (!picker) {
			return;
		}
		const next = clean({
			r: number(picker.red.value, { min: 0, max: 255, step: 1 }),
			g: number(picker.green.value, { min: 0, max: 255, step: 1 }),
			b: number(picker.blue.value, { min: 0, max: 255, step: 1 }),
			a: this.#options.alpha === false ? 1 : number(picker.opacity.value, { min: 0, max: 1, step: 0.01 }),
		});
		this.#set(format(next, this.#options.format ?? 'hex'), 'input');
	}

	#mapPointer(event: PointerEvent) {
		const picker = this.#activePicker();
		if (this.disabled || !picker) {
			return;
		}
		this.#drag(picker.map, event, ({ x, y }) => {
			const current = rgba(this.get());
			const hsv = hsvFromRgb(current);
			const next = rgbFromHsv({ h: hsv.h, s: x, v: 1 - y }, current.a);
			this.#set(format(next, this.#options.format ?? 'hex'), 'input');
		});
	}

	#sliderPointer(event: PointerEvent, target: 'hue' | 'alpha') {
		const picker = this.#activePicker();
		if (this.disabled || !picker) {
			return;
		}
		const canvas = target === 'hue' ? picker.hue : picker.alpha;
		this.#drag(canvas, event, ({ x }) => {
			const current = rgba(this.get());
			const hsv = hsvFromRgb(current);
			const next = target === 'hue' ? rgbFromHsv({ ...hsv, h: x * 360 }, current.a) : clean({ ...current, a: x });
			this.#set(format(next, this.#options.format ?? 'hex'), 'input');
		});
	}

	#drag(canvas: HTMLCanvasElement, event: PointerEvent, update: (point: { x: number; y: number }) => void) {
		event.preventDefault();
		canvas.setPointerCapture(event.pointerId);
		const bounds = canvas.getBoundingClientRect();
		let active = true;
		const sample = (pointer: PointerEvent) => {
			update({
				x: clamp((pointer.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1),
				y: clamp((pointer.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1),
			});
		};
		const move = (pointer: PointerEvent) => sample(pointer);
		const finish = (pointer: PointerEvent, commit: boolean) => {
			if (!active) {
				return;
			}
			active = false;
			if (commit) {
				sample(pointer);
			}
			if (canvas.hasPointerCapture(pointer.pointerId)) {
				canvas.releasePointerCapture(pointer.pointerId);
			}
			canvas.removeEventListener('pointermove', move);
			canvas.removeEventListener('pointerup', up);
			canvas.removeEventListener('pointercancel', cancel);
			canvas.removeEventListener('lostpointercapture', cancel);
			if (commit) {
				this.#commit();
			}
		};
		const up = (pointer: PointerEvent) => finish(pointer, true);
		const cancel = (pointer: PointerEvent) => finish(pointer, false);
		canvas.addEventListener('pointermove', move);
		canvas.addEventListener('pointerup', up, { once: true });
		canvas.addEventListener('pointercancel', cancel, { once: true });
		canvas.addEventListener('lostpointercapture', cancel, { once: true });
		sample(event);
	}

	#drawPanel() {
		const picker = this.#activePicker();
		if (!this.#open || !picker) {
			return;
		}
		const current = rgba(this.get());
		const hsv = hsvFromRgb(current);
		this.#drawMap(picker, hsv);
		this.#drawHue(picker, hsv.h);
		if (this.#options.alpha !== false) {
			this.#drawAlpha(picker, current);
		}
	}

	#drawMap(picker: Picker, hsv: { h: number; s: number; v: number }) {
		const ctx = picker.map.getContext('2d');
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(picker.map, theme.metrics.colorPickerWidth, theme.metrics.colorPickerHeight);
		const hue = rgbFromHsv({ h: hsv.h, s: 1, v: 1 });
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = css(hue);
		ctx.fillRect(0, 0, width, height);
		const white = ctx.createLinearGradient(0, 0, width, 0);
		white.addColorStop(0, '#ffffff');
		white.addColorStop(1, 'rgba(255, 255, 255, 0)');
		ctx.fillStyle = white;
		ctx.fillRect(0, 0, width, height);
		const black = ctx.createLinearGradient(0, 0, 0, height);
		black.addColorStop(0, 'rgba(0, 0, 0, 0)');
		black.addColorStop(1, '#000000');
		ctx.fillStyle = black;
		ctx.fillRect(0, 0, width, height);
		drawThumb(ctx, hsv.s * width, (1 - hsv.v) * height, 7 * scale);
	}

	#drawHue(picker: Picker, hue: number) {
		const ctx = picker.hue.getContext('2d');
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(picker.hue, theme.metrics.colorPickerWidth, theme.metrics.colorSliderHeight);
		const gradient = ctx.createLinearGradient(0, 0, width, 0);
		for (const [stop, colorValue] of [
			[0, '#ff0000'],
			[1 / 6, '#ffff00'],
			[2 / 6, '#00ff00'],
			[3 / 6, '#00ffff'],
			[4 / 6, '#0000ff'],
			[5 / 6, '#ff00ff'],
			[1, '#ff0000'],
		] as const) {
			gradient.addColorStop(stop, colorValue);
		}
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, height * 0.3, width, height * 0.4);
		drawSliderThumb(ctx, (hue / 360) * width, height / 2, height * 0.7, scale);
	}

	#drawAlpha(picker: Picker, value: Rgba) {
		const ctx = picker.alpha.getContext('2d');
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(picker.alpha, theme.metrics.colorPickerWidth, theme.metrics.colorSliderHeight);
		ctx.clearRect(0, 0, width, height);
		checker(ctx, width, height, theme.metrics.colorCheckerSize * scale);
		const gradient = ctx.createLinearGradient(0, 0, width, 0);
		gradient.addColorStop(0, `rgba(${value.r}, ${value.g}, ${value.b}, 0)`);
		gradient.addColorStop(1, `rgba(${value.r}, ${value.g}, ${value.b}, 1)`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, height * 0.3, width, height * 0.4);
		drawSliderThumb(ctx, value.a * width, height / 2, height * 0.7, scale);
	}

	#commit() {
		const value = this.get();
		if (value === this.#committed) {
			return;
		}
		this.#committed = value;
		this.emit('change');
	}
}

function channel(doc: Document, label: string, max: number, step: number) {
	const node = numberInput(doc, undefined, { min: 0, max, step }, 'cfg-input cfg-input--channel');
	node.inputMode = step === 1 ? 'numeric' : 'decimal';
	node.ariaLabel = label;
	return node;
}

function clean(value: Rgba): Rgba {
	return {
		r: number(value.r, { min: 0, max: 255, step: 1 }),
		g: number(value.g, { min: 0, max: 255, step: 1 }),
		b: number(value.b, { min: 0, max: 255, step: 1 }),
		a: number(value.a, { min: 0, max: 1, step: 0.001 }),
	};
}

function drawThumb(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
	ctx.lineWidth = Math.max(1, radius * 0.35);
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.stroke();
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
	ctx.beginPath();
	ctx.arc(x, y, radius + ctx.lineWidth, 0, Math.PI * 2);
	ctx.stroke();
}

function drawSliderThumb(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, scale: number) {
	const radius = 3 * scale;
	const half = size / 2;
	ctx.lineWidth = 2 * scale;
	ctx.fillStyle = '#ffffff';
	ctx.strokeStyle = '#e85d92';
	ctx.beginPath();
	ctx.roundRect(x - half, y - half, size, size, radius);
	ctx.fill();
	ctx.stroke();
}

function checker(ctx: CanvasRenderingContext2D, width: number, height: number, size: number) {
	for (let y = 0; y < height; y += size) {
		for (let x = 0; x < width; x += size) {
			const odd = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 1;
			ctx.fillStyle = odd ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.2)';
			ctx.fillRect(x, y, size, size);
		}
	}
}

export class PaletteControl<T extends Record<string, unknown>> extends Base<string> {
	readonly #binding: Binding<string>;
	readonly #buttons: HTMLButtonElement[] = [];

	constructor(owner: Owner, target: T, key: keyof T, options: PaletteOptions) {
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
			button.disabled = this.disabled || (options.readonly ?? false);
			const preview = createSwatch(owner.doc);
			swatch(preview, item.value);
			button.append(preview);
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
