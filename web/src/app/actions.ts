"use server";

import { revalidatePath } from "next/cache";
import "@/server/bootstrap";
import { createSession } from "@/core/app/sessions/createSession";

export interface ActionResult {
  success: boolean;
  error?: string;
  issues?: string[];
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
  };

  try {
    await createSession(payload);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return { success: false, error: "Validation failed", issues: (error as { issues: string[] }).issues };
    }
    console.error("Failed to create session", error);
    return { success: false, error: "Unexpected server error" };
  }
}
