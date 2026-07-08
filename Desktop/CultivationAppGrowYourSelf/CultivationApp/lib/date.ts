/** Local calendar day YYYY-MM-DD (device timezone). */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalDateKey(): string {
  return toLocalDateKey(new Date());
}

/** End of local calendar day as ISO 8601 (for task due dates). */
export function endOfLocalDayISO(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/** Start of local calendar day as ISO 8601. */
export function startOfLocalDayISO(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

export function isSameLocalDay(isoA: string, isoB: string): boolean {
  return toLocalDateKey(new Date(isoA)) === toLocalDateKey(new Date(isoB));
}

export function isTaskDueOnLocalDay(dueIso: string, dateKey: string): boolean {
  return toLocalDateKey(new Date(dueIso)) === dateKey;
}
