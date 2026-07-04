import { createCfg, type SettingsSnapshot } from 'cfg';
import 'cfg/styles.css';
import './demo.css';

type Mode = 'calm' | 'normal' | 'intense';
type Density = 'low' | 'medium' | 'high';
type Placement = 'nw' | 'ne' | 'sw' | 'se';

interface DemoState extends Record<string, unknown> {
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
			state: DemoState;
			frame: () => number;
			workload: () => number;
		};
	}
}

const root = document.querySelector<HTMLElement>('#demo-root');
if (!root) {
	throw new Error('demo root not found');
}

root.innerHTML = `
	<section class="demo-stage">
		<canvas class="demo-canvas" width="1280" height="720" aria-label="cfg animated runtime demo"></canvas>
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
	enabled: true,
	fakeWork: false,
	speed: 1,
	gain: 0.6,
	label: 'cfg runtime',
	notes: 'External RAF',
	mode: 'normal',
	density: 'medium',
	placement: 'ne',
	color: '#78a6ff',
	accent: '#ffcc66',
	point: { x: 0.1, y: 0.2 },
	position: { x: 0, y: 24, z: 64 },
	rotation: { x: 0, y: 0, z: 0, w: 1 },
	range: { min: 20, max: 80 },
	easing: [0.25, 0.1, 0.25, 1],
	image: '',
};

let saved: SettingsSnapshot | undefined;
let frameCount = 0;
let pulse = 0;
let lastTime = 0;
let workloadCost = 0;
const cfg = createCfg({ scheduler: 'external' });

const controls = cfg.pane({ id: 'runtime', title: 'Runtime' });
const basics = controls.folder('Basics');
basics.toggle(state, 'enabled', { id: 'enabled', label: 'Enabled' });
basics.toggle(state, 'fakeWork', { id: 'fake-work', label: 'Workload' });
basics.numberSlider(state, 'speed', { id: 'speed', label: 'Speed', min: 0, max: 4, step: 0.01 });
basics.slider(state, 'gain', { id: 'gain', label: 'Gain', min: 0, max: 1, step: 0.001 });
basics.text(state, 'label', { id: 'label', label: 'Label' });
basics.multiline(state, 'notes', { id: 'notes', label: 'Notes', rows: 3 });

const choices = controls.folder('Choices');
choices.segmented(state, 'mode', { id: 'mode', label: 'Mode', options: ['calm', 'normal', 'intense'] as const });
choices.select(state, 'density', { id: 'density', label: 'Density', options: ['low', 'medium', 'high'] as const });
choices.radioGrid(state, 'placement', { id: 'placement', label: 'Place', columns: 2, options: ['nw', 'ne', 'sw', 'se'] as const });

const vectors = controls.folder('Vectors');
vectors.point(state, 'point', { id: 'point', label: 'Point', min: -1, max: 1, step: 0.01 });
vectors.xyPad(state, 'point', { id: 'pad', label: 'Pad', min: -1, max: 1, step: 0.01 });
vectors.vector3(state, 'position', { id: 'position', label: 'Position', min: -100, max: 100, step: 0.1 });
vectors.vector4(state, 'rotation', { id: 'rotation', label: 'Rotation', min: -1, max: 1, step: 0.001 });
vectors.interval(state, 'range', { id: 'range', label: 'Range', min: 0, max: 100, step: 1 });
vectors.cubicBezier(state, 'easing', {
	id: 'easing',
	label: 'Easing',
	presets: [
		{ label: 'Standard', value: [0.25, 0.1, 0.25, 1] },
		{ label: 'Out', value: [0, 0, 0.2, 1] },
	],
});

const colorPane = controls.folder('Color');
colorPane.color(state, 'color', { id: 'color', label: 'Primary' });
colorPane.palette(state, 'accent', {
	id: 'accent',
	label: 'Accent',
	colors: [
		{ label: 'Blue', value: '#78a6ff' },
		{ label: 'Gold', value: '#ffcc66' },
		{ label: 'Rose', value: '#ff6b8b' },
		{ label: 'Green', value: '#7ee787' },
	],
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
const fps = telemetry.fpsGraph({ id: 'fps', label: 'FPS', min: 0, max: 144, target: 60, history: 180 });
const frame = telemetry.frameGraph({ id: 'frame', label: 'Frame', min: 0, max: 40, target: 16.67, unit: 'ms', history: 180 });
const wave = telemetry.waveformGraph({
	id: 'wave',
	label: 'Wave',
	min: -1,
	max: 1,
	history: 180,
	series: [
		{ label: 'sin', color: '#78a6ff' },
		{ label: 'cos', color: '#ffcc66' },
	],
});
const profiler = telemetry.profiler({ id: 'profiler', label: 'Profiler' });
const log = telemetry.logMonitor({ id: 'log', label: 'Log', rows: 5, bufferSize: 20 });
telemetry.monitor({ id: 'work', label: 'Work ms', get: () => workloadCost, format: (value) => `${value.toFixed(2)}ms` });
window.__cfgDemo = {
	state,
	frame: () => frameCount,
	workload: () => workloadCost,
};

function loop(time: number) {
	cfg.beginFrame(time);
	profiler.measure('state', () => update(time));
	profiler.measure('draw', () => draw(time));
	profiler.measure('workload', () => {
		workloadCost = state.fakeWork ? busy(2.5 + state.gain * 4) : 0;
	});
	cfg.endFrame(time);
	cfg.renderFrame(time);
	requestAnimationFrame(loop);
}

function update(time: number) {
	const dt = Math.min(64, time - lastTime || 16.67);
	lastTime = time;
	frameCount += 1;
	pulse += (dt / 1000) * state.speed;
	if (frameCount % 90 === 0) {
		log.push(`${state.mode} ${frameCount}`);
	}
	labelNode.textContent = state.label;
	modeNode.textContent = state.mode;
	speedNode.textContent = `${state.speed.toFixed(2)}x`;
	pointNode.textContent = `${state.point.x.toFixed(2)}, ${state.point.y.toFixed(2)}`;
	stateNode.textContent = JSON.stringify(
		{
			enabled: state.enabled,
			mode: state.mode,
			density: state.density,
			range: state.range,
			position: state.position,
		},
		null,
		2,
	);
	wave.push([Math.sin(pulse * Math.PI * 2), Math.cos(pulse * Math.PI * 2)]);
	fps.push(1_000 / dt);
	frame.push(dt);
}

function draw(time: number) {
	const width = canvas.width;
	const height = canvas.height;
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = '#101316';
	ctx.fillRect(0, 0, width, height);
	const count = state.density === 'low' ? 18 : state.density === 'medium' ? 36 : 72;
	const scale = state.mode === 'calm' ? 0.7 : state.mode === 'normal' ? 1 : 1.35;
	const range = Math.max(1, state.range.max - state.range.min);
	for (let index = 0; index < count; index += 1) {
		const phase = pulse + index * 0.07;
		const radius = state.range.min + ((index % range) / range) * state.range.max;
		const x = width * (0.5 + state.point.x * 0.24) + Math.cos(phase) * radius * scale + state.position.x;
		const y = height * (0.5 - state.point.y * 0.24) + Math.sin(phase * 1.17) * radius * scale - state.position.y;
		const size = 8 + state.gain * 18 + (index % 5);
		ctx.globalAlpha = state.enabled ? 0.32 + state.gain * 0.48 : 0.12;
		ctx.fillStyle = index % 3 === 0 ? state.accent : state.color;
		ctx.beginPath();
		ctx.roundRect(x - size / 2, y - size / 2, size, size, 4);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	ctx.strokeStyle = state.accent;
	ctx.lineWidth = 2;
	const marker = anchor(state.placement, width, height);
	ctx.strokeRect(marker.x - 18, marker.y - 18, 36, 36);
	ctx.fillStyle = '#e6e8eb';
	ctx.font = '16px ui-monospace, monospace';
	ctx.fillText(`${Math.round(time)}ms`, 24, height - 24);
}

function anchor(placement: Placement, width: number, height: number) {
	const left = 64;
	const right = width - 64;
	const top = 64;
	const bottom = height - 64;
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
