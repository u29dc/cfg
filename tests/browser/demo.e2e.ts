import { expect, test } from '@playwright/test';

test('demo renders panes, canvas, and external RAF telemetry', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.cfg-root')).toBeVisible();
	await expect(page.locator('[data-cfg-id="runtime"]')).toBeVisible();
	await expect(page.locator('[data-cfg-id="telemetry"]')).toBeVisible();
	await expect(page.locator('.demo-canvas')).toBeVisible();

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

	await page.locator('[data-cfg-id="speed"] input[type="number"]').fill('2.5');
	await page.locator('[data-cfg-id="speed"] input[type="number"]').blur();
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

	await page.locator('[data-cfg-id="pad"] canvas').click({ position: { x: 72, y: 24 } });
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

	const selected = await page.locator('[data-cfg-id="mode"] button[aria-pressed="true"]').evaluate((node) => getComputedStyle(node).backgroundColor);
	const unselected = await page.locator('[data-cfg-id="mode"] button', { hasText: 'calm' }).evaluate((node) => getComputedStyle(node).backgroundColor);
	expect(selected).not.toBe(unselected);
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
	expect(sizes).toEqual({ root: '11px', input: '11px', button: '11px' });
	await expect(page.locator('.cfg-root')).toHaveCSS('overflow-y', 'auto');
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

type DemoWindow = Window & {
	__cfgDemo?: {
		state: {
			color?: unknown;
			density?: unknown;
			point: { x: number; y: number };
		};
		setTheme?: (theme: 'system' | 'light' | 'dark') => void;
		frame: () => number;
		workload: () => number;
	};
};
