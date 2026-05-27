import { describe, expect, it } from 'vitest';
import { calculateDiscountPercent, calculateVolatility, getTrendSymbol, sortWishlistItems } from './priceUtils';
import { WishlistItem } from './types';

const makeItem = (overrides: Partial<WishlistItem>): WishlistItem => ({
  wishlistItemId: 1,
  wishlistId: 1,
  productId: 1,
  addedAt: '2026-01-01T00:00:00.000Z',
  priceWhenAdded: 100,
  currentPrice: 90,
  lowestPrice: 90,
  highestPrice: 100,
  targetPrice: 85,
  lastPriceCheck: '2026-01-01T00:00:00.000Z',
  priceAlerts: true,
  priceHistory: [
    { price: 100, timestamp: '2026-01-01T00:00:00.000Z' },
    { price: 90, timestamp: '2026-01-02T00:00:00.000Z' }
  ],
  ...overrides
});

describe('priceUtils', () => {
  it('calculates discount percentages', () => {
    expect(calculateDiscountPercent(100, 75)).toBe(25);
    expect(calculateDiscountPercent(0, 75)).toBe(0);
  });

  it('derives trend symbols', () => {
    expect(getTrendSymbol(makeItem({}))).toBe('↓');
    expect(getTrendSymbol(makeItem({ priceHistory: [{ price: 10, timestamp: '2026-01-01T00:00:00.000Z' }] }))).toBe('→');
  });

  it('calculates volatility and sort order', () => {
    const bestDeal = makeItem({ wishlistItemId: 1, priceWhenAdded: 120, currentPrice: 60, targetPrice: 50 });
    const nearTarget = makeItem({ wishlistItemId: 2, productId: 2, priceWhenAdded: 100, currentPrice: 91, targetPrice: 90 });

    expect(calculateVolatility(bestDeal)).toBe(10);

    const sorted = sortWishlistItems([nearTarget, bestDeal], 'BEST_DEALS');
    expect(sorted[0].wishlistItemId).toBe(1);

    const near = sortWishlistItems([bestDeal, nearTarget], 'NEAR_TARGET');
    expect(near[0].wishlistItemId).toBe(2);
  });
});
