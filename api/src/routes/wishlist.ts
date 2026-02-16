/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: API endpoints for managing user wishlists
 */

/**
 * @swagger
 * /api/wishlist/{email}:
 *   get:
 *     summary: Get all wishlist items for a user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email address
 *     responses:
 *       200:
 *         description: List of wishlist items for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WishlistItem'
 * 
 * /api/wishlist:
 *   post:
 *     summary: Add a product to the wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User email address
 *               productId:
 *                 type: integer
 *                 description: Product ID to add to wishlist
 *     responses:
 *       201:
 *         description: Product added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: Product already in wishlist or product not found
 *       404:
 *         description: Product not found
 * 
 * /api/wishlist/{email}/{productId}:
 *   delete:
 *     summary: Remove a product from the wishlist
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email address
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product removed from wishlist successfully
 *       404:
 *         description: Wishlist item not found
 */

import express from 'express';
import { WishlistItem } from '../models/wishlist';
import { wishlistItems as seedWishlistItems } from '../seedData';
import { products as seedProducts } from '../seedData';

const router = express.Router();

let wishlistItems: WishlistItem[] = [...seedWishlistItems];

// Add reset function for testing
export const resetWishlist = () => {
  wishlistItems = [...seedWishlistItems];
};

// Get all wishlist items for a user
router.get('/:email', (req, res) => {
  const userWishlist = wishlistItems.filter(item => item.email === req.params.email);
  res.json(userWishlist);
});

// Add a product to the wishlist
router.post('/', (req, res) => {
  const { email, productId } = req.body;
  
  // Validate that product exists
  const productExists = seedProducts.some(p => p.productId === productId);
  if (!productExists) {
    res.status(404).send('Product not found');
    return;
  }
  
  // Check if already in wishlist (prevent duplicates)
  const existingItem = wishlistItems.find(
    item => item.email === email && item.productId === productId
  );
  if (existingItem) {
    res.status(400).send('Product already in wishlist');
    return;
  }
  
  // Create new wishlist item
  const newWishlistItem: WishlistItem = {
    wishlistItemId: Math.max(...wishlistItems.map(item => item.wishlistItemId), 0) + 1,
    email,
    productId,
    addedAt: new Date()
  };
  
  wishlistItems.push(newWishlistItem);
  res.status(201).json(newWishlistItem);
});

// Remove a product from the wishlist
router.delete('/:email/:productId', (req, res) => {
  const { email, productId } = req.params;
  const index = wishlistItems.findIndex(
    item => item.email === email && item.productId === parseInt(productId)
  );
  
  if (index !== -1) {
    wishlistItems.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).send('Wishlist item not found');
  }
});

export default router;
