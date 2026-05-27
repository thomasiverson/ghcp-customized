import { useEffect, useMemo, useState } from 'react';
import { WishlistItem, WishlistPriority } from '../../../context/WishlistContext';
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

interface WishlistItemCardProps {
  item: WishlistItem;
  product: Product;
  categories: string[];
  onNotesChange: (productId: number, notes: string) => void;
  onPriorityChange: (productId: number, priority?: WishlistPriority) => void;
  onCategoryChange: (productId: number, category: string) => void;
  onTargetPriceChange: (productId: number, targetPrice?: number) => void;
  onQuantityChange: (productId: number, quantity: number) => void;
  onAddToCart: (productId: number, quantity: number) => void;
  onBuyNow: (productId: number) => void;
  onRemove: (productId: number) => void;
  onToggleSelected: (productId: number, selected: boolean) => void;
  isSelected: boolean;
}

const priorityIcons: Record<WishlistPriority, string> = {
  high: '🔴',
  medium: '🟡',
  low: '⚪',
};

const priorityStyles: Record<WishlistPriority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-200 text-gray-700',
};

export default function WishlistItemCard({
  item,
  product,
  categories,
  onNotesChange,
  onPriorityChange,
  onCategoryChange,
  onTargetPriceChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onRemove,
  onToggleSelected,
  isSelected,
}: WishlistItemCardProps) {
  const { darkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.notes || '');

  useEffect(() => {
    setNoteDraft(item.notes || '');
  }, [item.notes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (noteDraft !== (item.notes || '')) {
        onNotesChange(item.productId, noteDraft);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [item.notes, item.productId, noteDraft, onNotesChange]);

  const effectivePrice = product.discount ? product.price * (1 - product.discount) : product.price;

  const priceIndicator = useMemo(() => {
    if (!item.targetPrice) {
      return 'Set a target price to track deals';
    }

    if (effectivePrice <= item.targetPrice) {
      return `Great news: current $${effectivePrice.toFixed(2)} is at or below target`; 
    }

    return `Current $${effectivePrice.toFixed(2)} is above target by $${(effectivePrice - item.targetPrice).toFixed(2)}`;
  }, [effectivePrice, item.targetPrice]);

  const itemPriority: WishlistPriority = item.priority ?? 'low';

  return (
    <article className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onToggleSelected(item.productId, event.target.checked)}
            aria-label={`Select ${product.name}`}
            className="mt-1"
          />
          <img src={`/${product.imgName}`} alt={product.name} className="w-20 h-20 object-contain rounded-md" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>{product.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityStyles[itemPriority]}`}>{priorityIcons[itemPriority]} {itemPriority}</span>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>${effectivePrice.toFixed(2)} · SKU {product.sku}</p>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mt-1`}>Added {new Date(item.addedAt).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="text-primary hover:text-accent text-sm font-medium"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${product.name} details`}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        <div className="mt-3">
          <textarea
            id={`wishlist-note-${item.productId}`}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            onBlur={() => onNotesChange(item.productId, noteDraft)}
            placeholder="Add notes about this item"
            className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-primary`}
            rows={2}
          />
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{product.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Priority</span>
                <select
                  id={`wishlist-priority-${item.productId}`}
                  value={item.priority || ''}
                  onChange={(event) => onPriorityChange(item.productId, event.target.value as WishlistPriority || undefined)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                >
                  <option value="">Low (default)</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="text-sm">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Move to category</span>
                <input
                  id={`wishlist-category-${item.productId}`}
                  list="wishlist-categories"
                  value={item.category || ''}
                  onChange={(event) => onCategoryChange(item.productId, event.target.value)}
                  placeholder="Seasonal, Essentials..."
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                />
                <datalist id="wishlist-categories">
                  {categories.map(category => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>

              <label className="text-sm">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Target price</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.targetPrice || ''}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    onTargetPriceChange(item.productId, Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                />
              </label>

              <label className="text-sm">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Quantity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity || 1}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    onQuantityChange(item.productId, Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-light border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}
                />
              </label>
            </div>

            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last price check: {new Date().toLocaleTimeString()} · {priceIndicator}</div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => onBuyNow(item.productId)} className="px-3 py-2 rounded-md bg-accent text-white text-sm hover:opacity-90">Buy Now</button>
          <button onClick={() => onAddToCart(item.productId, item.quantity || 1)} className="px-3 py-2 rounded-md bg-primary text-white text-sm hover:opacity-90">Add to Cart</button>
          <button onClick={() => onRemove(item.productId)} className={`px-3 py-2 rounded-md text-sm ${darkMode ? 'bg-gray-700 text-light' : 'bg-gray-200 text-gray-800'}`}>Remove</button>
        </div>
      </div>
    </article>
  );
}
