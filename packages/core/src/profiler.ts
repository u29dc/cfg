import type { EntrySnapshot, ProfilerSnapshot } from './types';

export class ProfileEntry {
	readonly label: string;
	readonly #values: Float32Array;
	#index = 0;
	#count = 0;
	latest = 0;
	max = 0;

	constructor(label: string, history: number) {
		this.label = label;
		this.#values = new Float32Array(history);
	}

	resetFrame() {
		this.latest = 0;
	}

	add(value: number) {
		this.latest += Math.max(0, value);
		this.max = Math.max(this.max, this.latest);
		this.#values[this.#index] = this.latest;
		this.#index = (this.#index + 1) % this.#values.length;
		this.#count = Math.min(this.#count + 1, this.#values.length);
	}

	snapshot(): EntrySnapshot {
		let sum = 0;
		for (let index = 0; index < this.#count; index += 1) {
			sum += this.#values[index] ?? 0;
		}
		return {
			label: this.label,
			latest: this.latest,
			average: this.#count > 0 ? sum / this.#count : 0,
			max: this.max,
		};
	}
}

export class Profile {
	readonly #entries = new Map<string, ProfileEntry>();
	readonly #stack: { label: string; start: number }[] = [];
	readonly #history: number;
	#frame = 0;
	#total = 0;

	constructor(history = 120) {
		this.#history = history;
	}

	beginFrame(frame: number) {
		this.#frame = frame;
		this.#total = 0;
		this.#stack.length = 0;
		for (const entry of this.#entries.values()) {
			entry.resetFrame();
		}
	}

	endFrame(duration: number) {
		this.#total = Math.max(this.#total, duration);
	}

	begin(label: string, now: number) {
		this.#stack.push({ label: clean(label), start: now });
	}

	end(label: string, now: number) {
		const normalized = clean(label);
		for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
			const item = this.#stack[index];
			if (item?.label === normalized) {
				this.#stack.splice(index, 1);
				const duration = Math.max(0, now - item.start);
				this.entry(normalized).add(duration);
				this.#total += duration;
				return duration;
			}
		}
		return 0;
	}

	measure<T>(label: string, now: () => number, fn: () => T) {
		this.begin(label, now());
		try {
			return fn();
		} finally {
			this.end(label, now());
		}
	}

	snapshot(): ProfilerSnapshot {
		return {
			frame: this.#frame,
			total: this.#total,
			entries: [...this.#entries.values()].map((entry) => entry.snapshot()),
		};
	}

	clear() {
		this.#entries.clear();
		this.#stack.length = 0;
		this.#total = 0;
	}

	entry(label: string) {
		let entry = this.#entries.get(label);
		if (!entry) {
			entry = new ProfileEntry(label, this.#history);
			this.#entries.set(label, entry);
		}
		return entry;
	}
}

function clean(label: string) {
	return label.trim().slice(0, 80) || 'section';
}
