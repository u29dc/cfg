import type { ControlEvent } from './types';

export class Events<T> {
	readonly #handlers: Record<ControlEvent, Set<(value: T) => void>> = {
		input: new Set(),
		change: new Set(),
	};

	on(event: ControlEvent, handler: (value: T) => void) {
		this.#handlers[event].add(handler);
		return () => {
			this.#handlers[event].delete(handler);
		};
	}

	emit(event: ControlEvent, value: T) {
		for (const handler of this.#handlers[event]) {
			handler(value);
		}
	}

	clear() {
		this.#handlers.input.clear();
		this.#handlers.change.clear();
	}
}
