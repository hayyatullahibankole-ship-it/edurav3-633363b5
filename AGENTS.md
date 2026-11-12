# Project architecture rules

- Admin-only reads of Supabase Auth metadata must go through an admin-verified Edge Function that returns only fields required by the interface; browser code must not access Auth admin APIs because sign-in metadata is sensitive.
- Keep signup free-access durations constrained to the admin-supported 0, 3, or 7 days in both the database trigger and admin controls; zero disables access so unexpected settings cannot grant a longer trial.