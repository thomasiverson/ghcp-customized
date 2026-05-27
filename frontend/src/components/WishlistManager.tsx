import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Wishlist, wishlistApi } from '../api/wishlists';
import ShareWishlist from './ShareWishlist';
import GiftRegistryView from './GiftRegistryView';
import CollaborativeWishlist from './CollaborativeWishlist';
import WishlistSettingsModal from './WishlistSettingsModal';

export default function WishlistManager() {
  const [userId, setUserId] = useState('demo-user');
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlistId, setActiveWishlistId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadWishlists = useCallback(async () => {
    if (!userId) {
      return;
    }

    const response = await wishlistApi.listByUser(userId);
    setWishlists(response);

    if (!activeWishlistId && response.length > 0) {
      setActiveWishlistId(response[0].wishlistId);
    }
  }, [activeWishlistId, userId]);

  useEffect(() => {
    loadWishlists().catch(() => undefined);
  }, [loadWishlists]);

  const activeWishlist = useMemo(
    () => wishlists.find((wishlist) => wishlist.wishlistId === activeWishlistId) ?? null,
    [wishlists, activeWishlistId],
  );

  const totalItems = useMemo(
    () => wishlists.reduce((sum, wishlist) => sum + wishlist.items.length, 0),
    [wishlists],
  );

  const createWishlist = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !userId) {
      return;
    }

    const created = await wishlistApi.create({
      userId,
      name,
      description,
      visibility: 'private',
      isGiftRegistry: false,
      collaborators: [],
      items: [],
    });

    setWishlists((previous) => [...previous, created]);
    setActiveWishlistId(created.wishlistId);
    setName('');
    setDescription('');
  };

  const addQuickItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeWishlist || !newItemName) {
      return;
    }

    await wishlistApi.addItem(activeWishlist.wishlistId, {
      userId,
      name: newItemName,
      price: Number(newItemPrice) || 0,
    });

    setNewItemName('');
    setNewItemPrice('');
    await loadWishlists();
  };

  const setDefaultWishlist = async (wishlistId: number) => {
    await Promise.all(
      wishlists.map((wishlist) => wishlistApi.patch(wishlist.wishlistId, {
        userId,
        defaultWishlist: wishlist.wishlistId === wishlistId,
      })),
    );
    await loadWishlists();
  };

  const deleteWishlist = async () => {
    if (!activeWishlist) {
      return;
    }

    await wishlistApi.remove(activeWishlist.wishlistId, userId);
    setActiveWishlistId(null);
    await loadWishlists();
  };

  return (
    <div className="pt-24 pb-12 max-w-6xl mx-auto px-4 space-y-6">
      <header className="bg-white rounded-lg border p-4">
        <h1 className="text-3xl font-bold text-gray-800">Wishlist Manager</h1>
        <p className="text-sm text-gray-600 mt-1">Total items across all lists: <span className="font-semibold">{totalItems}</span></p>
      </header>

      <section className="bg-white rounded-lg border p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">User ID</label>
        <input className="w-full border rounded-md px-3 py-2" value={userId} onChange={(event) => setUserId(event.target.value)} />

        <form className="grid md:grid-cols-3 gap-2" onSubmit={createWishlist}>
          <input className="border rounded-md px-3 py-2" placeholder="New list name" value={name} onChange={(event) => setName(event.target.value)} required />
          <input className="border rounded-md px-3 py-2" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <button className="bg-primary hover:bg-accent text-white rounded-md px-4 py-2" type="submit">Create new list</button>
        </form>
      </section>

      {wishlists.length > 0 && (
        <section className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <select
              className="border rounded-md px-3 py-2"
              value={activeWishlistId ?? ''}
              onChange={(event) => setActiveWishlistId(Number(event.target.value))}
            >
              {wishlists.map((wishlist) => (
                <option key={wishlist.wishlistId} value={wishlist.wishlistId}>
                  {wishlist.name} {wishlist.defaultWishlist ? '(Default)' : ''}
                </option>
              ))}
            </select>
            {activeWishlist && (
              <>
                <button className="px-3 py-2 rounded-md border" type="button" onClick={() => setDefaultWishlist(activeWishlist.wishlistId)}>Set default wishlist</button>
                <button className="px-3 py-2 rounded-md border" type="button" onClick={() => setSettingsOpen(true)}>Settings</button>
                <button className="px-3 py-2 rounded-md border border-red-400 text-red-600" type="button" onClick={deleteWishlist}>Delete</button>
              </>
            )}
          </div>

          {activeWishlist && (
            <>
              <form className="grid md:grid-cols-3 gap-2" onSubmit={addQuickItem}>
                <input className="border rounded-md px-3 py-2" placeholder="Quick add item" value={newItemName} onChange={(event) => setNewItemName(event.target.value)} />
                <input className="border rounded-md px-3 py-2" placeholder="Price" type="number" min={0} value={newItemPrice} onChange={(event) => setNewItemPrice(event.target.value)} />
                <button className="px-3 py-2 rounded-md border" type="submit">Quick-add to selected wishlist</button>
              </form>

              <div className="space-y-3">
                {activeWishlist.items.map((item) => (
                  <div key={item.itemId} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <ShareWishlist wishlist={activeWishlist} userId={userId} />
              {activeWishlist.isGiftRegistry && <GiftRegistryView wishlist={activeWishlist} actingUserId={userId} onRefresh={loadWishlists} />}
              <CollaborativeWishlist wishlist={activeWishlist} ownerId={activeWishlist.userId} actingUserId={userId} onRefresh={loadWishlists} />
            </>
          )}
        </section>
      )}

      {settingsOpen && activeWishlist && (
        <WishlistSettingsModal
          wishlist={activeWishlist}
          userId={userId}
          onClose={() => setSettingsOpen(false)}
          onSaved={async () => {
            setSettingsOpen(false);
            await loadWishlists();
          }}
        />
      )}
    </div>
  );
}
