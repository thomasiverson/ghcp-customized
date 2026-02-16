import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRouter, { resetUsers } from './user';
import { users as seedUsers } from '../seedData';

let app: express.Express;

describe('User API', () => {
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/users', userRouter);
        resetUsers();
    });

    describe('POST /users - Register new user', () => {
        it('should create a new user', async () => {
            const newUser = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123'
            };
            const response = await request(app).post('/users').send(newUser);
            expect(response.status).toBe(201);
            expect(response.body.email).toBe(newUser.email);
            expect(response.body.name).toBe(newUser.name);
            expect(response.body.isAdmin).toBe(false);
            expect(response.body.wishlistProductIds).toEqual([]);
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('createdAt');
        });

        it('should create an admin user with @github.com email', async () => {
            const newUser = {
                email: 'admin@github.com',
                name: 'Admin User',
                password: 'password123'
            };
            const response = await request(app).post('/users').send(newUser);
            expect(response.status).toBe(201);
            expect(response.body.isAdmin).toBe(true);
        });

        it('should reject invalid email format', async () => {
            const newUser = {
                email: 'invalid-email',
                name: 'Test User',
                password: 'password123'
            };
            const response = await request(app).post('/users').send(newUser);
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid email format');
        });

        it('should reject password shorter than 8 characters', async () => {
            const newUser = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'short'
            };
            const response = await request(app).post('/users').send(newUser);
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Password must be at least 8 characters');
        });

        it('should reject duplicate email', async () => {
            const existingUser = seedUsers[0];
            const newUser = {
                email: existingUser.email,
                name: 'Test User',
                password: 'password123'
            };
            const response = await request(app).post('/users').send(newUser);
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Email already exists');
        });

        it('should reject missing required fields', async () => {
            const response = await request(app).post('/users').send({
                email: 'test@example.com'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('required');
        });
    });

    describe('GET /users/:email - Get user by email', () => {
        it('should get user by email', async () => {
            const user = seedUsers[0];
            const response = await request(app).get(`/users/${user.email}`);
            expect(response.status).toBe(200);
            expect(response.body.email).toBe(user.email);
            expect(response.body.userId).toBe(user.userId);
        });

        it('should be case-insensitive', async () => {
            const user = seedUsers[0];
            const response = await request(app).get(`/users/${user.email.toUpperCase()}`);
            expect(response.status).toBe(200);
            expect(response.body.email).toBe(user.email);
        });

        it('should return 404 for non-existing user', async () => {
            const response = await request(app).get('/users/nonexistent@example.com');
            expect(response.status).toBe(404);
            expect(response.body.error).toContain('User not found');
        });
    });

    describe('PUT /users/id/:userId - Update user details', () => {
        it('should update user name', async () => {
            const user = seedUsers[0];
            const updatedData = { name: 'Updated Name' };
            const response = await request(app)
                .put(`/users/id/${user.userId}`)
                .send(updatedData);
            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updatedData.name);
            expect(response.body.email).toBe(user.email);
        });

        it('should update user email', async () => {
            const user = seedUsers[0];
            const updatedData = { email: 'newemail@example.com' };
            const response = await request(app)
                .put(`/users/id/${user.userId}`)
                .send(updatedData);
            expect(response.status).toBe(200);
            expect(response.body.email).toBe(updatedData.email);
        });

        it('should update isAdmin when email changes to @github.com', async () => {
            const user = seedUsers[0];
            const updatedData = { email: 'admin@github.com' };
            const response = await request(app)
                .put(`/users/id/${user.userId}`)
                .send(updatedData);
            expect(response.status).toBe(200);
            expect(response.body.isAdmin).toBe(true);
        });

        it('should reject duplicate email on update', async () => {
            const user1 = seedUsers[0];
            const user2 = seedUsers[1];
            const updatedData = { email: user2.email };
            const response = await request(app)
                .put(`/users/id/${user1.userId}`)
                .send(updatedData);
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Email already exists');
        });

        it('should return 404 for non-existing user', async () => {
            const response = await request(app)
                .put('/users/id/999')
                .send({ name: 'Updated Name' });
            expect(response.status).toBe(404);
            expect(response.body.error).toContain('User not found');
        });
    });

    describe('Wishlist Operations', () => {
        describe('GET /users/:userId/wishlist - Get wishlist', () => {
            it('should get empty wishlist for new user', async () => {
                const user = seedUsers[0];
                const response = await request(app).get(`/users/${user.userId}/wishlist`);
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should get wishlist with product details', async () => {
                const user = seedUsers[1]; // User with pre-populated wishlist
                const response = await request(app).get(`/users/${user.userId}/wishlist`);
                expect(response.status).toBe(200);
                expect(Array.isArray(response.body)).toBe(true);
                if (response.body.length > 0) {
                    expect(response.body[0]).toHaveProperty('productId');
                    expect(response.body[0]).toHaveProperty('name');
                    expect(response.body[0]).toHaveProperty('price');
                }
            });

            it('should return 404 for non-existing user', async () => {
                const response = await request(app).get('/users/999/wishlist');
                expect(response.status).toBe(404);
                expect(response.body.error).toContain('User not found');
            });
        });

        describe('POST /users/:userId/wishlist - Add to wishlist', () => {
            it('should add product to wishlist', async () => {
                const user = seedUsers[0];
                const productId = 1;
                const response = await request(app)
                    .post(`/users/${user.userId}/wishlist`)
                    .send({ productId });
                expect(response.status).toBe(200);
                expect(response.body.wishlistProductIds).toContain(productId);
            });

            it('should reject duplicate product in wishlist', async () => {
                const user = seedUsers[0];
                const productId = 1;
                // Add once
                await request(app)
                    .post(`/users/${user.userId}/wishlist`)
                    .send({ productId });
                // Try to add again
                const response = await request(app)
                    .post(`/users/${user.userId}/wishlist`)
                    .send({ productId });
                expect(response.status).toBe(400);
                expect(response.body.error).toContain('already in wishlist');
            });

            it('should reject invalid product ID', async () => {
                const user = seedUsers[0];
                const productId = 99999;
                const response = await request(app)
                    .post(`/users/${user.userId}/wishlist`)
                    .send({ productId });
                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Invalid product ID');
            });

            it('should reject missing product ID', async () => {
                const user = seedUsers[0];
                const response = await request(app)
                    .post(`/users/${user.userId}/wishlist`)
                    .send({});
                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Product ID is required');
            });

            it('should return 404 for non-existing user', async () => {
                const response = await request(app)
                    .post('/users/999/wishlist')
                    .send({ productId: 1 });
                expect(response.status).toBe(404);
                expect(response.body.error).toContain('User not found');
            });
        });

        describe('DELETE /users/:userId/wishlist/:productId - Remove from wishlist', () => {
            it('should remove product from wishlist', async () => {
                const user = seedUsers[0];
                const productId = 1;
                // Add product first
                await request(app)
                    .post(`/users/${user.userId}/wishlist`)
                    .send({ productId });
                // Remove product
                const response = await request(app)
                    .delete(`/users/${user.userId}/wishlist/${productId}`);
                expect(response.status).toBe(200);
                expect(response.body.wishlistProductIds).not.toContain(productId);
            });

            it('should return 404 for product not in wishlist', async () => {
                const user = seedUsers[0];
                const productId = 1;
                const response = await request(app)
                    .delete(`/users/${user.userId}/wishlist/${productId}`);
                expect(response.status).toBe(404);
                expect(response.body.error).toContain('not found in wishlist');
            });

            it('should return 404 for non-existing user', async () => {
                const response = await request(app)
                    .delete('/users/999/wishlist/1');
                expect(response.status).toBe(404);
                expect(response.body.error).toContain('User not found');
            });
        });
    });
});
