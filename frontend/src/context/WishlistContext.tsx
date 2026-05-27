/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  PurchasedWishlistItem,
  WishlistItem,
  WishlistPriority,
  calculateAverageDaysUntilPurchase,
  calculateMostUsedCategories,
  calculatePriorityDistribution,
  normalizeWishlistItem,
  sortWishlistByDateAdded,
  sortWishlistByPrice,
  sortWishlistByPriority,
} from './wishlistUtils';

const WISHLIST_STORAGE_KEY = 'wishlistItems';
const PURCHASED_STORAGE_KEY = 'wishlistPurchasedItems';

interface WishlistAnalytics {
  mostUsedCategories: Array<{ category: string; count: number }>;
  averageDaysUntilPurchase: number;
  priorityDistribution: Record<WishlistPriority, number>;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  purchasedItems: PurchasedWishlistItem[];
  isSaving: boolean;
  updateError: string | null;
  addToWishlist: (productId: number, options?: Partial<WishlistItem>) => void;
  removeFromWishlist: (productId: number) => void;
  updateItemNotes: (productId: number, notes: string) => void;
  updateItemPriority: (productId: number, priority?: WishlistPriority) => void;
  updateItemCategory: (productId: number, category: string) => void;
  updateItemTargetPrice: (productId: number, targetPrice?: number) => void;
  updateItemQuantity: (productId: number, quantity: number) => void;
  moveItemsToCategory: (productIds: number[], category: string) => void;
  setItemsPriority: (productIds: number[], priority: WishlistPriority) => void;
  deleteItems: (productIds: number[]) => void;
  markItemPurchased: (productId: number) => void;
  getItemsByPriority: (priority: WishlistPriority) => WishlistItem[];
  getItemsByCategory: (category: string) => WishlistItem[];
  sortByDateAdded: (items?: WishlistItem[]) => WishlistItem[];
  sortByPriority: (items?: WishlistItem[]) => WishlistItem[];
  sortByPrice: (productPrices: Record<number, number>, items?: WishlistItem[]) => WishlistItem[];
  isInWishlist: (productId: number) => boolean;
  isHighPriority: (productId: number) => boolean;
  getItemByProductId: (productId: number) => WishlistItem | undefined;
  getCategories: () => string[];
  getAnalytics: () => WishlistAnalytics;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const loadWishlist = (): WishlistItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const value = localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Partial<WishlistItem>[];
    return parsed
      .map((item, index) => normalizeWishlistItem(item, index + 1))
      .filter(item => Number.isFinite(item.productId) && item.productId > 0);
  } catch {
    return [];
  }
};

