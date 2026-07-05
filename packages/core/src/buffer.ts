import { finite } from './utils/math';

export class Ring {
	readonly data: Float32Array;
	index = 0;
	count = 0;

	constructor(size: number) {
		this.data = new Float32Array(normalizeSize(size));
	}

	push(value: number) {
		this.data[this.index] = finite(value);
		this.index = (this.index + 1) % this.data.length;
		this.count = Math.min(this.count + 1, this.data.length);
	}

	clear() {
		this.data.fill(0);
		this.index = 0;
		this.count = 0;
	}

	at(offset: number) {
		if (this.count === 0) {
			return 0;
		}
		const start = (this.index - this.count + this.data.length) % this.data.length;
		return this.data[(start + offset) % this.data.length] ?? 0;
	}

	latest() {
		if (this.count === 0) {
			return 0;
		}
		return this.data[(this.index - 1 + this.data.length) % this.data.length] ?? 0;
	}
}

function normalizeSize(size: number) {
	return Math.max(1, Math.floor(Number.isFinite(size) ? size : 1));
}

export class Series {
	readonly id: string;
	readonly label: string;
	readonly color: string;
	readonly ring: Ring;

	constructor(options: { id?: string; label?: string; color: string; size: number }) {
		this.id = options.id ?? options.label ?? 'value';
		this.label = options.label ?? this.id;
		this.color = options.color;
		this.ring = new Ring(options.size);
	}
}
