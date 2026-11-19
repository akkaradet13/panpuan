"use client";

import { useState } from "react";
import { upcomingDays } from "./format";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/**
 * Thai date + 24h time as plain selects (no <input type="date|time">: those show AM/PM and
 * Gregorian years on many phones). Submits form fields `day` (YYYY-MM-DD, Bangkok), `hour`, `minute`.
 */
export function DateTimeSelect({ day, hour = 6, minute = 0, days = 90 }: { day?: string; hour?: number; minute?: number; days?: number }) {
  const [options] = useState(() => upcomingDays(days));
  return (
    <div className="row">
      <label className="grow">
        วัน
        <select name="day" required defaultValue={day ?? ""}>
          <option value="" disabled>
            เลือกวัน
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        เวลา
        <span className="row time">
          <select name="hour" aria-label="ชั่วโมง" defaultValue={hour}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {pad(h)}
              </option>
            ))}
          </select>
          :
          <select name="minute" aria-label="นาที" defaultValue={minute - (minute % 5)}>
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {pad(m)}
              </option>
            ))}
          </select>
          น.
        </span>
      </label>
    </div>
  );
}
