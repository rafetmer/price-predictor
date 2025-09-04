export class InvalidSymbolException extends Error {
  constructor(symbol: string) {
    super(`Geçersiz sembol: ${symbol}`);
    this.name = 'InvalidSymbolException';
  }
}
