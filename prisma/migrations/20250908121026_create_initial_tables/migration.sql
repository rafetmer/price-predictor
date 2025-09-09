-- CreateTable
CREATE TABLE "public"."PriceHistory" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(30) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceStats" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(30) NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "avg" DOUBLE PRECISION NOT NULL,
    "volatility" DOUBLE PRECISION NOT NULL,
    "trend" VARCHAR(10) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_symbol_timestamp_idx" ON "public"."PriceHistory"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "PriceStats_symbol_period_idx" ON "public"."PriceStats"("symbol", "period");
