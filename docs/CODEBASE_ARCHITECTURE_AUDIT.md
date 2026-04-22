# Codebase Architecture Audit

Date: 2026-04-22

## Objective

Review the current Burner Point repository, identify what is actively part of the shipping product, remove safe redundant pieces, and document the remaining cleanup work needed for a leaner production codebase.

## Safe Cleanup Applied

The following files were removed because they were public demo or diagnostic surfaces and had no production role:

- `apps/web/src/app/test/page.tsx`
- `apps/web/src/app/test/ui-kit/page.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/liquid-glass-button.tsx`
- `apps/web/src/components/ui/sign-in.tsx`
- `apps/web/src/components/ui/splite.tsx`
- `apps/web/src/components/ui/spotlight.tsx`
- `apps/web/FIX_SUMMARY.md`

The following malformed or legacy filesystem artifacts were also removed because they were outside the active app graph and had no runtime references:

- `burnerpoint-backend/`
- `burnerpoint-payment-update/`
- `packages/{shared`
- `pages/`
- root startup and `.next-start-*` log artifacts

Why these were safe to remove:

- The demo-only UI files were imported only by `/test/ui-kit`.
- `/test` and `/test/ui-kit` were publicly routable in the production web build.
- The diagnostic summary file documented an old Tailwind recovery pass and pointed at the removed test route.

## Essential Structure To Keep

These folders are part of the live application graph and should remain:

- `apps/api`
- `apps/web`
- `apps/mobile`
- `packages/shared`
- `docs`
- `infra`
- `scripts`

These files are also active and aligned with the current live stack:

- `apps/api/railway.toml`
- `apps/web/vercel.json`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `apps/web/src/proxy.ts`

## Misplaced Or Misleading Items

These items are not necessarily broken, but they create confusion and should be handled in a dedicated cleanup pass:

- Root `README.md`
  - Previously described an older JWT-first architecture with stale platform assumptions.
  - Updated in this pass.

- Root `package.json`
  - Still reads like a root API package even though the real API lives in `apps/api`.
  - Scripts and dependency shape should be normalized in a follow-up package-manager cleanup to avoid unnecessary lockfile churn in a dirty tree.

- Root `tsconfig.json`
  - Still reflects the old root-Nest layout.
  - Replace with a true workspace-level base config when package-manager cleanup is performed.

- Root `nest-cli.json`
  - Still reflects the old root-Nest layout.
  - Remove after root scripts are fully normalized to app-local entrypoints.

## Redundant Or Legacy Snapshots

No live imports or runtime references were found for these directories before removal:

- `burnerpoint-backend`
- `burnerpoint-payment-update`

Cleanup result:

- Both folders were removed in this pass because the repo already contains the integrated live equivalents under `apps/api` and `apps/web`.
- The malformed nested folders inside those snapshots confirmed they were stale exports rather than active workspace code.

## Redundant Config Candidates

These files appear redundant because the authoritative mobile configs already live under `apps/mobile`:

- `app.json`
- `eas.json`

Why they were not deleted automatically:

- Some teams run Expo or EAS commands from repo root by habit.
- Deleting them is probably correct, but it should happen together with a small workflow update so local release commands stay clear.

Recommended next step:

- Delete the root copies and standardize mobile commands around `apps/mobile`.

## Low-Risk Delete Candidates

These are likely removable once you want a stricter cleanup pass:

- Root operational note files that are not linked anywhere:
  - `INTEGRATION_STATUS.md`
  - `RAILWAY_FIX_GUIDE.md`

These are not runtime risks, so they can remain until you decide whether they belong in `docs/ops` or should be deleted entirely.

## New Recommended Shape

```text
burner-point/
|-- apps/
|   |-- api/
|   |-- mobile/
|   `-- web/
|-- docs/
|   |-- CODEBASE_ARCHITECTURE_AUDIT.md
|   `-- ...
|-- infra/
|-- packages/
|   `-- shared/
|-- scripts/
|-- .github/
|-- README.md
|-- package.json
|-- turbo.json
`-- .env.example
```

## Delete List

Deleted in this pass:

- `apps/web/src/app/test/page.tsx`
- `apps/web/src/app/test/ui-kit/page.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/liquid-glass-button.tsx`
- `apps/web/src/components/ui/sign-in.tsx`
- `apps/web/src/components/ui/splite.tsx`
- `apps/web/src/components/ui/spotlight.tsx`
- `apps/web/FIX_SUMMARY.md`
- `burnerpoint-backend/`
- `burnerpoint-payment-update/`
- `packages/{shared`
- `pages/`
- root startup and `.next-start-*` log artifacts

Pending confirmation before delete:

- root `app.json`
- root `eas.json`
- root `INTEGRATION_STATUS.md`
- root `RAILWAY_FIX_GUIDE.md`

## Move Or Reorganize List

Recommended but not yet applied:

- Move root operational notes into `docs/ops/` if you want to keep them.
- Replace root `package.json` scripts with workspace-oriented commands only.
- Replace root `tsconfig.json` with a neutral workspace config.
- Remove root `nest-cli.json` after root scripts stop pretending the API lives at repo root.
- Consolidate the duplicate Tailwind configs in `apps/web` into a single authoritative file.

## Keep As-Is List

- `apps/api` because it is the authoritative backend.
- `apps/web` because it is the authoritative web frontend.
- `apps/mobile` because it is the authoritative Expo app.
- `packages/shared` because it is the only clearly active shared package.
- `docs` because the repo contains active deployment, auth, and architecture references.
- `infra/nginx` because it contains deployment-facing reverse proxy configuration.
- `scripts/security/scan-secrets.mjs` because it is part of release verification.

## Import And Dependency Notes

- The removed UI demo components had no live imports after the test route removal.
- `apps/web/src/proxy.ts` had an unused matcher constant removed during this pass.
- The root dependency layer still needs a dedicated cleanup if you want package manifests to match the actual workspace layout exactly.

## Operational Summary

After this pass, the repo is safer for production because public diagnostic routes are no longer bundled into the web app. The remaining cleanup work is mostly architectural housekeeping rather than a direct runtime issue.
