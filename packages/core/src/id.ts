export class Ids {
	readonly #used = new Set<string>();
	#next = 0;

	create(prefix: string, requested?: string) {
		if (requested && /^[a-zA-Z0-9_.:-]+$/.test(requested)) {
			if (this.#used.has(requested)) {
				throw new Error(`duplicate cfg id: ${requested}`);
			}
			this.#used.add(requested);
			return requested;
		}
		let next = '';
		do {
			this.#next += 1;
			next = `${prefix}-${this.#next}`;
		} while (this.#used.has(next));
		this.#used.add(next);
		return next;
	}
}
