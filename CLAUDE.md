# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exercise Record is a fitness tracking web application built with React 19, TypeScript, and Vite 7. It uses Supabase for authentication and database (PostgreSQL with RLS), and Google Gemini AI for generating weekly exercise summaries.

## Commands

```bash
npm run dev      # Start development server
npm run build    # TypeScript compile + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

No test framework is currently configured.

## Architecture

### Key Directories

- `api/` - Vercel-style serverless functions (e.g., `generate-summary.ts` for Gemini AI)
- `src/components/` - React components using folder-per-component pattern with co-located CSS
- `src/contexts/` - React Context providers (AuthContext for Supabase auth)
- `src/services/` - API and database operations (supabaseService, geminiService)
- `src/types/` - Centralized TypeScript interfaces and constants
- `src/utils/` - Utility functions (date manipulation)
- `docs/` - Requirements documentation (English and Chinese versions)

### Data Flow

1. Authentication via Supabase Auth (AuthContext wraps the app)
2. `App.tsx` loads week data on mount/week change
3. Entries stored in `Map<string, DayRecord>` for efficient date-based lookup
4. CRUD operations use optimistic UI updates with rollback on error
5. AI summaries generated via protected `/api/generate-summary` endpoint

### Database Tables (Supabase)

- `exercise_entries` - Individual workout records
- `weekly_summaries` - AI-generated weekly analysis
- `user_exercises` - User-customized exercise suggestions

All tables use Row Level Security filtered by authenticated user.

## Conventions

- **UI Language**: Chinese (weekday names: 周一-周日, UI text in Chinese)
- **Week starts on Monday**
- **Date formats**: `YYYY-MM-DD` for storage, `MM/DD` for display
- **Component exports**: Named exports (not default)
- **Props interfaces**: Defined inline in component files
- **Common exercises**: Default exercises defined in `COMMON_EXERCISES` constant in `src/types/index.ts`, user custom exercises stored in `user_exercises` table

## Environment Variables

```
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
GEMINI_API_KEY=<gemini_api_key>  # Server-side only (used in api/)
```
