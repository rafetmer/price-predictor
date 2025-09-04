export class Price {
  private readonly value: number;
  // Gelecekte para birimi de eklenebilir.
  // private readonly currency: string;

  constructor(value: number) {
    if (!this.isValid(value)) {
      throw new Error(
        'Geçersiz fiyat değeri. Fiyat 0 veya daha büyük olmalıdır.',
      );
    }
    this.value = value;
  }

  private isValid(value: number): boolean {
    return value >= 0;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Price): boolean {
    return this.value === other.value;
  }
}
