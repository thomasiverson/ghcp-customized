import { useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { RegistryStats, Wishlist, wishlistApi } from '../api/wishlists';
import { api } from '../api/config';

interface ShareWishlistProps {
  wishlist: Wishlist;
  userId: string;
}

export default function ShareWishlist({ wishlist, userId }: ShareWishlistProps) {
  const [method, setMethod] = useState<'link' | 'email' | 'social'>('link');
  const [recipient, setRecipient] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [toast, setToast] = useState('');

  const fallbackShareLink = useMemo(
    () => `${api.baseURL}/api/wishlists/shared/${wishlist.shareToken}`,
    [wishlist.shareToken],
  );

  const activeShareLink = shareLink || fallbackShareLink;

  const shareTo = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const encodedLink = encodeURIComponent(activeShareLink);
    const encodedText = encodeURIComponent(`Check out my wishlist: ${wishlist.name}`);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedLink}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
    };

    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  const generateShareLink = async () => {
    const response = await wishlistApi.share(wishlist.wishlistId, {
      userId,
      shareMethod: method,
      sharedWith: recipient || undefined,
      expiresAt: expiresAt || undefined,
    });

    setShareLink(`${api.baseURL}${response.shareUrl}`);
    setToast('Share link generated');
    setTimeout(() => setToast(''), 2500);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(activeShareLink);
    setToast('Copied to clipboard');
    setTimeout(() => setToast(''), 2500);
  };

  const openEmailShare = () => {
    const safeRecipient = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(recipient.trim()) ? recipient.trim() : '';
    const subject = encodeURIComponent(`Wishlist: ${wishlist.name}`);
    const body = encodeURIComponent(`Take a look at this wishlist: ${activeShareLink}`);
    window.location.assign(`mailto:${encodeURIComponent(safeRecipient)}?subject=${subject}&body=${body}`);
  };

  const loadAnalytics = async () => {
    const loaded = await wishlistApi.getRegistryStats(wishlist.wishlistId);
    setStats(loaded);
  };

  return (
    <section className="bg-white rounded-lg border p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Share Wishlist</h3>

      <div className="grid md:grid-cols-3 gap-3">
        <select className="border rounded-md px-3 py-2" value={method} onChange={(event) => setMethod(event.target.value as 'link' | 'email' | 'social')}>
          <option value="link">Link</option>
          <option value="email">Email</option>
          <option value="social">Social</option>
        </select>
        <input className="border rounded-md px-3 py-2" placeholder="Recipient (optional)" value={recipient} onChange={(event) => setRecipient(event.target.value)} />
        <input type="datetime-local" className="border rounded-md px-3 py-2" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-2 rounded-md bg-primary text-white" onClick={generateShareLink} type="button">Generate link</button>
        <button className="px-3 py-2 rounded-md border" onClick={copyToClipboard} type="button">Copy link</button>
        <button className="px-3 py-2 rounded-md border" onClick={openEmailShare} type="button">Share via email</button>
        <button className="px-3 py-2 rounded-md border" onClick={() => shareTo('facebook')} type="button">Facebook</button>
        <button className="px-3 py-2 rounded-md border" onClick={() => shareTo('twitter')} type="button">Twitter</button>
        <button className="px-3 py-2 rounded-md border" onClick={() => shareTo('whatsapp')} type="button">WhatsApp</button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="p-2 bg-white border rounded-md">
          <QRCode value={activeShareLink} size={128} />
        </div>
        <div className="text-sm text-gray-600 break-all">{activeShareLink}</div>
      </div>

      <div className="space-y-2">
        <button className="px-3 py-2 rounded-md border" type="button" onClick={loadAnalytics}>View share analytics</button>
        {stats && (
          <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 space-y-1">
            <p>Total views: {stats.totalViews}</p>
            <p>Conversion rate: {(stats.conversionRate * 100).toFixed(1)}%</p>
            <p>Method usage — Link: {stats.shareMethodUsage.link}, Email: {stats.shareMethodUsage.email}, Social: {stats.shareMethodUsage.social}</p>
            <p>Most shared products: {stats.mostSharedProducts.map((entry) => `#${entry.productId} (${entry.shares})`).join(', ') || 'N/A'}</p>
          </div>
        )}
      </div>

      {toast && <p className="text-sm text-green-600">{toast}</p>}
    </section>
  );
}
