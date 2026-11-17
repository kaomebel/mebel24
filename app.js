/* =====================================================================
   Mebel 24 — xodimlar va administrator uchun
   Loyiha jarayoni: Lead → O'lchov va narx → Loyihalash → Ishlab chiqarish
   → Yig'ish → O'rnatish → Topshirish → Yopilgan (yakuniy smeta)
   ===================================================================== */
"use strict";
const APP = "Mebel 24";
const APP_VERSION = "1.8";
const CHANGELOG = [
  ["1.8", "17.11.2026", ["Telefonda «+ Xodim», «+ Usluga», «+ Kirim», «+ Chiqim» tugmalari ko'rinmay qolgan xato tuzatildi", "Bosh sahifada administrator uchun «Xodim qo'shish» tugmasi"]],
  ["1.7", "15.11.2026", ["Bank kartasini ulash: kartaga pul tushganda karta orqali to'lov avtomatik «✓ Tasdiqlandi» bo'ladi", "Pul tushganda darhol xabarnoma (xodimga, kassirga, administratorga)", "Moliya: «Bank tushumlari» — loyihaga bog'lanmagan tushumlarni bog'lash"]],
  ["1.6", "14.11.2026", ["Ekranni tepadan pastga tortsangiz ma'lumotlar va ilovaning yangi versiyasi yuklanadi"]],
  ["1.5", "13.11.2026", ["«Jarayonlar» ichida «Ishlab chiqarish» doskasi: material, kesish, kromka, rover, sexga keltirish, furnitura ustunlari", "Kartochkadan bir bosishda keyingi ishlab chiqarish qadamini belgilash"]],
  ["1.4", "13.11.2026", ["Vazifalar Trello'dagidek ustunlarda: har bir bosqich alohida ustun", "Yangi «Jarayonlar» bo'limi: hamma loyihalar qaysi bosqichda ekani bitta doskada", "Pastki menyu: Bosh, Vazifalar, Jarayonlar, Ko'rsatkichlar, Menyu", "Yangi versiya chiqqanda ilovada xabar va «Yangilash» tugmasi"]],
  ["1.3", "13.11.2026", ["Bitta xodimga bir nechta vazifa (rol) berish", "Yangi vazifa: Shofyor (haydovchi)"]],
  ["1.2", "13.11.2026", ["Kirishda faqat login va parol", "Bosh sahifa soddalashtirildi"]],
  ["1.1", "13.11.2026", ["Yangi Mebel 24 logotipi"]],
  ["1.0", "11.11.2026", ["Birinchi versiya: loyihalar, sotuv, moliya, uslugalar, xodimlar"]]
];

/* ---------------- Spravochniklar ---------------- */
const ROLES = {
  admin:{n:"Administrator"}, menejer:{n:"Loyiha menejeri"}, sotuvchi:{n:"Sotuvchi"}, olchovchi:{n:"O'lchovchi"},
  texnolog:{n:"Texnolog / dizayner"}, taminot:{n:"Ta'minotchi"}, yiguvchi:{n:"Yig'uvchi"}, ornatuvchi:{n:"O'rnatuvchi"}, buxgalter:{n:"Buxgalter / kassir"}, haydovchi:{n:"Shofyor (haydovchi)"}
};
const FIN_ROLES = ["admin","buxgalter","menejer"];
const STAGES = [
  {k:"lead", n:"Lead", d:"Mijoz raqami va ehtiyoji yozildi", next:"O'lchovga yuborish"},
  {k:"zamer", n:"O'lchov va narx", d:"Joy o'lchanadi, aniq narx chiqariladi", next:"O'lchov natijasi va mijoz qarori"},
  {k:"loyiha", n:"Loyihalash", d:"3D model, detallar ro'yxati, furnitura hisobi", next:"Chizish va hisobni tugatish"},
  {k:"ishlab", n:"Ishlab chiqarish", d:"Material, kesish, kromka, rover, furnitura", next:"Uslugaga berish va xarajatlarni yozish"},
  {k:"yigish", n:"Yig'ish", d:"Yig'uvchilar va kelishilgan haq", next:"Yig'ishni tugatish"},
  {k:"ornatish", n:"O'rnatish", d:"Mijozga olib borish va o'rnatish", next:"O'rnatishni tugatish"},
  {k:"topshirish", n:"Topshirish", d:"Qoldiq to'lov, mijoz fikri, chala ishlar", next:"Topshirish va loyihani yopish"}
];
const SK = Object.fromEntries(STAGES.map((s, i) => [s.k, {...s, i}]));
const STATUS = {faol:["Jarayonda","accent"], kutish:["O'ylab ko'rmoqda","warn"], rad:["Rad etildi","bad"], yopilgan:["Yopilgan","done"]};
const NEED_TYPES = ["Oshxona","Shkaf-kupe","Shkaf","Yotoqxona","Bolalar xonasi","Mehmonxona","Prixojka","Ofis mebeli","Vanna mebeli","Boshqa"];
const SOURCES = ["Instagram","Telegram","Tanish-bilish","Do'kon (shourum)","Qayta mijoz","Reklama","Boshqa"];
const REFUSE = [["qimmat","Narx qimmatlik qildi"],["joyiga","Joyiga yoki dizayniga mos kelmadi"],["kutib","Ko'p kutib qoldi"],["qoniqmadi","Ishimiz yoki xizmatimiz qoniqtirmadi"],["ishonmadi","Bizga ishonmadi"],["boshqa_joy","Boshqa joydan oldi"],["boshqa","Boshqa sabab"]];
const FOLLOW = [[3,"3 kundan keyin"],[7,"1 haftadan keyin"],[14,"2 haftadan keyin"],[30,"1 oydan keyin"]];
const PAY_KINDS = {zaklat:"Oldindan to'lov (zaklat)", oraliq:"Oraliq to'lov", qoldiq:"Qoldiq to'lov", qoshimcha:"Qo'shimcha xizmat"};
const PAY_METHODS = {naqd:"Naqd", karta:"Karta", otkazma:"Bank o'tkazmasi"};
const EXP = {
  material:{n:"Material (plita, DVP)", st:"ishlab"}, kesish:{n:"Kesish (arra)", st:"ishlab"}, kromka:{n:"Kromkalash", st:"ishlab"}, rover:{n:"Rover (CNC)", st:"ishlab"},
  yol_sex:{n:"Yo'l kira: usluga → sex", st:"ishlab"}, furnitura:{n:"Furnitura va aksessuar", st:"ishlab"}, yigish:{n:"Yig'ish (ish haqi)", st:"yigish"},
  yol_mijoz:{n:"Yo'l kira: sex → mijoz", st:"ornatish"}, ornatish:{n:"O'rnatish (ish haqi)", st:"ornatish"}, boshqa:{n:"Boshqa loyiha xarajati", st:""}
};
const EXP_GENERAL = {ijara:"Ijara", oylik:"Oylik maosh", kommunal:"Kommunal", reklama:"Reklama", transport:"Transport", soliq:"Soliq", umumiy:"Boshqa umumiy xarajat"};
const FURN_TYPES = ["Ruchka","Nojka (oyoq)","Shurup va mahkamlagich","Petlya","Mexanizm","Salaska (yo'naltiruvchi)","Aksessuar","Boshqa"];
const SAWS = ["Altendorf","Pilni sentr"];
const EDGE_TYPES = ["0.4 mm","1 mm","2 mm"];
const COMPLAINTS = [["sifat","Sifat"],["muddat","Muddat kechikdi"],["rang","Rang yoki material"],["olcham","O'lcham"],["furnitura","Furnitura"],["ornatish","O'rnatish"],["tozalik","Tozalik"],["muomala","Xodimlar muomalasi"],["boshqa","Boshqa"]];
const PROD_CHECKS = [["material","Material sotib olindi"],["kesishga","Kesishga berildi"],["kesildi","Kesildi"],["kromka","Kromkalandi"],["rover","Rover qilindi"],["keltirildi","Sexga keltirildi"],["furnitura","Furnitura olindi"]];
const NAV = [
  ["bosh","Bosh sahifa","all"],["vazifalar","Vazifalarim","all"],["jarayonlar","Jarayonlar","all"],["loyihalar","Loyihalar","all"],
  ["sotuv","Sotuv",["admin","menejer","sotuvchi"]],["moliya","Moliya",FIN_ROLES],["uslugalar","Uslugalar",["admin","menejer","taminot"]],
  ["xodimlar","Xodimlar",["admin"]],["sozlamalar","Sozlamalar","all"]
];
const ICON = {
  bosh:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  vazifalar:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  jarayonlar:'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>',
  korsatkich:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  loyihalar:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16"/>',
  sotuv:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  moliya:'<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>',
  uslugalar:'<path d="M3 21V9l6 4V9l6 4V5l6 4v12z"/>',
  xodimlar:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.3"/><path d="M16 14.2c2.8.2 5 2.6 5 5.8"/>',
  sozlamalar:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', out:'<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  check:'<path d="M5 12l5 5L20 7"/>', back:'<path d="M15 18l-6-6 6-6"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
};
const ic = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ""}</svg>`;

/* ---------------- Yordamchilar ---------------- */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = v => { const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const money = n => { n = Math.round(num(n)); return (n < 0 ? "−" : "") + grp(Math.abs(n)) + " so'm"; };
const mshort = n => { n = num(n); const a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(2).replace(".", ",") + " mlrd"; if (a >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " mln"; if (a >= 1e3) return Math.round(n / 1e3) + " ming"; return String(Math.round(n)); };
const sum = (a, f) => (a || []).reduce((s, x) => s + (num(f(x)) || 0), 0);
const clone = o => JSON.parse(JSON.stringify(o));
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const addDays = (n, from) => { const d = new Date((from || today()) + "T12:00:00"); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
const fdate = d => d ? String(d).slice(0, 10).split("-").reverse().join(".") : "—";
const nowStr = () => new Date().toLocaleString("ru-RU", {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"}).replace(",", "");
const pill = (t, tone = "") => `<span class="pill ${tone}">${esc(t)}</span>`;
const pno = p => "№ " + String(p.no || "—").padStart(4, "0");
const userName = id => ST.users.find(u => u.id === id)?.name || "—";
const svcName = id => ST.services.find(s => s.id === id)?.name || "—";
/* Xodimda bir nechta vazifa (rol) bo'lishi mumkin: roles massivi, role — asosiysi */
const rolesOf = u => (u && Array.isArray(u.roles) && u.roles.length ? u.roles : u && u.role ? [u.role] : []);
const roleNames = u => rolesOf(u).map(r => ROLES[r]?.n || r).join(", ");
const role = () => ST.me?.role;
const myRoles = () => rolesOf(ST.me);
const isRole = (...r) => r.some(x => myRoles().includes(x));
const canFin = () => isRole(...FIN_ROLES);
const navAllowed = k => { const n = NAV.find(x => x[0] === k); return n && (n[2] === "all" || isRole(...n[2])); };

/* ---------------- Holat ---------------- */
const B = makeBackend();
const ST = {me:null, users:[], services:[], projects:[], payments:[], expenses:[], settings:{}, paid:{}, loaded:false};
const UI = {route:"bosh", ptab:"jarayon", ltab:"faol", lstage:"", q:"", lview:"list", period:"oy", modal:null, menu:false, loginMode:"xodim", busy:false};

async function reload(){
  try { const d = await B.loadAll(); bankDiff(d); Object.assign(ST, d, {loaded:true}); ST.me = B.current(); }
  catch (e) { toast(e.message || String(e)); }
  schedule();
}
/* Bank xabarnomalari: tasdiq kutgan to'lov tasdiqlansa yoki kartaga yangi pul tushsa */
const SEEN = {init:false, pend:new Set(), tx:new Set()};
function bankDiff(d){
  const pays = d.payments || [], txs = d.bankTx || [];
  if (SEEN.init){
    pays.filter(p => p.status === "tasdiqlangan" && p.bank_tx_id && SEEN.pend.has(p.id)).forEach(p => {
      const pr = (d.projects || []).find(x => x.id === p.project_id);
      notify(`✓ Tasdiqlandi: ${money(p.amount)} kartaga tushdi`, pr ? `${pno(pr)} · ${projectTitle(pr)} · ${userName(p.created_by)}` : "", pr ? "p-" + pr.id : "");
    });
    txs.filter(t => !SEEN.tx.has(t.id) && t.direction === "in" && !t.matched_payment_id && !pays.some(p => p.bank_tx_id === t.id) && Date.now() - new Date(t.created_at) < 30 * 60e3)
      .forEach(t => notify(`Kartaga ${money(t.amount)} tushdi`, "Hali loyihaga bog'lanmagan. Moliya bo'limida bog'lang", "moliya", "warn"));
  }
  SEEN.pend = new Set(pays.filter(p => p.status === "kutilmoqda").map(p => p.id));
  txs.forEach(t => SEEN.tx.add(t.id)); SEEN.init = true;
}
function notify(title, text, href, tone = "ok"){
  const host = $("#notifs") || (() => { const h = document.createElement("div"); h.id = "notifs"; document.body.appendChild(h); return h; })();
  const el = document.createElement("a"); el.className = "notif " + tone; if (href) el.href = "#" + href;
  el.innerHTML = `<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ""}`;
  el.addEventListener("click", () => el.remove());
  host.prepend(el); setTimeout(() => el.remove(), 12000);
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {}
  try { if (document.hidden && "Notification" in window && Notification.permission === "granted") new Notification(title, {body:text, icon:"icons/icon-192.png"}); } catch (e) {}
}
const payBadge = x => x.status === "kutilmoqda" ? pill("⏳ Bank tasdig'i kutilmoqda", "warn") : x.bank_tx_id ? pill("✓ Kartaga tushdi", "ok") : "";
let raf = 0; function schedule(){ if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }

/* ---------------- Hisob-kitob ---------------- */
const projectPrice = p => num(p.sale?.price || p.zamer?.exactPrice || p.lead?.approxPrice);
const projectExtra = p => num(p.hand?.extraPrice);
const projectPaid = p => num(ST.paid[p.id]);
const projectCost = p => sum(ST.expenses.filter(x => x.project_id === p.id), x => x.amount);
const projectDebt = p => p.sale ? Math.max(0, projectPrice(p) + projectExtra(p) - projectPaid(p)) : 0;
const projectTitle = p => p.client?.name || p.client?.phone || "Mijoz";
const needText = p => [...(p.need?.types || [])].join(", ") || p.need?.desc || "—";
function inPeriod(d, per = UI.period){
  if (!d) return false; d = String(d).slice(0, 10); const t = today();
  if (per === "oy") return d.slice(0, 7) === t.slice(0, 7);
  if (per === "otgan"){ const x = new Date(t + "T12:00:00"); x.setDate(1); x.setMonth(x.getMonth() - 1); return d.slice(0, 7) === x.toISOString().slice(0, 7); }
  if (per === "3oy") return d >= addDays(-90);
  if (per === "yil") return d.slice(0, 4) === t.slice(0, 4);
  return true;
}
const PERIODS = [["oy","Bu oy"],["otgan","O'tgan oy"],["3oy","3 oy"],["yil","Bu yil"],["hammasi","Hammasi"]];
const periodChips = () => `<div class="chips">${PERIODS.map(([k, n]) => `<button class="chip ${UI.period === k ? "on" : ""}" data-act="period" data-v="${k}">${n}</button>`).join("")}</div>`;

/* Kimga qaysi qadam: vazifalar */
function nextStep(p){
  if (p.status === "kutish") return {t:`Qayta aloqa: ${fdate(p.decision?.followup)}`, who:p.sellerId, due:p.decision?.followup};
  if (p.status !== "faol") return null;
  switch (p.stage){
    case "lead": return {t:"O'lchovga yuborish", who:p.sellerId};
    case "zamer": return p.zamer?.doneDate ? {t:"Mijoz qarorini yozish", who:p.sellerId} : {t:`O'lchash${p.zamer?.plannedDate ? " — " + fdate(p.zamer.plannedDate) : ""}`, who:p.zamer?.assignedTo, due:p.zamer?.plannedDate};
    case "loyiha": return {t:"Chizish, detallar va furnitura hisobi", who:p.design?.by || p.managerId};
    case "ishlab": return {t:"Uslugaga berish, kesish, kromka", who:p.managerId};
    case "yigish": return {t:"Yig'ish", who:(p.asm?.workers || [])[0]?.id || p.managerId, all:(p.asm?.workers || []).map(w => w.id)};
    case "ornatish": return {t:`O'rnatish${p.install?.date ? " — " + fdate(p.install.date) : ""}`, who:(p.install?.team || [])[0] || p.managerId, all:p.install?.team || [], due:p.install?.date};
    case "topshirish": return {t:"Topshirish va qoldiq to'lov", who:p.managerId || p.sellerId};
  }
  return null;
}
function myTasks(){
  const me = ST.me?.id;
  return ST.projects.filter(p => {
    const s = nextStep(p); if (!s) return false;
    if (isRole("admin")) return true;
    if (s.who === me || (s.all || []).includes(me) || p.managerId === me && p.status === "faol") return true;
    if (isRole("texnolog") && p.stage === "loyiha" && p.status === "faol" && !p.design?.by) return true;
    if (isRole("taminot") && p.stage === "ishlab" && p.status === "faol") return true;
    if (isRole("olchovchi") && p.stage === "zamer" && p.status === "faol" && !p.zamer?.assignedTo) return true;
    return false;
  }).map(p => ({p, s:nextStep(p)})).sort((a, b) => (a.s.due || "9999").localeCompare(b.s.due || "9999"));
}

