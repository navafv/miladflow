import { useState, useMemo } from "react";
import { useApiResource } from "../../lib/useApiResource.js";
import Modal from "../../components/admin/Modal.jsx";
import {
  Field,
  NumberInput,
  Select,
  Toggle,
  SegmentedControl,
} from "../../components/admin/FormFields.jsx";
import {
  PageHeader,
  AddButton,
  TableShell,
  Th,
  Td,
  RowActions,
} from "../../components/admin/TableShell.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";

const scopeOptions = ["Global", "Category"];
const genderChoices = ["Boys", "Girls"];

function toGenderLabel(value) {
  if (!value) return genderChoices[0];
  const match = genderChoices.find(
    (opt) => opt.toLowerCase() === String(value).toLowerCase(),
  );
  return match ?? genderChoices[0];
}

const limitFields = [
  { key: "max_total", label: "Max total events" },
  { key: "max_individual", label: "Max individual events" },
  { key: "max_group", label: "Max group events" },
  { key: "max_stage", label: "Max stage events" },
  { key: "max_off_stage", label: "Max off-stage events" },
];

function emptyForm(defaultCategoryId) {
  return {
    scope: "global",
    category: defaultCategoryId ?? "",
    gender: "Boys",
    max_total: "",
    max_individual: "",
    max_group: "",
    max_stage: "",
    max_off_stage: "",
    general_bypasses_limits: false,
  };
}

