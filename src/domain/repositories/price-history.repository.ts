import { PriceHistory } from '../entities/price-history.entity';
import { Symbol } from '../value-objects/symbol.value-object';

export interface PriceHistoryRepository {
	save(priceHistory: PriceHistory): Promise<PriceHistory>;
	findById(id: number): Promise<PriceHistory | null>;
	findBySymbol(symbol: Symbol): Promise<PriceHistory[]>;
	findBySymbolAndTimeRange(
		symbol: Symbol,
		startDate: Date,
		endDate: Date,
	): Promise<PriceHistory[]>;
}
