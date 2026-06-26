import { VisualStreamPost } from "./types";

export function getPostDefaultName(post: VisualStreamPost, allPosts: VisualStreamPost[]): string {
  // Sort posts by createdAt ascending to determine stable chronological numbering
  const sorted = [...allPosts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const index = sorted.findIndex(p => p.id === post.id);
  return `Post ${index !== -1 ? index + 1 : allPosts.length + 1}`;
}

export function parseBookingDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes("T")) {
    // Has date and time
    return new Date(dateStr);
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export function formatBookingDateOnly(dateStr: string): string {
  const d = parseBookingDate(dateStr);
  return d.toLocaleDateString("it-IT", { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getBookingDayKey(dateStr: string): string {
  if (!dateStr) return "no-date";
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }
  return dateStr; // already YYYY-MM-DD
}

export function formatBookingDayHeader(dayKey: string): string {
  if (dayKey === "no-date") return "Senza Data";
  const d = parseBookingDate(dayKey);
  const formatted = d.toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

