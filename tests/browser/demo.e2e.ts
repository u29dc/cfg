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

type DemoWindow = Window & {
	__cfgDemo?: {
		state: {
			density?: unknown;
			point: { x: number; y: number };
		};
		frame: () => number;
		workload: () => number;
	};
};
