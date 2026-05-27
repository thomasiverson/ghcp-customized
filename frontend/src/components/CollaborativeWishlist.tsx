import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Wishlist, WishlistActivity, wishlistApi } from '../api/wishlists';

interface CollaborativeWishlistProps {
  wishlist: Wishlist;
  ownerId: string;
  actingUserId: string;
  onRefresh: () => Promise<void>;
}

export default function CollaborativeWishlist({ wishlist, ownerId, actingUserId, onRefresh }: CollaborativeWishlistProps) {
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [commentByItemId, setCommentByItemId] = useState<Record<number, string>>({});
  const [activity, setActivity] = useState<WishlistActivity[]>([]);

  const loadActivity = useCallback(async () => {
    const feed = await wishlistApi.getActivity(wishlist.wishlistId, actingUserId);
    setActivity(feed);
  }, [actingUserId, wishlist.wishlistId]);

  useEffect(() => {
    loadActivity().catch(() => undefined);

    const polling = setInterval(() => {
      loadActivity().catch(() => undefined);
      onRefresh().catch(() => undefined);
    }, 10000);

    return () => clearInterval(polling);
  }, [loadActivity, onRefresh]);

  const addCollaborator = async (event: FormEvent) => {
    event.preventDefault();
    if (!collaboratorEmail) {
      return;
    }

    await wishlistApi.addCollaborator(wishlist.wishlistId, ownerId, collaboratorEmail);
    setCollaboratorEmail('');
    await onRefresh();
    await loadActivity();
  };

  const removeCollaborator = async (collaboratorId: string) => {
    await wishlistApi.removeCollaborator(wishlist.wishlistId, ownerId, collaboratorId);
    await onRefresh();
    await loadActivity();
  };

  const addItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!itemName) {
      return;
    }

    await wishlistApi.addItem(wishlist.wishlistId, {
      userId: actingUserId,
      name: itemName,
      price: Number(itemPrice) || 0,
    });

    setItemName('');
    setItemPrice('');
    await onRefresh();
    await loadActivity();
  };

  const removeItem = async (itemId: number) => {
    await wishlistApi.removeItem(wishlist.wishlistId, itemId, actingUserId);
    await onRefresh();
    await loadActivity();
  };

  const addComment = async (itemId: number) => {
    const message = commentByItemId[itemId];
    if (!message) {
      return;
    }

    await wishlistApi.commentOnItem(wishlist.wishlistId, itemId, actingUserId, message);
    setCommentByItemId((previous) => ({
      ...previous,
      [itemId]: '',
    }));
    await onRefresh();
    await loadActivity();
  };

  return (
    <section className="bg-white rounded-lg border p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Collaborative Wishlist</h3>

      <form className="flex flex-col md:flex-row gap-2" onSubmit={addCollaborator}>
        <input
          className="border rounded-md px-3 py-2 flex-1"
          placeholder="Add collaborator by email/user id"
          value={collaboratorEmail}
          onChange={(event) => setCollaboratorEmail(event.target.value)}
        />
        <button className="px-3 py-2 rounded-md bg-primary text-white" type="submit">Add collaborator</button>
      </form>

      <div className="space-y-2">
        {wishlist.collaborators.map((collaborator) => (
          <div key={collaborator} className="text-sm text-gray-700 border rounded-md p-2 flex items-center justify-between">
            <span>{collaborator} (edit)</span>
            <button className="text-red-600" type="button" onClick={() => removeCollaborator(collaborator)}>Remove</button>
          </div>
        ))}
      </div>

      <form className="grid md:grid-cols-3 gap-2" onSubmit={addItem}>
        <input className="border rounded-md px-3 py-2" placeholder="Item name" value={itemName} onChange={(event) => setItemName(event.target.value)} />
        <input className="border rounded-md px-3 py-2" placeholder="Price" type="number" min={0} value={itemPrice} onChange={(event) => setItemPrice(event.target.value)} />
        <button className="px-3 py-2 rounded-md bg-primary text-white" type="submit">Add item</button>
      </form>

      <div className="space-y-3">
        {wishlist.items.map((item) => (
          <div key={item.itemId} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-600">Added by {item.addedBy}</p>
              </div>
              <button className="text-red-600 text-sm" onClick={() => removeItem(item.itemId)} type="button">Remove</button>
            </div>
            <div className="space-y-1">
              {(item.comments ?? []).map((comment) => (
                <p key={comment.commentId} className="text-sm text-gray-600">{comment.userId}: {comment.message}</p>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="border rounded-md px-3 py-1 flex-1"
                placeholder="Comment"
                value={commentByItemId[item.itemId] ?? ''}
                onChange={(event) => setCommentByItemId((previous) => ({ ...previous, [item.itemId]: event.target.value }))}
              />
              <button className="px-3 py-1 rounded-md border" type="button" onClick={() => addComment(item.itemId)}>Add</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-medium text-gray-800 mb-2">Activity feed</h4>
        <ul className="space-y-1 text-sm text-gray-600 max-h-52 overflow-y-auto">
          {activity.map((entry) => (
            <li key={entry.activityId}>{new Date(entry.createdAt).toLocaleString()} — {entry.message}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
