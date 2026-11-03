export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Resolves an API path against VITE_API_BASE_URL if configured,
 * or keeps it relative (e.g., '/api/...') for proxy/same-origin deployments.
 */
export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
