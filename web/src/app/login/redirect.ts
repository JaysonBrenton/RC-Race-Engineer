export function normalizeRedirectTarget(target: unknown): string {
  if (typeof target !== "string") {
    return "/";
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return "/";
  }

  if (!trimmed.startsWith("/")) {
    return "/";
  }

  if (trimmed.startsWith("//")) {
    return "/";
  }

  return trimmed;
}
