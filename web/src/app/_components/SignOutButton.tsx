/**
 * File: web/src/app/_components/SignOutButton.tsx
 * Purpose: Provides a small client-side control for terminating the current
 *          session from the dashboard header.
 * Notable behaviours: Calls the `signOutAction` inside `useTransition` to show
 *                    pending feedback and disables the button while the action
 *                    resolves.
 */

"use client";

import { useTransition } from "react";

import { signOutAction } from "../login/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOutAction())}
      className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm transition hover:border-speed hover:text-speed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-speed dark:border-neutral-700 dark:text-neutral-300"
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
