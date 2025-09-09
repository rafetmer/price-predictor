import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';
import { PriceHistory } from '../../domain/entities/price-history.entity';
import { Symbol } from '../../domain/value-objects/symbol.value-object';
import { Price } from '../../domain/value-objects/price.value-object';
import { nullish } from 'zod';

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
		if (!found) {
			console.log('PriceHistory not found');
			return null;
		}
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
			// we will map every record to PriceHistory entities
			(record) =>
				new PriceHistory(
					new Symbol(record.symbol),
					new Price(record.price),
					record.timestamp,
					record.id,
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
					gte: startDate, // bunlar prismaya özel terimler gte = greater than or equal lte = less than or equual
					lte: endDate,
				},
			},
			orderBy: { timestamp: 'asc' },
		});
		return found.map(
			(record) =>
				new PriceHistory(
					new Symbol(record.symbol),
					new Price(record.price),
					record.timestamp,
					record.id,
				),
		);
	}
}
