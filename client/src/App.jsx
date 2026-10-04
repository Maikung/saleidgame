import { useEffect, useState } from "react";
import { ChevronRight, Gamepad2, Home, LogIn, LogOut, Package, ScrollText } from "lucide-react";
import AuthTester from "./AuthTester";
import FreeFireMarket from "./FreeFireMarket";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [purchaseAfterLogin, setPurchaseAfterLogin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("saleidgame_token");
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setUser(data.user || null))
      .catch(() => {
        localStorage.removeItem("saleidgame_token");
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const signOut = () => {
    localStorage.removeItem("saleidgame_token");
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f1ed] text-slate-900 lg:grid lg:grid-cols-[184px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-[#202222] text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <a href="#top" className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5 font-black tracking-wide">
          <span className="grid size-9 place-items-center rounded-md bg-[#f5e83b] text-slate-950"><Gamepad2 size={20} /></span>
          <span>SALEID<span className="text-[#f5e83b]">GAME</span></span>
        </a>
        <div className="border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-900">{user ? (user.username || user.email || "U").slice(0, 1).toUpperCase() : "G"}</span>
            <div className="min-w-0"><p className="text-xs font-bold">{user ? user.username || "สมาชิก" : "ยินดีต้อนรับ"}</p><p className="mt-1 truncate text-[10px] text-slate-400">{user ? "เข้าสู่ระบบแล้ว" : "เลือกชมไอดี Free Fire"}</p></div>
          </div>
        </div>
        <nav className="space-y-1 px-2 py-4 text-xs font-semibold">
          <a href="#top" className="flex items-center gap-3 rounded-md bg-[#f5e83b] px-3 py-3 text-slate-950"><Home size={15} /> หน้าหลัก</a>
          <a href="#catalogue" className="flex items-center gap-3 rounded-md px-3 py-3 text-slate-300 hover:bg-white/10 hover:text-white"><Package size={15} /> ไอดี Free Fire</a>
          <a href="#how-to-buy" className="flex items-center gap-3 rounded-md px-3 py-3 text-slate-300 hover:bg-white/10 hover:text-white"><ScrollText size={15} /> วิธีสั่งซื้อ</a>
        </nav>
        <div className="mt-auto p-3"><a href="#catalogue" className="block rounded-lg bg-gradient-to-r from-[#f5e83b] to-lime-400 p-3 text-center text-[11px] font-bold leading-relaxed text-slate-950">SALEID GAME<br />เลือกชมไอดี Free Fire<br />ได้ที่นี่ <ChevronRight className="ml-1 inline" size={13} /></a></div>
      </aside>

      <div id="top" className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <a href="#top" className="flex items-center gap-2 font-black tracking-wide lg:hidden"><span className="grid size-8 place-items-center rounded-md bg-[#f5e83b]"><Gamepad2 size={18} /></span>SALEID<span className="-ml-2 text-orange-600">GAME</span></a>
          <a href="#catalogue" className="hidden text-sm font-medium text-slate-500 hover:text-slate-900 sm:inline">ร้านค้า <span className="px-1 text-slate-300">/</span> Free Fire</a>
          <div className="ml-auto flex items-center gap-3">
            {user && <span className="hidden text-xs text-slate-500 sm:inline">สวัสดี, {user.username || user.email}</span>}
            {!checkingSession && (user
              ? <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md bg-[#202222] px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"><LogOut size={14} /> ออกจากระบบ</button>
              : <button onClick={() => setLoginOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#202222] px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"><LogIn size={14} /> เข้าสู่ระบบ</button>)}
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
          {user && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">เข้าสู่ระบบแล้ว — เลือกดูไอดี Free Fire ทั้งหมดได้เลย</div>}
          <FreeFireMarket
            preview={!user}
            authenticatedUser={user}
            purchaseAfterLogin={purchaseAfterLogin}
            onPurchaseHandled={() => setPurchaseAfterLogin(null)}
            onNeedLogin={(accountId) => { setPurchaseAfterLogin(accountId); setLoginOpen(true); }}
          />
        </main>
        <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500">© 2026 SaleIDGame · ตลาดซื้อขายไอดี Free Fire</footer>
      </div>
      <AuthTester open={loginOpen} onClose={() => { setLoginOpen(false); setPurchaseAfterLogin(null); }} onAuthSuccess={(authenticatedUser) => { setUser(authenticatedUser); setLoginOpen(false); }} />
    </div>
  );
}
