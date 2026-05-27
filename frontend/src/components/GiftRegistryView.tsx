import { useMemo, useState } from 'react';
import { Wishlist, wishlistApi } from '../api/wishlists';

interface GiftRegistryViewProps {
  wishlist: Wishlist;
  actingUserId: string;
  onRefresh: () => Promise<void>;
}

export default function GiftRegistryView({ wishlist, actingUserId, onRefresh }: GiftRegistryViewProps) {
  const [captchaToken, setCaptchaToken] = useState('');
  const [message, setMessage] = useState('');

  const purchasedCount = useMemo(
    () => wishlist.items.filter((item) => item.isPurchased).length,
    [wishlist.items],
  );

  const reserveItem = async (itemId: number) => {
    await wishlistApi.reserveItem(wishlist.wishlistId, itemId, actingUserId, captchaToken);
    setMessage('Item reserved for 24 hours');
    await onRefresh();
  };

  const purchaseItem = async (itemId: number) => {
    await wishlistApi.purchaseItem(wishlist.wishlistId, itemId, actingUserId, captchaToken);
    setMessage('Marked item as purchased');
    await onRefresh();
  };

  const unreserveItem = async (itemId: number) => {
    await wishlistApi.unreserveItem(wishlist.wishlistId, itemId, actingUserId, captchaToken);
    setMessage('Reservation canceled');
    await onRefresh();
  };

  return (
    <section className="bg-white rounded-lg border p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Gift Registry</h3>
      <p className="text-sm text-gray-600">{wishlist.thankYouMessage || 'Thank you for helping with this registry!'}</p>

      <div>
        <p className="text-sm text-gray-600 mb-1">Progress: {purchasedCount} of {wishlist.items.length} purchased</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${wishlist.items.length === 0 ? 0 : (purchasedCount / wishlist.items.length) * 100}%` }} />
        </div>
      </div>

      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder="CAPTCHA token (enter any 4+ chars)"
        value={captchaToken}
        onChange={(event) => setCaptchaToken(event.target.value)}
      />

      <div className="space-y-3">
        {wishlist.items.map((item) => (
          <div key={item.itemId} className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
              {item.isPurchased && <p className="text-sm text-green-600">Purchased{item.purchasedBy ? ` by ${item.purchasedBy}` : ''}</p>}
              {!item.isPurchased && item.reservedBy && <p className="text-sm text-yellow-700">Reserved by {item.reservedBy}</p>}
            </div>
            {!item.isPurchased && (
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-md border" onClick={() => reserveItem(item.itemId)} type="button">Reserve</button>
                <button className="px-3 py-2 rounded-md bg-primary text-white" onClick={() => purchaseItem(item.itemId)} type="button">I bought this</button>
                {item.reservedBy && <button className="px-3 py-2 rounded-md border" onClick={() => unreserveItem(item.itemId)} type="button">Unreserve</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
    </section>
  );
}
