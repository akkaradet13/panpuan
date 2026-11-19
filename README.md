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

## ทดสอบ API

ผู้ใช้ทดสอบ `claude-test` (ชื่อ "Claude ทดสอบ") มีอยู่ใน dev project ใช้สคริปต์นี้ขอ ID token:

```bash
node --env-file=.env.local scripts/dev-token.mjs
```

## ตั้ง super admin

ตั้ง custom claim `super_admin: true` ฝั่งเซิร์ฟเวอร์ (สคริปต์จะเพิ่มพร้อมระบบ super admin ใน Phase 1)
