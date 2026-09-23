import { useEffect, useMemo, useState } from "react";
import { ChevronRight, CircleHelp, Download, Gamepad2, Menu, Search, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import AuthTester from "./AuthTester";
import FreeFireMarket from "./FreeFireMarket";

const fallbackTracks = [
  { _id: "1", title: "Free Fire — Heroic 3 ดาว", artist: "Thailand Server", durationSec: 1299, license: "original", downloads: 24 },
  { _id: "2", title: "Free Fire — Grandmaster", artist: "Thailand Server", durationSec: 1890, license: "cc-by", downloads: 11 },
  { _id: "3", title: "Free Fire — แรงค์ Heroic พร้อมสกิน", artist: "Asia Server", durationSec: 699, license: "public-domain", downloads: 37 },
  { _id: "4", title: "Free Fire — เลเวล 65 ไอดีเก่า", artist: "Thailand Server", durationSec: 990, license: "original", downloads: 9 },
  { _id: "5", title: "Free Fire — Evo Gun + สกินหายาก", artist: "Thailand Server", durationSec: 1590, license: "cc-by", downloads: 43 },
  { _id: "6", title: "Free Fire — Heroic พร้อมเพชร", artist: "SEA Server", durationSec: 549, license: "original", downloads: 18 },
];

const categories = ["ทั้งหมด", "Heroic", "Grandmaster", "Evo Gun", "สกินหายาก", "ไอดีเลเวลสูง"];
const licenseLabel = { original: "ยืนยันแล้ว", "cc-by": "คุ้มค่า", "public-domain": "พร้อมโอน" };

function formatPrice(value) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function App() {
  const [tracks, setTracks] = useState(fallbackTracks);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`/api/tracks`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (Array.isArray(data) && data.length) setTracks(data); })
      .catch(() => undefined);
  }, []);

  const visibleTracks = useMemo(() => tracks.filter((track) =>
    `${track.title} ${track.artist}`.toLowerCase().includes(query.toLowerCase())
  ), [tracks, query, activeCategory]);

  const handleDownload = async (track) => {
    try { await fetch(`/api/tracks/${track._id}/download`, { method: "POST" }); } catch { /* demo works offline */ }
    setNotice(`เพิ่ม “${track.title}” ลงในรายการแล้ว`);
    window.setTimeout(() => setNotice(""), 2800);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-black tracking-tight text-white"><span className="grid size-9 place-items-center rounded-xl bg-violet-500 shadow-lg shadow-violet-500/25"><Gamepad2 size={20}/></span><span>GAME<span className="text-violet-400">VAULT</span></span></a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex"><a href="#catalog" className="hover:text-white">เลือกเกม</a><a href="#how" className="hover:text-white">วิธีใช้งาน</a><a href="#faq" className="hover:text-white">คำถามที่พบบ่อย</a></nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-slate-200 md:hidden" aria-label="เมนู">{menuOpen ? <X/> : <Menu/>}</button>
        </div>
        {menuOpen && <nav className="border-t border-white/8 px-5 py-4 md:hidden"><div className="flex flex-col gap-3 text-sm text-slate-300"><a href="#catalog" onClick={() => setMenuOpen(false)}>เลือกเกม</a><a href="#how" onClick={() => setMenuOpen(false)}>วิธีใช้งาน</a><a href="#faq" onClick={() => setMenuOpen(false)}>คำถามที่พบบ่อย</a></div></nav>}
      </header>

      <main id="top">
        <FreeFireMarket />
        <section className="relative overflow-hidden"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_0%,#4c1d95_0,transparent_30%),radial-gradient(circle_at_10%_40%,#0e7490_0,transparent_25%)]"/>
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
            <div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200"><Sparkles size={14}/> ส่งมอบรวดเร็ว ตรวจสอบได้ทุกบัญชี</div><h1 className="text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-6xl">ไอดีเกมดี ๆ<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">เริ่มเกมได้ทันที</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">เลือกบัญชีเกมที่เหมาะกับคุณ พร้อมข้อมูลครบและการดูแลหลังซื้อที่สบายใจ</p><a href="#catalog" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-violet-100">เลือกบัญชีเกม <ChevronRight size={18}/></a></div>
            <div className="grid grid-cols-2 gap-3 self-center"><div className="col-span-2 rounded-2xl border border-white/10 bg-white/7 p-5 backdrop-blur"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">บัญชีที่ขายแล้ว</span><span className="text-2xl font-black">1,200+</span></div><div className="mt-4 h-2 rounded-full bg-slate-700"><div className="h-full w-4/5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"/></div></div><div className="rounded-2xl border border-white/10 bg-white/7 p-5"><ShieldCheck className="text-emerald-400"/><p className="mt-4 text-xl font-bold">ตรวจสอบแล้ว</p><p className="mt-1 text-xs text-slate-400">ข้อมูลบัญชีชัดเจน</p></div><div className="rounded-2xl border border-white/10 bg-white/7 p-5"><Star className="text-amber-300" fill="currentColor"/><p className="mt-4 text-xl font-bold">4.9/5</p><p className="mt-1 text-xs text-slate-400">จากผู้ใช้งานจริง</p></div></div>
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl px-5 py-18 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-violet-300">GAME CATALOG</p><h2 className="mt-2 text-3xl font-black">เลือกไอดีที่ใช่สำหรับคุณ</h2></div><label className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-400 sm:w-72"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="ค้นหาเกมหรือเซิร์ฟเวอร์"/></label></div>
          <div className="mt-7 flex gap-2 overflow-x-auto pb-2">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory === category ? "bg-violet-500 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>{category}</button>)}</div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleTracks.map((track, index) => <article key={track._id} className="group overflow-hidden rounded-2xl border border-white/8 bg-slate-900/70 transition hover:-translate-y-1 hover:border-violet-400/40"><div className={`flex h-32 items-end p-5 bg-gradient-to-br ${["from-violet-900 to-slate-900", "from-cyan-900 to-slate-900", "from-fuchsia-900 to-slate-900"][index % 3]}`}><span className="rounded-md bg-black/25 px-2.5 py-1 text-xs font-semibold text-white">{licenseLabel[track.license] ?? "พร้อมขาย"}</span></div><div className="p-5"><p className="text-sm text-slate-400">{track.artist}</p><h3 className="mt-1 truncate text-lg font-bold text-white">{track.title}</h3><div className="mt-5 flex items-center justify-between"><div><p className="text-xs text-slate-500">ราคาเริ่มต้น</p><p className="font-bold text-violet-300">฿{formatPrice(track.durationSec)}</p></div><button onClick={() => handleDownload(track)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-violet-100"><Download size={14}/> เลือกบัญชี</button></div></div></article>)}</div>
          {!visibleTracks.length && <p className="py-14 text-center text-slate-400">ไม่พบบัญชีเกมที่ค้นหา</p>}
        </section>

        <section id="how" className="border-y border-white/8 bg-slate-900/40"><div className="mx-auto max-w-7xl px-5 py-18 lg:px-8"><p className="text-sm font-semibold text-cyan-300">ง่ายและชัดเจน</p><h2 className="mt-2 text-3xl font-black">พร้อมเล่นใน 3 ขั้นตอน</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[["01", "เลือกบัญชี", "ดูรายละเอียดและเลือกเกมที่ชอบ"], ["02", "ยืนยันรายการ", "ตรวจสอบข้อมูลก่อนดำเนินการ"], ["03", "รับข้อมูล", "รับข้อมูลบัญชีและเริ่มเล่นได้เลย"]].map(([number, title, detail]) => <div key={number} className="rounded-2xl border border-white/8 bg-slate-950 p-6"><span className="text-3xl font-black text-violet-400">{number}</span><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div>)}</div></div></section>
        <AuthTester />
      </main>
      <footer id="faq" className="mx-auto max-w-7xl px-5 py-10 text-sm text-slate-500 lg:px-8"><div className="flex flex-col justify-between gap-3 sm:flex-row"><span>© 2026 GameVault. All rights reserved.</span><span className="inline-flex items-center gap-1"><CircleHelp size={15}/> ต้องการความช่วยเหลือ? ติดต่อทีมดูแล</span></div></footer>
      {notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/20 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
    </div>
  );
}

export default App;
