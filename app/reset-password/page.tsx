import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="font-serif text-3xl text-ink-2 mb-2">Cracked</div>
        <p className="text-sm text-ink-dim mb-8 leading-relaxed">Set a new password.</p>
        <ResetPasswordForm />
        {searchParams.error ? <div className="mt-3 text-xs text-red-400 text-center">{searchParams.error}</div> : null}
      </div>
    </div>
  );
}
