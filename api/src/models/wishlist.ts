/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       required:
 *         - wishlistId
 *         - userId
 *         - name
 *         - visibility
 *         - shareToken
 *         - isGiftRegistry
 *         - collaborators
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         wishlistId:
 *           type: integer
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         visibility:
 *           type: string
 *           enum: [private, public, unlisted]
 *         shareToken:
 *           type: string
 *         isGiftRegistry:
 *           type: boolean
 *         eventDate:
 *           type: string
 *         collaborators:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */
export interface Wishlist {
  wishlistId: number;
  userId: string;
  name: string;
  description?: string;
  visibility: 'private' | 'public' | 'unlisted';
  shareToken: string;
  isGiftRegistry: boolean;
  eventDate?: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
  thankYouMessage?: string;
  hidePricesInPublic?: boolean;
  defaultWishlist?: boolean;
  items: WishlistItem[];
}

export interface WishlistItem {
  itemId: number;
  productId: number;
  name: string;
  price: number;
  url?: string;
  notes?: string;
  targetPrice?: number;
  addedBy: string;
  addedAt: string;
  isPurchased: boolean;
  purchasedBy?: string;
  purchasedAt?: string;
  reservedBy?: string;
  reservedUntil?: string;
  comments?: WishlistItemComment[];
}

export interface WishlistItemComment {
  commentId: number;
  userId: string;
  message: string;
  createdAt: string;
}

export interface WishlistShare {
  shareId: number;
  wishlistId: number;
  shareToken: string;
  sharedBy: string;
  sharedWith?: string;
  shareMethod: 'link' | 'email' | 'social';
  createdAt: string;
  expiresAt?: string;
  views: number;
}

export interface WishlistActivity {
  activityId: number;
  wishlistId: number;
  actorId: string;
  type: 'wishlist_updated' | 'item_added' | 'item_removed' | 'item_commented' | 'item_purchased' | 'item_reserved' | 'share_created' | 'collaborator_added' | 'collaborator_removed';
  message: string;
  createdAt: string;
}
