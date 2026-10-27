// "2 hours ago" within a week, a plain date after that. Bare ISO dates
// ("2026-07-03") are read as local midnight, not UTC, so they don't show
// as the day before for anyone west of Greenwich.

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const plain = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function parseDate(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
}

export function formatUpdated(iso: string, now = Date.now()): string {
  const date = parseDate(iso);
  // A bare date has no time to be "19 hours ago" from; count whole days.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const days = Math.round((date.getTime() - today.getTime()) / 86400000);
    return Math.abs(days) >= 7 ? plain.format(date) : rtf.format(days, "day");
  }
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs >= 7 * 86400) return plain.format(date);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}
