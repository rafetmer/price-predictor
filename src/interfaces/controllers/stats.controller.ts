import { Controller, Get, Inject, Param } from '@nestjs/common';
import type { PriceStatsRepository } from '../../domain/repositories/price-stats.repository';
import { CalculateStatsUseCase } from '../../application/use-cases/calculate-stats.use-case';
import { PriceStats } from '../../domain/entities/price-stats.entity';
import { Symbol } from '../../domain/value-objects/symbol.value-object';
import { Period } from '../../domain/value-objects/period.value-object';

@Controller('stats')
export class StatsController {
	constructor(
		@Inject('PriceStatsRepository')
		private readonly priceStatsRepository: PriceStatsRepository,
		private readonly calculateStatsUseCase: CalculateStatsUseCase,
	) {}

	@Get(':symbol/:period')
	async getStats(
		@Param('symbol') symbol: string,
		@Param('period') period: string,
	): Promise<PriceStats> {
		// Önce en son hesaplanmış istatistiği bulmaya çalış
		const latestStat =
			await this.priceStatsRepository.findLatestBySymbolAndPeriod(
				new Symbol(symbol),
				new Period(period),
			);

		// Eğer varsa ve çok eski değilse onu döndür (örneğin son 1 saat içinde hesaplanmışsa)
		if (latestStat && this.isStatRecent(latestStat.getCalculatedAt())) {
			return latestStat;
		}

		// Yoksa veya eskiyse, yeniden hesapla
		return this.calculateStatsUseCase.execute(symbol, period);
	}

	private isStatRecent(calculatedAt: Date): boolean {
		const oneHourAgo = new Date();
		oneHourAgo.setHours(oneHourAgo.getHours() - 1);
		return calculatedAt > oneHourAgo;
	}
}
