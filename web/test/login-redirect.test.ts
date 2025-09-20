// @ts-nocheck

import "./setupAlias";
import assert from "node:assert/strict";
import test, { mock } from "node:test";

const redirectCalls: string[] = [];
const redirectSignal = new Error("redirect invoked");

mock.module("next/navigation", () => ({
  redirect(target: string) {
    redirectCalls.push(target);
    throw redirectSignal;
  },
}));

mock.module("next/headers", () => ({
  cookies() {
    return {
      set: () => {},
      delete: () => {},
    };
  },
}));

async function invokeSignIn(redirectTarget: string) {
  const { signInAction } = await import("@/app/login/actions");
  const formData = {
    get(name: string) {
      if (name === "passcode") {
        return "tower";
      }
      if (name === "redirect") {
        return redirectTarget;
      }
      return null;
    },
  } as unknown as FormData;

  try {
    await signInAction({ success: false }, formData);
    assert.fail("expected redirect to throw");
  } catch (error) {
    assert.equal(error, redirectSignal);
  }
}

test("signInAction preserves in-app redirect targets", async () => {
  redirectCalls.length = 0;
  process.env.DEV_AUTH_PASSWORD = "tower";

  await invokeSignIn("/garage");

  assert.equal(redirectCalls.at(-1), "/garage");
});

test("signInAction rejects external redirect targets", async () => {
  redirectCalls.length = 0;
  process.env.DEV_AUTH_PASSWORD = "tower";

  await invokeSignIn("https://evil.example/attack");

  assert.equal(redirectCalls.at(-1), "/");
});

test("normalizeRedirectTarget guards against protocol-relative redirects", async () => {
  const { normalizeRedirectTarget } = await import("@/app/login/redirect");

  assert.equal(normalizeRedirectTarget("//evil.example"), "/");
  assert.equal(normalizeRedirectTarget("/hangar"), "/hangar");
});
