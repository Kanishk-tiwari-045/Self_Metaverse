# Self-Metaverse Project Documentation

## Project Overview

### Project Name and Purpose

**Self-Metaverse** is a modern, scalable 2D metaverse platform that enables users to create virtual spaces, interact with dynamic elements, and participate in immersive multiplayer experiences. The platform serves as a foundation for building virtual worlds where users can collaborate, socialize, and create content in real-time.

### Core Problem Solved

Traditional virtual spaces often lack scalability, real-time interactivity, and easy content creation tools. Self-Metaverse addresses these issues by providing:

- Scalable real-time multiplayer spaces
- Intuitive space creation and management
- Dynamic element placement and interaction
- Video calling capabilities for enhanced communication
- Admin tools for content moderation and management

### High-Level Architecture and Design Philosophy

The project follows a **microservices architecture within a monorepo** design:

- **Monorepo Structure**: Uses Turborepo for efficient build orchestration and shared code management
- **Service Separation**: Dedicated services for HTTP API, WebSocket real-time communication, SFU video processing, and frontend
- **Scalable Video**: SFU (Selective Forwarding Unit) architecture for efficient video conferencing
- **Type Safety**: Full TypeScript implementation for reliability and developer experience
- **Database Abstraction**: Prisma ORM for type-safe database operations

### Tech Stack and Justification

- **Build System**: Turborepo - Chosen for its speed and monorepo optimization over alternatives like Lerna
- **Package Manager**: pnpm - Faster and more efficient than npm, with better workspace support
- **Language**: TypeScript - Provides type safety, better IDE support, and reduces runtime errors
- **Frontend**: React + Vite - Modern, fast development experience; Vite chosen over Create React App for superior build performance
- **2D Graphics**: Phaser.js - Powerful HTML5 game framework for 2D rendering and game logic
- **Backend**: Express.js - Lightweight, flexible Node.js framework for API development
- **Database**: PostgreSQL with Prisma - Type-safe ORM, excellent for complex relationships
- **Real-time**: WebSocket (ws library) - Native WebSocket implementation for low-latency communication
- **Video**: mediasoup - Industry-standard SFU for scalable WebRTC video calls
- **Styling**: Tailwind CSS - Utility-first CSS for rapid UI development
- **State Management**: React Context + custom hooks - Simple, React-native approach avoiding complex libraries

### Target Users and Use Cases

- **Content Creators**: Users who want to build and share virtual spaces
- **Communities**: Groups needing virtual meeting spaces with video capabilities
- **Educators**: Teachers creating interactive learning environments
- **Businesses**: Companies requiring virtual collaboration spaces
- **Gamers**: Players seeking social gaming experiences

## Project Structure Analysis

### Complete Directory Tree

```
Self-metaverse/
├── apps/
│   ├── frontend/              # React/Vite frontend application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── contexts/      # React context providers
│   │   │   ├── game/          # Phaser.js game logic
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── pages/         # Page components/routes
│   │   │   ├── services/      # API and external service integrations
│   │   │   ├── styles/        # CSS and styling files
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── http/                  # Express.js REST API server
│   │   ├── src/
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── routes/v1/     # API route handlers
│   │   │   ├── services/      # Business logic services
│   │   │   └── types/         # API type definitions
│   │   └── package.json
│   ├── sfu-server/            # mediasoup SFU video server
│   │   ├── src/
│   │   │   ├── SFURoomManager.ts    # Room management logic
│   │   │   ├── SFUServer.ts         # WebSocket signaling server
│   │   │   ├── SFUTransportManager.ts # WebRTC transport handling
│   │   │   └── types.ts             # SFU type definitions
│   │   └── package.json
│   └── ws/                    # WebSocket real-time server
│       ├── src/
│       │   ├── RoomManager.ts # Real-time room management
│       │   ├── User.ts        # User connection handling
│       │   └── types.ts       # WebSocket types
│       └── package.json
├── packages/
│   ├── db/                    # Shared database package
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   │   ├── src/
│   │   │   └── index.ts       # Prisma client export
│   │   └── package.json
│   ├── eslint-config/         # Shared ESLint configuration
│   ├── typescript-config/     # Shared TypeScript configuration
│   └── ui/                    # Shared UI components (if used)
├── turbo.json                 # Turborepo configuration
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── package.json               # Root package.json
├── README.md                  # Project documentation
├── PROJECT.md                 # Detailed setup guide
└── postman-collection.json    # API testing collection
```

### File Organization Strategy

The project uses a **feature-based organization** within a monorepo structure:

