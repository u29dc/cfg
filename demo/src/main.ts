import { createCfg, type SettingsSnapshot, type ThemeMode, theme } from 'cfg';
import 'cfg/styles.css';
import { bezierPresets, cfgThemeOptions, defaultBezier, densityOptions, modeOptions, paletteOptions, placementOptions } from '../../examples/options';
import './demo.css';

type Mode = (typeof modeOptions)[number];
type Density = (typeof densityOptions)[number];
type Placement = (typeof placementOptions)[number];

interface DemoState extends Record<string, unknown> {
	cfgTheme: ThemeMode;
	enabled: boolean;
	fakeWork: boolean;
	speed: number;
	gain: number;
	label: string;
	notes: string;
	mode: Mode;
	density: Density;
	placement: Placement;
	color: string;
	accent: string;
	point: { x: number; y: number };
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number; w: number };
	range: { min: number; max: number };
	easing: [number, number, number, number];
	image: string;
}

declare global {
	interface Window {
		__cfgDemo?: {
			createCfg: typeof createCfg;
			state: DemoState;
			theme: () => ThemeMode;
			setTheme: (theme: ThemeMode) => void;
			snapshot: () => SettingsSnapshot;
			applySettings: (snapshot: SettingsSnapshot) => void;
			resetSettings: () => void;
			pushLog: (message: string) => void;
			logLines: () => readonly string[];
			dispose: () => void;
			frame: () => number;
			workload: () => number;
		};
	}
}

const root = document.querySelector<HTMLElement>('#demo-root');
if (!root) {
	throw new Error('demo root not found');
}

const demoMetrics = {
	canvasWidth: 1280,
	canvasHeight: 720,
	frameClamp: 64,
	logEvery: 90,
	hudEvery: 4,
	tau: Math.PI * 2,
	centerInfluence: 0.24,
	phaseStep: 0.07,
	waveYMultiplier: 1.17,
	density: { low: 18, medium: 36, high: 72 },
	scale: { calm: 0.7, normal: 1, intense: 1.35 },
	shape: {
		baseSize: 8,
		gainSize: 18,
		sizeCycle: 5,
		cornerRadius: 4,
		accentEvery: 3,
		activeAlpha: 0.32,
		gainAlpha: 0.48,
		disabledAlpha: 0.12,
	},
	marker: {
		offset: 64,
		half: 18,
		size: 36,
		lineWidth: 2,
	},
	text: {
		font: '16px ui-monospace, monospace',
		inset: 24,
	},
	workload: {
		base: 2.5,
		gain: 4,
	},
} as const;

root.innerHTML = `
	<section class="demo-stage">
		<canvas class="demo-canvas" width="${demoMetrics.canvasWidth}" height="${demoMetrics.canvasHeight}" aria-label="cfg animated runtime demo"></canvas>
		<div class="demo-hud" aria-live="polite">
			<strong data-demo-label></strong>
			<span data-demo-mode></span>
			<span data-demo-speed></span>
			<span data-demo-point></span>
		</div>
		<pre class="demo-state" data-demo-state></pre>
	</section>
`;

const canvas = must(root.querySelector<HTMLCanvasElement>('.demo-canvas'), 'demo canvas not found');
const stateNode = must(root.querySelector<HTMLElement>('[data-demo-state]'), 'demo state not found');
const labelNode = must(root.querySelector<HTMLElement>('[data-demo-label]'), 'demo label not found');
const modeNode = must(root.querySelector<HTMLElement>('[data-demo-mode]'), 'demo mode not found');
const speedNode = must(root.querySelector<HTMLElement>('[data-demo-speed]'), 'demo speed not found');
const pointNode = must(root.querySelector<HTMLElement>('[data-demo-point]'), 'demo point not found');
const ctx = must(canvas.getContext('2d'), '2d canvas unavailable');

const state: DemoState = {
	cfgTheme: 'system',
	enabled: true,
	fakeWork: false,
	speed: 1,
	gain: 0.6,
	label: 'cfg runtime',
	notes: 'External RAF',
	mode: 'normal',
	density: 'medium',
	placement: 'ne',
	color: theme.palette.blue,
	accent: theme.palette.gold,
	point: { x: 0.1, y: 0.2 },
	position: { x: 0, y: 24, z: 64 },
	rotation: { x: 0, y: 0, z: 0, w: 1 },
	range: { min: 20, max: 80 },
	easing: [...defaultBezier],
	image: '',
};

let saved: SettingsSnapshot | undefined;
let frameCount = 0;
let pulse = 0;
let lastTime = 0;
let workloadCost = 0;
let hudKey = '';
let disposed = false;
const cfg = createCfg({ scheduler: 'external', theme: state.cfgTheme });

