# DAAM - Student Collaboration Platform

## Overview

DAAM is a bilingual (Arabic/English) student collaboration platform for university students. It features a social feed for peer discussions, an AI tutor assistant, and university email authentication. The project uses PostgreSQL (via Drizzle ORM) as its primary data store, with a comprehensive REST API backend and optimistic-update React frontend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Principles
- **Bilingual Support**: Full Arabic/English support with dynamic RTL switching.
- **Database-Backed**: All data persisted to PostgreSQL via a REST API. Frontend uses optimistic updates for fast UI.
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
- **API**: Comprehensive REST API for all data operations (accounts, profiles, posts, replies, reports, mods, DMs, audit log, mutes, bans, domains, settings).
- **Storage Layer**: `server/storage.ts` — Drizzle ORM functions for all CRUD operations.

### Data Persistence
- **Primary Storage**: PostgreSQL via Drizzle ORM. All user data, posts, profiles, reports, moderation records, DMs, and audit logs are stored in the database.
- **Client Preferences**: Theme and language stored in localStorage only (no sensitive data).
- **Session**: Current user email stored in localStorage; full account/profile data loaded from API on app start.
- **Authentication**: University email domain restriction, password-based login with client-side hash verification. Demo users auto-seeded on first load via API. The built-in admin/moderator (w.qq89@hotmail.com) is seeded automatically.
- **Tables**: `accounts`, `profiles`, `posts`, `replies`, `reports`, `moderators`, `auth_users`, `audit_log`, `mutes`, `bans`, `conversations`, `messages`, `allowed_domains`, `settings`.

### Key Features
- **Social Feed**: Discussion arena with post creation, replies, and reporting.
- **AI Tutor**: Interface for an AI assistant.
- **Admin Dashboard**: Comprehensive tools for managing users, content, and platform settings.
  - **AI Tab**: Admin/moderator section for AI system management with sub-sections: Dashboard, Settings, Training Sources, Training Jobs, Analytics, AI Audit.
    - **AI Permissions (RBAC)**: 8 granular permissions control access: `ai.view`, `ai.settings.edit`, `ai.sources.create`, `ai.sources.review`, `ai.train.run`, `ai.train.publish`, `ai.analytics.view`, `ai.audit.view`. AI tab visible only to admins or users with `ai.view`. Sub-sections gated by specific permissions with access denied messages for unauthorized users.
    - **AI Settings**: Configurable settings for the AI assistant including enable/disable toggle, default language, system prompts (AR/EN), temperature, max tokens. Uses replaceable storage layer (localStorage via `daam_ai_settings_v1`). Read-only mode for users without `ai.settings.edit` permission.
    - **AI Audit Log**: Tracks AI-related activities (settings save/reset, access denied attempts). Table of last 50 events with user filter and admin-only clear button. Uses replaceable storage layer (localStorage via `daam_ai_audit_v1`).
    - **AI Metrics**: Displays computed metrics from audit events - today/week totals for settings saves and access denied, top 3 active users. Uses replaceable storage layer (localStorage via `daam_ai_metrics_v1`).
  - **Audit Log**: Tracks moderator and admin actions.
  - **Reporting System**: Manages user-generated reports for posts, comments, and users.
  - **User Roles & RBAC**: `admin`, `moderator`, `user` roles with granular permissions.
  - **Moderation Tools**: Hide/delete posts, mute/ban users with configurable durations.
  - **Direct Messaging (DM)**: Private conversations with privacy controls and rate limiting.
  - **Official Content System**: Admin-editable pages for Privacy Policy, Contact Us, and Terms & Conditions. Stored in `settings` DB table (key: `daam_official_pages_v1`).
  - **Landing Page Customization**: Admins can toggle visibility of "Why DAAM?" cards and configure the landing page navigation. Stored in DB (`daam_landing_why_cards_v1`).
  - **Navbar Configuration**: Admins can enable/disable, reorder, and relabel navigation items for both internal and landing pages. Stored in DB (`daam_navbar_config_v1`, `daam_landing_navbar_config_v1`).
  - **Settings Migration**: All global settings (official pages, Why DAAM cards, navbar configs, AI settings) fully migrated from localStorage to PostgreSQL `settings` table via `GET/POST /api/settings/:key`. Helpers: `client/src/lib/settings-api.ts` (loadSetting/saveSetting), `navbar-config.ts` (loadNavbarConfig/saveNavbarConfig), `landing-navbar-config.ts` (loadLandingNavbarConfig/saveLandingNavbarConfig). Components load from API in `useEffect` on mount and listen to custom events for reactivity.
- **User Profiles**: Public profiles with private data protections. Redesigned with "Academic Identity Overlay" layout.
  - **Cover with Identity Overlay**: Full-bleed responsive (320-440px height) cover with dark gradient overlay. Identity (avatar, name, subtitle, stats, action buttons) is absolutely positioned inside the cover, centered vertically with slight offset (pt-8 md:pt-12).
  - **Single Edit Button**: Pen icon (top-right corner) for profile owner opens unified edit dialog. Replaces scattered cover/profile edit buttons.
  - **Unified Edit Profile Dialog**: Tabbed dialog with 4 sections:
    - Cover: Upload/remove cover image with preview
    - Photo: Upload avatar with preview
    - Info: Name, major, level, university, bio, privacy toggles for favorites/interests
    - Account: Email (read-only), phone, governorate, wilayat with error display
  - **Identity Styling**: White text on dark overlay, glass-morphism buttons (bg-white/10 backdrop-blur-sm border-white/20)
  - **Avatar**: w-24 h-24 (mobile) / w-28 h-28 (desktop), ring-2 ring-white/25
  - **Stats Line**: text-xs md:text-sm, white/75 opacity, format: "{posts} منشور | {following} يتابع | {followers} متابع"
  - **Dashboard Grid**: 3-column grid (Activity, Posts Preview, Saved Preview), plus quick access cards (Replies, Interests, Library owner-only, Private owner-only).
  - **View Navigation**: Click on dashboard cards to access detailed views (Posts, Replies, Saved, Interests, Library, Private), with back button to return to dashboard.
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