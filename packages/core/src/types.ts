export type SchedulerMode = 'external' | 'internal';
export type ControlEvent = 'input' | 'change';
export type ChoiceValue = string | number | boolean;
export type Width = 'compact' | 'default' | 'wide';
export type ThemeMode = 'system' | 'light' | 'dark';
export type Clock = () => number;
export type Raf = (callback: (time: number) => void) => number;
export type CancelRaf = (id: number) => void;
export type ColorString = `#${string}` | `rgb(${string})` | `rgba(${string})`;

export interface CanvasTheme {
	surface: ColorString;
	panel: ColorString;
	grid: ColorString;
	guide: ColorString;
	muted: ColorString;
	text: ColorString;
}

export interface Theme {
	palette: {
		blue: ColorString;
		gold: ColorString;
		rose: ColorString;
		green: ColorString;
		black: ColorString;
		ink: ColorString;
		text: ColorString;
		white: ColorString;
		series: readonly ColorString[];
	};
	canvas: CanvasTheme & {
		light: CanvasTheme;
		dark: CanvasTheme;
	};
	telemetry: {
		background: ColorString;
		target: ColorString;
		text: ColorString;
		warning: ColorString;
		ok: ColorString;
	};
	metrics: {
		frameBudget: number;
		frameDeltaMax: number;
		fpsTarget: number;
		fpsMax: number;
		frameMax: number;
		millisPerSecond: number;
		graphWidth: number;
		graphHeight: number;
		graphHistory: number;
		graphHistoryMax: number;
		graphMinHistory: number;
		graphSmoothing: number;
		profileHistory: number;
		profileLabelMax: number;
		profilerRows: number;
		profilerReadout: number;
		profilerFontSize: number;
		profilerInset: number;
		profilerBarInset: number;
		profilerWidth: number;
		profilerHeight: number;
		padSize: number;
		bezierSize: number;
		bezierHandleRadius: number;
		bezierHandleHitRadius: number;
		bezierTickCount: number;
		bezierTickHeight: number;
		bezierPreviewDuration: number;
		bezierPreviewMarkerRadius: number;
		colorSwatchSize: number;
		paletteSwatchSize: number;
		colorPickerWidth: number;
		colorPickerHeight: number;
		colorSliderHeight: number;
		colorCheckerSize: number;
		monitorHz: number;
		logRows: number;
		logRowsMax: number;
		logBuffer: number;
	};
}

export interface CfgOptions {
	scheduler?: SchedulerMode;
	root?: HTMLElement;
	position?: 'top-right';
	theme?: ThemeMode;
	clock?: Clock;
	raf?: Raf;
	cancelRaf?: CancelRaf;
}

export interface PaneOptions {
	id?: string;
	title: string;
	collapsed?: boolean;
}

export interface FolderOptions {
	id?: string;
	collapsed?: boolean;
}

export interface Choice<T extends ChoiceValue = string> {
	id?: string;
	label: string;
	value: T;
	disabled?: boolean;
}

export interface ControlOptions {
	id?: string;
	label?: string;
	disabled?: boolean;
	serialize?: boolean;
}

export interface NumberOptions extends ControlOptions {
	min?: number;
	max?: number;
	step?: number;
	format?: (value: number) => string;
	keyScale?: number;
	pointerScale?: number;
}

export interface TextOptions extends ControlOptions {
	placeholder?: string;
}

export interface MultilineOptions extends TextOptions {
	rows?: number;
}

export interface ChoiceOptions<T extends ChoiceValue = string> extends ControlOptions {
	options: readonly T[] | readonly Choice<T>[];
	allowUnknown?: boolean;
	columns?: number;
}

export interface ButtonOptions extends ControlOptions {
	action: () => void | Promise<void>;
	confirm?: () => boolean | Promise<boolean>;
}

export interface ButtonGroupOptions extends ControlOptions {
	buttons: readonly ButtonOptions[];
}

export interface ColorOptions extends ControlOptions {
	format?: 'hex' | 'rgba';
	alpha?: boolean;
}

export interface PaletteColor {
	id?: string;
	label?: string;
	value: string;
}

export interface PaletteSection {
	label: string;
	colors: readonly (string | PaletteColor)[];
}

export interface PaletteOptions extends ControlOptions {
	colors: readonly (string | PaletteColor | PaletteSection)[];
	readonly?: boolean;
}

export interface AxisOptions {
	label?: string;
	min?: number;
	max?: number;
	step?: number;
}

export interface VectorOptions extends ControlOptions {
	min?: number;
	max?: number;
	step?: number;
	axes?: readonly AxisOptions[];
	lock?: boolean;
	tuple?: boolean;
	invertY?: boolean;
}

export interface Vector2 {
	x: number;
	y: number;
}

export interface Vector3 extends Vector2 {
	z: number;
}

export interface Vector4 extends Vector3 {
	w: number;
}

export interface IntervalValue {
	min: number;
	max: number;
}

export type BezierTuple = [number, number, number, number];

