import { describe, expect, it, beforeEach } from 'vitest';
import { WishlistItem } from '../models/wishlist';
import { checkTargetPrices, detectPriceDrops, recordPriceChange, resetPriceTrackerState } from './priceTracker';

const makeItem = (): WishlistItem => ({
  wishlistItemId: 1,
  wishlistId: 1,
  productId: 1,
  addedAt: '2026-01-01T00:00:00.000Z',
  priceWhenAdded: 100,
  currentPrice: 100,
  lowestPrice: 100,
  highestPrice: 100,
  targetPrice: 90,
  lastPriceCheck: '2026-01-01T00:00:00.000Z',
  priceAlerts: true,
  priceHistory: [{ price: 100, timestamp: '2026-01-01T00:00:00.000Z' }]
});

describe('priceTracker', () => {
  beforeEach(() => {
    resetPriceTrackerState();
  });

  it('detects configured drop thresholds', () => {
    expect(detectPriceDrops(100, 89)).toMatchObject({ threshold: 10 });
    expect(detectPriceDrops(100, 84)).toMatchObject({ threshold: 15 });
    expect(detectPriceDrops(100, 79)).toMatchObject({ threshold: 20 });
    expect(detectPriceDrops(100, 99)).toBeNull();
  });

  it('checks target prices correctly', () => {
    const item = makeItem();
    expect(checkTargetPrices(item, 89)).toBe(true);
    expect(checkTargetPrices(item, 91)).toBe(false);
  });

  it('records price history and maintains 90 day retention', () => {
    const item = makeItem();

    recordPriceChange(item, 95, new Date('2026-01-02T00:00:00.000Z'));
    expect(item.currentPrice).toBe(95);
    expect(item.lowestPrice).toBe(95);
    expect(item.priceHistory.length).toBe(2);

    item.priceHistory.push({ price: 120, timestamp: '2025-01-01T00:00:00.000Z' });
    recordPriceChange(item, 94, new Date('2026-04-03T00:00:00.000Z'));

    expect(item.priceHistory.some((point) => point.timestamp === '2025-01-01T00:00:00.000Z')).toBe(false);
  });
});
