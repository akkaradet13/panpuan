// Thai date/time helpers. Always 24h, always Asia/Bangkok (UTC+7, no DST). No imports so scripts/check.mjs can run it.
const TZ = "Asia/Bangkok";
const BKK_MS = 7 * 3600_000;

const timeFmt = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateFmt = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, weekday: "long", day: "numeric", month: "short", year: "numeric" });

/** "05:30" */
export const fmtTime = (d: Date) => timeFmt.format(d);

/** "เสาร์ 21 พ.ย. 2569" — assembled from parts because ICU versions differ in filler words ("วัน…ที่"). */
export function fmtDate(d: Date) {
  const p = Object.fromEntries(dateFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.weekday.replace(/^วัน/, "")} ${p.day} ${p.month} ${p.year}`;
}

/** Bangkok calendar day as "YYYY-MM-DD" */
export const dayKey = (d: Date) => new Date(d.getTime() + BKK_MS).toISOString().slice(0, 10);

/** "พรุ่งนี้ · เสาร์ 21 พ.ย. 2569" */
export function dayLabel(d: Date, now = new Date()) {
  const diff = Math.round((Date.parse(dayKey(d)) - Date.parse(dayKey(now))) / 86_400_000);
  const rel = diff === 0 ? "วันนี้ · " : diff === 1 ? "พรุ่งนี้ · " : "";
  return rel + fmtDate(d);
}

/** "เสาร์ 21 พ.ย. 2569 · 05:30 น." */
export const fmtDateTime = (d: Date) => `${fmtDate(d)} · ${fmtTime(d)} น.`;

/** Bangkok wall-clock day + hour/minute -> UTC Date */
export function bangkokToUtc(day: string, hour: number, minute: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - BKK_MS);
}

/** Bangkok wall-clock parts of a Date */
export function bangkokParts(d: Date) {
  const s = new Date(d.getTime() + BKK_MS).toISOString();
  return { day: s.slice(0, 10), hour: Number(s.slice(11, 13)), minute: Number(s.slice(14, 16)) };
}

/** Options for a Thai date <select>: today + the next n-1 days. */
export function upcomingDays(n: number, now = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getTime() + i * 86_400_000);
    return { value: dayKey(d), label: dayLabel(d, now) };
  });
}