const loadPurchasedItems = (): PurchasedWishlistItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const value = localStorage.getItem(PURCHASED_STORAGE_KEY);
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as PurchasedWishlistItem[];
  } catch {
    return [];
  }
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(loadWishlist);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedWishlistItem[]>(loadPurchasedItems);
  const [isSaving, setIsSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const pendingSavesRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
      setUpdateError(null);
    } catch {
      setUpdateError('Unable to sync wishlist changes');
    }
  }, [wishlistItems]);

  useEffect(() => {
    try {
      localStorage.setItem(PURCHASED_STORAGE_KEY, JSON.stringify(purchasedItems));
      setUpdateError(null);
    } catch {
      setUpdateError('Unable to sync wishlist analytics');
    }
  }, [purchasedItems]);

  const withSaving = (updater: () => void) => {
    pendingSavesRef.current += 1;
    setIsSaving(true);
    try {
      updater();
      setUpdateError(null);
    } catch {
      setUpdateError('Failed to update wishlist. Please try again or check your browser storage settings.');
    } finally {
      pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
      setIsSaving(pendingSavesRef.current > 0);
    }
  };

  const addToWishlist = useCallback((productId: number, options: Partial<WishlistItem> = {}) => {
    if (!Number.isFinite(productId) || productId <= 0) {
      return;
    }

    withSaving(() => {
      setWishlistItems(prevItems => {
        const nextWishlistItemId = prevItems.length ? Math.max(...prevItems.map(item => item.wishlistItemId)) + 1 : 1;
        const existingItem = prevItems.find(item => item.productId === productId);
        if (existingItem) {
          return prevItems.map(item =>
            item.productId === productId
              ? {
                  ...item,
                  notes: options.notes ?? item.notes,
                  priority: options.priority ?? item.priority,
                  category: options.category ?? item.category,
                  targetPrice: options.targetPrice ?? item.targetPrice,
                  quantity: options.quantity && options.quantity > 0 ? options.quantity : item.quantity,
                }
              : item,
          );
        }

        return [
          ...prevItems,
          normalizeWishlistItem(
            {
              ...options,
              productId,
              wishlistItemId: nextWishlistItemId,
              addedAt: new Date().toISOString(),
            },
            nextWishlistItemId,
          ),
        ];
      });
    });
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    withSaving(() => {
      setWishlistItems(prevItems => prevItems.filter(item => item.productId !== productId));
    });
  }, []);

  const updateItemNotes = useCallback((productId: number, notes: string) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? {
                ...item,
                notes: notes.trim() ? notes : undefined,
              }
            : item,
        ),
      );
    });
  }, []);

  const updateItemPriority = useCallback((productId: number, priority?: WishlistPriority) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? {
                ...item,
                priority,
              }
            : item,
        ),
      );
    });
  }, []);

  const updateItemCategory = useCallback((productId: number, category: string) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? {
                ...item,
                category: category.trim() ? category.trim() : undefined,
              }
            : item,
        ),
      );
    });
  }, []);

  const updateItemTargetPrice = useCallback((productId: number, targetPrice?: number) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? {
                ...item,
                targetPrice: targetPrice && targetPrice > 0 ? targetPrice : undefined,
              }
            : item,
        ),
      );
    });
  }, []);

  const updateItemQuantity = useCallback((productId: number, quantity: number) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? {
                ...item,
                quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
              }
            : item,
        ),
      );
    });
  }, []);

  const moveItemsToCategory = useCallback((productIds: number[], category: string) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          productIds.includes(item.productId)
            ? {
                ...item,
                category: category.trim() ? category.trim() : undefined,
              }
            : item,
        ),
      );
    });
  }, []);

  const setItemsPriority = useCallback((productIds: number[], priority: WishlistPriority) => {
    withSaving(() => {
      setWishlistItems(prevItems =>
        prevItems.map(item =>
          productIds.includes(item.productId)
            ? {
                ...item,
                priority,
              }
            : item,
        ),
      );
    });
  }, []);

  const deleteItems = useCallback((productIds: number[]) => {
    withSaving(() => {
      setWishlistItems(prevItems => prevItems.filter(item => !productIds.includes(item.productId)));
    });
  }, []);

  const markItemPurchased = useCallback((productId: number) => {
    withSaving(() => {
      setWishlistItems(prevItems => {
        const purchasedItem = prevItems.find(item => item.productId === productId);
        if (!purchasedItem) {
          return prevItems;
        }

        setPurchasedItems(prevPurchased => [
          ...prevPurchased,
          {
            productId,
            addedAt: purchasedItem.addedAt,
            purchasedAt: new Date().toISOString(),
            priority: purchasedItem.priority,
            category: purchasedItem.category,
          },
        ]);

        return prevItems.filter(item => item.productId !== productId);
      });
    });
  }, []);

  const getItemsByPriority = useCallback(
    (priority: WishlistPriority) => wishlistItems.filter(item => item.priority === priority),
    [wishlistItems],
  );

  const getItemsByCategory = useCallback(
    (category: string) => wishlistItems.filter(item => item.category?.toLowerCase() === category.toLowerCase()),
    [wishlistItems],
  );

  const sortByDateAdded = useCallback((items: WishlistItem[] = wishlistItems) => sortWishlistByDateAdded(items), [wishlistItems]);
  const sortByPriority = useCallback((items: WishlistItem[] = wishlistItems) => sortWishlistByPriority(items), [wishlistItems]);
  const sortByPrice = useCallback(
    (productPrices: Record<number, number>, items: WishlistItem[] = wishlistItems) => sortWishlistByPrice(items, productPrices),
    [wishlistItems],
  );

  const isInWishlist = useCallback((productId: number) => wishlistItems.some(item => item.productId === productId), [wishlistItems]);
  const isHighPriority = useCallback(
    (productId: number) => wishlistItems.some(item => item.productId === productId && item.priority === 'high'),
    [wishlistItems],
  );
  const getItemByProductId = useCallback(
    (productId: number) => wishlistItems.find(item => item.productId === productId),
    [wishlistItems],
  );

  const getCategories = useCallback(
    () =>
      Array.from(
        new Set(
          wishlistItems
            .map(item => item.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    [wishlistItems],
  );

  const getAnalytics = useCallback(
    () => ({
      mostUsedCategories: calculateMostUsedCategories(wishlistItems),
      averageDaysUntilPurchase: calculateAverageDaysUntilPurchase(purchasedItems),
      priorityDistribution: calculatePriorityDistribution(wishlistItems),
    }),
    [purchasedItems, wishlistItems],
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      purchasedItems,
      isSaving,
      updateError,
      addToWishlist,
      removeFromWishlist,
      updateItemNotes,
      updateItemPriority,
      updateItemCategory,
      updateItemTargetPrice,
      updateItemQuantity,
      moveItemsToCategory,
      setItemsPriority,
      deleteItems,
      markItemPurchased,
      getItemsByPriority,
      getItemsByCategory,
      sortByDateAdded,
      sortByPriority,
      sortByPrice,
      isInWishlist,
      isHighPriority,
      getItemByProductId,
      getCategories,
      getAnalytics,
    }),
    [
      wishlistItems,
      purchasedItems,
      isSaving,
      updateError,
      addToWishlist,
      removeFromWishlist,
      updateItemNotes,
      updateItemPriority,
      updateItemCategory,
      updateItemTargetPrice,
      updateItemQuantity,
      moveItemsToCategory,
      setItemsPriority,
      deleteItems,
      markItemPurchased,
      getItemsByPriority,
      getItemsByCategory,
      sortByDateAdded,
      sortByPriority,
      sortByPrice,
      isInWishlist,
      isHighPriority,
      getItemByProductId,
      getCategories,
      getAnalytics,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export type { WishlistItem, WishlistPriority };
