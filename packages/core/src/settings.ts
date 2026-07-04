import type { Setting, SettingsSnapshot } from './types';
import { clone, parse } from './utils/json';

export const version = 1 as const;

export class Settings {
	readonly #items = new Map<string, Setting>();

	add(setting: Setting) {
		if (this.#items.has(setting.id)) {
			throw new Error(`duplicate cfg setting id: ${setting.id}`);
		}
		this.#items.set(setting.id, setting);
	}

	remove(setting: Setting) {
		this.#items.delete(setting.id);
	}

	export(): SettingsSnapshot {
		const values: Record<string, unknown> = {};
		for (const [id, item] of this.#items) {
			if (item.serialize) {
				values[id] = clone(item.get());
			}
		}
		return {
			version,
			generatedAt: new Date().toISOString(),
			values,
		};
	}

	apply(snapshot: SettingsSnapshot | string | unknown) {
		const value = typeof snapshot === 'string' ? parse(snapshot) : snapshot;
		if (!isSnapshot(value)) {
			throw new Error('cfg settings import expected a version 1 snapshot');
		}
		const applied: { setting: Setting; previous: unknown }[] = [];
		try {
			for (const [id, setting] of this.#items) {
				if (setting.serialize && Object.hasOwn(value.values, id)) {
					applySetting(applied, setting, value.values[id]);
				}
			}
		} catch (error) {
			rollback(applied);
			throw error;
		}
	}

	reset() {
		for (const item of this.#items.values()) {
			if (item.serialize) {
				item.reset();
			}
		}
	}
}

export function isSnapshot(value: unknown): value is SettingsSnapshot {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as SettingsSnapshot).version === version &&
		typeof (value as SettingsSnapshot).values === 'object' &&
		(value as SettingsSnapshot).values !== null
	);
}

function applySetting(applied: { setting: Setting; previous: unknown }[], setting: Setting, value: unknown) {
	applied.push({ setting, previous: clone(setting.get()) });
	setting.setUnknown(value);
}

function rollback(applied: { setting: Setting; previous: unknown }[]) {
	for (let index = applied.length - 1; index >= 0; index -= 1) {
		const entry = applied[index];
		if (entry) {
			entry.setting.setUnknown(entry.previous);
		}
	}
}
