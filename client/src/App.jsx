import { useEffect, useState } from "react";
import { Flame, Gamepad2, LogIn, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-[#101114] text-slate-100">
      <header id="top" className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#101114]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-black tracking-tight text-white"><span className="grid size-9 place-items-center rounded-lg bg-[#f04438] text-white"><Flame size={19} /></span><span>SALEID<span className="text-[#f04438]">GAME</span></span></a>
          <nav className="hidden items-center gap-7 text-sm text-slate-400 sm:flex"><a href="#top" className="transition hover:text-white">หน้าหลัก</a><a href="#catalogue" className="transition hover:text-white">ไอดี Free Fire</a><a href="#how-to-buy" className="transition hover:text-white">วิธีสั่งซื้อ</a></nav>
          {!checkingSession && (user
            ? <div className="flex items-center gap-3"><span className="hidden max-w-40 truncate text-xs text-slate-400 md:block">{user.username || user.email}</span><button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"><LogOut size={14} /> ออกจากระบบ</button></div>
            : <button onClick={() => setLoginOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-slate-200"><LogIn size={14} /> เข้าสู่ระบบ</button>)}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {user && <div className="mb-5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">เข้าสู่ระบบแล้ว — เลือกดูไอดี Free Fire ทั้งหมดได้เลย</div>}
        <FreeFireMarket
          preview={!user}
          authenticatedUser={user}
          purchaseAfterLogin={purchaseAfterLogin}
          onPurchaseHandled={() => setPurchaseAfterLogin(null)}
          onNeedLogin={(accountId) => { setPurchaseAfterLogin(accountId); setLoginOpen(true); }}
        />
      </main>
      <footer className="border-t border-white/[0.07] px-5 py-7 text-center text-xs text-slate-500">© 2026 SaleIDGame <span className="px-1 text-slate-700">·</span> ตลาดซื้อขายไอดี Free Fire</footer>
      <AuthTester open={loginOpen} onClose={() => { setLoginOpen(false); setPurchaseAfterLogin(null); }} onAuthSuccess={(authenticatedUser) => { setUser(authenticatedUser); setLoginOpen(false); }} />
    </div>
  );
}
