import { useEffect, useState } from "react";
import { Check, Gamepad2, ImagePlus, Search, ShoppingCart, Pencil, Plus, Trash2, X } from "lucide-react";
import { upload } from "@vercel/blob/client";

const blank = { title: "", description: "", price: "", level: "", rank: "", diamonds: 0, skinCount: 0, loginMethod: "facebook", imageUrl: "", status: "available" };

async function api(path, options = {}) {
  const token = localStorage.getItem("saleidgame_token");
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const text = await res.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); }
    catch {
      throw new Error(`API ${path} ตอบกลับเป็นหน้าเว็บแทนข้อมูล (HTTP ${res.status}) — ตรวจสอบ route ของ API นี้ในการ deploy`);
    }
  }
  if (!res.ok) throw new Error(data.message || `Request failed (HTTP ${res.status})`);
  return data;
}

export default function FreeFireMarket({ preview = false, authenticatedUser = null, onNeedLogin }) {
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [cartIds, setCartIds] = useState(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("saleidgame_cart") || "[]");
      return Array.isArray(savedCart) ? savedCart.filter((id) => typeof id === "string") : [];
    }
    catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => { setUser(authenticatedUser); }, [authenticatedUser]);
  useEffect(() => { localStorage.setItem("saleidgame_cart", JSON.stringify(cartIds)); }, [cartIds]);
  const message = (value) => { setNotice(value); setTimeout(() => setNotice(""), 3000); };
  const load = async () => {
    try {
      const nextAccounts = (await api("/api/freefire-accounts")).accounts;
      setAccounts(nextAccounts);
      setCartIds((current) => current.filter((id) => nextAccounts.some((account) => account._id === id)));
    } catch (error) { message(error.message); }
  };
  const session = async () => { try { setUser((await api("/api/auth/me")).user); } catch { setUser(null); } };
  useEffect(() => { load(); session(); }, []);

  const admin = user?.role === "admin";
  const matchingAccounts = accounts.filter((account) => `${account.title} ${account.rank} ${account.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const displayedAccounts = preview ? matchingAccounts.slice(0, 3) : matchingAccounts;
  const cartItems = cartIds.map((id) => accounts.find((account) => account._id === id)).filter(Boolean);

  const toggleCart = (id) => {
    setCartIds((current) => current.includes(id) ? current.filter((cartId) => cartId !== id) : [...current, id]);
  };
  const checkout = async () => {
    if (!cartItems.length || checkingOut) return;
    if (preview) return onNeedLogin?.();
    const availableItems = cartItems.filter((account) => account.status === "available");
    if (!availableItems.length) return message("ไม่มีไอดีที่พร้อมซื้อในตะกร้า");
    setCheckingOut(true);
    let completed = 0;
    for (const account of availableItems) {
      try {
        await api(`/api/freefire-accounts/${account._id}/buy`, { method: "POST" });
        setCartIds((current) => current.filter((id) => id !== account._id));
        completed += 1;
      } catch (error) {
        message(error.message);
        break;
      }
    }
    if (completed) {
      load();
      if (completed === availableItems.length) message(`ส่งคำขอซื้อ ${completed} ไอดีแล้ว`);
    }
    setCheckingOut(false);
  };

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
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-10 w-full max-w-lg items-center gap-2 rounded-md border border-white/10 bg-[#17181c] px-3 text-slate-400 focus-within:border-white/25">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาไอดี แรงค์ หรือรายละเอียด" className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400" />
        </label>
        <div className="flex items-center gap-3">
          {user && <span className="hidden text-xs text-slate-400 sm:inline">บัญชี: {user.username || user.email}</span>}
          <button onClick={() => setCartOpen(true)} className="relative inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#17181c] px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/20">
            <ShoppingCart size={16} /> ตะกร้า
            <span className="grid min-w-5 place-items-center rounded-full bg-[#f04438] px-1 text-[11px] font-bold text-white">{cartIds.length}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="relative isolate flex min-h-[220px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#17181c] px-6 py-8 text-white sm:min-h-[245px] sm:px-10 sm:py-8">
          <div className="absolute -right-28 -top-48 -z-10 size-[400px] rounded-full border border-[#f04438]/15 sm:-right-16 sm:size-[470px]" />
          <div className="absolute right-10 top-1/2 -z-10 grid size-16 -translate-y-1/2 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#ff6258] sm:right-20 sm:size-20"><Gamepad2 size={44} /></div>
          <div className="my-auto max-w-xl">
            <p className="text-[11px] font-black tracking-[0.2em] text-[#ff6258]">SALEIDGAME · FREE FIRE</p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">ไอดี Free Fire<br /><span className="text-[#ff6258]">พร้อมให้คุณเลือก</span></h1>
            <p className="mt-3 max-w-md text-sm text-slate-300">ดูรายละเอียด แรงค์ เลเวล และไอเทมของแต่ละไอดีก่อนตัดสินใจ</p>
            <a href="#catalogue" className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#f04438] px-4 py-2.5 text-sm font-bold text-white hover:bg-red-400">ดูไอดีทั้งหมด <span aria-hidden="true">→</span></a>
          </div>
          <span className="absolute bottom-4 right-5 hidden text-xs font-bold tracking-widest text-white/50 sm:block">BATTLE IN STYLE</span>
        </section>

        <aside id="how-to-buy" className="rounded-md border border-white/[0.08] bg-[#17181c] p-5">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3"><h2 className="font-bold">เลือกซื้อไอดี Free Fire</h2><Gamepad2 size={18} className="text-orange-600" /></div>
          <ol className="mt-2 divide-y divide-white/[0.07]">
            <li className="flex gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f04438] text-xs font-black">1</span><div><p className="text-sm font-semibold">เลือกไอดีที่สนใจ</p><p className="mt-1 text-xs text-slate-400">ตรวจดูข้อมูลและสถานะพร้อมขาย</p></div></li>
            <li className="flex gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f04438] text-xs font-black">2</span><div><p className="text-sm font-semibold">เข้าสู่ระบบเพื่อซื้อ</p><p className="mt-1 text-xs text-slate-400">ระบบจะส่งคำขอซื้อไอดีที่เลือก</p></div></li>
            <li className="flex gap-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f04438] text-xs font-black">3</span><div><p className="text-sm font-semibold">รอการยืนยันคำขอ</p><p className="mt-1 text-xs text-slate-400">ไอดีจะถูกจองไว้ระหว่างรอยืนยัน</p></div></li>
          </ol>
        </aside>
      </div>

      <section id="catalogue" className="scroll-mt-24 rounded-xl border border-white/[0.08] bg-[#17181c] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold tracking-widest text-orange-600">FREE FIRE ACCOUNTS</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{preview ? "ตัวอย่างไอดี Free Fire" : "ไอดี Free Fire ทั้งหมด"}</h2>{preview && <p className="mt-1 text-xs text-slate-400">กำลังแสดงตัวอย่างสินค้า เข้าสู่ระบบเพื่อดูรายการทั้งหมด</p>}</div>
          <div className="flex items-center gap-3"><span className="text-xs text-slate-400">{displayedAccounts.length} รายการ</span>{!preview && <button onClick={session} className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold hover:bg-white/5">{admin ? "Admin mode" : "ตรวจสิทธิ์ Admin"}</button>}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {displayedAccounts.map((account) => (
            <article key={account._id} className="overflow-hidden rounded-md border border-white/[0.1] bg-[#111216] transition-colors hover:border-white/20">
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#0d0e11]">
                {account.imageUrl ? <img src={account.imageUrl} alt={account.title} className="size-full object-cover" /> : <><div className="absolute -right-10 -top-16 size-48 rounded-full border-[16px] border-[#f04438]/20" /><div className="grid size-20 place-items-center rounded-2xl bg-[#f04438] text-white"><Gamepad2 size={38} /></div></>}
                <span className="absolute left-3 top-3 rounded-sm bg-[#f04438] px-2 py-1 text-[10px] font-black uppercase text-white">{account.rank || "Free Fire"}</span>
                <span className={`absolute right-3 top-3 rounded-sm px-2 py-1 text-[10px] font-bold ${account.status === "available" ? "bg-white text-slate-800" : "bg-slate-900/80 text-white"}`}>{account.status === "available" ? "พร้อมขาย" : account.status === "reserved" ? "จองแล้ว" : "ขายแล้ว"}</span>
              </div>
              <div className="p-4">
                <h3 className="truncate font-bold" title={account.title}>{account.title}</h3>
                <p className="mt-2 text-xs text-slate-400">Lv.{account.level} <span className="px-1 text-slate-300">·</span> {account.diamonds} เพชร <span className="px-1 text-slate-300">·</span> {account.skinCount} สกิน</p>
                <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-relaxed text-slate-400">{account.description || `เข้าสู่ระบบด้วย ${account.loginMethod}`}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3"><b className="text-lg text-[#ff6258]">฿{Number(account.price || 0).toLocaleString()}</b>
                  {admin ? <span className="flex gap-1.5"><button aria-label="แก้ไขไอดี" onClick={() => edit(account)} className="rounded-md bg-white/10 p-2 hover:bg-white/15"><Pencil size={15} /></button><button aria-label="ลบไอดี" onClick={() => remove(account._id)} className="rounded-md bg-red-500/10 p-2 text-[#ff6258] hover:bg-red-500/20"><Trash2 size={15} /></button></span>
                    : <button disabled={account.status !== "available" && !cartIds.includes(account._id)} onClick={() => toggleCart(account._id)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 ${cartIds.includes(account._id) ? "border border-white/15 text-slate-300 hover:bg-white/5" : "bg-[#f04438] text-white hover:bg-red-400"}`}>{cartIds.includes(account._id) ? <Check size={14} /> : <ShoppingCart size={14} />}{cartIds.includes(account._id) ? "อยู่ในตะกร้า" : "ใส่ตะกร้า"}</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
        {!displayedAccounts.length && <div className="py-12 text-center"><Gamepad2 size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-400">{query ? "ไม่พบไอดีที่ตรงกับคำค้น" : "ยังไม่มีไอดี Free Fire"}</p></div>}
      </section>

      {admin && <form id="admin-form" onSubmit={save} className="scroll-mt-24 rounded-md border border-white/[0.08] bg-[#17181c] p-5">
        <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={19} />{editing ? "แก้ไขไอดี" : "เพิ่มไอดี Free Fire"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[["title", "ชื่อไอดี", "text"], ["price", "ราคา", "number"], ["level", "เลเวล", "number"], ["rank", "แรงค์", "text"], ["diamonds", "เพชร", "number"], ["skinCount", "จำนวนสกิน", "number"]].map(([key, label, type]) => <label key={key} className="text-sm">{label}<input required name={key} type={type} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 block w-full rounded-md border border-white/10 bg-[#101114] p-2.5 outline-none focus:border-orange-500" /></label>)}
          <label className="text-sm">วิธี Login<select name="loginMethod" value={form.loginMethod} onChange={(event) => setForm({ ...form, loginMethod: event.target.value })} className="mt-1 block w-full rounded-md border border-white/10 bg-[#101114] p-2.5"><option value="facebook">Facebook</option><option value="google">Google</option><option value="vk">VK</option></select></label>
          <label className="text-sm">สถานะ<select name="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 block w-full rounded-md border border-white/10 bg-[#101114] p-2.5"><option value="available">พร้อมขาย</option><option value="reserved">จองแล้ว</option><option value="sold">ขายแล้ว</option></select></label>
          <label className="text-sm md:col-span-3">รายละเอียด<textarea name="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-md border border-white/10 bg-[#101114] p-2.5" rows="3" /></label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300"><ImagePlus size={16} />{uploading ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพไอดี"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} className="sr-only" /></label>
          {form.imageUrl && <div className="flex items-center gap-2 text-xs text-emerald-300"><Check size={15} />อัปโหลดรูปภาพแล้ว</div>}
        </div>
        <div className="mt-4 flex gap-2"><button disabled={uploading} className="rounded-md bg-[#f04438] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{editing ? "บันทึก" : "เพิ่มรายการ"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-bold">ยกเลิก</button>}</div>
      </form>}
      {cartOpen && <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <aside role="dialog" aria-modal="true" aria-label="ตะกร้าสินค้า" className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#141519] text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div><h2 className="text-lg font-bold">ตะกร้าของคุณ</h2><p className="mt-1 text-xs text-slate-400">{cartItems.length} ไอดี</p></div>
            <button onClick={() => setCartOpen(false)} aria-label="ปิดตะกร้า" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!cartItems.length && <div className="grid h-full place-content-center text-center"><ShoppingCart size={30} className="mx-auto text-slate-600" /><p className="mt-3 text-sm text-slate-300">ยังไม่มีไอดีในตะกร้า</p><p className="mt-1 text-xs text-slate-500">เลือกไอดีที่ต้องการจากรายการสินค้า</p></div>}
            {cartItems.map((account) => <article key={account._id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              {account.imageUrl ? <img src={account.imageUrl} alt="" className="size-16 shrink-0 rounded-md object-cover" /> : <div className="grid size-16 shrink-0 place-items-center rounded-md bg-[#f04438]/10 text-[#ff6258]"><Gamepad2 size={25} /></div>}
              <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{account.title}</h3><p className="mt-1 text-xs text-slate-400">{account.rank} · Lv.{account.level}</p><p className={`mt-1 text-[11px] ${account.status === "available" ? "text-emerald-400" : "text-amber-300"}`}>{account.status === "available" ? "พร้อมซื้อ" : "ไอดีนี้ไม่พร้อมขาย"}</p><b className="mt-1 block text-sm text-[#ff6258]">฿{Number(account.price || 0).toLocaleString()}</b></div>
              <button onClick={() => toggleCart(account._id)} aria-label={`ลบ ${account.title} ออกจากตะกร้า`} className="self-start rounded-md p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16} /></button>
            </article>)}
          </div>
          <div className="border-t border-white/10 p-5">
            <div className="mb-4 flex items-center justify-between text-sm"><span className="text-slate-400">รวมทั้งหมด</span><b className="text-lg">฿{cartItems.reduce((sum, account) => sum + Number(account.price || 0), 0).toLocaleString()}</b></div>
            <button onClick={checkout} disabled={!cartItems.some((account) => account.status === "available") || checkingOut} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f04438] px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">{checkingOut ? "กำลังส่งคำขอซื้อ..." : preview ? "เข้าสู่ระบบเพื่อสั่งซื้อ" : "ยืนยันสั่งซื้อ"}</button>
            <p className="mt-2 text-center text-[11px] text-slate-500">รายการจะถูกจองเมื่อยืนยันสั่งซื้อเท่านั้น</p>
          </div>
        </aside>
      </div>}
      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl">{notice}</div>}
    </section>
  );
}
