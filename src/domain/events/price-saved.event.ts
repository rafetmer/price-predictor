import { PriceHistory } from '../entities/price-history.entity';

export class PriceSavedEvent {
	constructor(public readonly priceHistory: PriceHistory) {}
}
