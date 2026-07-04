export function documentOf(root?: HTMLElement) {
	if (root) {
		return root.ownerDocument;
	}
	if (typeof document === 'undefined') {
		throw new Error('createCfg() requires a browser document or a root element');
	}
	return document;
}

export function el<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className?: string) {
	const node = doc.createElement(tag);
	if (className) {
		node.className = className;
	}
	return node;
}

export function listen<K extends keyof HTMLElementEventMap>(target: HTMLElement, type: K, handler: (event: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) {
	target.addEventListener(type, handler as EventListener, options);
	return () => target.removeEventListener(type, handler as EventListener, options);
}

export function label(id: string) {
	const clean = id.replace(/[-_]+/g, ' ').replace(/\d+$/u, '').trim();
	return clean ? clean.replace(/^\w/u, (char) => char.toUpperCase()) : 'Value';
}

export function output(doc: Document, className: string) {
	const node = doc.createElement('output');
	node.className = className;
	return node;
}

export function axis(doc: Document, labelText: string, input: HTMLInputElement) {
	const wrapper = el(doc, 'label', 'cfg-axis');
	const span = el(doc, 'span');
	span.textContent = labelText;
	wrapper.append(span, input);
	return wrapper;
}
