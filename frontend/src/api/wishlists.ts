import axios from 'axios';
import { api } from './config';

export interface WishlistItemComment {
  commentId: number;
  userId: string;
  message: string;
  createdAt: string;
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

export interface WishlistActivity {
  activityId: number;
  wishlistId: number;
  actorId: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface RegistryStats {
  wishlistId: number;
  totalItems: number;
  purchasedItems: number;
  reservedItems: number;
  progress: number;
  itemsPurchasedThroughRegistry: number;
  totalViews: number;
  conversionRate: number;
  shareMethodUsage: {
    link: number;
    email: number;
    social: number;
  };
  mostSharedProducts: Array<{
    productId: number;
    shares: number;
  }>;
}

const wishlistsBaseUrl = `${api.baseURL}/api/wishlists`;

interface CreateWishlistPayload {
  userId: string;
  name: string;
  description?: string;
  visibility?: Wishlist['visibility'];
  isGiftRegistry?: boolean;
  eventDate?: string;
  collaborators?: string[];
  items?: Array<Partial<WishlistItem>>;
}

export const wishlistApi = {
  listByUser: async (userId: string): Promise<Wishlist[]> => {
    const { data } = await axios.get(`${wishlistsBaseUrl}/${encodeURIComponent(userId)}`);
    return data;
  },
  create: async (payload: CreateWishlistPayload): Promise<Wishlist> => {
    const { data } = await axios.post(wishlistsBaseUrl, payload);
    return data;
  },
  patch: async (wishlistId: number, payload: Record<string, unknown>): Promise<Wishlist> => {
    const { data } = await axios.patch(`${wishlistsBaseUrl}/${wishlistId}`, payload);
    return data;
  },
  remove: async (wishlistId: number, userId: string): Promise<void> => {
    await axios.delete(`${wishlistsBaseUrl}/${wishlistId}`, { data: { userId } });
  },
  share: async (
    wishlistId: number,
    payload: { userId: string; shareMethod: 'link' | 'email' | 'social'; sharedWith?: string; expiresAt?: string },
  ) => {
    const { data } = await axios.post(`${wishlistsBaseUrl}/${wishlistId}/share`, payload);
    return data;
  },
  getShared: async (token: string) => {
    const { data } = await axios.get(`${wishlistsBaseUrl}/shared/${token}`);
    return data as {
      wishlist: Wishlist;
      shareAnalytics: {
        totalViews: number;
        shareCount: number;
      };
    };
  },
  addCollaborator: async (wishlistId: number, userId: string, collaboratorId: string): Promise<Wishlist> => {
    const { data } = await axios.post(`${wishlistsBaseUrl}/${wishlistId}/collaborators`, {
      userId,
      collaboratorId,
    });
    return data;
  },
  removeCollaborator: async (wishlistId: number, ownerId: string, collaboratorId: string): Promise<void> => {
    await axios.delete(`${wishlistsBaseUrl}/${wishlistId}/collaborators/${encodeURIComponent(collaboratorId)}`, {
      data: { userId: ownerId },
    });
  },
  addItem: async (
    wishlistId: number,
    payload: { userId: string; productId?: number; name: string; price?: number; notes?: string; targetPrice?: number; url?: string },
  ): Promise<WishlistItem> => {
    const { data } = await axios.post(`${wishlistsBaseUrl}/${wishlistId}/items`, payload);
    return data;
  },
  removeItem: async (wishlistId: number, itemId: number, userId: string): Promise<void> => {
    await axios.delete(`${wishlistsBaseUrl}/${wishlistId}/items/${itemId}`, { data: { userId } });
  },
  commentOnItem: async (wishlistId: number, itemId: number, userId: string, message: string): Promise<WishlistItemComment> => {
    const { data } = await axios.post(`${wishlistsBaseUrl}/${wishlistId}/items/${itemId}/comments`, {
      userId,
      message,
    });
    return data;
  },
  reserveItem: async (wishlistId: number, itemId: number, userId: string, captchaToken: string): Promise<WishlistItem> => {
    const { data } = await axios.post(`${wishlistsBaseUrl}/${wishlistId}/items/${itemId}/reserve`, { userId, captchaToken });
    return data;
  },
  purchaseItem: async (wishlistId: number, itemId: number, userId: string, captchaToken: string): Promise<WishlistItem> => {
    const { data } = await axios.post(`${wishlistsBaseUrl}/${wishlistId}/items/${itemId}/purchase`, { userId, captchaToken });
    return data;
  },
  unreserveItem: async (wishlistId: number, itemId: number, userId: string, captchaToken: string): Promise<WishlistItem> => {
    const { data } = await axios.delete(`${wishlistsBaseUrl}/${wishlistId}/items/${itemId}/unreserve`, {
      data: { userId, captchaToken },
    });
    return data;
  },
  getRegistryStats: async (wishlistId: number): Promise<RegistryStats> => {
    const { data } = await axios.get(`${wishlistsBaseUrl}/${wishlistId}/registry-stats`);
    return data;
  },
  getActivity: async (wishlistId: number, userId: string): Promise<WishlistActivity[]> => {
    const { data } = await axios.get(`${wishlistsBaseUrl}/${wishlistId}/activity`, {
      params: { userId },
    });
    return data;
  },
};
