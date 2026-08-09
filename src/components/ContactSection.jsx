import { useState } from "react";
import { apiClient, ApiError } from "../lib/apiClient.js";
import { useToast, Toast } from "./admin/Toast.jsx";

const initialForm = { name: "", email: "", subject: "", message: "" };

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post(
        "/contact/",
        {
          name: form.name,
          email: form.email,
          subject: form.subject || `Inquiry from ${form.name}`,
          message: form.message,
        },
        { skipAuth: true },
      );
      showToast("Message sent — we\u2019ll be in touch soon.", "success");
      setForm(initialForm);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong sending your message. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="border-t border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-[#171717]"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
            Talk to us
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#171717] dark:text-white">
            Questions before your festival?
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            Reach out and our team will help you get your madrassa set up —
            usually within a day.
          </p>
          <div className="mt-6 space-y-2 text-sm text-[#171717] dark:text-neutral-200">
            <p className="flex items-center gap-2 font-semibold">
              <span aria-hidden="true">✉️</span> whyrowdev@gmail.com
            </p>
            <p className="flex items-center gap-2 font-semibold">
              <span aria-hidden="true">📞</span> +91 99950 61050
            </p>
            <p className="flex items-center gap-2 font-semibold">
              <span aria-hidden="true">📍</span> Kannur, Kerala, India
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition dark:border-white/10 dark:bg-[#262626] dark:shadow-black/20"
        >
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Your name
            <input
              type="text"
              required
              value={form.name}
              onChange={updateField("name")}
              placeholder="Committee member name"
              disabled={submitting}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-[#171717] outline-none transition focus:border-[#21F1A8] focus:ring-2 focus:ring-[#21F1A8]/30 disabled:opacity-60 dark:border-white/10 dark:bg-[#171717] dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={updateField("email")}
              placeholder="you@madrassa.org"
              disabled={submitting}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-[#171717] outline-none transition focus:border-[#21F1A8] focus:ring-2 focus:ring-[#21F1A8]/30 disabled:opacity-60 dark:border-white/10 dark:bg-[#171717] dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Subject
            <input
              type="text"
              required
              value={form.subject}
              onChange={updateField("subject")}
              placeholder="What's this about?"
              disabled={submitting}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-[#171717] outline-none transition focus:border-[#21F1A8] focus:ring-2 focus:ring-[#21F1A8]/30 disabled:opacity-60 dark:border-white/10 dark:bg-[#171717] dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Message
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={updateField("message")}
              placeholder="Tell us about your festival…"
              disabled={submitting}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-[#171717] outline-none transition focus:border-[#21F1A8] focus:ring-2 focus:ring-[#21F1A8]/30 disabled:opacity-60 dark:border-white/10 dark:bg-[#171717] dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#21F1A8] px-5 py-3 text-sm font-bold text-[#171717] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_#21F1A8] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#262626]"
          >
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>

      <Toast toast={toast} onDismiss={dismiss} />
    </section>
  );
}
