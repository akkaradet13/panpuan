"use client";

import { useState } from "react";
import { Icon } from "@/modules/core/Icon";
import { RideCard } from "./RideCard";
import { PACE_LABEL, paceLevel, type PaceLevel, type Ride } from "./types";

/** District pills (only districts that have rides) + pace filter over an already-loaded list. */
export function RideBrowser({ rides, empty }: { rides: Ride[]; empty: string }) {
  const [district, setDistrict] = useState("");
  const [pace, setPace] = useState("");
  const districts = [...new Set(rides.map((r) => r.club_district).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
  const shown = rides.filter((r) => (!district || r.club_district === district) && (!pace || paceLevel(r) === pace));

  return (
    <div className="stack">
      {rides.length > 0 && (
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="pills grow" role="group" aria-label="กรองตามอำเภอ">
            <span className="muted small row" style={{ gap: 4, flex: "none" }}>
              <Icon name="pin" size={14} /> อำเภอ:
            </span>
            <button className={`pill${district === "" ? " active" : ""}`} onClick={() => setDistrict("")}>
              ทั้งหมด
            </button>
            {districts.map((d) => (
              <button key={d} className={`pill${district === d ? " active" : ""}`} onClick={() => setDistrict(d)}>
                {d}
              </button>
            ))}
          </div>
          <label className="row" style={{ gap: 6, flexDirection: "row", fontSize: "0.75rem" }}>
            <span className="muted">ความเร็ว:</span>
            <select value={pace} onChange={(e) => setPace(e.target.value)} style={{ width: "auto", padding: "6px 10px", fontSize: "0.75rem" }}>
              <option value="">ทุกระดับ</option>
              {(Object.keys(PACE_LABEL) as PaceLevel[]).map((p) => (
                <option key={p} value={p}>
                  {PACE_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: "1.8rem" }}>🚴💨</div>
          <strong>{rides.length ? "ยังไม่มีทริปในเงื่อนไขที่เลือก" : empty}</strong>
        </div>
      ) : (
        <div className="grid-2">
          {shown.map((r) => (
            <RideCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
