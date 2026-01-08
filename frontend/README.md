# Frontend - PixelVault

This is the Next.js frontend application for PixelVault.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## 📁 Structure

- `app/` - Next.js App Router (pages, layouts, API routes)
- `src/` - React components, hooks, and utilities
- `public/` - Static assets

## 🔗 Backend Integration

The frontend imports backend utilities using the `@/backend/*` path alias:

```typescript
import { testConnection } from '@/backend/lib/db';
```

This alias is configured in `tsconfig.json` to point to `../backend/*`.

## 📝 More Information

See the root [README.md](../README.md) for complete project documentation.
