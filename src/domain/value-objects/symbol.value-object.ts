export class Symbol {
	private readonly value: string;

	constructor(value: string) {
		if (!this.isValid(value)) {
			throw new Error('Geçersiz sembol formatı');
		}
		this.value = value.toUpperCase();
	}

	private isValid(value: string): boolean {
		return /^[A-Za-z0-9]{1,30}$/.test(value); // Sadece harf ve rakamlardan oluşan, 1-30 karakter uzunluğunda bir dizeyi kabul eder.
	}

	getValue(): string {
		return this.value;
	}

	equals(other: Symbol): boolean {
		return this.value === other.value;
	}
}
