import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { adminDb } from "@/modules/core/firebase/admin";
import { HttpError } from "@/modules/core/http";

const devices = adminDb.collection("notify_devices");
const prefsCol = adminDb.collection("notify_prefs");
const logCol = adminDb.collection("notify_log");

export const DEFAULT_PREFS = { ride_reminder: true, ride_changes: true, club_new_ride: false };
export type Prefs = typeof DEFAULT_PREFS;
export type PrefKey = keyof Prefs;

// ---------- prefs ----------

export async function getPrefs(uid: string): Promise<Prefs> {
  return { ...DEFAULT_PREFS, ...(await prefsCol.doc(uid).get()).data() } as Prefs;
}

export async function setPrefs(uid: string, body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const update: Partial<Prefs> = {};
  for (const k of Object.keys(DEFAULT_PREFS) as PrefKey[]) if (typeof b[k] === "boolean") update[k] = b[k] as boolean;
  await prefsCol.doc(uid).set(update, { merge: true });
  return getPrefs(uid);
}

// ---------- devices ----------

export async function registerDevice(uid: string, body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const id = String(b.device_id ?? "");
  const token = String(b.token ?? "");
  const platform = String(b.platform ?? "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) throw new HttpError(400, "device_id ไม่ถูกต้อง");
  if (token.length < 20 || token.length > 4096) throw new HttpError(400, "token ไม่ถูกต้อง");
  if (!["ios", "android", "desktop"].includes(platform)) throw new HttpError(400, "platform ไม่ถูกต้อง");
  await devices.doc(id).set({ uid, fcm_token: token, platform, updated_at: FieldValue.serverTimestamp() });
}

export async function listDevices(uid: string) {
  const snap = await devices.where("uid", "==", uid).get();
  return snap.docs.map((d) => ({ id: d.id, platform: d.get("platform") as string, updated_at: d.get("updated_at")?.toDate().toISOString() ?? "" }));
}

export async function removeDevice(uid: string, id: string) {
  const ref = devices.doc(id);
  const d = await ref.get();
  if (d.exists && d.get("uid") === uid) await ref.delete();
}

// ---------- sending ----------

export type PushMessage = { title: string; body: string; url: string; tag: string };
export type NotifyKind = "d1" | "h1" | "cancel" | "postpone" | "promoted" | "new";

const DEAD_TOKEN = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/**
 * Pushes to every device of the given users who have `pref` on.
 * With `dedupe`, each user gets it at most once: notify_log/{rideId}_{uid}_{kind}_{startEpoch} is create()d first
 * (fails if it exists), so repeated or overlapping scheduler runs are harmless. Dead tokens are deleted.
 */
export async function notifyUsers(
  uids: string[],
  msg: PushMessage,
  opts: { pref: PrefKey; dedupe?: { rideId: string; kind: NotifyKind; start: Date } },
) {
  const unique = [...new Set(uids)];
  if (!unique.length) return { sent: 0, failed: 0, removed: 0 };

  const prefs = await adminDb.getAll(...unique.map((u) => prefsCol.doc(u)));
  let targets = unique.filter((_, i) => (prefs[i].get(opts.pref) ?? DEFAULT_PREFS[opts.pref]) !== false);

  if (opts.dedupe) {
    const { rideId, kind, start } = opts.dedupe;
    const epoch = Math.floor(start.getTime() / 1000);
    const expire_at = Timestamp.fromMillis(Date.now() + 30 * 86_400_000); // TTL policy deletes it
    const created = await Promise.all(
      targets.map((uid) =>
        logCol.doc(`${rideId}_${uid}_${kind}_${epoch}`).create({ kind, sent_at: FieldValue.serverTimestamp(), expire_at }).then(() => true, () => false),
      ),
    );
    targets = targets.filter((_, i) => created[i]);
  }

  const devs = [];
  for (let i = 0; i < targets.length; i += 30) {
    devs.push(...(await devices.where("uid", "in", targets.slice(i, i + 30)).get()).docs);
  }
  if (!devs.length) return { sent: 0, failed: 0, removed: 0 };

  let sent = 0, failed = 0, removed = 0;
  for (let i = 0; i < devs.length; i += 500) {
    const chunk = devs.slice(i, i + 500);
    const res = await getMessaging().sendEach(
      chunk.map((d) => ({ token: d.get("fcm_token"), data: msg, webpush: { headers: { Urgency: "high", TTL: "86400" } } })),
    );
    await Promise.all(
      res.responses.map(async (r, j) => {
        if (r.success) return sent++;
        failed++;
        if (DEAD_TOKEN.has(r.error?.code ?? "")) {
          removed++;
          await chunk[j].ref.delete();
        }
      }),
    );
  }
  return { sent, failed, removed };
}
