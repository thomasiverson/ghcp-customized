import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import wishlistRouter, { resetWishlist } from './wishlist';
import { wishlistItems as seedWishlistItems } from '../seedData';

let app: express.Express;

describe('Wishlist API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/wishlist', wishlistRouter);
        resetWishlist();
    });

    it('should get all wishlist items for a user', async () => {
        const response = await request(app).get('/wishlist/user@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
        expect(response.body.every((item: any) => item.email === 'user@example.com')).toBe(true);
    });

    it('should get empty array for user with no wishlist items', async () => {
        const response = await request(app).get('/wishlist/newuser@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(0);
    });

    it('should add a new product to wishlist', async () => {
        const newItem = {
            email: 'newuser@example.com',
            productId: 4
        };
        const response = await request(app).post('/wishlist').send(newItem);
        expect(response.status).toBe(201);
        expect(response.body.email).toBe(newItem.email);
        expect(response.body.productId).toBe(newItem.productId);
        expect(response.body.wishlistItemId).toBeDefined();
        expect(response.body.addedAt).toBeDefined();
    });

    it('should prevent duplicate wishlist items', async () => {
        const duplicateItem = {
            email: 'user@example.com',
            productId: 1
        };
        const response = await request(app).post('/wishlist').send(duplicateItem);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Product already in wishlist');
    });

    it('should return 404 when adding non-existent product', async () => {
        const invalidItem = {
            email: 'user@example.com',
            productId: 9999
        };
        const response = await request(app).post('/wishlist').send(invalidItem);
        expect(response.status).toBe(404);
        expect(response.text).toBe('Product not found');
    });

    it('should remove a product from wishlist', async () => {
        const response = await request(app).delete('/wishlist/user@example.com/1');
        expect(response.status).toBe(204);
        
        // Verify it's removed
        const getResponse = await request(app).get('/wishlist/user@example.com');
        expect(getResponse.body.some((item: any) => item.productId === 1)).toBe(false);
    });

    it('should return 404 when removing non-existent wishlist item', async () => {
        const response = await request(app).delete('/wishlist/user@example.com/9999');
        expect(response.status).toBe(404);
        expect(response.text).toBe('Wishlist item not found');
    });

    it('should filter wishlist items by email correctly', async () => {
        const user1Response = await request(app).get('/wishlist/user@example.com');
        const user2Response = await request(app).get('/wishlist/admin@github.com');
        
        expect(user1Response.body.length).toBe(3);
        expect(user2Response.body.length).toBe(2);
        
        expect(user1Response.body.every((item: any) => item.email === 'user@example.com')).toBe(true);
        expect(user2Response.body.every((item: any) => item.email === 'admin@github.com')).toBe(true);
    });

    it('should reset wishlist to seed data', async () => {
        // Add a new item
        await request(app).post('/wishlist').send({
            email: 'test@example.com',
            productId: 5
        });
        
        // Reset the wishlist
        resetWishlist();
        
        // Verify it was reset to seed data
        const response = await request(app).get('/wishlist/user@example.com');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(seedWishlistItems.filter(item => item.email === 'user@example.com').length);
    });
});