const controls = cfg.pane({ id: 'runtime', title: 'Runtime' });
const appearance = controls.folder('Appearance');
const themeControl = appearance.segmented(state, 'cfgTheme', { id: 'cfg-theme', label: 'Theme', options: cfgThemeOptions });
themeControl.on('change', (next) => cfg.setTheme(next));
const basics = controls.folder('Basics');
basics.toggle(state, 'enabled', { id: 'enabled', label: 'Enabled' });
basics.toggle(state, 'fakeWork', { id: 'fake-work', label: 'Workload' });
basics.numberSlider(state, 'speed', { id: 'speed', label: 'Speed', min: 0, max: 4, step: 0.01 });
basics.slider(state, 'gain', { id: 'gain', label: 'Gain', min: 0, max: 1, step: 0.001 });
basics.text(state, 'label', { id: 'label', label: 'Label' });
basics.multiline(state, 'notes', { id: 'notes', label: 'Notes', rows: 3 });

const choices = controls.folder('Choices');
choices.segmented(state, 'mode', { id: 'mode', label: 'Mode', options: modeOptions });
choices.select(state, 'density', { id: 'density', label: 'Density', options: densityOptions });
choices.radioGrid(state, 'placement', { id: 'placement', label: 'Place', columns: 2, options: placementOptions });

const views = controls.tab({ id: 'views', label: 'Views', tabs: ['Main', 'Debug'], initial: 'Main' });
views.page('Main').monitor({ id: 'view-status', label: 'State', get: () => state.mode });
views.page('Debug').monitor({ id: 'view-frame', label: 'Frame', get: () => frameCount });

const vectors = controls.folder('Vectors');
vectors.point(state, 'point', { id: 'point', label: 'Point', min: -1, max: 1, step: 0.01 });
vectors.xyPad(state, 'point', { id: 'pad', label: 'Pad', min: -1, max: 1, step: 0.01 });
vectors.vector3(state, 'position', { id: 'position', label: 'Position', min: -100, max: 100, step: 0.1 });
vectors.vector4(state, 'rotation', { id: 'rotation', label: 'Rotation', min: -1, max: 1, step: 0.001 });
vectors.interval(state, 'range', { id: 'range', label: 'Range', min: 0, max: 100, step: 1 });
vectors.cubicBezier(state, 'easing', {
	id: 'easing',
	label: 'Easing',
	presets: bezierPresets,
});

const colorPane = controls.folder('Color');
colorPane.color(state, 'color', { id: 'color', label: 'Primary' });
colorPane.palette(state, 'accent', {
	id: 'accent',
	label: 'Accent',
	colors: paletteOptions,
});
colorPane.image(state, 'image', { id: 'image', label: 'Image', accept: 'image/png,image/jpeg,image/webp', allowRemotePreview: false });

const actions = controls.folder('Actions');
actions.button({
	id: 'save',
	label: 'Save',
	action: () => {
		saved = cfg.exportSettings();
		log.push('settings saved');
	},
});
actions.buttonGroup({
	id: 'settings',
	label: 'Settings',
	buttons: [
		{
			label: 'Apply',
			action: () => {
				if (saved) {
					cfg.applySettings(saved);
					log.push('settings applied');
				}
			},
		},
		{
			label: 'Reset',
			action: () => {
				cfg.resetSettings();
				log.push('settings reset');
			},
		},
	],
});

const telemetry = cfg.pane({ id: 'telemetry', title: 'Telemetry' });
const fps = telemetry.fpsGraph({ id: 'fps', label: 'FPS', min: 0, max: theme.metrics.fpsMax, target: theme.metrics.fpsTarget, history: theme.metrics.graphHistory });
const frame = telemetry.frameGraph({ id: 'frame', label: 'Frame', min: 0, max: theme.metrics.frameMax, target: theme.metrics.frameBudget, unit: 'ms', history: theme.metrics.graphHistory });
const wave = telemetry.waveformGraph({
	id: 'wave',
	label: 'Wave',
	min: -1,
	max: 1,
	history: theme.metrics.graphHistory,
	series: [
		{ label: 'sin', color: theme.palette.blue },
		{ label: 'cos', color: theme.palette.gold },
	],
});
const profiler = telemetry.profiler({ id: 'profiler', label: 'Profiler' });
const log = telemetry.logMonitor({ id: 'log', label: 'Log', rows: 5, bufferSize: 20 });
telemetry.monitor({ id: 'work', label: 'Work ms', get: () => workloadCost, format: (value) => `${value.toFixed(2)}ms` });
window.__cfgDemo = {
	createCfg,
	state,
	theme: () => cfg.getTheme(),
	setTheme: (next) => {
		state.cfgTheme = next;
		cfg.setTheme(next);
		themeControl.refresh();
	},
	snapshot: () => cfg.exportSettings(),
	applySettings: (snapshot) => cfg.applySettings(snapshot),
	resetSettings: () => cfg.resetSettings(),
	pushLog: (message) => log.push(message),
	logLines: () => log.get(),
	dispose: () => {
		disposed = true;
		cfg.dispose();
	},
	frame: () => frameCount,
	workload: () => workloadCost,
};

