import { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../api/config';
import { useAuth } from './AuthContext';

interface WishlistItem {
  wishlistItemId: number;
  email: string;
  productId: number;
  addedAt: Date;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  error: unknown;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const fetchWishlist = async (email: string): Promise<WishlistItem[]> => {
  if (!email) return [];
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlist}/${email}`);
  return data;
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, email } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading, error } = useQuery(
    ['wishlist', email],
    () => fetchWishlist(email),
    {
      enabled: isLoggedIn && !!email,
      staleTime: 30000, // 30 seconds
    }
  );

  const addMutation = useMutation(
    async (productId: number) => {
      const { data } = await axios.post(`${api.baseURL}${api.endpoints.wishlist}`, {
        email,
        productId
      });
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlist', email]);
      }
    }
  );

  const removeMutation = useMutation(
    async (productId: number) => {
      await axios.delete(`${api.baseURL}${api.endpoints.wishlist}/${email}/${productId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlist', email]);
      }
    }
  );

  const addToWishlist = async (productId: number) => {
    if (!isLoggedIn) {
      throw new Error('Must be logged in to add to wishlist');
    }
    await addMutation.mutateAsync(productId);
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isLoggedIn) {
      throw new Error('Must be logged in to remove from wishlist');
    }
    await removeMutation.mutateAsync(productId);
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoading,
        error,
        addToWishlist,
        removeFromWishlist,
        isInWishlist
      }}
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
