"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { normalizeRedirectTarget } from "./redirect";

export interface AuthResult {
  success: boolean;
  error?: string;
}

const COOKIE_NAME = "rc-dev-auth";

export async function signInAction(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const passcode = `${formData.get("passcode") ?? ""}`.trim();
  const redirectTo = normalizeRedirectTarget(formData.get("redirect"));
  const expected = process.env.DEV_AUTH_PASSWORD ?? "engineer";

  if (!passcode) {
    return { success: false, error: "Enter the shared passphrase" };
  }
  if (passcode !== expected) {
    return { success: false, error: "Invalid passphrase" };
  }

  const secure = process.env.NODE_ENV === "production";
  cookies().set(COOKIE_NAME, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(redirectTo);
}

export async function signOutAction() {
  cookies().delete(COOKIE_NAME);
  redirect("/login");
}
