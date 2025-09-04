import { Symbol } from '../value-objects/symbol.value-object';
import { Price } from '../value-objects/price.value-object';

export class PriceHistory {
  private id: number | null;
  private symbol: Symbol;
  private price: Price;
  private timestamp: Date;

  constructor(
    symbol: Symbol,
    price: Price,
    timestamp: Date = new Date(),
    id: number | null = null,
  ) {
    this.symbol = symbol;
    this.price = price;
    this.timestamp = timestamp;
    this.id = id;
  }

  // Getters
  getId(): number | null {
    return this.id;
  }
  getSymbol(): Symbol {
    return this.symbol;
  }
  getPrice(): Price {
    return this.price;
  }
  getTimestamp(): Date {
    return this.timestamp;
  }
}
