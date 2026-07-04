import { Frame } from './frame';
import { Ids } from './id';
import { Settings } from './settings';
import { theme } from './theme';
import type { CancelRaf, CfgOptions, Clock, FrameProfiler, FrameRenderable, FrameSampler, RuntimeItem, SchedulerMode } from './types';

export class Engine {
	readonly ids = new Ids();
	readonly settings = new Settings();
	readonly frame = new Frame();
	readonly scheduler: SchedulerMode;
	readonly clock: Clock;
	readonly #raf: RafPair;
	readonly #items = new Set<RuntimeItem>();
	readonly #renderables = new Set<FrameRenderable>();
	readonly #samplers = new Set<FrameSampler>();
	readonly #profilers = new Set<FrameProfiler>();
	#rafId = 0;
	#running = false;
	#disposed = false;

	constructor(options: CfgOptions = {}) {
		this.scheduler = options.scheduler ?? 'external';
		this.clock = options.clock ?? now;
		this.#raf = {
			request: options.raf ?? request,
			cancel: options.cancelRaf ?? cancel,
		};
	}

	add(item: RuntimeItem) {
		this.assert();
		this.settings.add(item);
		this.#items.add(item);
		if (isRenderable(item)) {
			this.#renderables.add(item);
		}
		if (isSampler(item)) {
			this.#samplers.add(item);
		}
		if (isProfiler(item)) {
			this.#profilers.add(item);
		}
	}

	remove(item: RuntimeItem) {
		this.settings.remove(item);
		this.#items.delete(item);
		this.#renderables.delete(item as FrameRenderable);
		this.#samplers.delete(item as FrameSampler);
		this.#profilers.delete(item as FrameProfiler);
	}

	create(kind: string, requested?: string) {
		return this.ids.create(kind, requested);
	}

	beginFrame(time: number) {
		this.assert();
		const sample = this.frame.begin(time, this.clock());
		if (sample.delta > 0) {
			this.#sample('fps', theme.metrics.millisPerSecond / sample.delta);
		}
		for (const profiler of this.#profilers) {
			profiler.beginFrame(sample.frame);
		}
		return sample;
	}

	endFrame() {
		this.assert();
		const sample = this.frame.end(this.clock());
		this.#sample('frame', sample.delta || sample.duration);
		for (const profiler of this.#profilers) {
			profiler.endFrame(sample.duration);
		}
		return sample;
	}

	renderFrame(time = this.frame.sample.time) {
		this.assert();
		for (const renderable of this.#renderables) {
			if (this.#disposed) {
				return;
			}
			renderable.renderFrame(time);
		}
	}

	start() {
		this.assert();
		if (this.scheduler !== 'internal') {
			throw new Error("cfg.start() requires createCfg({ scheduler: 'internal' })");
		}
		if (this.#running) {
			return;
		}
		this.#running = true;
		const tick = (time: number) => {
			if (!this.#running || this.#disposed) {
				this.#rafId = 0;
				return;
			}
			this.#rafId = 0;
			this.beginFrame(time);
			this.endFrame();
			this.renderFrame(time);
			if (this.#running && !this.#disposed) {
				this.#rafId = this.#raf.request(tick);
			}
		};
		this.#rafId = this.#raf.request(tick);
	}

	stop() {
		this.#running = false;
		if (this.#rafId !== 0) {
			this.#raf.cancel(this.#rafId);
			this.#rafId = 0;
		}
	}

	dispose() {
		if (this.#disposed) {
			return;
		}
		this.#disposed = true;
		this.stop();
		this.#items.clear();
		this.#renderables.clear();
		this.#samplers.clear();
		this.#profilers.clear();
	}

	assert() {
		if (this.#disposed) {
			throw new Error('cfg engine has been disposed');
		}
	}

	#sample(kind: 'fps' | 'frame', value: number) {
		for (const sampler of this.#samplers) {
			sampler.sample(kind, value);
		}
	}
}

interface RafPair {
	request: (callback: (time: number) => void) => number;
	cancel: CancelRaf;
}

function now() {
	return globalThis.performance?.now() ?? 0;
}

function request(callback: (time: number) => void) {
	if (typeof requestAnimationFrame === 'undefined') {
		throw new Error("cfg internal scheduler requires a browser requestAnimationFrame; use scheduler: 'external' in non-browser runtimes");
	}
	return requestAnimationFrame(callback);
}

function cancel(id: number) {
	if (typeof cancelAnimationFrame !== 'undefined') {
		cancelAnimationFrame(id);
	}
}

function isRenderable(value: RuntimeItem): value is RuntimeItem & FrameRenderable {
	return typeof value.renderFrame === 'function';
}

function isSampler(value: RuntimeItem): value is RuntimeItem & FrameSampler {
	return typeof value.sample === 'function';
}

function isProfiler(value: RuntimeItem): value is RuntimeItem & FrameProfiler {
	return typeof value.beginFrame === 'function' && typeof value.endFrame === 'function';
}
