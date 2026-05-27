import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/config';
import PriceAlertBadge from './PriceAlertBadge';
import PriceHistoryChart from './PriceHistoryChart';
import PriceAlerts from './PriceAlerts';
import { calculateDiscountPercent, calculateVolatility, formatCurrency, getTrendSymbol, sortWishlistItems } from './priceUtils';
import { PriceAlert, WishlistItem, WishlistSummary } from './types';

const USER_ID = 1;
const POLLING_INTERVAL_ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_TARGET_PRICE_MULTIPLIER = 0.9;

type SortMode = 'BEST_DEALS' | 'PRICE_DROPPED' | 'NEAR_TARGET';

const fetchWishlist = async (): Promise<WishlistItem[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/items`);
  return data;
};

const fetchAlerts = async (): Promise<PriceAlert[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/alerts`);
  return data;
};

const fetchSummary = async (): Promise<WishlistSummary> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/summary`);
  return data;
};

export default function Wishlist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortMode, setSortMode] = useState<SortMode>('BEST_DEALS');
  const notifiedAlertIds = useRef<Set<number>>(new Set());

  const { data: items = [], isLoading } = useQuery('wishlist-items', fetchWishlist, {
    staleTime: 30_000
  });
  const { data: alerts = [] } = useQuery('wishlist-alerts-page', fetchAlerts);
  const { data: summary } = useQuery('wishlist-summary', fetchSummary);

  const setAlertMutation = useMutation({
    mutationFn: async ({ productId, targetPrice }: { productId: number; targetPrice: number }) => {
      await axios.post(`${api.baseURL}${api.endpoints.wishlists}/${USER_ID}/items/${productId}/set-alert`, { targetPrice, priceAlerts: true });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries('wishlist-items');
    }
  });

  useEffect(() => {
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      return;
    }

    const target = alerts.find((entry) => !notifiedAlertIds.current.has(entry.alertId));
    if (!target) {
      return;
    }
    notifiedAlertIds.current.add(target.alertId);

    const notification = new Notification(target.message, {
      body: `Product #${target.productId} has a new price event.`,
      tag: `price-alert-${target.alertId}`
    });

    notification.onclick = () => {
      navigate(`/products?productId=${encodeURIComponent(String(target.productId))}`);
    };
  }, [alerts, navigate]);

  useEffect(() => {
    if (!window.Worker) {
      return;
    }

    const workerSource = `
      let timer = null;
      self.onmessage = function (event) {
        if (event.data === 'start') {
          const run = function () {
            timer = setTimeout(function () {
              self.postMessage('poll');
              run();
            }, ${POLLING_INTERVAL_ONE_HOUR_MS});
          };
          run();
        }
        if (event.data === 'stop' && timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
    `;

    const blob = new Blob([workerSource], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = () => {
      void queryClient.invalidateQueries('wishlist-items');
      void queryClient.invalidateQueries('wishlist-alerts-page');
      void queryClient.invalidateQueries('wishlist-summary');
    };
    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
    };
  }, [queryClient]);

  const sortedItems = useMemo(() => sortWishlistItems(items, sortMode), [items, sortMode]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-24 pb-16">
        <div className="h-10 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-36 animate-pulse rounded bg-gray-200" />
          <div className="h-36 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-24 pb-16">
      {alerts.length > 0 && (
        <div className="rounded border border-primary bg-primary/10 p-3 text-sm text-gray-700">
          {alerts.length} active price alerts available.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-500">You've saved by waiting</h2>
          <p className="text-2xl font-semibold text-primary">{formatCurrency(summary?.savedByWaiting ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-500">Average discount achieved</h2>
          <p className="text-2xl font-semibold">{(summary?.averageDiscountAchieved ?? 0).toFixed(2)}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-500">Price stability</h2>
          <p className="text-2xl font-semibold">{summary?.priceStability ?? 'Stable'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <select
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="BEST_DEALS">Best Deals</option>
          <option value="PRICE_DROPPED">Price Dropped</option>
          <option value="NEAR_TARGET">Near Target</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedItems.map((item) => {
          const discount = calculateDiscountPercent(item.priceWhenAdded, item.currentPrice);

          return (
            <div key={item.wishlistItemId} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Product #{item.productId}</h2>
                <PriceAlertBadge item={item} />
              </div>

              <p className="text-sm text-gray-600">
                Was {formatCurrency(item.priceWhenAdded)}, now {formatCurrency(item.currentPrice)} ({discount.toFixed(2)}% off)
              </p>
              <p className="mt-1 text-sm text-gray-500">Trend: {getTrendSymbol(item)} · Volatility: {calculateVolatility(item)}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => {
                    const suggested = Number((item.currentPrice * DEFAULT_TARGET_PRICE_MULTIPLIER).toFixed(2));
                    setAlertMutation.mutate({ productId: item.productId, targetPrice: suggested });
                  }}
                >
                  Set Price Alert
                </button>
                {item.targetPrice !== undefined && (
                  <span className="text-xs text-gray-500">Target: {formatCurrency(item.targetPrice)}</span>
                )}
                <span className="text-xs text-gray-500">Best time to buy: {summary?.bestTimeToBuy ?? 'Watch dips'}</span>
              </div>

              <div className="mt-3">
                <PriceHistoryChart priceHistory={item.priceHistory} />
              </div>
            </div>
          );
        })}
      </div>

      <PriceAlerts />
    </div>
  );
}
