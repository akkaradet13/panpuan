# ปั่นป่วน (PanPuan)

ชื่อเว็บที่เจ้าของเลือก: **ปั่นป่วน** เขียนภาษาอังกฤษว่า **PanPuan**
โดเมน: **panpuan.net** (ใช้ตั้ง `metadataBase`, canonical และ sitemap)
เว็บศูนย์รวม community ปั่นจักรยานใน **จังหวัดอุบลราชธานี** กลุ่มเป้าหมายหลักคือวัยรุ่นและคนรุ่นใหม่

ไฟล์นี้สรุปบริบทและข้อตกลงของโปรเจกต์ เพื่อให้ Claude Code ทำงานต่อได้โดยไม่ต้องถามซ้ำ
สถานะปัจจุบัน (2026-11-19): **Phase 1 กำลังทำ**
- เสร็จ: โครงโปรเจกต์, PWA shell, Login Google (`/login`), หน้าโปรไฟล์ (`/profile`, `GET/PATCH /api/me`)
- เสร็จ: กลุ่ม `/clubs`, `/clubs/new`, `/clubs/[slug]` (slug ไทย, JSON-LD, noindex ถ้ายังไม่ยืนยัน), sitemap
  `/clubs/[slug]/edit` (แอดมินแก้ข้อมูล slug ไม่เปลี่ยน)
  API: `POST /api/clubs`, `PATCH /api/clubs/{id}`, `POST|DELETE /api/clubs/{id}/join`,
  `PATCH /api/clubs/{id}/members/{uid}` (approve/promote/demote/remove)
  ตรรกะอยู่ที่ `src/modules/core/clubs.ts` · error ใน Route Handler ใช้ `HttpError` + `handle()` จาก `core/http.ts`
  เพิ่ม route ใหม่แล้ว `tsc` ฟ้อง `RouteContext`/`PageProps` ให้รัน `npx next typegen` ก่อน
- ยังไม่มีในกลุ่ม: โลโก้กลุ่ม, ปักหมุดจุดนัดบนแผนที่ (รอ Leaflet ตอนทำเส้นทาง)
  เมื่อมี rides: แก้ชื่อกลุ่มแล้วต้องอัปเดต `rides.club_name` ด้วย
- Firebase project: `panpuan-a4f37` (ใช้เป็น dev ยังไม่มี prod) · service account อยู่นอก repo ตาม `.env.local`
- App Hosting backend `panpuan` (asia-southeast1) เชื่อม GitHub: **push ขึ้น `main` = deploy อัตโนมัติ**
  URL: https://panpuan--panpuan-a4f37.asia-southeast1.hosted.app
- rules/indexes/TTL deploy ด้วย `firebase deploy --only firestore,storage` (CLI ใช้ service account ใน `GOOGLE_APPLICATION_CREDENTIALS`)
- ผู้ใช้ทดสอบของ Claude: uid `claude-test` ขอ ID token ด้วย `node --env-file=.env.local scripts/dev-token.mjs`
  ใช้ทดสอบ API ได้โดยไม่ต้อง login Google · กลุ่มทดสอบให้ใช้ชื่อ "กลุ่มทดสอบของ Claude"
- ถัดไป: เส้นทาง (GPX, แผนที่) → ทริป

โปรเจกต์นี้ใช้ stack และแนวทางเดียวกับเว็บ **วัด (Wat)** ของเจ้าของ (Next.js + Firebase App Hosting)
ข้อควรระวังหลายข้อด้านล่างได้มาจากการทำเว็บวัดจริง ให้เชื่อตามนี้ก่อน

## ข้อควรรู้เรื่องชื่อ

"ปั่นป่วน" เป็นคำที่ใช้ทั่วไป (เช่น "ตลาดหุ้นปั่นป่วน") ค้นด้วยชื่ออย่างเดียวจะเจอข่าวก่อน
- ทุกหน้าต้องมี title ที่มีคำขยายเสมอ เช่น "เส้นทางอุบล–โขงเจียม | ปั่นป่วน ปั่นจักรยานอุบล"
  ห้ามใช้ "ปั่นป่วน" หรือ "PanPuan" เดี่ยว ๆ เป็น title
- ใช้ชื่ออังกฤษ **PanPuan** ควบคู่ (ไม่ชนกับคำอื่น) ใน Open Graph, manifest และโลโก้
- ใช้โลโก้และ favicon ที่จำง่ายเป็นตัวสร้างการจดจำ
- โทนข้อความบนเว็บเป็นกันเอง สนุก แต่ไม่ใช้ความหมาย "วุ่นวาย" ในทางลบ

## เป้าหมาย

ทำสิ่งที่กลุ่ม LINE และเพจ Facebook ทำไม่ได้:
1. **ปฏิทินนัดปั่นรวมทุกกลุ่มในอุบล** ลงชื่อร่วมทริปได้ และเตือนก่อนออกปั่น
2. **คลังเส้นทางในอุบล** บนแผนที่ พร้อม GPX ให้ดาวน์โหลดไปใช้กับไมล์
3. (Phase 2) **ติดตามสดระหว่างปั่นแบบ no-drop** ไม่มีใครหลุดกลุ่ม

