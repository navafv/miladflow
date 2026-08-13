import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { apiClient, ApiError } from "../lib/apiClient.js";
import { login } from "../lib/authStore.js";

const emptyForm = {
  name: "",
  slug: "",
  location: "",
  festival_year: new Date().getFullYear(),
  contact_phone: "",
  email: "",
  password: "",
};

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#262626]";

const inputClass =
  "peer w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 py-3 text-sm font-medium text-[#171717] outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-[#21F1A8] focus:ring-4 focus:ring-[#21F1A8]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500";

const plainInputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-[#171717] outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-[#21F1A8] focus:ring-4 focus:ring-[#21F1A8]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500";

function BuildingIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M13 21V9a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v12M4 21h16M7.5 7.5h.01M7.5 11h.01M7.5 14.5h.01M10.5 7.5h.01M10.5 11h.01M10.5 14.5h.01M16.5 12h.01M16.5 15h.01"
      />
    </svg>
  );
}

function LinkIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757M10.81 15.312a4.5 4.5 0 0 1-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
      />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75a2.25 2.25 0 0 1 2.25-2.25h15a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.5 6 8 6.25L19.5 6"
      />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      stroke="currentColor"
      {...props}
    >
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="9.5"
        rx="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10.5V7.5a4 4 0 1 1 8 0v3"
      />
    </svg>
  );
}

function EyeIcon({ open, ...props }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.5a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.243L9.88 9.88"
      />
    </svg>
  );
}

function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-10%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#21F1A8]/20 blur-[120px] animate-auth-float-slow" />
      <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#21F1A8]/10 blur-[110px] animate-auth-float-slower" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_0)] bg-[size:26px_26px] opacity-40 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)]" />
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleNameChange = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      location: form.location.trim(),
      festival_year: Number(form.festival_year),
      contact_phone: form.contact_phone.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    try {
      await apiClient.post("/auth/register/", payload, { skipAuth: true });
      await login(payload.email, payload.password);
      navigate("/admin", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.data && typeof err.data === "object") {
          const firstField = Object.entries(err.data).find(([, v]) => v);
          if (firstField) {
            const [field, messages] = firstField;
            const message = Array.isArray(messages) ? messages[0] : messages;
            setError(`${field === "slug" ? "Fest slug" : field}: ${message}`);
          } else {
            setError("Please check the form and try again.");
          }
        } else if (err.status === null) {
          setError(
            "Could not reach the server. Please check your connection and try again.",
          );
        } else {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12 dark:bg-[#171717]">
      <style>{`
        @keyframes auth-float-slow { 0%,100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-50%, 4%) scale(1.08); } }
        @keyframes auth-float-slower { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-3%, -5%) scale(1.05); } }
        @keyframes auth-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes auth-pop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes auth-shake { 10%,90% { transform: translateX(-1px); } 20%,80% { transform: translateX(2px); } 30%,50%,70% { transform: translateX(-4px); } 40%,60% { transform: translateX(4px); } }
        .animate-auth-float-slow { animation: auth-float-slow 14s ease-in-out infinite; }
        .animate-auth-float-slower { animation: auth-float-slower 18s ease-in-out infinite; }
        .animate-auth-rise { animation: auth-rise 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-auth-pop { animation: auth-pop 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-auth-shake { animation: auth-shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      <AuthBackdrop />

      <div className="relative w-full max-w-lg">
        <Link
          to="/"
          className="animate-auth-rise mb-8 flex items-center justify-center gap-2 text-[#171717] dark:text-white"
          style={{ animationDelay: "0ms" }}
        >
          <Logo className="h-7 w-7" />
          <span className="font-display text-2xl font-semibold tracking-tight">
            Milad Flow
          </span>
        </Link>

        <div
          className="animate-auth-rise rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#262626]/90 dark:shadow-black/40"
          style={{ animationDelay: "80ms" }}
        >
          <h1 className="mt-4 font-display text-2xl font-semibold text-[#171717] dark:text-white">
            Set up your madrassa
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Create your festival workspace and committee admin account in one
            step.
          </p>

          {error && (
            <div
              role="alert"
              className="animate-auth-shake mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div
              className="animate-auth-rise space-y-4"
              style={{ animationDelay: "120ms" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#21F1A8]">
                Madrassa details
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Madrassa name
                </label>
                <div className="relative">
                  <BuildingIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400 peer-focus:text-[#21F1A8]" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Mifthahul Uloom Higher Secondary Madrassa"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Fest slug
                </label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400 peer-focus:text-[#21F1A8]" />
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                    onBlur={(e) =>
                      setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                    }
                    placeholder="thahvare-milad"
                    className={inputClass}
                  />
                </div>
                <span className="mt-1.5 block text-[11px] text-neutral-400 dark:text-neutral-500">
                  Your public URL: miladflow.vercel.app/
                  {form.slug || "your-slug"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="Kacheriparamba, Kannur, Kerala"
                    className={plainInputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Festival year
                  </label>
                  <input
                    type="number"
                    required
                    value={form.festival_year}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, festival_year: e.target.value }))
                    }
                    className={plainInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Contact phone{" "}
                  <span className="font-normal normal-case text-neutral-400 dark:text-neutral-500">
                    (optional)
                  </span>
                </label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact_phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  className={plainInputClass}
                />
              </div>
            </div>

            <div className="h-px w-full bg-neutral-200 dark:bg-white/10" />

            <div
              className="animate-auth-rise space-y-4"
              style={{ animationDelay: "180ms" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#21F1A8]">
                Admin account
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Admin email
                </label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400 peer-focus:text-[#21F1A8]" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="admin@yourmadrassa.org"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400 peer-focus:text-[#21F1A8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="••••••••"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:text-[#171717] dark:hover:text-white ${focusRing}`}
                  >
                    <EyeIcon open={showPassword} className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[#21F1A8] px-5 py-3 text-sm font-bold text-[#171717] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_0_24px_-2px_#21F1A8] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none ${focusRing}`}
            >
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin text-[#171717]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                  />
                </svg>
              )}
              <span>
                {submitting ? "Setting up…" : "Create madrassa account"}
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className={`rounded-sm font-semibold text-[#171717] transition-all duration-200 hover:text-[#0f9c74] hover:underline dark:text-[#21F1A8] dark:hover:text-[#21F1A8]/80 ${focusRing}`}
            >
              Sign in
            </Link>
          </p>
        </div>

        <p
          className="animate-auth-rise mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500"
          style={{ animationDelay: "260ms" }}
        >
          <Link
            to="/"
            className={`rounded-sm transition-all duration-200 hover:text-[#171717] hover:underline dark:hover:text-white ${focusRing}`}
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
