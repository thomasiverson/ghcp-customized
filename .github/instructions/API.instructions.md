---
applyTo: 'api/**/*.ts'
---

# API-Specific Copilot Instructions

These instructions apply specifically to the backend API code in the `/api` directory.

## API Architecture

The API follows a modular Express.js architecture with clear separation of concerns:
- **Routes** (`src/routes/`): Define HTTP endpoints and request handling
- **Models** (`src/models/`): Define TypeScript interfaces and Swagger schemas
- **Main Entry** (`src/index.ts`): Express app configuration and middleware setup
- **Seed Data** (`src/seedData.ts`): Sample data for demonstration purposes

## Swagger/OpenAPI Documentation

**ALWAYS** include comprehensive Swagger JSDoc comments for:

1. **Models** (`src/models/*.ts`):
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     ModelName:
 *       type: object
 *       required:
 *         - requiredField
 *       properties:
 *         fieldName:
 *           type: string
 *           description: Clear description of the field
 */
export interface ModelName {
  fieldName: string;
}
```

2. **Routes** (`src/routes/*.ts`):
```typescript
/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: Brief summary of what the endpoint does
 *     tags: [ResourceName]
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ModelName'
 */
router.get('/api/resource', (req, res) => { ... });
```

3. **Path Parameters**:
```typescript
/**
 * @swagger
 * /api/resource/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [ResourceName]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource identifier
 */
```

## RESTful Conventions

- Use plural nouns for resource endpoints (`/api/products`, not `/api/product`)
- Implement standard HTTP methods:
  - `GET /api/resources` - List all resources
  - `GET /api/resources/:id` - Get single resource
  - `POST /api/resources` - Create new resource
  - `PUT /api/resources/:id` - Update resource (full replacement)
  - `DELETE /api/resources/:id` - Delete resource
- Return appropriate HTTP status codes:
  - 200 OK - Successful GET, PUT, DELETE
  - 201 Created - Successful POST
  - 404 Not Found - Resource doesn't exist
  - 400 Bad Request - Invalid input

## In-Memory Data Storage

The API uses in-memory arrays for data storage (this is a demo app):
- Data is stored in module-level variables (e.g., `let products: Product[] = [];`)
- Data persists only during the API process lifetime
- Seed data is initialized on startup from `seedData.ts`
- Use array methods for CRUD operations:
  - `find()` for single retrieval
  - `filter()` for multiple retrieval
  - `push()` for creation
  - `splice()` or `filter()` for deletion
  - Direct assignment or `map()` for updates

## Error Handling

- Always validate input parameters
- Return meaningful error messages
- Use try-catch for operations that might fail
- Example:
```typescript
if (!id) {
  return res.status(400).json({ error: 'ID is required' });
}
const resource = resources.find(r => r.id === parseInt(id));
if (!resource) {
  return res.status(404).json({ error: 'Resource not found' });
}
```

## Testing Standards

- Tests live alongside route files (e.g., `branch.test.ts` next to `branch.ts`)
- Use Vitest and Supertest for API route testing
- Structure tests with clear describe/it blocks:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Resource API', () => {
  beforeEach(() => {
    // Reset state if needed
    resetResourceData();
  });

  it('should return all resources', async () => {
    const response = await request(app).get('/api/resources');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
```
- Test both successful operations and error cases
- Use `resetBranchData()` or similar functions to reset in-memory data between tests
- Run tests with: `npm run test:api`

## CORS Configuration

- CORS is enabled for frontend communication
- Development frontend typically runs on port 5137
- In Codespaces, ensure API port visibility is set to "public"

## Common Patterns

### ID Generation
Use `Math.max(...items.map(i => i.id), 0) + 1` for generating new IDs

### Route Module Export
Export an Express Router instance:
```typescript
import express from 'express';
const router = express.Router();
// ... define routes ...
export default router;
```

### Importing Routes in Main
```typescript
import resourceRoutes from './routes/resource';
app.use(resourceRoutes);
```

## Development Workflow

1. Define the model interface with Swagger schema (`src/models/`)
2. Create route handlers with Swagger docs (`src/routes/`)
3. Add sample seed data if needed (`src/seedData.ts`)
4. Write tests for the routes (`src/routes/*.test.ts`)
5. Run tests: `npm run test:api`
6. Start dev server: `npm run dev:api`
7. Verify in Swagger UI: http://localhost:3000/api-docs

## Key Files

- `src/index.ts` - Express app setup, middleware, Swagger configuration
- `src/routes/*.ts` - Individual resource route handlers
- `src/models/*.ts` - TypeScript interfaces with Swagger schemas
- `src/seedData.ts` - Sample data initialization
- `vitest.config.ts` - Test configuration
- `tsconfig.json` - TypeScript configuration
