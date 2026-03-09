export function getUserInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
