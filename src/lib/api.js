// Centralized API helper
// Reads VITE_API_BASE_URL (optional). If unset, uses relative paths (e.g. /api/...)

const BASE = import.meta?.env?.VITE_API_BASE_URL || "";

function joinUrl(base, path) {
  if (!base) return path; // relative
  if (!path) return base;
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
  return base + path;
}

export function apiUrl(path) {
  return joinUrl(BASE, path);
}

export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, options);
  return res;
}
