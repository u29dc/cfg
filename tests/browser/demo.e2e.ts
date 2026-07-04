import { expect, test } from '@playwright/test';

test('demo renders panes, canvas, and external RAF telemetry', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.cfg-root')).toBeVisible();
	await expect(page.locator('[data-cfg-id="runtime"]')).toBeVisible();
	await expect(page.locator('[data-cfg-id="telemetry"]')).toBeVisible();
	await expect(page.locator('.demo-canvas')).toBeVisible();
	await expect(page.locator('[data-cfg-id="fps"] .cfg-graph-readout')).toContainText('FPS');

	const first = await page.evaluate(() => {
		const demo = (window as DemoWindow).__cfgDemo;
		if (!demo) {
			throw new Error('cfg demo probe missing');
		}
		return demo.frame();
	});
	await page.waitForTimeout(250);
	const second = await page.evaluate(() => {
		const demo = (window as DemoWindow).__cfgDemo;
		if (!demo) {
			throw new Error('cfg demo probe missing');
		}
		return demo.frame();
	});
	expect(second).toBeGreaterThan(first);

	const pixel = await page.locator('.demo-canvas').evaluate((node: HTMLCanvasElement) => {
		const context = node.getContext('2d');
		const data = context?.getImageData(Math.floor(node.width / 2), Math.floor(node.height / 2), 1, 1).data;
		return data ? [...data] : [];
	});
	expect(pixel.length).toBe(4);
	expect(pixel[3]).toBe(255);
});

test('representative controls mutate bound and visible state', async ({ page }) => {
	await page.goto('/');

	await page.locator('[data-cfg-id="speed"] .cfg-input--number').fill('2.5');
	await page.locator('[data-cfg-id="speed"] .cfg-input--number').blur();
	await expect(page.locator('[data-demo-speed]')).toContainText('2.50x');

	await page.locator('[data-cfg-id="mode"] button', { hasText: 'intense' }).click();
	await expect(page.locator('[data-demo-mode]')).toHaveText('intense');

	await page.locator('[data-cfg-id="density"] select').selectOption('string:high');
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.density;
			}),
		)
		.toBe('high');

	const pad = page.locator('[data-cfg-id="pad"] canvas');
	const padBox = await pad.boundingBox();
	if (!padBox) {
		throw new Error('pad bounds missing');
	}
	await pad.click({ position: { x: padBox.width * 0.75, y: padBox.height * 0.25 } });
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.point.x;
			}),
		)
		.toBeGreaterThan(0);

	await page.locator('[data-cfg-id="rotation"] input').nth(3).fill('0.5');
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.rotation.w;
			}),
		)
		.toBe(0.5);

	await page.locator('[data-cfg-id="fake-work"] input[type="checkbox"]').check();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.workload();
			}),
		)
		.toBeGreaterThan(0);
});

