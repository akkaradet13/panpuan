# ปั่นป่วน (PanPuan)

เว็บศูนย์รวมนัดปั่นและเส้นทางปั่นจักรยานในอุบลราชธานี — https://panpuan.net
Next.js 16 + Firebase (Firestore, Auth, Storage, FCM) บน Firebase App Hosting

รายละเอียดการออกแบบทั้งหมดอยู่ใน [CLAUDE.md](CLAUDE.md)

## เครื่องมือที่ต้องมี

- Node.js 22+
- Firebase CLI: `npm i -g firebase-tools` แล้ว `firebase login`

## รันบนเครื่อง

```bash
npm install
cp .env.local.example .env.local   # กรอกค่าจาก Firebase console และ path ของ service account (dev)
npm run dev                         # http://localhost:3000
```

## ตั้ง Firebase project ใหม่ (ทำครั้งเดียวต่อ project)

1. สร้าง project บน Firebase console, เปิด Blaze plan และตั้ง budget alert
2. เปิด Firestore, Authentication (Google), Storage, Cloud Messaging
3. เพิ่ม Web app แล้วคัดลอก config ไปใส่ `.env.local` และ `apphosting.yaml`
4. เพิ่ม project ใน `.firebaserc` หรือ `firebase use --add`
5. Deploy rules, indexes และ TTL policy: `firebase deploy --only firestore,storage`
6. ตั้ง lifecycle ของ Storage: `node --env-file=.env.local scripts/setup-storage.mjs`
7. สร้าง App Hosting backend เชื่อมกับ repo นี้ (branch `main`): `firebase apphosting:backends:create`
   หลังจากนั้น **push ขึ้น `main` = deploy อัตโนมัติ**
8. Authentication → Settings → Authorized domains: เพิ่มโดเมน `*.hosted.app` ของ backend และ panpuan.net
9. เชื่อมโดเมน panpuan.net ใน App Hosting
10. **เตือนก่อนทริป (Cloud Scheduler)**
    - สุ่ม secret ยาว ≥ 16 ตัวใส่ `.env.local` เป็น `CRON_SECRET=...`
    - เก็บใน Secret Manager: `firebase apphosting:secrets:set cron-secret` (ใส่ค่าเดียวกัน) แล้ว
      `firebase apphosting:secrets:grantaccess cron-secret --backend <backend>`
    - เปิด Cloud Scheduler API และให้ service account ใน `.env.local` มี role **Cloud Scheduler Admin**
    - สร้างงาน (ทุก 15 นาที): `node --env-file=.env.local scripts/setup-scheduler.mjs https://<โดเมนเว็บ>`
      รันซ้ำได้ (อัปเดตงานเดิม) ต้องรันใหม่เมื่อเปลี่ยนโดเมนหรือ secret

## ตั้ง super admin

```bash
node --env-file=.env.local scripts/set-super-admin.mjs someone@gmail.com           # เพิ่ม
node --env-file=.env.local scripts/set-super-admin.mjs someone@gmail.com --remove  # ถอด
```
ผู้ใช้ต้องออกจากระบบแล้วเข้าใหม่ (หรือรอไม่เกิน 1 ชม.) แล้วจะเห็นปุ่ม "คิวยืนยัน" ในหน้าโปรไฟล์ (`/admin`)

## ทดสอบ

```bash
node scripts/check.mjs                                 # ตรรกะล้วน: GPX, polyline, วันเวลาไทย, ICS
node --env-file=.env.local scripts/dev-token.mjs       # ID token ของผู้ใช้ทดสอบ claude-test ไว้เรียก API
```
การแจ้งเตือนจริงต้องทดสอบบนมือถือ (Playwright subscribe push ไม่ได้)
