export type ValidTrend = 'UP' | 'DOWN' | 'STABLE'; // ubiquitous language icin uygun

export class Trend {
  private readonly value: ValidTrend;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(
        `Geçersiz trend: ${value}. Sadece 'UP', 'DOWN', 'STABLE' kabul edilir.`,
      );
    }
    this.value = value as ValidTrend;
  }

  private isValid(value: string): value is ValidTrend {
    return ['UP', 'DOWN', 'STABLE'].includes(value);
  }

  getValue(): ValidTrend {
    return this.value;
  }

  equals(other: Trend): boolean {
    return this.value === other.value;
  }
}
