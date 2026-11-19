// Prints a Firebase ID token for Claude's test user (dev project only), for calling the API in tests:
//   node --env-file=.env.local scripts/dev-token.mjs
//   curl -H "authorization: Bearer <token>" http://localhost:3000/api/me
// The user "claude-test" ("Claude ทดสอบ") is created on first run and kept for future tests.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const UID = "claude-test";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!projectId || !apiKey) throw new Error("Run with --env-file=.env.local");

const auth = getAuth(initializeApp({ projectId }));
await auth.getUser(UID).catch(() => auth.createUser({ uid: UID, displayName: "Claude ทดสอบ" }));

const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ token: await auth.createCustomToken(UID), returnSecureToken: true }),
});
const body = await res.json();
if (!body.idToken) throw new Error(JSON.stringify(body.error));
console.log(body.idToken);
