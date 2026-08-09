import { Link } from "react-router-dom";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-200 bg-[#171717] dark:border-white/10">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#21F1A8]/25 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="rosette-field absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h2 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
          This Milad, let the platform carry the weight.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-300">
          Your committee has enough to hold — the spirit of the day
          shouldn&rsquo;t be one of them. Milad Flow handles the registrations,
          the rules, the schedule, and the results, so your event runs the way
          you always imagined: dignified, organised, and unforgettable for the
          right reasons.
        </p>
        <p className="mt-6 font-display text-lg italic text-[#21F1A8]">
          Rooted in tradition. Run in real time.
        </p>
        <div className="mt-9">
          <Link
            to="/signup"
            className="inline-block rounded-full bg-[#21F1A8] px-8 py-3.5 text-sm font-bold text-[#171717] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_25px_#21F1A8]"
          >
            Request Your Workspace
          </Link>
        </div>
      </div>
    </section>
  );
}
