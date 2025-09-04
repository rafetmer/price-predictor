import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SavePriceUseCase } from '../../application/use-cases/save-price.use-case';
import { CoingeckoClient } from '../clients/coingecko.client';

@Injectable()
export class PriceFetchScheduler {
  private readonly logger = new Logger(PriceFetchScheduler.name);

  // Takip edilecek kripto paralar ve para birimleri
  private readonly trackedAssets = [
    { coinId: 'bitcoin', symbol: 'BTC' },
    { coinId: 'ethereum', symbol: 'ETH' },
  ];
  private readonly vsCurrency = 'usd';

  constructor(
    private readonly coingeckoClient: CoingeckoClient,
    private readonly savePriceUseCase: SavePriceUseCase,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES) // Her 5 dakikada bir çalışır
  async handleCron() {
    this.logger.log('Fiyat verileri çekiliyor...');

    for (const asset of this.trackedAssets) {
      try {
        const price = await this.coingeckoClient.getPrice(
          asset.coinId,
          this.vsCurrency,
        );
        await this.savePriceUseCase.execute(asset.symbol, price);
        this.logger.log(`${asset.symbol} fiyatı kaydedildi: ${price}`);
      } catch (error) {
        this.logger.error(
          `${asset.symbol} için fiyat verisi çekilemedi`,
          error.stack,
        );
      }
    }
  }
}
