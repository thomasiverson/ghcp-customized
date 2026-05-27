import express from 'express';
import { products as seedProducts } from '../seedData';
import { PriceAlert, WishlistItem } from '../models/wishlist';
import { checkPriceUpdates } from '../services/priceTracker';

const router = express.Router();

type UserWishlistState = {
  items: WishlistItem[];
  alerts: PriceAlert[];
  nextAlertId: number;
};

const createSeedWishlistItems = (): WishlistItem[] => {
  const seeded = seedProducts.slice(0, 4);
  return seeded.map((product, index) => {
    const discount = product.discount ?? 0;
    const currentPrice = Number((product.price * (1 - discount)).toFixed(2));
    const now = new Date().toISOString();

    return {
      wishlistItemId: index + 1,
      wishlistId: 1,
      productId: product.productId,
      addedAt: now,
      priceWhenAdded: currentPrice,
      currentPrice,
      lowestPrice: currentPrice,
      highestPrice: currentPrice,
      targetPrice: Number((currentPrice * 0.9).toFixed(2)),
      lastPriceCheck: now,
      priceAlerts: true,
      priceHistory: [
        {
          price: currentPrice,
          timestamp: now,
          discount: discount > 0 ? Number((discount * 100).toFixed(2)) : undefined
        }
      ]
    };
  });
};

let userWishlists: Record<number, UserWishlistState> = {
  1: {
    items: createSeedWishlistItems(),
    alerts: [],
    nextAlertId: 1
  }
};

const getOrCreateUserState = (userId: number): UserWishlistState => {
  if (!userWishlists[userId]) {
    userWishlists[userId] = {
      items: createSeedWishlistItems().map((item, index) => ({
        ...item,
        wishlistItemId: index + 1,
        wishlistId: userId
      })),
      alerts: [],
      nextAlertId: 1
    };
  }

  return userWishlists[userId];
};

const refreshPrices = (userId: number): UserWishlistState => {
  const state = getOrCreateUserState(userId);
  const result = checkPriceUpdates(state.items, userId, state.nextAlertId);
  state.nextAlertId = result.nextAlertId;
  state.alerts = [...result.alerts, ...state.alerts];
  return state;
};

export const runWishlistPriceCheck = (): void => {
  Object.keys(userWishlists).forEach((userKey) => {
    const userId = Number(userKey);
    refreshPrices(userId);
  });
};

export const resetWishlists = (): void => {
  userWishlists = {
    1: {
      items: createSeedWishlistItems(),
      alerts: [],
      nextAlertId: 1
    }
  };
};

router.get('/:userId/items', (req, res) => {
  const userId = Number(req.params.userId);
  if (Number.isNaN(userId)) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  const state = refreshPrices(userId);
  res.json(state.items);
});

router.get('/:userId/items/:productId/price-history', (req, res) => {
  const userId = Number(req.params.userId);
  const productId = Number(req.params.productId);
  const state = refreshPrices(userId);

  const item = state.items.find((entry) => entry.productId === productId);
  if (!item) {
    res.status(404).json({ message: 'Wishlist item not found' });
    return;
  }

  res.json(item.priceHistory);
});

router.post('/:userId/items/:productId/set-alert', (req, res) => {
  const userId = Number(req.params.userId);
  const productId = Number(req.params.productId);
  const { targetPrice, priceAlerts } = req.body as { targetPrice?: number; priceAlerts?: boolean };

  const state = getOrCreateUserState(userId);
  const item = state.items.find((entry) => entry.productId === productId);
  if (!item) {
    res.status(404).json({ message: 'Wishlist item not found' });
    return;
  }

  if (targetPrice !== undefined) {
    item.targetPrice = Number(targetPrice);
  }

  if (priceAlerts !== undefined) {
    item.priceAlerts = Boolean(priceAlerts);
  }

  res.json(item);
});

router.get('/:userId/alerts', (req, res) => {
  const userId = Number(req.params.userId);
  const state = refreshPrices(userId);
  const activeAlerts = state.alerts.filter((alert) => !alert.dismissed);
  res.json(activeAlerts);
});

router.post('/:userId/alerts/:alertId/dismiss', (req, res) => {
  const userId = Number(req.params.userId);
  const alertId = Number(req.params.alertId);
  const state = getOrCreateUserState(userId);

  const targetAlert = state.alerts.find((entry) => entry.alertId === alertId);
  if (!targetAlert) {
    res.status(404).json({ message: 'Alert not found' });
    return;
  }

  targetAlert.dismissed = true;
  res.json(targetAlert);
});

router.get('/:userId/summary', (req, res) => {
  const userId = Number(req.params.userId);
  const state = getOrCreateUserState(userId);

  const savedByWaiting = state.items.reduce((sum, item) => sum + Math.max(item.priceWhenAdded - item.currentPrice, 0), 0);
  const averageDiscount = state.items.length
    ? state.items.reduce((sum, item) => {
      if (!item.priceWhenAdded) {
        return sum;
      }
      return sum + ((item.priceWhenAdded - item.currentPrice) / item.priceWhenAdded) * 100;
    }, 0) / state.items.length
    : 0;

  const volatilityScores = state.items.map((item) => {
    if (item.priceHistory.length < 2) {
      return 0;
    }

    const deltas = item.priceHistory.slice(1).map((point, index) => Math.abs(point.price - item.priceHistory[index].price));
    const avg = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
    return Number(avg.toFixed(2));
  });

  const averageVolatility = volatilityScores.length
    ? Number((volatilityScores.reduce((sum, value) => sum + value, 0) / volatilityScores.length).toFixed(2))
    : 0;

  res.json({
    savedByWaiting: Number(savedByWaiting.toFixed(2)),
    averageDiscountAchieved: Number(averageDiscount.toFixed(2)),
    bestTimeToBuy: averageVolatility < 1 ? 'Stable anytime' : 'Watch for dips after checks',
    priceStability: averageVolatility < 1 ? 'Stable' : averageVolatility < 3 ? 'Moderate' : 'Volatile',
    averageVolatility
  });
});

export default router;
