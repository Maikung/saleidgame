import { useEffect, useState } from "react";
import { Gamepad2, LogIn, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-black tracking-tight text-slate-900">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white"><Gamepad2 size={20} /></span>
            <span>SALEID<span className="text-orange-700">GAME</span></span>
          </a>
          <div className="flex items-center gap-3">
            {!checkingSession && user && <span className="hidden text-sm text-slate-600 sm:inline">สวัสดี, {user.username || user.email}</span>}
            {!checkingSession && (user
              ? <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-100"><LogOut size={16} /> ออกจากระบบ</button>
              : <button onClick={() => setLoginOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><LogIn size={16} /> เข้าสู่ระบบ</button>)}
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl">
        {user && <div className="mx-5 mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 lg:mx-8">เข้าสู่ระบบแล้ว — ขณะนี้คุณกำลังดูรายการทั้งหมด</div>}
        <FreeFireMarket
          preview={!user}
          authenticatedUser={user}
          purchaseAfterLogin={purchaseAfterLogin}
          onPurchaseHandled={() => setPurchaseAfterLogin(null)}
          onNeedLogin={(accountId) => { setPurchaseAfterLogin(accountId); setLoginOpen(true); }}
        />
      </main>
      <footer className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500">© 2026 SaleIDGame</footer>
      <AuthTester open={loginOpen} onClose={() => { setLoginOpen(false); setPurchaseAfterLogin(null); }} onAuthSuccess={(authenticatedUser) => { setUser(authenticatedUser); setLoginOpen(false); }} />
    </div>
  );
}
