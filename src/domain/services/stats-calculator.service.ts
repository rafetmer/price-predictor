import { PriceHistory } from '../entities/price-history.entity';
import { PriceStats } from '../entities/price-stats.entity';
import { Symbol } from '../value-objects/symbol.value-object';
import { Period } from '../value-objects/period.value-object';
import { Trend } from '../value-objects/trend.value-object';

export class StatsCalculatorService {


  private readonly TREND_THRESHOLD_PERCENTAGE = 5;

  calculateStats(
    priceHistories: PriceHistory[],
    symbol: Symbol,
    period: Period,
  ): PriceStats {
    if (priceHistories.length === 0) {
      throw new Error('İstatistik hesaplamak için fiyat geçmişi boş olamaz.');
    }



    // adım 1 : priceları mapliyoruz daha rahat kullanabilmek icin
    // adım 2 : avg alıyoruz standart sapma hesaplarken kullanıcaz
    // adım 3 : (P1- AVG)^2, (P2- AVG)^2 . . (Pn- AVG)^2 bu sekilde degerleri bulup maplıyoruz
    // adım 4: sonrasında bu mapledigimiz degerlerin ortalamasını buluyoruz
    // adım 5 : stanbdart sapmanın son işlemi olan karekokunu alıyoruz
    const prices = priceHistories.map((ph) => ph.getPrice().getValue());
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    let volatility = 0;
    if (prices.length < 2) {
        volatility = 0;
    } else {
        const squareDiffs = prices.map((price) => Math.pow(price - avg, 2));
        const variance = squareDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
        volatility = Math.sqrt(variance);
    }
 

    const trend = this.determineTrend(priceHistories);

    return new PriceStats(symbol, period, avg, volatility, trend);
  }

  private determineTrend(priceHistories: PriceHistory[]): Trend {

    if (priceHistories.length < 2) {
      return new Trend('STABLE');
    }

    // En eski ve en yeni fiyatları al

    // Neden [...priceHistories]? sort() metodu, orijinal diziyi yerinde değiştirir (mutates).
    // Bu, genellikle istenmeyen bir yan etkidir. ... (spread operatörü) kullanarak priceHistories dizisinin bir kopyasını oluştururuz.
    // Böylece sıralama işlemini bu kopya üzerinde yaparız ve orijinal priceHistories dizisine dokunmamış oluruz. Bu, fonksiyonun "saf" (pure) kalmasına yardımcı olur.
    const sortedHistories = [...priceHistories].sort(
      (a, b) => a.getTimestamp().getTime() - b.getTimestamp().getTime(),
    );
    const firstPrice = sortedHistories[0].getPrice().getValue();
    const lastPrice = sortedHistories[sortedHistories.length - 1].getPrice().getValue();
    if (firstPrice === 0) {
        if (lastPrice > 0) { return new Trend('UP'); }
        if (lastPrice < 0) { return new Trend('DOWN'); }
        return new Trend('STABLE');
    }

    // Fiyat değişim yüzdesini hesapla
    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100; // Daha sağlam bir yaklaşım, tüm veri noktalarını hesaba katan doğrusal regresyon (linear regression) olabilir. MVP sonrası degistir

    // Değişim yüzdesine göre trendi belirle
    // burda 5 kullanıldıı fakat bu MVP icin sonrasında degistirilecek istenen productın yapısına göre

    if (percentageChange > this.TREND_THRESHOLD_PERCENTAGE) {
      return new Trend('UP');
    } else if (percentageChange < -this.TREND_THRESHOLD_PERCENTAGE) {
      return new Trend('DOWN');
    } else {
      return new Trend('STABLE');
    }
  }
}
