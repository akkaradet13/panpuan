// GPX parsing and route stats. Self-contained (no imports) so scripts/check.mjs can run it with plain node.
export type Pt = { lat: number; lng: number; ele?: number };

const num = (attrs: string, name: string) => Number(attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`))?.[1]);

/** Track points (trkpt), or route points (rtept) when the file has no track. */
export function parseGpx(xml: string): Pt[] {
  for (const tag of ["trkpt", "rtept"]) {
    const re = new RegExp(`<${tag}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/${tag}>)`, "g");
    const pts: Pt[] = [];
    for (const m of xml.matchAll(re)) {
      const lat = num(m[1], "lat");
      const lng = num(m[1], "lon");
      if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) continue;
      const ele = Number(m[2]?.match(/<ele>\s*([-+\d.eE]+)\s*<\/ele>/)?.[1]);
      pts.push(Number.isFinite(ele) ? { lat, lng, ele } : { lat, lng });
    }
    if (pts.length >= 2) return pts;
  }
  return [];
}

/** Great-circle distance in km. */
export function haversineKm(a: Pt, b: Pt) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function distanceKm(pts: Pt[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}

/** Total climb in metres, ignoring GPS noise smaller than 3 m. Null when the file has no elevation. */
export function elevationGainM(pts: Pt[]) {
  const eles = pts.map((p) => p.ele).filter((e): e is number => e !== undefined);
  if (eles.length < 2) return null;
  let gain = 0, ref = eles[0];
  for (const e of eles) {
    if (e < ref) ref = e;
    else if (e - ref >= 3) { gain += e - ref; ref = e; }
  }
  return Math.round(gain);
}

/** Ramer–Douglas–Peucker in metres (equirectangular projection; fine at city scale). */
export function simplify(pts: Pt[], toleranceM: number): Pt[] {
  if (pts.length < 3) return pts;
  const k = 111_320, cos = Math.cos((pts[0].lat * Math.PI) / 180);
  const xy = pts.map((p) => [p.lng * k * cos, p.lat * k]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    const [x1, y1] = xy[s], [x2, y2] = xy[e];
    const len = Math.hypot(x2 - x1, y2 - y1);
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      // Closed loops (start ≈ end): measure distance to the start point instead of to a zero-length line.
      const dist = len < 1
        ? Math.hypot(xy[i][0] - x1, xy[i][1] - y1)
        : Math.abs((y2 - y1) * xy[i][0] - (x2 - x1) * xy[i][1] + x2 * y1 - y2 * x1) / len;
      if (dist > max) { max = dist; idx = i; }
    }
    if (max > toleranceM) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Google encoded polyline (precision 5). */
export function encodePolyline(pts: Pt[]) {
  let out = "", pLat = 0, pLng = 0;
  const enc = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1, s = "";
    while (n >= 0x20) { s += String.fromCharCode((0x20 | (n & 0x1f)) + 63); n >>= 5; }
    return s + String.fromCharCode(n + 63);
  };
  for (const p of pts) {
    const lat = Math.round(p.lat * 1e5), lng = Math.round(p.lng * 1e5);
    out += enc(lat - pLat) + enc(lng - pLng);
    pLat = lat; pLng = lng;
  }
  return out;
}

/** Everything the routes doc needs from a GPX file. Polyline is capped at ~1500 points. */
export function gpxStats(xml: string) {
  const pts = parseGpx(xml);
  if (pts.length < 2) return null;
  let line = simplify(pts, 10);
  for (let tol = 20; line.length > 1500; tol *= 2) line = simplify(pts, tol);
  return {
    distance_km: Math.round(distanceKm(pts) * 10) / 10,
    elevation_gain_m: elevationGainM(pts),
    start: { lat: pts[0].lat, lng: pts[0].lng },
    polyline: encodePolyline(line),
  };
}
