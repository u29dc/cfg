import type {
	BezierOptions,
	ButtonGroupOptions,
	ButtonOptions,
	ChoiceOptions,
	ChoiceValue,
	ColorOptions,
	Control,
	ControlEvent,
	ControlOptions,
	FolderOptions,
	GraphOptions,
	Host,
	ImageOptions,
	IntervalValue,
	LogMonitor,
	LogOptions,
	MonitorOptions,
	MultilineOptions,
	NumberOptions,
	PaletteOptions,
	Pane,
	Profiler,
	ProfilerOptions,
	TabOptions,
	TelemetryGraph,
	TextOptions,
	Vector2,
	Vector3,
	Vector4,
	VectorOptions,
} from '@u29dc/cfg-core';
import { clone, Events, el, label } from '@u29dc/cfg-core';

export interface Managed {
	readonly id: string;
	readonly element: HTMLElement;
	readonly serialize: boolean;
	get(): unknown;
	setUnknown(value: unknown): void;
	reset(): void;
	refresh(): void;
	dispose(): void;
}

export interface Owner extends Host {
	readonly doc: Document;
	clock(): number;
	create(kind: string, requested?: string): string;
	remove(control: Managed): void;
	visible(): boolean;
}

export abstract class Base<T> implements Control<T> {
	readonly id: string;
	readonly label: string;
	readonly element: HTMLElement;
	readonly field: HTMLElement;
	readonly serialize: boolean;
	readonly owner: Owner;
	readonly #events = new Events<T>();
	readonly #initial: T;
	readonly #cleanups: (() => void)[] = [];
	#disposed = false;

	constructor(owner: Owner, kind: string, options: ControlOptions | undefined, initial: T) {
		this.owner = owner;
		this.id = owner.create(kind, options?.id);
		this.label = options?.label ?? label(this.id);
		this.serialize = options?.serialize ?? true;
		this.#initial = clone(initial);

		this.element = el(owner.doc, 'div', 'cfg-control');
		this.element.dataset['cfgControl'] = kind;
		this.element.dataset['cfgId'] = this.id;
		this.element.dataset['cfgDisabled'] = String(options?.disabled ?? false);

		const labelNode = el(owner.doc, 'label', 'cfg-control__label');
		labelNode.textContent = this.label;
		labelNode.htmlFor = `${this.id}-input`;

		this.field = el(owner.doc, 'div', 'cfg-control__field');
		this.element.append(labelNode, this.field);
	}

	abstract get(): T;
	abstract set(value: T): void;
	protected abstract render(): void;

	setUnknown(value: unknown) {
		this.set(value as T);
	}

	reset() {
		this.set(clone(this.#initial));
	}

	refresh() {
		this.render();
	}

	dispose() {
		if (this.#disposed) {
			return;
		}
		this.#disposed = true;
		for (const cleanup of this.#cleanups.splice(0)) {
			cleanup();
		}
		this.#events.clear();
		this.owner.remove(this);
		this.element.remove();
	}

	on(event: ControlEvent, handler: (value: T) => void) {
		return this.#events.on(event, handler);
	}

	protected cleanup(fn: () => void) {
		this.#cleanups.push(fn);
	}

	protected emit(event: ControlEvent) {
		this.#events.emit(event, this.get());
	}

	folder(labelText: string, options?: FolderOptions) {
		return this.owner.folder(labelText, options);
	}

	tab(options: TabOptions) {
		return this.owner.tab(options);
	}

	separator(labelText?: string) {
		return this.owner.separator(labelText);
	}

	button(options: ButtonOptions) {
		return this.owner.button(options);
	}

	buttonGroup(options: ButtonGroupOptions) {
		return this.owner.buttonGroup(options);
	}

	toggle<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: ControlOptions) {
		return this.owner.toggle(target, key, options);
	}

	number<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: NumberOptions) {
		return this.owner.number(target, key, options);
	}

	slider<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: NumberOptions) {
		return this.owner.slider(target, key, options);
	}

	numberSlider<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: NumberOptions) {
		return this.owner.numberSlider(target, key, options);
	}

	text<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: TextOptions) {
		return this.owner.text(target, key, options);
	}

	multiline<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: MultilineOptions) {
		return this.owner.multiline(target, key, options);
	}

	select<Target extends Record<string, unknown>, Key extends keyof Target, Value extends ChoiceValue>(target: Target, key: Key, options: ChoiceOptions<Value>) {
		return this.owner.select(target, key, options);
	}

	segmented<Target extends Record<string, unknown>, Key extends keyof Target, Value extends ChoiceValue>(target: Target, key: Key, options: ChoiceOptions<Value>) {
		return this.owner.segmented(target, key, options);
	}

	radioGroup<Target extends Record<string, unknown>, Key extends keyof Target, Value extends ChoiceValue>(target: Target, key: Key, options: ChoiceOptions<Value>) {
		return this.owner.radioGroup(target, key, options);
	}

	radioGrid<Target extends Record<string, unknown>, Key extends keyof Target, Value extends ChoiceValue>(target: Target, key: Key, options: ChoiceOptions<Value>) {
		return this.owner.radioGrid(target, key, options);
	}

	color<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: ColorOptions) {
		return this.owner.color(target, key, options);
	}

	palette<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options: PaletteOptions) {
		return this.owner.palette(target, key, options);
	}

	point<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: VectorOptions) {
		return this.owner.point(target, key, options);
	}

	vector2<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: VectorOptions) {
		return this.owner.vector2(target, key, options);
	}

	vector3<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: VectorOptions) {
		return this.owner.vector3(target, key, options);
	}

	vector4<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: VectorOptions) {
		return this.owner.vector4(target, key, options);
	}

	xyPad<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: VectorOptions) {
		return this.owner.xyPad(target, key, options);
	}

	interval<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: NumberOptions) {
		return this.owner.interval(target, key, options);
	}

	cubicBezier<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: BezierOptions) {
		return this.owner.cubicBezier(target, key, options);
	}

	image<Target extends Record<string, unknown>, Key extends keyof Target>(target: Target, key: Key, options?: ImageOptions) {
		return this.owner.image(target, key, options);
	}

	monitor<Value>(options: MonitorOptions<Value>) {
		return this.owner.monitor(options);
	}

	logMonitor(options: LogOptions): LogMonitor {
		return this.owner.logMonitor(options);
	}

	graph(options: GraphOptions): TelemetryGraph {
		return this.owner.graph(options);
	}

	waveformGraph(options: GraphOptions): TelemetryGraph {
		return this.owner.waveformGraph(options);
	}

	fpsGraph(options: GraphOptions): TelemetryGraph {
		return this.owner.fpsGraph(options);
	}

	frameGraph(options: GraphOptions): TelemetryGraph {
		return this.owner.frameGraph(options);
	}

	profiler(options: ProfilerOptions): Profiler {
		return this.owner.profiler(options);
	}
}

export type AnyControl = Managed | Control<Vector2> | Control<Vector3> | Control<Vector4> | Control<IntervalValue> | Pane;
