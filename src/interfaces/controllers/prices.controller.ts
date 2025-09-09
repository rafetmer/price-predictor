import { Controller, Get, Inject, Param } from '@nestjs/common';
import type { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';
import { PriceHistory } from '../../domain/entities/price-history.entity';
import { Symbol } from '../../domain/value-objects/symbol.value-object';

@Controller('prices')
export class PricesController {
  constructor(
    @Inject('PriceHistoryRepository')
    private readonly priceHistoryRepository: PriceHistoryRepository,
  ) {}

  @Get(':symbol')
  async getPricesBySymbol(
    @Param('symbol') symbol: string,
  ): Promise<PriceHistory[]> {
    const symbolVO = new Symbol(symbol);
    return this.priceHistoryRepository.findBySymbol(symbolVO);
  }
}
