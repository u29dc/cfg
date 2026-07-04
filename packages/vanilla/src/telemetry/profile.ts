import type { Profiler, ProfilerOptions, ProfilerSnapshot } from '@u29dc/cfg-core';
import { output, Profile, type ProfileEntry, text, theme } from '@u29dc/cfg-core';
import { Base, type Owner } from '../base';
import { fit } from '../utils/canvas';

export class ProfilerControl extends Base<ProfilerSnapshot> implements Profiler {
	readonly #profile: Profile;
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D | null;
	readonly #readout: HTMLElement;
	readonly #visible: ProfileEntry[] = [];
	#dirty = true;

	constructor(owner: Owner, options: ProfilerOptions) {
		const profile = new Profile(options.history ?? theme.metrics.profileHistory);
		super(owner, 'profiler', { ...options, serialize: false }, profile.snapshot());
		this.#profile = profile;
		this.#canvas = owner.doc.createElement('canvas');
		this.#canvas.className = 'cfg-profiler';
		this.#canvas.width = theme.metrics.profilerWidth;
		this.#canvas.height = theme.metrics.profilerHeight;
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
		try {
			return this.#profile.measure(label, () => this.owner.clock(), fn);
		} finally {
			this.#dirty = true;
		}
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
		this.#refreshVisible();
		this.#draw();
		this.#readout.textContent = this.#readoutText();
	}

	#refreshVisible() {
		this.#visible.length = 0;
		for (const entry of this.#profile.entries()) {
			this.#visible.push(entry);
			if (this.#visible.length >= theme.metrics.profilerRows) {
				break;
			}
		}
	}

	#readoutText() {
		if (this.#visible.length === 0) {
			return 'no samples';
		}
		let result = '';
		const count = Math.min(this.#visible.length, theme.metrics.profilerReadout);
		for (let index = 0; index < count; index += 1) {
			const entry = this.#visible[index];
			if (!entry) {
				continue;
			}
			result += `${index === 0 ? '' : '  '}${entry.label} ${text(entry.latest)}ms`;
		}
		return result || 'no samples';
	}

	#draw() {
		const ctx = this.#ctx;
		if (!ctx) {
			return;
		}
		const { width, height, scale } = fit(this.#canvas, theme.metrics.profilerWidth, theme.metrics.profilerHeight);
		let max: number = theme.metrics.frameBudget;
		for (const entry of this.#visible) {
			max = Math.max(max, entry.max);
		}
		const row = height / Math.max(1, this.#visible.length);
		const inset = theme.metrics.profilerInset * scale;
		const barInset = theme.metrics.profilerBarInset * scale;
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = theme.telemetry.background;
		ctx.fillRect(0, 0, width, height);
		for (let index = 0; index < this.#visible.length; index += 1) {
			const entry = this.#visible[index];
			if (!entry) {
				continue;
			}
			const y = index * row;
			ctx.fillStyle = entry.latest > theme.metrics.frameBudget ? theme.telemetry.warning : theme.telemetry.ok;
			ctx.fillRect(0, y + barInset, (entry.latest / max) * width, Math.max(barInset, row - barInset * 2));
			ctx.fillStyle = theme.telemetry.text;
			ctx.font = `${theme.metrics.profilerFontSize * scale}px ui-monospace, monospace`;
			ctx.fillText(entry.label, inset, y + row * 0.65);
		}
	}
}
