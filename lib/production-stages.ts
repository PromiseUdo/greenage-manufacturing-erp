// lib/production-stages.ts
// Hardcoded production stages and action items from the
// NEWGEN Ultra Solar Generator Manufacturing Process Flow Document

export interface ActionItemTemplate {
  stepId: string;
  actionName: string;
  defaultResponsibility: string;
  outputNextStep: string;
  focusGoal: string;
  sortOrder: number;
  isDecisionPoint?: boolean; // marks QC gate steps that require outcome recording
}

export interface StageTemplate {
  stageName: string;
  stageLabel: string;
  sortOrder: number;
  actionItems: ActionItemTemplate[];
}

export const DECISION_POINT_STEPS = ["P-3", "A-2.6", "QC-2", "QC-6"];

export const REJECTION_CATEGORIES = [
  { value: "COMPONENT_DEFECT", label: "Component Defect" },
  { value: "ASSEMBLY_FAULT", label: "Assembly Fault" },
  { value: "WIRING_ERROR", label: "Wiring Error" },
  { value: "QC_FAILURE", label: "QC Failure (Performance)" },
  { value: "OTHER", label: "Other" },
];

export const PRODUCTION_STAGES: StageTemplate[] = [
  {
    stageName: "PREPARATION",
    stageLabel: "Preparation Station (Soldering/Staging)",
    sortOrder: 1,
    actionItems: [
      {
        stepId: "P-1",
        actionName: "Sign Out All Required Parts from Store (BOM Verification)",
        defaultResponsibility: "Store Keeper / Assembly Lead",
        outputNextStep: "Complete Parts Kit",
        focusGoal:
          "Ensure all components (Inverter, BMS, Battery Cells, Enclosure, etc.) are present.",
        sortOrder: 1,
      },
      {
        stepId: "P-2",
        actionName: "Incoming Parts Quality Inspection (Testing)",
        defaultResponsibility: "QC Technician",
        outputNextStep: "Verified Components",
        focusGoal:
          "Test critical components (Hybrid Inverter, Battery Cells) against expected outcomes.",
        sortOrder: 2,
      },
      {
        stepId: "P-3",
        actionName: "QC PASS? (Decision Point)",
        defaultResponsibility: "QC Technician",
        outputNextStep: "FAIL: Go to P-4. PASS: Go to P-5.",
        focusGoal: "FAIL: Go to P-4. PASS: Go to P-5.",
        sortOrder: 3,
        isDecisionPoint: true,
      },
      {
        stepId: "P-4",
        actionName: "Non-Conforming Material Handling",
        defaultResponsibility: "Assembly Lead",
        outputNextStep: "Quarantine / Rework",
        focusGoal:
          "Isolate faulty parts and initiate material request for replacements.",
        sortOrder: 4,
      },
      {
        stepId: "P-5",
        actionName: "Soldering Station Preparation",
        defaultResponsibility: "Soldering Technician",
        outputNextStep: "Ready-to-Assemble Sub-Kits",
        focusGoal:
          "Prepare all wires and other through-hole components as per Detailed Work Instructions (DWI).",
        sortOrder: 5,
      },
      {
        stepId: "P-6",
        actionName: "Transfer to Assembly Station",
        defaultResponsibility: "Store Keeper",
        outputNextStep: "Verified Components & Soldered Sub-Kits",
        focusGoal: "",
        sortOrder: 6,
      },
    ],
  },
  {
    stageName: "ASSEMBLY",
    stageLabel: "Assembly Station (Integration)",
    sortOrder: 2,
    actionItems: [
      {
        stepId: "A-1",
        actionName: "Battery Unit Assembly",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Complete Battery Unit (Internal)",
        focusGoal: "Mount Li-ion Cells to Base, Connect BMS.",
        sortOrder: 1,
      },
      {
        stepId: "A-2",
        actionName: "Battery Unit Casing",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Cased Battery Unit",
        focusGoal:
          "Install casing side covers for internal protection.",
        sortOrder: 2,
      },
      {
        stepId: "A-2.5",
        actionName: "Sub-Assembly Test: BMS Communication & Function",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Tested Battery Module",
        focusGoal:
          "Formally test BMS communication and battery safety features before main integration.",
        sortOrder: 3,
      },
      {
        stepId: "A-2.6",
        actionName: "BMS Test PASS? (Decision Point)",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "FAIL: Rework / Repair Battery Unit. PASS: Go to A-3.",
        focusGoal:
          "FAIL: Rework / Repair Battery Unit. PASS: Go to A-3.",
        sortOrder: 4,
        isDecisionPoint: true,
      },
      {
        stepId: "A-3",
        actionName: "Chassis Wiring & Mounting",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Half-Assembled Chassis",
        focusGoal:
          "Mount Circuit Breakers, LCD, and connect all internal wires. MUST use Digital Checksheet.",
        sortOrder: 5,
      },
      {
        stepId: "A-4",
        actionName: "Hybrid Inverter Board Integration",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Complete Internal Assembly",
        focusGoal:
          "Mount and connect the main Hybrid Inverter Board. Referencing DWI is mandatory.",
        sortOrder: 6,
      },
      {
        stepId: "A-5",
        actionName: "Minimum Viable Test (MVT)",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Functional/Tested Unit",
        focusGoal:
          "Power ON, confirm LCD display, verify battery voltage reading, then power OFF.",
        sortOrder: 7,
      },
      {
        stepId: "A-6",
        actionName: "Final Enclosure Installation",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Fully Assembled Generator",
        focusGoal:
          "Connect remaining parts and install the main protective enclosure/cover.",
        sortOrder: 8,
      },
      {
        stepId: "A-7",
        actionName: "Transfer to Next Station",
        defaultResponsibility: "Assembly Technician",
        outputNextStep: "Completed Unit Ready for QC",
        focusGoal: 'Mark the unit status as "Ready for QC."',
        sortOrder: 9,
      },
    ],
  },
  {
    stageName: "QUALITY_CONTROL",
    stageLabel: "Quality Control & Ageing",
    sortOrder: 3,
    actionItems: [
      {
        stepId: "QC-1",
        actionName: "Comprehensive QC Check",
        defaultResponsibility: "QC Technician",
        outputNextStep: "QC Report",
        focusGoal:
          "Check output voltage/current, safety features, grounding, and general fit and finish.",
        sortOrder: 1,
      },
      {
        stepId: "QC-2",
        actionName: "QC PASS? (Decision Point)",
        defaultResponsibility: "QC Technician",
        outputNextStep: "FAIL: Go to QC-3. PASS: Go to QC-4.",
        focusGoal: "FAIL: Go to QC-3. PASS: Go to QC-4.",
        sortOrder: 2,
        isDecisionPoint: true,
      },
      {
        stepId: "QC-3",
        actionName: "Rework & Repair",
        defaultResponsibility: "QC Technician / Assembly",
        outputNextStep: "Return to Assembly (A-3/A-4)",
        focusGoal:
          "Based on fault diagnosis, send back to the relevant assembly step for correction.",
        sortOrder: 3,
      },
      {
        stepId: "QC-4",
        actionName: "Ageing Process Commencement",
        defaultResponsibility: "QC Technician",
        outputNextStep: "Stress-Tested Unit",
        focusGoal:
          "Transfer unit to the Ageing Cabinet for specified duration and stress testing (load/charge cycles).",
        sortOrder: 4,
      },
      {
        stepId: "QC-5",
        actionName: "Final Inspection Post-Ageing",
        defaultResponsibility: "QC Technician",
        outputNextStep: "Final Approval/Rejection",
        focusGoal:
          "Check for performance stability, thermal drift, and any failures induced by the Ageing process.",
        sortOrder: 5,
      },
      {
        stepId: "QC-6",
        actionName: "FINAL PASS? (Decision Point)",
        defaultResponsibility: "QC Technician",
        outputNextStep: "FAIL: Go to QC-7. PASS: Go to QC-8.",
        focusGoal: "FAIL: Go to QC-7. PASS: Go to QC-8.",
        sortOrder: 6,
        isDecisionPoint: true,
      },
      {
        stepId: "QC-7",
        actionName: "Rejection & Documentation",
        defaultResponsibility: "QC Technician",
        outputNextStep: "Scrap / Failure Log",
        focusGoal:
          "If failure is non-repairable, document the failure details in the scrap log.",
        sortOrder: 7,
      },
      {
        stepId: "QC-8",
        actionName: "Packaging and Shipping",
        defaultResponsibility: "Packaging Team",
        outputNextStep: "Finished Goods Inventory",
        focusGoal:
          "Final handover of the completed, tested, and approved NEWGEN Ultra Solar Generator.",
        sortOrder: 8,
      },
    ],
  },
];