test('theme propagation and custom controls render without native chrome', async ({ page }) => {
	await page.goto('/');

	await page.evaluate(() => (window as DemoWindow).__cfgDemo?.setTheme('dark'));
	await expect(page.locator('.cfg-root')).toHaveAttribute('data-cfg-theme', 'dark');
	await page.evaluate(() => (window as DemoWindow).__cfgDemo?.setTheme('light'));
	await expect(page.locator('.cfg-root')).toHaveAttribute('data-cfg-theme', 'light');

	await expect(page.locator('[data-cfg-id="image"] input[type="file"]')).toBeHidden();
	await expect(page.locator('[data-cfg-id="image"] .cfg-file-row .cfg-button')).toBeVisible();
	await page.locator('[data-cfg-id="color"] .cfg-color-toggle').scrollIntoViewIfNeeded();
	await page.locator('[data-cfg-id="color"] .cfg-color-toggle').click();
	await expect(page.locator('[data-cfg-id="color"] .cfg-color-panel')).toBeVisible();
	await expect(page.locator('[data-cfg-id="easing"] canvas.cfg-bezier')).toBeVisible();
	await expect(page.locator('[data-cfg-id="views"] .cfg-tabs__nav button').first()).toHaveAttribute('aria-pressed', 'true');
	await page.locator('[data-cfg-id="views"] .cfg-tabs__nav button', { hasText: 'Debug' }).click();
	await expect(page.locator('[data-cfg-id="views"] .cfg-tabs__nav button', { hasText: 'Debug' })).toHaveAttribute('aria-pressed', 'true');
	expect(await page.locator('.cfg-input[type="number"]').count()).toBe(0);
	for (const id of ['pad', 'easing']) {
		const width = await page.locator(`[data-cfg-id="${id}"]`).evaluate((node, label) => {
			const canvas = node.querySelector('canvas');
			const field = node.querySelector('.cfg-control__field');
			if (!canvas || !field) {
				throw new Error(`${label} canvas probe missing`);
			}
			return {
				canvas: Math.round(canvas.getBoundingClientRect().width),
				canvasHeight: Math.round(canvas.getBoundingClientRect().height),
				field: Math.round(field.getBoundingClientRect().width),
				backingWidth: canvas.width,
				backingHeight: canvas.height,
			};
		}, id);
		expect(width.canvas).toBe(width.field);
		expect(width.backingWidth).toBe(width.canvas);
		expect(width.backingHeight).toBe(width.canvasHeight);
	}

	const selected = await page.locator('[data-cfg-id="mode"] button[aria-pressed="true"]').evaluate((node) => getComputedStyle(node).backgroundColor);
	const unselected = await page.locator('[data-cfg-id="mode"] button', { hasText: 'calm' }).evaluate((node) => getComputedStyle(node).backgroundColor);
	expect(selected).not.toBe(unselected);
});

test('palette, settings actions, bounded logs, and disposal work', async ({ page }) => {
	await page.goto('/');

	await page.locator('[data-cfg-id="accent"] .cfg-swatch').nth(2).click();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.accent;
			}),
		)
		.toBe('#ff6b8b');

	const speed = page.locator('[data-cfg-id="speed"] .cfg-input--number');
	await speed.fill('2.5');
	await speed.blur();
	await page.locator('[data-cfg-id="save"] .cfg-button').click();
	await speed.fill('3.5');
	await speed.blur();
	await page.locator('[data-cfg-id="settings"] .cfg-button', { hasText: 'Apply' }).click();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.speed;
			}),
		)
		.toBe(2.5);
	await page.locator('[data-cfg-id="settings"] .cfg-button', { hasText: 'Reset' }).click();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.speed;
			}),
		)
		.toBe(1);

	const lines = await page.evaluate(() => {
		const demo = (window as DemoWindow).__cfgDemo;
		if (!demo) {
			throw new Error('cfg demo probe missing');
		}
		for (let index = 0; index < 25; index += 1) {
			demo.pushLog(`line ${index}`);
		}
		return demo.logLines();
	});
	expect(lines).toHaveLength(20);
	expect(lines[0]).toBe('line 5');
	expect(lines.at(-1)).toBe('line 24');

	await page.evaluate(() => (window as DemoWindow).__cfgDemo?.dispose());
	await expect(page.locator('.cfg-root')).toBeHidden();
});

test('pane collapse removes body from layout and expands back', async ({ page }) => {
	await page.goto('/');
	const body = page.locator('[data-cfg-id="runtime"] > .cfg-pane__body');
	const header = page.locator('[data-cfg-id="runtime"] > .cfg-pane__header');

	await expect(body).toBeVisible();
	await header.click();
	await expect(body).toBeHidden();
	await expect.poll(() => body.evaluate((node) => node.getBoundingClientRect().height)).toBe(0);
	await header.click();
	await expect(body).toBeVisible();
	await expect.poll(() => body.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);

	await header.click();
	await page.waitForTimeout(40);
	await header.click();
	await expect(body).toBeVisible();

	const folder = page
		.locator('.cfg-folder')
		.filter({ has: page.locator('.cfg-folder__title', { hasText: 'Vectors' }) })
		.first();
	const folderBody = folder.locator(':scope > .cfg-folder__body');
	const folderHeader = folder.locator(':scope > .cfg-folder__header');
	await folderHeader.click();
	await expect(folderBody).toBeHidden();
	await expect.poll(() => folderBody.evaluate((node) => node.getBoundingClientRect().height)).toBe(0);
	await folderHeader.click();
	await expect(folderBody).toBeVisible();
});

