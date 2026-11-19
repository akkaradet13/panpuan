// Self-checks for pure logic (GPX, polyline, Thai date/time). Run: node scripts/check.mjs
import assert from "node:assert/strict";
import { decodePolyline } from "../src/modules/core/polyline.ts";
import { bangkokParts, bangkokToUtc, dayLabel, fmtDate, fmtShortDate, fmtTime, nextDays } from "../src/modules/core/format.ts";
import { elevationGainM, encodePolyline, gpxStats, parseGpx, simplify } from "../src/modules/routes/gpx.ts";
import { buildIcs, gcalUrl, icsEscape, icsFold, rideHours } from "../src/modules/rides/ics.ts";

// polyline round trip (Google's documented example)
assert.equal(encodePolyline([{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }, { lat: 43.252, lng: -126.453 }]), "_p~iF~ps|U_ulLnnqC_mqNvxq`@");
assert.deepEqual(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@"), [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);

// GPX: attribute order, self-closing points, elevation, rtept fallback
const gpx = `<?xml version="1.0"?><gpx><trk><trkseg>
  <trkpt lat="15.2448" lon="104.8473"><ele>120</ele></trkpt>
  <trkpt lon="104.8573" lat='15.2448'><ele>121</ele></trkpt>
  <trkpt lat="15.2548" lon="104.8573"><ele>130</ele></trkpt>
  <trkpt lat="15.2548" lon="104.8673"/>
</trkseg></trk></gpx>`;
const pts = parseGpx(gpx);
assert.equal(pts.length, 4);
assert.equal(pts[1].lng, 104.8573);
assert.equal(pts[3].ele, undefined);
assert.equal(parseGpx(`<gpx><rte><rtept lat="1" lon="2"/><rtept lat="1.1" lon="2"/></rte></gpx>`).length, 2);
assert.equal(parseGpx("<gpx></gpx>").length, 0);
const s = gpxStats(gpx);
assert.equal(s?.distance_km, 3.3); // 1.073 + 1.112 + 1.073 km, rounded to 0.1
assert.equal(s.elevation_gain_m, 10); // 1 m noise ignored, then +10 from 120
assert.equal(elevationGainM([{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }]), null);

// simplify keeps endpoints and drops collinear points
const straight = Array.from({ length: 50 }, (_, i) => ({ lat: 15, lng: 104 + i * 0.001 }));
assert.equal(simplify(straight, 5).length, 2);
// closed loop (start == end) must keep its shape, not collapse to 2 points
const loop = Array.from({ length: 400 }, (_, i) => { const a = (i / 399) * 2 * Math.PI; return { lat: 15.24 + 0.03 * Math.sin(a), lng: 104.85 + 0.03 * Math.cos(a) }; });
assert.ok(simplify(loop, 10).length > 20, `loop kept ${simplify(loop, 10).length} points`);

// Thai 24h time and Buddhist-era dates in Bangkok
const d = bangkokToUtc("2026-11-21", 5, 30);
assert.equal(d.toISOString(), "2026-11-20T22:30:00.000Z");
assert.equal(fmtTime(d), "05:30");
assert.equal(fmtDate(d), "เสาร์ 21 พ.ย. 2569");
assert.equal(dayLabel(d, new Date("2026-11-20T03:00:00Z")), "พรุ่งนี้ · เสาร์ 21 พ.ย. 2569");
assert.deepEqual(bangkokParts(d), { day: "2026-11-21", hour: 5, minute: 30 });
assert.equal(fmtTime(bangkokToUtc("2026-11-21", 18, 0)), "18:00");
assert.equal(fmtShortDate(d), "ส. 21 พ.ย.");
assert.deepEqual(nextDays(2, new Date("2026-11-20T18:00:00Z")), [{ key: "2026-11-21", w: "ส.", d: 21 }, { key: "2026-11-22", w: "อา.", d: 22 }]);

// ICS: escaping, UTF-8-safe folding, cancelled events, ride duration, Google Calendar link
assert.equal(icsEscape("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
const longThai = "SUMMARY:" + "ปั่นจักรยานริมโขง".repeat(10);
const folded = icsFold(longThai);
for (const l of folded.split("\r\n")) assert.ok(new TextEncoder().encode(l).length <= 75, "line within 75 octets");
assert.equal(folded.split("\r\n ").join(""), longThai, "unfolding restores the line");
const ics = buildIcs("ทดสอบ", [{ uid: "r1@panpuan.net", start: d, end: new Date(d.getTime() + 3 * 3600e3), title: "ปั่นเช้า", cancelled: true }], new Date(0));
assert.ok(ics.includes("DTSTART:20261120T223000Z\r\n"));
assert.ok(ics.includes("STATUS:CANCELLED") && ics.includes("SUMMARY:[ยกเลิก] ปั่นเช้า"));
assert.ok(ics.endsWith("END:VCALENDAR\r\n") && !/[^\r]\n/.test(ics), "CRLF only");
assert.equal(rideHours(null, 20, 25), 3);
assert.equal(rideHours(45, 20, 25), 2.5); // 2h + 0.5h stops
assert.ok(gcalUrl({ title: "ปั่น", start: d, end: d }).includes("dates=20261120T223000Z%2F20261120T223000Z"));

console.log("all checks passed");
