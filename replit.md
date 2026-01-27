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
  - `daam_reports`: JSON array of user reports
  - `daam_moderators_v1`: JSON array of moderator accounts
  - `daam_auth_users_v1`: JSON array of registered users with password hashes
  - `daam_hidden_posts_v1`: JSON array of hidden post IDs (moderation feature)
  - `daam_audit_v1`: JSON array of audit log events (200 entry limit, newest first)
  - `daam_mutes_v1`: JSON array of muted users (MuteRecord objects)
  - `daam_bans_v1`: JSON array of banned users (BanRecord objects)
- **Database Schema**: PostgreSQL with Drizzle ORM is configured but not actively used for core features

### Audit Log System
- **Storage**: localStorage (`daam_audit_v1`) with 200 entry limit
- **Event Structure**: { id, action, targetType, targetId, byEmail, at, meta? }
- **Feed Moderation Actions**: 
  - `post.hide` - Staff hides a post from regular users
  - `post.show` - Staff unhides a previously hidden post
  - `post.delete` - Staff deletes a post (not author self-deletion)
  - `reply.delete` - Staff deletes a reply (not author self-deletion)
- **Moderator Management Actions**:
  - `moderator.create` - Admin creates a new moderator account
  - `moderator.permissions.update` - Admin updates moderator permissions
  - `moderator.toggleActive` - Admin enables/disables a moderator
  - `moderator.delete` - Admin deletes a moderator account
- **Display**: Audit Log tab in Admin Dashboard shows last 20 events with bilingual labels
- **Overview Widget**: Admin Overview shows last 5 audit events

### Reporting System
- **Report Types**: Posts, comments/replies, and user profiles can be reported
- **Report Reasons**: spam, harassment, hate, impersonation, inappropriate, other
- **Report Flow**: 
  - Posts/comments: Click menu → Report option → Select reason → Submit
  - Users: Visit profile → Click flag icon → Select reason → Submit
- **Storage**: Reports stored in localStorage (`daam_reports`) with timestamp, reporter, type, reason, optional note
- **Admin Access**: Reports visible in Admin Dashboard under Reports tab (path: /admin)

### Authentication
- **Method**: Full registration system with email/password authentication
- **Domain Restriction**: Configurable allowed domain (default: `utas.edu.om`)
- **Session**: localStorage-based session persistence with "Remember Me" option
- **Auto-Verification**: Accounts are automatically verified upon registration (no email verification required)
- **Biometric Login**: UI placeholder ready for future WebAuthn implementation
- **Security**: loginSimple function is disabled; only password-based login allowed

### User Roles & RBAC System
- **Admin Emails**: Configured in `client/src/config/admin.ts` (includes `w.qq89@hotmail.com`)
- **Role Types**: `admin`, `moderator`, `user`
- **7 Permissions**: 
  - `mod.posts.delete` - Delete any post
  - `mod.posts.hide` - Hide posts from feed
  - `mod.comments.delete` - Delete any comment/reply
  - `mod.users.mute` - Mute users
  - `mod.users.ban` - Ban users
  - `admin.moderators.manage` - Manage moderator accounts
  - `admin.settings.manage` - Manage platform settings
- **Staff Badge**: Shield icon (14-18px, text-emerald-400) shown next to staff names
- **Moderator Management**: Admin dashboard Moderators tab for CRUD operations
- **Helper Functions**: `isAdmin()`, `isModerator()`, `isStaff()`, `canCurrentUser()`, `can()` in use-daam-store.tsx

### Feed Moderation
- **Hide Posts**: Staff can hide posts from regular users (stored in `daam_hidden_posts_v1`)
- **Hidden Post UI**: Amber-styled placeholder card with Show button for staff
- **Delete with Verification**: Confirmation dialog before deleting posts/replies
- **Permission-based UI**: Menu options shown based on user permissions

### User Mute System
- **Storage**: localStorage (`daam_mutes_v1`) with MuteRecord objects
- **MuteRecord Structure**: { userEmail, mutedBy, reason, mutedAt, expiresAt }
- **Duration Options**: 10 minutes, 1 hour, 1 day, permanent (null expiresAt)
- **Auto-Expiry**: Expired mutes are automatically removed when checked
- **Restrictions**: Muted users cannot create posts or replies (shows expiry time toast)
- **Permission**: Requires `mod.users.mute` permission to mute/unmute users
- **Audit Actions**: `user.mute` and `user.unmute` logged to audit system
- **Admin View**: Muted Users section in Admin Dashboard → Moderators tab with unmute button
- **Bilingual**: Full Arabic/English support for mute dialog and error messages

### User Ban System
- **Storage**: localStorage (`daam_bans_v1`) with BanRecord objects
- **BanRecord Structure**: { userEmail, bannedBy, reason, bannedAt, expiresAt }
- **Duration Options**: 1 day, 7 days, 30 days, permanent (null expiresAt)
- **Auto-Expiry**: Expired bans are automatically removed when checked
- **Restrictions**: Banned users cannot access the platform (blocked at App level with ban screen)
- **Auto-Logout**: If a user bans themselves, they are immediately logged out
- **Ban Screen**: Shows reason, expiry time (or "permanent" indicator), and logout button
- **Permission**: Requires `mod.users.ban` permission to ban/unban users
- **Audit Actions**: `user.ban` and `user.unban` logged to audit system
- **Admin View**: Banned Users section in Admin Dashboard → Moderators tab with unban button
- **Bilingual**: Full Arabic/English support for ban dialog, ban screen, and error messages

### Privacy
- **Private Data**: Email, phone, and region are only visible to account owner via Private Info tab
- **Public Profile**: Name, bio, university, and social stats (followers/following) are public

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
    pages/        # Route pages
      landing.tsx   # Public landing page for guests
      login.tsx     # Login form page
      dashboard.tsx # Home dashboard for logged-in users
      feed.tsx      # Discussion arena with report functionality
      tutor.tsx     # AI tutor page
      profile.tsx   # User profile page with report user button
      admin.tsx     # Admin dashboard with reports management
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API routes
  static.ts       # Static file serving
shared/           # Shared types and schemas
  schema.ts       # Drizzle schema and types
```

### Page Flow
- **Guests**: Landing page (`/`) → Login (`/login`)
- **Logged-in users**: Dashboard (`/dashboard`), Feed (`/feed`), AI Tutor (`/tutor`), Profile (`/profile`)
- The landing page shows live activity stats, trending discussions, and hot topics to attract visitors

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