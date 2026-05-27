import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { wishlistApi, Wishlist } from '../api/wishlists';

export default function Navigation() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [wishlistUserId, setWishlistUserId] = useState('demo-user');
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | null>(null);
  const [quickItemName, setQuickItemName] = useState('');

  const loadWishlists = useCallback(async () => {
    const loaded = await wishlistApi.listByUser(wishlistUserId);
    setWishlists(loaded);
    if (!selectedWishlistId && loaded.length > 0) {
      setSelectedWishlistId(loaded[0].wishlistId);
    }
  }, [selectedWishlistId, wishlistUserId]);

  useEffect(() => {
    loadWishlists().catch(() => undefined);
  }, [loadWishlists]);

  const totalItems = useMemo(
    () => wishlists.reduce((sum, wishlist) => sum + wishlist.items.length, 0),
    [wishlists],
  );

  const quickAddToWishlist = async () => {
    if (!selectedWishlistId || !quickItemName) {
      return;
    }

    await wishlistApi.addItem(selectedWishlistId, {
      userId: wishlistUserId,
      name: quickItemName,
      price: 0,
    });
    setQuickItemName('');
    await loadWishlists();
  };

  const createWishlistShortcut = async () => {
    const name = window.prompt('Wishlist name');
    if (!name) {
      return;
    }

    await wishlistApi.create({
      userId: wishlistUserId,
      name,
      visibility: 'private',
      isGiftRegistry: false,
      collaborators: [],
      items: [],
    });
    await loadWishlists();
  };

  return (
    <nav className={`${darkMode ? 'bg-dark/95' : 'bg-white/95'} backdrop-blur-sm fixed w-full z-50 shadow-md transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/copilot.png" 
                alt="Copilot icon"
                className="h-8 w-auto"
              />
              <div className="ml-2">
                <span className={`text-xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>OctoCAT Supply</span>
                <span className="block text-xs text-primary">Smart Cat Tech, Powered by AI</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>Home</Link>
              <Link to="/products" className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>Products</Link>
              <Link to="/wishlists" className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>Wishlists</Link>
              <Link to="/about" className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}>About us</Link>
              {isAdmin && (
                <div className="relative">
                  <button 
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors`}
                  >
                    Admin
                    <svg 
                      className={`ml-1 h-4 w-4 transform ${adminMenuOpen ? 'rotate-180' : ''} transition-transform`}
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {adminMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${darkMode ? 'bg-dark' : 'bg-white'} ring-1 ring-black ring-opacity-5 transition-colors`}>
                      <div className="py-1">
                        <Link
                          to="/admin/products"
                          className={`block px-4 py-2 text-sm ${darkMode ? 'text-light hover:bg-primary hover:text-white' : 'text-gray-700 hover:bg-primary hover:text-white'} transition-colors`}
                          onClick={() => setAdminMenuOpen(false)}
                        >
                          Manage Products
                        </Link>
                        {/* Space for other entity management links */}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-2">
              <input
                className={`w-24 px-2 py-1 text-xs rounded-md border ${darkMode ? 'bg-gray-800 text-light border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}
                value={wishlistUserId}
                onChange={(event) => setWishlistUserId(event.target.value)}
                aria-label="Wishlist user id"
              />
              <select
                className={`max-w-32 px-2 py-1 text-xs rounded-md border ${darkMode ? 'bg-gray-800 text-light border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}
                value={selectedWishlistId ?? ''}
                onChange={(event) => setSelectedWishlistId(Number(event.target.value))}
                aria-label="Select wishlist"
              >
                <option value="">List</option>
                {wishlists.map((wishlist) => (
                  <option key={wishlist.wishlistId} value={wishlist.wishlistId}>{wishlist.name}</option>
                ))}
              </select>
              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">{totalItems}</span>
              <input
                className={`w-24 px-2 py-1 text-xs rounded-md border ${darkMode ? 'bg-gray-800 text-light border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}
                placeholder="Quick add"
                value={quickItemName}
                onChange={(event) => setQuickItemName(event.target.value)}
                aria-label="Quick add wishlist item"
              />
              <button className="text-xs px-2 py-1 rounded-md border border-primary text-primary" onClick={quickAddToWishlist} type="button">Add</button>
              <button className="text-xs px-2 py-1 rounded-md border border-primary text-primary" onClick={createWishlistShortcut} type="button">New</button>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full focus:outline-none transition-colors"
              aria-label="Toggle dark/light mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            {isLoggedIn ? (
              <>
                <span className={`${darkMode ? 'text-light' : 'text-gray-700'} text-sm transition-colors`}>
                  {isAdmin && <span className="text-primary">(Admin) </span>}
                  Welcome!
                </span>
                <button 
                  onClick={logout}
                  className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary hover:bg-accent text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
