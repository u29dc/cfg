import type { ImageOptions } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { Binding, string } from '../binding';
import { preview } from '../utils/color';

export class ImageControl<T extends Record<string, unknown>, K extends keyof T> extends Base<string> {
	readonly #binding: Binding<string>;
	readonly #input: HTMLInputElement;
	readonly #file: HTMLInputElement;
	readonly #fileButton: HTMLButtonElement;
	readonly #fileName: HTMLElement;
	readonly #preview: HTMLImageElement;
	readonly #options: ImageOptions;
	#objectUrl = '';

	constructor(owner: Owner, target: T, key: K, options: ImageOptions = {}) {
		const binding = new Binding(target, key, (value) => string(value).slice(0, 16_384));
		super(owner, 'image', options, binding.get());
		this.#binding = binding;
		this.#options = options;
		this.#preview = owner.doc.createElement('img');
		this.#preview.className = 'cfg-image-preview';
		this.#preview.alt = '';
		this.#input = owner.doc.createElement('input');
		this.#input.id = `${this.id}-input`;
		this.#input.type = 'text';
		this.#input.className = 'cfg-input';
		this.#file = owner.doc.createElement('input');
		this.#file.type = 'file';
		this.#file.className = 'cfg-file';
		this.#file.accept = options.accept ?? 'image/png,image/jpeg,image/webp,image/gif,image/avif';
		this.#file.disabled = this.disabled;
		this.#file.tabIndex = -1;
		this.#fileName = owner.doc.createElement('span');
		this.#fileName.className = 'cfg-file-name';
		this.#fileName.textContent = 'No file selected';
		this.#fileButton = owner.doc.createElement('button');
		this.#fileButton.type = 'button';
		this.#fileButton.className = 'cfg-button';
		this.#fileButton.textContent = 'Choose file';
		this.#fileButton.disabled = this.disabled;
		const fileRow = owner.doc.createElement('div');
		fileRow.className = 'cfg-file-row';
		fileRow.append(this.#file, this.#fileButton, this.#fileName);
		const clear = owner.doc.createElement('button');
		clear.type = 'button';
		clear.className = 'cfg-button';
		clear.textContent = 'Clear';
		clear.disabled = this.disabled;
		this.#input.disabled = this.disabled;
		this.field.append(this.#preview, this.#input, fileRow, clear);
		this.#input.addEventListener('input', () => {
			this.#binding.set(this.#input.value);
			this.render();
			this.emit('input');
		});
		this.#fileButton.addEventListener('click', () => this.#file.click());
		this.#file.addEventListener('change', () => this.#fileChange());
		clear.addEventListener('click', () => this.#clear());
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: string) {
		this.#binding.set(value);
		this.#revoke();
		if (value === '') {
			this.#file.value = '';
		}
		this.render();
		this.emit('change');
	}

	override dispose() {
		this.#revoke();
		super.dispose();
	}

	protected render() {
		const src = this.#objectUrl || preview(this.get(), this.#options.allowRemotePreview);
		this.#input.value = this.get();
		const file = this.#file.files?.[0];
		this.#fileName.textContent = file ? file.name : 'No file selected';
		this.#preview.hidden = src === '';
		if (src) {
			this.#preview.src = src;
		} else {
			this.#preview.removeAttribute('src');
		}
	}

	async #fileChange() {
		const file = this.#file.files?.[0];
		if (!file?.type.startsWith('image/')) {
			return;
		}
		this.#revoke();
		if (file.size <= (this.#options.maxPersistBytes ?? 32_768)) {
			this.#binding.set(await data(file));
		} else {
			this.#objectUrl = URL.createObjectURL(file);
			this.#binding.set('');
		}
		this.render();
		this.emit('input');
		this.emit('change');
	}

	#clear() {
		this.#binding.set('');
		this.#file.value = '';
		this.#revoke();
		this.render();
		this.emit('input');
		this.emit('change');
	}

	#revoke() {
		if (this.#objectUrl) {
			URL.revokeObjectURL(this.#objectUrl);
			this.#objectUrl = '';
		}
	}
}

async function data(file: File) {
	const bytes = new Uint8Array(await file.arrayBuffer());
	let text = '';
	for (const byte of bytes) {
		text += String.fromCharCode(byte);
	}
	return `data:${file.type};base64,${btoa(text)}`;
}
