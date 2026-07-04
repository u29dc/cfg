import type {
	BezierOptions,
	ButtonGroupOptions,
	ButtonOptions,
	ChoiceOptions,
	ChoiceValue,
	ColorOptions,
	Control,
	ControlOptions,
	FolderOptions,
	GraphOptions,
	ImageOptions,
	IntervalValue,
	LogMonitor,
	LogOptions,
	MonitorOptions,
	MultilineOptions,
	NumberOptions,
	PaletteOptions,
	Pane as PaneApi,
	PaneOptions,
	ProfilerOptions,
	Tab as TabApi,
	TabOptions,
	TelemetryGraph,
	TextOptions,
	Vector2,
	Vector3,
	Vector4,
	VectorOptions,
} from '@u29dc/cfg-core';
import { el } from '@u29dc/cfg-core';
import { Base, type Managed } from './base';
import { Button, ButtonGroup, Separator } from './controls/action';
import { ChoiceControl } from './controls/choice';
import { ColorControl, PaletteControl } from './controls/color';
import { Numeric, Textual, Toggle } from './controls/input';
import { ImageControl } from './controls/media';
import { Log, Monitor } from './controls/monitor';
import { Bezier, Interval, VectorControl, XyPad } from './controls/vector';
import type { Manager } from './manager';
import { Graph } from './telemetry/graph';
import { ProfilerControl } from './telemetry/profile';

export class Pane implements PaneApi {
	readonly id: string;
	readonly title: string;
	readonly element: HTMLElement;
	readonly doc: Document;
	readonly #manager: Manager;
	readonly #header: HTMLButtonElement;
	readonly #body: HTMLElement;
	readonly #children = new Set<Managed | Pane>();
	readonly #parent: Pane | undefined;
	#animation: Animation | undefined;
	#expandedHeight: number | undefined;
	#containerHidden = false;
	#collapsed = false;
	#disposed = false;

	constructor(manager: Manager, options: PaneOptions, parent?: Pane) {
		this.#manager = manager;
		this.#parent = parent;
		this.doc = manager.doc;
		this.id = manager.create(parent ? 'folder' : 'pane', options.id);
		this.title = options.title;
		this.#collapsed = options.collapsed ?? false;
		this.element = el(this.doc, parent ? 'section' : 'aside', parent ? 'cfg-folder' : 'cfg-pane');
		this.element.dataset['cfgId'] = this.id;
		this.element.dataset['cfgCollapsed'] = String(this.#collapsed);
		this.#header = el(this.doc, 'button', parent ? 'cfg-folder__header' : 'cfg-pane__header') as HTMLButtonElement;
		this.#header.type = 'button';
		this.#header.id = `${this.id}-header`;
		this.#header.setAttribute('aria-controls', `${this.id}-body`);
		this.#header.addEventListener('click', () => this.toggleCollapsed());
		const marker = el(this.doc, 'span', 'cfg-disclosure');
		marker.setAttribute('aria-hidden', 'true');
		const title = el(this.doc, 'span', parent ? 'cfg-folder__title' : 'cfg-pane__title');
		title.textContent = options.title;
		this.#header.append(marker, title);
		this.#body = el(this.doc, 'div', parent ? 'cfg-folder__body' : 'cfg-pane__body');
		this.#body.id = `${this.id}-body`;
		this.#body.setAttribute('role', 'group');
		this.#body.setAttribute('aria-labelledby', this.#header.id);
		this.element.append(this.#header, this.#body);
		this.#syncCollapsed();
	}

	folder(label: string, options: FolderOptions = {}): Pane {
		const paneOptions: PaneOptions = { title: label };
		if (options.id !== undefined) {
			paneOptions.id = options.id;
		}
		if (options.collapsed !== undefined) {
			paneOptions.collapsed = options.collapsed;
		}
		const pane = new Pane(this.#manager, paneOptions, this);
		this.#children.add(pane);
		this.#body.append(pane.element);
		return pane;
	}

	tab(options: TabOptions): TabApi {
		return this.#add(new TabGroup(this.#manager, this, options));
	}

	separator(label?: string): Control<void> {
		return this.#add(new Separator(this, label));
	}

	button(options: ButtonOptions): Control<void> {
		return this.#add(new Button(this, options));
	}

	buttonGroup(options: ButtonGroupOptions): Control<void> {
		return this.#add(new ButtonGroup(this, options));
	}

	toggle<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: ControlOptions): Control<boolean> {
		return this.#add(new Toggle(this, target, key, options));
	}

	number<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<number> {
		return this.#add(new Numeric(this, target, key, options, 'number'));
	}

	slider<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<number> {
		return this.#add(new Numeric(this, target, key, options, 'slider'));
	}

	numberSlider<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<number> {
		return this.#add(new Numeric(this, target, key, options, 'number-slider'));
	}

	text<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: TextOptions): Control<string> {
		return this.#add(new Textual(this, target, key, options, false));
	}

	multiline<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: MultilineOptions): Control<string> {
		return this.#add(new Textual(this, target, key, options, true));
	}

