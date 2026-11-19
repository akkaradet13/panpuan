// Creates/updates the Cloud Scheduler job that calls POST /api/notify/reminders every 15 minutes.
// No gcloud needed: uses the Cloud Scheduler REST API with the service account in GOOGLE_APPLICATION_CREDENTIALS
// (needs role "Cloud Scheduler Admin"). The secret must equal the App Hosting secret `cron-secret`.
//   CRON_SECRET=... node --env-file=.env.local scripts/setup-scheduler.mjs https://panpuan.net
import { applicationDefault } from "firebase-admin/app";

const base = process.argv[2];
const secret = process.env.CRON_SECRET;
const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const region = process.env.SCHEDULER_REGION ?? "asia-southeast1";
if (!base || !secret || secret.length < 16) throw new Error("usage: CRON_SECRET=<16+ chars> node --env-file=.env.local scripts/setup-scheduler.mjs <site url>");

const name = `projects/${project}/locations/${region}/jobs/panpuan-reminders`;
const job = {
  name,
  description: "PanPuan: ride reminders (d1/h1)",
  schedule: "*/15 * * * *",
  timeZone: "Asia/Bangkok",
  httpTarget: {
    uri: `${base.replace(/\/$/, "")}/api/notify/reminders`,
    httpMethod: "POST",
    headers: { "x-cron-secret": secret, "content-type": "application/json" },
    body: Buffer.from("{}").toString("base64"),
  },
  retryConfig: { retryCount: 1 },
};

const { access_token } = await applicationDefault().getAccessToken();
const api = (url, init) =>
  fetch(`https://cloudscheduler.googleapis.com/v1/${url}`, { ...init, headers: { authorization: `Bearer ${access_token}`, "content-type": "application/json" } });

// Create; if it already exists (409), update it. (PATCH on a missing job returns 403, not 404.)
let res = await api(`projects/${project}/locations/${region}/jobs`, { method: "POST", body: JSON.stringify(job) });
if (res.status === 409) res = await api(`${name}?updateMask=schedule,timeZone,httpTarget,description,retryConfig`, { method: "PATCH", body: JSON.stringify(job) });
const out = await res.json();
if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(out.error ?? out)}`);
console.log("scheduler job ready:", out.name, out.schedule, out.httpTarget.uri);
