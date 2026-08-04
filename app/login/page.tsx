import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string; next?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="font-serif text-3xl text-ink-2 mb-2">Cracked</div>
        <p className="text-sm text-ink-dim mb-8 leading-relaxed">
          One line and you&apos;re in. We&apos;ll email you a sign-in link.
        </p>

        {searchParams.sent ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-ink-muted leading-relaxed">
            Check your inbox for a sign-in link.
          </div>
        ) : (
          <form action={login} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={searchParams.next ?? "/map"} />
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full h-12 rounded-xl border border-border-strong bg-canvas px-4 text-sm text-ink outline-none focus:border-ink-dim"
            />
            {searchParams.error ? (
              <div className="text-xs text-red-400">{searchParams.error}</div>
            ) : null}
            <button
              type="submit"
              className="w-full h-12 rounded-full bg-ink-2 text-canvas text-sm font-medium"
            >
              Send sign-in link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
