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

export type PriceAlertType = 'PRICE_DROP' | 'TARGET_MET' | 'BEST_PRICE_YET';

export interface PriceAlert {
  alertId: number;
  userId: number;
  wishlistItemId: number;
  productId: number;
  type: PriceAlertType;
  message: string;
  createdAt: string;
  percentageDrop?: number;
  dismissed: boolean;
}
