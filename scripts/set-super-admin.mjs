// Grants or removes the super_admin custom claim. The user must sign out and in again (or wait ≤ 1 h) to get it.
//   node --env-file=.env.local scripts/set-super-admin.mjs someone@gmail.com
//   node --env-file=.env.local scripts/set-super-admin.mjs someone@gmail.com --remove
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [who, flag] = process.argv.slice(2);
if (!who) throw new Error("usage: set-super-admin.mjs <email|uid> [--remove]");
const auth = getAuth(initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }));
const user = who.includes("@") ? await auth.getUserByEmail(who) : await auth.getUser(who);
const claims = { ...user.customClaims };
if (flag === "--remove") delete claims.super_admin;
else claims.super_admin = true;
await auth.setCustomUserClaims(user.uid, claims);
console.log(`${user.email ?? user.uid}: super_admin = ${claims.super_admin === true}`);
