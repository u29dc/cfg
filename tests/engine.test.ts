import { describe, expect, test } from 'bun:test';

import type { RuntimeItem } from '@u29dc/cfg-core';
import { Engine, Ids, Profile, Ring, Settings } from '@u29dc/cfg-core';

import { choice, options } from '../packages/vanilla/src/binding';

describe('Engine', () => {
	test('external mode samples frames without creating an internal RAF loop', () => {
		const secondFrameTime = 16;
		const secondClockStart = 120;
		const secondClockEnd = 127;
		let now = 0;
		let rafCalls = 0;
		const rendered: number[] = [];
		const sampled: [kind: 'fps' | 'frame', value: number][] = [];
		const profilerFrames: number[] = [];
		const profilerDurations: number[] = [];
		const item = runtimeItem({
			renderFrame: (time) => rendered.push(time),
			sample: (kind, value) => sampled.push([kind, value]),
			beginFrame: (frame) => profilerFrames.push(frame),
			endFrame: (duration) => profilerDurations.push(duration),
		});
		const engine = new Engine({
			scheduler: 'external',
			clock: () => now,
			raf: () => {
				rafCalls += 1;
				return rafCalls;
			},
		});

		engine.add(item);
		now = 100;
		engine.beginFrame(0);
		now = 104;
		engine.endFrame();
		engine.renderFrame(0);
		now = secondClockStart;
		engine.beginFrame(secondFrameTime);
		now = secondClockEnd;
		engine.endFrame();
		engine.renderFrame(secondFrameTime);

		expect(rafCalls).toBe(0);
		expect(rendered).toEqual([0, secondFrameTime]);
		expect(profilerFrames).toEqual([1, 2]);
		expect(profilerDurations).toEqual([4, 7]);
		expect(sampled[0]).toEqual(['frame', 4]);
		expect(sampled[1]?.[0]).toBe('fps');
		expect(sampled[2]).toEqual(['frame', 7]);
	});

	test('internal mode uses one RAF loop and stops cleanly', () => {
		const rafId = 7;
		let callback: ((time: number) => void) | undefined;
		const cancelled: number[] = [];
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				callback = next;
				return rafId;
			},
			cancelRaf: (id) => cancelled.push(id),
		});

		engine.start();
		engine.start();
		expect(typeof callback).toBe('function');
		engine.stop();
		expect(cancelled).toEqual([rafId]);
	});

	test('internal mode cancels RAF handle zero', () => {
		const cancelled: number[] = [];
		const engine = new Engine({
			scheduler: 'internal',
			raf: () => 0,
			cancelRaf: (id) => cancelled.push(id),
		});

		engine.start();
		engine.stop();

		expect(cancelled).toEqual([0]);
	});

	test('internal mode ignores stale callbacks after restart', () => {
		const callbacks: ((time: number) => void)[] = [];
		const cancelled: number[] = [];
		let nextId = 0;
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				callbacks.push(next);
				const id = nextId;
				nextId += 1;
				return id;
			},
			cancelRaf: (id) => cancelled.push(id),
		});

		engine.start();
		const stale = callbacks[0];
		engine.stop();
		engine.start();
		stale?.(16);

		expect(cancelled).toEqual([0]);
		expect(callbacks).toHaveLength(2);

		callbacks[1]?.(32);
		expect(callbacks).toHaveLength(3);
	});

	test('internal mode does not reschedule when stopped during a frame', () => {
		const callbacks: ((time: number) => void)[] = [];
		const cancelled: number[] = [];
		let nextId = 0;
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				callbacks.push(next);
				nextId += 1;
				return nextId;
			},
			cancelRaf: (id) => cancelled.push(id),
		});
		engine.add(runtimeItem({ renderFrame: () => engine.stop() }));

		engine.start();
		expect(callbacks).toHaveLength(1);
		callbacks.shift()?.(16);

		expect(callbacks).toHaveLength(0);
		expect(cancelled).toEqual([]);
	});

	test('internal mode does not reschedule when disposed during a frame', () => {
		const callbacks: ((time: number) => void)[] = [];
		let nextId = 0;
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				callbacks.push(next);
				nextId += 1;
				return nextId;
			},
		});
		engine.add(runtimeItem({ renderFrame: () => engine.dispose() }));

		engine.start();
		callbacks.shift()?.(16);

		expect(callbacks).toHaveLength(0);
		expect(() => engine.add(runtimeItem({ id: 'after-dispose' }))).toThrow('cfg engine has been disposed');
	});

	test('internal mode stops cleanly when a sampler disposes during a frame', () => {
		const callbacks: ((time: number) => void)[] = [];
		let nextId = 0;
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				callbacks.push(next);
				nextId += 1;
				return nextId;
			},
		});
		engine.add(runtimeItem({ sample: () => engine.dispose() }));

		engine.start();
		callbacks.shift()?.(16);

		expect(callbacks).toHaveLength(0);
	});

	test('internal mode clears running state after callback failures', () => {
		const callbacks: ((time: number) => void)[] = [];
		let failSchedule = false;
		let nextId = 0;
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				if (failSchedule) {
					throw new Error('schedule failed');
				}
				callbacks.push(next);
				nextId += 1;
				return nextId;
			},
		});
		engine.add(runtimeItem({ renderFrame: () => undefined }));

		engine.start();
		failSchedule = true;
		expect(() => callbacks.shift()?.(16)).toThrow('schedule failed');
		failSchedule = false;
		engine.start();

		expect(callbacks).toHaveLength(1);
	});

	test('dispose unregisters settings items', () => {
		const engine = new Engine();
		engine.add(runtimeItem({ id: 'speed', get: () => 2 }));

		expect(engine.settings.export().values['speed']).toBe(2);
		engine.dispose();

		expect(Object.hasOwn(engine.settings.export().values, 'speed')).toBe(false);
	});
});

