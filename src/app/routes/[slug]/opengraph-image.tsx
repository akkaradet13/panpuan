import { ImageResponse } from "next/og";
import { decodePolyline } from "@/modules/core/polyline";
import { decodeParam } from "@/modules/core/JsonLd";
import { getRouteBySlug } from "@/modules/routes/routes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "แผนที่เส้นทางปั่นจักรยาน";

// Route shape drawn from the stored polyline (no map tiles). Text is ASCII only: the default OG font has no Thai glyphs.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const r = await getRouteBySlug(decodeParam((await params).slug));
  const pts = r ? decodePolyline(r.polyline) : [];

  let path = "";
  if (pts.length > 1) {
    const lats = pts.map((p) => p[0]), lngs = pts.map((p) => p[1]);
    const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const w = (maxLng - minLng) * cos || 1e-9, h = maxLat - minLat || 1e-9;
    const box = { x: 520, y: 40, w: 640, h: 550 };
    const s = Math.min(box.w / w, box.h / h);
    const ox = box.x + (box.w - w * s) / 2, oy = box.y + (box.h - h * s) / 2;
    path = pts.map(([lat, lng], i) => `${i ? "L" : "M"}${(ox + (lng - minLng) * cos * s).toFixed(1)} ${(oy + (maxLat - lat) * s).toFixed(1)}`).join(" ");
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#22272d", color: "#fff", position: "relative" }}>
        <svg width="1200" height="630" style={{ position: "absolute", top: 0, left: 0 }}>
          {path && <path d={path} fill="none" stroke="#ff6a00" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 60, width: 520 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#8fd320" }}>PanPuan</div>
          {r && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 96, fontWeight: 800 }}>{`${r.distance_km} km`}</div>
              {r.elevation_gain_m ? <div style={{ fontSize: 44, color: "#ccc" }}>{`+${r.elevation_gain_m} m`}</div> : null}
            </div>
          )}
          <div style={{ fontSize: 30, color: "#aaa" }}>Ubon Cycling Community</div>
        </div>
      </div>
    ),
    size,
  );
}
