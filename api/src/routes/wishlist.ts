import express from 'express';
import { randomUUID } from 'crypto';
import { Wishlist, WishlistActivity, WishlistItem, WishlistShare } from '../models/wishlist';

const router = express.Router();

let wishlists: Wishlist[] = [];
let shares: WishlistShare[] = [];
let activities: WishlistActivity[] = [];
const reservationLocks = new Set<string>();
const publicViewRateLimit = new Map<string, number[]>();

const isValidUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const isExpired = (date?: string) => (date ? new Date(date).getTime() < Date.now() : false);
const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const cleanupExpiredReservations = () => {
  wishlists = wishlists.map((wishlist) => ({
    ...wishlist,
    items: wishlist.items.map((item) => {
      if (item.reservedUntil && isExpired(item.reservedUntil) && !item.isPurchased) {
        return {
          ...item,
          reservedBy: undefined,
          reservedUntil: undefined,
        };
      }
      return item;
    }),
  }));

  const cutoff = Date.now() - 60_000;
  for (const [key, timestamps] of publicViewRateLimit.entries()) {
    const recent = timestamps.filter((timestamp) => timestamp >= cutoff);
    if (recent.length === 0) {
      publicViewRateLimit.delete(key);
    } else {
      publicViewRateLimit.set(key, recent);
    }
  }
};

const cleanupTimer = setInterval(cleanupExpiredReservations, 5 * 60 * 1000);
cleanupTimer.unref();

const pushActivity = (wishlistId: number, actorId: string, type: WishlistActivity['type'], message: string) => {
  activities.unshift({
    activityId: activities.length + 1,
    wishlistId,
    actorId,
    type,
    message,
    createdAt: new Date().toISOString(),
  });
};

const toPublicWishlist = (wishlist: Wishlist): Wishlist => ({
  ...wishlist,
  items: wishlist.items.map((item) => ({
    ...item,
    notes: undefined,
    targetPrice: undefined,
    ...(wishlist.hidePricesInPublic ? { price: 0 } : {}),
  })),
});

const canEdit = (wishlist: Wishlist, userId?: string) => {
  if (!userId) {
    return false;
  }
  return wishlist.userId === userId || wishlist.collaborators.includes(userId);
};

const getWishlistById = (wishlistId: number) => wishlists.find((wishlist) => wishlist.wishlistId === wishlistId);

const getLockKey = (wishlistId: number, itemId: number) => `${wishlistId}:${itemId}`;

const withReservationLock = async <T>(wishlistId: number, itemId: number, execute: () => T): Promise<T> => {
  const lockKey = getLockKey(wishlistId, itemId);
  if (reservationLocks.has(lockKey)) {
    throw new Error('Item is currently being updated. Please retry.');
  }

  reservationLocks.add(lockKey);
  try {
    return execute();
  } finally {
    reservationLocks.delete(lockKey);
  }
};

const nextWishlistId = () => (wishlists.length ? Math.max(...wishlists.map((wishlist) => wishlist.wishlistId)) + 1 : 1);
const nextShareId = () => (shares.length ? Math.max(...shares.map((share) => share.shareId)) + 1 : 1);
const nextItemId = (wishlist: Wishlist) => (wishlist.items.length ? Math.max(...wishlist.items.map((item) => item.itemId)) + 1 : 1);

export const resetWishlists = () => {
  wishlists = [];
  shares = [];
  activities = [];
  reservationLocks.clear();
  publicViewRateLimit.clear();
};

// POST /api/wishlists - Create named wishlist
router.post('/', (req, res) => {
  const now = new Date().toISOString();
  const {
    userId,
    name,
    description,
    visibility = 'private',
    isGiftRegistry = false,
    eventDate,
    collaborators = [],
    thankYouMessage,
    hidePricesInPublic = false,
    defaultWishlist = false,
    items = [],
  } = req.body;

  if (!userId || !name) {
    res.status(400).json({ error: 'userId and name are required' });
    return;
  }

  const wishlist: Wishlist = {
    wishlistId: nextWishlistId(),
    userId,
    name,
    description,
    visibility,
    shareToken: randomUUID(),
    isGiftRegistry,
    eventDate,
    collaborators,
    createdAt: now,
    updatedAt: now,
    thankYouMessage,
    hidePricesInPublic,
    defaultWishlist,
    items: (items as Partial<WishlistItem>[]).map((item, index) => ({
      itemId: item.itemId ?? index + 1,
      productId: item.productId ?? 0,
      name: item.name ?? 'Unnamed item',
      price: item.price ?? 0,
      url: item.url,
      notes: item.notes,
      targetPrice: item.targetPrice,
      addedBy: item.addedBy ?? userId,
      addedAt: item.addedAt ?? now,
      isPurchased: item.isPurchased ?? false,
      purchasedBy: item.purchasedBy,
      purchasedAt: item.purchasedAt,
      reservedBy: item.reservedBy,
      reservedUntil: item.reservedUntil,
      comments: item.comments ?? [],
    })),
  };

  wishlists.push(wishlist);
  res.status(201).json(wishlist);
});

