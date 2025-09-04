export type ValidPeriod = '1d' | '7d' | '30d';

export class Period {
  private readonly value: ValidPeriod;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(
        `Geçersiz periyot: ${value}. Sadece '1d', '7d', '30d' kabul edilir.`,
      );
    }
    this.value = value as ValidPeriod;
  }

  private isValid(value: string): value is ValidPeriod {
    return ['1d', '7d', '30d'].includes(value);
  }

  getValue(): ValidPeriod {
    return this.value;
  }

  equals(other: Period): boolean {
    return this.value === other.value;
  }
}
