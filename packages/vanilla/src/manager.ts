import type { Cfg, CfgOptions, PaneOptions, SettingsSnapshot, ThemeMode } from '@u29dc/cfg-core';
import { documentOf, Engine } from '@u29dc/cfg-core';
import type { Managed } from './base';
import { Pane } from './pane';

const themes = new Set<ThemeMode>(['system', 'light', 'dark']);

export class Manager implements Cfg {
	readonly doc: Document;
	readonly engine: Engine;
	readonly #root: HTMLElement;
	readonly #ownsRoot: boolean;
	readonly #panes = new Set<Pane>();
	#disposed = false;

	constructor(options: CfgOptions = {}) {
		this.engine = new Engine(options);
		this.doc = documentOf(options.root);
		this.#root = options.root ?? this.doc.createElement('div');
		this.#ownsRoot = options.root === undefined;
		this.#root.classList.add('cfg-root');
		this.#root.dataset['cfgPosition'] = options.position ?? 'top-right';
		this.#root.dataset['cfgScheduler'] = this.engine.scheduler;
		this.setTheme(options.theme ?? 'system');
		if (this.#ownsRoot) {
			this.doc.body.append(this.#root);
		}
	}

	pane(options: PaneOptions) {
		this.#assert();
		const pane = new Pane(this, options);
		this.#panes.add(pane);
		this.#root.append(pane.element);
		return pane;
	}

	getTheme(): ThemeMode {
		const value = this.#root.dataset['cfgTheme'];
		return themes.has(value as ThemeMode) ? (value as ThemeMode) : 'system';
	}

	setTheme(theme: ThemeMode): void {
		if (!themes.has(theme)) {
			throw new Error(`cfg theme must be "system", "light", or "dark"; received "${String(theme)}"`);
		}
		this.#root.dataset['cfgTheme'] = theme;
		for (const pane of this.#panes) {
			pane.refresh();
		}
	}

	beginFrame(time: number) {
		this.engine.beginFrame(time);
	}

	endFrame(_time?: number) {
		this.engine.endFrame();
	}

	renderFrame(time?: number) {
		this.engine.renderFrame(time);
	}

	start() {
		this.engine.start();
	}

	stop() {
		this.engine.stop();
	}

	exportSettings() {
		return this.engine.settings.export();
	}

	applySettings(snapshot: SettingsSnapshot | string | unknown) {
		this.engine.settings.apply(snapshot);
	}

	resetSettings() {
		this.engine.settings.reset();
	}

	async copySettings() {
		const clipboard = globalThis.navigator?.clipboard;
		if (!clipboard) {
			throw new Error('cfg.copySettings() requires navigator.clipboard');
		}
		await clipboard.writeText(JSON.stringify(this.exportSettings(), null, 2));
	}

	dispose() {
		if (this.#disposed) {
			return;
		}
		this.#disposed = true;
		this.stop();
		for (const pane of [...this.#panes]) {
			pane.dispose();
		}
		this.#panes.clear();
		this.engine.dispose();
		if (this.#ownsRoot) {
			this.#root.remove();
		} else {
			this.#root.classList.remove('cfg-root');
			delete this.#root.dataset['cfgTheme'];
		}
	}

	add(control: Managed) {
		this.engine.add(control);
	}

	remove(control: Managed) {
		this.engine.remove(control);
	}

	removePane(pane: Pane) {
		this.#panes.delete(pane);
	}

	create(kind: string, requested?: string) {
		return this.engine.create(kind, requested);
	}

	clock() {
		return this.engine.clock();
	}

	#assert() {
		if (this.#disposed) {
			throw new Error('cfg instance has been disposed');
		}
		this.engine.assert();
	}
}
