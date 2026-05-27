import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Wishlist, wishlistApi } from '../api/wishlists';

const upsertMeta = (name: 'property' | 'name', key: string, content: string) => {
  let element = document.head.querySelector(`meta[${name}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(name, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

export default function PublicWishlistView() {
  const { token } = useParams();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [visitorCount, setVisitorCount] = useState(0);
  const [error, setError] = useState('');
  const [copyUserId, setCopyUserId] = useState('demo-user');
  const [toast, setToast] = useState('');

  const shareUrl = useMemo(() => window.location.href, []);

  const loadWishlist = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await wishlistApi.getShared(token);
      setWishlist(response.wishlist);
      setVisitorCount(response.shareAnalytics.totalViews);
      setError('');
    } catch {
      setError('Could not load shared wishlist');
    }
  }, [token]);

  useEffect(() => {
    loadWishlist().catch(() => undefined);
  }, [loadWishlist]);

  useEffect(() => {
    if (!wishlist || !token) {
      return;
    }

    const title = `${wishlist.name} | Wishlist`;
    const description = wishlist.description || 'Shared wishlist';
    const image = `${window.location.origin}/api/wishlists/shared/${token}/og-image`;

    document.title = title;
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', shareUrl);
    upsertMeta('property', 'og:image', image);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    upsertMeta('property', 'og:site_name', 'OctoCAT Supply');
    upsertMeta('name', 'pinterest-rich-pin', 'true');
  }, [wishlist, token, shareUrl]);

  const copyToOwnWishlist = async () => {
    if (!wishlist) {
      return;
    }

    await wishlistApi.create({
      userId: copyUserId,
      name: `Copy of ${wishlist.name}`,
      description: `Copied from shared list ${wishlist.name}`,
      visibility: 'private',
      isGiftRegistry: false,
      collaborators: [],
      items: wishlist.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        url: item.url,
      })),
    });

    setToast('Copied to your wishlists');
    setTimeout(() => setToast(''), 2500);
  };

  if (error) {
    return <div className="pt-24 max-w-5xl mx-auto px-4 text-red-600">{error}</div>;
  }

  if (!wishlist) {
    return <div className="pt-24 max-w-5xl mx-auto px-4">Loading...</div>;
  }

  return (
    <div className="pt-24 pb-12 max-w-5xl mx-auto px-4 space-y-6">
      <header className="bg-white rounded-lg border p-4">
        <h1 className="text-3xl font-bold text-gray-800">{wishlist.name}</h1>
        {wishlist.description && <p className="text-gray-600 mt-2">{wishlist.description}</p>}
        <p className="text-sm text-gray-500 mt-2">Visitors: {visitorCount}</p>
      </header>

      <div className="grid gap-3">
        {wishlist.items.map((item) => (
          <article key={item.itemId} className="bg-white border rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-600">
                {wishlist.hidePricesInPublic ? 'Price hidden by owner' : `$${item.price.toFixed(2)}`}
              </p>
            </div>
            <a
              href={item.url || `https://www.google.com/search?q=${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-md bg-primary text-white"
            >
              Buy as Gift
            </a>
          </article>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input className="border rounded-md px-3 py-2" value={copyUserId} onChange={(event) => setCopyUserId(event.target.value)} placeholder="Your user id" />
        <button className="px-4 py-2 rounded-md border" onClick={copyToOwnWishlist} type="button">Copy to my wishlist</button>
      </div>
      {toast && <p className="text-sm text-green-600">{toast}</p>}
    </div>
  );
}
