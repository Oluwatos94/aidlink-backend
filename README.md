# AidLink Backend

Production-grade backend for AidLink - a blockchain-powered humanitarian aid platform built on Soroban/Stellar.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Real-time**: WebSockets (Socket.io)
- **Blockchain**: Soroban/Stellar
- **Containerization**: Docker & Docker Compose

## Core Systems

### 1. Authentication System
- JWT-based authentication
- Wallet-based authentication (Stellar/Soroban)
- Role-based access control (RBAC)
- Session management with Redis

### 2. Campaign Engine
- Campaign creation and management
- Real-time fund tracking
- Beneficiary assignment
- Distribution tracking and verification

### 3. Beneficiary Verification
- KYC workflow integration
- Fraud detection algorithms
- Verification queue with BullMQ
- Document verification

### 4. Blockchain Indexer
- Soroban event listeners
- Transaction indexing
- Contract synchronization
- Real-time blockchain monitoring

### 5. Notification System
- Email notifications (Nodemailer)
- Real-time alerts (WebSockets)
- Push notification support
- Notification preferences

## Project Structure

```
aidlink-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── workers/          # Background job workers
│   ├── websocket/        # WebSocket handlers
│   ├── blockchain/       # Blockchain integration
│   └── index.ts          # Application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeder
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── load/             # Load tests
├── docker/
│   └── Dockerfile
├── docs/                 # Documentation
└── .env.example          # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

### Development

```bash
# Start development server
npm run dev

# Start with Docker
npm run docker:up
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## API Documentation

API documentation is available at `/api/docs` when the server is running.

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

## Docker Deployment

```bash
# Build Docker images
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## Environment Variables

See `.env.example` for all required environment variables.

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request validation with Zod
- JWT authentication
- Audit logging
- Secure environment management

## Monitoring

- Health check endpoint at `/health`
- Structured logging with Winston
- Performance metrics
- Error tracking

## License

MIT