	select<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V> {
		return this.#add(new ChoiceControl(this, target, key, options, 'select'));
	}

	segmented<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V> {
		return this.#add(new ChoiceControl(this, target, key, options, 'segmented'));
	}

	radioGroup<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V> {
		return this.#add(new ChoiceControl(this, target, key, options, 'radio-group'));
	}

	radioGrid<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V> {
		return this.#add(new ChoiceControl(this, target, key, options, 'radio-grid'));
	}

	color<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: ColorOptions): Control<string> {
		return this.#add(new ColorControl(this, target, key, options));
	}

	palette<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options: PaletteOptions): Control<string> {
		return this.#add(new PaletteControl(this, target, key, options));
	}

	point<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector2> {
		return this.vector2(target, key, options);
	}

	vector2<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options: VectorOptions = {}): Control<Vector2> {
		const control = new VectorControl(this, target, key, options, ['x', 'y']);
		this.#add(control);
		return control as unknown as Control<Vector2>;
	}

	vector3<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options: VectorOptions = {}): Control<Vector3> {
		const control = new VectorControl(this, target, key, options, ['x', 'y', 'z']);
		this.#add(control);
		return control as unknown as Control<Vector3>;
	}

	vector4<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options: VectorOptions = {}): Control<Vector4> {
		const control = new VectorControl(this, target, key, options, ['x', 'y', 'z', 'w']);
		this.#add(control);
		return control as unknown as Control<Vector4>;
	}

	xyPad<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector2> {
		return this.#add(new XyPad(this, target, key, options));
	}

	interval<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<IntervalValue> {
		const control = new Interval(this, target, key, options);
		this.#add(control);
		return control as unknown as Control<IntervalValue>;
	}

	cubicBezier<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: BezierOptions): Control<[number, number, number, number]> {
		return this.#add(new Bezier(this, target, key, options));
	}

	image<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: ImageOptions): Control<string> {
		return this.#add(new ImageControl(this, target, key, options));
	}

	monitor<T>(options: MonitorOptions<T>): Control<T> {
		return this.#add(new Monitor(this, options));
	}

	logMonitor(options: LogOptions): LogMonitor {
		return this.#add(new Log(this, options));
	}

	graph(options: GraphOptions): TelemetryGraph {
		return this.#add(new Graph(this, options, 'graph'));
	}

	waveformGraph(options: GraphOptions): TelemetryGraph {
		return this.#add(new Graph(this, options, 'waveform'));
	}

	fpsGraph(options: GraphOptions): TelemetryGraph {
		return this.#add(new Graph(this, options, 'fps'));
	}

	frameGraph(options: GraphOptions): TelemetryGraph {
		return this.#add(new Graph(this, options, 'frame'));
	}

	profiler(options: ProfilerOptions): ProfilerControl {
		return this.#add(new ProfilerControl(this, options));
	}

	refresh(): void {
		for (const child of this.#children) {
			child.refresh();
		}
	}

	collapse(): void {
		if (this.#collapsed) {
			return;
		}
		this.#collapsed = true;
		this.#animateCollapse();
	}

	expand(): void {
		if (!this.#collapsed) {
			return;
		}
		this.#collapsed = false;
		this.#animateExpand();
	}

	toggleCollapsed(): void {
		if (this.#collapsed) {
			this.expand();
		} else {
			this.collapse();
		}
	}

	visible(): boolean {
		return !this.#containerHidden && !this.#collapsed && !this.#disposed && (this.#parent?.visible() ?? true);
	}

	dispose(): void {
		if (this.#disposed) {
			return;
		}
		this.#disposed = true;
		for (const child of [...this.#children]) {
			child.dispose();
		}
		this.#children.clear();
		this.#manager.removePane(this);
		this.element.remove();
	}

	create(kind: string, requested?: string): string {
		return this.#manager.create(kind, requested);
	}

	setContainerHidden(hidden: boolean): void {
		const wasHidden = this.#containerHidden;
		this.#containerHidden = hidden;
		this.element.hidden = hidden;
		if (wasHidden && !hidden) {
			this.#refreshVisible();
		}
	}

	clock(): number {
		return this.#manager.clock();
	}

	remove(control: Managed): void {
		this.#children.delete(control);
		this.#manager.remove(control);
	}

	#add<T extends Managed>(control: T): T {
		this.#children.add(control);
		this.#body.append(control.element);
		this.#manager.add(control);
		control.refresh();
		this.#invalidateHeight();
		return control;
	}

	#syncCollapsed() {
		this.element.dataset['cfgCollapsed'] = String(this.#collapsed);
		this.#header.setAttribute('aria-expanded', String(!this.#collapsed));
		this.#body.setAttribute('aria-hidden', String(this.#collapsed));
		this.#body.hidden = this.#collapsed;
	}

	#syncHeader() {
		this.element.dataset['cfgCollapsed'] = String(this.#collapsed);
		this.#header.setAttribute('aria-expanded', String(!this.#collapsed));
		this.#body.setAttribute('aria-hidden', String(this.#collapsed));
	}

	#animateCollapse() {
		const start = this.#body.getBoundingClientRect().height;
		this.#animation?.cancel();
		if (start > 0) {
			this.#expandedHeight = start;
		}
		this.#syncHeader();
		this.#body.dataset['cfgAnimating'] = 'true';
		if (this.#parent) {
			this.#parent.#invalidateHeight();
		}
		const animation = this.#body.animate(
			[
				{ height: `${start}px`, opacity: 1 },
				{ height: '0px', opacity: 0 },
			],
			motion(this.#parent !== undefined),
		);
		this.#animation = animation;
		animation.onfinish = () => {
			if (this.#animation !== animation) {
				return;
			}
			this.#body.hidden = true;
			delete this.#body.dataset['cfgAnimating'];
			this.#animation = undefined;
		};
		animation.oncancel = () => {
			if (this.#animation !== animation) {
				return;
			}
			delete this.#body.dataset['cfgAnimating'];
			this.#animation = undefined;
		};
	}

	#animateExpand() {
		const start = this.#body.hidden ? 0 : this.#body.getBoundingClientRect().height;
		this.#animation?.cancel();
		this.#body.hidden = false;
		this.#syncHeader();
		const end = this.#expandedHeight ?? this.#measureExpandedHeight();
		this.#body.dataset['cfgAnimating'] = 'true';
		if (this.#parent) {
			this.#parent.#invalidateHeight();
		}
		const animation = this.#body.animate(
			[
				{ height: `${start}px`, opacity: start > 0 ? 1 : 0 },
				{ height: `${end}px`, opacity: 1 },
			],
			motion(this.#parent !== undefined),
		);
		this.#animation = animation;
		animation.onfinish = () => {
			if (this.#animation !== animation) {
				return;
			}
			delete this.#body.dataset['cfgAnimating'];
			this.#animation = undefined;
			this.refresh();
		};
		animation.oncancel = () => {
			if (this.#animation !== animation) {
				return;
			}
			delete this.#body.dataset['cfgAnimating'];
			this.#animation = undefined;
		};
	}

	#measureExpandedHeight() {
		this.#body.hidden = false;
		this.#expandedHeight = this.#body.scrollHeight;
		return this.#expandedHeight;
	}

	#invalidateHeight() {
		this.#expandedHeight = undefined;
		if (this.#parent) {
			this.#parent.#invalidateHeight();
		}
	}

	#refreshVisible() {
		const view = this.doc.defaultView;
		if (!view) {
			this.refresh();
			return;
		}
		view.requestAnimationFrame(() => {
			if (!this.#containerHidden && !this.#disposed) {
				this.refresh();
			}
		});
	}
}

