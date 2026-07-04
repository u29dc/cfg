import type { Profiler, ProfilerOptions, ProfilerSnapshot } from '@u29dc/cfg-core';
import { output, Profile, ratio, text } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';

export class ProfilerControl extends Base<ProfilerSnapshot> implements Profiler {
	readonly #profile: Profile;
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	readonly #readout: HTMLElement;
	#dirty = true;

	constructor(owner: Owner, options: ProfilerOptions) {
		const profile = new Profile(options.history ?? 120);
		super(owner, 'profiler', { ...options, serialize: false }, profile.snapshot());
		this.#profile = profile;
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-profiler';
		this.#canvas.width = 280 * ratio();
		this.#canvas.height = 70 * ratio();
		this.#ctx = this.#canvas.getContext('2d');
		this.#readout = output(owner.doc, 'cfg-profiler-readout');
		this.field.append(this.#canvas, this.#readout);
		this.render();
	}

	get() {
		return this.#profile.snapshot();
	}

	set() {
		return;
	}

	begin(label: string) {
		this.#profile.begin(label, this.owner.clock());
	}

	end(label: string) {
		const duration = this.#profile.end(label, this.owner.clock());
		this.#dirty = true;
		return duration;
	}

	measure<T>(label: string, fn: () => T) {
		return this.#profile.measure(label, () => this.owner.clock(), fn);
	}

	getSnapshot() {
		return this.#profile.snapshot();
	}

	clear() {
		this.#profile.clear();
		this.#dirty = true;
	}

	beginFrame(frame: number) {
		this.#profile.beginFrame(frame);
	}

	endFrame(duration: number) {
		this.#profile.endFrame(duration);
		this.#dirty = true;
	}

	renderFrame() {
		if (!this.#dirty || !this.owner.visible()) {
			return;
		}
		this.#dirty = false;
		this.render();
	}

	protected render() {
		const snapshot = this.#profile.snapshot();
		this.#draw(snapshot);
		this.#readout.textContent =
			snapshot.entries
				.slice(0, 3)
				.map((entry) => `${entry.label} ${text(entry.latest)}ms`)
				.join('  ') || 'no samples';
	}

	#draw(snapshot: ProfilerSnapshot) {
		const ctx = this.#ctx;
		if (!ctx) {
			return;
		}
		const width = this.#canvas.width;
		const height = this.#canvas.height;
		const entries = snapshot.entries.slice(0, 8);
		const max = Math.max(16.67, ...entries.map((entry) => entry.max));
		const row = height / Math.max(1, entries.length);
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#0f141a';
		ctx.fillRect(0, 0, width, height);
		for (let index = 0; index < entries.length; index += 1) {
			const entry = entries[index];
			if (!entry) {
				continue;
			}
			const y = index * row;
			ctx.fillStyle = entry.latest > 16.67 ? '#ff6b8b' : '#78a6ff';
			ctx.fillRect(0, y + 2, (entry.latest / max) * width, Math.max(2, row - 4));
			ctx.fillStyle = '#f1f4f8';
			ctx.font = `${10 * ratio()}px ui-monospace, monospace`;
			ctx.fillText(entry.label, 4 * ratio(), y + row * 0.65);
		}
	}
}
