// Applies the Storage lifecycle rule (delete leftover uploads/ after 1 day). No gcloud needed.
//   node --env-file=.env.local scripts/setup-storage.mjs
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!bucketName) throw new Error("Run with --env-file=.env.local");

const lifecycle = JSON.parse(readFileSync(new URL("./storage-lifecycle.json", import.meta.url), "utf8"));
const bucket = getStorage(initializeApp()).bucket(bucketName);
await bucket.setMetadata({ lifecycle });
console.log("lifecycle:", JSON.stringify((await bucket.getMetadata())[0].lifecycle));