## สิ่งที่เจ้าของโปรเจกต์ตัดสินใจแล้ว

- เป็น **ศูนย์รวมหลายกลุ่มปั่นในอุบล** (ไม่ใช่เว็บของกลุ่มเดียว)
- เป็น **web app / PWA** (ไม่ทำ native app) กดเพิ่มลงหน้าจอโฮมและรับแจ้งเตือนได้เหมือนเว็บวัด
- ใช้ **Next.js ตัวเดียว** ทำทั้งหน้าเว็บและ API ร่วมกับ **Firebase**, deploy บน **Firebase App Hosting**
- **modular monolith** เหมือนเว็บวัด
- **Login ด้วย Google** (Phase 1) ส่วน LINE Login อยู่ Phase 4
- **เพิ่มทริปลง Google Calendar ได้** (ปุ่มเพิ่ม + ICS feed) ใน Phase 1
- **เรื่อง LINE ทั้งหมด** (LINE Login และ LINE OA แจ้งเตือน) อยู่ Phase 4
- ระบบต้อง **พึ่งตนเองได้** (ดูหัวข้อถัดไป)
- การยืนยันแบบ **เปิดเสรีแต่ติดป้าย** เหมือนเว็บวัด ใช้กับกลุ่มและเส้นทาง

## หลักการ: ระบบพึ่งตนเองได้

ทุกการออกแบบให้ถามว่า "ถ้าไม่มีใครเข้ามาดูเลยหนึ่งเดือน ระบบยังทำงานต่อได้ไหม"

**กลุ่มดูแลตัวเอง**
- ใครก็สร้างกลุ่มได้ แอดมินกลุ่มจัดการสมาชิก ทริป และแต่งตั้งแอดมินร่วมได้เองผ่านหน้าเว็บ
- กลุ่มต้องมีแอดมินอย่างน้อย 1 คนเสมอ และควรมีได้หลายคน
- ไม่มีขั้นตอนไหนที่ต้องให้นักพัฒนาแก้ฐานข้อมูลด้วยมือ

**ระบบเก็บกวาดตัวเอง**
- ทริปที่เลยเวลาเริ่มไปแล้ว 12 ชม. ถือว่าจบ (`done`) ตอนอ่าน ไม่ต้องมีคนกดปิด
- `fcm_token` ที่ส่งไม่สำเร็จให้ลบทิ้งทันที
- บันทึกการแจ้งเตือนและข้อมูลชั่วคราวหมดอายุเอง (Firestore TTL policy)
- งานประจำทุกอย่างเป็นงานอัตโนมัติ (Cloud Scheduler) ไม่ใช่งานที่คนต้องจำ

**ค่าใช้จ่ายไม่ตกกับใครคนเดียว**
- ออกแบบให้อยู่ในโควตาฟรีให้นานที่สุด นับจำนวน read/write ของทุกฟีเจอร์ก่อนสร้าง
- ตั้ง budget alert ไว้ตั้งแต่วันแรก

