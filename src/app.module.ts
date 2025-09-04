import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaClient } from '@prisma/client';

// --- Domain ---
import { StatsCalculatorService } from './domain/services/stats-calculator.service';

// --- Application ---
import { SavePriceUseCase } from './application/use-cases/save-price.use-case';
import { CalculateStatsUseCase } from './application/use-cases/calculate-stats.use-case';

// --- Infrastructure ---
import { PrismaPriceHistoryRepository } from './infrastructure/repositories/prisma-price-history.repository';
import { PrismaPriceStatsRepository } from './infrastructure/repositories/prisma-price-stats.repository';
import { CoingeckoClient } from './infrastructure/clients/coingecko.client';
import { PriceFetchScheduler } from './infrastructure/schedulers/price-fetch.scheduler';

// --- Interfaces ---
import { PricesController } from './interfaces/controllers/prices.controller';
import { StatsController } from './interfaces/controllers/stats.controller';
import { PriceHistoryRepository } from './domain/repositories/price-history.repository';
import { PriceStatsRepository } from './domain/repositories/price-stats.repository';

@Module({
  imports: [ScheduleModule.forRoot(), EventEmitterModule.forRoot()],
  controllers: [PricesController, StatsController],
  providers: [
    // Prisma Client
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },

    // Domain Services
    StatsCalculatorService,

    // Repositories (using concrete implementations)
    {
      provide: 'PriceHistoryRepository',
      useClass: PrismaPriceHistoryRepository,
    },
    {
      provide: 'PriceStatsRepository',
      useClass: PrismaPriceStatsRepository,
    },

    // Use Cases
    SavePriceUseCase,
    CalculateStatsUseCase,

    // Infrastructure
    CoingeckoClient,
    PriceFetchScheduler,
  ],
})
export class AppModule {}
