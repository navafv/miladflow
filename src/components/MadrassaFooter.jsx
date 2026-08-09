import Logo from "./Logo.jsx";

export default function MadrassaFooter({ madrassaName }) {
  return (
    <footer className="border-t border-neutral-200 bg-slate-50 dark:border-white/10 dark:bg-[#171717]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} {madrassaName ?? "This festival"}. All
          rights reserved.
        </p>

        <a
          href="https://navaf.vercel.app"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-600 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-[#21F1A8]/50 hover:text-[#0f9c74] hover:shadow-[0_0_15px_-4px_#21F1A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 dark:hover:text-[#21F1A8] dark:focus-visible:ring-offset-[#171717]"
        >
          <Logo className="h-3 w-3" />
          Powered by Navaf
        </a>
      </div>
    </footer>
  );
}