- **Apps Directory**: Each deployable service is isolated in its own directory
- **Packages Directory**: Shared code and configurations are centralized
- **Clear Separation**: Frontend, backend services, and infrastructure are distinctly separated
- **Type Safety**: TypeScript types are co-located with their usage for better maintainability

This structure was chosen for:

- **Scalability**: Easy to add new services or split existing ones
- **Developer Experience**: Clear boundaries and focused development
- **Deployment Flexibility**: Each app can be deployed independently
- **Code Reuse**: Shared packages prevent duplication

### Key Files and Their Roles

- `package.json` (root): Defines workspace scripts and dependencies
- `turbo.json`: Configures build pipelines and task dependencies
- `apps/frontend/src/main.tsx`: React application entry point
- `apps/http/src/index.ts`: Express server startup
- `apps/sfu-server/src/index.ts`: SFU server initialization
- `apps/ws/src/index.ts`: WebSocket server entry point
- `packages/db/prisma/schema.prisma`: Database schema definition

### Entry Points and Application Flow

1. **Frontend**: `main.tsx` → `App.tsx` → Router → Pages
2. **HTTP API**: `index.ts` → Express app → Route handlers → Services → Database
3. **WebSocket**: `index.ts` → WebSocket server → Room management → Real-time events
4. **SFU**: `index.ts` → mediasoup workers → Room management → WebRTC handling

## Detailed File-by-File Breakdown

### Frontend Application Files

#### `apps/frontend/src/main.tsx`

- **Purpose**: React application entry point and root rendering
- **Key Functions**: Creates React root, renders App component
- **Dependencies**: React, ReactDOM
- **Interactions**: Initializes the entire frontend application

#### `apps/frontend/src/App.tsx`

- **Purpose**: Main application component with routing
- **Key Components**: Router setup, protected routes, context providers
- **Dependencies**: React Router, context providers
- **Interactions**: Manages application state and navigation

#### `apps/frontend/src/services/WorkAdventureVideoService.ts`

- **Purpose**: Handles video calling functionality using SFU architecture
- **Key Classes**: `WorkAdventureVideoService` class
- **Key Functions**:
  - `initialize()`: Sets up mediasoup device and WebSocket connection
  - `joinRoom()`: Joins video room with participant management
  - `startProducing()`: Begins sending local media streams
  - `handleSFUMessage()`: Processes SFU server messages
- **Dependencies**: mediasoup-client, WebSocket API
- **Interactions**: Communicates with SFU server for video conferencing

#### `apps/frontend/src/game/GameScene.ts`

- **Purpose**: Phaser.js game scene managing 2D world rendering
- **Key Classes**: Phaser.Scene extension
- **Key Functions**:
  - `preload()`: Loads game assets
  - `create()`: Initializes game objects and physics
  - `update()`: Game loop for continuous updates
- **Dependencies**: Phaser.js
- **Interactions**: Integrates with player movement and map rendering

#### `apps/frontend/src/pages/MapViewPhaser.tsx`

- **Purpose**: Main game view page combining Phaser canvas with UI
- **Key Features**: Video call integration, player controls, element interaction
- **Dependencies**: Phaser, React, video service
- **Interactions**: Coordinates between game engine and React components

### Backend Service Files

#### `apps/http/src/index.ts`

- **Purpose**: Express.js server entry point
- **Key Functions**: Server setup, middleware configuration, route mounting
- **Dependencies**: Express, CORS, authentication middleware
- **Interactions**: Starts HTTP API server and connects to database

#### `apps/http/src/routes/v1/auth.ts`

- **Purpose**: Authentication API endpoints
- **Key Endpoints**:
  - `POST /signup`: User registration
  - `POST /signin`: User login
- **Dependencies**: JWT, password hashing (scrypt)
- **Interactions**: Validates credentials and issues tokens

#### `apps/http/src/routes/v1/space.ts`

- **Purpose**: Space management API endpoints
- **Key Endpoints**:
  - `POST /spaces/`: Create new space
  - `GET /spaces/:id`: Retrieve space details
  - `DELETE /spaces/:id`: Delete space
  - `POST /spaces/element`: Add element to space
- **Dependencies**: Space service, authentication middleware
- **Interactions**: Manages space CRUD operations and element placement

#### `apps/http/src/services/authService.ts`

- **Purpose**: Authentication business logic
- **Key Functions**:
  - `signup()`: Creates new user accounts
  - `signin()`: Validates credentials and generates JWT
- **Dependencies**: Database client, password hashing
- **Interactions**: Handles user authentication flow

#### `apps/http/src/services/spaceService.ts`

