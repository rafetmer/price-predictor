import { Symbol } from '../value-objects/symbol.value-object';
import { Period } from '../value-objects/period.value-object';
import { Trend } from '../value-objects/trend.value-object';

export class PriceStats {
  private id: number | null;
  private symbol: Symbol;
  private period: Period;
  private avg: number;
  private volatility: number;
  private trend: Trend;
  private calculatedAt: Date;

  constructor(
    symbol: Symbol,
    period: Period,
    avg: number,
    volatility: number,
    trend: Trend,
    calculatedAt: Date = new Date(),
    id: number | null = null,
  ) {
    this.symbol = symbol;
    this.period = period;
    this.setAvg(avg);
    this.setVolatility(volatility);
    this.trend = trend;
    this.calculatedAt = calculatedAt;
    this.id = id;
  }

  // Getters
  getId(): number | null {
    return this.id;
  }
  getSymbol(): Symbol {
    return this.symbol;
  }
  getPeriod(): Period {
    return this.period;
  }
  getAvg(): number {
    return this.avg;
  }
  getVolatility(): number {
    return this.volatility;
  }
  getTrend(): Trend {
    return this.trend;
  }
  getCalculatedAt(): Date {
    return this.calculatedAt;
  }

  private setAvg(avg: number): void {
    if (avg < 0) {
      throw new Error('Ortalama negatif olamaz');
    }
    this.avg = avg;
  }

  private setVolatility(volatility: number): void {
    if (volatility < 0) {
      throw new Error('Volatilite negatif olamaz');
    }
    this.volatility = volatility;
  }
}
