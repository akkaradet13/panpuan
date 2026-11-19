"use client";

import Link from "next/link";
import { useState } from "react";
import { DISTRICTS } from "@/modules/core/districts";
import { DIFFICULTY, SURFACE, type Difficulty, type RouteSummary } from "./types";

const DISTANCES = [
  { value: "", label: "ทุกระยะ" },
  { value: "0-30", label: "ไม่เกิน 30 กม." },
  { value: "30-60", label: "30–60 กม." },
  { value: "60-100", label: "60–100 กม." },
  { value: "100-9999", label: "100 กม. ขึ้นไป" },
];

/** Client-side filtering: the whole province is at most a few hundred routes, and the page stays ISR-cached. */
export function RouteBrowser({ routes, fixedDistrict }: { routes: RouteSummary[]; fixedDistrict?: string }) {
  const [district, setDistrict] = useState(fixedDistrict ?? "");
  const [distance, setDistance] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [min, max] = distance ? distance.split("-").map(Number) : [0, Infinity];
  const shown = routes.filter(
    (r) => (!district || r.district === district) && r.distance_km >= min && r.distance_km < max && (!difficulty || r.difficulty === difficulty),
  );

  return (
    <div className="stack">
      <div className="filters">
        {!fixedDistrict && (
          <select aria-label="อำเภอ" value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">ทุกอำเภอ</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <select aria-label="ระยะทาง" value={distance} onChange={(e) => setDistance(e.target.value)}>
          {DISTANCES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select aria-label="ความยาก" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">ทุกระดับ</option>
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY[d]}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="muted">ยังไม่มีเส้นทางที่ตรงกับตัวกรอง</p>
      ) : (
        <ul className="list">
          {shown.map((r) => (
            <li key={r.id}>
              <RouteCard r={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RouteCard({ r }: { r: RouteSummary }) {
  return (
    <Link href={`/routes/${r.slug}`} className="card list-item">
      <strong>{r.name}</strong>
      {r.status === "unverified" && <span className="badge">ยังไม่ยืนยัน</span>}
      <span className="muted">
        {r.distance_km} กม.{r.elevation_gain_m ? ` · ขึ้น ${r.elevation_gain_m} ม.` : ""} · {DIFFICULTY[r.difficulty]} · {SURFACE[r.surface]} · อ.{r.district}
        {r.rating_count > 0 && ` · ★ ${r.rating_avg.toFixed(1)} (${r.rating_count})`}
      </span>
    </Link>
  );
}
