import Link from "next/link";

export const revalidate = 60;

export default function Home() {
  return (
    <main className="wrap">
      <h1>เสาร์นี้ปั่นไหนดี?</h1>
      <p className="muted">นัดปั่นของทุกกลุ่มในอุบลจะมารวมกันที่นี่ เร็ว ๆ นี้ 🚲</p>
      <Link href="/clubs" className="btn">
        ดูกลุ่มปั่นในอุบล
      </Link>
    </main>
  );
}