describe('Settings', () => {
	test('exports serialized items, applies snapshots, and resets initial values', () => {
		let value = 2;
		const settings = new Settings();
		settings.add(
			runtimeItem({
				id: 'speed',
				get: () => value,
				setUnknown: (next) => {
					value = Number(next);
				},
				reset: () => {
					value = 2;
				},
			}),
		);
		settings.add(runtimeItem({ id: 'fps', serialize: false, get: () => 60 }));

		const snapshot = settings.export();
		expect(snapshot.values).toEqual({ speed: 2 });
		settings.apply({ version: 1, generatedAt: 'test', values: { speed: 4, fps: 30 } });
		expect(value).toBe(4);
		settings.reset();
		expect(value).toBe(2);
	});

	test('rolls back settings when an imported value fails validation', () => {
		let speed = 1;
		let mode = 'normal';
		const settings = new Settings();
		settings.add(
			runtimeItem({
				id: 'speed',
				get: () => speed,
				setUnknown: (next) => {
					speed = Number(next);
				},
				reset: () => {
					speed = 1;
				},
			}),
		);
		settings.add(
			runtimeItem({
				id: 'mode',
				get: () => mode,
				setUnknown: (next) => {
					mode = choice(next, options(['calm', 'normal', 'intense']));
				},
				reset: () => {
					mode = 'normal';
				},
			}),
		);

		expect(() => settings.apply({ version: 1, generatedAt: 'test', values: { speed: 4, mode: 'broken' } })).toThrow('choice control rejected unknown value');
		expect(speed).toBe(1);
		expect(mode).toBe('normal');
	});

	test('exports special ids without prototype pollution', () => {
		const settings = new Settings();
		settings.add(runtimeItem({ id: '__proto__', get: () => 'safe' }));

		const snapshot = settings.export();

		expect(Object.getPrototypeOf(snapshot.values)).toBe(null);
		expect(Object.hasOwn(snapshot.values, '__proto__')).toBe(true);
		expect(snapshot.values['__proto__']).toBe('safe');
	});

	test('ignores stale remove calls for replaced settings', () => {
		const settings = new Settings();
		const first = runtimeItem({ id: 'speed', get: () => 1 });
		const second = runtimeItem({ id: 'speed', get: () => 2 });

		settings.add(first);
		settings.remove(first);
		settings.add(second);
		settings.remove(first);

		expect(settings.export().values['speed']).toBe(2);
	});
});

