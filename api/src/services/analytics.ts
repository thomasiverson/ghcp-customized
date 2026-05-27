import { products } from '../seedData';

export interface ProductWishlistStats {
  productId: number;
  productName: string;
  wishlistCount: number;
  addRate: number;
  removeRate: number;
  conversionRate: number;
  averageDaysOnWishlist: number;
  priceElasticity: number;
}

export interface ProductTrend {
  productId: number;
  productName: string;
  currentWishlistCount: number;
  previousWishlistCount: number;
  growthRate: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface HourlyActivity {
  hour: number;
  additions: number;
  removals: number;
}

export interface DailyActivity {
  date: string;
  additions: number;
  removals: number;
  conversions: number;
}

export interface SeasonalData {
  month: string;
  wishlistCount: number;
  conversionRate: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  conversionRate: number;
  averagePrice: number;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  dropOffRate: number;
}

export interface WishlistOverview {
  totalActiveWishlists: number;
  totalWishlistItems: number;
  averageWishlistSize: number;
  wishlistConversionRate: number;
  averageDaysUntilPurchase: number;
  wishlistRetentionRate: number;
  mostWishlistedProduct: string;
  weekOverWeekGrowth: number;
}

export interface BusinessInsight {
  type: 'opportunity' | 'warning' | 'alert' | 'tip';
  title: string;
  description: string;
  productName?: string;
  actionLabel?: string;
}

// Deterministic pseudo-random using product ID as seed
function seededRandom(seed: number, offset = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

export function calculateProductWishlistStats(): ProductWishlistStats[] {
  return products.map((product) => {
    const seed = product.productId;
    const wishlistCount = Math.floor(seededRandom(seed, 1) * 450) + 50;
    const addRate = parseFloat((seededRandom(seed, 2) * 9 + 1).toFixed(1));
    const removeRate = parseFloat((seededRandom(seed, 3) * 2 + 0.2).toFixed(1));
    const conversionRate = parseFloat((seededRandom(seed, 4) * 35 + 5).toFixed(1));
    const averageDaysOnWishlist = Math.floor(seededRandom(seed, 5) * 55) + 5;
    // Products with discount have higher elasticity
    const baseElasticity = product.discount ? 0.6 : 0.3;
    const priceElasticity = parseFloat((baseElasticity + seededRandom(seed, 6) * 0.3).toFixed(2));

    return {
      productId: product.productId,
      productName: product.name,
      wishlistCount,
      addRate,
      removeRate,
      conversionRate,
      averageDaysOnWishlist,
      priceElasticity,
    };
  });
}

export function calculateUserWishlistMetrics(): WishlistOverview {
  const stats = calculateProductWishlistStats();
  const totalItems = stats.reduce((sum, s) => sum + s.wishlistCount, 0);
  const avgConversion =
    stats.reduce((sum, s) => sum + s.conversionRate, 0) / stats.length;
  const mostWishlisted = stats.reduce((prev, curr) =>
    curr.wishlistCount > prev.wishlistCount ? curr : prev
  );

  return {
    totalActiveWishlists: 1247,
    totalWishlistItems: totalItems,
    averageWishlistSize: parseFloat((totalItems / 1247).toFixed(1)),
    wishlistConversionRate: parseFloat(avgConversion.toFixed(1)),
    averageDaysUntilPurchase: 18,
    wishlistRetentionRate: 72.4,
    mostWishlistedProduct: mostWishlisted.productName,
    weekOverWeekGrowth: 8.3,
  };
}

export function calculateConversionRates(): ConversionFunnelData[] {
  return [
    { stage: 'Browse', count: 12500, dropOffRate: 0 },
    { stage: 'Wishlist', count: 3200, dropOffRate: 74.4 },
    { stage: 'Cart', count: 1480, dropOffRate: 53.8 },
    { stage: 'Purchase', count: 620, dropOffRate: 58.1 },
  ];
}

export function generateHeatmaps(): { hourly: HourlyActivity[]; daily: DailyActivity[] } {
  const hourly: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => {
    const seed = hour + 100;
    const peakFactor = hour >= 9 && hour <= 22 ? 1.5 : 0.4;
    const additions = Math.floor(seededRandom(seed, 1) * 30 * peakFactor) + 2;
    const removals = Math.floor(seededRandom(seed, 2) * 8 * peakFactor) + 1;
    return { hour, additions, removals };
  });

  const daily: DailyActivity[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const seed = i + 200;
    const additions = Math.floor(seededRandom(seed, 1) * 80) + 20;
    const removals = Math.floor(seededRandom(seed, 2) * 20) + 5;
    const conversions = Math.floor(seededRandom(seed, 3) * 15) + 2;
    return {
      date: date.toISOString().split('T')[0],
      additions,
      removals,
      conversions,
    };
  });

  return { hourly, daily };
}

