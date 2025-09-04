import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';
import { PriceHistory } from '../../domain/entities/price-history.entity';
import { Symbol } from '../../domain/value-objects/symbol.value-object';
import { Price } from '../../domain/value-objects/price.value-object';

@Injectable()
export class PrismaPriceHistoryRepository implements PriceHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(priceHistory: PriceHistory): Promise<PriceHistory> {
    const created = await this.prisma.priceHistory.create({
      data: {
        symbol: priceHistory.getSymbol().getValue(),
        price: priceHistory.getPrice().getValue(),
        timestamp: priceHistory.getTimestamp(),
      },
    });
    return new PriceHistory(
      new Symbol(created.symbol),
      new Price(created.price),
      created.timestamp,
      created.id,
    );
  }

  async findById(id: number): Promise<PriceHistory | null> {
    const found = await this.prisma.priceHistory.findUnique({ where: { id } });
    if (!found) return null;
    return new PriceHistory(
      new Symbol(found.symbol),
      new Price(found.price),
      found.timestamp,
      found.id,
    );
  }

  async findBySymbol(symbol: Symbol): Promise<PriceHistory[]> {
    const found = await this.prisma.priceHistory.findMany({
      where: { symbol: symbol.getValue() },
      orderBy: { timestamp: 'desc' },
    });
    return found.map(
      (p) =>
        new PriceHistory(
          new Symbol(p.symbol),
          new Price(p.price),
          p.timestamp,
          p.id,
        ),
    );
  }

  async findBySymbolAndTimeRange(
    symbol: Symbol,
    startDate: Date,
    endDate: Date,
  ): Promise<PriceHistory[]> {
    const found = await this.prisma.priceHistory.findMany({
      where: {
        symbol: symbol.getValue(),
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
    return found.map(
      (p) =>
        new PriceHistory(
          new Symbol(p.symbol),
          new Price(p.price),
          p.timestamp,
          p.id,
        ),
    );
  }
}
