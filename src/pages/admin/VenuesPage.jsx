import { useState } from "react";
import { useApiResource } from "../../lib/useApiResource.js";
import Modal from "../../components/admin/Modal.jsx";
import { Field, TextInput } from "../../components/admin/FormFields.jsx";
import {
  PageHeader,
  AddButton,
  TableShell,
  Th,
  Td,
  RowActions,
} from "../../components/admin/TableShell.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";

const emptyForm = { name: "" };

export default function VenuesPage() {
  const {
    data: venues,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
  } = useApiResource("/venues/");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const { toast, showToast, dismiss } = useToast();

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (venue) => {
    setEditingId(venue.id);
    setForm({ name: venue.name });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      showToast("Venue deleted successfully.", "success");
    } catch (err) {
      showToast(
        err.message || "Could not delete this venue. Please try again.",
        "error",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      if (editingId) {
        await update(editingId, form);
      } else {
        await create(form);
      }
      setModalOpen(false);
      showToast(
        editingId
          ? "Venue updated successfully."
          : "Venue created successfully.",
        "success",
      );
    } catch (err) {
      const message =
        err.message || "Could not save this venue. Please try again.";
      setFormError(message);
      showToast(message, "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Venues"
        description="Locations used across the festival — stages, halls, and off-stage rooms."
        actions={<AddButton onClick={openAdd} label="Add venue" />}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <TableShell>
        <thead>
          <tr>
            <Th>Venue</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <Td
                colSpan={2}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                Loading venues…
              </Td>
            </tr>
          )}
          {!loading &&
            venues.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Td className="font-semibold text-slate-900 dark:text-white">
                  {v.name}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(v)}
                    onDelete={() => handleDelete(v.id)}
                  />
                </Td>
              </tr>
            ))}
          {!loading && venues.length === 0 && (
            <tr>
              <Td
                colSpan={2}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No venues yet — add your first stage or hall.
              </Td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit venue" : "Add venue"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {formError}
            </div>
          )}
          <Field label="Venue name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Stage 1, Main Hall, Off-stage Room A"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
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
              {mutating ? "Saving…" : editingId ? "Save changes" : "Add venue"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
