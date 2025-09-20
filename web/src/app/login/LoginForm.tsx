/**
 * File: web/src/app/login/LoginForm.tsx
 * Purpose: Handles the shared-passphrase login flow for the development
 *          environment.
 * Notable behaviours: Submits credentials through `signInAction` with
 *                    `useFormState`, forwards redirect targets, and renders
 *                    inline error messaging alongside a pending-aware submit
 *                    button.
 */

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthResult } from "./actions";
import { signInAction } from "./actions";

const INITIAL_STATE: AuthResult = { success: false };

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={action} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="space-y-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          Shared passphrase
          <input
            type="password"
            name="passcode"
            autoComplete="current-password"
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-speed dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          The development environment uses a shared passphrase instead of full authentication. Rotate the secret in `DEV_AUTH_PASSWORD` when needed.
        </p>
      </div>

      {state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-600/40 dark:bg-red-900/40 dark:text-red-100">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-md bg-speed px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-speed-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-speed disabled:cursor-not-allowed disabled:bg-neutral-400"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Enter control tower"}
    </button>
  );
}
