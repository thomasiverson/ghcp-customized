import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlists } from './wishlist';
import { wishlists as seedWishlists, wishlistItems as seedWishlistItems } from '../seedData';

let app: express.Express;

describe('Wishlist API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/wishlists', wishlistRouter);
        resetWishlists();
    });

    describe('POST /wishlists - Create wishlist', () => {
        it('should create a new wishlist', async () => {
            const response = await request(app)
                .post('/wishlists')
                .send({ userId: 'newuser@example.com' });
            expect(response.status).toBe(201);
            expect(response.body.userId).toBe('newuser@example.com');
            expect(response.body.wishlistId).toBeDefined();
            expect(response.body.createdAt).toBeDefined();
        });

        it('should return 409 if wishlist already exists for user', async () => {
            const userId = seedWishlists[0].userId;
            const response = await request(app)
                .post('/wishlists')
                .send({ userId });
            expect(response.status).toBe(409);
        });

        it('should return 400 if userId is missing', async () => {
            const response = await request(app)
                .post('/wishlists')
                .send({});
            expect(response.status).toBe(400);
        });
    });

    describe('GET /wishlists/:userId - Get wishlist', () => {
        it('should return a wishlist with items for an existing user', async () => {
            const userId = seedWishlists[0].userId;
            const response = await request(app).get(`/wishlists/${userId}`);
            expect(response.status).toBe(200);
            expect(response.body.userId).toBe(userId);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should return items belonging to the user wishlist', async () => {
            const wishlist = seedWishlists[0];
            const response = await request(app).get(`/wishlists/${wishlist.userId}`);
            expect(response.status).toBe(200);
            const expectedItems = seedWishlistItems.filter(i => i.wishlistId === wishlist.wishlistId);
            expect(response.body.items.length).toBe(expectedItems.length);
        });

        it('should return 404 for a non-existing user', async () => {
            const response = await request(app).get('/wishlists/unknown@example.com');
            expect(response.status).toBe(404);
        });
    });

    describe('POST /wishlists/:userId/items - Add item', () => {
        it('should add a product to a wishlist', async () => {
            const userId = seedWishlists[0].userId;
            const response = await request(app)
                .post(`/wishlists/${userId}/items`)
                .send({ productId: 99 });
            expect(response.status).toBe(201);
            expect(response.body.productId).toBe(99);
            expect(response.body.wishlistId).toBe(seedWishlists[0].wishlistId);
            expect(response.body.addedAt).toBeDefined();
        });

        it('should return 404 if wishlist does not exist for user', async () => {
            const response = await request(app)
                .post('/wishlists/unknown@example.com/items')
                .send({ productId: 1 });
            expect(response.status).toBe(404);
        });

        it('should return 409 if product already in wishlist', async () => {
            const wishlist = seedWishlists[0];
            const existingItem = seedWishlistItems.find(i => i.wishlistId === wishlist.wishlistId);
            const response = await request(app)
                .post(`/wishlists/${wishlist.userId}/items`)
                .send({ productId: existingItem!.productId });
            expect(response.status).toBe(409);
        });

        it('should return 400 if productId is missing', async () => {
            const userId = seedWishlists[0].userId;
            const response = await request(app)
                .post(`/wishlists/${userId}/items`)
                .send({});
            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /wishlists/:userId/items/:productId - Remove item', () => {
        it('should remove a product from a wishlist', async () => {
            const wishlist = seedWishlists[0];
            const item = seedWishlistItems.find(i => i.wishlistId === wishlist.wishlistId);
            const response = await request(app)
                .delete(`/wishlists/${wishlist.userId}/items/${item!.productId}`);
            expect(response.status).toBe(204);
        });

        it('should return 404 if wishlist does not exist', async () => {
            const response = await request(app)
                .delete('/wishlists/unknown@example.com/items/1');
            expect(response.status).toBe(404);
        });

        it('should return 404 if product not in wishlist', async () => {
            const userId = seedWishlists[0].userId;
            const response = await request(app)
                .delete(`/wishlists/${userId}/items/99999`);
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /wishlists/:userId - Clear wishlist', () => {
        it('should clear all items from a wishlist', async () => {
            const userId = seedWishlists[0].userId;
            const deleteResponse = await request(app).delete(`/wishlists/${userId}`);
            expect(deleteResponse.status).toBe(204);

            const getResponse = await request(app).get(`/wishlists/${userId}`);
            expect(getResponse.status).toBe(200);
            expect(getResponse.body.items.length).toBe(0);
        });

        it('should return 404 if wishlist does not exist', async () => {
            const response = await request(app).delete('/wishlists/unknown@example.com');
            expect(response.status).toBe(404);
        });
    });
});
