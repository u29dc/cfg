import { type Cfg, createCfg, type Pane, type SettingsSnapshot, theme } from 'cfg';
import 'cfg/styles.css';
import { bezierPresets, defaultBezier, densityOptions, modeOptions, paletteOptions, placementOptions } from './options';

type Mode = (typeof modeOptions)[number];
type Density = (typeof densityOptions)[number];
type Placement = (typeof placementOptions)[number];

type ExampleState = Record<string, unknown> & {
	enabled: boolean;
	speed: number;
	gain: number;
	label: string;
	notes: string;
	mode: Mode;
	density: Density;
	placement: Placement;
	color: string;
	token: string;
	point: { x: number; y: number };
	position: { x: number; y: number; z: number };
	quaternion: { x: number; y: number; z: number; w: number };
	range: { min: number; max: number };
	easing: [number, number, number, number];
	image: string;
};

export function mountPublicExample(root: HTMLElement): () => void {
	let time = 0;
	let saved: SettingsSnapshot | undefined;
	const state: ExampleState = {
		enabled: true,
		speed: 1,
		gain: 0.5,
		label: 'Runtime',
		notes: 'External RAF loop',
		mode: 'normal',
		density: 'medium',
		placement: 'ne',
		color: theme.palette.blue,
		token: theme.palette.gold,
		point: { x: 0, y: 0 },
		position: { x: 0, y: 1, z: 2 },
		quaternion: { x: 0, y: 0, z: 0, w: 1 },
		range: { min: 10, max: 60 },
		easing: [...defaultBezier],
		image: '',
	};
	const cfg: Cfg = createCfg({
		root,
		scheduler: 'external',
		clock: () => time,
	});
	const controls: Pane = cfg.pane({ id: 'controls', title: 'Controls' });
	const basics = controls.folder('Basics');
	const enabled = basics.toggle(state, 'enabled');
	basics.numberSlider(state, 'speed', { min: 0, max: 4, step: 0.01 });
	basics.slider(state, 'gain', { min: 0, max: 1, step: 0.001 });
	basics.text(state, 'label');
	basics.multiline(state, 'notes', { rows: 3 });
	basics.segmented(state, 'mode', { options: modeOptions });
	basics.select(state, 'density', { options: densityOptions });
	basics.radioGrid(state, 'placement', { columns: 2, options: placementOptions });
	basics.radioGroup(state, 'mode', { options: modeOptions });

	const tabs = controls.tab({ id: 'views', label: 'Views', tabs: ['Main', 'Debug'], initial: 'Main' });
	tabs.monitor({ id: 'view-mode', label: 'Mode', get: () => state.mode });

	const spatial = controls.folder('Spatial');
	spatial.point(state, 'point', { min: -1, max: 1, step: 0.01 });
	spatial.xyPad(state, 'point', { min: -1, max: 1, step: 0.01 });
	spatial.vector2(state, 'point', { min: -10, max: 10, step: 0.1 });
	spatial.vector3(state, 'position', { min: -100, max: 100, step: 0.01 });
	spatial.vector4(state, 'quaternion', { min: -1, max: 1, step: 0.001 });
	spatial.interval(state, 'range', { min: 0, max: 100, step: 1 });
	spatial.cubicBezier(state, 'easing', { presets: bezierPresets });

	const media = controls.folder('Media');
	media.color(state, 'color');
	media.palette(state, 'token', {
		colors: paletteOptions,
	});
	media.image(state, 'image', { accept: 'image/png,image/jpeg,image/webp' });

	const telemetry = cfg.pane({ id: 'telemetry', title: 'Telemetry', collapsed: false });
	const fps = telemetry.fpsGraph({ label: 'FPS', min: 0, max: theme.metrics.fpsMax, target: theme.metrics.fpsTarget, history: theme.metrics.graphHistory });
	const frame = telemetry.frameGraph({ label: 'Frame', min: 0, max: theme.metrics.frameMax, target: theme.metrics.frameBudget, unit: 'ms', history: theme.metrics.graphHistory });
	const waveform = telemetry.waveformGraph({
		label: 'Waveform',
		min: -1,
		max: 1,
		history: theme.metrics.graphHistory,
		series: [{ label: 'sin' }, { label: 'cos', color: theme.palette.gold }],
	});
	const profiler = telemetry.profiler({ label: 'Profiler' });
	const log = telemetry.logMonitor({ label: 'Events', rows: 4 });
	telemetry.monitor({ label: 'Speed', get: () => state.speed, format: (value) => `${value.toFixed(2)}x` });

	const actions = controls.folder('Actions');
	actions.button({
		label: 'Save',
		action: () => {
			saved = cfg.exportSettings();
		},
	});
	actions.buttonGroup({
		label: 'Settings',
		buttons: [
			{
				label: 'Apply',
				action: () => {
					if (saved) {
						cfg.applySettings(saved);
					}
				},
			},
			{ label: 'Reset', action: () => cfg.resetSettings() },
		],
	});

	enabled.on('change', (value) => log.push(`enabled ${value}`));

	return () => {
		time += theme.metrics.frameBudget;
		cfg.beginFrame(time);
		profiler.measure('work', () => {
			waveform.push([Math.sin(time / 300), Math.cos(time / 300)]);
			fps.push(60);
			frame.push(theme.metrics.frameBudget);
		});
		cfg.endFrame(time);
		cfg.renderFrame(time);
		cfg.dispose();
	};
}