describe('Ids', () => {
	test('reserves requested ids and generated ids in one namespace', () => {
		const ids = new Ids();

		expect(ids.create('pane', 'pane-1')).toBe('pane-1');
		expect(ids.create('pane')).toBe('pane-2');
		expect(() => ids.create('pane', 'pane-2')).toThrow('duplicate cfg id');
	});
});

describe('Choice binding', () => {
	test('rejects unknown values unless explicitly allowed', () => {
		const items = options<string>(['calm', 'normal', 'intense']);

		expect(choice('normal', items)).toBe('normal');
		expect(choice('debug', items, true)).toBe('debug');
		expect(() => choice('debug', items)).toThrow('choice control rejected unknown value');
	});
});

describe('Ring', () => {
	test('keeps a fixed-size typed history in insertion order', () => {
		const ring = new Ring(3);
		ring.push(1);
		ring.push(2);
		ring.push(3);
		ring.push(4);

		expect(ring.count).toBe(3);
		expect(ring.latest()).toBe(4);
		expect([ring.at(0), ring.at(1), ring.at(2)]).toEqual([2, 3, 4]);
		expect(ring.data).toBeInstanceOf(Float32Array);
	});

	test('normalizes invalid history sizes to a usable one-sample ring', () => {
		for (const size of [0, -4, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
			const ring = new Ring(size);
			ring.push(42);

			expect(ring.data.length).toBe(1);
			expect(ring.count).toBe(1);
			expect(ring.index).toBe(0);
			expect(ring.latest()).toBe(42);
		}
	});
});

describe('Profile', () => {
	test('pairs begin/end labels and records measured sections', () => {
		let now = 0;
		const profile = new Profile(4);

		profile.beginFrame(1);
		profile.begin('scroll', now);
		now += 3;
		expect(profile.end('scroll', now)).toBe(3);
		const times = [now, now + 5];
		profile.measure(
			'motion',
			() => times.shift() ?? now,
			() => undefined,
		);
		profile.endFrame(10);

		const snapshot = profile.snapshot();
		expect(snapshot.frame).toBe(1);
		expect(snapshot.total).toBe(10);
		expect(snapshot.entries.map((entry) => [entry.label, entry.latest])).toEqual([
			['scroll', 3],
			['motion', 5],
		]);
	});

	test('clamps invalid history sizes to finite profile averages', () => {
		for (const history of [0, -4, Number.NaN]) {
			const profile = new Profile(history);
			profile.beginFrame(1);
			profile.begin('draw', 0);
			profile.end('draw', 2);
			profile.beginFrame(2);
			profile.begin('draw', 2);
			profile.end('draw', 6);

			const entry = profile.snapshot().entries[0];
			expect(entry?.latest).toBe(4);
			expect(entry?.average).toBeGreaterThan(0);
			expect(Number.isFinite(entry?.average)).toBe(true);
		}
	});

	test('aggregates repeated labels once per frame', () => {
		const profile = new Profile(4);

		profile.beginFrame(1);
		profile.begin('draw', 0);
		profile.end('draw', 1);
		profile.begin('draw', 1);
		profile.end('draw', 3);

		const entry = profile.snapshot().entries[0];
		expect(entry?.latest).toBe(3);
		expect(entry?.average).toBe(3);
	});

	test('bounds retained labels', () => {
		const profile = new Profile(4, 2);

		for (const label of ['a', 'b', 'c']) {
			profile.beginFrame(1);
			profile.begin(label, 0);
			profile.end(label, 1);
		}

		expect(profile.snapshot().entries.map((entry) => entry.label)).toEqual(['b', 'c']);
	});
});

function runtimeItem(overrides: Partial<RuntimeItem> = {}): RuntimeItem {
	let stored = 0;
	return {
		id: 'item',
		serialize: true,
		get: () => stored,
		setUnknown: (value) => {
			stored = Number(value);
		},
		reset: () => {
			stored = 0;
		},
		...overrides,
	};
}
