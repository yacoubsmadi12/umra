# Zain Jordan Umrah Registration Platform

## Overview

An internal web platform for Zain Jordan employees to register for the company's Umrah program, which runs 2-3 times annually. The system enables electronic registration, request tracking, admin management, email notifications, document uploads, and participant networking.

The application follows a client-server architecture with React frontend and Express backend, using PostgreSQL for data persistence and Google Cloud Storage for file uploads.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming for Zain branding and spiritual aesthetics
- **Animations**: Framer Motion for page transitions and interactions
- **Fonts**: Cairo and Tajawal Arabic fonts for RTL support
- **File Uploads**: Uppy with AWS S3 presigned URL flow

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Pattern**: REST endpoints defined in shared/routes.ts with Zod schemas for validation
- **Session Management**: Express-session with MemoryStore (production should use connect-pg-simple)
- **File Storage**: Google Cloud Storage via Replit Object Storage integration

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Tables**:
  - `users`: Employee profiles with role-based access (admin/employee)
  - `umrahRequests`: Registration requests with status tracking and document URLs
  - `tripMaterials`: Educational content (booklet pages, instructions, announcements)

### Authentication & Authorization
- Session-based authentication using employee ID and password
- Role-based access control: Employee and Admin roles
- Protected routes component for frontend route guarding
- Middleware for backend endpoint protection

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds static assets, esbuild bundles server with dependency allowlist
- **Output**: dist/public for static files, dist/index.cjs for server

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components including shadcn/ui
│   ├── hooks/           # React Query hooks for API calls
│   ├── pages/           # Route components
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database operations interface
│   └── replit_integrations/  # Object storage service
├── shared/              # Shared code between client/server
│   ├── schema.ts        # Drizzle database schema
│   └── routes.ts        # API route definitions with Zod schemas
└── migrations/          # Drizzle database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable
- **Drizzle Kit**: Schema push with `npm run db:push`

### File Storage
- **Google Cloud Storage**: Document uploads (passport, visa, tickets)
- **Replit Object Storage**: Integrated via sidecar at localhost:1106 for presigned URLs

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **Uppy**: File upload handling with S3 presigned URL support
- **Framer Motion**: Animation library
- **react-day-picker**: Calendar component
- **embla-carousel**: Carousel functionality
- **recharts**: Data visualization

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Express session secret (defaults to 'zain-umrah-secret' in development)