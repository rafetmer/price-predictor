import { Inject, Injectable } from '@nestjs/common';
import type { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';
import { PriceHistory } from '../../domain/entities/price-history.entity';
import { Symbol } from '../../domain/value-objects/symbol.value-object';
import { Price } from '../../domain/value-objects/price.value-object';
import { PriceSavedEvent } from '../../domain/events/price-saved.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SavePriceUseCase {
	constructor(
		@Inject('PriceHistoryRepository')
		private readonly priceHistoryRepository: PriceHistoryRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(symbol: string, price: number): Promise<PriceHistory> {
		const symbolVO = new Symbol(symbol);
		const priceVO = new Price(price);

		const priceHistory = new PriceHistory(symbolVO, priceVO);

		const savedPrice = await this.priceHistoryRepository.save(priceHistory);

		// Fiyat kaydedildiğinde bir event fırlat
		this.eventEmitter.emit('price.saved', new PriceSavedEvent(savedPrice));

		return savedPrice;
	}
}
