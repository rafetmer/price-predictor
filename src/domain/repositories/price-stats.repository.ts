import { PriceStats } from '../entities/price-stats.entity';
import { Symbol } from '../value-objects/symbol.value-object';
import { Period } from '../value-objects/period.value-object';

export interface PriceStatsRepository {
	save(priceStats: PriceStats): Promise<PriceStats>;
	findLatestBySymbolAndPeriod(
		symbol: Symbol,
		period: Period,
	): Promise<PriceStats | null>;
	findBySymbolAndPeriod(symbol: Symbol, period: Period): Promise<PriceStats[]>;
}