/* ---------------- Ko'rinish: qobiq ---------------- */
function render(){
  const root = $("#root");
  const ae = document.activeElement; const fid = ae && ae.id && root.contains(ae) ? ae.id : null;
  let sel = null; try { if (fid && ae.selectionStart != null) sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) {}
  const sy = window.scrollY;
  try {
    if (!ST.me) root.innerHTML = loginHTML();
    else root.innerHTML = shellHTML();
  } catch (e) { console.error(e); root.innerHTML = `<div class="wrap"><div class="card pad"><h2>Xato yuz berdi</h2><p class="muted">Ma'lumotlaringiz saqlangan. Sahifani yangilang.</p><pre class="mono small">${esc(e.stack || e)}</pre></div></div>`; }
  window.scrollTo(0, sy);
  if (fid){ const el = document.getElementById(fid); if (el){ try { el.focus({preventScroll:true}); if (sel && el.setSelectionRange) el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
  if (UI.modal !== UI.modalShown) renderModal();
  // Doskada birinchi ishli ustunga surib qo'yish (bo'sh ustunlar oldinda bo'lsa)
  document.querySelectorAll(".board.tb").forEach(bd => { const c = [...bd.querySelectorAll(".col")].find(x => x.querySelector(".tcard")); if (c && bd.scrollLeft === 0 && c !== bd.firstElementChild) bd.scrollLeft = Math.max(0, c.offsetLeft - bd.offsetLeft - 16); });
}
function shellHTML(){
  if (!navAllowed(UI.route.split("-")[0]) && !UI.route.startsWith("p-")) UI.route = "bosh";
  const nav = NAV.filter(n => navAllowed(n[0]));
  const cnt = {vazifalar: myTasks().length, jarayonlar: ST.projects.filter(p => p.status === "faol").length};
  const cur = UI.route.startsWith("p-") ? (UI.from || "jarayonlar") : UI.route;
  const side = `<aside class="side"><div class="brand"><span class="mark"><img src="icons/logo-mark.png" alt="Mebel 24"></span><div><b>${esc(APP)}</b><small>${esc(ST.settings.company || "Loyihalar boshqaruvi")}</small></div></div>
    <button class="btn pri big" data-act="newProject" style="width:100%;justify-content:center">${ic("plus", 18)} Yangi loyiha</button>
    <nav>${nav.map(([k, n]) => `<a href="#${k}" class="${cur === k ? "on" : ""}">${ic(k)}<span>${esc(n)}</span>${cnt[k] ? `<em>${cnt[k]}</em>` : ""}</a>`).join("")}</nav>
    <div class="me"><div><b>${esc(ST.me.name)}</b><small>${esc(roleNames(ST.me))}</small></div><button class="iconbtn" data-act="logout" title="Chiqish" aria-label="Chiqish">${ic("out")}</button></div></aside>`;
  const kTarget = navAllowed("sotuv") ? "sotuv" : navAllowed("moliya") ? "moliya" : "loyihalar";
  const tabs = [["bosh","bosh","Bosh"],["vazifalar","vazifalar","Vazifalar"],["jarayonlar","jarayonlar","Jarayonlar"],["korsatkich",kTarget,kTarget === "loyihalar" ? "Loyihalar" : "Ko'rsatkichlar"]];
  const bottom = tabs.map(([icn, href, lbl]) => `<a class="tab ${cur === href ? "on" : ""}" href="#${href}">${ic(icn)}<span>${lbl}</span>${cnt[href] ? `<em>${cnt[href]}</em>` : ""}</a>`).join("") + `<button class="tab ${UI.menu ? "on" : ""}" data-act="menu">${ic("menu")}<span>Menyu</span></button>`;
  const menu = UI.menu ? `<div class="sheet-scrim" data-act="menu"></div><div class="sheet"><div class="me"><div><b>${esc(ST.me.name)}</b><small>${esc(roleNames(ST.me))}</small></div></div><button class="btn pri big" data-act="newProject" style="margin:4px 0 8px">${ic("plus", 18)} Yangi loyiha</button>${nav.map(([k, n]) => `<a href="#${k}" class="${cur === k ? "on" : ""}">${ic(k)}<span>${esc(n)}</span></a>`).join("")}<button class="sheet-out" data-act="logout">${ic("out")} Chiqish</button></div>` : "";
  let view = "";
  try { view = UI.route.startsWith("p-") ? vProject(UI.route.slice(2)) : (VIEWS[UI.route] || VIEWS.bosh)(); }
  catch (e) { console.error(e); view = `<div class="card pad"><h2>Bu bo'limda xato</h2><p class="muted">Boshqa bo'limga o'tib qayting.</p><pre class="mono small">${esc(e.stack || e)}</pre></div>`; }
  const demo = B.mode === "local" ? `<div class="demo">Sinov rejimi: ma'lumotlar faqat shu brauzerda saqlanadi.</div>` : "";
  return `${demo}${updateBannerHTML()}<div class="shell">${side}<main class="main"><div class="wrap">${view}</div></main></div><nav class="bottom">${bottom}</nav>${menu}`;
}

/* ---------------- Kirish ---------------- */
function loginHTML(){
  const boot = UI.needsBootstrap;
  const m = UI.loginMode;
  const demo = B.mode === "local" && !boot ? `<div class="demo-logins"><div class="small muted">Sinov uchun tayyor loginlar (bosing):</div>${[["admin","123456","Administrator"],["dilshod","111111","Sotuvchi"],["jasur","222222","O'lchovchi"],["nodira","333333","Texnolog"],["bekzod","444444","Menejer"],["rustam","555555","Yig'uvchi"]].map(([l, pw, r]) => `<button class="chip" data-act="demoFill" data-l="${l}" data-p="${pw}">${l} · ${r}</button>`).join("")}</div>` : "";
  return `<div class="login"><div class="login-card">
    <div class="brand big"><span class="mark"><img src="icons/logo-mark.png" alt="Mebel 24"></span><div><b>${esc(APP)}</b><small>${esc(ST.settings?.company || "Mebel loyihalari boshqaruvi")}</small></div></div>
    ${boot ? `<h1>Birinchi administrator</h1><p class="muted">Tizimda hali hech kim yo'q. Administrator hisobini yarating: keyin u xodimlarni qo'shadi.</p>
      <form id="bootForm" class="stack"><div class="fld"><label for="b-name">Ismingiz</label><input class="inp" id="b-name" name="name" required autocomplete="name"></div>
      <div class="fld"><label for="b-login">Login</label><input class="inp" id="b-login" name="login" required autocomplete="username" autocapitalize="none" placeholder="masalan: admin"></div>
      <div class="fld"><label for="b-pass">Parol (kamida 6 belgi)</label><input class="inp" id="b-pass" name="password" type="password" required autocomplete="new-password"></div>
      <button class="btn pri big" type="submit">Yaratish va kirish</button></form>`
    : `<h1>Kirish</h1>
      <form id="loginForm" class="stack"><div class="fld"><label for="l-login">Login</label><input class="inp big" id="l-login" name="login" required autocomplete="username" autocapitalize="none" value="${esc(UI.lastLogin || "")}"></div>
      <div class="fld"><label for="l-pass">Parol</label><input class="inp big" id="l-pass" name="password" type="password" required autocomplete="current-password"></div>
      ${UI.loginErr ? `<div class="err">${esc(UI.loginErr)}</div>` : ""}
      <button class="btn pri big" type="submit" ${UI.busy ? "disabled" : ""}>${UI.busy ? "Kirilmoqda…" : "Kirish"}</button></form>
      ${installHTML(true) ? `<div style="margin:-4px 0 0">${installHTML(true)}</div>` : ""}
      <p class="small muted" style="margin:0">Login va parolni administrator beradi. Esingizdan chiqqan bo'lsa, administratorga murojaat qiling.</p>${demo}`}
  </div></div>`;
}

/* ---------------- Ilovani o'rnatish ---------------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; schedule(); });
window.addEventListener("appinstalled", () => { installEvt = null; toast("Mebel 24 o'rnatildi"); schedule(); });
const isStandalone = () => { try { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } };
const inFrame = () => { try { return window.top !== window; } catch (e) { return true; } };
function installHTML(force){
  if (isStandalone() || inFrame()) return "";
  if (!force && safeLS.get("mebel24:install-hide")) return "";
  const ua = navigator.userAgent; const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  const steps = ios ? `<ol><li>Safari'da pastdagi «Ulashish» belgisini bosing (kvadrat va yuqoriga strelka)</li><li>«Ekranga qo'shish» (Add to Home Screen) ni tanlang</li><li>«Qo'shish» ni bosing</li></ol>`
    : installEvt ? "" : `<ol><li>Brauzer menyusini oching (⋮ yoki manzil qatoridagi belgi)</li><li>«Ilovani o'rnatish» yoki «Bosh ekranga qo'shish» ni tanlang</li></ol>`;
  return `<div class="install"><div><b>Mebel 24 ni ${ios ? "iPhone'ga" : "qurilmangizga"} ilova qilib o'rnating</b><span class="small muted">Bosh ekrandan bir bosishda ochiladi, internet sekin bo'lsa ham tez ishlaydi.</span>${steps}</div><div class="actions" style="margin:0">${installEvt ? `<button class="btn pri" data-act="install">O'rnatish</button>` : ""}${force ? "" : `<button class="btn sm" data-act="installHide">Keyinroq</button>`}</div></div>`;
}

/* ---------------- Bosh sahifa ---------------- */
function vBosh(){
  const act = ST.projects.filter(p => p.status === "faol");
  const tasks = myTasks();
  const due = ST.projects.filter(p => p.status === "kutish" && p.decision?.followup && p.decision.followup <= today());
  const monthLeads = ST.projects.filter(p => inPeriod(p.created_at, "oy"));
  const monthSold = ST.projects.filter(p => inPeriod(p.sale?.date, "oy"));

  let h = installHTML();
  if (isRole("admin")) h += `<div class="team-cta"><div><b>Jamoa: ${ST.users.filter(u => u.active !== false).length} xodim</b><span class="small muted">Yangi xodim qo'shing va unga login hamda parol bering</span></div><div class="actions" style="margin:0"><button class="btn pri" data-act="userEdit" data-id="">+ Xodim qo'shish</button><a class="btn" href="#xodimlar">Xodimlar</a></div></div>`;
  const k = [];
  k.push(["Vazifalarim", tasks.length, "", "#vazifalar"]);
  k.push(["Jarayondagi loyihalar", act.length, "", "#loyihalar"]);
  k.push(["Qayta aloqa kerak", due.length, due.length ? "warn" : "", "#loyihalar"]);
  if (canFin()){
    k.push(["Bu oy tushum", mshort(sum(ST.payments.filter(p => inPeriod(p.date, "oy")), p => p.amount)), "", "#moliya"]);
    k.push(["Qarzdorlik", mshort(sum(ST.projects, projectDebt)), "", "#moliya"]);
    const pend = ST.payments.filter(x => x.status === "kutilmoqda").length; if ((ST.bankSources || []).some(x => x.active)) k.push(["Bank tasdig'i kutilmoqda", pend, pend ? "warn" : "", "#moliya"]);
  } else { k.push(["Bu oy leadlar", monthLeads.length, "", "#loyihalar"]); k.push(["Bu oy sotildi", monthSold.length, "", "#loyihalar"]); }
  h += `<div class="kpis">${k.map(([l, v, t, href]) => `<a class="kpi ${t}" href="${href}"><span>${esc(l)}</span><b>${v}</b></a>`).join("")}</div>`;
  // Bosqichlar bo'yicha
  h += `<div class="card"><div class="card-h"><h2>Loyihalar bosqichlarda</h2><a class="small" href="#loyihalar">Hammasi</a></div><div class="stagebar">${STAGES.map(s => { const n = act.filter(p => p.stage === s.k).length; return `<button class="stg ${n ? "" : "zero"}" data-act="gotoStage" data-v="${s.k}"><b>${n}</b><span>${esc(s.n)}</span></button>`; }).join("")}</div></div>`;
  // Vazifalar
  h += `<div class="grid2"><div class="card"><div class="card-h"><h2>Navbatdagi ishlar</h2><a class="small" href="#vazifalar">Hammasi</a></div>${tasks.length ? `<div class="list">${tasks.slice(0, 6).map(taskRow).join("")}</div>` : `<div class="empty">Hozircha vazifa yo'q</div>`}</div>`;
  // So'nggi faoliyat
  const logs = ST.projects.flatMap(p => (p.log || []).map(l => ({...l, p}))).sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || ""))).slice(0, 8);
  h += `<div class="card"><div class="card-h"><h2>So'nggi o'zgarishlar</h2></div>${logs.length ? `<div class="list">${logs.map(l => `<a class="row" href="#p-${l.p.id}"><div class="grow"><div class="t1">${esc(l.t)}</div><div class="t2">${pno(l.p)} · ${esc(projectTitle(l.p))} · ${esc(l.u || "")}</div></div><span class="t2 nowrap">${esc(l.d || "")}</span></a>`).join("")}</div>` : `<div class="empty">Hali o'zgarish yo'q</div>`}</div></div>`;
  return h;
}
function taskRow({p, s}){
  const late = s.due && s.due < today(), dueToday = s.due === today();
  return `<a class="row" href="#p-${p.id}"><span class="stdot st-${p.status === "kutish" ? "kutish" : p.stage}"></span><div class="grow"><div class="t1">${esc(s.t)}</div><div class="t2">${pno(p)} · ${esc(projectTitle(p))} · ${esc(needText(p))}</div></div>${late ? pill("kechikdi", "bad") : dueToday ? pill("bugun", "warn") : s.due ? `<span class="t2 nowrap">${fdate(s.due)}</span>` : ""}</a>`;
}
/* Trello uslubidagi doska: ustunlar = bosqichlar */
function boardHTML(cols, cardFn, opts = {}){
  const shown = opts.hideEmpty ? cols.filter(c => c.items.length) : cols;
  return `<div class="board tb">${shown.map(c => `<section class="col ${c.cls || ""}"><div class="col-h"><span class="stdot ${c.cls || ""}"></span><b>${esc(c.n)}</b><span class="cnt">${c.items.length}</span></div><div class="col-b">${c.items.map(cardFn).join("") || `<div class="col-empty">Bo'sh</div>`}</div></section>`).join("")}</div>`;
}
function stageCols(list, getP = x => x){
  return [{k:"kutish", n:"Qayta aloqa", cls:"st-kutish", items:list.filter(x => getP(x).status === "kutish")},
    ...STAGES.map(st => ({k:st.k, n:st.n, cls:"st-" + st.k, items:list.filter(x => getP(x).status === "faol" && getP(x).stage === st.k)}))];
}
function stageProgress(p){
  if (p.stage === "ishlab"){ const all = PROD_CHECKS.filter(([k]) => k !== "rover" || p.prod?.rover); const d = all.filter(([k]) => p.prod?.checks?.[k]).length; return [d, all.length]; }
  if (p.stage === "loyiha"){ const all = [p.sale?.model3d ? "model3d" : null, "parts", "furn"].filter(Boolean); return [all.filter(k => p.design?.checks?.[k]).length, all.length]; }
  if (p.stage === "topshirish"){ const u = p.hand?.unfinished || []; return u.length ? [u.filter(x => x.done).length, u.length] : null; }
  return null;
}
function tcard(p, s){
  const due = s?.due; const late = due && due < today(); const pr = stageProgress(p);
  const dl = p.sale?.deadline; const dlLate = dl && dl < today() && p.status === "faol";
  return `<a class="tcard" href="#p-${p.id}" data-act="openFrom"><div class="pc-top"><span class="mono muted">${pno(p)}</span>${late ? pill("kechikdi", "bad") : due === today() ? pill("bugun", "warn") : due ? `<span class="t2">${fdate(due)}</span>` : ""}</div>
    <div class="t1">${esc(projectTitle(p))}</div><div class="t2">${esc(needText(p))}</div>
    ${s ? `<div class="pc-next">${ic("check", 14)} ${esc(s.t)}${s.who ? ` · ${esc(userName(s.who))}` : ""}</div>` : ""}
    ${pr ? `<div class="mini"><div class="bar"><i style="width:${pr[1] ? pr[0] / pr[1] * 100 : 0}%"></i></div><span>${pr[0]}/${pr[1]}</span></div>` : ""}
    ${dl ? `<div class="t2 ${dlLate ? "bad-t" : ""}">Muddat: ${fdate(dl)}</div>` : ""}</a>`;
}
function vVazifalar(){
  const t = myTasks();
  let h = `<div class="head"><div><h1>Vazifalarim</h1><p class="muted">Sizga biriktirilgan ishlar bosqichlar bo'yicha. Kartani bosing — loyiha ochiladi</p></div><button class="btn pri newp" data-act="newProject">${ic("plus", 18)} Yangi loyiha</button></div>`;
  if (!t.length) return h + `<div class="card"><div class="empty"><h3>Vazifa yo'q</h3><p>Sizga biriktirilgan ish hozircha yo'q.</p></div></div>`;
  const late = t.filter(x => x.s.due && x.s.due < today()).length, tod = t.filter(x => x.s.due === today()).length;
  if (late || tod) h += `<div class="chips" style="margin-bottom:12px">${late ? pill(late + " ta kechikkan", "bad") : ""} ${tod ? pill(tod + " ta bugun", "warn") : ""}</div>`;
  return h + boardHTML(stageCols(t, x => x.p), x => tcard(x.p, x.s), {hideEmpty:true});
}
/* Ishlab chiqarish ichki qadamlari: ustun = birinchi bajarilmagan qadam */
const PROD_COLS = [["material","Material olinadi"],["kesishga","Kesishga beriladi"],["kesildi","Kesilmoqda"],["kromka","Kromkada"],["rover","Roverda"],["keltirildi","Sexga keltiriladi"],["furnitura","Furnitura olinadi"],["tayyor","Yig'ishga tayyor"]];
function prodStep(p){ const steps = PROD_CHECKS.filter(([k]) => k !== "rover" || p.prod?.rover); const nx = steps.find(([k]) => !p.prod?.checks?.[k]); return nx ? nx[0] : "tayyor"; }
function pcard(p){
  const k = prodStep(p); const lbl = PROD_CHECKS.find(x => x[0] === k)?.[1]; const pr = stageProgress(p); const pz = p.prod || {};
  const svc = k === "kesishga" || k === "kesildi" ? pz.cutService : k === "kromka" ? pz.edgeService : k === "rover" ? pz.roverService : "";
  const dl = p.sale?.deadline; const dlLate = dl && dl < today();
  return `<div class="tcard"><a class="tlink" href="#p-${p.id}" data-act="openFrom"><div class="pc-top"><span class="mono muted">${pno(p)}</span>${dl ? `<span class="t2 ${dlLate ? "bad-t" : ""}">${fdate(dl)}</span>` : ""}</div>
    <div class="t1">${esc(projectTitle(p))}</div><div class="t2">${esc(needText(p))}${svc ? " · " + esc(svcName(svc)) : ""}${k === "kesildi" && pz.saw ? " · " + esc(pz.saw) : ""}${k === "kromka" && pz.edgeType ? " · " + esc(pz.edgeType) + (pz.double ? " dvaynoy" : "") : ""}</div>
    ${pr ? `<div class="mini"><div class="bar"><i style="width:${pr[1] ? pr[0] / pr[1] * 100 : 0}%"></i></div><span>${pr[0]}/${pr[1]}</span></div>` : ""}</a>
    ${k !== "tayyor" ? `<button class="btn sm" data-act="prodNext" data-id="${p.id}" data-k="${k}">${ic("check", 14)} ${esc(lbl)}</button>` : `<button class="btn sm pri" data-act="toAsm" data-id="${p.id}">Yig'ishga o'tkazish →</button>`}</div>`;
}
function vJarayonlar(){
  const me = ST.me.id;
  let list = ST.projects.filter(p => p.status === "faol" || p.status === "kutish");
  if (UI.jmine) list = list.filter(p => { const s = nextStep(p); return p.sellerId === me || p.managerId === me || s?.who === me || (s?.all || []).includes(me); });
  list.sort((a, b) => (a.sale?.deadline || "9999").localeCompare(b.sale?.deadline || "9999"));
  const prod = UI.jview === "ishlab";
  let h = `<div class="head"><div><h1>Jarayonlar</h1><p class="muted">${prod ? "Ishlab chiqarishdagi loyihalar qaysi qadamda: materialdan yig'ishgacha" : "Har bir loyiha qaysi bosqichda ketyapti: leaddan topshirishgacha"}</p></div><button class="btn pri newp" data-act="newProject">${ic("plus", 18)} Yangi loyiha</button></div>`;
  const nProd = list.filter(p => p.status === "faol" && p.stage === "ishlab").length;
  h += `<div class="toolbar" style="flex-wrap:wrap"><div class="mode"><button class="${!prod ? "on" : ""}" data-act="jview" data-v="">Hamma bosqichlar</button><button class="${prod ? "on" : ""}" data-act="jview" data-v="ishlab">Ishlab chiqarish (${nProd})</button></div>
    <div class="chips"><button class="chip ${!UI.jmine ? "on" : ""}" data-act="jmine" data-v="">Hamma loyihalar</button><button class="chip ${UI.jmine ? "on" : ""}" data-act="jmine" data-v="1">Mening loyihalarim</button></div></div>`;
  if (prod){
    const ps = list.filter(p => p.status === "faol" && p.stage === "ishlab");
    const cols = PROD_COLS.filter(([k]) => k !== "rover" || ps.some(p => p.prod?.rover)).map(([k, n]) => ({k, n, cls:"st-ishlab", items:ps.filter(p => prodStep(p) === k)}));
    return h + boardHTML(cols, pcard);
  }
  return h + boardHTML(stageCols(list), p => tcard(p, nextStep(p)));
}

