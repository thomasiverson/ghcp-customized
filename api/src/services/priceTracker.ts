import { products as seedProducts } from '../seedData';
import { PriceAlert, PriceAlertType, PricePoint, WishlistItem } from '../models/wishlist';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
// Throttle checks so repeated requests within the same minute do not trigger extra recalculations.
const MIN_CHECK_INTERVAL_MS = 60 * 1000;
const MAX_HISTORY_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const PRICE_WAVE_PERIOD = 7;
const PRICE_WAVE_OFFSET = 3;
const PRICE_WAVE_FACTOR = 0.02;

let lastGlobalCheck = 0;
let pollingTimer: NodeJS.Timeout | undefined;

type PriceChangeResult = {
  item: WishlistItem;
  previousPrice: number;
  newPrice: number;
  point: PricePoint;
};

const getEffectiveBasePrice = (productId: number): number => {
  const product = seedProducts.find((entry) => entry.productId === productId);
  if (!product) {
    return 0;
  }

  const discount = product.discount ?? 0;
  const discounted = product.price * (1 - discount);
  return Number(discounted.toFixed(2));
};

const calculateSimulatedPrice = (item: WishlistItem, now: Date): number => {
  const base = getEffectiveBasePrice(item.productId);
  if (!base) {
    return item.currentPrice;
  }

  const wave = ((now.getUTCHours() + item.productId) % PRICE_WAVE_PERIOD) - PRICE_WAVE_OFFSET;
  const factor = 1 + wave * PRICE_WAVE_FACTOR;
  const nextPrice = Number((base * factor).toFixed(2));
  return nextPrice > 0 ? nextPrice : base;
};

export const recordPriceChange = (item: WishlistItem, newPrice: number, now = new Date()): PriceChangeResult | null => {
  const previousPrice = item.currentPrice;
  if (newPrice === previousPrice) {
    item.lastPriceCheck = now.toISOString();
    return null;
  }

  const point: PricePoint = {
    price: newPrice,
    timestamp: now.toISOString(),
    discount: previousPrice > 0 ? Number((((previousPrice - newPrice) / previousPrice) * 100).toFixed(2)) : undefined
  };

  item.currentPrice = newPrice;
  item.lastPriceCheck = point.timestamp;
  item.lowestPrice = Math.min(item.lowestPrice ?? newPrice, newPrice);
  item.highestPrice = Math.max(item.highestPrice ?? newPrice, newPrice);
  item.priceHistory = [...item.priceHistory, point].filter((entry) => {
    const age = now.getTime() - new Date(entry.timestamp).getTime();
    return age <= MAX_HISTORY_AGE_MS;
  });

  return { item, previousPrice, newPrice, point };
};

export const detectPriceDrops = (previousPrice: number, newPrice: number): { percentageDrop: number; threshold: 10 | 15 | 20 } | null => {
  if (previousPrice <= 0 || newPrice >= previousPrice) {
    return null;
  }

  const percentageDrop = Number((((previousPrice - newPrice) / previousPrice) * 100).toFixed(2));
  if (percentageDrop >= 20) {
    return { percentageDrop, threshold: 20 };
  }
  if (percentageDrop >= 15) {
    return { percentageDrop, threshold: 15 };
  }
  if (percentageDrop >= 10) {
    return { percentageDrop, threshold: 10 };
  }
  return null;
};

export const checkTargetPrices = (item: WishlistItem, newPrice: number): boolean => {
  if (item.targetPrice === undefined) {
    return false;
  }

  return newPrice <= item.targetPrice;
};

const createAlert = (
  nextAlertId: number,
  userId: number,
  item: WishlistItem,
  type: PriceAlertType,
  message: string,
  percentageDrop?: number
): PriceAlert => ({
  alertId: nextAlertId,
  userId,
  wishlistItemId: item.wishlistItemId,
  productId: item.productId,
  type,
  message,
  createdAt: new Date().toISOString(),
  percentageDrop,
  dismissed: false
});

export const checkPriceUpdates = (
  userItems: WishlistItem[],
  userId: number,
  nextAlertId: number,
  now = new Date()
): { alerts: PriceAlert[]; nextAlertId: number } => {
  if (now.getTime() - lastGlobalCheck < MIN_CHECK_INTERVAL_MS) {
    return { alerts: [], nextAlertId };
  }

  lastGlobalCheck = now.getTime();
  const newAlerts: PriceAlert[] = [];
  let runningAlertId = nextAlertId;

  userItems.forEach((item) => {
    const priorLowest = item.lowestPrice;
    const nextPrice = calculateSimulatedPrice(item, now);
    const change = recordPriceChange(item, nextPrice, now);
    if (!change || !item.priceAlerts) {
      return;
    }

    const drop = detectPriceDrops(change.previousPrice, change.newPrice);
    if (drop) {
      newAlerts.push(
        createAlert(
          runningAlertId++,
          userId,
          item,
          'PRICE_DROP',
          `Price dropped ${drop.percentageDrop}% for product ${item.productId}`,
          drop.percentageDrop
        )
      );
    }

    if (checkTargetPrices(item, change.newPrice)) {
      newAlerts.push(
        createAlert(
          runningAlertId++,
          userId,
          item,
          'TARGET_MET',
          `Target price reached for product ${item.productId}`
        )
      );
    }

    if (priorLowest !== undefined && change.newPrice < priorLowest) {
      newAlerts.push(
        createAlert(
          runningAlertId++,
          userId,
          item,
          'BEST_PRICE_YET',
          `Best price yet for product ${item.productId}`
        )
      );
    }
  });

  return {
    alerts: newAlerts,
    nextAlertId: runningAlertId
  };
};

export const startPricePolling = (runCheck: () => void): void => {
  if (pollingTimer) {
    return;
  }

  const run = () => {
    runCheck();
    pollingTimer = setTimeout(run, MILLISECONDS_PER_HOUR);
  };

  pollingTimer = setTimeout(run, MILLISECONDS_PER_HOUR);
};

export const stopPricePolling = (): void => {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = undefined;
  }
};

export const resetPriceTrackerState = (): void => {
  lastGlobalCheck = 0;
  stopPricePolling();
};
