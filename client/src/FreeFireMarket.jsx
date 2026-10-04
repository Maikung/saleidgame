import { useEffect, useState } from "react";
import { Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { upload } from "@vercel/blob/client";

const base = "";
const blank = { title: "", description: "", price: "", level: "", rank: "", diamonds: 0, skinCount: 0, loginMethod: "facebook", imageUrl: "", status: "available" };
async function api(path, options = {}) {
  const token = localStorage.getItem("saleidgame_token");
  const res = await fetch(`${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const text = await res.text(); const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `Request failed (HTTP ${res.status})`);
  return data;
}

export default function FreeFireMarket({ preview = false, authenticatedUser = null, onNeedLogin, purchaseAfterLogin = null, onPurchaseHandled }) {
  const [accounts, setAccounts] = useState([]); const [user, setUser] = useState(null); const [form, setForm] = useState(blank); const [editing, setEditing] = useState(null); const [notice, setNotice] = useState(""); const [uploading, setUploading] = useState(false);
  useEffect(() => { setUser(authenticatedUser); }, [authenticatedUser]);
  const message = (value) => { setNotice(value); setTimeout(() => setNotice(""), 3000); };
  const load = async () => { try { setAccounts((await api("/api/freefire-accounts")).accounts); } catch (e) { message(e.message); } };
  const session = async () => { try { setUser((await api("/api/auth/me")).user); } catch { setUser(null); } };
  useEffect(() => { load(); session(); }, []);
  const admin = user?.role === "admin";
  const displayedAccounts = preview ? accounts.slice(0, 3) : accounts;
  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) {
      event.target.value = "";
      return message("Choose a JPEG, PNG, or WebP image no larger than 4 MB");
    }
    const token = localStorage.getItem("saleidgame_token");
    if (!token) return message("Please sign in as an admin before uploading");
    setUploading(true);
    try {
      const blob = await upload(`account-images/${file.name}`, file, {
        access: "public", handleUploadUrl: "/api/uploads/client", headers: { Authorization: `Bearer ${token}` },
      });
      setForm((current) => ({ ...current, imageUrl: blob.url }));
      message("Image uploaded");
    } catch (error) { message(error.message || "Image upload failed"); }
    finally { setUploading(false); event.target.value = ""; }
  };
  const save = async (e) => { e.preventDefault(); try { const data = { ...form, price: +form.price, level: +form.level, diamonds: +form.diamonds, skinCount: +form.skinCount }; await api(editing ? `/api/freefire-accounts/${editing}` : "/api/freefire-accounts", { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) }); setEditing(null); setForm(blank); message("บันทึกรายการสำเร็จ"); load(); } catch (error) { message(error.message); } };
  const edit = (a) => { setEditing(a._id); setForm({ ...a }); document.getElementById("admin-form")?.scrollIntoView({ behavior: "smooth" }); };
  const remove = async (id) => { if (!confirm("ต้องการลบไอดีนี้หรือไม่?")) return; try { await api(`/api/freefire-accounts/${id}`, { method: "DELETE" }); message("ลบรายการแล้ว"); load(); } catch (e) { message(e.message); } };
  const buy = async (id) => {
    if (preview) return onNeedLogin?.(id);
    try { await api(`/api/freefire-accounts/${id}/buy`, { method: "POST" }); message("ส่งคำขอซื้อสำเร็จ"); load(); }
    catch (e) { message(e.message); }
  };
  useEffect(() => {
    if (!purchaseAfterLogin || !authenticatedUser) return;
    onPurchaseHandled?.();
    buy(purchaseAfterLogin);
  }, [purchaseAfterLogin, authenticatedUser]);
  return <section className="mx-auto max-w-7xl px-5 py-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-bold text-orange-700">FREE FIRE MARKET</p><h2 className="mt-1 text-3xl font-black">{preview ? "ตัวอย่างไอดี Free Fire" : "ซื้อ-ขายไอดี Free Fire"}</h2>{preview && <p className="mt-2 text-sm text-slate-500">กำลังแสดงตัวอย่างสินค้า เข้าสู่ระบบเพื่อดูรายการทั้งหมด</p>}</div>{!preview && <button onClick={session} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold">{admin ? "Admin mode" : "ตรวจสิทธิ์ Admin"}</button>}</div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{displayedAccounts.map((a) => <article key={a._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex h-28 items-end justify-between bg-gradient-to-br from-orange-100 to-orange-50 p-4"><b>{a.rank}</b><span className="rounded-full bg-black/25 px-3 py-1 text-xs">{a.status}</span></div><div className="p-5"><h3 className="text-lg font-bold">{a.title}</h3><p className="mt-2 text-sm text-slate-500">Lv.{a.level} · {a.diamonds} เพชร · {a.skinCount} สกิน · {a.loginMethod}</p><p className="mt-3 min-h-10 text-sm text-slate-500">{a.description}</p><div className="mt-5 flex items-center justify-between"><b className="text-lg text-orange-700">฿{a.price.toLocaleString()}</b>{admin ? <span className="flex gap-2"><button onClick={() => edit(a)} className="rounded-lg bg-slate-100 p-2"><Pencil size={16}/></button><button onClick={() => remove(a._id)} className="rounded-lg bg-red-500 p-2"><Trash2 size={16}/></button></span> : <button disabled={a.status !== "available"} onClick={() => buy(a._id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><ShoppingCart size={14}/> {preview ? "เข้าสู่ระบบเพื่อซื้อ" : "ซื้อ"}</button>}</div></div></article>)}</div>{!displayedAccounts.length && <p className="py-12 text-center text-slate-500">ยังไม่มีไอดี Free Fire</p>}{admin && <form id="admin-form" onSubmit={save} className="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm p-6"><h3 className="flex items-center gap-2 text-xl font-black"><Plus size={20}/>{editing ? "แก้ไขไอดี" : "เพิ่มไอดี Free Fire"}</h3><div className="mt-5 grid gap-4 md:grid-cols-3">{[["title", "ชื่อรายการ", "text"], ["price", "ราคา", "number"], ["level", "เลเวล", "number"], ["rank", "แรงค์", "text"], ["diamonds", "เพชร", "number"], ["skinCount", "สกิน", "number"]].map(([key, label, type]) => <label key={key} className="text-sm">{label}<input required name={key} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5"/></label>)}<label className="text-sm">วิธี Login<select name="loginMethod" value={form.loginMethod} onChange={(e) => setForm({ ...form, loginMethod: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5"><option value="facebook">Facebook</option><option value="google">Google</option><option value="vk">VK</option></select></label><label className="text-sm">สถานะ<select name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5"><option value="available">พร้อมขาย</option><option value="reserved">จองแล้ว</option><option value="sold">ขายแล้ว</option></select></label><label className="md:col-span-3 text-sm">รายละเอียด<textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5" rows="3"/></label></div><div className="mt-5 flex gap-3"><button className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white">{editing ? "บันทึก" : "เพิ่มรายการ"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold">ยกเลิก</button>}</div></form>}{notice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold shadow-xl">{notice}</div>}</section>;
}
