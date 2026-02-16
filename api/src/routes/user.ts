/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for managing users and wishlists
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or email already exists
 * 
 * /api/users/{email}:
 *   get:
 *     summary: Get user by email (for login)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User email address
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 * 
 * /api/users/id/{userId}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 * 
 * /api/users/{userId}/wishlist:
 *   get:
 *     summary: Get user's wishlist with full product details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of products in user's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       404:
 *         description: User not found
 *   post:
 *     summary: Add product to user's wishlist
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Product already in wishlist or invalid product ID
 *       404:
 *         description: User not found
 * 
 * /api/users/{userId}/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from user's wishlist
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User or product not found in wishlist
 */

import express from 'express';
import { User } from '../models/user';
import { users as seedUsers } from '../seedData';
import { products } from '../seedData';

const router = express.Router();

let users: User[] = [...seedUsers];

// Validation helpers
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
    // Password must be at least 8 characters
    return password.length >= 8;
};

// POST /api/users - Register new user
router.post('/', (req, res) => {
    const { email, name, password } = req.body;

    // Validate required fields
    if (!email || !name || !password) {
        res.status(400).json({ error: 'Email, name, and password are required' });
    } else if (!isValidEmail(email)) {
        // Validate email format
        res.status(400).json({ error: 'Invalid email format' });
    } else if (!isValidPassword(password)) {
        // Validate password requirements
        res.status(400).json({ error: 'Password must be at least 8 characters' });
    } else {
        // Check for duplicate email
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            // Create new user
            const newUser: User = {
                userId: Math.max(0, ...users.map(u => u.userId)) + 1,
                email,
                name,
                isAdmin: email.endsWith('@github.com'), // Admin if GitHub email
                createdAt: new Date(),
                wishlistProductIds: []
            };

            users.push(newUser);
            res.status(201).json(newUser);
        }
    }
});

// GET /api/users/:email - Get user by email (for login)
router.get('/:email', (req, res) => {
    const { email } = req.params;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// PUT /api/users/id/:userId - Update user details
router.put('/id/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const { name, email } = req.body;
    
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
        res.status(404).json({ error: 'User not found' });
    } else {
        // If email is being updated, check for duplicates
        if (email && email !== users[userIndex].email) {
            if (!isValidEmail(email)) {
                res.status(400).json({ error: 'Invalid email format' });
                return;
            }
            const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                res.status(400).json({ error: 'Email already exists' });
                return;
            }
        }

        // Update user
        if (name) users[userIndex].name = name;
        if (email) {
            users[userIndex].email = email;
            users[userIndex].isAdmin = email.endsWith('@github.com');
        }
        
        res.json(users[userIndex]);
    }
});

// GET /api/users/:userId/wishlist - Get user's wishlist with full product details
router.get('/:userId/wishlist', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.userId === userId);
    
    if (user) {
        // Get full product details for each product in wishlist
        const wishlistProducts = products.filter(p => 
            user.wishlistProductIds.includes(p.productId)
        );
        
        res.json(wishlistProducts);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// POST /api/users/:userId/wishlist - Add product to wishlist
router.post('/:userId/wishlist', (req, res) => {
    const userId = parseInt(req.params.userId);
    const { productId } = req.body;
    
    if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
    }
    
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
        res.status(404).json({ error: 'User not found' });
    } else {
        // Verify product exists
        const product = products.find(p => p.productId === productId);
        if (!product) {
            res.status(400).json({ error: 'Invalid product ID' });
            return;
        }
        
        // Check if product is already in wishlist
        if (users[userIndex].wishlistProductIds.includes(productId)) {
            res.status(400).json({ error: 'Product already in wishlist' });
            return;
        }
        
        // Add to wishlist
        users[userIndex].wishlistProductIds.push(productId);
        
        res.json(users[userIndex]);
    }
});

// DELETE /api/users/:userId/wishlist/:productId - Remove from wishlist
router.delete('/:userId/wishlist/:productId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);
    
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
        res.status(404).json({ error: 'User not found' });
    } else {
        const productIndex = users[userIndex].wishlistProductIds.indexOf(productId);
        
        if (productIndex === -1) {
            res.status(404).json({ error: 'Product not found in wishlist' });
        } else {
            // Remove from wishlist
            users[userIndex].wishlistProductIds.splice(productIndex, 1);
            
            res.json(users[userIndex]);
        }
    }
});

// Helper function to reset users for testing
export function resetUsers() {
    users = [...seedUsers];
}

export default router;
