import { useEffect, useRef, useState } from "react";
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

const emptyForm = { name: "", leader: "" };

export default function TeamsPage() {
  const {
    data: teams,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
  } = useApiResource("/teams/");

  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (!loading) hasLoadedOnceRef.current = true;
  }, [loading]);
  const isInitialLoad = loading && !hasLoadedOnceRef.current;
  const isBackgroundRefresh = loading && hasLoadedOnceRef.current;

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

  const openEdit = (team) => {
    setEditingId(team.id);
    setForm({ name: team.name, leader: team.leader ?? "" });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch {
      showToast("Could not delete this team. Please try again.");
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
    } catch (err) {
      setFormError(
        err.message || "Could not save this team. Please try again.",
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Teams"
        description="The competing teams for this festival. Age-category and ID sequencing now live under Categories."
        actions={<AddButton onClick={openAdd} label="Add team" />}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {isBackgroundRefresh && (
        <p
          role="status"
          aria-live="polite"
          className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          <span
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#21F1A8] border-t-transparent"
            aria-hidden="true"
          />
          Refreshing…
        </p>
      )}

      <TableShell label="Teams table">
        <thead>
          <tr>
            <Th>Team</Th>
            <Th>Team Leader</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody
          className={
            isBackgroundRefresh
              ? "opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
          {isInitialLoad && (
            <tr>
              <Td
                colSpan={3}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                Loading teams…
              </Td>
            </tr>
          )}
          {!isInitialLoad &&
            teams.map((t) => (
              <tr
                key={t.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Td className="font-semibold text-slate-900 dark:text-white">
                  {t.name}
                </Td>
                <Td className="text-xs">
                  {t.leader || (
                    <span className="text-slate-400 dark:text-slate-500">
                      Not assigned
                    </span>
                  )}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(t)}
                    onDelete={() => handleDelete(t.id)}
                  />
                </Td>
              </tr>
            ))}
          {!isInitialLoad && teams.length === 0 && (
            <tr>
              <Td
                colSpan={3}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No teams yet — add your first one.
              </Td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit team" : "Add team"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {formError}
            </div>
          )}
          <Field label="Team name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Team Al-Ansar"
            />
          </Field>
          <Field label="Team leader">
            <TextInput
              value={form.leader}
              onChange={(e) =>
                setForm((f) => ({ ...f, leader: e.target.value }))
              }
              placeholder="e.g. Ubaid Rahman"
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
              {mutating ? "Saving…" : editingId ? "Save changes" : "Add team"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
