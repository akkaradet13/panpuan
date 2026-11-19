// iCalendar feed + Google Calendar link builders. No imports so scripts/check.mjs can run it with plain node.
export type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  location?: string;
  description?: string;
  url?: string;
  cancelled?: boolean;
  updated?: Date;
};

/** 20261121T223000Z */
export const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Escape TEXT values (RFC 5545 §3.3.11). */
export const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Fold lines longer than 75 octets without splitting a multi-byte (Thai) character. */
export function icsFold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "", bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (bytes + n > limit) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(calName: string, events: IcsEvent[], now = new Date()) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PanPuan//panpuan.net//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calName)}`,
    "X-WR-TIMEZONE:Asia/Bangkok",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `SUMMARY:${icsEscape((e.cancelled ? "[ยกเลิก] " : "") + e.title)}`,
      `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    );
    if (e.updated) lines.push(`LAST-MODIFIED:${icsDate(e.updated)}`);
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

/** Estimated ride length: distance at the average pace + 30 min of stops, rounded up to 30 min; 3 h if unknown. */
export function rideHours(distanceKm: number | null, paceMin: number, paceMax: number) {
  if (!distanceKm) return 3;
  return Math.ceil((distanceKm / ((paceMin + paceMax) / 2) + 0.5) * 2) / 2;
}

/** "Add to Google Calendar" link (no API scope needed). */
export function gcalUrl(e: { title: string; start: Date; end: Date; location?: string; details?: string }) {
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${icsDate(e.start)}/${icsDate(e.end)}` });
  if (e.location) p.set("location", e.location);
  if (e.details) p.set("details", e.details);
  return `https://calendar.google.com/calendar/render?${p}`;
}
