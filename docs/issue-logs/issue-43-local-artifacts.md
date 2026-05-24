# Issue #43: Local Artifact Handling

## Symptom

Local files such as `dev-server.log` and `docs/learning/` could remain untracked in the working tree, making it easy to accidentally mix local artifacts into a PR.

## Root Cause

The repository did not clearly distinguish temporary local output from documentation that should be versioned. `dev-server.log` was not ignored, and `docs/learning/` had no local policy or index explaining why it should be tracked.

## Fix

- Added `/dev-server.log` to `.gitignore` as a local development log.
- Kept `docs/learning/` as repository-managed documentation.
- Added `docs/learning/README.md` to explain what belongs in the learning docs directory.
- Added this issue log so the artifact policy decision is visible from the issue-log index.

## Verification

- `npm run lint`
