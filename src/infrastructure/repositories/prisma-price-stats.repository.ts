import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PriceStatsRepository } from '../../domain/repositories/price-stats.repository';
import { PriceStats } from '../../domain/entities/price-stats.entity';
import { Symbol } from '../../domain/value-objects/symbol.value-object';
import { Period } from '../../domain/value-objects/period.value-object';
import { Trend } from '../../domain/value-objects/trend.value-object';

@Injectable()
export class PrismaPriceStatsRepository implements PriceStatsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(priceStats: PriceStats): Promise<PriceStats> {
    const created = await this.prisma.priceStats.create({
      data: {
        symbol: priceStats.getSymbol().getValue(),
        period: priceStats.getPeriod().getValue(),
        avg: priceStats.getAvg(),
        volatility: priceStats.getVolatility(),
        trend: priceStats.getTrend().getValue(),
        calculatedAt: priceStats.getCalculatedAt(),
      },
    });
    return new PriceStats(
      new Symbol(created.symbol),
      new Period(created.period),
      created.avg,
      created.volatility,
      new Trend(created.trend),
      created.calculatedAt,
      created.id,
    );
  }

  async findLatestBySymbolAndPeriod(
    symbol: Symbol,
    period: Period,
  ): Promise<PriceStats | null> {
    const found = await this.prisma.priceStats.findFirst({
      where: {
        symbol: symbol.getValue(),
        period: period.getValue(),
      },
      orderBy: { calculatedAt: 'desc' },
    });

    if (!found) return null;

    return new PriceStats(
      new Symbol(found.symbol),
      new Period(found.period),
      found.avg,
      found.volatility,
      new Trend(found.trend),
      found.calculatedAt,
      found.id,
    );
  }

  async findBySymbolAndPeriod(
    symbol: Symbol,
    period: Period,
  ): Promise<PriceStats[]> {
    const found = await this.prisma.priceStats.findMany({
      where: {
        symbol: symbol.getValue(),
        period: period.getValue(),
      },
      orderBy: { calculatedAt: 'desc' },
    });

    return found.map(
      (s) =>
        new PriceStats(
          new Symbol(s.symbol),
          new Period(s.period),
          s.avg,
          s.volatility,
          new Trend(s.trend),
          s.calculatedAt,
          s.id,
        ),
    );
  }
}
