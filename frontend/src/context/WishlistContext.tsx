import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { api } from '../api/config';
import { useAuth } from './AuthContext';

interface Product {
  productId: number;
  supplierId: number;
  name: string;
  description: string;
  price: number;
  sku: string;
  unit: string;
  imgName: string;
  discount?: number;
}

interface WishlistContextType {
  wishlist: Product[];
  isLoading: boolean;
  error: Error | null;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wishlist
  const { data: wishlist = [], isLoading, error } = useQuery<Product[], Error>(
    ['wishlist', user?.userId],
    async () => {
      if (!user) return [];
      const response = await axios.get(
        `${api.baseURL}${api.endpoints.users}/${user.userId}/wishlist`
      );
      return response.data;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Add to wishlist mutation
  const addMutation = useMutation(
    async (productId: number) => {
      if (!user) throw new Error('User not logged in');
      await axios.post(
        `${api.baseURL}${api.endpoints.users}/${user.userId}/wishlist`,
        { productId }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlist', user?.userId]);
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error || 'Failed to add to wishlist');
        }
      },
    }
  );

  // Remove from wishlist mutation
  const removeMutation = useMutation(
    async (productId: number) => {
      if (!user) throw new Error('User not logged in');
      await axios.delete(
        `${api.baseURL}${api.endpoints.users}/${user.userId}/wishlist/${productId}`
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['wishlist', user?.userId]);
      },
    }
  );

  const addToWishlist = async (productId: number) => {
    await addMutation.mutateAsync(productId);
  };

  const removeFromWishlist = async (productId: number) => {
    await removeMutation.mutateAsync(productId);
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(product => product.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        error: error as Error | null,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
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
