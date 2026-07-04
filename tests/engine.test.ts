import { describe, expect, test } from 'bun:test';
import type { RuntimeItem } from '@u29dc/cfg-core';
import { Engine, Profile, Ring, Settings } from '@u29dc/cfg-core';

describe('Engine', () => {
	test('external mode samples frames without creating an internal RAF loop', () => {
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
		now = 120;
		engine.beginFrame(16);
		now = 127;
		engine.endFrame();
		engine.renderFrame(16);

		expect(rafCalls).toBe(0);
		expect(rendered).toEqual([0, 16]);
		expect(profilerFrames).toEqual([1, 2]);
		expect(profilerDurations).toEqual([4, 7]);
		expect(sampled[0]).toEqual(['frame', 4]);
		expect(sampled[1]?.[0]).toBe('fps');
		expect(sampled[2]).toEqual(['frame', 16]);
	});

	test('internal mode uses one RAF loop and stops cleanly', () => {
		let callback: ((time: number) => void) | undefined;
		const cancelled: number[] = [];
		const engine = new Engine({
			scheduler: 'internal',
			clock: () => 10,
			raf: (next) => {
				callback = next;
				return 42;
			},
			cancelRaf: (id) => cancelled.push(id),
		});

		engine.start();
		engine.start();
		expect(typeof callback).toBe('function');
		engine.stop();
		expect(cancelled).toEqual([42]);
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