/* ---------------- Loyihalar ro'yxati ---------------- */
function vLoyihalar(){
  const tabs = [["faol","Jarayonda", p => p.status === "faol"], ["lead","Yangi leadlar", p => p.status === "faol" && p.stage === "lead"], ["kutish","O'ylab ko'rmoqda", p => p.status === "kutish"], ["rad","Rad etilgan", p => p.status === "rad"], ["yopilgan","Yopilgan", p => p.status === "yopilgan"], ["hammasi","Hammasi", () => true]];
  const tab = tabs.find(t => t[0] === UI.ltab) || tabs[0];
  let list = ST.projects.filter(tab[2]);
  if (UI.ltab === "faol" && UI.lstage) list = list.filter(p => p.stage === UI.lstage);
  const q = UI.q.trim().toLowerCase();
  if (q) list = list.filter(p => [p.no, p.client?.name, p.client?.phone, p.client?.phone2, p.client?.address, needText(p)].join(" ").toLowerCase().includes(q.replace(/^№\s*0*/, "")));
  list.sort((a, b) => UI.ltab === "kutish" ? (a.decision?.followup || "").localeCompare(b.decision?.followup || "") : String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
  let h = `<div class="head"><div><h1>Loyihalar</h1><p class="muted">Har bir mijoz — bitta loyiha: leaddan topshirishgacha</p></div><button class="btn pri hide-m newp" data-act="newProject">${ic("plus", 18)} Yangi loyiha</button></div>`;
  h += `<div class="tabs">${tabs.map(([k, n, f]) => `<button class="tab2 ${UI.ltab === k ? "on" : ""}" data-act="ltab" data-v="${k}">${n} <em>${ST.projects.filter(f).length}</em></button>`).join("")}</div>`;
  h += `<div class="toolbar"><input class="inp" id="q" type="search" placeholder="Qidirish: ism, telefon, raqam" value="${esc(UI.q)}" aria-label="Qidirish">${UI.ltab === "faol" ? `<div class="mode hide-m"><button class="${UI.lview === "list" ? "on" : ""}" data-act="lview" data-v="list">Ro'yxat</button><button class="${UI.lview === "board" ? "on" : ""}" data-act="lview" data-v="board">Doska</button></div>` : ""}</div>`;
  if (UI.ltab === "faol") h += `<div class="chips" style="margin-bottom:12px"><button class="chip ${!UI.lstage ? "on" : ""}" data-act="lstage" data-v="">Hammasi</button>${STAGES.map(s => `<button class="chip ${UI.lstage === s.k ? "on" : ""}" data-act="lstage" data-v="${s.k}">${esc(s.n)} <b>${ST.projects.filter(p => p.status === "faol" && p.stage === s.k).length}</b></button>`).join("")}</div>`;
  if (UI.ltab === "faol" && UI.lview === "board" && !UI.lstage){
    return h + `<div class="board">${STAGES.map(s => { const items = list.filter(p => p.stage === s.k); return `<div class="col"><div class="col-h"><b>${esc(s.n)}</b><span class="muted">${items.length}</span></div>${items.map(p => projCard(p, true)).join("") || `<div class="muted small pad">Bo'sh</div>`}</div>`; }).join("")}</div>`;
  }
  if (!list.length) return h + `<div class="card"><div class="empty"><h3>${q ? "Hech narsa topilmadi" : "Bu yerda hali loyiha yo'q"}</h3>${q ? "" : `<button class="btn pri newp" data-act="newProject">${ic("plus", 18)} Yangi loyiha</button>`}</div></div>`;
  return h + `<div class="cards" id="plist">${list.map(p => projCard(p)).join("")}</div>`;
}
function projCard(p, compact){
  const st = STATUS[p.status]; const s = nextStep(p); const price = projectPrice(p); const debt = projectDebt(p);
  const late = p.sale?.deadline && p.status === "faol" && p.sale.deadline < today();
  return `<a class="pcard" href="#p-${p.id}"><div class="pc-top"><span class="mono muted">${pno(p)}</span>${p.status === "faol" ? pill(SK[p.stage]?.n || p.stage, "st-" + p.stage) : pill(st[0], st[1])}</div>
    <div class="t1">${esc(projectTitle(p))}</div><div class="t2">${esc(needText(p))}${p.client?.address && !compact ? " · " + esc(p.client.address) : ""}</div>
    ${!compact ? `<div class="pc-meta">${price ? `<span>${p.sale ? "" : "≈ "}${mshort(price)}</span>` : ""}${debt ? `<span class="bad-t">qoldiq ${mshort(debt)}</span>` : ""}${p.sale?.deadline ? `<span class="${late ? "bad-t" : ""}">muddat ${fdate(p.sale.deadline)}</span>` : ""}</div>` : ""}
    ${s ? `<div class="pc-next">${ic("check", 14)} ${esc(s.t)}${s.who ? ` · ${esc(userName(s.who))}` : ""}</div>` : ""}</a>`;
}

/* ---------------- Loyiha sahifasi ---------------- */
function vProject(id){
  const p = ST.projects.find(x => x.id === id);
  if (!p) return `<div class="card"><div class="empty"><h3>Loyiha topilmadi</h3><a class="btn" href="#loyihalar">Loyihalarga qaytish</a></div></div>`;
  const st = STATUS[p.status]; const price = projectPrice(p), extra = projectExtra(p), paid = projectPaid(p), cost = projectCost(p);
  const cur = SK[p.stage]?.i ?? 0;
  let h = `<div class="phead"><a class="iconbtn" href="#${UI.from || "jarayonlar"}" aria-label="Orqaga">${ic("back")}</a><div class="grow"><div class="mono muted small">${pno(p)} · ${fdate(p.created_at)}</div><h1>${esc(projectTitle(p))}</h1>
    <div class="ph-line"><span class="phone">${esc(p.client?.phone || "")}</span>${p.client?.phone ? `<button class="iconbtn sm" data-act="copy" data-v="${esc(p.client.phone)}" aria-label="Nusxa">${ic("copy", 16)}</button>` : ""}${p.client?.phone2 ? `<span class="phone">${esc(p.client.phone2)}</span>` : ""}${pill(st[0], st[1])}</div>
    <div class="t2">${esc(needText(p))}${p.client?.address ? " · " + esc(p.client.address) : ""}${p.client?.source ? " · manba: " + esc(p.client.source) : ""}</div></div>
    <button class="btn sm" data-act="editClient" data-id="${p.id}">${ic("edit", 16)} Tahrirlash</button></div>`;
  // Bosqichlar chizig'i
  h += `<div class="stepper">${STAGES.map((s, i) => { const done = p.status === "yopilgan" || i < cur; const on = i === cur && p.status !== "yopilgan"; return `<div class="step ${done ? "done" : ""} ${on ? "on" : ""}"><i>${done ? ic("check", 14) : i + 1}</i><span>${esc(s.n)}</span></div>`; }).join("")}<div class="step ${p.status === "yopilgan" ? "on done" : ""}"><i>${p.status === "yopilgan" ? ic("check", 14) : "✓"}</i><span>Yopildi</span></div></div>`;
  // Pul
  const money5 = [["Narx", price ? (p.sale ? money(price + extra) : "≈ " + money(price)) : "—"], ["To'langan", money(paid)], ["Qoldiq", money(p.sale ? price + extra - paid : 0)]];
  if (canFin()) money5.push(["Xarajat", money(cost)], ["Foyda", p.sale ? money(price + extra - cost) : "—"]);
  h += `<div class="mstrip">${money5.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>`;
  h += `<div class="tabs">${[["jarayon","Jarayon"],["moliya","Pul va xarajat"],["tarix","Tarix"]].map(([k, n]) => `<button class="tab2 ${UI.ptab === k ? "on" : ""}" data-act="ptab" data-v="${k}">${n}</button>`).join("")}</div>`;
  if (UI.ptab === "moliya") return h + projMoney(p);
  if (UI.ptab === "tarix") return h + `<div class="card">${(p.log || []).length ? `<div class="list">${p.log.slice().reverse().map(l => `<div class="row"><div class="grow"><div class="t1">${esc(l.t)}</div><div class="t2">${esc(l.u || "")}</div></div><span class="t2 nowrap">${esc(l.d)}</span></div>`).join("")}</div>` : `<div class="empty">Tarix bo'sh</div>`}</div>`;
  h += currentCard(p);
  h += doneStages(p);
  if (isRole("admin")) h += `<div style="margin-top:20px;text-align:right"><button class="btn sm danger" data-act="delProject" data-id="${p.id}">${ic("trash", 16)} Loyihani o'chirish</button></div>`;
  return h;
}
const kv = rows => `<dl class="kv">${rows.filter(r => r && r[1] !== undefined && r[1] !== "" && r[1] !== null).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
function currentCard(p){
  const a = (act, label, cls = "", extra = "") => `<button class="btn ${cls}" data-act="${act}" data-id="${p.id}" ${extra}>${label}</button>`;
  if (p.status === "kutish"){
    const f = p.decision?.followup; const dd = f ? daysBetween(today(), f) : null;
    return `<div class="card now warn-b"><div class="card-h"><h2>Mijoz o'ylab ko'rmoqda</h2>${f ? pill(dd < 0 ? `${-dd} kun o'tib ketdi` : dd === 0 ? "bugun qo'ng'iroq" : `${dd} kun qoldi`, dd <= 0 ? "bad" : "warn") : ""}</div>
      ${kv([["Qayta aloqa", fdate(f)], ["Izoh", esc(p.decision?.note || "")], ["Aniq narx", p.zamer?.exactPrice ? money(p.zamer.exactPrice) : ""]])}
      ${(p.decision?.followups || []).length ? `<div class="sub">Aloqa tarixi</div><div class="list">${p.decision.followups.slice().reverse().map(x => `<div class="row"><div class="grow"><div class="t1">${esc(x.note || "Qo'ng'iroq qilindi")}</div><div class="t2">${esc(x.by || "")}</div></div><span class="t2">${fdate(x.date)}</span></div>`).join("")}</div>` : ""}
      <div class="actions">${a("sold", `${ic("check", 18)} Sotildi`, "pri big")}${a("thinking", "Yana o'ylaydi", "big")}${a("refuse", "Rad etdi", "big danger")}</div></div>`;
  }
  if (p.status === "rad"){
    const r = REFUSE.find(x => x[0] === p.decision?.reason);
    return `<div class="card now bad-b"><div class="card-h"><h2>Mijoz rad etdi</h2></div>${kv([["Sabab", esc(r ? r[1] : "—")], ["Izoh", esc(p.decision?.note || "")], ["Sana", fdate(p.decision?.date)], ["Bosqich", esc(SK[p.stage]?.n)]])}<div class="actions">${a("restore", "Loyihani qayta tiklash")}</div></div>`;
  }
  if (p.status === "yopilgan") return smetaCard(p);
  const s = SK[p.stage];
  let body = "", acts = "";
  switch (p.stage){
    case "lead":
      body = kv([["Qanday mebel", esc(needText(p))], ["Tafsilot", esc(p.need?.desc || "")], ["Taxminiy narx", p.lead?.approxPrice ? money(p.lead.approxPrice) + " (aytilgan)" : "aytilmagan"], ["Sotuvchi", esc(userName(p.sellerId))], ["Izoh", esc(p.lead?.note || "")]]);
      acts = a("toZamer", `O'lchovga yuborish →`, "pri big") + a("approx", "Taxminiy narx") + a("thinking", "O'ylab ko'radi") + a("refuse", "Rad etdi", "danger");
      break;
    case "zamer": {
      const z = p.zamer || {};
      body = kv([["O'lchovchi", esc(userName(z.assignedTo))], ["Rejadagi sana", fdate(z.plannedDate) + (z.plannedTime ? " " + esc(z.plannedTime) : "")], ["O'lchandi", z.doneDate ? fdate(z.doneDate) + " · " + esc(userName(z.by)) : ""], ["O'lchamlar", z.dims ? `<span class="pre">${esc(z.dims)}</span>` : ""], ["Hisob", z.calc ? `<span class="pre">${esc(z.calc)}</span>` : ""], ["Taxminiy narx (1-etap)", p.lead?.approxPrice ? money(p.lead.approxPrice) : ""], ["Aniq narx", z.exactPrice ? `<b>${money(z.exactPrice)}</b>` : ""], ["3D model", z.model3d === undefined ? "" : z.model3d ? "kerak" : "kerak emas"]]);
      acts = !z.doneDate ? a("zamerDone", "O'lchov natijasini kiritish", "pri big") + a("toZamer", "O'lchovchi / sana") + a("thinking", "O'ylab ko'radi") + a("refuse", "Rad etdi", "danger")
        : `<div class="decide"><div class="sub">Mijoz qarori</div><div class="actions">${a("sold", `${ic("check", 18)} Sotildi — ishga tushadi`, "pri big")}${a("thinking", "O'ylab ko'radi", "big")}${a("refuse", "Rad etdi", "big danger")}</div></div>` + `<div class="actions">${a("zamerDone", "O'lchov va narxni tahrirlash", "sm")}</div>`;
      break;
    }
    case "loyiha": {
      const d = p.design || {}; const need3d = p.sale?.model3d;
      const checks = [need3d ? ["model3d", "3D model tayyorlandi"] : null, ["parts", "Detallar texnologik ro'yxati tayyor"], ["furn", "Furnitura hisobi chiqarildi"]].filter(Boolean);
      body = `${kv([["Texnolog / dizayner", esc(userName(d.by))], ["3D model", need3d ? "kerak" : "kerak emas"], ["Izoh", esc(d.note || "")]])}
        <div class="checks">${checks.map(([k, n]) => checkBtn(p, "design", k, n, d.checks?.[k])).join("")}</div>
        <div class="sub">Furnitura rejasi</div>${furnPlanHTML(p)}`;
      acts = a("toProd", "Ishlab chiqarishga berish →", "pri big") + a("designEdit", "Texnolog va izoh") + a("furnAdd", "+ Furnitura qatori");
      break;
    }
    case "ishlab": {
      const pr = p.prod || {};
      body = `${kv([["Kesish", pr.cutService ? esc(svcName(pr.cutService)) + (pr.saw ? " · " + esc(pr.saw) : "") : "tanlanmagan"], ["Kromka", pr.edgeService ? esc(svcName(pr.edgeService)) + " · " + esc(pr.edgeType || "") + (pr.double ? " · dvaynoy" : "") : "tanlanmagan"], ["Rover", pr.rover ? (pr.roverService ? esc(svcName(pr.roverService)) : "bor") : "yo'q"], ["Izoh", esc(pr.note || "")]])}
        <div class="checks">${PROD_CHECKS.filter(([k]) => k !== "rover" || pr.rover).map(([k, n]) => checkBtn(p, "prod", k, n, pr.checks?.[k])).join("")}</div>
        <div class="sub">Xarajat yozish</div><div class="qexp">${["material","kesish","kromka","rover","yol_sex","furnitura"].filter(c => c !== "rover" || pr.rover).map(c => `<button class="btn sm" data-act="expAdd" data-id="${p.id}" data-c="${c}">+ ${esc(EXP[c].n)}</button>`).join("")}</div>${stageExpenses(p, ["material","kesish","kromka","rover","yol_sex","furnitura"])}`;
      acts = a("toAsm", "Yig'ishga o'tkazish →", "pri big") + a("prodPlan", "Qaysi uslugada: kesish, kromka, rover");
      break;
    }
    case "yigish": {
      const w = p.asm?.workers || [];
      body = `${kv([["Loyiha menejeri", esc(userName(p.managerId))], ["Necha kishi", w.length ? w.length + " kishi" : "biriktirilmagan"], ["Boshlandi", fdate(p.asm?.start)], ["Izoh", esc(p.asm?.note || "")]])}
        <div class="sub">Yig'uvchilar</div>${w.length ? `<div class="list">${w.map((x, i) => { const paidW = sum(ST.expenses.filter(e => e.project_id === p.id && e.category === "yigish" && e.details?.worker === x.id), e => e.amount); return `<div class="row"><div class="grow"><div class="t1">${esc(userName(x.id))}</div><div class="t2">Kelishilgan: ${money(x.pay)}${x.note ? " · " + esc(x.note) : ""}${canFin() || paidW ? ` · to'langan ${money(paidW)}` : ""}</div></div><button class="btn sm" data-act="payWorker" data-id="${p.id}" data-i="${i}">To'lash</button><button class="iconbtn sm" data-act="delWorker" data-id="${p.id}" data-i="${i}" aria-label="Olib tashlash">${ic("trash", 16)}</button></div>`; }).join("")}</div>` : `<p class="muted small">Yig'uvchi qo'shing va kelishilgan haqni yozing.</p>`}
        ${stageExpenses(p, ["yigish"])}`;
      acts = a("toInstall", "O'rnatishga o'tkazish →", "pri big") + a("addWorker", "+ Yig'uvchi") + a("asmEdit", "Menejer, sana, izoh");
      break;
    }
    case "ornatish": {
      const ins = p.install || {};
      body = `${kv([["O'rnatish sanasi", fdate(ins.date)], ["Jamoa", (ins.team || []).map(userName).map(esc).join(", ") || "biriktirilmagan"], ["Izoh", esc(ins.note || "")]])}
        <div class="checks">${checkBtn(p, "install", "done", "O'rnatib bo'lindi", ins.checks?.done)}</div>
        <div class="sub">Xarajat yozish</div><div class="qexp"><button class="btn sm" data-act="expAdd" data-id="${p.id}" data-c="yol_mijoz">+ Yo'l kira: sex → mijoz</button><button class="btn sm" data-act="expAdd" data-id="${p.id}" data-c="ornatish">+ O'rnatish haqi</button></div>${stageExpenses(p, ["yol_mijoz","ornatish"])}`;
      acts = a("toHand", "Topshirishga o'tish →", "pri big") + a("installEdit", "Sana va jamoa");
      break;
    }
    case "topshirish": {
      const hd = p.hand || {}; const debt = projectPrice(p) + projectExtra(p) - projectPaid(p);
      const cl = COMPLAINTS.filter(c => (hd.complaints || []).includes(c[0])).map(c => c[1]);
      body = `<div class="debt ${debt > 0 ? "" : "ok"}"><div><span>Mijozdan olinishi kerak</span><b>${money(Math.max(0, debt))}</b><small>Shartnoma ${money(projectPrice(p))}${projectExtra(p) ? " + qo'shimcha " + money(projectExtra(p)) : ""} · oldindan to'langan ${money(sum(ST.payments.filter(x => x.project_id === p.id && x.kind === "zaklat"), x => x.amount) || 0)} · jami to'langan ${money(projectPaid(p))}</small></div>${debt > 0 ? `<button class="btn pri" data-act="payAdd" data-id="${p.id}" data-k="qoldiq">To'lov qabul qilish</button>` : pill("To'liq to'langan", "ok")}</div>
        ${kv([["Topshirilgan sana", fdate(hd.date)], ["Mijoz rozimi", hd.satisfied ? {ha:"Ha, hammasidan rozi", qisman:"Qisman rozi", yoq:"Rozi emas"}[hd.satisfied] : ""], ["Norozilik", cl.length ? esc(cl.join(", ")) : ""], ["Izoh", esc(hd.complaintText || "")], ["Qo'shimcha xizmat", hd.extra ? esc(hd.extra) + (hd.extraPrice ? " · " + money(hd.extraPrice) : "") : ""]])}
        ${(hd.unfinished || []).length ? `<div class="sub">Chala ishlar</div><div class="checks">${hd.unfinished.map((u, i) => `<button class="chk ${u.done ? "on" : ""}" data-act="unfin" data-id="${p.id}" data-i="${i}"><i>${u.done ? ic("check", 14) : ""}</i><span>${esc(u.text)}</span></button>`).join("")}</div>` : ""}`;
      acts = a("close", "Loyihani yopish", "pri big") + a("handEdit", "Topshirish natijasi (mijoz fikri, chala ishlar)");
      break;
    }
  }
  return `<div class="card now"><div class="card-h"><div><div class="sub" style="margin:0">Hozirgi bosqich · ${s.i + 1}/7</div><h2>${esc(s.n)}</h2><div class="t2">${esc(s.d)}</div></div></div>${body}<div class="actions">${acts}</div></div>`;
}
function checkBtn(p, sec, k, label, val){ return `<button class="chk ${val ? "on" : ""}" data-act="check" data-id="${p.id}" data-sec="${sec}" data-k="${k}"><i>${val ? ic("check", 14) : ""}</i><span>${esc(label)}${val?.by ? `<small>${esc(val.by)} · ${esc(val.d || "")}</small>` : ""}</span></button>`; }
function furnPlanHTML(p){
  const items = p.design?.furn || [];
  if (!items.length) return `<p class="muted small">Furnitura qatorlarini qo'shing: ruchka, petlya, salaska, mexanizm va boshqalar.</p>`;
  return `<div class="tblw"><table class="tbl"><thead><tr><th>Turi</th><th>Nomi</th><th class="r">Soni</th><th class="r">Narx</th><th class="r">Summa</th><th></th></tr></thead><tbody>${items.map((f, i) => `<tr><td>${esc(f.type)}</td><td>${esc(f.name)}</td><td class="r">${num(f.qty)}</td><td class="r">${mshort(f.price)}</td><td class="r">${money(num(f.qty) * num(f.price))}</td><td class="r"><button class="iconbtn sm" data-act="furnDel" data-id="${p.id}" data-i="${i}" aria-label="O'chirish">${ic("trash", 16)}</button></td></tr>`).join("")}<tr class="tot"><td colspan="4">Jami (reja)</td><td class="r">${money(sum(items, f => num(f.qty) * num(f.price)))}</td><td></td></tr></tbody></table></div>`;
}
function stageExpenses(p, cats){
  const ex = ST.expenses.filter(e => e.project_id === p.id && cats.includes(e.category));
  if (!ex.length) return "";
  return `<div class="tblw" style="margin-top:10px"><table class="tbl"><tbody>${ex.map(expRow).join("")}<tr class="tot"><td colspan="2">Jami</td><td class="r">${money(sum(ex, e => e.amount))}</td><td></td></tr></tbody></table></div>`;
}
function expDetail(e){
  const d = e.details || {}; const s = [];
  if (e.service_id) s.push(svcName(e.service_id));
  if (d.saw) s.push(d.saw); if (d.sheets) s.push(d.sheets + " list"); if (d.edgeType) s.push(d.edgeType); if (d.double) s.push("dvaynoy"); if (d.meters) s.push(d.meters + " m");
  if (d.ftype) s.push(d.ftype); if (d.name) s.push(d.name); if (d.qty) s.push(d.qty + " dona"); if (d.worker) s.push(userName(d.worker)); if (d.route) s.push(d.route);
  if (e.note) s.push(e.note);
  return s.join(" · ");
}
function expRow(e){
  const canDel = isRole("admin","buxgalter") || e.created_by === ST.me.id;
  return `<tr><td class="nowrap">${fdate(e.date)}</td><td><div class="t1">${esc(EXP[e.category]?.n || EXP_GENERAL[e.category] || e.category)}</div><div class="t2">${esc(expDetail(e))}</div></td><td class="r nowrap">${money(e.amount)}</td><td class="r">${canDel ? `<button class="iconbtn sm" data-act="expDel" data-id="${e.id}" aria-label="O'chirish">${ic("trash", 16)}</button>` : ""}</td></tr>`;
}
function doneStages(p){
  const cur = p.status === "yopilgan" ? 99 : SK[p.stage]?.i ?? 0;
  const parts = [];
  if (cur > 0 || p.status !== "faol") parts.push(["Lead", kv([["Qanday mebel", esc(needText(p))], ["Taxminiy narx", p.lead?.approxPrice ? money(p.lead.approxPrice) : "aytilmagan"], ["Sotuvchi", esc(userName(p.sellerId))], ["Sana", fdate(p.created_at)]])]);
  if (cur > 1 && p.zamer) parts.push(["O'lchov va narx", kv([["O'lchovchi", esc(userName(p.zamer.by || p.zamer.assignedTo))], ["O'lchandi", fdate(p.zamer.doneDate)], ["O'lchamlar", p.zamer.dims ? `<span class="pre">${esc(p.zamer.dims)}</span>` : ""], ["Aniq narx", money(p.zamer.exactPrice)]]) + (p.sale ? kv([["Sotildi", fdate(p.sale.date)], ["Shartnoma narxi", money(p.sale.price)], ["Muddat", fdate(p.sale.deadline)], ["3D model", p.sale.model3d ? "kerak" : "kerak emas"], ["Menejer", esc(userName(p.managerId))]]) : "")]);
  if (cur > 2) parts.push(["Loyihalash", kv([["Texnolog", esc(userName(p.design?.by))], ["Furnitura rejasi", money(sum(p.design?.furn || [], f => num(f.qty) * num(f.price)))]])]);
  if (cur > 3) parts.push(["Ishlab chiqarish", kv([["Kesish", p.prod?.cutService ? esc(svcName(p.prod.cutService) + " · " + (p.prod.saw || "")) : "—"], ["Kromka", p.prod?.edgeService ? esc(svcName(p.prod.edgeService) + " · " + (p.prod.edgeType || "") + (p.prod.double ? " · dvaynoy" : "")) : "—"], ["Rover", p.prod?.rover ? "bor" : "yo'q"]]) + stageExpenses(p, ["material","kesish","kromka","rover","yol_sex","furnitura"])]);
  if (cur > 4) parts.push(["Yig'ish", kv([["Yig'uvchilar", (p.asm?.workers || []).map(w => esc(userName(w.id)) + " (" + money(w.pay) + ")").join(", ")], ["Menejer", esc(userName(p.managerId))]]) + stageExpenses(p, ["yigish"])]);
  if (cur > 5) parts.push(["O'rnatish", kv([["Sana", fdate(p.install?.date)], ["Jamoa", (p.install?.team || []).map(userName).map(esc).join(", ")]]) + stageExpenses(p, ["yol_mijoz","ornatish"])]);
  if (!parts.length) return "";
  return `<div class="card"><div class="card-h"><h2>Bajarilgan bosqichlar</h2></div>${parts.map(([n, b]) => `<details class="acc"><summary>${ic("check", 16)} ${esc(n)}</summary>${b}</details>`).join("")}</div>`;
}
function projMoney(p){
  const pays = ST.payments.filter(x => x.project_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
  const ex = ST.expenses.filter(x => x.project_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
  const canDelPay = isRole("admin","buxgalter");
  let h = `<div class="card"><div class="card-h"><h2>Mijoz to'lovlari</h2><button class="btn sm pri" data-act="payAdd" data-id="${p.id}">+ To'lov</button></div>${pays.length ? `<div class="tblw"><table class="tbl"><tbody>${pays.map(x => `<tr><td class="nowrap">${fdate(x.date)}</td><td><div class="t1">${esc(PAY_KINDS[x.kind] || x.kind)}</div><div class="t2">${esc(PAY_METHODS[x.method] || x.method)}${x.note ? " · " + esc(x.note) : ""}</div>${payBadge(x)}</td><td class="r nowrap">${money(x.amount)}</td><td class="r">${canDelPay ? `<button class="iconbtn sm" data-act="payDel" data-id="${x.id}" aria-label="O'chirish">${ic("trash", 16)}</button>` : ""}</td></tr>`).join("")}<tr class="tot"><td colspan="2">Jami to'langan</td><td class="r">${money(sum(pays, x => x.amount))}</td><td></td></tr></tbody></table></div>` : `<div class="empty">To'lov yo'q</div>`}</div>`;
  h += `<div class="card"><div class="card-h"><h2>Xarajatlar</h2><button class="btn sm" data-act="expAdd" data-id="${p.id}" data-c="">+ Xarajat</button></div>${ex.length ? `<div class="tblw"><table class="tbl"><tbody>${ex.map(expRow).join("")}<tr class="tot"><td colspan="2">Jami xarajat${canFin() ? "" : " (siz kiritganlar)"}</td><td class="r">${money(sum(ex, e => e.amount))}</td><td></td></tr></tbody></table></div>` : `<div class="empty">Xarajat yozilmagan</div>`}</div>`;
  if (canFin()) h += smetaCard(p, true);
  return h;
}
function smetaCard(p, inline){
  const price = projectPrice(p), extra = projectExtra(p), paid = projectPaid(p);
  const ex = ST.expenses.filter(x => x.project_id === p.id);
  const cats = [...new Set(ex.map(e => e.category))];
  const cost = sum(ex, e => e.amount), rev = price + extra, prof = rev - cost;
  const hd = p.hand || {};
  const fin = canFin();
  const leadDays = p.sale?.date ? daysBetween(String(p.created_at).slice(0, 10), p.sale.date) : null;
  const prodDays = p.sale?.date && hd.date ? daysBetween(p.sale.date, hd.date) : null;
  return `<div class="card ${inline ? "" : "now"}"><div class="card-h"><div>${inline ? "" : `<div class="sub" style="margin:0">Loyiha yopilgan · ${fdate(p.closedAt)}</div>`}<h2>Yakuniy smeta</h2></div>${!inline ? `<button class="btn sm" data-act="copySmeta" data-id="${p.id}">${ic("copy", 16)} Nusxa</button>` : ""}</div>
    <div class="smeta">${[["Daromad (shartnoma" + (extra ? " + qo'shimcha" : "") + ")", money(rev)], ["Mijoz to'lagan", money(paid)], ["Qarz", money(Math.max(0, rev - paid))], ...(fin ? [["Tannarx (xarajatlar)", money(cost)], ["Foyda", `<b class="${prof >= 0 ? "ok-t" : "bad-t"}">${money(prof)}</b>`], ["Rentabellik", rev ? Math.round(prof / rev * 100) + "%" : "—"]] : [])].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
    ${fin && cats.length ? `<div class="sub">Xarajatlar tarkibi</div><div class="bars">${cats.map(c => { const v = sum(ex.filter(e => e.category === c), e => e.amount); return `<div class="bar-row"><span>${esc(EXP[c]?.n || EXP_GENERAL[c] || c)}</span><div class="bar"><i style="width:${cost ? v / cost * 100 : 0}%"></i></div><b>${money(v)}</b></div>`; }).join("")}</div>` : ""}
    ${!inline ? kv([["Leaddan sotuvgacha", leadDays !== null ? leadDays + " kun" : ""], ["Sotuvdan topshirishgacha", prodDays !== null ? prodDays + " kun" + (p.sale?.deadline ? (hd.date > p.sale.deadline ? " · muddatdan " + daysBetween(p.sale.deadline, hd.date) + " kun kech" : " · muddatida") : "") : ""], ["Mijoz bahosi", hd.satisfied ? {ha:"Hammasidan rozi", qisman:"Qisman rozi", yoq:"Rozi emas"}[hd.satisfied] : ""], ["Norozilik", COMPLAINTS.filter(c => (hd.complaints || []).includes(c[0])).map(c => c[1]).join(", ")], ["Izoh", esc(hd.complaintText || "")]]) : ""}
    ${!inline && isRole("admin") ? `<div class="actions"><button class="btn sm" data-act="reopen" data-id="${p.id}">Loyihani qayta ochish</button></div>` : ""}</div>`;
}

/* ---------------- Sotuv ---------------- */
function vSotuv(){
  const all = ST.projects;
  const leads = all.filter(p => inPeriod(p.created_at));
  const measured = leads.filter(p => p.zamer?.doneDate);
  const sold = all.filter(p => inPeriod(p.sale?.date));
  const refused = all.filter(p => p.status === "rad" && inPeriod(p.decision?.date));
  const thinking = all.filter(p => p.status === "kutish").sort((a, b) => (a.decision?.followup || "").localeCompare(b.decision?.followup || ""));
  const conv = leads.length ? Math.round(leads.filter(p => p.sale).length / leads.length * 100) : 0;
  const avg = sold.length ? sum(sold, p => p.sale.price) / sold.length : 0;
  let h = `<div class="head"><div><h1>Sotuv</h1><p class="muted">Leadlar, o'lchovlar, sotuv va rad etish sabablari</p></div></div>${periodChips()}`;
  h += `<div class="kpis" style="margin-top:12px"><div class="kpi"><span>Yangi leadlar</span><b>${leads.length}</b></div><div class="kpi"><span>O'lchovga borildi</span><b>${measured.length}</b></div><div class="kpi"><span>Sotildi</span><b>${sold.length}</b></div><div class="kpi"><span>Konversiya</span><b>${conv}%</b></div><div class="kpi"><span>Sotuv summasi</span><b>${mshort(sum(sold, p => p.sale.price))}</b></div><div class="kpi"><span>O'rtacha chek</span><b>${mshort(avg)}</b></div></div>`;
  // Voronka
  const fun = [["Lead", leads.length], ["O'lchandi", measured.length], ["Narx berildi", leads.filter(p => p.zamer?.exactPrice).length], ["Sotildi", leads.filter(p => p.sale).length]];
  const mx = Math.max(1, fun[0][1]);
  h += `<div class="grid2"><div class="card"><div class="card-h"><h2>Voronka</h2><span class="t2">shu davrdagi leadlar</span></div><div class="bars">${fun.map(([n, v]) => `<div class="bar-row"><span>${n}</span><div class="bar"><i style="width:${v / mx * 100}%"></i></div><b>${v}</b></div>`).join("")}</div></div>`;
  const rc = REFUSE.map(([k, n]) => [n, refused.filter(p => p.decision?.reason === k).length]).filter(x => x[1]);
  const rmx = Math.max(1, ...rc.map(x => x[1]));
  h += `<div class="card"><div class="card-h"><h2>Rad etish sabablari</h2><span class="t2">${refused.length} ta</span></div>${rc.length ? `<div class="bars">${rc.sort((a, b) => b[1] - a[1]).map(([n, v]) => `<div class="bar-row"><span>${esc(n)}</span><div class="bar bad"><i style="width:${v / rmx * 100}%"></i></div><b>${v}</b></div>`).join("")}</div>` : `<div class="empty">Shu davrda rad etish yo'q</div>`}</div></div>`;
  // Manbalar va sotuvchilar
  const src = SOURCES.map(s => [s, leads.filter(p => p.client?.source === s).length, leads.filter(p => p.client?.source === s && p.sale).length]).filter(x => x[1]);
  const sellers = ST.users.map(u => { const l = leads.filter(p => p.sellerId === u.id); const s = sold.filter(p => p.sellerId === u.id); return [u, l.length, s.length, sum(s, p => p.sale.price)]; }).filter(x => x[1] || x[2]).sort((a, b) => b[3] - a[3]);
  h += `<div class="grid2"><div class="card"><div class="card-h"><h2>Lead manbalari</h2></div>${src.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Manba</th><th class="r">Lead</th><th class="r">Sotildi</th><th class="r">%</th></tr></thead><tbody>${src.map(([s, l, k]) => `<tr><td>${esc(s)}</td><td class="r">${l}</td><td class="r">${k}</td><td class="r">${Math.round(k / l * 100)}%</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Ma'lumot yo'q</div>`}</div>
    <div class="card"><div class="card-h"><h2>Sotuvchilar</h2></div>${sellers.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Xodim</th><th class="r">Lead</th><th class="r">Sotildi</th><th class="r">Summa</th></tr></thead><tbody>${sellers.map(([u, l, s, v]) => `<tr><td>${esc(u.name)}</td><td class="r">${l}</td><td class="r">${s}</td><td class="r">${mshort(v)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Ma'lumot yo'q</div>`}</div></div>`;
  h += `<div class="card"><div class="card-h"><h2>O'ylab ko'rayotgan mijozlar</h2><span class="t2">${thinking.length} ta</span></div>${thinking.length ? `<div class="list">${thinking.map(p => { const f = p.decision?.followup; const late = f && f < today(); return `<a class="row" href="#p-${p.id}"><div class="grow"><div class="t1">${esc(projectTitle(p))} · ${esc(p.client?.phone || "")}</div><div class="t2">${esc(needText(p))}${p.zamer?.exactPrice ? " · " + money(p.zamer.exactPrice) : ""} · ${esc(userName(p.sellerId))}</div></div>${late ? pill("qo'ng'iroq kechikdi", "bad") : f === today() ? pill("bugun", "warn") : `<span class="t2 nowrap">${fdate(f)}</span>`}</a>`; }).join("")}</div>` : `<div class="empty">Kutilayotgan mijoz yo'q</div>`}</div>`;
  return h;
}

/* ---------------- Moliya ---------------- */
function vMoliya(){
  const pays = ST.payments.filter(p => inPeriod(p.date)), exps = ST.expenses.filter(e => inPeriod(e.date));
  const inc = sum(pays, p => p.amount), out = sum(exps, e => e.amount);
  const debts = ST.projects.filter(p => projectDebt(p) > 0 && p.status !== "rad").sort((a, b) => projectDebt(b) - projectDebt(a));
  let h = `<div class="head"><div><h1>Moliya</h1><p class="muted">Kirim, chiqim, qarzdorlik va loyihalar foydasi</p></div><div class="actions" style="margin:0"><button class="btn pri" data-act="payAdd" data-id="">+ Kirim</button><button class="btn" data-act="expAdd" data-id="" data-c="">+ Chiqim</button></div></div>${periodChips()}`;
  h += `<div class="kpis" style="margin-top:12px"><div class="kpi"><span>Kirim</span><b class="ok-t">${mshort(inc)}</b></div><div class="kpi"><span>Chiqim</span><b class="bad-t">${mshort(out)}</b></div><div class="kpi"><span>Sof pul oqimi</span><b>${mshort(inc - out)}</b></div><div class="kpi"><span>Mijozlar qarzi (jami)</span><b>${mshort(sum(debts, projectDebt))}</b></div></div>`;
  const cats = [...new Set(exps.map(e => e.category))].map(c => [c, sum(exps.filter(e => e.category === c), e => e.amount)]).sort((a, b) => b[1] - a[1]);
  const cmx = Math.max(1, ...cats.map(c => c[1]));
  h += `<div class="grid2"><div class="card"><div class="card-h"><h2>Chiqim tarkibi</h2></div>${cats.length ? `<div class="bars">${cats.map(([c, v]) => `<div class="bar-row"><span>${esc(EXP[c]?.n || EXP_GENERAL[c] || c)}</span><div class="bar bad"><i style="width:${v / cmx * 100}%"></i></div><b>${mshort(v)}</b></div>`).join("")}</div>` : `<div class="empty">Shu davrda chiqim yo'q</div>`}</div>
    <div class="card"><div class="card-h"><h2>Qarzdor mijozlar</h2></div>${debts.length ? `<div class="list">${debts.slice(0, 8).map(p => `<a class="row" href="#p-${p.id}"><div class="grow"><div class="t1">${esc(projectTitle(p))}</div><div class="t2">${pno(p)} · ${esc(SK[p.stage]?.n || "")}${p.status === "yopilgan" ? " · yopilgan" : ""}</div></div><b class="bad-t nowrap">${money(projectDebt(p))}</b></a>`).join("")}</div>` : `<div class="empty">Qarzdor yo'q</div>`}</div></div>`;
  // Loyihalar natijasi
  const closed = ST.projects.filter(p => p.sale && (p.status === "yopilgan" ? inPeriod(p.closedAt) : UI.period === "hammasi"));
  const rows = ST.projects.filter(p => p.sale && p.status !== "rad" && (inPeriod(p.closedAt) || inPeriod(p.sale.date))).map(p => { const rev = projectPrice(p) + projectExtra(p), c = projectCost(p); return {p, rev, c, pr:rev - c}; }).sort((a, b) => b.pr - a.pr);
  h += `<div class="card"><div class="card-h"><h2>Loyihalar natijasi</h2><span class="t2">shu davrda sotilgan yoki yopilgan</span></div>${rows.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Loyiha</th><th>Holat</th><th class="r">Daromad</th><th class="r">Tannarx</th><th class="r">Foyda</th><th class="r">%</th></tr></thead><tbody>${rows.map(r => `<tr class="click" data-act="go" data-v="p-${r.p.id}"><td><div class="t1">${esc(projectTitle(r.p))}</div><div class="t2">${pno(r.p)}</div></td><td>${r.p.status === "yopilgan" ? pill("Yopilgan", "done") : pill(SK[r.p.stage]?.n, "st-" + r.p.stage)}</td><td class="r">${mshort(r.rev)}</td><td class="r">${mshort(r.c)}</td><td class="r ${r.pr >= 0 ? "ok-t" : "bad-t"}">${mshort(r.pr)}</td><td class="r">${r.rev ? Math.round(r.pr / r.rev * 100) : 0}%</td></tr>`).join("")}<tr class="tot"><td colspan="2">Jami</td><td class="r">${mshort(sum(rows, r => r.rev))}</td><td class="r">${mshort(sum(rows, r => r.c))}</td><td class="r">${mshort(sum(rows, r => r.pr))}</td><td></td></tr></tbody></table></div>` : `<div class="empty">Shu davrda sotilgan loyiha yo'q</div>`}</div>`;
  // Jurnal
  const jr = [...pays.map(p => ({d:p.date, t:"in", x:p})), ...exps.map(e => ({d:e.date, t:"out", x:e}))].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 60);
  h += bankCardHTML();
  h += `<div class="card"><div class="card-h"><h2>Kassa jurnali</h2><span class="t2">oxirgi ${jr.length} ta</span></div>${jr.length ? `<div class="tblw"><table class="tbl"><tbody>${jr.map(r => { const pr = ST.projects.find(p => p.id === r.x.project_id); return `<tr><td class="nowrap">${fdate(r.d)}</td><td><div class="t1">${r.t === "in" ? esc(PAY_KINDS[r.x.kind] || "Kirim") + " " + payBadge(r.x) : esc(EXP[r.x.category]?.n || EXP_GENERAL[r.x.category] || r.x.category)}</div><div class="t2">${pr ? pno(pr) + " · " + esc(projectTitle(pr)) : "Umumiy"}${r.t === "out" && expDetail(r.x) ? " · " + esc(expDetail(r.x)) : ""} · ${esc(userName(r.x.created_by))}</div></td><td class="r nowrap ${r.t === "in" ? "ok-t" : "bad-t"}">${r.t === "in" ? "+" : "−"}${money(r.x.amount)}</td><td class="r">${isRole("admin","buxgalter") ? `<button class="iconbtn sm" data-act="${r.t === "in" ? "payDel" : "expDel"}" data-id="${r.x.id}" aria-label="O'chirish">${ic("trash", 16)}</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty">Shu davrda yozuv yo'q</div>`}</div>`;
  return h;
}

/* ---------------- Uslugalar ---------------- */
function vUslugalar(){
  let h = `<div class="head"><div><h1>Uslugalar</h1><p class="muted">Kesish, kromka va rover qilinadigan sexlar: o'zimizniki va tashqi</p></div>${isRole("admin","menejer") ? `<button class="btn pri" data-act="svcEdit" data-id="">+ Usluga</button>` : ""}</div>`;
  const list = ST.services.filter(s => s.active !== false);
  if (!list.length) return h + `<div class="card"><div class="empty"><h3>Uslugalar kiritilmagan</h3></div></div>`;
  return h + `<div class="cards">${list.map(s => { const ex = ST.expenses.filter(e => e.service_id === s.id); const pr = s.prices || {}; const projs = new Set(ex.map(e => e.project_id)).size; return `<div class="card pad" style="margin:0"><div class="pc-top"><b class="t1">${esc(s.name)}</b>${s.own ? pill("O'z sexi", "accent") : pill("Tashqi usluga", "")}</div>
    <div class="t2">${esc([s.phone, s.address].filter(Boolean).join(" · "))}</div>
    ${kv([["Arralar", esc((s.saws || []).join(", ") || "—")], ["Kesish", pr.kesish ? money(pr.kesish) + " / list" : ""], ["Kromka 0.4", pr.k04 ? money(pr.k04) + " / m" : ""], ["Kromka 1 mm", pr.k1 ? money(pr.k1) + " / m" : ""], ["Kromka 2 mm", pr.k2 ? money(pr.k2) + " / m" : ""], ["Dvaynoy ustama", pr.dv ? money(pr.dv) + " / m" : ""], ["Rover", pr.rover ? money(pr.rover) + " / detal" : ""], ...(canFin() ? [["Jami to'langan", money(sum(ex, e => e.amount)) + ` · ${projs} loyiha`]] : [])])}
    ${isRole("admin","menejer") ? `<div class="actions"><button class="btn sm" data-act="svcEdit" data-id="${s.id}">${ic("edit", 16)} Tahrirlash</button></div>` : ""}</div>`; }).join("")}</div>`;
}

/* ---------------- Xodimlar ---------------- */
function vXodimlar(){
  let h = `<div class="head"><div><h1>Xodimlar</h1><p class="muted">Har bir xodimning logini, roli va natijasi</p></div><button class="btn pri" data-act="userEdit" data-id="">+ Xodim</button></div>`;
  return h + `<div class="card"><div class="tblw"><table class="tbl"><thead><tr><th>Xodim</th><th>Rol</th><th>Login</th><th class="r">Lead</th><th class="r">Sotdi</th><th class="r">Faol vazifa</th><th></th></tr></thead><tbody>${ST.users.map(u => { const leads = ST.projects.filter(p => p.sellerId === u.id).length, sold = ST.projects.filter(p => p.sellerId === u.id && p.sale).length; const tasks = ST.projects.filter(p => { const s = nextStep(p); return s && (s.who === u.id || (s.all || []).includes(u.id)); }).length; return `<tr style="${u.active === false ? "opacity:.5" : ""}"><td><div class="t1">${esc(u.name)}</div><div class="t2">${esc(u.phone || "")}</div></td><td>${rolesOf(u).map(r => pill(ROLES[r]?.n || r, r === "admin" ? "accent" : "")).join(" ")}${u.active === false ? " " + pill("faol emas", "bad") : ""}</td><td class="mono">${esc(u.login)}</td><td class="r">${leads}</td><td class="r">${sold}</td><td class="r">${tasks}</td><td class="r"><button class="btn sm" data-act="userEdit" data-id="${u.id}">Tahrirlash</button></td></tr>`; }).join("")}</tbody></table></div></div>
    <p class="muted small">Har bir xodim ilovaga o'z logini va paroli bilan kiradi. Ilova rolga qarab kerakli bo'limlarni ochadi.</p>`;
}

/* ---------------- Sozlamalar ---------------- */
function vSozlamalar(){
  let h = `<div class="head"><div><h1>Sozlamalar</h1></div></div>`;
  h += `<div class="grid2"><div class="card"><div class="card-h"><h2>Mening profilim</h2></div>${kv([["Ism", esc(ST.me.name)], ["Login", `<span class="mono">${esc(ST.me.login)}</span>`], ["Rol", esc(roleNames(ST.me))]])}<div class="actions"><button class="btn" data-act="myPass">Parolni o'zgartirish</button><button class="btn danger" data-act="logout">Chiqish</button></div></div>`;
  if (isRole("admin")) h += `<div class="card"><div class="card-h"><h2>Korxona</h2></div><form id="setForm" class="stack"><div class="fld"><label for="s-co">Korxona nomi</label><input class="inp" id="s-co" name="company" value="${esc(ST.settings.company || "")}"></div><div class="fld"><label for="s-days">Odatiy tayyorlash muddati (kun)</label><input class="inp" id="s-days" name="defaultDays" inputmode="numeric" value="${esc(ST.settings.defaultDays || 25)}"></div><button class="btn pri" type="submit">Saqlash</button></form></div>`;
  h += `</div>` + installHTML(true) + (isRole("admin") ? bankSettingsHTML() : "") + notifSettingsHTML() + `<div class="card"><div class="card-h"><h2>Yangiliklar</h2><span class="t2">versiya ${APP_VERSION}</span></div>${CHANGELOG.map(([v, d, items]) => `<div class="news"><b>${esc(v)}</b> <span class="t2">${esc(d)}</span><ul>${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div><div class="card"><div class="card-h"><h2>Ilova haqida</h2></div>${kv([["Versiya", APP_VERSION], ["Rejim", B.mode === "local" ? "Sinov: ma'lumotlar shu brauzerda" : "Ish: umumiy server (Supabase)"], ["Yangilanish", `<button class="btn sm" data-act="checkUpd">Yangi versiyani tekshirish</button>`]])}${B.mode === "local" && isRole("admin") ? `<div class="actions"><button class="btn danger" data-act="resetDemo">Sinov ma'lumotlarini tozalash</button></div>` : ""}</div>`;
  return h;
}
const VIEWS = {bosh:vBosh, vazifalar:vVazifalar, jarayonlar:vJarayonlar, loyihalar:vLoyihalar, sotuv:vSotuv, moliya:vMoliya, uslugalar:vUslugalar, xodimlar:vXodimlar, sozlamalar:vSozlamalar};

/* ---------------- Modal va shakllar ---------------- */
const fld = (label, name, val = "", o = {}) => {
  const id = "m-" + name;
  let inp;
  if (o.sel) inp = `<select class="inp" id="${id}" name="${name}">${o.sel.map(([v, n]) => `<option value="${esc(v)}" ${String(v) === String(val ?? "") ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
  else if (o.area) inp = `<textarea class="inp" id="${id}" name="${name}" rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}">${esc(val)}</textarea>`;
  else if (o.chips) inp = `<div class="chips" data-chips="${name}" ${o.single ? "data-single" : ""}>${o.chips.map(([v, n]) => `<button type="button" class="chip ${(Array.isArray(val) ? val.includes(v) : val === v) ? "on" : ""}" data-chip="${esc(v)}">${esc(n)}</button>`).join("")}</div>`;
  else if (o.check) inp = `<label class="cbx"><input type="checkbox" id="${id}" name="${name}" ${val ? "checked" : ""}> ${esc(o.check)}</label>`;
  else inp = `<input class="inp ${o.num ? "r" : ""}" id="${id}" name="${name}" type="${o.type || "text"}" ${o.num ? 'inputmode="decimal"' : ""} value="${esc(val ?? "")}" placeholder="${esc(o.ph || "")}" ${o.req ? "required" : ""} ${o.auto ? `autocomplete="${o.auto}"` : ""}>`;
  return `<div class="fld ${o.full ? "full" : ""}"><label for="${id}">${esc(label)}${o.req ? " *" : ""}</label>${inp}${o.hint ? `<small>${esc(o.hint)}</small>` : ""}</div>`;
};
const userOpts = (roles, empty = "— tanlang —") => [["", empty], ...ST.users.filter(u => u.active !== false && (!roles || rolesOf(u).some(r => roles.includes(r)))).map(u => [u.id, `${u.name} (${roleNames(u)})`])];
function openModal(m){ UI.modal = m; renderModal(); setTimeout(() => { const f = document.querySelector("#modal input:not([type=hidden]):not([type=checkbox]), #modal select, #modal textarea"); if (f && !m.noFocus) f.focus(); }, 40); }
function closeModal(){ UI.modal = null; renderModal(); }
function renderModal(){
  const host = $("#modalHost"); const m = UI.modal; UI.modalShown = m;
  if (!m){ host.innerHTML = ""; document.body.classList.remove("noscroll"); return; }
  document.body.classList.add("noscroll");
  host.innerHTML = `<div class="scrim" data-act="closeModal"></div><form class="modal ${m.wide ? "wide" : ""}" id="modal" role="dialog" aria-label="${esc(m.title)}" novalidate>
    <div class="m-h"><h2>${esc(m.title)}</h2><button type="button" class="iconbtn" data-act="closeModal" aria-label="Yopish">✕</button></div>
    <div class="m-b">${m.body}${m.err ? `<div class="err">${esc(m.err)}</div>` : ""}</div>
    <div class="m-f"><button type="button" class="btn" data-act="closeModal">Bekor qilish</button><button type="submit" class="btn ${m.danger ? "danger-f" : "pri"}" ${UI.busy ? "disabled" : ""}>${esc(m.ok || "Saqlash")}</button></div></form>`;
}
function modalVals(){
  const f = $("#modal"); const o = {};
  f.querySelectorAll("input,select,textarea").forEach(el => { if (!el.name) return; o[el.name] = el.type === "checkbox" ? el.checked : el.value; });
  f.querySelectorAll("[data-chips]").forEach(c => { const v = [...c.querySelectorAll(".chip.on")].map(b => b.dataset.chip); o[c.dataset.chips] = c.hasAttribute("data-single") ? (v[0] || "") : v; });
  return o;
}
function confirmBox(title, text, ok, fn, danger = true){ openModal({title, body:`<p>${text}</p>`, ok, danger, noFocus:true, submit: async () => { await fn(); }}); }

/* ---------------- Amallar ---------------- */
function getP(id){ return clone(ST.projects.find(p => p.id === id)); }
function log(p, t){ p.log = [...(p.log || []), {d:nowStr(), ts:new Date().toISOString(), u:ST.me.name, t}].slice(-150); }
async function saveP(p, msg){
  const saved = await B.saveProject(p);
  const i = ST.projects.findIndex(x => x.id === saved.id);
  if (i >= 0) ST.projects[i] = saved; else ST.projects.unshift(saved);
  if (msg) toast(msg); schedule(); return saved;
}
async function addPay(p, amount, kind, method, note, date){
  if (!(num(amount) > 0)) return;
  const r = await B.addPayment({project_id:p ? p.id : null, date:date || today(), amount:num(amount), kind, method, note:note || ""});
  await reload();
}
const ACT = {
  closeModal, menu: () => { UI.menu = !UI.menu; render(); },
  go: e => { location.hash = e.dataset.v; },
  loginMode: e => { UI.loginMode = e.dataset.v; UI.loginErr = ""; render(); },
  demoFill: e => { const l = $("#l-login"), pw = $("#l-pass"); if (l) l.value = e.dataset.l; if (pw) pw.value = e.dataset.p; },
  logout: async () => { await B.signOut(); ST.me = null; UI.menu = false; UI.route = "bosh"; location.hash = ""; render(); },
  period: e => { UI.period = e.dataset.v; render(); },
  ltab: e => { UI.ltab = e.dataset.v; UI.lstage = ""; render(); },
  lstage: e => { UI.lstage = e.dataset.v; render(); },
  lview: e => { UI.lview = e.dataset.v; render(); },
  ptab: e => { UI.ptab = e.dataset.v; render(); },
  jmine: e => { UI.jmine = !!e.dataset.v; render(); },
  jview: e => { UI.jview = e.dataset.v; render(); },
  prodNext: async e => { const p = getP(e.dataset.id); const k = e.dataset.k; p.prod = {...(p.prod || {})}; p.prod.checks = {...(p.prod.checks || {}), [k]:{by:ST.me.name, d:fdate(today())}}; log(p, "Bajarildi: " + (PROD_CHECKS.find(x => x[0] === k)?.[1] || k)); try { await saveP(p, (PROD_CHECKS.find(x => x[0] === k)?.[1] || "") + " — belgilandi"); } catch (x) { toast(x.message); } },
  openFrom: e => { UI.from = UI.route.startsWith("p-") ? UI.from : UI.route; location.hash = e.getAttribute("href").slice(1); },
  checkUpd: async () => { await checkVersion(true); },
  doUpdate: async () => { try { const r = await navigator.serviceWorker?.getRegistration?.(); if (r) await r.update(); } catch (x) {} location.reload(); },
  hideUpdate: () => { UI.updHidden = UI.newVer?.version; render(); },
  gotoStage: e => { UI.ltab = "faol"; UI.lstage = e.dataset.v; location.hash = "loyihalar"; },
  copy: e => { const v = e.dataset.v; navigator.clipboard?.writeText(v).then(() => toast("Nusxa olindi: " + v), () => toast(v)); },
  copySmeta: e => { const p = ST.projects.find(x => x.id === e.dataset.id); const ex = ST.expenses.filter(x => x.project_id === p.id); const rev = projectPrice(p) + projectExtra(p), c = sum(ex, x => x.amount);
    const t = [`Smeta: ${pno(p)} ${projectTitle(p)}`, `Daromad: ${money(rev)}`, `To'langan: ${money(projectPaid(p))}`, ...[...new Set(ex.map(x => x.category))].map(k => `  ${EXP[k]?.n || k}: ${money(sum(ex.filter(x => x.category === k), x => x.amount))}`), `Tannarx: ${money(c)}`, `Foyda: ${money(rev - c)}`].join("\n");
    navigator.clipboard?.writeText(t).then(() => toast("Smeta nusxalandi"), () => toast("Nusxa olib bo'lmadi")); },

  newProject: () => openModal({title:"Yangi loyiha (lead)", wide:true, ok:"Leadni saqlash", body:`<div class="form">
      ${fld("Telefon raqami", "phone", "+998 ", {req:true, type:"tel", auto:"tel"})}${fld("Mijoz ismi", "name", "", {auto:"name"})}
      ${fld("Qanday mebel kerak", "types", [], {chips:NEED_TYPES.map(x => [x, x]), full:true})}
      ${fld("Tafsilot", "desc", "", {area:true, full:true, ph:"Masalan: oshxona 3,2 m, burchakli, MDF emal, oq rang"})}
      ${fld("Manzil", "address", "")}${fld("Qayerdan keldi", "source", "", {sel:[["", "— tanlang —"], ...SOURCES.map(s => [s, s])]})}
      ${fld("Taxminiy narx (aytilgan bo'lsa)", "approx", "", {num:true, hint:"aytilmagan bo'lsa bo'sh qoldiring"})}${fld("Sotuvchi", "seller", ST.me.id, {sel:userOpts(null)})}
      ${fld("Izoh", "note", "", {area:true, full:true, rows:2})}</div>`,
    submit: async v => {
      const phone = v.phone.trim(); if (phone.replace(/\D/g, "").length < 7) throw new Error("Telefon raqamini to'liq kiriting");
      const dup = ST.projects.find(p => p.client?.phone && p.client.phone.replace(/\D/g, "").slice(-9) === phone.replace(/\D/g, "").slice(-9) && p.status !== "yopilgan");
      const p = {stage:"lead", status:"faol", sellerId:v.seller || ST.me.id, client:{name:v.name.trim(), phone, address:v.address, source:v.source}, need:{types:v.types, desc:v.desc}, lead:{approxPrice:num(v.approx), note:v.note, date:today()}, log:[]};
      log(p, "Lead qo'shildi" + (num(v.approx) ? ` · taxminiy narx ${money(v.approx)}` : ""));
      const s = await saveP(p, dup ? `Saqlandi. Diqqat: bu raqam ${pno(dup)} loyihada ham bor` : "Lead saqlandi");
      location.hash = "p-" + s.id;
    }}),
  editClient: e => { const p = getP(e.dataset.id); openModal({title:"Mijoz va ehtiyoj", wide:true, body:`<div class="form">
      ${fld("Telefon", "phone", p.client?.phone, {req:true, type:"tel"})}${fld("Qo'shimcha telefon", "phone2", p.client?.phone2, {type:"tel"})}${fld("Ism", "name", p.client?.name)}${fld("Manzil", "address", p.client?.address)}
      ${fld("Qanday mebel kerak", "types", p.need?.types || [], {chips:NEED_TYPES.map(x => [x, x]), full:true})}${fld("Tafsilot", "desc", p.need?.desc, {area:true, full:true})}
      ${fld("Manba", "source", p.client?.source, {sel:[["", "—"], ...SOURCES.map(s => [s, s])]})}${fld("Sotuvchi", "seller", p.sellerId, {sel:userOpts(null)})}</div>`,
    submit: async v => { p.client = {...p.client, phone:v.phone, phone2:v.phone2, name:v.name, address:v.address, source:v.source}; p.need = {types:v.types, desc:v.desc}; p.sellerId = v.seller || p.sellerId; log(p, "Mijoz ma'lumotlari tahrirlandi"); await saveP(p, "Saqlandi"); }}); },
  approx: e => { const p = getP(e.dataset.id); openModal({title:"Taxminiy narx", body:`<div class="form">${fld("Mijozga aytilgan taxminiy narx", "approx", p.lead?.approxPrice || "", {num:true, full:true})}</div>`, submit: async v => { p.lead = {...p.lead, approxPrice:num(v.approx)}; log(p, "Taxminiy narx: " + money(v.approx)); await saveP(p, "Saqlandi"); }}); },
  toZamer: e => { const p = getP(e.dataset.id); const z = p.zamer || {}; openModal({title:"O'lchovga yuborish", body:`<div class="form">
      ${fld("Kim o'lchaydi", "who", z.assignedTo || (isRole("olchovchi") ? ST.me.id : ""), {sel:userOpts(["olchovchi","sotuvchi","menejer","admin","texnolog"]), req:true})}${fld("Sana", "date", z.plannedDate || addDays(1), {type:"date"})}${fld("Vaqt", "time", z.plannedTime || "", {ph:"masalan 15:00"})}${fld("Izoh", "note", z.note || "", {area:true, full:true, rows:2})}</div>`,
    submit: async v => { if (!v.who) throw new Error("O'lchovchini tanlang"); p.zamer = {...z, assignedTo:v.who, plannedDate:v.date, plannedTime:v.time, note:v.note}; if (p.stage === "lead"){ p.stage = "zamer"; log(p, `O'lchovga yuborildi: ${userName(v.who)}, ${fdate(v.date)}`); } else log(p, `O'lchov rejasi o'zgardi: ${userName(v.who)}, ${fdate(v.date)}`); await saveP(p, "O'lchov rejalashtirildi"); }}); },
  zamerDone: e => { const p = getP(e.dataset.id); const z = p.zamer || {}; openModal({title:"O'lchov natijasi va aniq narx", wide:true, body:`<div class="form">
      ${fld("O'lchangan sana", "date", z.doneDate || today(), {type:"date"})}${fld("Kim o'lchadi", "by", z.by || z.assignedTo || ST.me.id, {sel:userOpts(null)})}
      ${fld("O'lchamlar", "dims", z.dims || "", {area:true, full:true, rows:3, ph:"Devor: 3200 mm, balandlik 2700, rozetka 1100 dan…"})}
      ${fld("Hisob-kitob izohi", "calc", z.calc || "", {area:true, full:true, rows:2, ph:"Material, furnitura, fasad turi"})}
      ${fld("Aniq narx (mijozga yozib berilgan)", "price", z.exactPrice || "", {num:true, req:true, hint:p.lead?.approxPrice ? "1-etapda aytilgan taxminiy narx: " + money(p.lead.approxPrice) : ""})}
      ${fld("3D model kerakmi", "model3d", z.model3d === undefined ? "ha" : z.model3d ? "ha" : "yoq", {sel:[["ha","Ha, 3D model tayyorlanadi"],["yoq","Yo'q, kerak emas"]]})}</div>`,
    submit: async v => { if (!(num(v.price) > 0)) throw new Error("Aniq narxni kiriting"); p.zamer = {...z, doneDate:v.date, by:v.by, dims:v.dims, calc:v.calc, exactPrice:num(v.price), model3d:v.model3d === "ha"}; if (p.stage === "lead") p.stage = "zamer"; log(p, `O'lchandi, aniq narx: ${money(v.price)}`); await saveP(p, "O'lchov natijasi saqlandi"); }}); },
  sold: e => { const p = getP(e.dataset.id); const price = p.zamer?.exactPrice || p.lead?.approxPrice || ""; openModal({title:"Sotuv: loyiha ishga tushadi", wide:true, ok:"Sotildi — ishga tushirish", body:`<div class="form">
      ${fld("Shartnoma narxi", "price", price, {num:true, req:true})}${fld("Oldindan to'lov (zaklat)", "pre", "", {num:true, hint:"hozir olingan summa"})}
      ${fld("To'lov usuli", "method", "naqd", {sel:Object.entries(PAY_METHODS)})}${fld("Topshirish muddati", "deadline", addDays(num(ST.settings.defaultDays) || 25), {type:"date"})}
      ${fld("3D model kerakmi", "model3d", p.zamer?.model3d === false ? "yoq" : "ha", {sel:[["ha","Ha"],["yoq","Yo'q"]]})}${fld("Loyiha menejeri", "manager", p.managerId || "", {sel:userOpts(["menejer","admin"])})}
      ${fld("Texnolog / dizayner", "tech", p.design?.by || "", {sel:userOpts(["texnolog","menejer","admin"])})}${fld("Izoh", "note", "", {})}</div>`,
    submit: async v => { if (!(num(v.price) > 0)) throw new Error("Shartnoma narxini kiriting");
      p.sale = {date:today(), price:num(v.price), deadline:v.deadline, model3d:v.model3d === "ha", note:v.note, by:ST.me.id};
      p.status = "faol"; p.stage = "loyiha"; p.managerId = v.manager || p.managerId || null; p.design = {...(p.design || {}), by:v.tech || p.design?.by || ""};
      p.decision = {...(p.decision || {}), type:"sotildi", date:today()};
      if (!p.zamer?.exactPrice) p.zamer = {...(p.zamer || {}), exactPrice:num(v.price)};
      log(p, `Sotildi: ${money(v.price)}${num(v.pre) ? `, zaklat ${money(v.pre)}` : ""}, muddat ${fdate(v.deadline)}`);
      await saveP(p); await addPay(p, v.pre, "zaklat", v.method, "Shartnoma bo'yicha oldindan to'lov"); toast("Tabriklaymiz! Loyiha ishga tushdi"); schedule(); }}); },
  thinking: e => { const p = getP(e.dataset.id); openModal({title:"Mijoz o'ylab ko'radi", body:`<div class="form">
      ${fld("Qachon qayta aloqaga chiqish", "when", "7", {chips:FOLLOW.map(([d, n]) => [String(d), n]), single:true, full:true})}${fld("Yoki aniq sana", "date", "", {type:"date"})}${fld("Izoh", "note", "", {area:true, full:true, rows:2, ph:"Masalan: turmush o'rtog'i bilan maslahatlashadi"})}</div>`,
    submit: async v => { const f = v.date || addDays(num(v.when) || 7); p.status = "kutish"; p.decision = {...(p.decision || {}), type:"kutish", date:today(), followup:f, note:v.note, followups:[...(p.decision?.followups || []), {date:today(), note:v.note || "O'ylab ko'radi", by:ST.me.name}]}; log(p, `O'ylab ko'radi · qayta aloqa ${fdate(f)}`); await saveP(p, "Eslatma qo'yildi: " + fdate(f)); }}); },
  refuse: e => { const p = getP(e.dataset.id); openModal({title:"Mijoz rad etdi", ok:"Rad etildi deb yozish", danger:true, body:`<div class="form">${fld("Sabab", "reason", "", {chips:REFUSE, single:true, full:true})}${fld("Izoh", "note", "", {area:true, full:true, rows:2})}</div>`,
    submit: async v => { if (!v.reason) throw new Error("Sababni tanlang"); p.status = "rad"; p.decision = {...(p.decision || {}), type:"rad", date:today(), reason:v.reason, note:v.note}; log(p, "Rad etdi: " + (REFUSE.find(r => r[0] === v.reason)?.[1] || "")); await saveP(p, "Saqlandi"); }}); },
  restore: e => { const p = getP(e.dataset.id); p.status = "faol"; log(p, "Loyiha qayta tiklandi"); saveP(p, "Qayta tiklandi").catch(x => toast(x.message)); },
  check: async e => { const p = getP(e.dataset.id); const sec = e.dataset.sec, k = e.dataset.k; p[sec] = {...(p[sec] || {})}; p[sec].checks = {...(p[sec].checks || {})}; const was = !!p[sec].checks[k]; if (was) delete p[sec].checks[k]; else p[sec].checks[k] = {by:ST.me.name, d:fdate(today())}; const lbl = e.querySelector("span")?.childNodes[0]?.textContent || k; log(p, (was ? "Bekor qilindi: " : "Bajarildi: ") + lbl); try { await saveP(p); } catch (x) { toast(x.message); } },
  designEdit: e => { const p = getP(e.dataset.id); openModal({title:"Loyihalash", body:`<div class="form">${fld("Texnolog / dizayner", "by", p.design?.by || "", {sel:userOpts(["texnolog","menejer","admin"])})}${fld("Izoh", "note", p.design?.note || "", {area:true, full:true})}</div>`, submit: async v => { p.design = {...(p.design || {}), by:v.by, note:v.note}; log(p, "Loyihalash: texnolog " + userName(v.by)); await saveP(p, "Saqlandi"); }}); },
  furnAdd: e => { const p = getP(e.dataset.id); openModal({title:"Furnitura qatori", body:`<div class="form">${fld("Turi", "type", "Petlya", {sel:FURN_TYPES.map(x => [x, x])})}${fld("Nomi / modeli", "name", "", {ph:"Blum Clip Top, 110°"})}${fld("Soni", "qty", "1", {num:true})}${fld("Taxminiy narx (dona)", "price", "", {num:true})}</div>`, submit: async v => { p.design = {...(p.design || {})}; p.design.furn = [...(p.design.furn || []), {type:v.type, name:v.name, qty:num(v.qty), price:num(v.price)}]; await saveP(p, "Qo'shildi"); }}); },
  furnDel: async e => { const p = getP(e.dataset.id); p.design.furn.splice(+e.dataset.i, 1); try { await saveP(p); } catch (x) { toast(x.message); } },
  toProd: e => { const p = getP(e.dataset.id); const d = p.design || {}; const miss = [p.sale?.model3d && !d.checks?.model3d ? "3D model" : "", !d.checks?.parts ? "detallar ro'yxati" : "", !d.checks?.furn ? "furnitura hisobi" : ""].filter(Boolean);
    const go = async () => { p.stage = "ishlab"; log(p, "Ishlab chiqarishga berildi"); await saveP(p, "Ishlab chiqarishga berildi"); };
    if (miss.length) confirmBox("Loyihalash tugamagan", `Belgilanmagan: <b>${esc(miss.join(", "))}</b>. Baribir ishlab chiqarishga berilsinmi?`, "Ha, berish", go, false); else go().catch(x => toast(x.message)); },
  prodPlan: e => { const p = getP(e.dataset.id); const pr = p.prod || {}; const svc = [["", "— tanlang —"], ...ST.services.filter(s => s.active !== false).map(s => [s.id, s.name + (s.own ? " (o'z sex)" : "")])];
    openModal({title:"Qaysi uslugada qilinadi", wide:true, body:`<div class="form">
      <div class="full sub" style="margin:0">Kesish</div>${fld("Usluga", "cutService", pr.cutService || "", {sel:svc})}${fld("Arra", "saw", pr.saw || "", {sel:[["", "—"], ...SAWS.map(s => [s, s])]})}
      <div class="full sub" style="margin:0">Kromkalash</div>${fld("Usluga", "edgeService", pr.edgeService || "", {sel:svc})}${fld("Kromka turi", "edgeType", pr.edgeType || "0.4 mm", {sel:EDGE_TYPES.map(x => [x, x])})}${fld("Dvaynoy", "double", !!pr.double, {check:"Dvaynoy (ikki qatlam) kromka"})}<div></div>
      <div class="full sub" style="margin:0">Rover (CNC)</div>${fld("Rover kerakmi", "rover", !!pr.rover, {check:"Ha, rover bor"})}${fld("Usluga", "roverService", pr.roverService || "", {sel:svc})}
      ${fld("Izoh", "note", pr.note || "", {area:true, full:true, rows:2})}</div>`,
    submit: async v => { p.prod = {...pr, cutService:v.cutService, saw:v.saw, edgeService:v.edgeService, edgeType:v.edgeType, double:v.double, rover:v.rover, roverService:v.roverService, note:v.note}; log(p, `Ishlab chiqarish rejasi: kesish ${svcName(v.cutService)}${v.saw ? " (" + v.saw + ")" : ""}, kromka ${svcName(v.edgeService)} ${v.edgeType}${v.double ? " dvaynoy" : ""}${v.rover ? ", rover " + svcName(v.roverService) : ""}`); await saveP(p, "Saqlandi"); }}); },
  toAsm: e => { const p = getP(e.dataset.id); const ch = p.prod?.checks || {}; const miss = PROD_CHECKS.filter(([k]) => (k !== "rover" || p.prod?.rover) && !ch[k]).map(x => x[1]);
    const go = async () => { p.stage = "yigish"; p.asm = {...(p.asm || {}), start:p.asm?.start || today()}; log(p, "Yig'ishga o'tkazildi"); await saveP(p, "Yig'ishga o'tkazildi"); };
    if (miss.length) confirmBox("Ishlab chiqarish tugamagan", `Belgilanmagan: <b>${esc(miss.join(", "))}</b>. Baribir yig'ishga o'tkazilsinmi?`, "Ha, o'tkazish", go, false); else go().catch(x => toast(x.message)); },
  addWorker: e => { const p = getP(e.dataset.id); openModal({title:"Yig'uvchi qo'shish", body:`<div class="form">${fld("Xodim", "wid", "", {sel:userOpts(["yiguvchi","ornatuvchi","menejer","admin"]), req:true})}${fld("Kelishilgan haq (so'm)", "pay", "", {num:true})}${fld("Izoh", "note", "", {full:true, ph:"masalan: korpus va fasad, 3 kun"})}</div>`,
    submit: async v => { if (!v.wid) throw new Error("Xodimni tanlang"); p.asm = {...(p.asm || {})}; p.asm.workers = [...(p.asm.workers || []), {id:v.wid, pay:num(v.pay), note:v.note}]; log(p, `Yig'uvchi: ${userName(v.wid)}, ${money(v.pay)}`); await saveP(p, "Qo'shildi"); }}); },
  delWorker: async e => { const p = getP(e.dataset.id); const w = p.asm.workers.splice(+e.dataset.i, 1)[0]; log(p, "Yig'uvchi olib tashlandi: " + userName(w?.id)); try { await saveP(p); } catch (x) { toast(x.message); } },
  payWorker: e => { const p = getP(e.dataset.id); const w = p.asm.workers[+e.dataset.i]; const paidW = sum(ST.expenses.filter(x => x.project_id === p.id && x.category === "yigish" && x.details?.worker === w.id), x => x.amount);
    openModal({title:"Yig'uvchiga to'lov", body:`<div class="form">${fld("Summa", "amount", Math.max(0, num(w.pay) - paidW) || "", {num:true, req:true, hint:`Kelishilgan ${money(w.pay)}, to'langan ${money(paidW)}`})}${fld("Sana", "date", today(), {type:"date"})}${fld("Izoh", "note", "", {full:true})}</div>`,
    submit: async v => { if (!(num(v.amount) > 0)) throw new Error("Summani kiriting"); await B.saveExpense({project_id:p.id, date:v.date, category:"yigish", amount:num(v.amount), details:{worker:w.id}, note:v.note}); log(p, `Yig'uvchiga to'landi: ${userName(w.id)} ${money(v.amount)}`); await saveP(p, "To'lov yozildi"); await reload(); }}); },
  asmEdit: e => { const p = getP(e.dataset.id); openModal({title:"Yig'ish", body:`<div class="form">${fld("Loyiha menejeri", "manager", p.managerId || "", {sel:userOpts(["menejer","admin"])})}${fld("Boshlangan sana", "start", p.asm?.start || today(), {type:"date"})}${fld("Izoh", "note", p.asm?.note || "", {area:true, full:true, rows:2})}</div>`, submit: async v => { p.managerId = v.manager || null; p.asm = {...(p.asm || {}), start:v.start, note:v.note}; await saveP(p, "Saqlandi"); }}); },
  toInstall: e => { const p = getP(e.dataset.id); p.stage = "ornatish"; log(p, "Yig'ish tugadi, o'rnatishga o'tkazildi"); saveP(p, "O'rnatishga o'tkazildi").then(() => ACT.installEdit(e)).catch(x => toast(x.message)); },
  installEdit: e => { const p = getP(e.dataset.id); const ins = p.install || {}; openModal({title:"O'rnatish", body:`<div class="form">${fld("O'rnatish sanasi", "date", ins.date || addDays(1), {type:"date"})}<div></div>${fld("Jamoa", "team", ins.team || [], {chips:ST.users.filter(u => u.active !== false && rolesOf(u).some(r => ["ornatuvchi","yiguvchi","menejer","haydovchi"].includes(r))).map(u => [u.id, u.name]), full:true})}${fld("Izoh", "note", ins.note || "", {area:true, full:true, rows:2})}</div>`,
    submit: async v => { p.install = {...ins, date:v.date, team:v.team, note:v.note}; log(p, `O'rnatish: ${fdate(v.date)}, ${v.team.map(userName).join(", ") || "jamoa tanlanmagan"}`); await saveP(p, "Saqlandi"); }}); },
  toHand: e => { const p = getP(e.dataset.id); p.stage = "topshirish"; log(p, "O'rnatildi, topshirish bosqichi"); saveP(p, "Topshirish bosqichi").catch(x => toast(x.message)); },
  handEdit: e => { const p = getP(e.dataset.id); const hd = p.hand || {}; openModal({title:"Topshirish natijasi", wide:true, body:`<div class="form">
      ${fld("Topshirilgan sana", "date", hd.date || today(), {type:"date"})}${fld("Mijoz rozimi", "satisfied", hd.satisfied || "ha", {sel:[["ha","Ha, hammasidan rozi"],["qisman","Qisman rozi"],["yoq","Rozi emas"]]})}
      ${fld("Nimadan norozi", "complaints", hd.complaints || [], {chips:COMPLAINTS, full:true})}${fld("Izoh", "complaintText", hd.complaintText || "", {area:true, full:true, rows:2})}
      ${fld("Chala ishlar (har qatorga bittadan)", "unfinished", (hd.unfinished || []).filter(u => !u.done).map(u => u.text).join("\n"), {area:true, full:true, rows:3, ph:"Masalan: 2 ta ruchka o'rnatilmagan"})}
      ${fld("Qo'shimcha xizmatlar", "extra", hd.extra || "", {full:true, ph:"Masalan: qo'shimcha tokcha, ko'zgu"})}${fld("Qo'shimcha xizmat narxi", "extraPrice", hd.extraPrice || "", {num:true, hint:"umumiy narxga qo'shiladi"})}</div>`,
    submit: async v => { const done = (hd.unfinished || []).filter(u => u.done); const fresh = v.unfinished.split("\n").map(s => s.trim()).filter(Boolean).map(text => ({text, done:false}));
      p.hand = {...hd, date:v.date, satisfied:v.satisfied, complaints:v.complaints, complaintText:v.complaintText, unfinished:[...done, ...fresh], extra:v.extra, extraPrice:num(v.extraPrice)};
      log(p, `Topshirildi: mijoz ${v.satisfied === "ha" ? "rozi" : v.satisfied === "qisman" ? "qisman rozi" : "rozi emas"}${fresh.length ? `, chala ish: ${fresh.length}` : ""}`); await saveP(p, "Saqlandi"); }}); },
  unfin: async e => { const p = getP(e.dataset.id); const u = p.hand.unfinished[+e.dataset.i]; u.done = !u.done; log(p, (u.done ? "Chala ish bajarildi: " : "Chala ish qayta ochildi: ") + u.text); try { await saveP(p); } catch (x) { toast(x.message); } },
  close: e => { const p = getP(e.dataset.id); const debt = projectPrice(p) + projectExtra(p) - projectPaid(p); const open = (p.hand?.unfinished || []).filter(u => !u.done).length;
    const warn = [debt > 0 ? `mijozning qarzi ${money(debt)}` : "", open ? `${open} ta chala ish bajarilmagan` : "", !p.hand?.date ? "topshirish natijasi yozilmagan" : ""].filter(Boolean);
    confirmBox("Loyihani yopish", (warn.length ? `<b style="color:var(--bad)">Diqqat: ${esc(warn.join("; "))}.</b><br>` : "Hammasi joyida. ") + "Loyiha yopiladi va yakuniy smeta chiqariladi.", "Yopish", async () => { p.status = "yopilgan"; p.closedAt = today(); p.closedBy = ST.me.id; if (!p.hand?.date) p.hand = {...(p.hand || {}), date:today()}; log(p, "Loyiha yopildi"); await saveP(p, "Loyiha yopildi"); }, !!warn.length); },
  reopen: e => { const p = getP(e.dataset.id); p.status = "faol"; p.stage = "topshirish"; log(p, "Loyiha qayta ochildi"); saveP(p, "Qayta ochildi").catch(x => toast(x.message)); },
  delProject: e => { const p = ST.projects.find(x => x.id === e.dataset.id); confirmBox("Loyihani o'chirish", `${pno(p)} ${esc(projectTitle(p))} va unga tegishli to'lov va xarajatlar butunlay o'chiriladi.`, "O'chirish", async () => { await B.deleteProject(p.id); location.hash = "loyihalar"; await reload(); toast("O'chirildi"); }); },

  payAdd: e => { const pid = e.dataset.id; const p = pid ? ST.projects.find(x => x.id === pid) : null; const debt = p ? projectPrice(p) + projectExtra(p) - projectPaid(p) : 0;
    const projOpts = [["", "— loyihani tanlang —"], ...ST.projects.filter(x => x.sale && x.status !== "rad").map(x => [x.id, `${pno(x)} ${projectTitle(x)}${projectDebt(x) ? " · qoldiq " + mshort(projectDebt(x)) : ""}`])];
    openModal({title:"Mijozdan to'lov", body:`<div class="form">${!p ? fld("Loyiha", "pid", "", {sel:projOpts, full:true}) : ""}${fld("Summa", "amount", debt > 0 && e.dataset.k === "qoldiq" ? Math.round(debt) : "", {num:true, req:true, hint:p ? `Qoldiq: ${money(Math.max(0, debt))}` : ""})}${fld("Turi", "kind", e.dataset.k || (p?.sale ? "oraliq" : "zaklat"), {sel:Object.entries(PAY_KINDS)})}${fld("Usul", "method", "naqd", {sel:Object.entries(PAY_METHODS), hint:(ST.bankSources || []).some(x => x.active) ? "Karta yoki o'tkazma: pul kartaga tushgach avtomatik tasdiqlanadi" : ""})}${fld("Sana", "date", today(), {type:"date"})}${fld("Izoh", "note", "", {full:true})}</div>`,
    submit: async v => { const proj = p || ST.projects.find(x => x.id === v.pid); if (!proj) throw new Error("Loyihani tanlang"); if (!(num(v.amount) > 0)) throw new Error("Summani kiriting"); await addPay(proj, v.amount, v.kind, v.method, v.note, v.date); const pp = getP(proj.id); log(pp, `To'lov: ${money(v.amount)} (${PAY_KINDS[v.kind]})`); await saveP(pp, "To'lov qabul qilindi"); }}); },
  payDel: e => confirmBox("To'lovni o'chirish", "Bu to'lov yozuvi o'chiriladi.", "O'chirish", async () => { await B.deletePayment(e.dataset.id); await reload(); toast("O'chirildi"); }),
  expAdd: e => openExpense(e.dataset.id, e.dataset.c),
  expDel: e => confirmBox("Xarajatni o'chirish", "Bu xarajat yozuvi o'chiriladi.", "O'chirish", async () => { await B.deleteExpense(e.dataset.id); await reload(); toast("O'chirildi"); }),
  svcEdit: e => { const s = ST.services.find(x => x.id === e.dataset.id) || {saws:[], prices:{}}; const pr = s.prices || {};
    openModal({title:s.id ? "Uslugani tahrirlash" : "Yangi usluga", wide:true, body:`<div class="form">${fld("Nomi", "name", s.name || "", {req:true, ph:"Masalan: Latif Wood"})}${fld("O'z sexi", "own", !!s.own, {check:"Bu bizning o'z sexsimiz"})}${fld("Telefon", "phone", s.phone || "", {type:"tel"})}${fld("Manzil", "address", s.address || "")}
      ${fld("Arralar", "saws", s.saws || [], {chips:SAWS.map(x => [x, x]), full:true})}
      <div class="full sub" style="margin:0">Narxlar (bo'sh qoldirish mumkin)</div>${fld("Kesish, so'm / list", "kesish", pr.kesish || "", {num:true})}${fld("Rover, so'm / detal", "rover", pr.rover || "", {num:true})}${fld("Kromka 0.4 mm, so'm / m", "k04", pr.k04 || "", {num:true})}${fld("Kromka 1 mm, so'm / m", "k1", pr.k1 || "", {num:true})}${fld("Kromka 2 mm, so'm / m", "k2", pr.k2 || "", {num:true})}${fld("Dvaynoy ustama, so'm / m", "dv", pr.dv || "", {num:true})}
      ${fld("Izoh", "note", s.note || "", {area:true, full:true, rows:2})}</div>`,
    submit: async v => { if (!v.name.trim()) throw new Error("Nomini kiriting"); await B.saveService({...s, name:v.name.trim(), own:v.own, phone:v.phone, address:v.address, saws:v.saws, note:v.note, active:true, prices:{kesish:num(v.kesish), rover:num(v.rover), k04:num(v.k04), k1:num(v.k1), k2:num(v.k2), dv:num(v.dv)}}); await reload(); toast("Saqlandi"); }}); },
  userEdit: e => { const u = ST.users.find(x => x.id === e.dataset.id) || {role:"sotuvchi", roles:["sotuvchi"], active:true};
    openModal({title:u.id ? "Xodimni tahrirlash" : "Yangi xodim", body:`<div class="form">${fld("Ism familiya", "name", u.name || "", {req:true, full:true})}${fld("Login", "login", u.login || "", {req:true, hint:u.id ? "loginni o'zgartirib bo'lmaydi" : "lotin harf va raqam, masalan: dilshod"})}${fld("Vazifalari (bir nechtasini belgilash mumkin)", "roles", rolesOf(u), {chips:Object.entries(ROLES).map(([k, r]) => [k, r.n]), full:true, hint:"Belgilangan har bir vazifaning bo'limlari xodim ilovasida birga ochiladi"})}${fld("Telefon", "phone", u.phone || "", {type:"tel"})}${fld(u.id ? "Yangi parol (o'zgartirish uchun)" : "Parol", "password", "", {type:"text", hint:"kamida 6 belgi", auto:"new-password"})}${u.id ? fld("Holat", "active", u.active !== false, {check:"Faol (ilovaga kira oladi)"}) : ""}</div>`,
    submit: async v => { if (!v.name.trim()) throw new Error("Ismni kiriting"); if (!v.roles.length) throw new Error("Kamida bitta vazifani belgilang"); const roles = Object.keys(ROLES).filter(k => v.roles.includes(k)); await B.saveUser({id:u.id, name:v.name.trim(), login:u.id ? u.login : v.login, role:roles[0], roles, phone:v.phone, active:u.id ? v.active : true}, v.password); await reload(); toast(u.id ? "Saqlandi" : `Xodim qo'shildi. Login: ${v.login.trim().toLowerCase()}`); }}); setTimeout(() => { const l = $("#m-login"); if (l && u.id) l.disabled = true; }, 50); },
  myPass: () => openModal({title:"Parolni o'zgartirish", body:`<div class="form">${fld("Joriy parol", "old", "", {type:"password", full:true, auto:"current-password"})}${fld("Yangi parol", "new1", "", {type:"password", auto:"new-password"})}${fld("Yangi parol (takror)", "new2", "", {type:"password", auto:"new-password"})}</div>`,
    submit: async v => { if (v.new1 !== v.new2) throw new Error("Yangi parollar bir xil emas"); await B.changeMyPassword(v.old, v.new1); toast("Parol o'zgartirildi"); }}),
  install: async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; schedule(); },
  installHide: () => { safeLS.set("mebel24:install-hide", "1"); render(); },
  resetDemo: () => confirmBox("Sinov ma'lumotlarini tozalash", "Shu brauzerdagi barcha sinov ma'lumotlari o'chiriladi va namuna qaytadan yuklanadi.", "Tozalash", async () => { await B.resetAll(); location.hash = ""; location.reload(); })
};
function openExpense(pid, cat){
  const p = pid ? ST.projects.find(x => x.id === pid) : null;
  const isGen = !p;
  const cats = isGen ? [...Object.entries(EXP).map(([k, v]) => [k, v.n]), ...Object.entries(EXP_GENERAL)] : Object.entries(EXP).map(([k, v]) => [k, v.n]);
  const c = cat || (isGen ? "umumiy" : "material");
  const svc = [["", "—"], ...ST.services.filter(s => s.active !== false).map(s => [s.id, s.name])];
  const pr = p?.prod || {};
  const defSvc = c === "kesish" ? pr.cutService : c === "kromka" ? pr.edgeService : c === "rover" ? pr.roverService : "";
  const det = {
    material:`${fld("Material nomi", "name", "", {ph:"LDSP Kronospan 16 mm, oq"})}${fld("List soni", "sheets", "", {num:true})}${fld("Kimdan olindi", "supplier", "")}`,
    kesish:`${fld("Usluga", "service", defSvc || "", {sel:svc})}${fld("Arra", "saw", pr.saw || "", {sel:[["", "—"], ...SAWS.map(s => [s, s])]})}${fld("List soni", "sheets", "", {num:true, hint:"usluga narxi bo'lsa summa o'zi hisoblanadi"})}`,
    kromka:`${fld("Usluga", "service", defSvc || "", {sel:svc})}${fld("Kromka turi", "edgeType", pr.edgeType || "0.4 mm", {sel:EDGE_TYPES.map(x => [x, x])})}${fld("Metraj (m)", "meters", "", {num:true})}${fld("Dvaynoy", "double", !!pr.double, {check:"Dvaynoy"})}`,
    rover:`${fld("Usluga", "service", defSvc || "", {sel:svc})}${fld("Detal soni", "qty", "", {num:true})}`,
    yol_mijoz:`${fld("Qayerdan → qayerga", "route", "Sex → mijoz")}${fld("Shofyor", "worker", "", {sel:userOpts(["haydovchi"], "— tanlanmagan —")})}${fld("Mashina", "driver", "")}`,
    furnitura:`${fld("Turi", "ftype", "Petlya", {sel:FURN_TYPES.map(x => [x, x])})}${fld("Nomi / modeli", "name", "")}${fld("Soni", "qty", "", {num:true})}${fld("Dona narxi", "unit", "", {num:true, hint:"summa = soni × narx"})}`,
    yigish:`${fld("Kimga", "worker", "", {sel:userOpts(["yiguvchi","ornatuvchi"])})}`,
    yol_sex:`${fld("Qayerdan → qayerga", "route", "Usluga → sex")}${fld("Shofyor", "worker", "", {sel:userOpts(["haydovchi"], "— tanlanmagan —")})}${fld("Mashina", "driver", "")}`,
    ornatish:`${fld("Kimga", "worker", "", {sel:userOpts(["ornatuvchi","yiguvchi"])})}`
  }[c] || "";
  openModal({title:(isGen ? "Chiqim" : `Xarajat · ${pno(p)}`), wide:true, body:`<div class="form">
    ${fld("Turi", "category", c, {sel:cats})}${fld("Sana", "date", today(), {type:"date"})}
    ${det}${fld("Summa (so'm)", "amount", "", {num:true, req:true})}${fld("Izoh", "note", "", {full:true})}</div>`,
    submit: async v => {
      if (v.category !== c){ openExpense(pid, v.category); return "keep"; }
      let amount = num(v.amount);
      const s = ST.services.find(x => x.id === v.service);
      if (!amount && c === "furnitura") amount = num(v.qty) * num(v.unit);
      if (!amount && s && c === "kesish") amount = num(v.sheets) * num(s.prices?.kesish);
      if (!amount && s && c === "kromka") amount = num(v.meters) * (num(s.prices?.[{"0.4 mm":"k04","1 mm":"k1","2 mm":"k2"}[v.edgeType]]) + (v.double ? num(s.prices?.dv) : 0));
      if (!amount && s && c === "rover") amount = num(v.qty) * num(s.prices?.rover);
      if (!(amount > 0)) throw new Error("Summani kiriting");
      const details = {}; ["name","sheets","supplier","saw","edgeType","meters","double","qty","route","driver","ftype","unit","worker"].forEach(k => { if (v[k] !== undefined && v[k] !== "" && v[k] !== false) details[k] = ["sheets","meters","qty","unit"].includes(k) ? num(v[k]) : v[k]; });
      await B.saveExpense({project_id:p?.id || null, date:v.date, category:c, service_id:v.service || null, amount, details, note:v.note});
      if (p){ const pp = getP(p.id); log(pp, `Xarajat: ${EXP[c]?.n || c} — ${money(amount)}`); await saveP(pp); }
      await reload(); toast("Xarajat yozildi: " + money(amount));
    }});
  // Turi o'zgarsa shakl qayta quriladi
  setTimeout(() => { const sel = $("#m-category"); if (sel) sel.addEventListener("change", () => openExpense(pid, sel.value)); }, 30);
}

/* ---------------- Hodisalar ---------------- */
function toast(t){ const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 3200); }
document.addEventListener("click", ev => {
  const chip = ev.target.closest("[data-chip]");
  if (chip){ const box = chip.closest("[data-chips]"); if (box.hasAttribute("data-single")) box.querySelectorAll(".chip").forEach(b => b !== chip && b.classList.remove("on")); chip.classList.toggle("on"); return; }
  const el = ev.target.closest("[data-act]"); if (!el) return;
  const f = ACT[el.dataset.act]; if (!f) return;
  if (el.tagName === "A") ev.preventDefault();
  if (el.tagName === "TR" && ev.target.closest("button")) return;
  try { const r = f(el, ev); if (r && r.catch) r.catch(x => toast(x.message || String(x))); } catch (x) { toast(x.message || String(x)); }
});
document.addEventListener("input", ev => {
  if (ev.target.id === "q"){ UI.q = ev.target.value; clearTimeout(UI.qt); UI.qt = setTimeout(render, 120); }
});
document.addEventListener("submit", async ev => {
  ev.preventDefault();
  const f = ev.target; const fid = f.getAttribute("id");
  if (fid === "loginForm"){
    const v = Object.fromEntries(new FormData(f)); UI.busy = true; UI.loginErr = ""; UI.lastLogin = v.login; render();
    try {
      const u = await B.signIn(v.login, v.password);
      safeLS.set("mebel-ilova:last", v.login);
      ST.me = u; UI.busy = false; UI.route = (location.hash.slice(1) || "bosh"); await reload();
    } catch (e) { UI.busy = false; UI.loginErr = e.message; render(); }
    return;
  }
  if (fid === "bootForm"){
    const v = Object.fromEntries(new FormData(f));
    try { ST.me = await B.bootstrap(v); UI.needsBootstrap = false; await reload(); } catch (e) { toast(e.message); }
    return;
  }
  if (fid === "setForm"){ const v = Object.fromEntries(new FormData(f)); try { await B.saveSettings({company:v.company, defaultDays:num(v.defaultDays) || 25}); await reload(); toast("Saqlandi"); } catch (e) { toast(e.message); } return; }
  if (fid === "modal" && UI.modal?.submit){
    if (UI.busy) return;
    const m = UI.modal; UI.busy = true; m.err = ""; const sb = $("#modal button[type=submit]"); if (sb) sb.disabled = true;
    try { const r = await m.submit(modalVals()); UI.busy = false; if (r !== "keep" && UI.modal === m) closeModal(); schedule(); }
    catch (e) { UI.busy = false; m.err = e.message || String(e); const el = $("#modal .m-b .err"); if (el) el.textContent = m.err; else $("#modal .m-b")?.insertAdjacentHTML("beforeend", `<div class="err">${esc(m.err)}</div>`); const sb = $("#modal button[type=submit]"); if (sb) sb.disabled = false; }
  }
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && UI.modal) closeModal(); });
function route(){ UI.route = location.hash.slice(1) || "bosh"; UI.menu = false; if (!UI.route.startsWith("p-")) UI.ptab = "jarayon"; render(); window.scrollTo(0, 0); }
window.addEventListener("hashchange", route);

/* ---------------- Bank kartasi ---------------- */
function bankCardHTML(){
  const txs = (ST.bankTx || []).filter(t => t.direction === "in").slice(0, 30);
  if (!(ST.bankSources || []).length && !txs.length) return "";
  const un = txs.filter(t => !t.matched_payment_id);
  return `<div class="card"><div class="card-h"><div><h2>Bank tushumlari</h2><div class="t2">Kartaga kelgan pullar: karta to'lovlari bilan avtomatik solishtiriladi</div></div>${un.length ? pill(un.length + " ta bog'lanmagan", "warn") : ""}</div>
    ${txs.length ? `<div class="tblw"><table class="tbl"><tbody>${txs.map(t => { const pay = ST.payments.find(p => p.id === t.matched_payment_id || p.bank_tx_id === t.id); const pr = pay && ST.projects.find(x => x.id === pay.project_id);
      return `<tr><td class="nowrap">${fdate(t.created_at)} <span class="t2">${new Date(t.created_at).toLocaleTimeString("ru-RU", {hour:"2-digit", minute:"2-digit"})}</span></td><td>${t.card_last4 ? `<span class="mono">*${esc(t.card_last4)}</span>` : ""}<div class="t2">${pr ? `<a href="#p-${pr.id}">${pno(pr)} · ${esc(projectTitle(pr))}</a>` : "Bog'lanmagan"}</div></td><td class="r nowrap ok-t">+${money(t.amount)}</td><td class="r">${pay ? pill("✓ bog'langan", "ok") : `<button class="btn sm pri" data-act="bankLink" data-id="${t.id}">Loyihaga bog'lash</button>`}</td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty">Hali tushum kelmagan. Karta ulangan bo'lsa, birinchi SMS kelgach shu yerda ko'rinadi.</div>`}</div>`;
}
function bankSettingsHTML(){
  const src = (ST.bankSources || []).filter(x => x.active);
  return `<div class="card"><div class="card-h"><div><h2>Bank kartasi</h2><div class="t2">Kartaga tushgan pul haqidagi bank SMS'i orqali to'lovlar avtomatik tasdiqlanadi</div></div><button class="btn sm pri" data-act="bankAdd">+ Kartani ulash</button></div>
    ${src.length ? `<div class="list">${src.map(x => `<div class="row"><div class="grow"><div class="t1">${esc(x.name)} ${x.card_last4 ? `<span class="mono">*${esc(x.card_last4)}</span>` : ""}</div><div class="t2">${x.last_seen ? "Oxirgi SMS: " + fdate(x.last_seen) + " " + new Date(x.last_seen).toLocaleTimeString("ru-RU", {hour:"2-digit", minute:"2-digit"}) : "Hali SMS kelmagan"}</div></div><button class="btn sm danger" data-act="bankDel" data-id="${x.id}">Uzish</button></div>`).join("")}</div>` : `<p class="muted small">Karta ulanmagan. Ulash uchun «+ Kartani ulash» ni bosing.</p>`}</div>`;
}
function notifSettingsHTML(){
  if (!("Notification" in window) || inFrame()) return "";
  const st = Notification.permission;
  return `<div class="card"><div class="card-h"><h2>Bildirishnomalar</h2>${st === "granted" ? pill("Yoqilgan", "ok") : ""}</div><p class="muted small" style="margin-top:0">Ilova fonda ochiq bo'lsa ham kartaga pul tushgani haqida telefon xabari chiqadi.</p>${st !== "granted" ? `<button class="btn" data-act="notifOn" ${st === "denied" ? "disabled" : ""}>${st === "denied" ? "Brauzer sozlamalarida taqiqlangan" : "Bildirishnomalarni yoqish"}</button>` : ""}</div>`;
}
function bankSetupModal(key){
  const url = B.bankUrl ? B.bankUrl(key) : "(sinov rejimi: server manzili yo'q)";
  openModal({title:"Karta ulandi: telefonni sozlang", wide:true, ok:"Sinov SMS'ini yuborish", body:`
    <p>Bank SMS'lari keladigan <b>Android telefonda</b> quyidagilarni bir marta qiling:</p>
    <ol class="steps2"><li>Play Market'dan <b>«SMS Forwarder»</b> ilovasini o'rnating (Webhook / URL'ga yuborish imkoniyati bor ilova).</li>
    <li>Yangi qoida qo'shing: yuboruvchi — bankingiz SMS raqami (masalan HUMO, UZCARD yoki bank nomi).</li>
    <li>Yo'nalish: <b>Webhook (POST, JSON)</b>. Manzil:</li></ol>
    <div class="keybox"><code id="bank-url">${esc(url)}</code><button type="button" class="btn sm" data-act="copy" data-v="${esc(url)}">Nusxa</button></div>
    <ol class="steps2" start="4"><li>Xabar shabloni: <code>{"text":"%text%","from":"%from%"}</code> (ilovada SMS matni va yuboruvchi o'zgaruvchilari shunday nomlanadi).</li><li>Saqlang. Bu manzil faqat bir marta ko'rsatiladi: uni xavfsiz joyga yozib qo'ying. Hech kimga bermang.</li></ol>
    <div class="fld"><label for="m-sms">Sinov: bank SMS namunasini kiriting</label><textarea class="inp" id="m-sms" name="sms" rows="3">Popolnenie 2 200 000.00 UZS, karta ***${esc(UI.lastLast4 || "1234")}</textarea><small>«Sinov SMS'ini yuborish» — tizim SMS'ni o'qiydi. Shu summada tasdiq kutayotgan karta to'lovi bo'lsa, u tasdiqlanadi.</small></div>`,
    submit: async v => { const r = await B.bankTest(key, v.sms); await reload(); if (r.note) throw new Error("SMS o'qilmadi: " + r.note); toast(`O'qildi: ${money(r.amount)}, ${r.direction === "in" ? "kirim" : r.direction === "out" ? "chiqim" : "noma'lum"}${r.matched ? " — to'lov tasdiqlandi" : ""}`); return "keep"; }});
}
Object.assign(ACT, {
  bankAdd: () => openModal({title:"Bank kartasini ulash", body:`<div class="form">${fld("Nomi", "name", "Asosiy karta", {req:true})}${fld("Karta oxirgi 4 raqami", "last4", "", {ph:"1234", hint:"Faqat oxirgi 4 raqam. To'liq karta raqamini kiritmang"})}</div>
      <p class="small muted">Karta raqami, muddati, CVV yoki SMS kod hech qachon so'ralmaydi va kiritilmasin.</p>`,
    submit: async v => { const last4 = String(v.last4 || "").replace(/\D/g, ""); if (last4 && last4.length !== 4) throw new Error("Faqat oxirgi 4 ta raqamni kiriting"); UI.lastLast4 = last4; const key = await B.saveBankSource({name:v.name.trim() || "Karta", last4}); await reload(); setTimeout(() => bankSetupModal(key), 50); }}),
  bankDel: e => confirmBox("Kartani uzish", "Bu karta uchun SMS qabul qilish to'xtatiladi. Oldingi tushumlar saqlanadi.", "Uzish", async () => { await B.deleteBankSource(e.dataset.id); await reload(); toast("Karta uzildi"); }),
  bankLink: e => { const t = (ST.bankTx || []).find(x => x.id === e.dataset.id); if (!t) return;
    const pend = ST.payments.filter(p => p.status === "kutilmoqda");
    const same = pend.filter(p => Math.abs(num(p.amount) - num(t.amount)) < 1);
    const projOpts = [["", "— loyihani tanlang —"], ...ST.projects.filter(x => x.sale && x.status !== "rad").map(x => [x.id, `${pno(x)} ${projectTitle(x)}${projectDebt(x) ? " · qoldiq " + mshort(projectDebt(x)) : ""}`])];
    openModal({title:`Tushumni bog'lash: ${money(t.amount)}`, body:`<div class="form">${pend.length ? fld("Tasdiq kutayotgan to'lov", "pay", same[0]?.id || "", {sel:[["", "— yangi to'lov sifatida —"], ...pend.map(p => { const pr = ST.projects.find(x => x.id === p.project_id); return [p.id, `${money(p.amount)} · ${pr ? pno(pr) + " " + projectTitle(pr) : ""} · ${userName(p.created_by)}`]; })], full:true, hint:"Xodim kiritgan va bank tasdig'ini kutayotgan to'lov bo'lsa, uni tanlang"}) : ""}
      ${fld("Yoki loyiha (yangi to'lov)", "pid", "", {sel:projOpts, full:true})}${fld("To'lov turi", "kind", "oraliq", {sel:Object.entries(PAY_KINDS)})}</div>`,
      submit: async v => { if (!v.pay && !v.pid) throw new Error("To'lovni yoki loyihani tanlang"); await B.linkBankTx(t.id, v.pid || null, v.kind, v.pay || null); await reload(); toast("Tushum bog'landi va tasdiqlandi"); }}); },
  notifOn: async () => { try { const r = await Notification.requestPermission(); toast(r === "granted" ? "Bildirishnomalar yoqildi" : "Ruxsat berilmadi"); } catch (e) {} render(); }
});

/* ---------------- Yangilanish ---------------- */
async function checkVersion(manual){
  try {
    const r = await fetch("version.json?t=" + Date.now(), {cache:"no-store"});
    if (!r.ok) throw 0;
    const j = await r.json();
    if (j.version && j.version !== APP_VERSION){ UI.newVer = j; render(); if (manual) toast("Yangi versiya bor: " + j.version); }
    else if (manual) toast("Sizda eng so'nggi versiya: " + APP_VERSION);
  } catch (e) { if (manual) toast("Tekshirib bo'lmadi. Internetni tekshiring"); }
}
function updateBannerHTML(){
  const v = UI.newVer; if (!v || UI.updHidden === v.version) return "";
  return `<div class="upd"><div><b>Yangi versiya ${esc(v.version)} tayyor</b>${(v.notes || []).length ? `<ul>${v.notes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div><div class="actions" style="margin:0"><button class="btn pri" data-act="doUpdate">Yangilash</button><button class="btn sm" data-act="hideUpdate">Keyinroq</button></div></div>`;
}
setInterval(() => { if (ST.me) checkVersion(); }, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && ST.me) checkVersion(); });

/* ---------------- Pastga tortib yangilash ---------------- */
(function pullToRefresh(){
  const el = document.createElement("div"); el.className = "ptr"; el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<i class="ptr-ic">↓</i><span>Yangilash uchun torting</span>`;
  document.body.appendChild(el);
  const MAX = 96, NEED = 64;
  let y0 = null, x0 = 0, d = 0, active = false, busy = false;
  const set = v => { d = v; el.style.transform = `translate(-50%, ${v - 56}px)`; el.style.opacity = Math.min(1, v / NEED); const ready = v >= NEED; el.classList.toggle("ready", ready); el.querySelector("span").textContent = busy ? "Yangilanmoqda…" : ready ? "Qo'yib yuboring — yangilanadi" : "Yangilash uchun torting"; };
  const reset = () => { el.style.transition = "transform .2s, opacity .2s"; set(0); setTimeout(() => el.style.transition = "", 220); };
  document.addEventListener("touchstart", e => {
    if (busy || UI.modal || UI.menu || window.scrollY > 0 || e.touches.length !== 1) { y0 = null; return; }
    const sc = e.target.closest(".col-b, .m-b, .sheet, textarea"); if (sc && sc.scrollTop > 0) { y0 = null; return; }
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; active = false;
  }, {passive:true});
  document.addEventListener("touchmove", e => {
    if (y0 === null) return;
    const dy = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0;
    if (!active && (Math.abs(dx) > Math.abs(dy) || dy < 0)) { y0 = null; return; }
    if (dy > 8 && window.scrollY <= 0){ active = true; if (e.cancelable) e.preventDefault(); set(Math.min(MAX, dy * .5)); }
  }, {passive:false});
  document.addEventListener("touchend", async () => {
    if (y0 === null || !active){ y0 = null; return; }
    y0 = null; active = false;
    if (d < NEED){ reset(); return; }
    busy = true; el.classList.add("spin"); set(NEED);
    try { await refreshAll(); } finally { busy = false; el.classList.remove("spin"); reset(); }
  });
})();
async function refreshAll(){
  await checkVersion();
  if (UI.newVer){ toast("Yangi versiya o'rnatilmoqda…"); await ACT.doUpdate(); return; }
  if (ST.me) await reload();
  toast("Yangilandi");
}

/* ---------------- Ishga tushirish ---------------- */
async function start(){
  $("#root").innerHTML = `<div class="login"><div class="muted">Yuklanmoqda…</div></div>`;
  UI.lastLogin = safeLS.get("mebel-ilova:last") || "";
  let info;
  try { info = await B.init(); } catch (e) { $("#root").innerHTML = `<div class="login"><div class="login-card"><h1>Serverga ulanib bo'lmadi</h1><p class="muted">${esc(e.message)}</p><button class="btn pri" onclick="location.reload()">Qayta urinish</button></div></div>`; return; }
  if (B.mode === "local" && info.needsBootstrap && typeof seedDemo === "function"){ await seedDemo(B); info = await B.init(); }
  UI.needsBootstrap = info.needsBootstrap;
  ST.me = B.current();
  B.onChange(() => { if (ST.me) reload(); });
  if (ST.me) await reload(); else render();
  UI.route = location.hash.slice(1) || "bosh";
  render();
  setTimeout(() => checkVersion(), 3000);
}
