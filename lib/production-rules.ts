// lib/production-rules.ts
// Shared production business rules — imported by both frontend and backend.
// Keep this file free of any Next.js / React / Prisma imports so it stays isomorphic.

/**
 * Steps that are blocked (cannot be completed or skipped) while an active rework exists,
 * keyed by the step ID that triggered the rework.
 *
 * Frontend: used in StageLane to derive the `reworkBlocked` prop.
 * Backend:  used in the tracking PATCH route to enforce the gate server-side.
 */
export const REWORK_GATES: Record<string, string[]> = {
  'A-2.6': ['A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'QC-1', 'QC-2', 'QC-3', 'QC-4'],
  'QC-1':  ['QC-2', 'QC-3', 'QC-4'],
  'QC-3':  ['QC-4'],
};

/**
 * Flat union of every step that can be gated by any rework.
 * Used in the backend to cheaply short-circuit the rework lookup:
 * if the current step isn't in this set, skip the DB query entirely.
 */
export const ALL_REWORK_GATED_STEPS: ReadonlySet<string> = new Set(
  Object.values(REWORK_GATES).flat(),
);