**ไม่ผูกกับบัญชีหรือความรู้ของคนคนเดียว**
- Repo, Firebase project และโดเมน อยู่ในบัญชีที่มีเจ้าของมากกว่าหนึ่งคน
- `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `database.rules.json`, การตั้งค่า Scheduler,
  TTL policy ของ Firestore (`fieldOverrides` ใน `firestore.indexes.json`) และ lifecycle rule ของ Storage (`scripts/`) อยู่ใน repo
  deploy ผ่าน CI ไม่ตั้งค่าด้วยมือใน console
- README ต้องพาคนใหม่ติดตั้งและ deploy ได้เองโดยไม่ต้องถามใคร

**การยืนยัน (ตัดสินใจแล้ว)**
- ใครก็สร้างกลุ่มหรือเพิ่มเส้นทางได้ และใช้งานได้ทันทีโดยไม่ต้องรออนุมัติ
- ที่ยังไม่ยืนยันแสดงป้าย "ยังไม่ยืนยัน" ทุกที่ที่ชื่อปรากฏ
- **super admin** (มีได้หลายคน) เป็นผู้ยืนยันและระงับ การยืนยันต้องไม่ขวางการใช้งาน
- ระงับแล้ว: หน้า 404 ไม่อยู่ในรายการ และแอดมินของกลุ่มนั้นเพิ่มหรือแก้อะไรไม่ได้ (super admin ยังจัดการได้)

## Modular monolith

กติกาเดียวกับเว็บวัด:
- แต่ละฟีเจอร์อยู่ใน `src/modules/<name>/` มี UI, logic, type และการเข้าถึงข้อมูลครบในตัว
- โมดูลห้าม import ข้ามกันโดยตรง ใช้ได้เฉพาะ `src/modules/core/`
- แต่ละโมดูลเป็นเจ้าของ collection ของตัวเอง ตั้งชื่อขึ้นต้นด้วยชื่อโมดูล โมดูลอื่นห้ามอ่านหรือเขียนตรง
  ข้อมูลของ `core` (เช่น เช็กว่าเป็นแอดมินกลุ่มไหม, กลุ่มถูกระงับไหม) ให้เรียกผ่านฟังก์ชันใน `src/modules/core/` ห้าม query เอง
- รายชื่อ 25 อำเภอในอุบลเป็นค่าคงที่ใน `src/modules/core/districts.ts` ชื่อไทยใช้เป็นทั้งค่า field `district` และ slug ของ `/districts/[district]`
- Route แยกตามโมดูล เช่น `/routes/...`, `/api/rides/...`
- ถ้าโมดูลหนึ่งต้องการข้อมูลอีกโมดูล ให้คัดลอกค่าที่จำเป็นมาเก็บ (denormalize) ตอนเขียน เช่น `rides.route_name`

| โมดูล | หน้าที่ | Collection |
|---|---|---|
| `core` | users, clubs, สมาชิกกลุ่ม, auth, แผนที่, UI กลาง | `users`, `clubs`, `club_members` |
| `routes` | คลังเส้นทาง, GPX, รีวิว | `routes`, `routes_reviews` |
| `rides` | ทริป, ลงชื่อ, ปฏิทิน/ICS | `rides`, `rides_participants` |
| `notify` | PWA, FCM, เตือนตามเวลา | `notify_devices`, `notify_prefs`, `notify_log` |
| `live` (Phase 2) | ติดตามสด, ขอความช่วยเหลือ | RTDB `live/` |
| `places` (Phase 2) | ร้านจักรยาน, จุดแวะ, จุดอันตราย | `places` |

## Tech stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| ฐานข้อมูลหลัก | Cloud Firestore |
| ตำแหน่งสด (Phase 2) | Firebase Realtime Database (เขียนถี่ ถ้าใช้ Firestore จะเปลืองโควตา) |
| ไฟล์ | Cloud Storage (GPX, รูป) |
| Auth | Firebase Auth: Google (Phase 1), LINE ผ่าน custom token (Phase 4) |
| Push notification | Firebase Cloud Messaging (FCM) |
| งานตามเวลา | Cloud Scheduler เรียก Route Handler |
| ฝั่งเซิร์ฟเวอร์ | Route Handlers + `firebase-admin` |
| แผนที่ | `react-leaflet` + OpenStreetMap |
| อ่าน GPX | parse ฝั่งเซิร์ฟเวอร์ตอนอัปโหลด (เลือก lib ที่ดูแลอยู่และเล็ก) |
| Hosting | Firebase App Hosting (`apphosting.yaml`) |

ก่อนเขียนโค้ดให้ตรวจเวอร์ชันล่าสุดและเอกสารปัจจุบันของ Next.js กับ Firebase JS SDK อย่าอิงจากความจำ
เอกสาร Next.js ตรงตามเวอร์ชันที่ติดตั้งอยู่ที่ `node_modules/next/dist/docs/` ให้อ่านจากที่นี่ก่อน

## บทเรียนจากเว็บวัดที่ต้องทำตาม

- **client อ่านอย่างเดียว ทุกการเขียนผ่าน Route Handler + `firebase-admin`** การตรวจสิทธิ์อยู่ใน `src/app/api/**` ที่เดียว
- Next.js 16 ใช้ ISR แบบเดิม (`revalidate` + `revalidatePath`) ปิด `cacheComponents`
- **CDN ของ App Hosting ไม่ถูกล้างโดย `revalidatePath`** และเคารพ `s-maxage`
  จึงตั้ง `revalidate = 60` ในหน้าสาธารณะ และ `expireTime: 120` ใน `next.config.ts` (ข้อมูลขึ้นเว็บภายใน ~2 นาที)
  ส่วนที่ต้องสดทันที (จำนวนคนลงชื่อ, สถานะทริป) ให้เป็น Client Component ที่ฟัง `onSnapshot`
- ไอคอนอยู่ใน `public/` ไม่ใช่ `app/icon.svg` (ไฟล์ไอคอนใน app/ ทำให้ `next dev` reload วน)
- **เวลา 24 ชม. เสมอ**: ไม่ใช้ `<input type="time">` ใช้ select ชั่วโมง/นาที
  แสดงด้วย `hourCycle: "h23"`, `timeZone: "Asia/Bangkok"`
- **วันที่แบบไทย**: ไม่ใช้ `<input type="date">` ใช้ select เช่น "พรุ่งนี้ · เสาร์ 21 พ.ย. 2569"
- ทดสอบ push อัตโนมัติด้วย Playwright ไม่ได้ (subscribe ค้าง) ต้องทดสอบบนมือถือจริง
- การทดสอบที่ส่ง push จริงให้ใช้ "กลุ่มทดสอบของ Claude" เสมอ

## ผู้ใช้และสิทธิ์

| บทบาท | สิทธิ์ |
|---|---|
| ผู้เยี่ยมชม (ไม่ login) | ดูเส้นทาง ทริป กลุ่ม ดาวน์โหลด GPX |
| สมาชิก (login Google) | ลงชื่อร่วมทริป, เข้ากลุ่ม, สร้างกลุ่ม, เพิ่มเส้นทาง, รีวิว, รับแจ้งเตือน |
| แอดมินกลุ่ม | แก้ข้อมูลกลุ่ม, สร้าง/เลื่อน/ยกเลิกทริปของกลุ่ม, อนุมัติสมาชิก, แต่งตั้งแอดมินร่วม |
| super admin | ยืนยันและระงับกลุ่ม/เส้นทาง, จัดการเนื้อหาที่ถูกรายงาน |

- `super_admin: true` อยู่ใน custom claims ตั้งฝั่งเซิร์ฟเวอร์เท่านั้น
- **ต่างจากเว็บวัด**: ผู้ใช้หนึ่งคนอยู่ได้หลายกลุ่ม จึง **ไม่เก็บสิทธิ์กลุ่มใน custom claims** (claims จำกัด 1000 bytes)
  Route Handler เช็กสิทธิ์จาก `club_members/{club_id}_{uid}` (อ่าน 1 ครั้งด้วย id ตรง)

## Data model (Firestore)

ชื่อ field เป็น snake_case

```
users                   (core) id = Firebase Auth uid
  display_name          string
  photo_url             string
  bike_types            string[]   "road" | "mtb" | "touring" | "city" | "gravel"
  pace_level            string     "chill" | "medium" | "fast"
  calendar_token        string     สุ่มยาว ใช้ใน URL ICS ส่วนตัว รีเซ็ตได้
  created_at            timestamp

clubs                   (core) กลุ่มปั่น
  name, slug            string     slug ไม่ซ้ำ ไม่เปลี่ยนโดยไม่ทำ redirect
  description           string
  district              string     อำเภอในอุบล
  home_meet_point       geopoint   จุดนัดประจำ
  home_meet_name        string
  regular_schedule      string     เช่น "เสาร์–อาทิตย์ 05:30"
  logo_url              string
  links                 map        facebook, line_group, instagram, tiktok
  join_policy           string     "open" | "approval"
  member_count          number
  status                string     "unverified" | "verified" | "suspended"
  verified_by, verified_at, created_by, created_at, updated_at

club_members            (core) id = {club_id}_{uid}
  club_id, uid
  display_name, photo_url          คัดลอกมาตอนเข้ากลุ่ม
  role                  string     "admin" | "member"
  status                string     "active" | "pending"
  joined_at             timestamp

routes                  (routes) เส้นทาง
  name, slug            string
  description           string
  distance_km           number     คำนวณจาก GPX
  elevation_gain_m      number     คำนวณจาก GPX (ถ้ามีข้อมูลความสูง)
  difficulty            string     "easy" | "medium" | "hard"
  surface               string     "paved" | "gravel" | "mixed"
  start                 geopoint
  district              string     อำเภอของจุดเริ่ม
  gpx_path              string     path ใน Storage
  polyline              string     encoded polyline แบบลดจุดแล้ว ใช้วาดแผนที่ ไม่ต้องโหลด GPX
  stops                 array      [{ name, type: "cafe"|"water"|"fuel"|"view", position }]
  club_id               string?    ถ้าเป็นเส้นทางของกลุ่ม
  rating_avg, rating_count
  status                string     "unverified" | "verified" | "suspended"
  verified_by, verified_at, created_by, created_at, updated_at

routes_reviews          (routes) id = {route_id}_{uid}  รีวิวได้คนละครั้ง แก้ได้
  route_id, uid, display_name, rating (1–5), comment, created_at

rides                   (rides) ทริป / นัดปั่น
  club_id, club_name                คัดลอกชื่อมาเก็บ
  club_status           string     คัดลอกจาก clubs.status ตอนสร้าง และอัปเดตทุกทริปของกลุ่มเมื่อ super admin ยืนยัน/ระงับ
  route_id?, route_name?, distance_km?
  title                 string
  start_at              timestamp  เลื่อนทริป = เปลี่ยนค่านี้เป็นเวลาใหม่
  meet_point            geopoint
  meet_name             string
  pace_min_kmh, pace_max_kmh  number
  drop_policy           string     "no_drop" | "drop"
  max_riders            number?    ไม่ระบุ = ไม่จำกัด · แก้ให้ต่ำกว่า going_count ไม่ได้
  going_count, waitlist_count  number
  status                string     "scheduled" | "postponed" | "cancelled"  (done คำนวณตอนอ่าน)
                                   postponed = เลื่อนแล้วและยังจะปั่น ทำงานเหมือน scheduled ทุกอย่าง (ลงชื่อ, เตือน)
                                   แค่แสดงป้าย "เลื่อน" กับ status_note
  status_note           string     เช่น "ฝนตก เลื่อนไปอาทิตย์"
  note                  string
  created_by, created_at, updated_at

rides_participants      (rides) id = {ride_id}_{uid}
  ride_id, uid, display_name, photo_url
  ride_title, ride_meet_name, ride_start_at, ride_status, ride_club_name
                                   คัดลอกจาก ride เพื่อทำ ICS ส่วนตัวจาก collection นี้อย่างเดียว
                                   PATCH /api/rides/{id} ต้องอัปเดตทุก participant ของทริปนั้นใน batch เดียวกัน
  status                string     "going" | "waitlist"
  created_at

notify_devices          (notify) id = deviceId (สุ่มฝั่ง client เก็บใน localStorage)
  uid
  fcm_token             string
  platform              string     "ios" | "android" | "desktop"
  updated_at            timestamp

notify_prefs            (notify) id = uid
  ride_reminder         boolean    เตือนก่อนทริป (default true)
  ride_changes          boolean    ทริปเลื่อน/ยกเลิก (default true)
  club_new_ride         boolean    ทริปใหม่ในกลุ่มที่เป็นสมาชิก (default false)

notify_log              (notify) กันแจ้งซ้ำ id = {ride_id}_{uid}_{kind}_{start_at เป็น unix วินาที}
                                   ใส่ start_at เพื่อให้เลื่อนได้หลายครั้ง และเตือน d1/h1 ใหม่ตามวันที่เลื่อนไป
  kind                  string     "d1" | "h1" | "cancel" | "postpone" | "promoted" | "new"
                                   promoted = เลื่อนจาก waitlist ขึ้นมาเป็น going
  sent_at               timestamp
  expire_at             timestamp  TTL 30 วัน
```

**ข้อควรทำเพื่อประหยัดโควตา**
- หน้าแผนที่เส้นทางใช้ `polyline` ในเอกสาร ไม่โหลด GPX จาก Storage
- จำนวนคนลงชื่อเก็บเป็นตัวนับใน `rides` (อัปเดตใน transaction) ไม่นับจาก collection
- หาเส้นทาง/ทริปใกล้ตัว: ข้อมูลทั้งจังหวัดมีหลักสิบถึงหลักร้อย ให้ query ตามอำเภอแล้วคำนวณ haversine ในโค้ด
  ยังไม่ต้องใช้ geohash จนกว่าจะเกินหลักพัน (เหตุผลเดียวกับเว็บวัด)

## Flow หลัก

**ลงชื่อร่วมทริป** — `POST /api/rides/{id}/join`
1. ตรวจ ID token, ทริปต้อง `scheduled` หรือ `postponed` และยังไม่เริ่ม, `club_status` ไม่ใช่ `suspended`
2. Transaction: อ่าน `rides` → ถ้า `going_count < max_riders` เป็น `going` ไม่งั้น `waitlist` → สร้าง participant → อัปเดตตัวนับ
3. ยกเลิกการลงชื่อ: ถ้ามีคนรอ ให้เลื่อนคนแรกใน waitlist (เรียง `created_at`) ขึ้นมาเป็น `going` และส่ง push (kind `promoted`)
4. หลังลงชื่อสำเร็จ หน้าเว็บแสดงปุ่ม "เพิ่มลง Google Calendar" และชวนเปิดแจ้งเตือน (ดูหัวข้อแจ้งเตือน)

**แอดมินเลื่อน/ยกเลิกทริป** — `PATCH /api/rides/{id}`
- อัปเดตสถานะ (เลื่อน = `start_at` ใหม่ + `status_note`) และ field `ride_*` ของทุก participant ใน batch เดียว
  → ส่ง push ทันทีถึงทุกคนที่ลงชื่อ (kind `cancel` / `postpone`) เหมือนประกาศงดบิณฑบาตของเว็บวัด

**สร้างกลุ่ม** — `POST /api/clubs`
- สร้าง `clubs` และ `club_members` (role `admin`) ใน transaction เดียว client ห้ามเขียน `club_members` เอง

**เพิ่มเส้นทาง** — client ส่งไฟล์ GPX ตรงไปที่ `POST /api/routes` (multipart, ≤ 5 MB) **ไม่เขียน Storage เอง**
→ parse GPX ฝั่งเซิร์ฟเวอร์ (`routes/gpx.ts` เขียนเอง ไม่ใช้ lib) → คำนวณระยะ/ความสูง/จุดเริ่ม → เก็บ polyline (RDP ≤ 1500 จุด)
→ เซิร์ฟเวอร์เขียนไฟล์ไป `routes/{route_id}.gpx` (client เขียนไม่ได้ กันการแอบเปลี่ยนไฟล์หลังยืนยัน)
ดาวน์โหลดผ่าน URL สาธารณะของ Firebase Storage (`gpxUrl()`) · path `uploads/` ใน rules ยังเปิดไว้สำหรับรูปในอนาคต

## Google Calendar (Phase 1)

ไม่ขอ Google Calendar API scope ใน Phase 1 (เป็น sensitive scope ต้องผ่านการตรวจแอปจาก Google)

1. **ปุ่ม "เพิ่มลง Google Calendar"** ในหน้าทริป: ลิงก์
   `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&location=...&details=...`
   `dates` เป็น UTC รูปแบบ `YYYYMMDDTHHmmssZ` ระยะเวลาประมาณจากระยะทาง (หรือ 3 ชม. ถ้าไม่มี) ใส่ลิงก์หน้าทริปใน `details`
2. **ICS feed ส่วนตัว** `/api/cal/{calendar_token}.ics` รวมทุกทริปที่ผู้ใช้ลงชื่อ (ย้อนหลัง 30 วัน ถึงอนาคต)
   ทริปที่ยกเลิกส่งเป็น `STATUS:CANCELLED` · `UID` คงที่ = `{ride_id}@panpuan.net` · หน้าโปรไฟล์มีปุ่มคัดลอกลิงก์และปุ่มรีเซ็ต token
3. **ICS feed ของกลุ่ม** `/clubs/{slug}/calendar.ics` ทริปทั้งหมดของกลุ่ม
- แจ้งผู้ใช้ว่า Google Calendar ดึง feed ใหม่ช้า (หลายชั่วโมง) การยกเลิกด่วนให้พึ่ง push
- ทำ ICS เอง (format ไม่ซับซ้อน) หรือใช้ lib ที่เล็กและดูแลอยู่ ต้อง escape `,` `;` `\n` และพับบรรทัดเกิน 75 octets

## การแจ้งเตือนและ PWA (ตามแบบเว็บวัด)

ยกมาจากเว็บวัด:
- PWA manifest + **`public/firebase-messaging-sw.js` เป็น service worker ของทั้ง PWA และ FCM**
- **ไม่ใช้ VAPID key ของเราเอง** (SDK ใช้ key กลางของ Firebase) และ SW **ไม่โหลด Firebase SDK**
- ส่ง FCM แบบ **data message** `{title, body, url, tag}` แล้ว SW แสดงเอง กดแล้วเปิด `url`
  `tag` = `ride-{ride_id}` เพื่อให้แจ้งเตือนของทริปเดียวกันทับกัน ไม่ซ้อน
- **หน้าสอนติดตั้งบน iPhone** (iOS 16.4+ ต้อง "เพิ่มไปยังหน้าจอโฮม" ก่อน push จึงทำงาน) มีภาพประกอบ
  ตรวจ `matchMedia('(display-mode: standalone)')` / `navigator.standalone` เพื่อแสดงคำแนะนำเมื่อยังไม่ติดตั้ง
- token ที่ส่งไม่สำเร็จ (`registration-token-not-registered` ฯลฯ) ลบ `notify_devices` นั้นทันที
- กันแจ้งซ้ำด้วย `notify_log` id กำหนดเอง สร้างด้วย `create()` ซึ่งล้มถ้ามีอยู่แล้ว

ต่างจากเว็บวัด:
- ผู้ใช้ login Google (ไม่ใช่ anonymous) และ **หนึ่งคนมีได้หลายเครื่อง** → ส่งทุกเครื่องใน `notify_devices where uid == X`
- **เตือนตามเวลาต้องมี scheduler**: Cloud Scheduler เรียก `POST /api/notify/reminders` ทุก 15 นาที
  - ป้องกันด้วย header `x-cron-secret` (เก็บใน Secret Manager อ้างใน `apphosting.yaml`) หรือ OIDC token ของ Scheduler
  - หาทริป `scheduled` หรือ `postponed` ที่ `start_at` อยู่ในอีก 0–24 ชม. แล้วส่ง:
    `d1` เมื่อเหลือ ≤ 24 ชม. (ข้ามถ้าทริปสร้างภายใน 24 ชม. ก่อนเริ่ม) · `h1` เมื่อเหลือ ≤ 60 นาที
  - ส่งเฉพาะผู้ลงชื่อ `going` ที่ `notify_prefs.ride_reminder` ไม่ใช่ false
  - Scheduler รันซ้ำหรือช้าได้ ความถูกต้องอาศัย `notify_log` ไม่ใช่ช่วงเวลาที่แม่นยำ
  - การตั้ง Scheduler อยู่ในสคริปต์ใน repo (`scripts/setup-scheduler.sh`)

**จังหวะชวนติดตั้งและเปิดแจ้งเตือน**
- ห้ามขอสิทธิ์แจ้งเตือนตอนเปิดเว็บ ขอเมื่อผู้ใช้กดปุ่มเองเท่านั้น (iOS บังคับ)
- จังหวะหลัก: หลังลงชื่อร่วมทริปสำเร็จ แสดง "✅ ลงชื่อแล้ว · อยากให้เตือนก่อนออกปั่นไหม? [เปิดแจ้งเตือน]"
- Android/คอม: ขอสิทธิ์ได้เลย และใช้ `beforeinstallprompt` แสดงปุ่ม "ติดตั้งแอป"
- iPhone ที่ยังไม่ติดตั้ง: พาไปหน้าสอนก่อน แล้วค่อยเปิดแจ้งเตือนจากในแอปที่ติดตั้งแล้ว
- หน้าโปรไฟล์มีสวิตช์ตาม `notify_prefs` และรายการเครื่องที่รับแจ้งเตือน (ลบได้)

## Security rules (แนวทาง)

- Firestore: client **ไม่มี allow write ทุก collection** เขียนผ่าน Route Handler เท่านั้น
- อ่านได้ทุกคน: `clubs`, `routes`, `routes_reviews` ที่ `status != "suspended"`, `rides` ที่ `club_status != "suspended"`
  (rules กรองด้วย field ในเอกสาร client จึงต้อง query ให้ตรงเงื่อนไขนี้ด้วย)
- `rides_participants`, `club_members`: อ่านได้เฉพาะผู้ที่ login (แสดงแค่ชื่อและรูป ไม่มีข้อมูลติดต่อ)
- `users`: อ่านเอกสารของตัวเองได้เท่านั้น (`calendar_token` เป็นความลับ)
- `notify_devices`, `notify_prefs`, `notify_log`: client อ่านเขียนไม่ได้ (ลงทะเบียน token ผ่าน `POST /api/notify/devices`)
- Storage: อ่าน `routes/**` ได้ทุกคน, `uploads/{uid}/...` อ่านเขียนได้เฉพาะเจ้าของ จำกัดชนิดและขนาดไฟล์
- เก็บ service account key และ secret ใน environment / Secret Manager ห้าม commit

กติกาใน Route Handler (ไม่ใช่ Firestore rules เพราะ client เขียนไม่ได้อยู่แล้ว):
- `clubs.status`, `routes.status`, `verified_*` แก้ได้เฉพาะ super admin

## SEO

เป้าหมาย: ติดหน้าแรกสำหรับคำค้นตามลำดับที่ชนะได้จริง
1. **ชื่อเส้นทางเฉพาะ** เช่น "ปั่นจักรยาน อุบล โขงเจียม", "เส้นทางปั่น ริมมูล"
2. **ชื่อกลุ่ม** เช่น "ชมรมจักรยาน [ชื่อกลุ่ม] อุบล"
3. **เส้นทางปั่นจักรยาน + อำเภอ** เช่น "เส้นทางปั่นจักรยาน วารินชำราบ"
4. คำกว้าง เช่น "ปั่นจักรยาน อุบล", "กลุ่มปั่นจักรยาน อุบล" — เป้าระยะยาว

**ข้อบังคับด้านเทคนิค (ต้องทำตั้งแต่ Phase 1)**
- หน้าสาธารณะ render ฝั่งเซิร์ฟเวอร์ด้วย Server Components + `firebase-admin` ใช้ ISR
- เฉพาะส่วนที่ต้องสด (จำนวนคนลงชื่อ, สถานะทริป, แผนที่) เป็น Client Component
- URL คงที่: `/routes/[slug]`, `/clubs/[slug]`, `/rides/[id]`, `/districts/[district]`
  slug เป็นภาษาไทยได้ (ทดสอบ URL encoding ก่อน) ห้ามเปลี่ยนโดยไม่ทำ redirect
- `generateMetadata` ทุกหน้า: title (มีคำขยายเสมอ), description, canonical, Open Graph
  รูป OG ของเส้นทางสร้างจาก polyline ด้วย `ImageResponse` (ลิงก์ถูกแชร์ใน LINE/Facebook เป็นหลัก)
- JSON-LD: ทริปใช้ `Event` (sport event, location, startDate, organizer = กลุ่ม, eventStatus เมื่อเลื่อน/ยกเลิก)
  กลุ่มใช้ `SportsOrganization` ทุกหน้าใส่ `BreadcrumbList` (ยังไม่มี type ที่ตรงกับเส้นทางจักรยาน ไม่ต้องฝืน)
- `app/sitemap.ts` (เส้นทางและกลุ่มที่ verified, ทริปที่ยังไม่จบ) และ `app/robots.ts`
- `noindex`: กลุ่ม/เส้นทาง `unverified` และ `suspended`, ทริปที่จบเกิน 30 วัน, หน้า login/admin/โปรไฟล์/API
- Core Web Vitals: `next/image`, โหลด Leaflet แบบ lazy, `h1` เดียวต่อหน้า, `lang="th"`
- แต่ละเส้นทางและกลุ่มต้องมีข้อความบรรยายของตัวเอง ไม่ใช้แม่แบบซ้ำ

**งานนอกโค้ด (เจ้าของทำเอง)**
- Google Search Console + ส่ง sitemap
- ให้กลุ่มปั่นใส่ลิงก์หน้ากลุ่มบนเพจ Facebook / กลุ่ม LINE ของตัวเอง
- กันชื่อ @panpuan บน IG และ TikTok

## UX

- กลุ่มเป้าหมายวัยรุ่น: mobile-first, โทนสนุก กระชับ, ภาพเส้นทางและรูปทริปเด่น
- ข้อความบนหน้าจอเป็นภาษาไทยทั้งหมด
- หน้าแรกชู **ทริปที่กำลังจะมาถึง** ก่อนอย่างอื่น ("เสาร์นี้ปั่นไหนดี")
- ความปลอดภัย: ไม่แสดงข้อมูลติดต่อส่วนตัวในหน้าสาธารณะ ตำแหน่งสด (Phase 2) แชร์เฉพาะช่วงทริปและผู้ใช้กดเปิดเอง

## แผนการพัฒนา

**Phase 1 — MVP**
- ตั้งโปรเจกต์ Next.js + Firebase, `.env.local.example`, `apphosting.yaml`, rules และ indexes ใน repo
- Login Google, หน้าโปรไฟล์
- กลุ่ม: สร้าง, หน้ากลุ่ม, เข้ากลุ่ม (open/approval), จัดการสมาชิกและแอดมินร่วม
- เส้นทาง: อัปโหลด GPX, แผนที่, หน้าเส้นทาง, ดาวน์โหลด GPX, รีวิว, ค้นหาตามอำเภอ/ระยะ/ความยาก
- ทริป: สร้าง, ลงชื่อ/ยกเลิก, waitlist, เลื่อน/ยกเลิกทริป, ปฏิทินรวมทุกกลุ่ม
- Google Calendar: ปุ่มเพิ่ม + ICS ส่วนตัวและของกลุ่ม
- PWA + Web Push + หน้าสอน iPhone + Cloud Scheduler เตือนก่อนทริป + push เมื่อเลื่อน/ยกเลิก
- super admin: คิวยืนยัน, ยืนยัน/ระงับกลุ่มและเส้นทาง
- SEO ตามหัวข้อ SEO
- Seed script (ข้อมูลกลุ่มและเส้นทางตัวอย่าง ใช้ใน dev เท่านั้น)

**Phase 2 — ระหว่างปั่นและแผนที่ชุมชน**
- ติดตามสด (RTDB `live/{ride_id}/{uid}`), เตือนแอดมินเมื่อมีคนหลุดกลุ่ม, ปุ่มขอความช่วยเหลือ
  จบทริปแล้วลบ `live/{ride_id}` อัตโนมัติ (แนวคิดเดียวกับการติดตามพระบิณฑบาต)
- `places`: ร้านจักรยาน/ร้านซ่อม, จุดแวะ, จุดอันตราย (โหวตว่ายังมีอยู่ + หมดอายุ)
- ทริปซ้ำ (ทุกเสาร์ ฯลฯ), เช็กชื่อด้วย QR, แจ้งทริปใหม่ในกลุ่ม

**Phase 3 — สถิติและกิจกรรม**
- เชื่อม Strava, สถิติส่วนตัว, leaderboard รายเดือน, challenge + badge, อัลบั้มรูปทริป

**Phase 4 — LINE และ Calendar sync**
- LINE Login (Cloud Function/Route Handler แลก LINE token เป็น custom token) + account linking กับบัญชี Google เดิม
- LINE OA แจ้งเตือน
- Google Calendar API sync อัตโนมัติ (ถ้าผู้ใช้เรียกร้อง ต้องผ่านการตรวจแอปจาก Google)

แต่ละ phase ต้องรันได้และทดสอบบนมือถือจริงก่อนไปต่อ

## สิ่งที่ต้องขอจากเจ้าของโปรเจกต์

- Firebase project ใหม่ (แยกจากเว็บวัด แนะนำแยก dev/prod) ที่เปิด Firestore, Authentication (Google), Storage, Cloud Messaging
  และ Blaze plan สำหรับ App Hosting และ Cloud Scheduler (ตั้ง budget alert)
- Firebase web config และ service account สำหรับ dev
- ยืนยันว่าจด panpuan.net แล้ว และจะเชื่อมกับ App Hosting
- ข้อมูลตัวอย่าง: กลุ่มปั่นและเส้นทางจริงในอุบล (ยังไม่มี) ห้ามใส่ข้อมูลที่ไม่ได้ยืนยันลงฐานข้อมูลจริง
- ~~โลโก้ / สีหลักของแบรนด์~~ ได้แล้ว: `design/logo.jpg` (ต้นฉบับ 2048px) สีส้ม `#ff6a00` + เขียวมะนาว `#8fd320` บนพื้น `#22272d`
  ไอคอนใน `public/` สร้างจากไฟล์นี้ (192, 512, maskable 512, apple-touch 180, favicon 48)
  ถ้าเปลี่ยนโลโก้ให้สร้างไอคอนชุดนี้ใหม่ทั้งหมด

## ข้อตกลงในการเขียนโค้ด

- TypeScript แบบ strict
- ชื่อ field ใน Firestore ใช้ snake_case ตาม data model
- ข้อความบนหน้าจอเป็นภาษาไทย ส่วนโค้ดและ comment เป็นภาษาอังกฤษ
- ออกแบบ mobile-first
- ไม่เพิ่ม dependency โดยไม่จำเป็น
