/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       required:
 *         - wishlistId
 *         - userId
 *         - createdAt
 *       properties:
 *         wishlistId:
 *           type: integer
 *           description: The unique identifier for the wishlist
 *         userId:
 *           type: string
 *           description: The ID of the user who owns this wishlist
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the wishlist was created
 *     WishlistItem:
 *       type: object
 *       required:
 *         - wishlistItemId
 *         - wishlistId
 *         - productId
 *         - addedAt
 *       properties:
 *         wishlistItemId:
 *           type: integer
 *           description: The unique identifier for the wishlist item
 *         wishlistId:
 *           type: integer
 *           description: The ID of the wishlist this item belongs to
 *         productId:
 *           type: integer
 *           description: The ID of the product added to the wishlist
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the item was added to the wishlist
 */
export interface Wishlist {
    wishlistId: number;
    userId: string;
    createdAt: string;
}

export interface WishlistItem {
    wishlistItemId: number;
    wishlistId: number;
    productId: number;
    addedAt: string;
}
