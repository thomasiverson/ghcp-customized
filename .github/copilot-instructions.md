# OctoCAT Supply Chain Management System - Copilot Instructions

## Project Overview

This is a demonstration application showcasing GitHub Copilot capabilities. The OctoCAT Supply Chain Management System is a full-stack TypeScript application that manages supply chain operations including products, suppliers, orders, deliveries, and branches.

**Purpose:** Demo/training application to showcase GitHub Copilot, GHAS, and AI-assisted development features.

**Target Audience:** Developers learning about GitHub Copilot capabilities, including Agent Mode, Vision, MCP Server Integration, and custom instructions.

## Tech Stack

### Backend (API)
- **Language:** TypeScript
- **Runtime:** Node.js (>=18)
- **Framework:** Express.js
- **API Documentation:** Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express)
- **Testing:** Vitest with Supertest
- **Build:** TypeScript Compiler (tsc)

### Frontend
- **Language:** TypeScript
- **Framework:** React 18+
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v7
- **State Management:** React Query (v3)
- **HTTP Client:** Axios

### DevOps
- **Containerization:** Docker/Docker Compose
- **Package Manager:** npm workspaces

## Project Structure

```
/
├── .github/              # GitHub-specific configurations
│   ├── agents/          # Custom Copilot agents (Chat Mode)
│   ├── prompts/         # Copilot prompt files for automation
│   ├── workflows/       # GitHub Actions workflows
│   └── instructions/    # Path-specific Copilot instructions
├── api/                 # Backend API workspace
│   ├── src/
│   │   ├── index.ts    # Main entry point
│   │   ├── models/     # Data models with Swagger schemas
│   │   ├── routes/     # Express routes with Swagger docs
│   │   └── seedData.ts # Sample data initialization
│   └── package.json
├── frontend/            # React frontend workspace
│   ├── src/
│   │   ├── components/ # React components (organized by feature)
│   │   ├── context/    # React context providers
│   │   └── api/        # API configuration
│   └── package.json
├── docs/               # Project documentation
└── package.json        # Root workspace configuration
```

## Coding Standards

### General
- Use TypeScript for all code (strict mode enabled)
- Use ES6+ features (async/await, arrow functions, destructuring)
- Prefer functional programming patterns where appropriate
- Keep files focused and modular (single responsibility)
- Use meaningful, descriptive variable and function names

### TypeScript
- Always define interfaces for data structures
- Use explicit return types for functions
- Avoid `any` type; use `unknown` if type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### API Development (Express.js)
- Use Swagger/OpenAPI JSDoc comments for all routes and models
- Follow RESTful conventions:
  - GET for retrieval
  - POST for creation
  - PUT for full updates
  - PATCH for partial updates
  - DELETE for removal
- Structure routes consistently:
  ```typescript
  /**
   * @swagger
   * /api/resource:
   *   get:
   *     summary: Description
   *     tags: [TagName]
   *     responses:
   *       200:
   *         description: Success response
   */
  router.get('/api/resource', (req, res) => { ... });
  ```
- Use express.Router() for modular route definitions
- Enable CORS appropriately for frontend communication

### Frontend Development (React)
- Use functional components with hooks (no class components)
- Prefer named exports for components
- Use React Query for data fetching and caching
- Implement loading and error states for async operations
- Use Tailwind CSS utility classes for styling
- Organize components by feature/entity in subdirectories
- Use TypeScript interfaces for component props and data structures
- Implement responsive design patterns

### Testing
- Use Vitest for all tests
- Use Supertest for API route testing
- Include describe/it blocks with clear descriptions
- Test both success and error cases
- Mock external dependencies appropriately
- Reset state between tests using beforeEach/afterEach
- Run tests with: `npm run test:api` (API) or `npm test` (all workspaces)

### Documentation
- Use JSDoc comments for functions and complex logic
- Keep Swagger documentation in sync with API implementation
- Update README.md when adding new features or changing setup
- Document non-obvious decisions and workarounds

## Build and Development Commands

### Development
```bash
npm install              # Install all workspace dependencies
npm run dev             # Start both API and frontend in dev mode
npm run dev:api         # Start only API (port 3000)
npm run dev:frontend    # Start only frontend (port 5137)
```

### Building
```bash
npm run build           # Build all workspaces
npm run build --workspace=api       # Build API only
npm run build --workspace=frontend  # Build frontend only
```

### Testing
```bash
npm run test            # Run all tests
npm run test:api        # Run API tests (Vitest)
npm run test:frontend   # Run frontend tests
```

### Linting
```bash
npm run lint            # Lint frontend code (ESLint)
```

## Data Model

The application follows an entity-relationship model for a supply chain system:

- **Headquarters** (1) → (N) **Branch**
- **Branch** (1) → (N) **Order**
- **Order** (1) → (N) **OrderDetail**
- **OrderDetail** (1) → (N) **OrderDetailDelivery**
- **OrderDetail** (N) → (1) **Product**
- **Delivery** (1) → (N) **OrderDetailDelivery**
- **Supplier** (1) → (N) **Delivery**

See `/api/ERD.png` for visual representation.

## Important Notes

- The API runs on port 3000, frontend on port 5137
- In Codespaces, set API port visibility to "public" to avoid CORS issues
- This is a demo application - prioritize clarity and demonstration value over production optimizations
- The entire project was created using AI and GitHub Copilot
- Sample data is seeded on API startup for demonstration purposes

## Resources

- [Full Architecture Documentation](./docs/architecture.md)
- [Build Instructions](./docs/build.md)
- [Demo Script](./docs/demo-script.md)
- [API Swagger Documentation](http://localhost:3000/api-docs) (when running)
