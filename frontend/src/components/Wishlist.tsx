import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Wishlist() {
  const { wishlist, isLoading, removeFromWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} transition-colors duration-300`}>
        <div className="container mx-auto px-4 py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 text-center transition-colors duration-300`}>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-4`}>
              Please Log In
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              You need to be logged in to view your wishlist.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-accent text-white py-2 px-6 rounded transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} transition-colors duration-300`}>
        <div className="container mx-auto px-4 py-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-8`}>
            My Wishlist
          </h1>
          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading your wishlist...
          </div>
        </div>
      </div>
    );
  }

  const handleRemove = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  return (
    <div className={`min-h-screen pt-20 ${darkMode ? 'bg-dark' : 'bg-gray-100'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-4xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-8`}>
          My Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 text-center transition-colors duration-300`}>
            <svg
              className={`w-24 h-24 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-4`}>
              Your wishlist is empty
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Start adding products you love to your wishlist!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-primary hover:bg-accent text-white py-2 px-6 rounded transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.productId}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`}
              >
                <img
                  src={`/images/${product.imgName}`}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.png';
                  }}
                />
                <div className="p-4">
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} mb-2`}>
                    {product.name}
                  </h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4 line-clamp-2`}>
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    {product.discount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          ${(product.price * (1 - product.discount)).toFixed(2)}
                        </span>
                        <span className={`text-sm line-through ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm bg-accent text-white px-2 py-1 rounded">
                          {(product.discount * 100).toFixed(0)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(product.productId)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
                  >
                    Remove from Wishlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
