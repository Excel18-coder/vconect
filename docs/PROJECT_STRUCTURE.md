# Project Structure

## Overview

This document describes the organization of the V-Market project codebase.

## Directory Structure

```
v-market/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Data access layer
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── validators/        # Input validation
│   │   ├── utils/             # Utility functions
│   │   └── config/            # Configuration files
│   ├── scripts/               # Backend utility scripts
│   │   └── admin/             # Admin management scripts
│   ├── migrations/            # Database migrations
│   └── docs/                  # Backend documentation
│
├── src/                       # Frontend React application
│   ├── components/            # React components
│   │   ├── ui/               # UI primitives (shadcn/ui)
│   │   └── admin/            # Admin-specific components
│   ├── pages/                # Page components
│   ├── features/             # Feature modules
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API services
│   ├── lib/                  # Utility libraries
│   └── config/               # Frontend configuration
│
├── public/                    # Static assets
│   └── images/               # Public images
│
├── database/                  # Database scripts & migrations
│   └── migrations/           # SQL migration files
│
├── docs/                      # Project documentation
│   └── admin/                # Admin system documentation
│
├── scripts/                   # Project scripts
│   └── tests/                # Test scripts
│
└── [config files]            # Root configuration files

```

## Key Directories

### Backend (`/backend`)

The backend is a Node.js/Express REST API with a layered architecture:

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Handle database operations
- **Routes**: Define API endpoints
- **Middleware**: Authentication, validation, error handling

### Frontend (`/src`)

The frontend is a React application built with TypeScript and Vite:

- **components**: Reusable UI components
- **pages**: Top-level page components
- **hooks**: Custom React hooks
- **services**: API integration layer

### Documentation (`/docs`)

Project documentation is organized by topic:

- **admin**: Admin system documentation and guides

### Scripts (`/scripts`)

Utility scripts for development and testing:

- **tests**: Test scripts for various features

## Configuration Files

Root-level configuration files:

- `package.json` - Frontend dependencies and scripts
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `.gitignore` - Git ignore rules

## Best Practices

1. **Separation of Concerns**: Keep business logic in services, not controllers
2. **Type Safety**: Use TypeScript for all new frontend code
3. **Component Organization**: Keep components small and focused
4. **API Layer**: All API calls go through the services layer
5. **Documentation**: Update docs when adding new features

## Development Workflow

1. Backend changes go in `/backend/src`
2. Frontend changes go in `/src`
3. Database changes require a migration in `/backend/migrations`
4. Document significant features in `/docs`
5. Test scripts belong in `/scripts/tests`

## Further Reading

- [Backend README](../backend/README.md)
- [Admin Documentation](./admin/)
- [Main README](../README.md)