- **Purpose**: Space management business logic
- **Key Functions**:
  - `createSpace()`: Creates new virtual spaces
  - `addElementToSpace()`: Places elements in spaces
  - `getSpaceWithElements()`: Retrieves space with all elements
- **Dependencies**: Database client, element validation
- **Interactions**: Manages space and element relationships

### SFU Server Files

#### `apps/sfu-server/src/index.ts`

- **Purpose**: SFU server entry point
- **Key Functions**: Initializes mediasoup workers and WebSocket server
- **Dependencies**: mediasoup, WebSocket server
- **Interactions**: Starts SFU infrastructure for video calls

#### `apps/sfu-server/src/SFUServer.ts`

- **Purpose**: WebSocket signaling server for SFU
- **Key Classes**: `SFUServer` class
- **Key Functions**:
  - `handleJoinRoom()`: Manages room joining with approval logic
  - `handleCreateTransport()`: Sets up WebRTC transports
  - `handleProduce()`: Processes media production requests
  - `broadcastToRoom()`: Sends messages to all room participants
- **Dependencies**: WebSocket, room manager, transport manager
- **Interactions**: Coordinates WebRTC signaling and room state

#### `apps/sfu-server/src/SFURoomManager.ts`

- **Purpose**: Manages SFU rooms and participants
- **Key Classes**: `SFURoomManager` singleton
- **Key Functions**:
  - `createOrGetRoom()`: Creates or retrieves room instances
  - `addParticipant()`: Adds users to rooms
  - `removeParticipant()`: Removes users from rooms
- **Dependencies**: mediasoup, SFU configuration
- **Interactions**: Maintains room state and participant lists

### WebSocket Server Files

#### `apps/ws/src/index.ts`

- **Purpose**: Real-time WebSocket server entry point
- **Key Functions**: WebSocket server setup and connection handling
- **Dependencies**: ws library, JWT authentication
- **Interactions**: Manages real-time user connections

#### `apps/ws/src/RoomManager.ts`

- **Purpose**: Real-time room management for multiplayer features
- **Key Functions**: Room creation, user joining/leaving, message broadcasting
- **Dependencies**: Database client, WebSocket connections
- **Interactions**: Handles real-time space interactions

### Database and Configuration Files

#### `packages/db/prisma/schema.prisma`

- **Purpose**: Database schema definition
- **Key Models**:
  - `User`: User accounts and authentication
  - `Space`: Virtual spaces owned by users
  - `Element`: Interactive/static objects
  - `Map`: Predefined map templates
  - `Avatar`: User avatar images
  - `Message`: Chat messages in spaces/maps
- **Relationships**: Defines foreign keys and cascading deletes
- **Interactions**: Generates Prisma client for type-safe database access

#### `packages/db/src/index.ts`

- **Purpose**: Database client export
- **Key Exports**: PrismaClient instance
- **Dependencies**: Generated Prisma client
- **Interactions**: Provides database access to all services

## Technical Decisions & Rationale

### Monorepo vs. Multi-repo

**Decision**: Monorepo using Turborepo and pnpm workspaces
**Rationale**:

- **Code Sharing**: Shared packages (db, ui, configs) prevent duplication
- **Atomic Changes**: Related changes across services can be committed together
- **Developer Experience**: Single repository for the entire project
  **Trade-offs**: Larger repository size vs. easier dependency management

### SFU vs. P2P Video Architecture

**Decision**: SFU (Selective Forwarding Unit) with mediasoup
**Rationale**:

- **Scalability**: Server handles media routing, reducing client bandwidth
- **Performance**: Better for rooms with many participants
- **Reliability**: Server-mediated connections are more stable
  **Trade-offs**: Higher server resource usage vs. better scalability

### Prisma ORM vs. Raw SQL/TypeORM

**Decision**: Prisma with generated client
**Rationale**:

- **Type Safety**: Generated TypeScript types prevent runtime errors
- **Developer Experience**: Intuitive query API and migrations
- **Schema Management**: Single source of truth for database schema
  **Trade-offs**: Learning curve vs. performance benefits

### React + Vite vs. Next.js

**Decision**: React with Vite instead of Next.js
**Rationale**:

- **Flexibility**: Vite allows custom build configurations
- **Performance**: Faster development server and builds
- **Simplicity**: No Next.js specific abstractions needed
  **Trade-offs**: Manual routing vs. file-based routing convenience

### WebSocket vs. Socket.io

**Decision**: Native WebSocket (ws library)
**Rationale**:

- **Performance**: Lower overhead than Socket.io
- **Control**: Direct WebSocket API usage
- **Compatibility**: Works with any WebSocket client
  **Trade-offs**: Manual reconnection handling vs. Socket.io features

## Architecture & Design Patterns

