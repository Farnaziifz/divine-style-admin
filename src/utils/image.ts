function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('VITE_API_URL is required');
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

const API_BASE_URL = normalizeBaseUrl(
  (import.meta.env.VITE_API_URL as string | undefined) ?? '',
);

export const getImageUrl = (
  path: string | null | undefined,
): string | undefined => {
  if (!path) return undefined;
  if (
    path.startsWith('http') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  )
    return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
};
