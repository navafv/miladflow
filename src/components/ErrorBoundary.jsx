import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(
      `[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ""}]`,
      error,
      info,
    );
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleTryAgain = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const scopeLabel = this.props.scope ? ` in the ${this.props.scope}` : "";

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex min-h-[50vh] w-full items-center justify-center px-4 py-16"
      >
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas-raised)] p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-rose-100)]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-6 w-6 text-[var(--color-rose-700)]"
              aria-hidden="true"
            >
              <path d="M10 6.5v4.5" strokeLinecap="round" />
              <path d="M10 13.75h.01" strokeLinecap="round" />
              <path
                d="M8.6 3.3 2 15a1.5 1.5 0 0 0 1.3 2.25h13.4A1.5 1.5 0 0 0 18 15L11.4 3.3a1.6 1.6 0 0 0-2.8 0Z"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-[var(--color-emerald-950)]">
            Something went wrong{scopeLabel}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            An unexpected error stopped this page from loading. You can try
            again, or reload the whole app if the problem keeps happening.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] p-3 text-left font-mono text-[11px] text-[var(--color-rose-700)]">
              {String(this.state.error?.message ?? this.state.error)}
            </pre>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-emerald-900)] transition hover:border-[var(--color-emerald-700)] focus-visible:outline-2 focus-visible:outline-[var(--color-gold-500)]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-[var(--color-emerald-900)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-emerald-700)] focus-visible:outline-2 focus-visible:outline-[var(--color-gold-500)]"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
