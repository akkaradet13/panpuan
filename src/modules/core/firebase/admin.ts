import "server-only";

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Credentials come from Application Default Credentials:
// App Hosting provides them; locally set GOOGLE_APPLICATION_CREDENTIALS to a service account file.
const app =
  getApps()[0] ??
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminBucket = () => getStorage(app).bucket();
