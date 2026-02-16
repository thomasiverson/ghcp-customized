/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - wishlistItemId
 *         - email
 *         - productId
 *         - addedAt
 *       properties:
 *         wishlistItemId:
 *           type: integer
 *           description: The unique identifier for the wishlist item
 *         email:
 *           type: string
 *           description: Email address of the user
 *         productId:
 *           type: integer
 *           description: The ID of the product in the wishlist
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the item was added to the wishlist
 */
export interface WishlistItem {
    wishlistItemId: number;
    email: string;
    productId: number;
    addedAt: Date;
}
