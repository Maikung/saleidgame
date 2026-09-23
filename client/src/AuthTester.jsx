import { useState } from "react";
import { KeyRound, LogIn, Shield, UserRound, X } from "lucide-react";

const apiBase = "";

async function readApiResponse(response) {
  const rawBody = await response.text();
  let data = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error(`API returned a non-JSON response (HTTP ${response.status})`);
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (HTTP ${response.status})`);
  }
  return data;
}

export default function AuthTester() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ username: "", email: "", password: "", adminCode: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setResult(null);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email: form.email, password: form.password } : { ...form, role };
    try {
      const response = await fetch(`${apiBase}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await readApiResponse(response);
      if (!data.token || !data.user) throw new Error("API response is missing token or user data");
      localStorage.setItem("saleidgame_token", data.token);
      setResult({ type: "success", message: `${mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}สำเร็จ: ${data.user.role}`, token: data.token, user: data.user });
      window.setTimeout(() => { setIsOpen(false); setResult(null); }, 1200);
    } catch (error) { setResult({ type: "error", message: error.message }); }
    finally { setLoading(false); }
  };

  const checkProfile = async () => {
    const token = localStorage.getItem("saleidgame_token");
    if (!token) return setResult({ type: "error", message: "ยังไม่มี token — กรุณา login ก่อน" });
    try { const res = await fetch(`/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }); const data = await readApiResponse(res); if (!data.user) throw new Error("API response is missing user data"); setResult({ type: "success", message: "GET /api/auth/me สำเร็จ", user: data.user }); } catch (error) { setResult({ type: "error", message: error.message }); }
  };

  return <><section id="auth-test" className="border-y border-white/8 bg-slate-900/40"><div className="mx-auto flex flex-col items-start justify-between gap-5 px-5 py-12 sm:flex-row sm:items-center lg:px-8"><div><p className="text-sm font-semibold text-cyan-300">API PLAYGROUND</p><h2 className="mt-1 text-2xl font-black">ทดสอบระบบสมาชิก</h2><p className="mt-2 text-sm text-slate-400">Login / Register สำหรับ User และ Admin</p></div><div className="flex gap-3"><button onClick={checkProfile} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold hover:bg-slate-800"><KeyRound size={17}/> ตรวจ token</button><button onClick={() => { setResult(null); setIsOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-violet-100"><LogIn size={17}/> Login / Register</button></div></div></section>{isOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Login and Register"><div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl sm:p-7"><button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="ปิด"><X size={18}/></button><p className="text-sm font-semibold text-cyan-300">MEMBER ACCESS</p><h2 className="mt-1 text-2xl font-black">เข้าสู่ระบบสมาชิก</h2><div className="mt-5 flex gap-2 border-b border-white/10 pb-5"><button onClick={() => { setMode("login"); setResult(null); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "login" ? "bg-violet-500 text-white" : "text-slate-400"}`}>เข้าสู่ระบบ</button><button onClick={() => { setMode("register"); setResult(null); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "register" ? "bg-violet-500 text-white" : "text-slate-400"}`}>สมัครสมาชิก</button></div><form onSubmit={submit} className="mt-5 space-y-4">{mode === "register" && <><label className="block text-sm text-slate-300">ชื่อผู้ใช้<input required name="username" value={form.username} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-violet-400"/></label><div><p className="text-sm text-slate-300">ประเภทบัญชี</p><div className="mt-1.5 grid grid-cols-2 gap-2">{[["user", UserRound, "User"], ["admin", Shield, "Admin"]].map(([value, Icon, label]) => <button type="button" key={value} onClick={() => setRole(value)} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ${role === value ? "border-violet-400 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}><Icon size={16}/>{label}</button>)}</div></div>{role === "admin" && <label className="block text-sm text-slate-300">Admin registration code<input required name="adminCode" type="password" value={form.adminCode} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-violet-400"/></label>}</>}<label className="block text-sm text-slate-300">อีเมล<input required name="email" type="email" value={form.email} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-violet-400"/></label><label className="block text-sm text-slate-300">รหัสผ่าน<input required minLength="8" name="password" type="password" value={form.password} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-violet-400"/></label><button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"><LogIn size={17}/>{loading ? "กำลังส่ง..." : mode === "login" ? "Login" : `Register ${role}`}</button></form>{result && <div className={`mt-5 rounded-xl border p-4 text-sm ${result.type === "success" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-red-400/25 bg-red-500/10 text-red-200"}`}><p className="font-bold">{result.message}</p></div>}<p className="mt-5 text-xs leading-5 text-slate-500">สมัคร Admin ต้องใช้ <code>ADMIN_REGISTRATION_CODE</code> จาก server/.env</p></div></div>}</>;
}
