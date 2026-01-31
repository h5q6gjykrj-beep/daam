# DAAM - Student Collaboration Platform

## Overview

DAAM is a bilingual (Arabic/English) student collaboration platform for university students. It features a social feed for peer discussions, an AI tutor assistant, and university email authentication. The platform is primarily client-side, utilizing localStorage for data persistence, which minimizes backend requirements. The project aims to provide a robust, engaging, and customizable environment for student interaction and support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Principles
- **Bilingual Support**: Full Arabic/English support with dynamic RTL switching.
- **Client-Side Focus**: Primary application logic and data persistence (localStorage) on the client.
- **Modularity**: Component-based architecture with reusable UI elements.
- **Customization**: Admin-controlled visibility and content for key UI elements like the landing page and navigation.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **State Management**: Custom React hooks with localStorage persistence.
- **Styling**: Tailwind CSS with shadcn/ui component library.
- **Animations**: Framer Motion.
- **Build Tool**: Vite.

### Backend
- **Runtime**: Node.js with Express.
- **Purpose**: Primarily serves static files; application logic is client-side.
- **API**: Minimal REST endpoints (health check only).

### Data Persistence
- **Primary Storage**: localStorage for all user data, posts, preferences, and administrative configurations. Key items include user accounts, posts, language preferences, moderation records (reports, mutes, bans, audit logs), official content pages, and UI configuration settings.
- **Authentication**: University email domain restriction, localStorage-based session persistence, password-based login.

### Key Features
- **Social Feed**: Discussion arena with post creation, replies, and reporting.
- **AI Tutor**: Interface for an AI assistant.
- **Admin Dashboard**: Comprehensive tools for managing users, content, and platform settings.
  - **Audit Log**: Tracks moderator and admin actions.
  - **Reporting System**: Manages user-generated reports for posts, comments, and users.
  - **User Roles & RBAC**: `admin`, `moderator`, `user` roles with granular permissions.
  - **Moderation Tools**: Hide/delete posts, mute/ban users with configurable durations.
  - **Direct Messaging (DM)**: Private conversations with privacy controls and rate limiting.
  - **Official Content System**: Admin-editable pages for Privacy Policy, Contact Us, and Terms & Conditions.
  - **Landing Page Customization**: Admins can toggle visibility of "Why DAAM?" cards and configure the landing page navigation.
  - **Navbar Configuration**: Admins can enable/disable, reorder, and relabel navigation items for both internal and landing pages.
- **User Profiles**: Public profiles with private data protections.
  - **Library Tab**: Consolidated tab containing Saved posts, Files, and Summaries with internal chip filters.
    - Saved: Shows posts the user has bookmarked (uses post `savedBy` array)
    - Files: Shows files uploaded by the user
    - Summaries: Placeholder for future summary content

### Project Structure
- `client/`: React frontend (components, hooks, pages, lib).
- `server/`: Express backend (entry point, routes, static file serving).
- `shared/`: Shared types and schemas.

## External Dependencies

### UI/UX
- **shadcn/ui**: Component library built on Radix UI.
- **Radix UI**: Accessible UI primitives.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Frontend build tool.
- **esbuild**: Server bundling.
- **TypeScript**: Language.

### Data Utilities
- **Zod**: Schema validation.
- **date-fns**: Date formatting.

### Database (Configured but not actively used for core features)
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: TypeScript ORM.
- **Drizzle Kit**: Database migration tooling.