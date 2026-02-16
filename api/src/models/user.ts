/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - userId
 *         - email
 *         - name
 *       properties:
 *         userId:
 *           type: integer
 *           description: The unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address (must be unique)
 *         name:
 *           type: string
 *           description: The user's full name
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user has admin privileges
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the user was created
 *         wishlistProductIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of product IDs in the user's wishlist
 *           default: []
 */
export interface User {
    userId: number;
    email: string;
    name: string;
    isAdmin: boolean;
    createdAt: Date;
    wishlistProductIds: number[];
}
