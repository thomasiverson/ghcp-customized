---
applyTo: 'frontend/**/*.{ts,tsx}'
---

# Frontend-Specific Copilot Instructions

These instructions apply specifically to the React frontend code in the `/frontend` directory.

## Frontend Architecture

The frontend is a modern React application with the following structure:
- **Components** (`src/components/`): React components organized by feature/entity
- **Context** (`src/context/`): React Context providers for shared state
- **API Config** (`src/api/`): API endpoint configuration and utilities
- **Entry Point** (`src/main.tsx`): React app initialization and routing setup

## Component Structure

### Functional Components with Hooks
Always use functional components with React Hooks (never class components):

```typescript
import { useState, useEffect } from 'react';

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export default function ComponentName({ title, onAction }: ComponentProps) {
  const [state, setState] = useState<string>('');
  
  useEffect(() => {
    // Effect logic here
  }, []);

  return (
    <div className="container">
      {/* Component JSX */}
    </div>
  );
}
```

### Component Organization
- Place entity-specific components in `components/entity/[entityName]/`
- Examples: `components/entity/product/Products.tsx`, `components/entity/product/ProductForm.tsx`
- Shared/common components go in `components/` root
- Admin components go in `components/admin/`

## TypeScript Interfaces

Always define TypeScript interfaces for:

1. **Component Props**:
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}
```

2. **Data Models** (matching API models):
```typescript
interface Product {
  productId: number;
  name: string;
  description: string;
  price: number;
  imgName: string;
  sku: string;
  unit: string;
  supplierId: number;
  discount?: number;
}
```

3. **Component State**:
```typescript
interface FormState {
  email: string;
  password: string;
  errors: Record<string, string>;
}
```

## Data Fetching with React Query

Use React Query (v3) for all data fetching:

```typescript
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { api } from '../../api/config';

// Fetch function
const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

// In component
export default function Products() {
  const { data: products, isLoading, error } = useQuery('products', fetchProducts);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return <div>{/* Render products */}</div>;
}
```

### Mutations
```typescript
const mutation = useMutation(
  (newProduct: Product) => axios.post(`${api.baseURL}${api.endpoints.products}`, newProduct),
  {
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries('products');
    },
  }
);
```

## Styling with Tailwind CSS

- Use Tailwind utility classes for all styling (no CSS files for component styles)
- Follow responsive design patterns: `sm:`, `md:`, `lg:` breakpoints
- Use theme-aware classes for dark mode support
- Common patterns:
  - Containers: `container mx-auto px-4`
  - Cards: `bg-white dark:bg-gray-800 rounded-lg shadow-md p-6`
  - Buttons: `bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`
  - Forms: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2`

## Theme Context

Use the ThemeContext for dark mode support:

```typescript
import { useTheme } from '../../context/ThemeContext';

export default function Component() {
  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <div className={darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
      {/* Component content */}
    </div>
  );
}
```

## State Management

### Local State
Use `useState` for component-local state:
```typescript
const [searchTerm, setSearchTerm] = useState<string>('');
const [isOpen, setIsOpen] = useState<boolean>(false);
const [items, setItems] = useState<Item[]>([]);
```

### Derived State
Use React Query for server state and `useMemo` for expensive computed values:
```typescript
const filteredProducts = useMemo(() => 
  products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [products, searchTerm]
);
```

### Context
Use React Context for app-wide state (auth, theme):
```typescript
// In context provider
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In components
const { user, isAuthenticated } = useContext(AuthContext);
```

## Routing

Use React Router v7 for navigation:

```typescript
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Navigation
<Link to="/products" className="nav-link">Products</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate('/products');

// Route definition
<Routes>
  <Route path="/products" element={<Products />} />
  <Route path="/products/:id" element={<ProductDetail />} />
</Routes>
```

## Error Handling

Always implement loading and error states:

```typescript
export default function DataComponent() {
  const { data, isLoading, error } = useQuery('key', fetchFunction);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  return <div>{/* Render data */}</div>;
}
```

## Forms

Use controlled components for forms:

```typescript
export default function FormComponent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit
      </button>
    </form>
  );
}
```

## Image Handling

- Images are stored in `public/` directory
- Reference images using `/imageName.png` path
- Product images use `imgName` property from API
- Example: `<img src={`/${product.imgName}`} alt={product.name} />`

## API Configuration

API endpoints are centralized in `src/api/config.ts`:

```typescript
export const api = {
  baseURL: 'http://localhost:3000',
  endpoints: {
    products: '/api/products',
    suppliers: '/api/suppliers',
    // ... other endpoints
  }
};
```

## Testing

- Tests use Vitest with React Testing Library
- Test files are typically `*.test.tsx` alongside components
- Focus on user interactions and component behavior
- Run tests with: `npm run test:frontend`

## Common Patterns

### Modal/Dialog
```typescript
const [showModal, setShowModal] = useState(false);

return (
  <>
    <button onClick={() => setShowModal(true)}>Open</button>
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          {/* Modal content */}
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      </div>
    )}
  </>
);
```

### Search/Filter
```typescript
const [searchTerm, setSearchTerm] = useState('');
const filteredItems = items?.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## Development Workflow

1. Create component in appropriate directory
2. Define TypeScript interfaces for props and data
3. Implement component with hooks
4. Add Tailwind CSS styling
5. Handle loading and error states
6. Test in browser: `npm run dev:frontend`
7. Build for production: `npm run build --workspace=frontend`

## Key Files

- `src/main.tsx` - App entry point, routing configuration
- `src/App.tsx` - Root component
- `src/components/` - All React components
- `src/context/` - Context providers (Auth, Theme)
- `src/api/config.ts` - API configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
