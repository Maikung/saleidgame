import { useState } from "react";
import { LogIn, Shield, UserRound, X } from "lucide-react";

async function readApiResponse(response) {
  const rawBody = await response.text();
  let data = {};
  if (rawBody) {
    try { data = JSON.parse(rawBody); }
    catch { throw new Error(`API returned a non-JSON response (HTTP ${response.status})`); }
  }
  if (!response.ok) throw new Error(data.message || `Request failed (HTTP ${response.status})`);
  return data;
}

export default function AuthTester({ open, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ username: "", email: "", password: "", adminCode: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email: form.email, password: form.password } : { ...form, role };
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await readApiResponse(response);
      if (!data.token || !data.user) throw new Error("API response is missing token or user data");
      localStorage.setItem("saleidgame_token", data.token);
      onAuthSuccess?.(data.user);
      onClose?.();
    } catch (error) {
      setResult({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/25 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="เข้าสู่ระบบและสมัครสมาชิก">
    <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl sm:p-7">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="ปิด"><X size={18} /></button>
      <p className="text-sm font-semibold text-orange-700">MEMBER ACCESS</p>
      <h2 className="mt-1 text-2xl font-black">เข้าสู่ระบบสมาชิก</h2>
      <div className="mt-5 flex gap-2 border-b border-slate-200 pb-5">
        <button onClick={() => { setMode("login"); setResult(null); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "login" ? "bg-orange-600 text-white" : "text-slate-500"}`}>เข้าสู่ระบบ</button>
        <button onClick={() => { setMode("register"); setResult(null); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "register" ? "bg-orange-600 text-white" : "text-slate-500"}`}>สมัครสมาชิก</button>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "register" && <>
          <label className="block text-sm text-slate-600">ชื่อผู้ใช้<input required name="username" value={form.username} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-orange-500" /></label>
          <div><p className="text-sm text-slate-600">ประเภทบัญชี</p><div className="mt-1.5 grid grid-cols-2 gap-2">{[["user", UserRound, "User"], ["admin", Shield, "Admin"]].map(([value, Icon, label]) => <button type="button" key={value} onClick={() => setRole(value)} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ${role === value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-500"}`}><Icon size={16} />{label}</button>)}</div></div>
          {role === "admin" && <label className="block text-sm text-slate-600">รหัสสมัคร Admin<input required name="adminCode" type="password" value={form.adminCode} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-orange-500" /></label>}
        </>}
        <label className="block text-sm text-slate-600">อีเมล<input required name="email" type="email" value={form.email} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-orange-500" /></label>
        <label className="block text-sm text-slate-600">รหัสผ่าน<input required minLength="8" name="password" type="password" value={form.password} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-orange-500" /></label>
        <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><LogIn size={17} />{loading ? "กำลังส่ง..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button>
      </form>
      {result && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-bold">{result.message}</p></div>}
    </div>
  </div>;
}
