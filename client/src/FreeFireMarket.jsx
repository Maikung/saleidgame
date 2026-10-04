import { useEffect, useState } from "react";
import { Check, Gamepad2, ImagePlus, Search, ShoppingCart, Pencil, Plus, Trash2 } from "lucide-react";
import { upload } from "@vercel/blob/client";

const blank = { title: "", description: "", price: "", level: "", rank: "", diamonds: 0, skinCount: 0, loginMethod: "facebook", imageUrl: "", status: "available" };

async function api(path, options = {}) {
  const token = localStorage.getItem("saleidgame_token");
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `Request failed (HTTP ${res.status})`);
  return data;
}

export default function FreeFireMarket({ preview = false, authenticatedUser = null, onNeedLogin, purchaseAfterLogin = null, onPurchaseHandled }) {
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => { setUser(authenticatedUser); }, [authenticatedUser]);
  const message = (value) => { setNotice(value); setTimeout(() => setNotice(""), 3000); };
  const load = async () => { try { setAccounts((await api("/api/freefire-accounts")).accounts); } catch (error) { message(error.message); } };
  const session = async () => { try { setUser((await api("/api/auth/me")).user); } catch { setUser(null); } };
  useEffect(() => { load(); session(); }, []);

  const admin = user?.role === "admin";
  const matchingAccounts = accounts.filter((account) => `${account.title} ${account.rank} ${account.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const displayedAccounts = preview ? matchingAccounts.slice(0, 3) : matchingAccounts;

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
      const blob = await upload(`account-images/${file.name}`, file, { access: "public", handleUploadUrl: "/api/uploads/client", headers: { Authorization: `Bearer ${token}` } });
      setForm((current) => ({ ...current, imageUrl: blob.url }));
      message("Image uploaded");
    } catch (error) { message(error.message || "Image upload failed"); }
    finally { setUploading(false); event.target.value = ""; }
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      const data = { ...form, price: +form.price, level: +form.level, diamonds: +form.diamonds, skinCount: +form.skinCount };
      await api(editing ? `/api/freefire-accounts/${editing}` : "/api/freefire-accounts", { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) });
      setEditing(null); setForm(blank); message("บันทึกรายการสำเร็จ"); load();
    } catch (error) { message(error.message); }
  };
  const edit = (account) => { setEditing(account._id); setForm({ ...account }); document.getElementById("admin-form")?.scrollIntoView({ behavior: "smooth" }); };
  const remove = async (id) => {
    if (!confirm("ต้องการลบไอดีนี้หรือไม่?")) return;
    try { await api(`/api/freefire-accounts/${id}`, { method: "DELETE" }); message("ลบรายการแล้ว"); load(); }
    catch (error) { message(error.message); }
  };
  const buy = async (id) => {
    if (preview) return onNeedLogin?.(id);
    try { await api(`/api/freefire-accounts/${id}/buy`, { method: "POST" }); message("ส่งคำขอซื้อสำเร็จ"); load(); }
    catch (error) { message(error.message); }
  };
  useEffect(() => {
    if (!purchaseAfterLogin || !authenticatedUser) return;
    onPurchaseHandled?.();
    buy(purchaseAfterLogin);
  }, [purchaseAfterLogin, authenticatedUser]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-10 w-full max-w-lg items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-slate-400 shadow-sm focus-within:border-slate-500">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาไอดี แรงค์ หรือรายละเอียด" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
        </label>
        {user && <span className="text-xs text-slate-500">บัญชี: {user.username || user.email}</span>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="relative isolate flex min-h-[250px] overflow-hidden rounded-md bg-[#111719] px-6 py-8 text-white sm:min-h-[285px] sm:px-10 sm:py-9">
          <div className="absolute -right-20 -top-36 -z-10 size-[440px] rounded-full border-[34px] border-[#f5e83b]/80 sm:-right-14 sm:size-[520px]" />
          <div className="absolute right-12 top-12 -z-10 grid size-24 rotate-6 place-items-center rounded-2xl border-[5px] border-slate-950 bg-[#f5e83b] text-slate-950 shadow-2xl sm:right-28 sm:top-16 sm:size-32"><Gamepad2 size={44} /></div>
          <div className="my-auto max-w-xl">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#f5e83b]">SALEIDGAME · FREE FIRE</p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">ไอดี Free Fire<br /><span className="text-[#f5e83b]">พร้อมให้คุณเลือก</span></h1>
            <p className="mt-3 max-w-md text-sm text-slate-300">ดูรายละเอียด แรงค์ เลเวล และไอเทมของแต่ละไอดีก่อนตัดสินใจ</p>
            <a href="#catalogue" className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#f5e83b] px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-yellow-300">ดูไอดีทั้งหมด <span aria-hidden="true">→</span></a>
          </div>
          <span className="absolute bottom-4 right-5 hidden text-xs font-bold tracking-widest text-white/50 sm:block">BATTLE IN STYLE</span>
        </section>

        <aside id="how-to-buy" className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="font-bold">เลือกซื้อไอดี Free Fire</h2><Gamepad2 size={18} className="text-orange-600" /></div>
          <ol className="mt-2 divide-y divide-slate-100">
            <li className="flex gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f5e83b] text-xs font-black">1</span><div><p className="text-sm font-semibold">เลือกไอดีที่สนใจ</p><p className="mt-1 text-xs text-slate-500">ตรวจดูข้อมูลและสถานะพร้อมขาย</p></div></li>
            <li className="flex gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f5e83b] text-xs font-black">2</span><div><p className="text-sm font-semibold">เข้าสู่ระบบเพื่อซื้อ</p><p className="mt-1 text-xs text-slate-500">ระบบจะส่งคำขอซื้อไอดีที่เลือก</p></div></li>
            <li className="flex gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f5e83b] text-xs font-black">3</span><div><p className="text-sm font-semibold">รอการยืนยันคำขอ</p><p className="mt-1 text-xs text-slate-500">ไอดีจะถูกจองไว้ระหว่างรอยืนยัน</p></div></li>
          </ol>
        </aside>
      </div>

      <section id="catalogue" className="scroll-mt-24 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold tracking-widest text-orange-600">FREE FIRE ACCOUNTS</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{preview ? "ตัวอย่างไอดี Free Fire" : "ไอดี Free Fire ทั้งหมด"}</h2>{preview && <p className="mt-1 text-xs text-slate-500">กำลังแสดงตัวอย่างสินค้า เข้าสู่ระบบเพื่อดูรายการทั้งหมด</p>}</div>
          <div className="flex items-center gap-3"><span className="text-xs text-slate-500">{displayedAccounts.length} รายการ</span>{!preview && <button onClick={session} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50">{admin ? "Admin mode" : "ตรวจสิทธิ์ Admin"}</button>}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {displayedAccounts.map((account) => (
            <article key={account._id} className="overflow-hidden rounded-md border border-orange-400 bg-white transition-shadow hover:shadow-md">
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#171d20]">
                {account.imageUrl ? <img src={account.imageUrl} alt={account.title} className="size-full object-cover" /> : <><div className="absolute -right-10 -top-16 size-48 rounded-full border-[16px] border-[#f5e83b]/80" /><div className="grid size-20 place-items-center rounded-2xl bg-[#f5e83b] text-slate-950"><Gamepad2 size={38} /></div></>}
                <span className="absolute left-3 top-3 rounded-sm bg-[#f5e83b] px-2 py-1 text-[10px] font-black uppercase text-slate-950">{account.rank || "Free Fire"}</span>
                <span className={`absolute right-3 top-3 rounded-sm px-2 py-1 text-[10px] font-bold ${account.status === "available" ? "bg-white text-slate-800" : "bg-slate-900/80 text-white"}`}>{account.status === "available" ? "พร้อมขาย" : account.status === "reserved" ? "จองแล้ว" : "ขายแล้ว"}</span>
              </div>
              <div className="p-4">
                <h3 className="truncate font-bold" title={account.title}>{account.title}</h3>
                <p className="mt-2 text-xs text-slate-500">Lv.{account.level} <span className="px-1 text-slate-300">·</span> {account.diamonds} เพชร <span className="px-1 text-slate-300">·</span> {account.skinCount} สกิน</p>
                <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-relaxed text-slate-500">{account.description || `เข้าสู่ระบบด้วย ${account.loginMethod}`}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><b className="text-lg text-red-600">฿{Number(account.price || 0).toLocaleString()}</b>
                  {admin ? <span className="flex gap-1.5"><button aria-label="แก้ไขไอดี" onClick={() => edit(account)} className="rounded-md bg-slate-100 p-2 hover:bg-slate-200"><Pencil size={15} /></button><button aria-label="ลบไอดี" onClick={() => remove(account._id)} className="rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100"><Trash2 size={15} /></button></span>
                    : <button disabled={account.status !== "available"} onClick={() => buy(account._id)} className="inline-flex items-center gap-1.5 rounded-md bg-[#f5e83b] px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><ShoppingCart size={14} />{preview ? "เข้าสู่ระบบเพื่อซื้อ" : "ซื้อไอดี"}</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
        {!displayedAccounts.length && <div className="py-12 text-center"><Gamepad2 size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-500">{query ? "ไม่พบไอดีที่ตรงกับคำค้น" : "ยังไม่มีไอดี Free Fire"}</p></div>}
      </section>

      {admin && <form id="admin-form" onSubmit={save} className="scroll-mt-24 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={19} />{editing ? "แก้ไขไอดี" : "เพิ่มไอดี Free Fire"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[["title", "ชื่อไอดี", "text"], ["price", "ราคา", "number"], ["level", "เลเวล", "number"], ["rank", "แรงค์", "text"], ["diamonds", "เพชร", "number"], ["skinCount", "จำนวนสกิน", "number"]].map(([key, label, type]) => <label key={key} className="text-sm">{label}<input required name={key} type={type} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2.5 outline-none focus:border-orange-500" /></label>)}
          <label className="text-sm">วิธี Login<select name="loginMethod" value={form.loginMethod} onChange={(event) => setForm({ ...form, loginMethod: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2.5"><option value="facebook">Facebook</option><option value="google">Google</option><option value="vk">VK</option></select></label>
          <label className="text-sm">สถานะ<select name="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2.5"><option value="available">พร้อมขาย</option><option value="reserved">จองแล้ว</option><option value="sold">ขายแล้ว</option></select></label>
          <label className="text-sm md:col-span-3">รายละเอียด<textarea name="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-200 bg-white p-2.5" rows="3" /></label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><ImagePlus size={16} />{uploading ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพไอดี"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} className="sr-only" /></label>
          {form.imageUrl && <div className="flex items-center gap-2 text-xs text-emerald-700"><Check size={15} />อัปโหลดรูปภาพแล้ว</div>}
        </div>
        <div className="mt-4 flex gap-2"><button disabled={uploading} className="rounded-md bg-[#f5e83b] px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{editing ? "บันทึก" : "เพิ่มรายการ"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold">ยกเลิก</button>}</div>
      </form>}
      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl">{notice}</div>}
    </section>
  );
}
