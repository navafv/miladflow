import { useMemo, useState } from "react";
import Modal from "./Modal.jsx";
import { Field, Select, SegmentedControl, Toggle } from "./FormFields.jsx";

const SCOPE_ALL = "all";
const SCOPE_FILTERED = "filtered";
const SCOPE_SELECTED = "selected";

export default function IdCardSetupModal({
  open,
  onClose,
  onGenerate,
  allStudents,
  filteredStudents,
  filtersActive,
  selectedIds = [],
}) {
  const [scope, setScope] = useState(SCOPE_ALL);
  const [layout, setLayout] = useState(9);
  const [includeQr, setIncludeQr] = useState(true);

  const hasSelection = selectedIds.length > 0;

  const scopedStudents = useMemo(() => {
    if (scope === SCOPE_FILTERED) return filteredStudents;
    if (scope === SCOPE_SELECTED)
      return allStudents.filter((s) => selectedIds.includes(s.id));
    return allStudents;
  }, [scope, allStudents, filteredStudents, selectedIds]);

  const handleGenerate = () => {
    if (scopedStudents.length === 0) return;
    onGenerate({ students: scopedStudents, layout, includeQr });
  };

  const layoutOptions = [
    "9 (A4 3x3)",
    "8 (A4 4x2)",
    "16 (A3 4x4)",
    "18 (A3 6x3)",
  ];

  const currentLayoutString =
    layoutOptions.find((opt) => opt.startsWith(layout.toString())) ||
    layoutOptions[0];

  return (
    <Modal open={open} onClose={onClose} title="Print ID Cards">
      <div className="space-y-5">
        <Field label="Which students?">
          <Select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value={SCOPE_ALL}>
              All students ({allStudents.length})
            </option>
            <option value={SCOPE_FILTERED} disabled={!filtersActive}>
              Current filtered list ({filteredStudents.length})
              {!filtersActive ? " — no filters applied" : ""}
            </option>
            <option value={SCOPE_SELECTED} disabled={!hasSelection}>
              Selected students ({selectedIds.length})
              {!hasSelection ? " — none selected" : ""}
            </option>
          </Select>
        </Field>

        <Field label="Cards per page (Portrait Badges)">
          <SegmentedControl
            options={layoutOptions}
            value={currentLayoutString}
            onChange={(val) => {
              setLayout(parseInt(val, 10));
            }}
          />
        </Field>

        <Toggle
          checked={includeQr}
          onChange={setIncludeQr}
          label="Include backside QR code"
        />

        {scopedStudents.length === 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
            No students in this selection — pick a different scope.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#21F1A8] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={scopedStudents.length === 0}
            onClick={handleGenerate}
            className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate
          </button>
        </div>
      </div>
    </Modal>
  );
}
