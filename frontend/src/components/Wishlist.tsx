import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/config';

interface Product {
  productId: number;
  name: string;
  description: string;
  price: number;
  imgName: string;
  sku: string;
  unit: string;
  supplierId: number;
  discount?: number;
}

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

export default function Wishlist() {
  const { isLoggedIn } = useAuth();
  const { wishlistItems, removeFromWishlist, isLoading: wishlistLoading } = useWishlist();
  const { data: products, isLoading: productsLoading } = useQuery('products', fetchProducts);
  const { darkMode } = useTheme();

  // Redirect if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login?error=Please login to view your wishlist" />;
  }

  const isLoading = wishlistLoading || productsLoading;

  // Get full product details for wishlist items
  const wishlistProducts = products?.filter(product => 
    wishlistItems.some(item => item.productId === product.productId)
  ) || [];

  const handleRemove = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto py-8">
        <h1 className={`text-4xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-8 transition-colors duration-300`}>
          My Wishlist
        </h1>

        {wishlistProducts.length === 0 ? (
          <div className={`text-center py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-colors duration-300`}>
            <svg className={`mx-auto h-24 w-24 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className={`text-xl font-medium ${darkMode ? 'text-light' : 'text-gray-800'} mb-2`}>Your wishlist is empty</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start adding products you love!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistProducts.map(product => {
              const discountedPrice = product.discount 
                ? product.price * (1 - product.discount)
                : product.price;
              
              return (
                <div 
                  key={product.productId} 
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl`}
                >
                  <div className="relative">
                    <img 
                      src={`/images/${product.imgName}`} 
                      alt={product.name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {product.discount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(product.discount * 100)}% OFF
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}>
                      {product.name}
                    </h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4 line-clamp-2 transition-colors duration-300`}>
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {product.discount ? (
                          <div>
                            <span className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                              ${discountedPrice.toFixed(2)}
                            </span>
                            <span className="text-gray-500 line-through ml-2">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemove(product.productId)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Remove from Wishlist
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
