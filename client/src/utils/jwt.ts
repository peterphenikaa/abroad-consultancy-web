export function normalizeAccessToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

export function isJwtFormat(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const normalized = normalizeAccessToken(token);
  if (!normalized || !isJwtFormat(normalized)) return null;

  try {
    const json = base64UrlDecode(normalized.split(".")[1]!);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