export default function RulesPage() {
  const {
    data: rules,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
  } = useApiResource("/rule-limits/");
  const { data: categories, loading: categoriesLoading } =
    useApiResource("/categories/");
  const categoriesById = Object.fromEntries(
    categories.map((c) => [String(c.id), c]),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");

  const sanityWarning = useMemo(() => {
    const n = (v) =>
      v === "" || v === null || v === undefined ? null : Number(v);
    const total = n(form.max_total);
    const individual = n(form.max_individual);
    const group = n(form.max_group);
    const stage = n(form.max_stage);
    const offStage = n(form.max_off_stage);

    if (total !== null) {
      if (individual !== null && individual > total) {
        return `Max Individual (${individual}) is higher than Max Total (${total}) — Max Total will always be the real cap.`;
      }
      if (group !== null && group > total) {
        return `Max Group (${group}) is higher than Max Total (${total}) — Max Total will always be the real cap.`;
      }
      if (stage !== null && stage > total) {
        return `Max Stage (${stage}) is higher than Max Total (${total}) — Max Total will always be the real cap.`;
      }
      if (offStage !== null && offStage > total) {
        return `Max Off-stage (${offStage}) is higher than Max Total (${total}) — Max Total will always be the real cap.`;
      }
    }
    return null;
  }, [
    form.max_total,
    form.max_individual,
    form.max_group,
    form.max_stage,
    form.max_off_stage,
  ]);
  const { toast, showToast, dismiss } = useToast();

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm(categories[0]?.id));
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setEditingId(rule.id);
    setForm({
      scope: rule.scope,
      category: rule.category ?? categories[0]?.id ?? "",
      gender: toGenderLabel(rule.gender),
      max_total: rule.max_total ?? "",
      max_individual: rule.max_individual ?? "",
      max_group: rule.max_group ?? "",
      max_stage: rule.max_stage ?? "",
      max_off_stage: rule.max_off_stage ?? "",
      general_bypasses_limits: rule.general_bypasses_limits,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch {
      showToast("Could not delete this rule. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (form.scope === "category" && !form.category) {
      setFormError("Please choose a category for a category-scoped rule.");
      return;
    }

    const toNullableNumber = (value) =>
      value === "" || value === null || value === undefined
        ? null
        : Number(value);

    const payload = {
      scope: form.scope,
      category: form.scope === "category" ? form.category : null,
      gender: form.gender,
      max_total: toNullableNumber(form.max_total),
      max_individual: toNullableNumber(form.max_individual),
      max_group: toNullableNumber(form.max_group),
      max_stage: toNullableNumber(form.max_stage),
      max_off_stage: toNullableNumber(form.max_off_stage),
      general_bypasses_limits: form.general_bypasses_limits,
    };

    try {
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(
        err.message || "Could not save this rule. Please try again.",
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Participation Rules"
        description="Set limits for the whole madrassa, or override them for a specific category — e.g. Boys get broad global limits while Girls carry a strict off-stage-only rule."
        actions={<AddButton onClick={openAdd} label="Add rule" />}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && rules.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400">
          <strong>No rules configured.</strong> With zero rules in place,
          registrations are currently <strong>100% Unlimited</strong> — every
          student can be registered for any number of events with no cap. Add a
          Global or Category rule below to start enforcing limits.
        </div>
      )}

      <TableShell>
        <thead>
          <tr>
            <Th>Scope</Th>
            <Th>Gender</Th>
            <Th>Total</Th>
            <Th>Individual</Th>
            <Th>Group</Th>
            <Th>Stage</Th>
            <Th>Off-stage</Th>
            <Th>General bypass</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <Td
                colSpan={9}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                Loading rules…
              </Td>
            </tr>
          )}
          {!loading && rules.length === 0 && (
            <tr>
              <Td
                colSpan={9}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No rules yet — registrations are unrestricted until you add one.
              </Td>
            </tr>
          )}
          {!loading &&
            rules.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Td>
                  {r.scope === "global" ? (
                    <span className="rounded-full bg-[#21F1A8] px-2.5 py-1 text-xs font-bold text-[#171717]">
                      Global · whole madrassa
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      Category ·{" "}
                      {categoriesById[String(r.category)]?.name ?? "—"}
                    </span>
                  )}
                </Td>
                <Td className="text-xs font-semibold">{r.gender}</Td>
                <Td className="font-mono text-xs">
                  {r.max_total ?? "Unlimited"}
                </Td>
                <Td className="font-mono text-xs">
                  {r.max_individual ?? "Unlimited"}
                </Td>
                <Td className="font-mono text-xs">
                  {r.max_group ?? "Unlimited"}
                </Td>
                <Td className="font-mono text-xs">
                  {r.max_stage ?? "Unlimited"}
                </Td>
                <Td className="font-mono text-xs">
                  {r.max_off_stage ?? "Unlimited"}
                </Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                      r.general_bypasses_limits
                        ? "bg-[#21F1A8]/10 text-[#21F1A8] border-[#21F1A8]/30"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-transparent"
                    }`}
                  >
                    {r.general_bypasses_limits ? "Yes" : "No"}
                  </span>
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(r)}
                    onDelete={() => handleDelete(r.id)}
                  />
                </Td>
              </tr>
            ))}
        </tbody>
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit rule" : "Add rule"}
        wide
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Scope"
              hint="Global applies madrassa-wide; Category overrides it for one age category"
            >
              <SegmentedControl
                options={scopeOptions}
                value={form.scope === "global" ? "Global" : "Category"}
                onChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    scope: val === "Global" ? "global" : "category",
                  }))
                }
              />
            </Field>

            {form.scope === "category" && (
              <Field label="Category">
                <Select
                  required
                  disabled={categoriesLoading}
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    {categoriesLoading ? "Loading…" : "Select a category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label="Gender">
              <SegmentedControl
                options={genderChoices}
                value={form.gender}
                onChange={(val) => setForm((f) => ({ ...f, gender: val }))}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Limits for {form.gender} ·{" "}
              {form.scope === "global"
                ? "whole madrassa"
                : (categoriesById[String(form.category)]?.name ?? "—")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {limitFields.map((field) => (
                <Field key={field.key} label={field.label}>
                  <NumberInput
                    min={0}
                    placeholder="Unlimited"
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                  />
                </Field>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              Leave a field blank for no limit — e.g. set Max Stage and Max
              Group to 0 for a strict off-stage-only rule, while another
              madrassa can leave those blank (unlimited) for the same gender.
            </p>

            <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              <p className="mb-1 font-semibold text-slate-600 dark:text-slate-300">
                How these five numbers interact
              </p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>
                  Each limit is checked independently — a registration must pass{" "}
                  <em>all</em> of the limits that apply to it, not just one.
                </li>
                <li>
                  <strong>Max Stage</strong> + <strong>Max Off-stage</strong>{" "}
                  does <em>not</em> have to add up to <strong>Max Total</strong>{" "}
                  — a student could be capped at 3 stage and 3 off-stage (6
                  possible) but still be stopped at 4 total, whichever limit is
                  hit first wins.
                </li>
                <li>
                  Likewise <strong>Max Individual</strong> +{" "}
                  <strong>Max Group</strong> isn't required to equal{" "}
                  <strong>Max Total</strong>.
                </li>
                <li>
                  Setting <strong>Max Individual</strong> or{" "}
                  <strong>Max Group</strong> higher than{" "}
                  <strong>Max Total</strong> is allowed but has no effect — Max
                  Total will always be the binding constraint in that case.
                </li>
              </ul>
              {sanityWarning && (
                <p className="mt-2 flex items-start gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <span aria-hidden="true">⚠</span>
                  <span>{sanityWarning}</span>
                </p>
              )}
            </div>
          </div>

          <Toggle
            label="General category events bypass these limits"
            checked={form.general_bypasses_limits}
            onChange={(val) =>
              setForm((f) => ({ ...f, general_bypasses_limits: val }))
            }
          />

          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#21F1A8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutating}
              className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutating ? "Saving…" : editingId ? "Save changes" : "Add rule"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
