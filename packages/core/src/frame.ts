import { clamp, finite } from './utils/math';

export interface FrameSample {
	frame: number;
	time: number;
	delta: number;
	start: number;
	duration: number;
}

export class Frame {
	#sample: FrameSample = {
		frame: 0,
		time: Number.NaN,
		delta: 0,
		start: 0,
		duration: 0,
	};

	begin(time: number, now: number) {
		const safe = finite(time, this.#sample.time);
		const delta = Number.isFinite(this.#sample.time) ? clamp(safe - this.#sample.time, 0, 1_000) : 0;
		this.#sample = {
			frame: this.#sample.frame + 1,
			time: safe,
			delta,
			start: now,
			duration: 0,
		};
		return this.#sample;
	}

	end(now: number) {
		this.#sample.duration = Math.max(0, now - this.#sample.start);
		return this.#sample;
	}

	get sample() {
		return this.#sample;
	}
}
