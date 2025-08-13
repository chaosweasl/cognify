export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, options);
}
