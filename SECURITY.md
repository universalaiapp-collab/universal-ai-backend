# Security & Secrets
Day 7 (2025-11-29): Removed leaked Google API key from git history and replaced history using BFG.
Actions:
- History rewritten and force-pushed.
- Old leaked key revoked in GCP (REVOKE IMMEDIATELY).
- New restricted key created and stored as GitHub Actions secret GOOGLE_API_KEY.
- Local .env used for local dev only and added to .gitignore.
