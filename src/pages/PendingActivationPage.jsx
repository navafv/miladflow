import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../lib/authStore.js";
import { logout } from "../lib/authStore.js";

const SUPPORT_WHATSAPP_NUMBER = "+919995061050";

function buildWhatsAppLink(madrassaName) {
  const message = `Hello Navaf, I just registered my Madrassa${
    madrassaName ? ` (${madrassaName})` : ""
  } on MiladFlow. Could you please activate my account?`;
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.63 1.44 5.15L2 22l5.09-1.53a9.87 9.87 0 0 0 4.95 1.33h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.55-1.16-2.96s.72-2.1.98-2.39c.25-.28.55-.35.73-.35h.53c.17 0 .4-.02.62.48.24.55.81 1.9.88 2.04.07.14.11.3.02.49-.09.19-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.28.71 1.18 1.53 1.91 1.05.94 1.94 1.24 2.22 1.38.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.6.76 1.88.89.27.14.46.2.52.32.07.12.07.68-.17 1.35Z" />
    </svg>
  );
}

export default function PendingActivationPage() {
  const { me } = useAuth();
  const madrassaName = me?.madrassa?.name;
  const whatsappHref = buildWhatsAppLink(madrassaName);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-6 py-16 font-['Manrope',sans-serif] dark:bg-[#171717]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#21F1A8]/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#21F1A8]/10 blur-[110px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2 text-[#171717] dark:text-white"
        >
          <Logo className="h-7 w-7" />
          <span className="font-display text-2xl font-semibold tracking-tight">
            Milad Flow
          </span>
        </Link>

        <div className="rounded-2xl border border-neutral-200 bg-white/90 p-8 text-center shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#262626]/90 dark:shadow-black/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#21F1A8]/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-8 w-8 text-[#0f9c74] dark:text-[#21F1A8]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0f9c74] dark:text-[#21F1A8]">
            Registration successful
          </span>

          <h1 className="mt-4 font-display text-2xl font-semibold text-[#171717] dark:text-white">
            Your Madrassa account is pending verification
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {madrassaName ? (
              <>
                Thanks for registering <strong className="text-[#171717] dark:text-white">{madrassaName}</strong> on
                MiladFlow.
              </>
            ) : (
              "Thanks for registering on MiladFlow."
            )}{" "}
            Our team is reviewing your details and will activate your dashboard
            shortly. This usually only takes a short while — reach out on
            WhatsApp below if you'd like a hand.
          </p>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_-4px_rgba(37,211,102,0.6)] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_0_28px_-2px_rgba(37,211,102,0.75)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#262626]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Contact Support via WhatsApp
          </a>

          <button
            type="button"
            onClick={() => logout()}
            className="mt-4 text-xs font-semibold text-neutral-500 underline-offset-2 transition hover:text-[#171717] hover:underline dark:text-neutral-400 dark:hover:text-white"
          >
            Sign out
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
          Wrong account?{" "}
          <Link
            to="/login"
            className="rounded-sm font-semibold text-[#171717] transition-all duration-200 hover:text-[#0f9c74] hover:underline dark:text-[#21F1A8] dark:hover:text-[#21F1A8]/80"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
