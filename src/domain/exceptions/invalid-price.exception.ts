export class InvalidPriceException extends Error {
	constructor(price: number) {
		super(`Geçersiz fiyat: ${price}`);
		this.name = 'InvalidPriceException';
	}
}
