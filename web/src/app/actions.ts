"use server";

import { revalidatePath } from "next/cache";
import "@/server/bootstrap";
import { createSession } from "@/core/app/sessions/createSession";
import type { Session } from "@/core/domain/session";

export interface ActionResult {
  success: boolean;
  error?: string;
  issues?: string[];
  session?: Session;
}

export async function createSessionAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const payload = {
    name: formData.get("name"),
    description: formData.get("description"),
    kind: formData.get("kind"),
    scheduledStart: formData.get("scheduledStart"),
    scheduledEnd: formData.get("scheduledEnd"),
    timingProvider: formData.get("timingProvider"),
    liveRcHeatId: formData.get("liveRcHeatId"),
  };

  try {
    const session = await createSession(payload);
    revalidatePath("/");
    return { success: true, session };
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return { success: false, error: "Validation failed", issues: (error as { issues: string[] }).issues };
    }
    console.error("Failed to create session", error);
    return { success: false, error: "Unexpected server error" };
  }
}
