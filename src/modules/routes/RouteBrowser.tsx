"use client";

import Link from "next/link";
import { useState } from "react";
import { DISTRICTS } from "@/modules/core/districts";
import { Icon } from "@/modules/core/Icon";
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
          <option value="">ทุกระดับความยาก</option>
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY[d]}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="empty">ยังไม่มีเส้นทางที่ตรงกับตัวกรอง</p>
      ) : (
        <div className="grid-3">
          {shown.map((r) => (
            <RouteCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RouteCard({ r }: { r: RouteSummary }) {
  return (
    <Link href={`/routes/${r.slug}`} className="card route-card">
      <div className="route-thumb">
        {r.thumb && (
          <svg viewBox="0 0 280 95" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path d={r.thumb.d} fill="none" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
            <path d={r.thumb.d} fill="none" stroke="#8CE600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={r.thumb.x} cy={r.thumb.y} r="4" fill="#FF6B00" />
          </svg>
        )}
        <span className="thumb-tag l">📍 อ.{r.district}</span>
        {r.rating_count > 0 && (
          <span className="thumb-tag r">
            ★ {r.rating_avg.toFixed(1)} ({r.rating_count})
          </span>
        )}
      </div>
      <div className="route-body">
        <h3>
          {r.name}
          {r.status === "unverified" && <span className="badge badge-warn">ยังไม่ยืนยัน</span>}
        </h3>
        <div className="chips">
          <span className="chip" style={{ color: "var(--orange)", fontWeight: 700 }}>
            {r.distance_km} km
          </span>
          {r.elevation_gain_m ? <span className="chip">⛰️ +{r.elevation_gain_m} m</span> : null}
          <span className="chip">{DIFFICULTY[r.difficulty]}</span>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          พื้นผิว: {SURFACE[r.surface]}
        </p>
        <span className="route-dl">
          <Icon name="download" /> ดู & ดาวน์โหลด GPX
        </span>
      </div>
    </Link>
  );
}
