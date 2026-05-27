import { WishlistItem } from './types';
import { calculateDiscountPercent } from './priceUtils';

interface PriceAlertBadgeProps {
  item: WishlistItem;
}

export default function PriceAlertBadge({ item }: PriceAlertBadgeProps) {
  const discount = calculateDiscountPercent(item.priceWhenAdded, item.currentPrice);
  const targetMet = item.targetPrice !== undefined && item.currentPrice <= item.targetPrice;
  const bestPriceYet = item.lowestPrice !== undefined && item.currentPrice <= item.lowestPrice;

  if (targetMet) {
    return <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Target Price Met!</span>;
  }

  if (discount >= 10) {
    return <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-1 text-xs font-semibold text-primary">Price Drop! {discount.toFixed(0)}%</span>;
  }

  if (bestPriceYet) {
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Best Price Yet!</span>;
  }

  return null;
}
