import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { api } from '../api/config';
import { useAuth } from './AuthContext';

const LOCALSTORAGE_KEY = 'wishlist';

interface WishlistItem {
    wishlistItemId: number;
    wishlistId: number;
    productId: number;
    addedAt: string;
}

interface WishlistContextType {
    wishlistProductIds: number[];
    isLoading: boolean;
    error: string | null;
    addToWishlist: (productId: number) => Promise<void>;
    removeFromWishlist: (productId: number) => Promise<void>;
    clearWishlist: () => Promise<void>;
    isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const wishlistUrl = (userId: string) =>
    `${api.baseURL}${api.endpoints.wishlists}/${encodeURIComponent(userId)}`;

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn, userId } = useAuth();
    const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure the user has a wishlist on the server, migrating localStorage data if present
    const initWishlist = useCallback(async (uid: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Try to get existing wishlist
            let wishlistData: { items: WishlistItem[] } | null = null;
            try {
                const { data } = await axios.get(wishlistUrl(uid));
                wishlistData = data;
            } catch (err: unknown) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    // Create wishlist
                    await axios.post(`${api.baseURL}${api.endpoints.wishlists}`, { userId: uid });
                    wishlistData = { items: [] };
                } else {
                    throw err;
                }
            }

            const serverProductIds = (wishlistData?.items ?? []).map((i) => i.productId);

            // Migrate localStorage data if present
            const localRaw = localStorage.getItem(LOCALSTORAGE_KEY);
            if (localRaw) {
                try {
                    const localIds: number[] = JSON.parse(localRaw);
                    const toMigrate = localIds.filter((id) => !serverProductIds.includes(id));
                    for (const productId of toMigrate) {
                        try {
                            await axios.post(`${wishlistUrl(uid)}/items`, { productId });
                        } catch {
                            // Skip items that fail (e.g. duplicates)
                        }
                    }
                    localStorage.removeItem(LOCALSTORAGE_KEY);
                    // Re-fetch after migration
                    const { data: refreshed } = await axios.get(wishlistUrl(uid));
                    setWishlistProductIds(refreshed.items.map((i: WishlistItem) => i.productId));
                } catch {
                    // If migration fails, fall back to server state
                    setWishlistProductIds(serverProductIds);
                }
            } else {
                setWishlistProductIds(serverProductIds);
            }
        } catch {
            setError('Failed to load wishlist');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn && userId) {
            initWishlist(userId);
        } else {
            // Not logged in: use localStorage
            const localRaw = localStorage.getItem(LOCALSTORAGE_KEY);
            if (localRaw) {
                try {
                    setWishlistProductIds(JSON.parse(localRaw));
                } catch {
                    setWishlistProductIds([]);
                }
            } else {
                setWishlistProductIds([]);
            }
        }
    }, [isLoggedIn, userId, initWishlist]);

    const addToWishlist = async (productId: number) => {
        if (wishlistProductIds.includes(productId)) {
            return;
        }
        if (isLoggedIn && userId) {
            setIsLoading(true);
            setError(null);
            try {
                await axios.post(`${wishlistUrl(userId)}/items`, { productId });
                setWishlistProductIds((prev) => [...prev, productId]);
            } catch {
                setError('Failed to add item to wishlist');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Offline / unauthenticated: persist to localStorage
            const updated = [...wishlistProductIds, productId];
            setWishlistProductIds(updated);
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
        }
    };

    const removeFromWishlist = async (productId: number) => {
        if (isLoggedIn && userId) {
            setIsLoading(true);
            setError(null);
            try {
                await axios.delete(`${wishlistUrl(userId)}/items/${productId}`);
                setWishlistProductIds((prev) => prev.filter((id) => id !== productId));
            } catch {
                setError('Failed to remove item from wishlist');
            } finally {
                setIsLoading(false);
            }
        } else {
            const updated = wishlistProductIds.filter((id) => id !== productId);
            setWishlistProductIds(updated);
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
        }
    };

    const clearWishlist = async () => {
        if (isLoggedIn && userId) {
            setIsLoading(true);
            setError(null);
            try {
                await axios.delete(wishlistUrl(userId));
                setWishlistProductIds([]);
            } catch {
                setError('Failed to clear wishlist');
            } finally {
                setIsLoading(false);
            }
        } else {
            setWishlistProductIds([]);
            localStorage.removeItem(LOCALSTORAGE_KEY);
        }
    };

    const isInWishlist = (productId: number) => wishlistProductIds.includes(productId);

    return (
        <WishlistContext.Provider
            value={{ wishlistProductIds, isLoading, error, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
