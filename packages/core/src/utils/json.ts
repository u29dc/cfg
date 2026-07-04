export function clone<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => clone(item)) as T;
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, clone(item)])) as T;
	}
	return value;
}

export function parse(value: string) {
	try {
		return JSON.parse(value) as unknown;
	} catch {
		return null;
	}
}
