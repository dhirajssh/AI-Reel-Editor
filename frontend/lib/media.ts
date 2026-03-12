const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function toMediaUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.replace(/\\/g, "/");
  const absoluteMarker = "/storage/";
  const absoluteIndex = normalized.indexOf(absoluteMarker);
  if (absoluteIndex !== -1) {
    return `${API_BASE}${normalized.slice(absoluteIndex)}`;
  }

  const match = normalized.match(/(?:^|\/)storage\/(.+)/);
  if (!match) {
    return null;
  }

  return `${API_BASE}/storage/${match[1]}`;
}
