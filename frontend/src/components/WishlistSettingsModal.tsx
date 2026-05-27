import { FormEvent, useState } from 'react';
import { Wishlist, wishlistApi } from '../api/wishlists';

interface WishlistSettingsModalProps {
  wishlist: Wishlist;
  userId: string;
  onClose: () => void;
  onSaved: (updated: Wishlist) => void;
}

export default function WishlistSettingsModal({ wishlist, userId, onClose, onSaved }: WishlistSettingsModalProps) {
  const [name, setName] = useState(wishlist.name);
  const [description, setDescription] = useState(wishlist.description ?? '');
  const [visibility, setVisibility] = useState<Wishlist['visibility']>(wishlist.visibility);
  const [isGiftRegistry, setIsGiftRegistry] = useState(wishlist.isGiftRegistry);
  const [eventDate, setEventDate] = useState(wishlist.eventDate ?? '');
  const [thankYouMessage, setThankYouMessage] = useState(wishlist.thankYouMessage ?? '');
  const [hidePricesInPublic, setHidePricesInPublic] = useState(Boolean(wishlist.hidePricesInPublic));
  const [revokeShareLinks, setRevokeShareLinks] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const updated = await wishlistApi.patch(wishlist.wishlistId, {
      userId,
      name,
      description,
      visibility,
      isGiftRegistry,
      eventDate: eventDate || undefined,
      thankYouMessage,
      hidePricesInPublic,
      revokeShareLinks,
    });

    onSaved(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Wishlist Settings</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} type="button">✕</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Wishlist name</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea className="mt-1 w-full border rounded-md px-3 py-2" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Visibility</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={visibility} onChange={(event) => setVisibility(event.target.value as Wishlist['visibility'])}>
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isGiftRegistry} onChange={(event) => setIsGiftRegistry(event.target.checked)} />
            Gift registry mode
          </label>

          {isGiftRegistry && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Event date</label>
              <input type="date" className="mt-1 w-full border rounded-md px-3 py-2" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Thank you message</label>
            <textarea className="mt-1 w-full border rounded-md px-3 py-2" rows={2} value={thankYouMessage} onChange={(event) => setThankYouMessage(event.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={hidePricesInPublic} onChange={(event) => setHidePricesInPublic(event.target.checked)} />
            Hide prices in public view
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={revokeShareLinks} onChange={(event) => setRevokeShareLinks(event.target.checked)} />
            Revoke existing share links
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white hover:bg-accent">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
