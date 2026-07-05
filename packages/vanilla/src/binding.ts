import type { AxisOptions, BezierTuple, BezierValue, Choice, ChoiceValue, IntervalValue, NumberOptions, VectorOptions } from '@u29dc/cfg-core';
import { clamp, defaultBezier, number } from '@u29dc/cfg-core';

export class Binding<T> {
	readonly #target: Record<PropertyKey, unknown>;
	readonly #key: PropertyKey;
	readonly #sanitize: (value: unknown) => T;

	constructor(target: Record<PropertyKey, unknown>, key: PropertyKey, sanitize: (value: unknown) => T) {
		this.#target = target;
		this.#key = key;
		this.#sanitize = sanitize;
	}

	get() {
		return this.#sanitize(this.#target[this.#key]);
	}

	set(value: unknown) {
		const next = this.#sanitize(value);
		this.#target[this.#key] = next;
		return next;
	}
}

export function bool(value: unknown) {
	return value === true;
}

export function string(value: unknown) {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return String(value);
	}
	return '';
}

export function choice<T extends ChoiceValue>(value: unknown, choices: readonly Choice<T>[], allowUnknown = false) {
	const key = string(value);
	for (const option of choices) {
		if (option.value === value || String(option.value) === key) {
			return option.value;
		}
	}
	if (allowUnknown) {
		return value as T;
	}
	const fallback = choices[0]?.value;
	if (fallback === undefined) {
		throw new Error('choice control requires at least one option');
	}
	throw new Error(`choice control rejected unknown value "${key}"; expected one of ${choices.map((item) => `"${String(item.value)}"`).join(', ')}`);
}

export function options<T extends ChoiceValue>(values: readonly T[] | readonly Choice<T>[]): Choice<T>[] {
	return values.map((item) => {
		if (typeof item === 'object' && item !== null && 'value' in item) {
			return item;
		}
		return { id: String(item), label: String(item), value: item };
	});
}

export function encoded(value: ChoiceValue) {
	return `${typeof value}:${String(value)}`;
}

export function interval(value: unknown, opts: NumberOptions): IntervalValue {
	const source = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
	const min = number(source['min'], opts);
	const max = number(source['max'], opts);
	return min <= max ? { min, max } : { min: max, max: min };
}

export function vector(value: unknown, axes: readonly string[], opts: VectorOptions) {
	const source = Array.isArray(value) ? Object.fromEntries(axes.map((axis, index) => [axis, value[index]])) : typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
	return Object.fromEntries(axes.map((axis, index) => [axis, axisValue(source[axis], opts.axes?.[index], opts)]));
}

export function bezier(value: unknown): BezierTuple {
	const source = Array.isArray(value)
		? value
		: typeof value === 'object' && value !== null
			? [(value as BezierValue).x1, (value as BezierValue).y1, (value as BezierValue).x2, (value as BezierValue).y2]
			: defaultBezier;
	return [clamp(Number(source[0]), 0, 1), clamp(Number(source[1]), -2, 2), clamp(Number(source[2]), 0, 1), clamp(Number(source[3]), -2, 2)];
}

function axisValue(value: unknown, axis: AxisOptions | undefined, opts: VectorOptions) {
	const result: NumberOptions = {};
	const min = axis?.min ?? opts.min;
	const max = axis?.max ?? opts.max;
	const step = axis?.step ?? opts.step;
	if (min !== undefined) {
		result.min = min;
	}
	if (max !== undefined) {
		result.max = max;
	}
	if (step !== undefined) {
		result.step = step;
	}
	return number(value, result);
}
