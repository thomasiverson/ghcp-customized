import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlists } from './wishlist';

let app: express.Express;

const createWishlist = async () => {
  const response = await request(app).post('/wishlists').send({
    userId: 'owner-1',
    name: 'Birthday',
    description: 'Birthday registry',
    visibility: 'public',
    isGiftRegistry: true,
    items: [
      {
        productId: 10,
        name: 'Cat Tower',
        price: 129.99,
      },
    ],
  });

  return response.body;
};

describe('Wishlist API', () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/wishlists', wishlistRouter);
    resetWishlists();
  });

  it('creates and lists wishlists for a user', async () => {
    const created = await createWishlist();

    expect(created.wishlistId).toBe(1);
    expect(created.shareToken).toMatch(/^[0-9a-f-]{36}$/i);

    const response = await request(app).get('/wishlists/owner-1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Birthday');
  });

  it('creates share links and serves a public shared wishlist with redacted fields', async () => {
    const created = await createWishlist();

    await request(app)
      .patch(`/wishlists/${created.wishlistId}`)
      .send({
        userId: 'owner-1',
        hidePricesInPublic: true,
      })
      .expect(200);

    const share = await request(app)
      .post(`/wishlists/${created.wishlistId}/share`)
      .send({ userId: 'owner-1', shareMethod: 'social' });

    expect(share.status).toBe(201);

    const publicView = await request(app).get(`/wishlists/shared/${created.shareToken}`);
    expect(publicView.status).toBe(200);
    expect(publicView.body.wishlist.items[0].notes).toBeUndefined();
    expect(publicView.body.wishlist.items[0].price).toBe(0);
    expect(publicView.body.shareAnalytics.totalViews).toBe(1);
  });

  it('adds and removes collaborators', async () => {
    const created = await createWishlist();

    const addResponse = await request(app)
      .post(`/wishlists/${created.wishlistId}/collaborators`)
      .send({ userId: 'owner-1', collaboratorId: 'helper-1' });

    expect(addResponse.status).toBe(201);
    expect(addResponse.body.collaborators).toContain('helper-1');

    const removeResponse = await request(app)
      .delete(`/wishlists/${created.wishlistId}/collaborators/helper-1`)
      .send({ userId: 'owner-1' });

    expect(removeResponse.status).toBe(204);
  });

  it('supports reserve, purchase, and registry stats', async () => {
    const created = await createWishlist();
    const itemId = created.items[0].itemId;

    const reserveResponse = await request(app)
      .post(`/wishlists/${created.wishlistId}/items/${itemId}/reserve`)
      .send({ userId: 'buyer-1', captchaToken: 'abcd' });

    expect(reserveResponse.status).toBe(200);
    expect(reserveResponse.body.reservedBy).toBe('buyer-1');

    const purchaseResponse = await request(app)
      .post(`/wishlists/${created.wishlistId}/items/${itemId}/purchase`)
      .send({ userId: 'buyer-1', captchaToken: 'abcd' });

    expect(purchaseResponse.status).toBe(200);
    expect(purchaseResponse.body.isPurchased).toBe(true);

    const statsResponse = await request(app).get(`/wishlists/${created.wishlistId}/registry-stats`);
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.purchasedItems).toBe(1);
  });

  it('requires captcha token for gift registry actions', async () => {
    const created = await createWishlist();
    const itemId = created.items[0].itemId;

    const reserveResponse = await request(app)
      .post(`/wishlists/${created.wishlistId}/items/${itemId}/reserve`)
      .send({ userId: 'buyer-1' });

    expect(reserveResponse.status).toBe(400);
  });
});
