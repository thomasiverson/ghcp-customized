import { WishlistItem } from './types';

export const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;

export const calculateDiscountPercent = (was: number, now: number): number => {
  if (was <= 0) {
    return 0;
  }
  return Number((((was - now) / was) * 100).toFixed(2));
};

export const getTrendSymbol = (item: WishlistItem): '↑' | '↓' | '→' => {
  const history = item.priceHistory;
  if (history.length < 2) {
    return '→';
  }

  const last = history[history.length - 1].price;
  const prev = history[history.length - 2].price;
  if (last > prev) {
    return '↑';
  }
  if (last < prev) {
    return '↓';
  }
  return '→';
};

export const calculateVolatility = (item: WishlistItem): number => {
  if (item.priceHistory.length < 2) {
    return 0;
  }

  const changes = item.priceHistory.slice(1).map((entry, index) => {
    const previous = item.priceHistory[index].price;
    return Math.abs(entry.price - previous);
  });

  return Number((changes.reduce((sum, change) => sum + change, 0) / changes.length).toFixed(2));
};

export const sortWishlistItems = (items: WishlistItem[], mode: 'BEST_DEALS' | 'PRICE_DROPPED' | 'NEAR_TARGET'): WishlistItem[] => {
  const sorted = [...items];
  if (mode === 'BEST_DEALS') {
    return sorted.sort((a, b) => calculateDiscountPercent(b.priceWhenAdded, b.currentPrice) - calculateDiscountPercent(a.priceWhenAdded, a.currentPrice));
  }

  if (mode === 'PRICE_DROPPED') {
    return sorted.sort((a, b) => {
      const aDropped = a.currentPrice < a.priceWhenAdded ? 1 : 0;
      const bDropped = b.currentPrice < b.priceWhenAdded ? 1 : 0;
      return bDropped - aDropped;
    });
  }

  return sorted.sort((a, b) => {
    const aDistance = Math.abs((a.targetPrice ?? a.currentPrice) - a.currentPrice);
    const bDistance = Math.abs((b.targetPrice ?? b.currentPrice) - b.currentPrice);
    return aDistance - bDistance;
  });
};
