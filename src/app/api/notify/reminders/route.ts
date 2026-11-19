import { timingSafeEqual } from "node:crypto";
import { fmtTime } from "@/modules/core/format";
import { handle, HttpError } from "@/modules/core/http";
import { notifyUsers } from "@/modules/notify/notify";
import { goingUids, ridesStartingBetween } from "@/modules/rides/rides";

const H = 3600_000;

function checkSecret(req: Request) {
  const want = process.env.CRON_SECRET ?? "";
  const got = req.headers.get("x-cron-secret") ?? "";
  if (want.length < 16 || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    throw new HttpError(401, "unauthorized");
  }
}

// POST /api/notify/reminders — called by Cloud Scheduler every 15 min (header x-cron-secret).
// Only looks at rides entering the d1 window (22–24 h ahead) or the h1 window (≤ 60 min ahead) to keep reads low;
// notify_log makes repeated/late runs safe.
export function POST(req: Request) {
  return handle(async () => {
    checkSecret(req);
    const now = new Date();
    const [soon, tomorrow] = await Promise.all([
      ridesStartingBetween(now, new Date(now.getTime() + H)),
      ridesStartingBetween(new Date(now.getTime() + 22 * H), new Date(now.getTime() + 24 * H)),
    ]);

    const jobs = [
      ...soon.map((r) => ({ r, kind: "h1" as const })),
      // d1 is skipped for rides created less than 24 h before they start
      ...tomorrow.filter((r) => r.start.getTime() - r.created.getTime() >= 24 * H).map((r) => ({ r, kind: "d1" as const })),
    ];

    let sent = 0;
    for (const { r, kind } of jobs) {
      const msg =
        kind === "h1"
          ? { title: `⏰ อีกไม่ถึงชั่วโมงออกปั่น: ${r.title}`, body: `${fmtTime(r.start)} น. ที่ ${r.meet_name}` }
          : { title: `🚲 พรุ่งนี้ปั่น: ${r.title}`, body: `เจอกัน ${fmtTime(r.start)} น. ที่ ${r.meet_name}` };
      const res = await notifyUsers(await goingUids(r.id), { ...msg, url: `/rides/${r.id}`, tag: `ride-${r.id}` }, {
        pref: "ride_reminder",
        dedupe: { rideId: r.id, kind, start: r.start },
      });
      sent += res.sent;
    }
    return { rides: jobs.length, sent };
  });
}
