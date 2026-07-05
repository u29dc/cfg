import type { Choice, ChoiceOptions, ChoiceValue } from '@u29dc/cfg-core';
import { el } from '@u29dc/cfg-core';

import { Base, type Owner } from '../base';
import { Binding, choice, encoded, options as normalize } from '../binding';

type Mode = 'select' | 'segmented' | 'radio-group' | 'radio-grid';

export class ChoiceControl<T extends Record<string, unknown>, V extends ChoiceValue> extends Base<V> {
	readonly #binding: Binding<V>;
	readonly #options: Choice<V>[];
	readonly #buttons: HTMLButtonElement[] = [];
	readonly #select?: HTMLSelectElement;

	constructor(owner: Owner, target: T, key: keyof T, options: ChoiceOptions<V>, mode: Mode) {
		const items = normalize(options.options);
		const binding = new Binding(target, key, (value) => choice(value, items, options.allowUnknown));
		super(owner, mode, options, binding.get());
		this.#binding = binding;
		this.#options = items;

		if (mode === 'select') {
			this.#select = this.#createSelect();
			this.field.append(this.#select);
		} else {
			this.field.append(this.#createButtons(mode, options.columns));
		}
		this.render();
	}

	get() {
		return this.#binding.get();
	}

	set(value: V) {
		this.#binding.set(value);
		this.render();
		this.emit('change');
	}

	protected render() {
		const current = encoded(this.get());
		if (this.#select) {
			this.#select.value = current;
		}
		for (const button of this.#buttons) {
			const selected = button.dataset['cfgValue'] === current;
			button.dataset['cfgSelected'] = String(selected);
			button.setAttribute('aria-pressed', String(selected));
		}
	}

	#createSelect() {
		const node = this.owner.doc.createElement('select');
		node.id = `${this.id}-input`;
		node.className = 'cfg-select';
		node.disabled = this.disabled;
		for (const item of this.#options) {
			const option = this.owner.doc.createElement('option');
			option.value = encoded(item.value);
			option.textContent = item.label;
			option.disabled = item.disabled ?? false;
			node.append(option);
		}
		node.addEventListener('input', () => {
			const item = this.#options.find((candidate) => encoded(candidate.value) === node.value);
			if (item) {
				this.#binding.set(item.value);
				this.emit('input');
			}
		});
		node.addEventListener('change', () => this.emit('change'));
		return node;
	}

	#createButtons(mode: Exclude<Mode, 'select'>, columns = 3) {
		const row = el(this.owner.doc, 'div', `cfg-choice-row cfg-choice-row--${mode}`);
		if (mode === 'radio-grid') {
			row.dataset['cfgColumns'] = String(columns);
		}
		for (let index = 0; index < this.#options.length; index += 1) {
			const item = this.#options[index];
			if (!item) {
				continue;
			}
			const button = this.owner.doc.createElement('button');
			button.type = 'button';
			button.className = 'cfg-choice';
			button.disabled = this.disabled || (item.disabled ?? false);
			button.textContent = item.label;
			button.dataset['cfgValue'] = encoded(item.value);
			button.setAttribute('aria-pressed', 'false');
			button.addEventListener('click', () => this.#choose(item));
			button.addEventListener('keydown', (event) => this.#keys(event, index));
			this.#buttons.push(button);
			row.append(button);
		}
		return row;
	}

	#choose(item: Choice<V>) {
		this.#binding.set(item.value);
		this.render();
		this.emit('input');
		this.emit('change');
	}

	#keys(event: KeyboardEvent, index: number) {
		if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
			return;
		}
		event.preventDefault();
		const next = nextChoice(this.#buttons, index, event.key);
		if (!next) {
			return;
		}
		next.button.focus();
		const item = this.#options[next.index];
		if (item) {
			this.#choose(item);
		}
	}
}

function nextChoice(buttons: readonly HTMLButtonElement[], index: number, key: string) {
	if (key === 'Home') {
		return enabledChoice(buttons, 0, 1);
	}
	if (key === 'End') {
		return enabledChoice(buttons, buttons.length - 1, -1);
	}
	return enabledChoice(buttons, index + choiceDirection(key), choiceDirection(key));
}

function choiceDirection(key: string) {
	return key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
}

function enabledChoice(buttons: readonly HTMLButtonElement[], start: number, step: number) {
	for (let index = start; index >= 0 && index < buttons.length; index += step) {
		const button = buttons[index];
		if (button && !button.disabled) {
			return { button, index };
		}
	}
	return undefined;
}