export function analyzeSeasonalTrends(): SeasonalData[] {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const wishlistBase = [420, 380, 460, 490, 520, 480, 530, 560, 510, 590, 720, 810];
  const conversionBase = [18, 16, 19, 21, 22, 20, 23, 24, 21, 25, 30, 34];

  return months.map((month, i) => ({
    month,
    wishlistCount: wishlistBase[i] + Math.floor(seededRandom(i + 300, 1) * 40) - 20,
    conversionRate: parseFloat(
      (conversionBase[i] + seededRandom(i + 300, 2) * 2 - 1).toFixed(1)
    ),
  }));
}

export function calculatePriceElasticity(): { productId: number; productName: string; discount: number; conversionRate: number }[] {
  return products.map((product) => {
    const seed = product.productId;
    const discount = product.discount ? product.discount * 100 : seededRandom(seed, 7) * 20;
    const baseConversion = seededRandom(seed, 4) * 25 + 5;
    // Higher discount -> higher conversion
    const conversionRate = parseFloat((baseConversion + discount * 0.4).toFixed(1));
    return {
      productId: product.productId,
      productName: product.name,
      discount: parseFloat(discount.toFixed(1)),
      conversionRate,
    };
  });
}

export function generateRecommendations(): BusinessInsight[] {
  const stats = calculateProductWishlistStats();
  const insights: BusinessInsight[] = [];

  // High add rate products
  const highAddRate = stats
    .filter((s) => s.addRate > 7)
    .sort((a, b) => b.addRate - a.addRate)
    .slice(0, 2);
  highAddRate.forEach((p) => {
    insights.push({
      type: 'opportunity',
      title: 'Products likely to convert soon',
      description: `${p.productName} is being added to wishlists at ${p.addRate} times/day. Consider a targeted promotion.`,
      productName: p.productName,
      actionLabel: 'Create Promotion',
    });
  });

  // High remove rate products
  const highRemoveRate = stats
    .filter((s) => s.removeRate > 1.8)
    .sort((a, b) => b.removeRate - a.removeRate)
    .slice(0, 2);
  highRemoveRate.forEach((p) => {
    insights.push({
      type: 'warning',
      title: 'Products losing interest',
      description: `${p.productName} has a high removal rate of ${p.removeRate}/day. Review pricing or product details.`,
      productName: p.productName,
      actionLabel: 'Review Product',
    });
  });

  // Top wishlisted
  const topWishlisted = stats
    .sort((a, b) => b.wishlistCount - a.wishlistCount)
    .slice(0, 1)[0];
  insights.push({
    type: 'alert',
    title: 'Stock up alert',
    description: `${topWishlisted.productName} has ${topWishlisted.wishlistCount} active wishlists — ensure sufficient inventory.`,
    productName: topWishlisted.productName,
    actionLabel: 'Check Inventory',
  });

  insights.push({
    type: 'tip',
    title: 'Seasonal planning tip',
    description: 'Wishlist activity typically peaks in November–December. Prepare promotional campaigns by October.',
    actionLabel: 'View Trends',
  });

  insights.push({
    type: 'opportunity',
    title: 'Category opportunity',
    description: 'Smart Feeding products show the highest conversion rates. Consider expanding this category.',
    actionLabel: 'View Category',
  });

  return insights;
}

export function getPopularCategories(): CategoryStats[] {
  return [
    { category: 'Smart Feeding', count: 580, percentage: 22.4, conversionRate: 28.5, averagePrice: 89.99 },
    { category: 'Entertainment', count: 490, percentage: 18.9, conversionRate: 22.1, averagePrice: 74.99 },
    { category: 'Health & Grooming', count: 420, percentage: 16.2, conversionRate: 19.8, averagePrice: 114.99 },
    { category: 'Tracking & Safety', count: 380, percentage: 14.7, conversionRate: 17.3, averagePrice: 79.99 },
    { category: 'Sleep & Comfort', count: 340, percentage: 13.1, conversionRate: 15.6, averagePrice: 149.99 },
    { category: 'Accessories', count: 380, percentage: 14.7, conversionRate: 14.2, averagePrice: 54.99 },
  ];
}

export function getProductTrends(): ProductTrend[] {
  return products.map((product) => {
    const seed = product.productId;
    const current = Math.floor(seededRandom(seed, 1) * 450) + 50;
    const previous = Math.floor(seededRandom(seed, 8) * 420) + 40;
    const growthRate = parseFloat((((current - previous) / previous) * 100).toFixed(1));
    const trendDirection: 'up' | 'down' | 'stable' =
      growthRate > 5 ? 'up' : growthRate < -5 ? 'down' : 'stable';
    return {
      productId: product.productId,
      productName: product.name,
      currentWishlistCount: current,
      previousWishlistCount: previous,
      growthRate,
      trendDirection,
    };
  });
}
