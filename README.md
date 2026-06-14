# Physio

Physio is being rebuilt as a production-oriented physiotherapy platform with secure clinical records, appointment-linked notes, and server-side AI assistance.

## Current Status

- The original browser-only prototype has been archived under `archive/prototype-v1/`
- Active development is now focused on the new `Next.js + Supabase + Vercel` application scaffold
- FocusBoard has been extracted into its own standalone repository and deployment
- Legacy `/focus/*`, `/focus-control/*`, and `/focus-content/*` PhysioNote URLs now redirect to the standalone FocusBoard app

## Shared Supabase Boundary

PhysioNote and FocusBoard still share the same Supabase project for now, but the intended overlap is narrow:

- `auth.*`
- `public.profiles`

Legacy `public.focus_board_*` tables are deprecated and should be removed only through a controlled cleanup after PhysioNote is redeployed without any FocusBoard runtime dependency.

## Target Stack

- `Next.js` with the App Router
- `Vercel` for deployment and runtime environment variables
- `Supabase` for Postgres, Auth, Storage, and Row Level Security
- `OpenAI` through server-side routes only

## Non-Negotiable Rules

- No direct browser-side AI API calls
- No production secrets in client code
- AI screening lives inside the clinical records workflow
- Patient data access must be role-aware and auditable
- GDPR-aware architecture is foundational, not a later add-on

## Repo Layout

- `app/` - new application shell
- `archive/prototype-v1/` - archived proof-of-concept files
- `docs/` - planning, architecture, data model, and compliance notes
- `lib/` - shared environment and Supabase helpers
- `supabase/` - schema and migration drafts

## Environment Variables

Copy `.env.example` to `.env.local` and provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FOCUSBOARD_SITE_URL`

`NEXT_PUBLIC_*` values are browser-safe. Everything else is server-only.

`FOCUSBOARD_SITE_URL` should point at the standalone FocusBoard deployment so any legacy PhysioNote links can redirect cleanly.

## Next Development Steps

1. Install dependencies
2. Create the Supabase project in a UK or EU region
3. Apply and refine the schema
4. Build auth and staff roles
5. Build patient records and appointments
6. Add notes, screening, and transcription modules
