import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in | RC Racing Engineer",
};

export default function LoginPage({ searchParams }: { searchParams?: { redirect?: string } }) {
  const redirectTo = searchParams?.redirect ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">The RC Racing Engineer</p>
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">Development access</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Enter the shared passphrase issued to the crew. Protect the secret when screen sharing.
          </p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
