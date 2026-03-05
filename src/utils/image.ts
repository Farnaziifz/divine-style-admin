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
  return `${import.meta.env.VITE_API_URL}${path}`;
};
