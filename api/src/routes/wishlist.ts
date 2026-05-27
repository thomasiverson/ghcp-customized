/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: API endpoints for managing user wishlists
 */

/**
 * @swagger
 * /api/wishlists:
 *   post:
 *     summary: Create a user wishlist
 *     tags: [Wishlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user ID for the wishlist owner
 *     responses:
 *       201:
 *         description: Wishlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wishlist'
 *       409:
 *         description: Wishlist already exists for this user
 *
 * /api/wishlists/{userId}:
 *   get:
 *     summary: Get a user's wishlist with items
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Wishlist found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wishlistId:
 *                   type: integer
 *                 userId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishlistItem'
 *       404:
 *         description: Wishlist not found
 *   delete:
 *     summary: Clear a user's entire wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       204:
 *         description: Wishlist cleared successfully
 *       404:
 *         description: Wishlist not found
 *
 * /api/wishlists/{userId}/items:
 *   post:
 *     summary: Add a product to a user's wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: The product ID to add to the wishlist
 *     responses:
 *       201:
 *         description: Item added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       404:
 *         description: Wishlist not found
 *       409:
 *         description: Product already in wishlist
 *
 * /api/wishlists/{userId}/items/{productId}:
 *   delete:
 *     summary: Remove a product from a user's wishlist
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Item removed from wishlist
 *       404:
 *         description: Wishlist or item not found
 */

import express from 'express';
import { Wishlist, WishlistItem } from '../models/wishlist';
import { wishlists as seedWishlists, wishlistItems as seedWishlistItems } from '../seedData';

const router = express.Router();

let wishlists: Wishlist[] = [...seedWishlists];
let wishlistItems: WishlistItem[] = [...seedWishlistItems];

// Reset function for testing
export const resetWishlists = () => {
    wishlists = [...seedWishlists];
    wishlistItems = [...seedWishlistItems];
};

// POST /api/wishlists - Create user wishlist
router.post('/', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        res.status(400).send('userId is required');
        return;
    }
    const existing = wishlists.find(w => w.userId === userId);
    if (existing) {
        res.status(409).send('Wishlist already exists for this user');
        return;
    }
    const newWishlist: Wishlist = {
        wishlistId: wishlists.length > 0 ? Math.max(...wishlists.map(w => w.wishlistId)) + 1 : 1,
        userId,
        createdAt: new Date().toISOString()
    };
    wishlists.push(newWishlist);
    res.status(201).json(newWishlist);
});

// GET /api/wishlists/:userId - Get user's wishlist with items
router.get('/:userId', (req, res) => {
    const wishlist = wishlists.find(w => w.userId === req.params.userId);
    if (!wishlist) {
        res.status(404).send('Wishlist not found');
        return;
    }
    const items = wishlistItems.filter(i => i.wishlistId === wishlist.wishlistId);
    res.json({ ...wishlist, items });
});

// POST /api/wishlists/:userId/items - Add product to wishlist
router.post('/:userId/items', (req, res) => {
    const wishlist = wishlists.find(w => w.userId === req.params.userId);
    if (!wishlist) {
        res.status(404).send('Wishlist not found');
        return;
    }
    const { productId } = req.body;
    if (!productId) {
        res.status(400).send('productId is required');
        return;
    }
    const productIdNum = parseInt(productId);
    const alreadyExists = wishlistItems.find(
        i => i.wishlistId === wishlist.wishlistId && i.productId === productIdNum
    );
    if (alreadyExists) {
        res.status(409).send('Product already in wishlist');
        return;
    }
    const newItem: WishlistItem = {
        wishlistItemId: wishlistItems.length > 0 ? Math.max(...wishlistItems.map(i => i.wishlistItemId)) + 1 : 1,
        wishlistId: wishlist.wishlistId,
        productId: productIdNum,
        addedAt: new Date().toISOString()
    };
    wishlistItems.push(newItem);
    res.status(201).json(newItem);
});

// DELETE /api/wishlists/:userId/items/:productId - Remove product from wishlist
router.delete('/:userId/items/:productId', (req, res) => {
    const wishlist = wishlists.find(w => w.userId === req.params.userId);
    if (!wishlist) {
        res.status(404).send('Wishlist not found');
        return;
    }
    const productId = parseInt(req.params.productId);
    const index = wishlistItems.findIndex(
        i => i.wishlistId === wishlist.wishlistId && i.productId === productId
    );
    if (index === -1) {
        res.status(404).send('Item not found in wishlist');
        return;
    }
    wishlistItems.splice(index, 1);
    res.status(204).send();
});

// DELETE /api/wishlists/:userId - Clear entire wishlist
router.delete('/:userId', (req, res) => {
    const wishlist = wishlists.find(w => w.userId === req.params.userId);
    if (!wishlist) {
        res.status(404).send('Wishlist not found');
        return;
    }
    wishlistItems = wishlistItems.filter(i => i.wishlistId !== wishlist.wishlistId);
    res.status(204).send();
});

export default router;
