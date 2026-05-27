export interface PricePoint {
  price: number;
  timestamp: string;
  discount?: number;
}

export interface WishlistItem {
  wishlistItemId: number;
  wishlistId: number;
  productId: number;
  addedAt: string;
  priceWhenAdded: number;
  currentPrice: number;
  lowestPrice?: number;
  highestPrice?: number;
  targetPrice?: number;
  lastPriceCheck: string;
  priceAlerts: boolean;
  priceHistory: PricePoint[];
}

export interface PriceAlert {
  alertId: number;
  userId: number;
  wishlistItemId: number;
  productId: number;
  type: 'PRICE_DROP' | 'TARGET_MET' | 'BEST_PRICE_YET';
  message: string;
  createdAt: string;
  percentageDrop?: number;
  dismissed: boolean;
}

export interface WishlistSummary {
  savedByWaiting: number;
  averageDiscountAchieved: number;
  bestTimeToBuy: string;
  priceStability: string;
  averageVolatility: number;
}
