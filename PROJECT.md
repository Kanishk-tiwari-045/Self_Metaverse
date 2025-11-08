# 2D Metaverse Project

A comprehensive 2D Metaverse application built with modern web technologies, featuring real-time multiplayer spaces, user management, and dynamic element placement.

## 🏗️ Architecture

This project is a **monorepo** built with:
- **Turborepo** - Build system and task runner
- **pnpm** - Package manager
- **TypeScript** - Type safety across all packages
- **Prisma** - Database ORM with Neon PostgreSQL
- **Express.js** - HTTP API server
- **Next.js** - Web frontend

## 📁 Project Structure

```
2d-metaverse/
├── apps/
│   ├── http/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── index.ts      # Server entry point
│   │   │   └── routes/v1/    # API routes
│   │   │       ├── index.ts  # Auth routes (signin/signup)
│   │   │       ├── user.ts   # User management
│   │   │       ├── space.ts  # Space operations
│   │   │       └── admin.ts  # Admin operations
│   │   └── package.json
│   └── web/                  # Next.js frontend
│       ├── app/
│       └── package.json
├── packages/
│   ├── db/                   # Database package
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   ├── src/
│   │   │   └── index.ts      # Prisma client exports
│   │   └── package.json
│   ├── ui/                   # Shared UI components
│   ├── eslint-config/        # ESLint configurations
│   └── typescript-config/    # TypeScript configurations
├── .env                      # Environment variables
├── postman-collection.json   # API testing collection
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # pnpm workspace config
└── turbo.json               # Turborepo configuration
```

## 🗄️ Database Schema

### Tables:
- **users** - User accounts with roles (admin/user)
- **avatars** - Available avatar images
- **elements** - Interactive/static elements for spaces
- **spaces** - User-created virtual spaces
- **maps** - Predefined map templates
- **space_elements** - Element placements in spaces
- **map_elements** - Element placements in maps

### Relationships:
- Users can own multiple spaces
- Spaces can contain multiple elements
- Users have avatars
- Elements can be placed in both spaces and maps

## 🚀 Getting Started

### Prerequisites

- **Node.js** (>= 18)
- **pnpm** (recommended) or npm
- **Neon PostgreSQL** database (or any PostgreSQL instance)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd 2d-metaverse

# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Database Setup

#### A. Set up Neon Database (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string

#### B. Configure Environment Variables
```bash
# Copy and edit the environment file
cp .env.example .env
```

Edit `.env` and add your database connection string:
```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

#### C. Initialize Database
```bash
# Navigate to database package
cd packages/db

# Generate Prisma client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Optional: Open Prisma Studio to view data
pnpm db:studio
```

### 3. Build the Project

```bash
# Return to root directory
cd ../..

# Build all packages
pnpm build
```

### 4. Start Development

```bash
# Start all applications in development mode
pnpm dev

# OR start individual applications:

# Start HTTP API server (http://localhost:3000)
cd apps/http
pnpm dev

# Start Next.js web app (http://localhost:3001)
cd apps/web
pnpm dev
```

## 🛠️ Available Commands

### Root Level Commands

```bash
# Install all dependencies
pnpm install

# Build all packages and applications
pnpm build

# Start all applications in development mode
pnpm dev

# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check all packages
pnpm check-types
```

### Database Commands (packages/db/)

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Push schema changes to database (development)
pnpm db:push

# Create and run migrations (production)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio

# Reset database (⚠️ destructive)
prisma db reset
```

### HTTP API Commands (apps/http/)

```bash
# Development with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Start production server
pnpm start
```

### Web App Commands (apps/web/)

```bash
# Development with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔌 API Endpoints

The HTTP API server runs on `http://localhost:3000` and provides the following endpoints:

### Authentication
- `POST /api/v1/signup` - Register new user
- `POST /api/v1/signin` - User authentication

### Public Endpoints
- `GET /api/v1/elements` - Get all elements
- `GET /api/v1/avatars` - Get all avatars

### User Management
- `POST /api/v1/users/metadata` - Update user metadata
- `GET /api/v1/users/metadata/bulk` - Get bulk user data

### Space Management
- `POST /api/v1/spaces/` - Create space
- `GET /api/v1/spaces/:id` - Get specific space
- `DELETE /api/v1/spaces/:id` - Delete space
- `GET /api/v1/spaces/all` - Get all spaces
- `POST /api/v1/spaces/element` - Add element to space
- `DELETE /api/v1/spaces/element` - Remove element from space

### Admin Operations
- `POST /api/v1/admins/element` - Create element
- `PUT /api/v1/admins/element/:id` - Update element
- `POST /api/v1/admins/avatar` - Create avatar
- `GET /api/v1/admins/avatar` - Get avatars
- `POST /api/v1/admins/map` - Create map
- `GET /api/v1/admins/map/:id` - Get map with elements

## 📋 API Testing

Import the `postman-collection.json` file into Postman for comprehensive API testing.

### Testing Workflow:
1. Create user with `POST /api/v1/signup`
2. Authenticate with `POST /api/v1/signin`
3. Create elements/avatars using admin endpoints
4. Create and manage spaces
5. Add/remove elements from spaces

## 🏗️ Development Workflow

### Making Changes

1. **Database Schema Changes:**
   ```bash
   # Edit packages/db/prisma/schema.prisma
   cd packages/db
   pnpm db:generate
   pnpm db:push  # or db:migrate for production
   ```

2. **API Changes:**
   ```bash
   # Edit files in apps/http/src/routes/
   # Server auto-reloads with pnpm dev
   ```

3. **Frontend Changes:**
   ```bash
   # Edit files in apps/web/app/
   # Next.js auto-reloads with pnpm dev
   ```

### Adding New Packages

```bash
# Add dependency to specific workspace
pnpm add <package-name> --filter=<workspace-name>

# Examples:
pnpm add lodash --filter=http
pnpm add @types/lodash --filter=http --save-dev
```

## 🚀 Production Deployment

### Build for Production
```bash
pnpm build
```

### Environment Variables
Ensure these are set in production:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production`
- `PORT` - Server port (default: 3000)

### Database Migrations
```bash
cd packages/db
pnpm db:migrate
```
## 📚 Technology Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (Neon), Prisma ORM
- **Frontend:** Next.js 15, React, TypeScript
- **Build System:** Turborepo, pnpm
- **Development:** tsx (TypeScript execution), ESLint, Prettier