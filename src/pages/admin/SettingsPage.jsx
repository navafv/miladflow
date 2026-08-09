import { useEffect, useState } from "react";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import { Field, TextInput } from "../../components/admin/FormFields.jsx";
import { PageHeader } from "../../components/admin/TableShell.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";

const emptyPasswordForm = { current: "", next: "", confirm: "" };

function SubscriptionBadge({ status }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
        isActive
          ? "bg-[#21F1A8]/10 text-[#21F1A8] border-[#21F1A8]/30"
          : "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#21F1A8]" : "bg-red-600 dark:bg-red-500"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    location: "",
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const { toast, showToast, dismiss } = useToast();

  const loadProfile = () => {
    setLoading(true);
    setLoadError(null);
    return apiClient
      .get("/auth/me/")
      .then((me) => {
        setProfile({
          name: me?.madrassa?.name ?? "",
          slug: me?.madrassa?.slug ?? "",
          email: me?.madrassa?.contact_email ?? me?.email ?? "",
          phone: me?.madrassa?.contact_phone ?? "",
          location: me?.madrassa?.location ?? "",
        });
        setSubscriptionStatus(me?.madrassa?.subscription_status ?? null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Could not load your madrassa profile.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile().catch(() => {});
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const me = await apiClient.patch("/auth/me/", {
        name: profile.name,
        location: profile.location,
        contact_email: profile.email,
        contact_phone: profile.phone,
      });
      setSubscriptionStatus(
        me?.madrassa?.subscription_status ?? subscriptionStatus,
      );
      showToast("Profile saved.", "success");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not save profile changes.";
      showToast(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.next || passwordForm.next !== passwordForm.confirm) {
      showToast("New password and confirmation do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.post("/auth/change-password/", {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      setPasswordForm(emptyPasswordForm);
      showToast("Password updated.", "success");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not change your password.";
      showToast(message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Update your madrassa's profile and admin account security."
      />

      {loadError && (
        <div className="max-w-2xl rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {loadError}
        </div>
      )}

      <section className="max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              Madrassa profile
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This information appears on your public festival page.
            </p>
          </div>
          {subscriptionStatus && (
            <SubscriptionBadge status={subscriptionStatus} />
          )}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
          <Field label="Madrassa name">
            <TextInput
              required
              disabled={loading}
              value={profile.name}
              onChange={(e) =>
                setProfile((f) => ({ ...f, name: e.target.value }))
              }
            />
          </Field>
          <Field
            label="Fest name / slug"
            hint="Your public URL slug is set at registration and can't be changed here."
          >
            <TextInput
              required
              disabled
              value={profile.slug}
              placeholder="e.g. noorul-islam"
            />
          </Field>
          <Field label="Location">
            <TextInput
              disabled={loading}
              value={profile.location}
              onChange={(e) =>
                setProfile((f) => ({ ...f, location: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Contact email">
              <TextInput
                type="email"
                required
                disabled={loading}
                value={profile.email}
                onChange={(e) =>
                  setProfile((f) => ({ ...f, email: e.target.value }))
                }
              />
            </Field>
            <Field label="Contact phone">
              <TextInput
                type="tel"
                disabled={loading}
                value={profile.phone}
                onChange={(e) =>
                  setProfile((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || savingProfile}
              className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
          Change password
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Use a strong password you don't use elsewhere.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
          <Field label="Current password">
            <TextInput
              type="password"
              required
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, current: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="New password">
              <TextInput
                type="password"
                required
                value={passwordForm.next}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, next: e.target.value }))
                }
              />
            </Field>
            <Field label="Confirm new password">
              <TextInput
                type="password"
                required
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
                }
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