// GET /api/wishlists/:userId - Get user's wishlists
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const userWishlists = wishlists.filter((wishlist) => wishlist.userId === userId || wishlist.collaborators.includes(userId));
  res.json(userWishlists);
});

// PATCH /api/wishlists/:id - Update wishlist settings
router.patch('/:id', (req, res) => {
  const wishlistId = Number(req.params.id);
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  const { userId } = req.body;
  if (!canEdit(wishlist, userId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const allowedFields: Array<keyof Wishlist> = [
    'name',
    'description',
    'visibility',
    'isGiftRegistry',
    'eventDate',
    'collaborators',
    'thankYouMessage',
    'hidePricesInPublic',
    'defaultWishlist',
    'items',
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      (wishlist[field] as Wishlist[typeof field]) = req.body[field];
    }
  }

  if (req.body.revokeShareLinks === true) {
    wishlist.shareToken = randomUUID();
    shares = shares.filter((share) => share.wishlistId !== wishlist.wishlistId);
  }

  wishlist.updatedAt = new Date().toISOString();
  pushActivity(wishlist.wishlistId, userId, 'wishlist_updated', `${userId} updated wishlist settings`);
  res.json(wishlist);
});

// DELETE /api/wishlists/:id - Delete wishlist
router.delete('/:id', (req, res) => {
  const wishlistId = Number(req.params.id);
  const { userId } = req.body;
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  if (wishlist.userId !== userId) {
    res.status(403).json({ error: 'Only owner can delete wishlist' });
    return;
  }

  wishlists = wishlists.filter((entry) => entry.wishlistId !== wishlistId);
  shares = shares.filter((share) => share.wishlistId !== wishlistId);
  activities = activities.filter((activity) => activity.wishlistId !== wishlistId);
  res.status(204).send();
});

// POST /api/wishlists/:id/share - Generate share link
router.post('/:id/share', (req, res) => {
  const wishlistId = Number(req.params.id);
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  const {
    userId,
    shareMethod = 'link',
    sharedWith,
    expiresAt,
  }: {
    userId?: string;
    shareMethod?: WishlistShare['shareMethod'];
    sharedWith?: string;
    expiresAt?: string;
  } = req.body;

  if (!userId || !canEdit(wishlist, userId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const share: WishlistShare = {
    shareId: nextShareId(),
    wishlistId,
    shareToken: wishlist.shareToken,
    sharedBy: userId,
    sharedWith,
    shareMethod,
    createdAt: new Date().toISOString(),
    expiresAt,
    views: 0,
  };

  shares.push(share);
  pushActivity(wishlist.wishlistId, userId, 'share_created', `${userId} created a ${shareMethod} share`);
  res.status(201).json({
    ...share,
    shareUrl: `/api/wishlists/shared/${wishlist.shareToken}`,
  });
});

// GET /api/wishlists/shared/:token - View shared wishlist (public)
router.get('/shared/:token', (req, res) => {
  cleanupExpiredReservations();

  const { token } = req.params;
  if (!isValidUuid(token)) {
    res.status(400).json({ error: 'Invalid share token format' });
    return;
  }

  const requesterIp = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `${token}:${requesterIp}`;
  const now = Date.now();
  const recentRequests = (publicViewRateLimit.get(rateLimitKey) ?? []).filter((timestamp) => now - timestamp < 60_000);

  if (recentRequests.length >= 30) {
    res.status(429).json({ error: 'Too many requests for this share link. Please retry later.' });
    return;
  }

  recentRequests.push(now);
  publicViewRateLimit.set(rateLimitKey, recentRequests);

  const wishlist = wishlists.find((entry) => entry.shareToken === token);
  if (!wishlist) {
    res.status(404).json({ error: 'Shared wishlist not found' });
    return;
  }

  if (wishlist.visibility === 'private') {
    res.status(403).json({ error: 'Wishlist is private' });
    return;
  }

  const matchingShares = shares.filter((share) => share.shareToken === token && !isExpired(share.expiresAt));
  matchingShares.forEach((share) => {
    share.views += 1;
  });

  res.json({
    wishlist: toPublicWishlist(wishlist),
    shareAnalytics: {
      totalViews: matchingShares.reduce((sum, share) => sum + share.views, 0),
      shareCount: matchingShares.length,
    },
  });
});

// GET /api/wishlists/shared/:token/og-image - Generate social preview image
router.get('/shared/:token/og-image', (req, res) => {
  const { token } = req.params;
  if (!isValidUuid(token)) {
    res.status(400).json({ error: 'Invalid share token format' });
    return;
  }

  const wishlist = wishlists.find((entry) => entry.shareToken === token);
  if (!wishlist || wishlist.visibility === 'private') {
    res.status(404).json({ error: 'Shared wishlist not found' });
    return;
  }

  const itemPreview = wishlist.items
    .slice(0, 3)
    .map((item, index) => `<text x="40" y="${140 + index * 38}" font-size="24" fill="#1f2937">• ${escapeXml(item.name)}</text>`)
    .join('');

  const safeWishlistName = escapeXml(wishlist.name);
  const safeWishlistDescription = escapeXml(wishlist.description ?? 'Shared wishlist preview');
  const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"630\" viewBox=\"0 0 1200 630\">\n  <defs>\n    <linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0%\" stop-color=\"#ecfdf5\" />\n      <stop offset=\"100%\" stop-color=\"#d1fae5\" />\n    </linearGradient>\n  </defs>\n  <rect width=\"1200\" height=\"630\" fill=\"url(#g)\" />\n  <text x=\"40\" y=\"80\" font-size=\"50\" font-weight=\"700\" fill=\"#065f46\">${safeWishlistName}</text>\n  <text x=\"40\" y=\"112\" font-size=\"24\" fill=\"#047857\">${safeWishlistDescription}</text>\n  ${itemPreview}\n  <text x=\"40\" y=\"580\" font-size=\"22\" fill=\"#064e3b\">OctoCAT Supply Wishlists</text>\n</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// POST /api/wishlists/:id/collaborators - Add collaborator
router.post('/:id/collaborators', (req, res) => {
  const wishlistId = Number(req.params.id);
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  const { userId, collaboratorId } = req.body;
  if (wishlist.userId !== userId) {
    res.status(403).json({ error: 'Only owner can manage collaborators' });
    return;
  }

  if (!collaboratorId) {
    res.status(400).json({ error: 'collaboratorId is required' });
    return;
  }

  if (!wishlist.collaborators.includes(collaboratorId)) {
    wishlist.collaborators.push(collaboratorId);
    wishlist.updatedAt = new Date().toISOString();
    pushActivity(wishlist.wishlistId, userId, 'collaborator_added', `${userId} added collaborator ${collaboratorId}`);
  }

  res.status(201).json(wishlist);
});

// DELETE /api/wishlists/:id/collaborators/:userId - Remove collaborator
router.delete('/:id/collaborators/:userId', (req, res) => {
  const wishlistId = Number(req.params.id);
  const collaboratorId = req.params.userId;
  const actorId = req.body.userId as string | undefined;
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  if (wishlist.userId !== actorId) {
    res.status(403).json({ error: 'Only owner can manage collaborators' });
    return;
  }

  wishlist.collaborators = wishlist.collaborators.filter((entry) => entry !== collaboratorId);
  wishlist.updatedAt = new Date().toISOString();
  pushActivity(wishlist.wishlistId, actorId, 'collaborator_removed', `${actorId} removed collaborator ${collaboratorId}`);
  res.status(204).send();
});

// POST /api/wishlists/:id/items - add item for collaborative wishlist usage
router.post('/:id/items', (req, res) => {
  const wishlistId = Number(req.params.id);
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  const { userId, productId, name, price, notes, targetPrice, url } = req.body;
  if (!canEdit(wishlist, userId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const item: WishlistItem = {
    itemId: nextItemId(wishlist),
    productId: Number(productId) || 0,
    name,
    price: Number(price) || 0,
    notes,
    targetPrice,
    url,
    addedBy: userId,
    addedAt: new Date().toISOString(),
    isPurchased: false,
    comments: [],
  };

  wishlist.items.push(item);
  wishlist.updatedAt = new Date().toISOString();
  pushActivity(wishlist.wishlistId, userId, 'item_added', `${userId} added ${name}`);
  res.status(201).json(item);
});

// DELETE /api/wishlists/:id/items/:itemId - remove item for collaborative wishlist usage
router.delete('/:id/items/:itemId', (req, res) => {
  const wishlistId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const userId = req.body.userId as string | undefined;
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  if (!canEdit(wishlist, userId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const actorId = userId ?? 'unknown';

  const item = wishlist.items.find((entry) => entry.itemId === itemId);
  wishlist.items = wishlist.items.filter((entry) => entry.itemId !== itemId);
  wishlist.updatedAt = new Date().toISOString();
  pushActivity(wishlist.wishlistId, actorId, 'item_removed', `${actorId} removed ${item?.name ?? 'an item'}`);
  res.status(204).send();
});

// POST /api/wishlists/:id/items/:itemId/comments - comments for collaboration feed
router.post('/:id/items/:itemId/comments', (req, res) => {
  const wishlistId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  const { userId, message } = req.body;
  if (!canEdit(wishlist, userId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const item = wishlist.items.find((entry) => entry.itemId === itemId);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  item.comments = item.comments ?? [];
  const comment = {
    commentId: item.comments.length + 1,
    userId,
    message,
    createdAt: new Date().toISOString(),
  };
  item.comments.push(comment);
  wishlist.updatedAt = new Date().toISOString();
  pushActivity(wishlist.wishlistId, userId, 'item_commented', `${userId} commented on ${item.name}`);
  res.status(201).json(comment);
});

// GET /api/wishlists/:id/activity - activity feed for collaborative mode
router.get('/:id/activity', (req, res) => {
  const wishlistId = Number(req.params.id);
  const userId = req.query.userId as string | undefined;
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  if (!canEdit(wishlist, userId) && wishlist.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  res.json(activities.filter((activity) => activity.wishlistId === wishlistId));
});

const validateCaptchaToken = (captchaToken?: string) => Boolean(captchaToken && captchaToken.trim().length >= 4);

// POST /api/wishlists/:id/items/:itemId/reserve - Reserve item
router.post('/:id/items/:itemId/reserve', async (req, res) => {
  const wishlistId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { userId, captchaToken } = req.body as { userId?: string; captchaToken?: string };

  if (!validateCaptchaToken(captchaToken)) {
    res.status(400).json({ error: 'captchaToken is required for anti-abuse validation' });
    return;
  }

  try {
    const result = await withReservationLock(wishlistId, itemId, () => {
      const wishlist = getWishlistById(wishlistId);
      if (!wishlist) {
        return { status: 404, body: { error: 'Wishlist not found' } };
      }

      const item = wishlist.items.find((entry) => entry.itemId === itemId);
      if (!item) {
        return { status: 404, body: { error: 'Item not found' } };
      }

      if (item.isPurchased) {
        return { status: 409, body: { error: 'Item already purchased' } };
      }

      if (item.reservedUntil && !isExpired(item.reservedUntil) && item.reservedBy !== userId) {
        return { status: 409, body: { error: 'Item is already reserved' } };
      }

      item.reservedBy = userId;
      item.reservedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      wishlist.updatedAt = new Date().toISOString();
      pushActivity(wishlist.wishlistId, userId ?? 'anonymous', 'item_reserved', `${userId} reserved ${item.name}`);
      return { status: 200, body: item };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(409).json({ error: (error as Error).message });
  }
});

// POST /api/wishlists/:id/items/:itemId/purchase - Mark as purchased
router.post('/:id/items/:itemId/purchase', async (req, res) => {
  const wishlistId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { userId, captchaToken } = req.body as { userId?: string; captchaToken?: string };

  if (!validateCaptchaToken(captchaToken)) {
    res.status(400).json({ error: 'captchaToken is required for anti-abuse validation' });
    return;
  }

  try {
    const result = await withReservationLock(wishlistId, itemId, () => {
      const wishlist = getWishlistById(wishlistId);
      if (!wishlist) {
        return { status: 404, body: { error: 'Wishlist not found' } };
      }

      const item = wishlist.items.find((entry) => entry.itemId === itemId);
      if (!item) {
        return { status: 404, body: { error: 'Item not found' } };
      }

      if (item.isPurchased) {
        return { status: 409, body: { error: 'Item already purchased' } };
      }

      item.isPurchased = true;
      item.purchasedBy = userId;
      item.purchasedAt = new Date().toISOString();
      item.reservedBy = undefined;
      item.reservedUntil = undefined;
      wishlist.updatedAt = new Date().toISOString();
      pushActivity(wishlist.wishlistId, userId ?? 'anonymous', 'item_purchased', `${userId} purchased ${item.name}`);
      return { status: 200, body: item };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(409).json({ error: (error as Error).message });
  }
});

// DELETE /api/wishlists/:id/items/:itemId/unreserve - Cancel reservation
router.delete('/:id/items/:itemId/unreserve', async (req, res) => {
  const wishlistId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { userId, captchaToken } = req.body as { userId?: string; captchaToken?: string };

  if (!validateCaptchaToken(captchaToken)) {
    res.status(400).json({ error: 'captchaToken is required for anti-abuse validation' });
    return;
  }

  try {
    const result = await withReservationLock(wishlistId, itemId, () => {
      const wishlist = getWishlistById(wishlistId);
      if (!wishlist) {
        return { status: 404, body: { error: 'Wishlist not found' } };
      }

      const item = wishlist.items.find((entry) => entry.itemId === itemId);
      if (!item) {
        return { status: 404, body: { error: 'Item not found' } };
      }

      if (!item.reservedBy) {
        return { status: 409, body: { error: 'Item is not reserved' } };
      }

      if (item.reservedBy !== userId && wishlist.userId !== userId) {
        return { status: 403, body: { error: 'Only reserving user or owner can unreserve' } };
      }

      item.reservedBy = undefined;
      item.reservedUntil = undefined;
      wishlist.updatedAt = new Date().toISOString();
      return { status: 200, body: item };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(409).json({ error: (error as Error).message });
  }
});

// GET /api/wishlists/:id/registry-stats - Get purchase status
router.get('/:id/registry-stats', (req, res) => {
  const wishlistId = Number(req.params.id);
  const wishlist = getWishlistById(wishlistId);

  if (!wishlist) {
    res.status(404).json({ error: 'Wishlist not found' });
    return;
  }

  const totalItems = wishlist.items.length;
  const purchasedItems = wishlist.items.filter((item) => item.isPurchased).length;
  const reservedItems = wishlist.items.filter((item) => item.reservedBy && !isExpired(item.reservedUntil)).length;
  const wishlistShares = shares.filter((share) => share.wishlistId === wishlistId);
  const viewCount = wishlistShares.reduce((sum, share) => sum + share.views, 0);

  const shareUsage = wishlistShares.reduce<Record<WishlistShare['shareMethod'], number>>(
      (accumulator, share) => {
        accumulator[share.shareMethod] += 1;
        return accumulator;
      },
      { link: 0, email: 0, social: 0 },
  );

  const productShareCounts: Record<number, number> = {};
  wishlist.items.forEach((item) => {
    const weightedCount = (item.isPurchased ? 1 : 0) + shareUsage.social + shareUsage.email + shareUsage.link;
    productShareCounts[item.productId] = (productShareCounts[item.productId] ?? 0) + weightedCount;
  });

  const mostSharedProducts = Object.entries(productShareCounts)
    .map(([productId, count]) => ({ productId: Number(productId), shares: count }))
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 5);

  res.json({
    wishlistId,
    totalItems,
    purchasedItems,
    reservedItems,
    progress: totalItems === 0 ? 0 : purchasedItems / totalItems,
    itemsPurchasedThroughRegistry: purchasedItems,
    totalViews: viewCount,
    conversionRate: viewCount === 0 ? 0 : purchasedItems / viewCount,
    shareMethodUsage: shareUsage,
    mostSharedProducts,
  });
});

export default router;
