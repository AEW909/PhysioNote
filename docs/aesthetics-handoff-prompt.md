# Aesthetics App Handoff Prompt

Use this prompt to start the separate Aesthetics project from the PhysioNote source.

```text
You are building a new, separate Aesthetics practice app derived from the PhysioNote repo.

Core instruction:
- This is a new app, not a modification of the live PhysioNote app.
- Use the PhysioNote repo as source/reference for architecture, UI patterns, Supabase helpers, auth flow, server actions, clinical record structure, and deployment conventions.
- Keep the new Aesthetics codebase separate from PhysioNote.
- Host the new Aesthetics app as its own Vercel project.
- Do not change the existing PhysioNote app unless explicitly asked.

Current PhysioNote state:
- PhysioNote is a Next.js app using Supabase Auth, Postgres, RLS, and Storage.
- Existing PhysioNote data lives in the public schema.
- The existing PhysioNote tables include profiles, patients, appointments, treatment_plans, clinical_notes, note_versions, documents, screenings, and audit_log.
- PhysioNote currently uses public.profiles.role in production.
- A new app-membership migration exists in the PhysioNote repo but is not yet applied to production unless the owner confirms otherwise.
- The intended future shared access model is public.app_memberships with app_key values such as "physio" and "aesthetics".

Production staff roles currently configured in PhysioNote:
- Andrew / Andy Wilkinson: admin
- Liona Harris, liona@harrisphysio.com: owner
- Liona Harris, liona@harrisphysiotherapy.com: owner
- Tess, tbelshire@gmail.com: clinician

Supabase architecture:
- The Supabase project is shared initially because of project constraints.
- Existing PhysioNote data must remain in public.
- Do not move, rename, rewrite, or repurpose PhysioNote's public schema tables.
- The Aesthetics app must create and use its own aesthetics schema for Aesthetics-specific application data.
- The Aesthetics app must not read from or write to PhysioNote clinical tables in public.
- The only intended shared elements are Supabase Auth and the shared app membership/access-control layer.
- If the app-membership layer is not live yet, coordinate before applying it because it changes production auth/RLS behavior.

Required Aesthetics schema setup:
- Create schema aesthetics.
- Add the aesthetics schema to Supabase exposed schemas if the app will query it through Supabase JS/Data API.
- Grant only the required access to authenticated and service_role for the aesthetics schema/tables.
- Enable RLS on every Aesthetics table before granting browser-reachable access.
- Keep security definer helper functions out of exposed schemas where possible, or tightly control execute permissions.
- Do not create cross-schema foreign keys from aesthetics clinical records into PhysioNote public clinical tables.

Expected Aesthetics data model:
- Use Aesthetics-specific tables in the aesthetics schema for clients/patients, appointments, treatments, notes, consent forms, before/after photo metadata, documents, and audit records.
- Reuse PhysioNote's broad workflow pattern where helpful, but adapt terms to Aesthetics practice language.
- Treat consent forms as first-class records with status, signed/accepted timestamps, version/snapshot fields, and links to related treatment/client records.
- Treat before/after photos as structured clinical media with storage path, body/site/area metadata, consent linkage, capture timing, uploaded_by, and auditability.
- Use separate Storage buckets or clearly separated Storage path prefixes for Aesthetics documents/photos.
- Storage policies must enforce active Aesthetics access, not just authenticated access.

Auth and access model:
- Supabase Auth users are project-wide.
- Do not use user-editable user_metadata for authorization decisions.
- Prefer a database-backed membership model.
- Intended model:
  - public.app_memberships.user_id references public.profiles.id
  - app_key = "physio" or "aesthetics"
  - role = owner, clinician, or admin
  - active = true/false
- PhysioNote uses app_key = "physio".
- The Aesthetics app must use app_key = "aesthetics".
- Liona and Andrew should have access to both apps.
- Tess should have PhysioNote access only unless explicitly changed later.
- If a valid Supabase Auth user signs into the Aesthetics app without active aesthetics membership, show a no-access/sign-out flow.
- Enforce the same access restriction in RLS so the UI is not the only boundary.

Suggested RLS approach:
- Add helper functions such as current_user_app_role('aesthetics') and current_user_has_app_access('aesthetics') if they are not already live.
- Aesthetics table policies should check active aesthetics membership.
- Owner/admin/clinician permissions should be app-specific, not global.
- Do not broaden PhysioNote RLS policies to support Aesthetics.
- Do not grant Tess Aesthetics access unless explicitly requested.

Product direction:
- Build the actual staff workspace first, not a marketing/landing page.
- Core first screen should be an authenticated Aesthetics dashboard or client workspace.
- Expected flows:
  - staff sign-in
  - client list/search
  - client detail
  - appointment/treatment records
  - consent form creation/review/signing state
  - before/after photo upload and review
  - notes/documents
  - audit trail for material clinical/client record changes
- Branding, terminology, navigation labels, and copy should be tailored to an Aesthetics practice, not physiotherapy.
- Keep server-side AI/API keys and service role operations off the client.

Implementation guardrails:
- Prefer copying established PhysioNote patterns before inventing new abstractions.
- Keep all Aesthetics-specific data access explicitly scoped to the aesthetics schema.
- Do not make the Aesthetics app depend on PhysioNote routes, components, migrations, or public clinical tables at runtime.
- Keep database migrations clear and reviewable.
- Before applying production Supabase migrations, explain whether they change schemas, RLS, grants, Storage, or existing PhysioNote access.
- Run type-check/build verification before handing work back.
- After DB changes, verify with SQL reads that expected users can and cannot see the intended records.

Commercialisation note:
- This shared-Supabase setup is acceptable as an interim internal arrangement for one business with known staff.
- If either app becomes commercial, plan a proper separation into a dedicated Supabase project with its own Auth, Storage, RLS, backups, and operational policies.
```
