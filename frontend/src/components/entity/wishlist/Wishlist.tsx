import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { api } from '../../../api/config';
import WishlistItemCard from './WishlistItemCard';
import { useWishlist, WishlistPriority } from '../../../context/WishlistContext';
import { useTheme } from '../../../context/ThemeContext';

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

type SortType = 'date' | 'priority' | 'price';

type FilterType = WishlistPriority | 'all';

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

const categoryColors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
];

export default function Wishlist() {
  const { darkMode } = useTheme();
  const {
    wishlistItems,
    isSaving,
    updateError,
    getCategories,
    getAnalytics,
    sortByDateAdded,
    sortByPriority,
    sortByPrice,
    updateItemNotes,
    updateItemPriority,
    updateItemCategory,
    updateItemTargetPrice,
    updateItemQuantity,
    moveItemsToCategory,
    setItemsPriority,
    deleteItems,
    removeFromWishlist,
    markItemPurchased,
  } = useWishlist();
  const { data: products, isLoading, error } = useQuery('products', fetchProducts);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortType, setSortType] = useState<SortType>('date');
  const [bulkCategory, setBulkCategory] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const productMap = useMemo(() => {
    const map: Record<number, Product> = {};
    products?.forEach(product => {
      map[product.productId] = product;
    });
    return map;
  }, [products]);

  const productPrices = useMemo(() => {
    const map: Record<number, number> = {};
    products?.forEach(product => {
      map[product.productId] = product.discount ? product.price * (1 - product.discount) : product.price;
    });
    return map;
  }, [products]);

  const categories = getCategories();

  const filteredItems = useMemo(() => {
    let items = [...wishlistItems];

    if (priorityFilter !== 'all') {
      items = items.filter(item => (item.priority || 'low') === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      items = items.filter(item => (item.category || 'Uncategorized') === categoryFilter);
    }

    if (sortType === 'priority') {
      return sortByPriority(items);
    }

    if (sortType === 'price') {
      return sortByPrice(productPrices, items);
    }

    return sortByDateAdded(items);
  }, [categoryFilter, priorityFilter, productPrices, sortByDateAdded, sortByPrice, sortByPriority, sortType, wishlistItems]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, typeof filteredItems>>((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = [...(acc[category] || []), item];
      return acc;
    }, {});
  }, [filteredItems]);

  const analytics = getAnalytics();

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (!selectedIds.length) {
        return;
      }

      const activeItem = selectedIds[0];

      if (event.key.toLowerCase() === 'e') {
        const input = document.getElementById(`wishlist-note-${activeItem}`) as HTMLTextAreaElement | null;
        input?.focus();
      }

      if (event.key.toLowerCase() === 'p') {
        const selectedItem = wishlistItems.find(item => item.productId === activeItem);
        const order: WishlistPriority[] = ['low', 'medium', 'high'];
        const current = selectedItem?.priority || 'low';
        const nextPriority = order[(order.indexOf(current) + 1) % order.length];
        updateItemPriority(activeItem, nextPriority);
      }

      if (event.key.toLowerCase() === 'c') {
        const input = document.getElementById(`wishlist-category-${activeItem}`) as HTMLInputElement | null;
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [selectedIds, updateItemPriority, wishlistItems]);

  const handleToggleSelected = (productId: number, selected: boolean) => {
    setSelectedIds(prev => (selected ? [...new Set([...prev, productId])] : prev.filter(id => id !== productId)));
  };

  const handleAddToCart = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) {
      return;
    }
    setFeedbackMessage(`Cart integration pending: would add ${quantity} item(s) for product #${productId}.`);
  };

  const handleBuyNow = (productId: number) => {
    markItemPurchased(productId);
    setFeedbackMessage(`Checkout started for product #${productId}`);
  };

  const categoryEntries = Object.entries(groupedItems);

  if (isLoading) {
    return <div className={`min-h-screen pt-20 px-4 ${darkMode ? 'text-light' : 'text-gray-800'}`}>Loading wishlist...</div>;
  }

  if (error) {
    return <div className={`min-h-screen pt-20 px-4 text-red-500`}>Failed to load wishlist products.</div>;
  }

  return (
    <div className={`min-h-screen pt-20 pb-16 px-4 ${darkMode ? 'bg-dark' : 'bg-gray-100'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>Wishlist</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Power tools for managing favorite products.</p>
            {isSaving && <p className="text-sm text-primary mt-2">Saving changes...</p>}
            {updateError && <p className="text-sm text-red-500 mt-2">{updateError}</p>}
            {feedbackMessage && <p className="text-sm text-primary mt-2">{feedbackMessage}</p>}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {analytics.mostUsedCategories.slice(0, 3).map((entry, index) => (
              <span key={entry.category} className={`px-2 py-1 rounded-full ${categoryColors[index % categoryColors.length]}`}>
                {entry.category} ({entry.count})
              </span>
            ))}
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} px-2 py-1`}>Avg days until purchase: {analytics.averageDaysUntilPurchase}</span>
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} px-2 py-1`}>
              Priority mix: 🔴 {analytics.priorityDistribution.high} · 🟡 {analytics.priorityDistribution.medium} · ⚪ {analytics.priorityDistribution.low}
            </span>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}> 
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Priority filter</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as FilterType)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}>
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="text-sm">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Category filter</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}>
                <option value="all">All categories</option>
                <option value="Uncategorized">Uncategorized</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Sort by</span>
              <select value={sortType} onChange={(event) => setSortType(event.target.value as SortType)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}>
                <option value="date">Date added</option>
                <option value="priority">Priority</option>
                <option value="price">Current price</option>
              </select>
            </label>

            <div className="text-sm">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Bulk actions</span>
              <div className="flex gap-2">
                <input
                  value={bulkCategory}
                  onChange={(event) => setBulkCategory(event.target.value)}
                  placeholder="Move to category"
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                />
                <button onClick={() => moveItemsToCategory(selectedIds, bulkCategory)} disabled={!selectedIds.length} className="px-3 py-2 bg-primary text-white rounded-md disabled:opacity-50">Move</button>
                <button onClick={() => setItemsPriority(selectedIds, 'high')} disabled={!selectedIds.length} className="px-3 py-2 bg-amber-500 text-white rounded-md disabled:opacity-50">Set 🔴</button>
                <button onClick={() => deleteItems(selectedIds)} disabled={!selectedIds.length} className="px-3 py-2 bg-red-500 text-white rounded-md disabled:opacity-50">Delete</button>
              </div>
            </div>
          </div>
        </div>

        {!filteredItems.length ? (
          <div className={`rounded-lg p-10 text-center ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
            No wishlist items in this view yet. Try changing priority/category filters.
          </div>
        ) : (
          <div className="space-y-6">
            {categoryEntries.map(([category, items], categoryIndex) => (
              <section key={category} className="space-y-3">
                <h2 className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${categoryColors[categoryIndex % categoryColors.length]}`}>
                  {category} ({items.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map(item => {
                    const product = productMap[item.productId];
                    if (!product) {
                      return null;
                    }

                    return (
                      <WishlistItemCard
                        key={item.wishlistItemId}
                        item={item}
                        product={product}
                        categories={categories}
                        onNotesChange={updateItemNotes}
                        onPriorityChange={updateItemPriority}
                        onCategoryChange={updateItemCategory}
                        onTargetPriceChange={updateItemTargetPrice}
                        onQuantityChange={updateItemQuantity}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        onRemove={removeFromWishlist}
                        onToggleSelected={handleToggleSelected}
                        isSelected={selectedIds.includes(item.productId)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