### Design Patterns Used

- **Singleton Pattern**: `SFURoomManager`, `RoomManager` for centralized state
- **Observer Pattern**: WebSocket message handling and event broadcasting
- **Factory Pattern**: Transport and producer creation in SFU
- **Repository Pattern**: Service layer abstraction over database operations
- **Middleware Pattern**: Express middleware for authentication and validation

### Data Flow Through the Application

1. **User Authentication**: Client → HTTP API → Database → JWT Token → Client
2. **Space Creation**: Client → HTTP API → Database → WebSocket Broadcast → Clients
3. **Video Call**: Client → SFU WebSocket → mediasoup → Peer Connections
4. **Real-time Updates**: Client → WebSocket Server → Database → Broadcast → Clients

### State Management Approach

- **Frontend**: React Context for global state (user, spaces)
- **Backend**: In-memory state for active connections and rooms
- **Database**: Persistent state for users, spaces, and elements
- **Real-time**: WebSocket connections maintain live state

### API Design Decisions

- **RESTful Endpoints**: Standard HTTP methods and resource-based URLs
- **Versioned API**: `/v1/` prefix for API evolution
- **JWT Authentication**: Stateless token-based auth
- **Zod Validation**: Runtime type validation for API inputs
- **Consistent Response Format**: Standardized success/error responses

### Database Schema and Relationships

- **Normalized Design**: Separate tables for entities with proper relationships
- **Cascading Deletes**: Maintains referential integrity
- **Indexing**: Optimized queries for common access patterns
- **Enums**: Type-safe role and status definitions

## Key Features Implementation

### User Authentication System

**Implementation**: JWT-based authentication with scrypt password hashing
**Code Flow**:

1. User submits credentials → `auth.ts` route
2. `authService.signin()` validates credentials
3. JWT token generated and returned
4. Subsequent requests include token in Authorization header
5. `authMiddleware` verifies token and attaches user to request
   **Edge Cases**: Invalid tokens, expired sessions, password reset
   **Testing**: Unit tests for service functions, integration tests for routes

### Space Management System

**Implementation**: CRUD operations with element placement
**Code Flow**:

1. User creates space → `space.ts` POST route
2. `spaceService.createSpace()` validates and saves to database
3. WebSocket broadcasts space creation to connected users
4. Element placement updates space_elements table
5. Real-time updates sent to all users in space
   **Edge Cases**: Concurrent modifications, space ownership validation
   **Testing**: Database integration tests, WebSocket event tests

### Video Calling System

**Implementation**: SFU architecture with mediasoup
**Code Flow**:

1. User initiates call → `WorkAdventureVideoService.joinRoom()`
2. WebSocket connection to SFU server
3. `SFUServer.handleJoinRoom()` processes join request
4. Room approval logic for private calls
5. Transport creation and media negotiation
6. Peer connections established via SFU routing
   **Edge Cases**: Network interruptions, participant limits, permission handling
   **Testing**: WebRTC connection tests, SFU message handling tests

### Real-time Multiplayer Spaces

**Implementation**: WebSocket server with room management
**Code Flow**:

1. User joins space → WebSocket connection authenticated
2. `RoomManager` adds user to space room
3. Position updates broadcast to all users in space
4. Element interactions synchronized via WebSocket events
5. Chat messages stored and broadcast in real-time
   **Edge Cases**: Connection drops, concurrent user actions, message ordering
   **Testing**: WebSocket integration tests, concurrent user simulation

## Development Practices

### Code Organization Principles

- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Single Responsibility**: Each file/class has one primary purpose
- **DRY Principle**: Shared code extracted to packages
- **Consistent Naming**: CamelCase for TypeScript, kebab-case for files

### Error Handling Strategy

- **Try-Catch Blocks**: Wrapped around async operations
- **Custom Error Types**: Specific error classes for different scenarios
- **Logging**: Console logging with different levels (info, warn, error)
- **Graceful Degradation**: Services continue operating despite individual failures
- **User Feedback**: Error messages displayed to users via UI

### Logging and Debugging Approach

- **Console Logging**: Development logging with structured messages
- **Error Tracking**: Stack traces for debugging
- **WebSocket Debugging**: Message logging for real-time features
- **Database Query Logging**: Prisma query logging in development
- **Browser DevTools**: Network and console monitoring

### Security Considerations

- **Password Hashing**: scrypt for secure password storage
- **JWT Tokens**: Short-lived tokens with proper signing
- **Input Validation**: Zod schemas for API input validation
- **CORS Configuration**: Proper origin restrictions
- **Authentication Middleware**: Route protection with JWT verification

### Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Prisma handles connection pooling
- **WebSocket Compression**: Efficient real-time data transmission
- **Asset Optimization**: Vite build optimizations
- **Lazy Loading**: Code splitting in React application

## Dependencies & Configuration

### Major Dependencies

- **Frontend**:
  - `react`: UI framework
  - `phaser`: 2D game engine
  - `mediasoup-client`: WebRTC SFU client
  - `socket.io-client`: WebSocket client
  - `framer-motion`: Animation library
  - `lucide-react`: Icon library
  - `clsx`: Conditional CSS classes

- **Backend Services**:
  - `express`: Web framework
  - `ws`: WebSocket server
  - `mediasoup`: SFU server
  - `@prisma/client`: Database ORM
  - `jsonwebtoken`: JWT handling
  - `zod`: Schema validation
  - `cors`: CORS middleware

- **Build Tools**:
  - `turbo`: Build orchestration
  - `typescript`: Type checking
  - `vite`: Frontend build tool
  - `esbuild`: Fast TypeScript compilation

### Configuration Files

- `turbo.json`: Build pipeline configuration
- `pnpm-workspace.yaml`: Workspace package management
- `packages/db/prisma/schema.prisma`: Database schema
- `apps/frontend/vite.config.ts`: Frontend build configuration
- `apps/http/src/config.ts`: API server configuration
- `apps/sfu-server/src/config.ts`: SFU server settings
- `apps/ws/src/config.ts`: WebSocket server config

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port numbers
- `SFU_WS_PORT`: SFU WebSocket port

### Build Process and Deployment

- **Development**: `pnpm dev` starts all services with hot reload
- **Production Build**: `pnpm build` compiles all TypeScript
- **Database**: `pnpm db:push` syncs schema changes
- **Deployment**: Each app can be deployed independently
- **Containerization**: Dockerfile in each app directory

## Challenges & Solutions

### Challenge: Real-time Synchronization

**Problem**: Maintaining consistent state across multiple clients in real-time spaces
**Solution**: WebSocket server with room-based broadcasting and database persistence
**Implementation**: `RoomManager` handles user connections and message distribution

### Challenge: Video Call Scalability

**Problem**: P2P architecture doesn't scale for large groups
**Solution**: SFU architecture using mediasoup for server-mediated video routing
**Implementation**: Separate SFU server handles WebRTC transport management

### Challenge: Type Safety Across Services

**Problem**: Maintaining type consistency between frontend, backend, and database
**Solution**: Shared TypeScript types and Prisma generated client
**Implementation**: Type definitions in separate files imported across services

### Challenge: Monorepo Dependency Management

**Problem**: Complex dependency relationships between packages
**Solution**: pnpm workspaces with clear package boundaries
**Implementation**: `pnpm-workspace.yaml` defines workspace structure

### Challenge: Database Schema Evolution

**Problem**: Safely updating database schema without data loss
**Solution**: Prisma migrations with careful planning
**Implementation**: `prisma db push` for development, migrations for production

## Interview Talking Points

### Most Impressive Technical Aspects

- **SFU Video Architecture**: Implementing a production-ready video conferencing system using mediasoup
- **Real-time Multiplayer**: Building scalable real-time spaces with WebSocket synchronization
- **Monorepo Architecture**: Managing complex interdependencies across multiple services
- **Type Safety**: Achieving full TypeScript coverage across frontend, backend, and database layers
- **Phaser Integration**: Combining 2D game engine with React for interactive virtual spaces

### Scalability Considerations

- **Horizontal Scaling**: Each service (HTTP, WS, SFU) can be scaled independently
- **Database Optimization**: Indexed queries and connection pooling for high load
- **WebRTC Optimization**: SFU reduces bandwidth requirements compared to mesh networks
- **Caching Strategy**: Potential for Redis caching of frequently accessed data
- **Microservices Design**: Clear service boundaries allow for distributed deployment

### What I Learned

- **WebRTC Fundamentals**: Deep understanding of real-time communication protocols
- **Monorepo Management**: Best practices for large-scale code organization
- **Database Design**: Complex relational schemas with proper normalization
- **Real-time Systems**: Challenges of maintaining consistency in distributed systems
- **TypeScript Ecosystem**: Advanced TypeScript patterns and tooling

### How This Demonstrates Skills

- **System Design**: Architecting complex multi-service applications
- **Full-Stack Development**: End-to-end implementation from database to UI
- **Real-time Programming**: WebSocket and WebRTC implementation
- **Database Design**: Complex relational schemas and query optimization
- **DevOps**: Build systems, deployment, and environment management
- **Problem Solving**: Overcoming scalability and synchronization challenges
