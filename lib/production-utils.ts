// lib/production-utils.ts
// Shared computation helpers for production order data.
// Isomorphic — safe to import from both server API routes and client components.

/** Computes overall completion percentage, rounded to the nearest integer. */
export function computeProgressPercent(
  completedActions: number,
  totalActions: number,
): number {
  return totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
}

export type ScheduleStatus = 'ON_TRACK' | 'AHEAD' | 'DELAYED';

interface OrderScheduleFields {
  status: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualEnd: Date | null | undefined;
}

/**
 * Derives the schedule status of a production order.
 *
 * Completed / partially-completed orders compare actualEnd to scheduledEnd.
 * In-progress orders compare current progress against the expected proportion
 * of time elapsed:
 *   - More than 10 pp ahead of expected → AHEAD
 *   - More than 15 pp behind expected   → DELAYED
 */
export function computeScheduleStatus(
  order: OrderScheduleFields,
  progressPercent: number,
): ScheduleStatus {
  const now = new Date();
  const { status, actualEnd, scheduledEnd, scheduledStart } = order;

  if (status === 'COMPLETED' || status === 'PARTIALLY_COMPLETED') {
    if (!actualEnd) return 'ON_TRACK';
    return actualEnd <= scheduledEnd ? 'AHEAD' : 'DELAYED';
  }

  if (status === 'IN_PROGRESS') {
    if (now > scheduledEnd) return 'DELAYED';
    const totalDuration = scheduledEnd.getTime() - scheduledStart.getTime();
    const elapsed = now.getTime() - scheduledStart.getTime();
    const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
    if (progressPercent > expectedProgress + 10) return 'AHEAD';
    if (progressPercent < expectedProgress - 15) return 'DELAYED';
  }

  return 'ON_TRACK';
}

/** Returns the unit shortfall count for an order (0 when fully produced). */
export function computeShortfall(
  quantityPackaged: number | null | undefined,
  quantity: number,
): number {
  return quantityPackaged != null && quantityPackaged < quantity
    ? quantity - quantityPackaged
    : 0;
}