function loop(time: number) {
	if (disposed) {
		return;
	}
	cfg.beginFrame(time);
	profiler.measure('state', () => update(time));
	profiler.measure('draw', () => draw(time));
	profiler.measure('workload', () => {
		workloadCost = state.fakeWork ? busy(demoMetrics.workload.base + state.gain * demoMetrics.workload.gain) : 0;
	});
	cfg.endFrame(time);
	cfg.renderFrame(time);
	if (!disposed) {
		requestAnimationFrame(loop);
	}
}

function update(time: number) {
	const dt = Math.min(demoMetrics.frameClamp, time - lastTime || theme.metrics.frameBudget);
	lastTime = time;
	frameCount += 1;
	pulse += (dt / theme.metrics.millisPerSecond) * state.speed;
	if (frameCount % demoMetrics.logEvery === 0) {
		log.push(`${state.mode} ${frameCount}`);
	}
	if (frameCount % demoMetrics.hudEvery === 0) {
		renderHud();
	}
	wave.push([Math.sin(pulse * demoMetrics.tau), Math.cos(pulse * demoMetrics.tau)]);
	fps.push(theme.metrics.millisPerSecond / dt);
	frame.push(dt);
}

function renderHud() {
	const snapshot = {
		enabled: state.enabled,
		mode: state.mode,
		density: state.density,
		range: state.range,
		position: state.position,
	};
	const key = `${state.label}|${state.mode}|${state.speed}|${state.point.x}|${state.point.y}|${JSON.stringify(snapshot)}`;
	if (key === hudKey) {
		return;
	}
	hudKey = key;
	labelNode.textContent = state.label;
	modeNode.textContent = state.mode;
	speedNode.textContent = `${state.speed.toFixed(2)}x`;
	pointNode.textContent = `${state.point.x.toFixed(2)}, ${state.point.y.toFixed(2)}`;
	stateNode.textContent = JSON.stringify(snapshot, null, 2);
}

function draw(time: number) {
	const width = canvas.width;
	const height = canvas.height;
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = theme.palette.ink;
	ctx.fillRect(0, 0, width, height);
	const count = demoMetrics.density[state.density];
	const scale = demoMetrics.scale[state.mode];
	const range = Math.max(1, state.range.max - state.range.min);
	for (let index = 0; index < count; index += 1) {
		const phase = pulse + index * demoMetrics.phaseStep;
		const radius = state.range.min + ((index % range) / range) * state.range.max;
		const x = width * (0.5 + state.point.x * demoMetrics.centerInfluence) + Math.cos(phase) * radius * scale + state.position.x;
		const y = height * (0.5 - state.point.y * demoMetrics.centerInfluence) + Math.sin(phase * demoMetrics.waveYMultiplier) * radius * scale - state.position.y;
		const size = demoMetrics.shape.baseSize + state.gain * demoMetrics.shape.gainSize + (index % demoMetrics.shape.sizeCycle);
		ctx.globalAlpha = state.enabled ? demoMetrics.shape.activeAlpha + state.gain * demoMetrics.shape.gainAlpha : demoMetrics.shape.disabledAlpha;
		ctx.fillStyle = index % demoMetrics.shape.accentEvery === 0 ? state.accent : state.color;
		ctx.beginPath();
		ctx.roundRect(x - size / 2, y - size / 2, size, size, demoMetrics.shape.cornerRadius);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	ctx.strokeStyle = state.accent;
	ctx.lineWidth = demoMetrics.marker.lineWidth;
	const marker = anchor(state.placement, width, height);
	ctx.strokeRect(marker.x - demoMetrics.marker.half, marker.y - demoMetrics.marker.half, demoMetrics.marker.size, demoMetrics.marker.size);
	ctx.fillStyle = theme.palette.text;
	ctx.font = demoMetrics.text.font;
	ctx.fillText(`${Math.round(time)}ms`, demoMetrics.text.inset, height - demoMetrics.text.inset);
}

function anchor(placement: Placement, width: number, height: number) {
	const left = demoMetrics.marker.offset;
	const right = width - demoMetrics.marker.offset;
	const top = demoMetrics.marker.offset;
	const bottom = height - demoMetrics.marker.offset;
	return {
		x: placement.endsWith('w') ? left : right,
		y: placement.startsWith('n') ? top : bottom,
	};
}

function busy(target: number) {
	const start = performance.now();
	let value = 0;
	while (performance.now() - start < target) {
		value += Math.sqrt(value + 1);
	}
	if (value === Number.NEGATIVE_INFINITY) {
		log.push('unreachable');
	}
	return performance.now() - start;
}

function must<T>(value: T | null | undefined, message: string): T {
	if (!value) {
		throw new Error(message);
	}
	return value;
}

requestAnimationFrame(loop);
