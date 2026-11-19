// The 25 districts of Ubon Ratchathani. The Thai name is also the URL slug: /districts/[district]
export const DISTRICTS = [
  "เมืองอุบลราชธานี",
  "วารินชำราบ",
  "ศรีเมืองใหม่",
  "โขงเจียม",
  "เขื่องใน",
  "เขมราฐ",
  "เดชอุดม",
  "นาจะหลวย",
  "น้ำยืน",
  "บุณฑริก",
  "ตระการพืชผล",
  "กุดข้าวปุ้น",
  "ม่วงสามสิบ",
  "พิบูลมังสาหาร",
  "ตาลสุม",
  "โพธิ์ไทร",
  "สำโรง",
  "ดอนมดแดง",
  "สิรินธร",
  "ทุ่งศรีอุดม",
  "นาเยีย",
  "นาตาล",
  "เหล่าเสือโก้ก",
  "สว่างวีระวงศ์",
  "น้ำขุ่น",
] as const;

export type District = (typeof DISTRICTS)[number];

export const isDistrict = (s: string): s is District => (DISTRICTS as readonly string[]).includes(s);
