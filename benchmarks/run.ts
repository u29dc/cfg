import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4187;
const frames = 180;
const warmup = 30;
const artifactDir = 'artifacts/performance';

const server = Bun.serve({
	port,
	async fetch(request) {
		const url = new URL(request.url);
		if (url.pathname === '/') {
			return html();
		}
		if (url.pathname === '/benchmark.js') {
			return js();
		}
		if (url.pathname.startsWith('/dist/')) {
			const file = await readFile(url.pathname.slice(1));
			const type = url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript';
			return new Response(file, { headers: { 'content-type': type } });
		}
		return new Response('not found', { status: 404 });
	},
});

try {
	await mkdir(artifactDir, { recursive: true });
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	await page.goto(`http://127.0.0.1:${port}/`);
	const result = await page.evaluate(({ frames: totalFrames, warmup: warmupFrames }) => window.__runCfgBenchmark({ frames: totalFrames, warmup: warmupFrames }), { frames, warmup });
	await browser.close();
	const stamp = new Date().toISOString().replaceAll(':', '-');
	const path = `${artifactDir}/benchmark-${stamp}.json`;
	await writeFile(path, `${JSON.stringify(result, null, 2)}\n`);
	process.stdout.write(`${JSON.stringify({ artifact: path, result }, null, 2)}\n`);
} finally {
	server.stop(true);
}

function html() {
	return new Response(
		`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="/dist/styles.css">
  <title>cfg benchmark</title>
</head>
<body>
  <main id="stage"></main>
  <script type="module" src="/benchmark.js"></script>
</body>
</html>`,
		{ headers: { 'content-type': 'text/html' } },
	);
}

function js() {
	return new Response(
		`import { createCfg, theme } from '/dist/index.js';

const stage = document.querySelector('#stage');
const values = {
  enabled: true,
  speed: 1,
  gain: 0.5,
  mode: 'normal',
  color: theme.palette.blue,
  point: { x: 0, y: 0 },
};

window.__runCfgBenchmark = async ({ frames, warmup }) => {
  const scenarios = [
    ['host baseline', () => ({ step: () => {} })],
    ['one pane no telemetry', () => setupBasic(1, false)],
    ['three panes no telemetry', () => setupBasic(3, false)],
    ['fps graph active', () => setupTelemetry({ fps: true })],
    ['profiler active', () => setupTelemetry({ profiler: true })],
    ['many controls', () => setupMany()],
    ['collapsed pane', () => setupCollapsed()],
  ];
  const results = [];
  for (const [name, setup] of scenarios) {
    results.push(await measure(name, setup, frames, warmup));
  }
  return {
    userAgent: navigator.userAgent,
    frames,
    warmup,
    results,
  };
};

async function measure(name, setup, frames, warmup) {
  const context = setup();
  await nextFrame();
  await runFrames(warmup, context.step);
  const samples = await runFrames(frames, context.step);
  context.dispose?.();
  return { name, ...stats(samples) };
}

function setupBasic(count, telemetry) {
  const { root, cfg } = create();
  for (let index = 0; index < count; index += 1) {
    const pane = cfg.pane({ title: \`Pane \${index + 1}\` });
    pane.toggle(values, 'enabled');
    pane.numberSlider(values, 'speed', { min: 0, max: 4, step: 0.01 });
    pane.slider(values, 'gain', { min: 0, max: 1, step: 0.001 });
    pane.segmented(values, 'mode', { options: ['calm', 'normal', 'intense'] });
    pane.color(values, 'color');
    pane.xyPad(values, 'point', { min: -1, max: 1, step: 0.01 });
    if (telemetry) {
      pane.fpsGraph({ min: 0, max: theme.metrics.fpsMax, target: theme.metrics.fpsTarget });
    }
  }
  return frameContext(root, cfg);
}

function setupTelemetry(options) {
  const { root, cfg } = create();
  const pane = cfg.pane({ title: 'Telemetry' });
  const profiler = options.profiler ? pane.profiler({ label: 'Profiler' }) : undefined;
  if (options.fps) pane.fpsGraph({ min: 0, max: theme.metrics.fpsMax, target: theme.metrics.fpsTarget });
  pane.frameGraph({ min: 0, max: theme.metrics.frameMax, target: theme.metrics.frameBudget, unit: 'ms' });
  return frameContext(root, cfg, (time) => {
    profiler?.measure('work', () => Math.sqrt(time));
  });
}

function setupMany() {
  const { root, cfg } = create();
  const pane = cfg.pane({ title: 'Many' });
  for (let index = 0; index < 80; index += 1) {
    pane.number(values, 'speed', { id: \`speed-\${index}\`, min: 0, max: 4, step: 0.01 });
  }
  return frameContext(root, cfg);
}

function setupCollapsed() {
  const { root, cfg } = create();
  const pane = cfg.pane({ title: 'Collapsed', collapsed: true });
  pane.fpsGraph({ min: 0, max: theme.metrics.fpsMax, target: theme.metrics.fpsTarget });
  pane.profiler({ label: 'Profiler' });
  return frameContext(root, cfg);
}

function create() {
  const root = document.createElement('div');
  stage.append(root);
  const cfg = createCfg({ root, scheduler: 'external' });
  return { root, cfg };
}

function frameContext(root, cfg, work = () => {}) {
  return {
    step: (time) => {
      cfg.beginFrame(time);
      work(time);
      cfg.endFrame(time);
      cfg.renderFrame(time);
    },
    dispose: () => {
      cfg.dispose();
      root.remove();
    },
  };
}

function runFrames(count, step) {
  const samples = [];
  return new Promise((resolve) => {
    const tick = (time) => {
      const before = performance.now();
      step(time);
      samples.push(performance.now() - before);
      if (samples.length >= count) {
        resolve(samples);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    averageMs: round(total / samples.length),
    p95Ms: round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
    maxMs: round(sorted.at(-1) ?? 0),
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}`,
		{ headers: { 'content-type': 'text/javascript' } },
	);
}

declare global {
	interface Window {
		__runCfgBenchmark(options: { frames: number; warmup: number }): Promise<unknown>;
	}
}
