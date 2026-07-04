import { type CanvasTheme, type ThemeMode, theme } from '@u29dc/cfg-core';

export function canvasTheme(element: Element): CanvasTheme {
	return prefersDark(element) ? theme.canvas.dark : theme.canvas.light;
}

function prefersDark(element: Element) {
	const mode = element.closest<HTMLElement>('.cfg-root')?.dataset['cfgTheme'] as ThemeMode | undefined;
	if (mode === 'dark') {
		return true;
	}
	if (mode === 'light') {
		return false;
	}
	const view = element.ownerDocument.defaultView;
	return view?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
}
