export class Ids {
	#next = 0;

	create(prefix: string, requested?: string) {
		if (requested && /^[a-zA-Z0-9_.:-]+$/.test(requested)) {
			return requested;
		}
		this.#next += 1;
		return `${prefix}-${this.#next}`;
	}
}
