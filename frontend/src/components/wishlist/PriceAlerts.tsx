import { useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { api } from '../../api/config';
import { PriceAlert, WishlistItem } from './types';

const USER_ID = 1;

const fetchAlerts = async (): Promise<PriceAlert[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/alerts`);
  return data;
};

const fetchItems = async (): Promise<WishlistItem[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/items`);
  return data;
};

export default function PriceAlerts() {
  const queryClient = useQueryClient();
  const [snoozedUntil, setSnoozedUntil] = useState<string>('');

  const { data: alerts = [] } = useQuery('wishlist-alerts', fetchAlerts, { refetchInterval: 60_000 });
  const { data: items = [] } = useQuery('wishlist-items-alerts', fetchItems);

  const dismissMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await axios.post(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/alerts/${alertId}/dismiss`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries('wishlist-alerts');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ productId, priceAlerts }: { productId: number; priceAlerts: boolean }) => {
      await axios.post(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/items/${productId}/set-alert`, { priceAlerts });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries('wishlist-items-alerts');
    }
  });

  const hasSnooze = useMemo(() => {
    if (!snoozedUntil) {
      return false;
    }
    return new Date(snoozedUntil).getTime() > Date.now();
  }, [snoozedUntil]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-semibold">Price Alerts</h2>
        <p className="text-sm text-gray-600">Active alerts: {alerts.length}</p>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="snooze" className="text-sm">Snooze alerts until</label>
          <input id="snooze" type="datetime-local" value={snoozedUntil} onChange={(event) => setSnoozedUntil(event.target.value)} className="rounded border px-2 py-1 text-sm" />
          {hasSnooze && <span className="text-xs text-gray-500">Snoozed</span>}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-2 font-medium">Alert thresholds</h3>
        <p className="text-sm text-gray-600">Automatic drop alerts are generated at 10%, 15%, and 20% discounts.</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-2 font-medium">Enable/Disable per item</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <label key={item.wishlistItemId} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
              <span>Product #{item.productId}</span>
              <input
                type="checkbox"
                checked={item.priceAlerts}
                onChange={(event) => toggleMutation.mutate({ productId: item.productId, priceAlerts: event.target.checked })}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-2 font-medium">Alert history</h3>
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-gray-500">No alerts yet.</p>}
          {alerts.map((alert) => (
            <div key={alert.alertId} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                <p className="font-medium">{alert.message}</p>
                <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissMutation.mutate(alert.alertId)}
                className="rounded bg-gray-200 px-2 py-1 text-xs"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
