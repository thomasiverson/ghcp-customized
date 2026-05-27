/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Wishlist analytics endpoints for admin dashboard
 */

import express from 'express';
import {
  calculateProductWishlistStats,
  calculateUserWishlistMetrics,
  calculateConversionRates,
  generateHeatmaps,
  analyzeSeasonalTrends,
  calculatePriceElasticity,
  generateRecommendations,
  getPopularCategories,
  getProductTrends,
} from '../services/analytics';

const router = express.Router();

// Simple 5-minute in-memory cache
const cache: Record<string, { data: unknown; expires: number }> = {};
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(key: string, fn: () => T): T {
  const now = Date.now();
  if (cache[key] && cache[key].expires > now) {
    return cache[key].data as T;
  }
  const data = fn();
  cache[key] = { data, expires: now + CACHE_TTL };
  return data;
}

/**
 * @swagger
 * /api/analytics/wishlist/overview:
 *   get:
 *     summary: Get overall wishlist statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Overview metrics
 */
router.get('/wishlist/overview', (_req, res) => {
  const data = getCached('overview', calculateUserWishlistMetrics);
  res.json(data);
});

/**
 * @swagger
 * /api/analytics/wishlist/products:
 *   get:
 *     summary: Get product-level wishlist data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Product wishlist stats
 */
router.get('/wishlist/products', (_req, res) => {
  const data = getCached('products', calculateProductWishlistStats);
  res.json(data);
});

/**
 * @swagger
 * /api/analytics/wishlist/trends:
 *   get:
 *     summary: Get trending products
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Product trend data
 */
router.get('/wishlist/trends', (_req, res) => {
  const data = getCached('trends', getProductTrends);
  res.json(data);
});

/**
 * @swagger
 * /api/analytics/wishlist/conversion:
 *   get:
 *     summary: Get conversion funnel data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Conversion funnel stages
 */
router.get('/wishlist/conversion', (_req, res) => {
  const data = getCached('conversion', calculateConversionRates);
  res.json(data);
});

/**
 * @swagger
 * /api/analytics/wishlist/heatmap:
 *   get:
 *     summary: Get activity heatmap data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Hourly and daily activity data
 */
router.get('/wishlist/heatmap', (_req, res) => {
  const data = getCached('heatmap', generateHeatmaps);
  res.json(data);
});

/**
 * @swagger
 * /api/analytics/wishlist/categories:
 *   get:
 *     summary: Get category analysis data
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Category statistics including seasonal trends
 */
router.get('/wishlist/categories', (_req, res) => {
  const categories = getCached('categories', getPopularCategories);
  const seasonal = getCached('seasonal', analyzeSeasonalTrends);
  res.json({ categories, seasonal });
});

/**
 * @swagger
 * /api/analytics/wishlist/users:
 *   get:
 *     summary: Get user behavior metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: User wishlist behavior data including price elasticity
 */
router.get('/wishlist/users', (_req, res) => {
  const overview = getCached('overview', calculateUserWishlistMetrics);
  const elasticity = getCached('elasticity', calculatePriceElasticity);
  res.json({ overview, elasticity });
});

/**
 * @swagger
 * /api/analytics/wishlist/export:
 *   post:
 *     summary: Export analytics data to CSV
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.post('/wishlist/export', (_req, res) => {
  const products = getCached('products', calculateProductWishlistStats);

  const header = 'Product ID,Product Name,Wishlist Count,Add Rate,Remove Rate,Conversion Rate (%),Avg Days on Wishlist,Price Elasticity\n';
  const rows = products
    .map(
      (p) =>
        `${p.productId},"${p.productName}",${p.wishlistCount},${p.addRate},${p.removeRate},${p.conversionRate},${p.averageDaysOnWishlist},${p.priceElasticity}`
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="wishlist-analytics.csv"');
  res.send(header + rows);
});

/**
 * @swagger
 * /api/analytics/wishlist/insights:
 *   get:
 *     summary: Get business insights and recommendations
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Business insights and recommendations
 */
router.get('/wishlist/insights', (_req, res) => {
  const data = getCached('insights', generateRecommendations);
  res.json(data);
});

export default router;
