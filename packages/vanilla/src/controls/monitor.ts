import type { LogMonitor, LogOptions, MonitorOptions } from '@u29dc/cfg-core';
import { clamp, output, theme } from '@u29dc/cfg-core';

import { Base, type Owner } from '../base';
import { lineFeed } from '../utils/text';

export class Monitor<T> extends Base<T> {
	readonly #getValue: () => T;
	readonly #format: (value: T) => string;
	readonly #readout: HTMLElement;
	readonly #interval: number;
	#last = -Infinity;
	#value: T;

	constructor(owner: Owner, options: MonitorOptions<T>) {
		const getter = options.get ?? (() => undefined as T);
		const initial = getter();
		super(owner, 'monitor', { ...options, serialize: false }, initial);
		this.#getValue = getter;
		this.#format = options.format ?? ((value) => String(value ?? ''));
		this.#interval = theme.metrics.millisPerSecond / (options.throttleHz ?? theme.metrics.monitorHz);
		this.#value = initial;
		this.#readout = output(owner.doc, 'cfg-readout');
		this.#readout.id = `${this.id}-input`;
		this.connectLabel(this.#readout.id);
		this.field.append(this.#readout);
		this.render();
	}

	get() {
		return this.#value;
	}

	set(value: T) {
		this.#value = value;
		this.render();
		this.emit('change');
	}

	renderFrame(time: number) {
		if (!this.owner.visible() || time - this.#last < this.#interval) {
			return;
		}
		this.#last = time;
		this.#value = this.#getValue();
		this.render();
	}

	protected render() {
		this.#readout.textContent = this.#format(this.#value);
	}
}

export class Log extends Base<readonly string[]> implements LogMonitor {
	readonly #lines: string[] = [];
	readonly #limit: number;
	readonly #rows: number;
	readonly #interval: number;
	readonly #readout: HTMLElement;
	#dirty = true;
	#last = -Infinity;

	constructor(owner: Owner, options: LogOptions) {
		super(owner, 'log-monitor', { ...options, serialize: false }, []);
		this.#limit = Math.max(1, Math.floor(options.bufferSize ?? theme.metrics.logBuffer));
		this.#rows = clamp(Math.floor(options.rows ?? theme.metrics.logRows), 1, theme.metrics.logRowsMax);
		this.#interval = theme.metrics.millisPerSecond / (options.throttleHz ?? theme.metrics.monitorHz);
		this.#readout = owner.doc.createElement('pre');
		this.#readout.className = 'cfg-log';
		this.#readout.dataset['cfgRows'] = String(this.#rows);
		this.#readout.setAttribute('role', 'log');
		this.#readout.setAttribute('aria-live', 'polite');
		this.groupLabel(this.#readout);
		this.field.append(this.#readout);
	}

	get() {
		return this.#lines;
	}

	set(value: readonly string[]) {
		this.#lines.length = 0;
		this.#lines.push(...value.slice(-this.#limit).map(String));
		this.#dirty = true;
		this.emit('change');
	}

	push(message: string) {
		if (this.#lines.length >= this.#limit) {
			this.#lines.shift();
		}
		this.#lines.push(message);
		this.#dirty = true;
	}

	clear() {
		this.#lines.length = 0;
		this.#dirty = true;
		this.emit('change');
	}

	renderFrame(time: number) {
		if (!this.#dirty || !this.owner.visible() || time - this.#last < this.#interval) {
			return;
		}
		this.#dirty = false;
		this.#last = time;
		this.render();
	}

	protected render() {
		this.#readout.textContent = this.#lines.slice(-this.#rows).join(lineFeed);
	}
}
