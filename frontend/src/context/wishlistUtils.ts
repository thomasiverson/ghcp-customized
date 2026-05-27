export type WishlistPriority = 'high' | 'medium' | 'low';

export interface WishlistItem {
  wishlistItemId: number;
  wishlistId: number;
  productId: number;
  addedAt: string;
  notes?: string;
  priority?: WishlistPriority;
  category?: string;
  targetPrice?: number;
  quantity?: number;
}

export interface PurchasedWishlistItem {
  productId: number;
  addedAt: string;
  purchasedAt: string;
  priority?: WishlistPriority;
  category?: string;
}

const priorityWeight: Record<WishlistPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const isPriority = (value: unknown): value is WishlistPriority => value === 'high' || value === 'medium' || value === 'low';

export const normalizeWishlistItem = (item: Partial<WishlistItem>, fallbackId: number): WishlistItem => {
  const quantity = Number.isFinite(item.quantity) && Number(item.quantity) > 0 ? Math.floor(Number(item.quantity)) : 1;
  const targetPrice = Number.isFinite(item.targetPrice) && Number(item.targetPrice) > 0 ? Number(item.targetPrice) : undefined;

  return {
    wishlistItemId: Number.isFinite(item.wishlistItemId) ? Number(item.wishlistItemId) : fallbackId,
    wishlistId: Number.isFinite(item.wishlistId) ? Number(item.wishlistId) : 1,
    productId: Number(item.productId ?? 0),
    addedAt: item.addedAt || new Date().toISOString(),
    notes: item.notes,
    priority: isPriority(item.priority) ? item.priority : undefined,
    category: item.category,
    targetPrice,
    quantity,
  };
};

export const sortWishlistByDateAdded = (items: WishlistItem[]): WishlistItem[] =>
  [...items].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

export const sortWishlistByPriority = (items: WishlistItem[]): WishlistItem[] =>
  [...items].sort((a, b) => {
    const diff = (priorityWeight[b.priority ?? 'low'] ?? 1) - (priorityWeight[a.priority ?? 'low'] ?? 1);
    if (diff !== 0) {
      return diff;
    }
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

export const sortWishlistByPrice = (items: WishlistItem[], productPrices: Record<number, number>): WishlistItem[] =>
  [...items].sort((a, b) => (productPrices[a.productId] ?? Number.MAX_SAFE_INTEGER) - (productPrices[b.productId] ?? Number.MAX_SAFE_INTEGER));

export const calculatePriorityDistribution = (items: WishlistItem[]): Record<WishlistPriority, number> => ({
  high: items.filter(item => item.priority === 'high').length,
  medium: items.filter(item => item.priority === 'medium').length,
  low: items.filter(item => item.priority === 'low' || !item.priority).length,
});

export const calculateMostUsedCategories = (items: WishlistItem[]): Array<{ category: string; count: number }> => {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const category = item.category?.trim();
    if (!category) {
      return acc;
    }
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
};

export const calculateAverageDaysUntilPurchase = (purchases: PurchasedWishlistItem[]): number => {
  if (!purchases.length) {
    return 0;
  }

  const totalDays = purchases.reduce((acc, purchase) => {
    const added = new Date(purchase.addedAt).getTime();
    const bought = new Date(purchase.purchasedAt).getTime();
    if (Number.isNaN(added) || Number.isNaN(bought) || bought < added) {
      return acc;
    }
    return acc + (bought - added) / (1000 * 60 * 60 * 24);
  }, 0);

  return Number((totalDays / purchases.length).toFixed(2));
};
