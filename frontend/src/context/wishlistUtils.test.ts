import { describe, expect, it } from 'vitest';
import {
  calculateAverageDaysUntilPurchase,
  calculatePriorityDistribution,
  normalizeWishlistItem,
  sortWishlistByPriority,
  type WishlistItem,
} from './wishlistUtils';

describe('wishlistUtils', () => {
  it('normalizes simple wishlist items for backwards compatibility', () => {
    const normalized = normalizeWishlistItem({ productId: 5 }, 2);

    expect(normalized.wishlistItemId).toBe(2);
    expect(normalized.wishlistId).toBe(1);
    expect(normalized.quantity).toBe(1);
    expect(normalized.productId).toBe(5);
  });

  it('sorts items by priority order', () => {
    const items: WishlistItem[] = [
      { wishlistItemId: 1, wishlistId: 1, productId: 1, addedAt: '2026-01-01T00:00:00.000Z', priority: 'low' },
      { wishlistItemId: 2, wishlistId: 1, productId: 2, addedAt: '2026-01-01T00:00:00.000Z', priority: 'high' },
      { wishlistItemId: 3, wishlistId: 1, productId: 3, addedAt: '2026-01-01T00:00:00.000Z', priority: 'medium' },
    ];

    expect(sortWishlistByPriority(items).map(item => item.productId)).toEqual([2, 3, 1]);
  });

  it('calculates analytics values', () => {
    expect(calculatePriorityDistribution([
      { wishlistItemId: 1, wishlistId: 1, productId: 1, addedAt: '2026-01-01T00:00:00.000Z', priority: 'high' },
      { wishlistItemId: 2, wishlistId: 1, productId: 2, addedAt: '2026-01-01T00:00:00.000Z' },
    ])).toEqual({ high: 1, medium: 0, low: 1 });

    expect(calculateAverageDaysUntilPurchase([
      { productId: 1, addedAt: '2026-01-01T00:00:00.000Z', purchasedAt: '2026-01-03T00:00:00.000Z' },
    ])).toBe(2);
  });
});