class TabGroup extends Base<string> implements TabApi {
	readonly pages: Pane[] = [];
	readonly #buttons: HTMLButtonElement[] = [];
	readonly #values: string[];
	#selected: string;

	constructor(manager: Manager, parent: Pane, options: TabOptions) {
		const items = tabItems(options);
		const initial = options.initial ?? items[0]?.value;
		if (initial === undefined) {
			throw new Error('tab control requires at least one tab');
		}
		super(parent, 'tab', options, initial);
		this.#values = items.map((item) => item.value);
		this.#selected = initial;
		this.element.classList.add('cfg-tabs');

		const nav = el(parent.doc, 'div', 'cfg-tabs__nav');
		const pages = el(parent.doc, 'div', 'cfg-tabs__pages');
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			const page = new Pane(manager, { id: item.id ?? `${this.id}-${item.value}`, title: item.label }, parent);
			page.element.classList.add('cfg-tab-page');
			page.setContainerHidden(item.value !== this.#selected);
			this.pages.push(page);
			pages.append(page.element);
			const button = parent.doc.createElement('button');
			button.type = 'button';
			button.className = 'cfg-choice';
			button.disabled = item.disabled ?? false;
			button.textContent = item.label;
			button.dataset['cfgValue'] = item.value;
			button.addEventListener('click', () => this.set(item.value));
			button.addEventListener('keydown', (event) => this.#key(event, index));
			this.#buttons.push(button);
			nav.append(button);
		}
		this.field.append(nav, pages);
		this.render();
	}

	get() {
		return this.#selected;
	}

	set(value: string) {
		if (!this.#values.includes(value)) {
			throw new Error(`tab control rejected unknown page "${value}"`);
		}
		this.#selected = value;
		this.render();
		this.emit('change');
	}

	page(value: string | number) {
		const page = typeof value === 'number' ? this.pages[value] : this.pages[this.#values.indexOf(value)];
		if (!page) {
			throw new Error(`tab page not found: ${String(value)}`);
		}
		return page;
	}

	override dispose() {
		for (const page of this.pages) {
			page.dispose();
		}
		this.pages.length = 0;
		super.dispose();
	}

	protected render() {
		for (let index = 0; index < this.#buttons.length; index += 1) {
			const value = this.#values[index];
			const selected = value === this.#selected;
			const button = this.#buttons[index];
			if (button) {
				button.dataset['cfgSelected'] = String(selected);
				button.setAttribute('aria-pressed', String(selected));
			}
			this.pages[index]?.setContainerHidden(!selected);
		}
	}

	#key(event: KeyboardEvent, index: number) {
		const nextButton = nextTabButton(this.#buttons, index, event.key);
		if (!nextButton) {
			return;
		}
		event.preventDefault();
		nextButton.focus();
		const value = nextButton.dataset['cfgValue'];
		if (value) {
			this.set(value);
		}
	}
}

function motion(nested: boolean): KeyframeAnimationOptions {
	return {
		duration: prefersReducedMotion() ? 0 : nested ? 80 : 150,
		easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
	};
}

function prefersReducedMotion() {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tabItems(options: TabOptions) {
	return options.tabs.map((item) => (typeof item === 'string' ? { label: item, value: item } : { ...item, value: String(item.value) }));
}

function nextTabButton(buttons: readonly HTMLButtonElement[], index: number, key: string) {
	let next = -1;
	if (key === 'Home') {
		next = 0;
	} else if (key === 'End') {
		next = buttons.length - 1;
	} else if (key === 'ArrowLeft') {
		next = Math.max(0, index - 1);
	} else if (key === 'ArrowRight') {
		next = Math.min(buttons.length - 1, index + 1);
	}
	return next === -1 ? undefined : buttons[next];
}
