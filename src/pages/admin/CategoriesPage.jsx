import { useState } from "react";
import { useApiResource } from "../../lib/useApiResource.js";
import Modal from "../../components/admin/Modal.jsx";
import {
  Field,
  TextInput,
  NumberInput,
  Toggle,
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

const emptyForm = { name: "", starting_sequence: 101, is_default: false };

function withDefaultDemotion(list, saved) {
  return list.map((item) => {
    if (item.id === saved.id) return saved;
    if (saved.is_default && item.is_default)
      return { ...item, is_default: false };
    return item;
  });
}

export default function CategoriesPage() {
  const {
    data: categories,
    setData,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
  } = useApiResource("/categories/");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const { toast, showToast, dismiss } = useToast();

  const editingCategory = editingId
    ? categories.find((c) => c.id === editingId)
    : null;
  const isEditingGeneral = !!editingCategory?.is_default;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      starting_sequence: category.starting_sequence ?? 101,
      is_default: category.is_default,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (category) => {
    if (category.is_default) {
      showToast("The General category is required and cannot be deleted.");
      return;
    }
    try {
      await remove(category.id);
      showToast("Category deleted successfully.", "success");
    } catch (err) {
      showToast(
        err.message || "Could not delete this category. Please try again.",
        "error",
      );
    }
  };

  const handleSetDefault = async (category) => {
    if (category.is_default) return;
    const previous = categories;
    setData((prev) =>
      prev.map((c) => ({ ...c, is_default: c.id === category.id })),
    );
    try {
      const saved = await update(category.id, {
        is_default: true,
        starting_sequence: null,
      });
      setData((prev) => withDefaultDemotion(prev, saved));
      showToast("Default category updated successfully.", "success");
    } catch (err) {
      setData(previous);
      showToast(
        err.message ||
          "Could not update the default category. Please try again.",
        "error",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.is_default) {
      const seq = Number(form.starting_sequence);
      if (!form.starting_sequence || Number.isNaN(seq) || seq < 1) {
        setFormError(
          "Starting sequence is required for non-default categories.",
        );
        return;
      }
    }

    const payload = {
      name: isEditingGeneral ? editingCategory.name : form.name,
      starting_sequence: form.is_default
        ? null
        : Number(form.starting_sequence),
      is_default: form.is_default,
    };

    const previous = categories;
    try {
      if (editingId) {
        if (payload.is_default) {
          setData((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? { ...c, ...payload }
                : { ...c, is_default: false },
            ),
          );
        }
        const saved = await update(editingId, payload);
        setData((prev) => withDefaultDemotion(prev, saved));
      } else {
        if (payload.is_default) {
          setData((prev) => prev.map((c) => ({ ...c, is_default: false })));
        }
        const saved = await create(payload);
        setData((prev) => withDefaultDemotion(prev, saved));
      }
      setModalOpen(false);
      showToast(
        editingId
          ? "Category updated successfully."
          : "Category created successfully.",
        "success",
      );
    } catch (err) {
      setData(previous);
      const message =
        err.message || "Could not save this category. Please try again.";
      setFormError(message);
      showToast(message, "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Age categories drive student ID sequencing. General is the default for all-student and team events."
        actions={<AddButton onClick={openAdd} label="Add category" />}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <TableShell>
        <thead>
          <tr>
            <Th>Category</Th>
            <Th>Starting Sequence</Th>
            <Th>Students</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <Td
                colSpan={5}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                Loading categories…
              </Td>
            </tr>
          )}
          {!loading &&
            categories.map((c) => (
              <tr
                key={c.id}
                className={`hover:bg-[#21F1A8]/5 dark:hover:bg-slate-800/30 ${c.is_default ? "bg-amber-50/50 dark:bg-amber-500/5" : ""}`}
              >
                <Td
                  className={`font-semibold ${c.is_default ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}
                >
                  {c.name}
                </Td>
                <Td className="font-mono text-xs">
                  {c.is_default ? "—" : c.starting_sequence}
                </Td>
                <Td>{c.student_count ?? 0}</Td>
                <Td>
                  {c.is_default ? (
                    <span className="star-divider inline-flex items-center rounded-full border border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                      Default · General
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(c)}
                      className="text-xs font-semibold text-[#21F1A8] underline-offset-2 hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(c)}
                    onDelete={() => handleDelete(c)}
                    hideDelete={c.is_default}
                  />
                </Td>
              </tr>
            ))}
        </tbody>
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit category" : "Add category"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              {formError}
            </div>
          )}

          <Field
            label="Category name"
            hint={
              isEditingGeneral
                ? "General is a fixed category and cannot be renamed."
                : undefined
            }
          >
            <TextInput
              required
              disabled={isEditingGeneral}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Kiddies, Sub Junior, General"
              className={
                isEditingGeneral ? "cursor-not-allowed opacity-60" : ""
              }
            />
          </Field>

          {!form.is_default && (
            <Field
              label="Starting sequence number"
              hint="Student IDs in this category begin from this number, e.g. 2000 → 2001, 2002…"
            >
              <NumberInput
                required
                min={1}
                value={form.starting_sequence}
                onChange={(e) =>
                  setForm((f) => ({ ...f, starting_sequence: e.target.value }))
                }
              />
            </Field>
          )}

          {!isEditingGeneral && (
            <>
              <Toggle
                label="Set as the default General category"
                checked={form.is_default}
                onChange={(val) => setForm((f) => ({ ...f, is_default: val }))}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                The default category applies to all-student and team events
                where no specific age category is required. It carries no
                starting sequence — students always get their sequence ID from
                their primary age category. Only one category can be the
                default; making this one default will remove the flag from the
                current one.
              </p>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutating}
              className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold text-[#171717] shadow-sm transition-colors hover:bg-[#1de09a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutating
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Add category"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
