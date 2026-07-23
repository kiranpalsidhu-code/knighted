export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return diffMins <= 1 ? "Just posted" : `${diffMins} minutes ago`;
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function freshnessClass(dateStr: string): string {
  const diffDays = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays < 3) return "text-green-400";
  if (diffDays < 14) return "text-yellow-400";
  return "text-orange-400";
}

export function freshnessLabel(dateStr: string): string {
  const diffDays = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays < 3) return "New";
  if (diffDays < 14) return "Recent";
  if (diffDays < 30) return "This month";
  return "Older";
}
