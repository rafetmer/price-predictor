import { Inject, Injectable } from '@nestjs/common';
import type { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';
import type { PriceStatsRepository } from '../../domain/repositories/price-stats.repository';
import { StatsCalculatorService } from '../../domain/services/stats-calculator.service';
import { Symbol } from '../../domain/value-objects/symbol.value-object';
import { Period } from '../../domain/value-objects/period.value-object';
import { PriceStats } from '../../domain/entities/price-stats.entity';

@Injectable()
export class CalculateStatsUseCase {
	constructor(
		@Inject('PriceHistoryRepository')
		private readonly priceHistoryRepository: PriceHistoryRepository,
		@Inject('PriceStatsRepository')
		private readonly priceStatsRepository: PriceStatsRepository,
		private readonly statsCalculator: StatsCalculatorService,
	) {}

	async execute(symbol: string, period: string): Promise<PriceStats> {
		const symbolVO = new Symbol(symbol);
		const periodVO = new Period(period);

		const endDate = new Date();
		const startDate = this.getStartDate(endDate, periodVO);

		const priceHistories =
			await this.priceHistoryRepository.findBySymbolAndTimeRange(
				symbolVO,
				startDate,
				endDate,
			);

		if (priceHistories.length === 0) {
			throw new Error('Bu periyot için yeterli veri bulunamadı.');
		}

		const newStats = this.statsCalculator.calculateStats(
			priceHistories,
			symbolVO,
			periodVO,
		);

		return this.priceStatsRepository.save(newStats);
	}

	private getStartDate(endDate: Date, period: Period): Date {
		const date = new Date(endDate);
		const periodValue = period.getValue();
		if (periodValue === '1d') {
			date.setDate(date.getDate() - 1);
		} else if (periodValue === '7d') {
			date.setDate(date.getDate() - 7);
		} else if (periodValue === '30d') {
			date.setDate(date.getDate() - 30);
		}
		return date;
	}
}
