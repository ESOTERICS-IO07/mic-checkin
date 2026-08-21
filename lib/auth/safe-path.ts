export function safeInternalPath(path: unknown, fallback = "/") {
  if (typeof path !== "string") {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
