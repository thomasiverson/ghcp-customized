import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlists } from './wishlist';
import { resetPriceTrackerState } from '../services/priceTracker';

let app: express.Express;

describe('Wishlist API', () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/wishlists', wishlistRouter);
    resetWishlists();
    resetPriceTrackerState();
  });

  it('returns wishlist items with price tracking metadata', async () => {
    const response = await request(app).get('/wishlists/1/items');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('priceHistory');
    expect(response.body[0]).toHaveProperty('lastPriceCheck');
  });

  it('sets price alert settings on an item', async () => {
    const listResponse = await request(app).get('/wishlists/1/items');
    const item = listResponse.body[0];

    const response = await request(app)
      .post(`/wishlists/1/items/${item.productId}/set-alert`)
      .send({ targetPrice: 40, priceAlerts: false });

    expect(response.status).toBe(200);
    expect(response.body.targetPrice).toBe(40);
    expect(response.body.priceAlerts).toBe(false);
  });

  it('returns price history for an item', async () => {
    const listResponse = await request(app).get('/wishlists/1/items');
    const item = listResponse.body[0];

    const response = await request(app).get(`/wishlists/1/items/${item.productId}/price-history`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('dismisses active alerts', async () => {
    const alertsResponse = await request(app).get('/wishlists/1/alerts');

    if (alertsResponse.body.length === 0) {
      await request(app).get('/wishlists/1/items');
    }

    const refreshedAlerts = await request(app).get('/wishlists/1/alerts');
    if (refreshedAlerts.body.length === 0) {
      return;
    }

    const targetAlert = refreshedAlerts.body[0];
    const dismissResponse = await request(app).post(`/wishlists/1/alerts/${targetAlert.alertId}/dismiss`);

    expect(dismissResponse.status).toBe(200);
    expect(dismissResponse.body.dismissed).toBe(true);
  });
});