export interface BezierValue {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface BezierPreset {
	id?: string;
	label: string;
	value: BezierTuple;
}

export interface BezierOptions extends ControlOptions {
	presets?: readonly BezierPreset[];
}

export interface ImageOptions extends TextOptions {
	accept?: string;
	allowRemotePreview?: boolean;
	maxPersistBytes?: number;
}

export interface MonitorOptions<T = unknown> extends ControlOptions {
	get?: () => T;
	throttleHz?: number;
	format?: (value: T) => string;
}

export interface LogOptions extends ControlOptions {
	rows?: number;
	bufferSize?: number;
	throttleHz?: number;
}

export interface GraphSeries {
	id?: string;
	label?: string;
	color?: string;
}

export interface GraphOptions extends ControlOptions {
	min?: number;
	max?: number;
	unit?: string;
	history?: number;
	smoothing?: number | false;
	readout?: 'smoothed' | 'raw';
	autoscale?: boolean;
	target?: number;
	series?: readonly GraphSeries[];
}

export interface ProfilerOptions extends ControlOptions {
	history?: number;
	warning?: number;
}

export interface EntrySnapshot {
	label: string;
	latest: number;
	average: number;
	max: number;
}

export interface ProfilerSnapshot {
	frame: number;
	total: number;
	entries: EntrySnapshot[];
}

export interface SettingsSnapshot {
	version: 1;
	generatedAt: string;
	values: Record<string, unknown>;
}

export interface Setting {
	id: string;
	serialize: boolean;
	get(): unknown;
	setUnknown(value: unknown): void;
	reset(): void;
}

export interface FrameRenderable {
	renderFrame(time: number): void;
}

export interface FrameSampler {
	sample(kind: 'fps' | 'frame', value: number): void;
}

export interface FrameProfiler {
	beginFrame(frame: number): void;
	endFrame(duration: number): void;
}

export interface RuntimeItem extends Setting {
	renderFrame?(time: number): void;
	sample?(kind: 'fps' | 'frame', value: number): void;
	beginFrame?(frame: number): void;
	endFrame?(duration: number): void;
}

export interface Control<T = unknown> extends Host {
	readonly id: string;
	readonly label: string;
	readonly element: HTMLElement;
	get(): T;
	set(value: T): void;
	refresh(): void;
	dispose(): void;
	on(event: ControlEvent, handler: (value: T) => void): () => void;
}

export interface Tab extends Control<string> {
	readonly pages: readonly Pane[];
	page(value: string | number): Pane;
}

export interface LogMonitor extends Control<readonly string[]> {
	push(message: string): void;
	clear(): void;
}

export interface TelemetryGraph extends Control<readonly number[]> {
	push(value: number | readonly number[]): void;
	clear(): void;
	pause(paused?: boolean): void;
}

export interface Profiler extends Control<ProfilerSnapshot> {
	begin(label: string): void;
	end(label: string): number;
	measure<T>(label: string, fn: () => T): T;
	getSnapshot(): ProfilerSnapshot;
	clear(): void;
}

export interface Host {
	folder(label: string, options?: FolderOptions): Pane;
	tab(options: TabOptions): Tab;
	separator(label?: string): Control<void>;
	button(options: ButtonOptions): Control<void>;
	buttonGroup(options: ButtonGroupOptions): Control<void>;
	toggle<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: ControlOptions): Control<boolean>;
	number<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<number>;
	slider<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<number>;
	numberSlider<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<number>;
	text<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: TextOptions): Control<string>;
	multiline<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: MultilineOptions): Control<string>;
	select<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V>;
	segmented<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V>;
	radioGroup<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V>;
	radioGrid<T extends Record<string, unknown>, K extends keyof T, V extends ChoiceValue>(target: T, key: K, options: ChoiceOptions<V>): Control<V>;
	color<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: ColorOptions): Control<string>;
	palette<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options: PaletteOptions): Control<string>;
	point<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector2>;
	vector2<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector2>;
	vector3<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector3>;
	vector4<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector4>;
	xyPad<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: VectorOptions): Control<Vector2>;
	interval<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: NumberOptions): Control<IntervalValue>;
	cubicBezier<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: BezierOptions): Control<BezierTuple>;
	image<T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, options?: ImageOptions): Control<string>;
	monitor<T>(options: MonitorOptions<T>): Control<T>;
	logMonitor(options: LogOptions): LogMonitor;
	graph(options: GraphOptions): TelemetryGraph;
	waveformGraph(options: GraphOptions): TelemetryGraph;
	fpsGraph(options: GraphOptions): TelemetryGraph;
	frameGraph(options: GraphOptions): TelemetryGraph;
	profiler(options: ProfilerOptions): Profiler;
	refresh(): void;
}

export interface TabOptions {
	id?: string;
	label?: string;
	tabs: readonly string[] | readonly Choice<string>[];
	initial?: string;
}

export interface Pane extends Host {
	readonly id: string;
	readonly title: string;
	readonly element: HTMLElement;
	collapse(): void;
	expand(): void;
	toggleCollapsed(): void;
	dispose(): void;
}

export interface Cfg {
	pane(options: PaneOptions): Pane;
	getTheme(): ThemeMode;
	setTheme(theme: ThemeMode): void;
	beginFrame(time: number): void;
	endFrame(time?: number): void;
	renderFrame(time?: number): void;
	start(): void;
	stop(): void;
	exportSettings(): SettingsSnapshot;
	applySettings(snapshot: SettingsSnapshot | string | unknown): void;
	resetSettings(): void;
	copySettings(): Promise<void>;
	dispose(): void;
}
