export function safeJson<T>(x: unknown, fallback: T): T {
  try { return JSON.parse(String(x)) as T; } catch { return fallback; }
}
