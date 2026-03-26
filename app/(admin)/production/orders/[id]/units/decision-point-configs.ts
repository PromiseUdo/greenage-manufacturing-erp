// app/(admin)/production/orders/[id]/units/decision-point-configs.ts
//
// One config object per decision-point step. Adding a new decision point in the
// future only requires adding an entry here — no changes to StageLane state,
// handlers, or dialog JSX needed.

export interface DecisionPointConfig {
  /** Step ID as defined in lib/production-stages.ts */
  stepId: string;
  /** Dialog title */
  title: string;
  /** Info alert text shown at the top of the dialog */
  infoText: string;
  /** Submit button label when PASS is selected */
  passLabel: string;
  /** Submit button label when FAIL is selected (and no failureType required) */
  failLabel: string;
  /** Alert text shown when PASS is selected. Omit to suppress the alert. */
  passAlertText?: string;
  /** Alert text shown when FAIL is selected (non-failure-type steps only). */
  failAlertText?: string;
  /** Notes field label */
  notesLabel: string;
  /** Notes field placeholder */
  notesPlaceholder: string;
  /**
   * When true the dialog shows a Repairable / Non-repairable picker after FAIL.
   * The picker result is returned as `failureType` in the submit data.
   */
  hasFailureType?: boolean;
  /**
   * When true a FAIL outcome opens the Rework Creation dialog automatically.
   * For `hasFailureType` steps, rework is only opened for REPAIRABLE failures.
   */
  triggersRework?: boolean;
  /**
   * If set, this sibling step is auto-SKIPped when the decision outcome is PASS.
   * Example: P-3 PASS → skip P-4.
   */
  nextStepToSkipOnPass?: string;
  /**
   * If set, this sibling step is auto-SKIPped when the decision is FAIL + SCRAPPED.
   * Example: QC-3 FAIL Non-repairable → skip QC-4.
   */
  nextStepToSkipOnScrap?: string;
}

export const DECISION_POINT_CONFIGS: Record<string, DecisionPointConfig> = {
  'P-3': {
    stepId: 'P-3',
    title: 'P-3: Incoming Parts QC — PASS / FAIL',
    infoText:
      'Review incoming parts test results and evidence photos. Select PASS to proceed to soldering preparation, or FAIL to route to Non-Conforming Material Handling (P-4).',
    passLabel: 'Confirm PASS → P-5 Soldering Prep',
    failLabel: 'Confirm FAIL → P-4 Handling',
    passAlertText: 'Parts pass inspection — P-4 will be skipped and the batch moves to P-5.',
    failAlertText:
      'Parts fail inspection — the batch proceeds to P-4 Non-Conforming Material Handling.',
    notesLabel: 'Inspection Notes',
    notesPlaceholder: 'Describe test results, component failures, measurements…',
    nextStepToSkipOnPass: 'P-4',
  },

  'A-2.6': {
    stepId: 'A-2.6',
    title: 'A-2.6: BMS Test — PASS / FAIL Assessment',
    infoText:
      'Upload BMS test evidence, record your observations, then select PASS or FAIL.',
    passLabel: 'Confirm PASS → A-3',
    failLabel: 'Confirm FAIL & Start Rework',
    passAlertText: 'BMS passes — unit proceeds to A-3 Chassis Wiring & Mounting.',
    failAlertText:
      'Selecting FAIL will initiate a Rework Process. On completion the unit returns to A-2.6 for re-assessment.',
    notesLabel: 'BMS Test Observations / Notes',
    notesPlaceholder: 'Describe BMS readings, cell balance results, protection circuit tests…',
    triggersRework: true,
  },

  'QC-1': {
    stepId: 'QC-1',
    title: 'QC-1: Comprehensive Quality Assessment',
    infoText:
      'Upload photos of the unit under test, record your findings, then select PASS or FAIL.',
    passLabel: 'Confirm PASS → QC-2 Ageing',
    failLabel: 'Confirm FAIL & Start Rework',
    failAlertText:
      'Selecting FAIL will initiate a Rework Process. You will be prompted to describe the fault and add repair tasks.',
    notesLabel: 'QC Observations / Notes',
    notesPlaceholder: 'Describe voltage readings, visual defects, test results…',
    triggersRework: true,
  },

  'QC-3': {
    stepId: 'QC-3',
    title: 'QC-3: Final Inspection Post-Ageing',
    infoText:
      'Check for performance stability, thermal drift, and ageing-induced failures. Select PASS or FAIL.',
    passLabel: 'Confirm PASS → Packaging',
    failLabel: 'Confirm FAIL',
    passAlertText:
      'Unit passes final inspection and proceeds to QC-4 Packaging & Shipping.',
    notesLabel: 'QC Observations / Notes',
    notesPlaceholder:
      'Describe voltage readings, thermal results, ageing observations…',
    hasFailureType: true,
    nextStepToSkipOnScrap: 'QC-4',
  },
};
