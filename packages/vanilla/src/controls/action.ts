import type { ButtonGroupOptions, ButtonOptions, ControlOptions } from '@u29dc/cfg-core';
import { el, listen } from '@u29dc/cfg-core';

import { Base, type Owner } from '../base';

export class Separator extends Base<void> {
	constructor(owner: Owner, label?: string) {
		super(owner, 'separator', label ? { label, serialize: false } : { serialize: false }, undefined);
		this.element.classList.add('cfg-separator');
		this.field.remove();
		if (!label) {
			this.element.querySelector('.cfg-control__label')?.remove();
		}
	}

	get() {
		return undefined;
	}

	set() {
		return;
	}

	protected render() {
		return;
	}
}

export class Button extends Base<void> {
	readonly #button: HTMLButtonElement;
	readonly #options: ButtonOptions;

	constructor(owner: Owner, options: ButtonOptions) {
		super(owner, 'button', { ...options, serialize: false }, undefined);
		this.#options = options;
		this.#button = button(owner.doc, this.id, this.label, options);
		this.field.append(this.#button);
		this.cleanup(listen(this.#button, 'click', () => this.#click()));
	}

	get() {
		return undefined;
	}

	set() {
		return;
	}

	protected render() {
		return;
	}

	async #click() {
		if (this.#button.disabled) {
			return;
		}
		if (this.#options.confirm && !(await this.#options.confirm())) {
			return;
		}
		await this.#options.action();
		this.emit('change');
	}
}

export class ButtonGroup extends Base<void> {
	constructor(owner: Owner, options: ButtonGroupOptions) {
		super(owner, 'button-group', { ...options, serialize: false }, undefined);
		const row = el(owner.doc, 'div', 'cfg-button-group');
		row.setAttribute('role', 'group');
		this.groupLabel(row);
		for (const item of options.buttons) {
			const node = button(owner.doc, undefined, item.label ?? 'Action', item);
			const click = async () => {
				if (node.disabled) {
					return;
				}
				if (item.confirm && !(await item.confirm())) {
					return;
				}
				await item.action();
				this.emit('change');
			};
			this.cleanup(listen(node, 'click', click));
			row.append(node);
		}
		this.field.append(row);
	}

	get() {
		return undefined;
	}

	set() {
		return;
	}

	protected render() {
		return;
	}
}

function button(doc: Document, id: string | undefined, label: string, options: ControlOptions) {
	const node = doc.createElement('button');
	node.type = 'button';
	node.className = 'cfg-button';
	node.textContent = label;
	node.disabled = options.disabled ?? false;
	if (id) {
		node.id = `${id}-input`;
	}
	return node;
}