test('image control clears preview and native file state', async ({ page }) => {
	await page.goto('/');
	const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64');
	const file = page.locator('[data-cfg-id="image"] input[type="file"]');
	await file.setInputFiles({ name: 'cfg-test.png', mimeType: 'image/png', buffer: png });
	await expect(page.locator('[data-cfg-id="image"] .cfg-file-name')).toHaveText('cfg-test.png');
	await expect(page.locator('[data-cfg-id="image"] .cfg-image-preview')).toBeVisible();
	await page.locator('[data-cfg-id="image"] .cfg-button', { hasText: 'Clear' }).click();
	await expect(page.locator('[data-cfg-id="image"] .cfg-file-name')).toHaveText('No file selected');
	await expect(page.locator('[data-cfg-id="image"] .cfg-image-preview')).toBeHidden();
	await expect(file).toHaveJSProperty('value', '');
});

test('compact typography is preserved at mobile widths', async ({ page }) => {
	await page.setViewportSize({ width: 430, height: 932 });
	await page.goto('/');
	await page.evaluate(() => (window as DemoWindow).__cfgDemo?.setTheme?.('dark'));
	const sizes = await page.evaluate(() => {
		const root = document.querySelector('.cfg-root');
		const input = document.querySelector('.cfg-input');
		const button = document.querySelector('.cfg-choice');
		if (!root || !input || !button) {
			throw new Error('compact typography probes missing');
		}
		return {
			root: getComputedStyle(root).fontSize,
			input: getComputedStyle(input).fontSize,
			button: getComputedStyle(button).fontSize,
		};
	});
	expect(sizes).toEqual({ root: '11px', input: '12px', button: '12px' });
	await expect(page.locator('.cfg-root')).toHaveCSS('overflow-y', 'auto');
	await expect(page.locator('[data-cfg-id="runtime"]')).toHaveCSS('scrollbar-width', 'none');
});

test('color text drafts do not commit invalid intermediate values', async ({ page }) => {
	await page.goto('/');
	const input = page.locator('[data-cfg-id="color"] input.cfg-input--color');
	await expect(input).toHaveValue('#78a6ff');
	await input.fill('#78a6f');
	await expect(input).toHaveValue('#78a6f');
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.color;
			}),
		)
		.toBe('#78a6ff');
	await input.blur();
	await expect(input).toHaveValue('#78a6ff');
});

test('number inputs support elastic pointer drag adjustment', async ({ page }) => {
	await page.goto('/');
	const input = page.locator('[data-cfg-id="speed"] .cfg-input--number');
	const box = await input.boundingBox();
	if (!box) {
		throw new Error('speed input bounds missing');
	}
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 5 });
	await expect(page.locator('[data-cfg-id="speed"] .cfg-number-guide')).toBeVisible();
	await page.mouse.up();
	await expect(page.locator('[data-cfg-id="speed"] .cfg-number-guide')).toBeHidden();
	await expect
		.poll(() =>
			page.evaluate(() => {
				const demo = (window as DemoWindow).__cfgDemo;
				if (!demo) {
					throw new Error('cfg demo probe missing');
				}
				return demo.state.speed;
			}),
		)
		.toBeGreaterThan(1);
});

type DemoWindow = Window & {
	__cfgDemo?: {
		state: {
			accent?: unknown;
			color?: unknown;
			density?: unknown;
			point: { x: number; y: number };
			rotation: { x: number; y: number; z: number; w: number };
			speed?: unknown;
		};
		applySettings: (snapshot: unknown) => void;
		dispose: () => void;
		setTheme?: (theme: 'system' | 'light' | 'dark') => void;
		logLines: () => readonly string[];
		pushLog: (message: string) => void;
		resetSettings: () => void;
		snapshot: () => unknown;
		frame: () => number;
		workload: () => number;
	};
};
