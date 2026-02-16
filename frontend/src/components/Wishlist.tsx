import { useQuery } from 'react-query';
import axios from 'axios';
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
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { darkMode } = useTheme();
  const { data: allProducts, isLoading } = useQuery('products', fetchProducts);

  const wishlistProducts = allProducts?.filter(product => 
    wishlistItems.includes(product.productId)
  ) || [];

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
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
            My Wishlist
          </h1>
          
          {wishlistProducts.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg 
                className="w-24 h-24 mb-4"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <p className="text-xl font-semibold mb-2">Your wishlist is empty</p>
              <p className="text-sm">Add products to your wishlist to save them for later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistProducts.map(product => (
                <div key={product.productId} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(118,184,82,0.3)] flex flex-col`}>
                  <div className={`relative h-56 ${darkMode ? 'bg-gradient-to-t from-gray-700 to-gray-800' : 'bg-gradient-to-t from-gray-100 to-white'} transition-colors duration-300`}>
                    <img 
                      src={`/${product.imgName}`} 
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {product.discount && (
                      <div className="absolute top-8 left-0 bg-primary text-white px-3 py-1 -rotate-90 transform -translate-x-5 shadow-md">
                        {Math.round(product.discount * 100)}% OFF
                      </div>
                    )}
                    <button
                      onClick={() => removeFromWishlist(product.productId)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <svg 
                        className="w-6 h-6 text-primary fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2 transition-colors duration-300`}>
                      {product.name}
                    </h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 flex-grow transition-colors duration-300`}>
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center mt-auto">
                      {product.discount ? (
                        <div>
                          <span className="text-gray-500 line-through text-sm mr-2">${product.price.toFixed(2)}</span>
                          <span className="text-primary text-xl font-bold">${(product.price * (1 - product.discount)).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-primary text-xl font-bold">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
