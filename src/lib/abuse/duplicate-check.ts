export function checkDuplicateContent(
  content: string,
  recentContents: string[],
) {
  const normalized = content.trim();

  return recentContents.some((item) => item.trim() === normalized);
}
