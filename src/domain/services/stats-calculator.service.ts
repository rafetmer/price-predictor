import { PriceHistory } from '../entities/price-history.entity';
import { PriceStats } from '../entities/price-stats.entity';
import { Symbol } from '../value-objects/symbol.value-object';
import { Period } from '../value-objects/period.value-object';
import { Trend } from '../value-objects/trend.value-object';

export class StatsCalculatorService {
  calculateStats(
    priceHistories: PriceHistory[],
    symbol: Symbol,
    period: Period,
  ): PriceStats {
    if (priceHistories.length === 0) {
      throw new Error('İstatistik hesaplamak için fiyat geçmişi boş olamaz.');
    }

    const prices = priceHistories.map((ph) => ph.getPrice().getValue());
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    const squareDiffs = prices.map((price) => Math.pow(price - avg, 2));
    const variance =
      squareDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
    const volatility = Math.sqrt(variance);

    const trend = this.determineTrend(priceHistories);

    return new PriceStats(symbol, period, avg, volatility, trend);
  }

  private determineTrend(priceHistories: PriceHistory[]): Trend {
    if (priceHistories.length < 2) {
      return new Trend('STABLE');
    }

    // En eski ve en yeni fiyatları al
    const sortedHistories = [...priceHistories].sort(
      (a, b) => a.getTimestamp().getTime() - b.getTimestamp().getTime(),
    );
    const firstPrice = sortedHistories[0].getPrice().getValue();
    const lastPrice = sortedHistories[sortedHistories.length - 1]
      .getPrice()
      .getValue();

    // Fiyat değişim yüzdesini hesapla
    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Değişim yüzdesine göre trendi belirle
    if (percentageChange > 5) {
      return new Trend('UP');
    } else if (percentageChange < -5) {
      return new Trend('DOWN');
    } else {
      return new Trend('STABLE');
    }
  }
}
