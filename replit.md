# DAAM - Student Collaboration Platform

## Overview

DAAM is a bilingual (Arabic/English) student collaboration platform designed for university students. The application features a social feed for peer discussions, an AI tutor assistant interface, and university email authentication. The platform uses localStorage for data persistence, making it a client-side focused application with minimal backend requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Custom React hooks with localStorage persistence (`use-daam-store.ts`)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions and UI animations
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Purpose**: Primarily serves static files; the application logic is client-side
- **API**: Minimal REST endpoints (health check only for this app)

### Data Storage
- **Primary**: localStorage for all user data, posts, and preferences
  - `daam_user`: Current user email
  - `daam_posts_v1`: JSON array of posts
  - `daam_lang`: Language preference (ar/en)
- **Database Schema**: PostgreSQL with Drizzle ORM is configured but not actively used for core features

### Authentication
- **Method**: Client-side email validation
- **Domain Restriction**: Configurable allowed domain (default: `utas.edu.om`)
- **Session**: localStorage-based session persistence

### Key Design Patterns
- **Component Structure**: Atomic design with shadcn/ui primitives
- **Internationalization**: Built-in dictionary-based translations for Arabic/English
- **RTL Support**: Dynamic direction switching based on language selection
- **Protected Routes**: Client-side route guards checking localStorage for user presence

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui)
    hooks/        # Custom React hooks
    pages/        # Route pages (login, feed, tutor)
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API routes
  static.ts       # Static file serving
shared/           # Shared types and schemas
  schema.ts       # Drizzle schema and types
```

## External Dependencies

### UI Component Libraries
- **shadcn/ui**: Complete component library with Radix UI primitives
- **Radix UI**: Accessible component primitives (dialog, dropdown, toast, etc.)
- **Lucide React**: Icon library

### Database (Configured)
- **PostgreSQL**: Relational database (requires DATABASE_URL environment variable)
- **Drizzle ORM**: TypeScript-first ORM for database operations
- **Drizzle Kit**: Database migration tooling

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Full type coverage across client and server

### Data Handling
- **TanStack Query**: Data fetching and caching (minimal use in current implementation)
- **Zod**: Schema validation
- **date-fns**: Date formatting with locale support (Arabic/English)