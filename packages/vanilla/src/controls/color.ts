import type { ColorOptions, PaletteColor, PaletteOptions, PaletteSection } from '@u29dc/cfg-core';
import { axis, clamp, el, number, theme } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding } from '../binding';
import { fit } from '../utils/canvas';
import { color, css, format, hsvFromRgb, parseColor, type Rgba, rgba, rgbFromHsv, swatch } from '../utils/color';
import { numberInput } from './input';

export class ColorControl<T extends Record<string, unknown>, K extends keyof T> extends Base<string> {
	readonly #binding: Binding<string>;
	readonly #text: HTMLInputElement;
	readonly #swatch: HTMLCanvasElement;
	readonly #toggle: HTMLButtonElement;
	readonly #panel: HTMLElement;
	#map!: HTMLCanvasElement;
	#hue!: HTMLCanvasElement;
	#alpha!: HTMLCanvasElement;
	#red!: HTMLInputElement;
	#green!: HTMLInputElement;
	#blue!: HTMLInputElement;
	#opacity!: HTMLInputElement;
	readonly #options: ColorOptions;
	#open = false;
	#editing = false;

	constructor(owner: Owner, target: T, key: K, options: ColorOptions = {}) {
		const binding = new Binding(target, key, color);
		super(owner, 'color', options, binding.get());
		this.#binding = binding;
		this.#options = options;
		this.#swatch = owner.doc.createElement('canvas');
		this.#swatch.className = 'cfg-swatch-canvas';
		this.#swatch.width = theme.metrics.colorSwatchSize;
		this.#swatch.height = theme.metrics.colorSwatchSize;
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
		this.#panel = this.#createPanel(owner.doc);
		this.#panel.hidden = true;
		this.#panel.id = `${this.id}-panel`;
		this.#panel.setAttribute('role', 'group');
		this.#panel.setAttribute('aria-label', `${this.label} color picker`);
		this.#toggle.setAttribute('aria-controls', this.#panel.id);
		this.field.append(row);
		this.element.append(this.#panel);
		this.#toggle.addEventListener('click', () => this.#setOpen(!this.#open));
		this.#toggle.addEventListener('keydown', (event) => this.#closeKey(event));
		this.#panel.addEventListener('keydown', (event) => this.#closeKey(event));
		const closeOutside = (event: PointerEvent) => {
			const targetNode = event.target instanceof Node ? event.target : null;
			if (this.#open && targetNode && !this.element.contains(targetNode)) {
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
		this.#map.addEventListener('pointerdown', (event) => this.#mapPointer(event));
		this.#hue.addEventListener('pointerdown', (event) => this.#sliderPointer(event, 'hue'));
		this.#alpha.addEventListener('pointerdown', (event) => this.#sliderPointer(event, 'alpha'));
		for (const input of [this.#red, this.#green, this.#blue, this.#opacity]) {
			input.disabled = this.disabled;
			input.addEventListener('input', () => this.#channelInput());
			input.addEventListener('change', () => this.emit('change'));
		}
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
		if (!this.#editing) {
			this.#text.value = value;
		}
		swatch(this.#swatch.getContext('2d'), value, theme.metrics.colorSwatchSize);
		this.#toggle.setAttribute('aria-expanded', String(this.#open));
		this.#renderChannels(rgba(value));
		this.#drawPanel();
	}

	#set(value: string, event: 'input' | 'change') {
		this.#binding.set(value);
		this.#editing = false;
		this.render();
		this.emit(event);
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
		this.emit('change');
	}

	#setOpen(open: boolean, restoreFocus = false) {
		this.#open = open;
		this.#panel.hidden = !open;
		this.render();
		if (open) {
			requestAnimationFrame(() => this.#panel.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
		} else if (restoreFocus) {
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

	#createPanel(doc: Document) {
		const panel = el(doc, 'div', 'cfg-color-panel');
		const map = doc.createElement('canvas');
		map.className = 'cfg-color-map';
		map.width = theme.metrics.colorPickerWidth;
		map.height = theme.metrics.colorPickerHeight;
		this.#map = map;
		const hue = doc.createElement('canvas');
		hue.className = 'cfg-color-slider cfg-color-slider--hue';
		hue.width = theme.metrics.colorPickerWidth;
		hue.height = theme.metrics.colorSliderHeight;
		this.#hue = hue;
		const alpha = doc.createElement('canvas');
		alpha.className = 'cfg-color-slider cfg-color-slider--alpha';
		alpha.width = theme.metrics.colorPickerWidth;
		alpha.height = theme.metrics.colorSliderHeight;
		this.#alpha = alpha;
		this.#red = channel(doc, 'R', 255, 1);
		this.#green = channel(doc, 'G', 255, 1);
		this.#blue = channel(doc, 'B', 255, 1);
		this.#opacity = channel(doc, 'A', 1, 0.01);
		const channels = el(doc, 'div', 'cfg-color-channels');
		channels.append(axis(doc, 'R', this.#red), axis(doc, 'G', this.#green), axis(doc, 'B', this.#blue), axis(doc, 'A', this.#opacity));
		panel.append(map, hue, channels);
		if (this.#options.alpha !== false) {
			panel.append(alpha);
		}
		return panel;
	}

	#renderChannels(value: Rgba) {
		const current = clean(value);
		this.#red.value = String(current.r);
		this.#green.value = String(current.g);
		this.#blue.value = String(current.b);
		this.#opacity.value = Number(current.a.toFixed(2)).toString();
	}

	#channelInput() {
		const next = clean({
			r: number(this.#red.value, { min: 0, max: 255, step: 1 }),
			g: number(this.#green.value, { min: 0, max: 255, step: 1 }),
			b: number(this.#blue.value, { min: 0, max: 255, step: 1 }),
			a: this.#options.alpha === false ? 1 : number(this.#opacity.value, { min: 0, max: 1, step: 0.01 }),
		});
		this.#set(format(next, this.#options.format ?? 'hex'), 'input');
	}

	#mapPointer(event: PointerEvent) {
		if (this.disabled) {
			return;
		}
		this.#drag(this.#map, event, ({ x, y }) => {
			const current = rgba(this.get());
			const hsv = hsvFromRgb(current);
			const next = rgbFromHsv({ h: hsv.h, s: x, v: 1 - y }, current.a);
			this.#set(format(next, this.#options.format ?? 'hex'), 'input');
		});
	}

	#sliderPointer(event: PointerEvent, target: 'hue' | 'alpha') {
		if (this.disabled) {
			return;
		}
		const canvas = target === 'hue' ? this.#hue : this.#alpha;
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
				this.emit('change');
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
		if (!this.#open) {
			return;
		}
		const current = rgba(this.get());
		const hsv = hsvFromRgb(current);
		this.#drawMap(hsv);
		this.#drawHue(hsv.h);
		this.#drawAlpha(current);
	}

	#drawMap(hsv: { h: number; s: number; v: number }) {
		const ctx = this.#map.getContext('2d');
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(this.#map, theme.metrics.colorPickerWidth, theme.metrics.colorPickerHeight);
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

	#drawHue(hue: number) {
		const ctx = this.#hue.getContext('2d');
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(this.#hue, theme.metrics.colorPickerWidth, theme.metrics.colorSliderHeight);
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

	#drawAlpha(value: Rgba) {
		const ctx = this.#alpha.getContext('2d');
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(this.#alpha, theme.metrics.colorPickerWidth, theme.metrics.colorSliderHeight);
		ctx.clearRect(0, 0, width, height);
		checker(ctx, width, height, theme.metrics.colorCheckerSize * scale);
		const gradient = ctx.createLinearGradient(0, 0, width, 0);
		gradient.addColorStop(0, `rgba(${value.r}, ${value.g}, ${value.b}, 0)`);
		gradient.addColorStop(1, `rgba(${value.r}, ${value.g}, ${value.b}, 1)`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, height * 0.3, width, height * 0.4);
		drawSliderThumb(ctx, value.a * width, height / 2, height * 0.7, scale);
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
			button.disabled = this.disabled || (options.readonly ?? false);
			const canvas = owner.doc.createElement('canvas');
			canvas.width = theme.metrics.paletteSwatchSize;
			canvas.height = theme.metrics.paletteSwatchSize;
			canvas.className = 'cfg-swatch-canvas';
			swatch(canvas.getContext('2d'), item.value, theme.metrics.paletteSwatchSize);
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
