/* =====================================================================
   Mebel 24 — loyiha yakuniy hisobi: daromad, pul aylanishi, jarayonlar
   bo'yicha xarajat, har bir xodimga ajratilgan haq, yalpi foyda.
   Loyiha yopilganda hisob qayd etiladi (p.final) va keyin o'zgarmaydi.
   ===================================================================== */
"use strict";
EXP.xodim_haqi = {n:"Xodimga haq (foiz, bonus)", st:""};
const STAFF_ROLE = {sotuvchi:"Sotuvchi", menejer:"Loyiha menejeri", olchovchi:"O'lchovchi", texnolog:"Texnolog", yiguvchi:"Yig'uvchi", ornatuvchi:"O'rnatuvchi", haydovchi:"Shofyor", boshqa:"Boshqa"};
const PROC = [
  ["Material va ishlab chiqarish", ["material","kesish","kromka","rover","furnitura"]],
  ["Yo'l kira (logistika)", ["yol_sex","yol_mijoz"]],
  ["Yig'ish", ["yigish"]],
  ["O'rnatish", ["ornatish"]],
  ["Xodimlar haqi (foiz, bonus)", ["xodim_haqi"]],
  ["Boshqa", ["boshqa"]]
];
const comm = () => ({sotuvchi:0, menejer:0, olchovchi:0, texnolog:0, ...(ST.settings.comm || {})});
const expRole = e => e.category === "yigish" ? "yiguvchi" : e.category === "ornatish" ? "ornatuvchi" : /^yol_/.test(e.category) ? "haydovchi" : (e.details?.role || "boshqa");

/* Har bir xodimga: ajratilgan (kelishilgan yoki foiz) va to'langan */
function staffAlloc(p){
  const c = comm(), rev = projectPrice(p) + projectExtra(p), list = [];
  const row = (uid, role) => { let r = list.find(x => x.uid === uid && x.role === role); if (!r){ r = {uid, role, accrued:0, paid:0, basis:""}; list.push(r); } return r; };
  if (p.sale){
    if (p.sellerId && num(c.sotuvchi)){ const r = row(p.sellerId, "sotuvchi"); r.accrued += rev * num(c.sotuvchi) / 100; r.basis = num(c.sotuvchi) + "% sotuvdan"; }
    if (p.managerId && num(c.menejer)){ const r = row(p.managerId, "menejer"); r.accrued += rev * num(c.menejer) / 100; r.basis = num(c.menejer) + "% loyihadan"; }
    const zb = p.zamer?.by || p.zamer?.assignedTo; if (zb && num(c.olchovchi)){ const r = row(zb, "olchovchi"); r.accrued += num(c.olchovchi); r.basis = "o'lchov uchun"; }
    if (p.design?.by && num(c.texnolog)){ const r = row(p.design.by, "texnolog"); r.accrued += num(c.texnolog); r.basis = "loyiha uchun"; }
  }
  (p.asm?.workers || []).forEach(w => { const r = row(w.id, "yiguvchi"); r.accrued += num(w.pay); r.basis = "kelishilgan" + (w.note ? ": " + w.note : ""); });
  ST.expenses.filter(e => e.project_id === p.id && e.details?.worker).forEach(e => { row(e.details.worker, expRole(e)).paid += num(e.amount); });
  list.forEach(r => { r.accrued = Math.round(Math.max(r.accrued, r.paid)); r.paid = Math.round(r.paid); });
  return list.filter(r => r.accrued > 0);
}
function projectReport(p){
  const rev = projectPrice(p) + projectExtra(p), paid = projectPaid(p);
  const ex = ST.expenses.filter(e => e.project_id === p.id), out = sum(ex, e => e.amount);
  const staff = staffAlloc(p);
  const staffTotal = sum(staff, r => r.accrued), staffPaid = sum(staff, r => r.paid), staffLeft = staffTotal - staffPaid;
  const proc = PROC.map(([n, cats]) => ({n, cats, paid:sum(ex.filter(e => cats.includes(e.category)), e => e.amount)}));
  const known = PROC.flatMap(x => x[1]); const other = sum(ex.filter(e => !known.includes(e.category)), e => e.amount);
  if (other) proc.find(x => x.n === "Boshqa").paid += other;
  // Xodimlarga qolgan majburiyatni o'z jarayoniga qo'shamiz
  staff.forEach(r => { const left = r.accrued - r.paid; if (left <= 0) return; const k = r.role === "yiguvchi" ? "Yig'ish" : r.role === "ornatuvchi" ? "O'rnatish" : r.role === "haydovchi" ? "Yo'l kira (logistika)" : "Xodimlar haqi (foiz, bonus)"; const g = proc.find(x => x.n === k); g.left = (g.left || 0) + left; });
  const cost = out + staffLeft;
  return {rev, paid, debt:Math.max(0, rev - paid), out, staff, staffTotal, staffPaid, staffLeft, proc, cost, gross:rev - cost, margin:rev ? (rev - cost) / rev : 0, turnover:paid + out, cash:paid - out,
    leadDays:p.sale?.date ? daysBetween(String(p.created_at).slice(0, 10), p.sale.date) : null, prodDays:p.sale?.date && p.hand?.date ? daysBetween(p.sale.date, p.hand.date) : null};
}

/* Hisob kartasi (smeta o'rnini bosadi) */
smetaCard = function(p, inline){
  const fin = canFin();
  const live = projectReport(p);
  const R = p.status === "yopilgan" && p.final && !UI.reportLive?.[p.id] ? {...live, ...p.final, staff:p.final.staff || live.staff, proc:p.final.proc || live.proc} : live;
  const frozen = R !== live;
  const hd = p.hand || {};
  const box = (k, v, cls = "") => `<div class="${cls}"><span>${k}</span><b>${v}</b></div>`;
  let h = `<div class="card ${inline ? "" : "now"}"><div class="card-h"><div>${!inline && p.status === "yopilgan" ? `<div class="sub" style="margin:0">Loyiha yopilgan · ${fdate(p.closedAt)}</div>` : ""}<h2>Loyiha hisobi</h2>${frozen ? `<div class="t2">Yopilgan kuni qayd etilgan raqamlar</div>` : ""}</div><div class="actions" style="margin:0">${fin ? `<button class="btn sm" data-act="copyReport" data-id="${p.id}">${ic("copy", 16)} Nusxa</button>` : ""}${frozen && isRole("admin") ? `<button class="btn sm" data-act="reportLive" data-id="${p.id}">Hozirgi holat</button>` : ""}</div></div>`;
  h += `<div class="smeta">${box("Jami daromad (shartnoma" + (projectExtra(p) ? " + qo'shimcha" : "") + ")", money(R.rev))}${box("Mijoz to'ladi", money(R.paid))}${box("Mijoz qarzi", money(R.debt), R.debt ? "bad" : "")}${fin ? box("Pul aylanishi (kirim + chiqim)", money(R.turnover)) + box("Xarajatlar (to'langan)", money(R.out)) + box("Xodimlarga ajratilgan", money(R.staffTotal)) + box("Yalpi foyda", `<span class="${R.gross >= 0 ? "ok-t" : "bad-t"}">${money(R.gross)}</span>`) + box("Rentabellik", Math.round(R.margin * 100) + "%") : ""}</div>`;
  if (fin){
    const pmax = Math.max(1, ...R.proc.map(x => x.paid + (x.left || 0)));
    h += `<div class="sub">Jarayonlar bo'yicha xarajat</div><div class="bars">${R.proc.filter(x => x.paid || x.left).map(x => `<div class="bar-row"><span>${esc(x.n)}</span><div class="bar"><i style="width:${(x.paid + (x.left || 0)) / pmax * 100}%"></i></div><b>${money(x.paid + (x.left || 0))}${x.left ? `<small class="t2">${mshort(x.left)} to'lanmagan</small>` : ""}</b></div>`).join("") || `<div class="muted small">Xarajat yozilmagan</div>`}</div>`;
    h += `<div class="sub">Xodimlarga ajratilgan haq</div>${R.staff.length ? `<div class="staff">${R.staff.map(r => { const left = r.accrued - r.paid; return `<div class="st-row"><div class="grow"><div class="t1">${esc(userName(r.uid))}</div><div class="t2">${esc(STAFF_ROLE[r.role] || r.role)}${r.basis ? " · " + esc(r.basis) : ""}</div></div>
        <div class="st-nums"><span>Ajratilgan <b>${money(r.accrued)}</b></span><span>To'langan <b>${money(r.paid)}</b></span><span class="${left > 0 ? "bad-t" : "ok-t"}">Qolgan <b>${money(left)}</b></span></div>
        <div class="st-act">${left > 0 && !frozen ? `<button class="btn sm" data-act="staffPay" data-id="${p.id}" data-u="${r.uid}" data-r="${r.role}" data-v="${left}">To'lash</button>` : left <= 0 ? pill("✓ to'langan", "ok") : ""}</div></div>`; }).join("")}
        <div class="st-row tot"><div class="grow t1">Jami xodimlarga</div><div class="st-nums"><span>Ajratilgan <b>${money(R.staffTotal)}</b></span><span>To'langan <b>${money(R.staffPaid)}</b></span><span class="${R.staffLeft > 0 ? "bad-t" : ""}">Qolgan <b>${money(R.staffLeft)}</b></span></div><div class="st-act"></div></div></div>`
      : `<p class="muted small">Xodimlarga haq hali belgilanmagan. Yig'uvchilar haqi «Yig'ish» bosqichida yoziladi. Sotuvchi va menejer foizi, o'lchovchi va texnolog haqi «Sozlamalar → Xodimlar ulushi»da bir marta belgilanadi.</p>`}`;
  }
  if (!inline) h += kv([["Leaddan sotuvgacha", R.leadDays !== null ? R.leadDays + " kun" : ""], ["Sotuvdan topshirishgacha", R.prodDays !== null ? R.prodDays + " kun" + (p.sale?.deadline && hd.date ? (hd.date > p.sale.deadline ? " · muddatdan " + daysBetween(p.sale.deadline, hd.date) + " kun kech" : " · muddatida") : "") : ""], ["Mijoz bahosi", hd.satisfied ? {ha:"Hammasidan rozi", qisman:"Qisman rozi", yoq:"Rozi emas"}[hd.satisfied] : ""], ["Norozilik", COMPLAINTS.filter(c => (hd.complaints || []).includes(c[0])).map(c => c[1]).join(", ")], ["Izoh", esc(hd.complaintText || "")]]);
  if (!inline && isRole("admin") && p.status === "yopilgan") h += `<div class="actions"><button class="btn sm" data-act="reopen" data-id="${p.id}">Loyihani qayta ochish</button></div>`;
  return h + `</div>`;
};

/* Yopishda hisobni qayd etish */
function freezeReport(p){
  const R = projectReport(p);
  p.final = {at:today(), rev:R.rev, paid:R.paid, debt:R.debt, out:R.out, staff:R.staff, staffTotal:R.staffTotal, staffPaid:R.staffPaid, staffLeft:R.staffLeft, proc:R.proc, cost:R.cost, gross:R.gross, margin:R.margin, turnover:R.turnover, cash:R.cash, leadDays:R.leadDays, prodDays:R.prodDays};
}
Object.assign(ACT, {
  close: e => { const p = getP(e.dataset.id); const R = projectReport(p); const open = (p.hand?.unfinished || []).filter(u => !u.done).length;
    const warn = [R.debt > 0 ? `mijozning qarzi ${money(R.debt)}` : "", open ? `${open} ta chala ish bajarilmagan` : "", R.staffLeft > 0 ? `xodimlarga ${money(R.staffLeft)} to'lanmagan` : "", !p.hand?.date ? "topshirish natijasi yozilmagan" : ""].filter(Boolean);
    confirmBox("Loyihani yopish", (warn.length ? `<b style="color:var(--bad)">Diqqat: ${esc(warn.join("; "))}.</b><br>` : "Hammasi joyida. ") + `Loyiha yopiladi va hisob qayd etiladi: daromad ${money(R.rev)}, yalpi foyda ${money(R.gross)}.`, "Yopish", async () => {
      p.status = "yopilgan"; p.closedAt = today(); p.closedBy = ST.me.id; if (!p.hand?.date) p.hand = {...(p.hand || {}), date:today()};
      freezeReport(p); log(p, `Loyiha yopildi. Daromad ${money(p.final.rev)}, xarajat ${money(p.final.cost)}, yalpi foyda ${money(p.final.gross)}`); await saveP(p, "Loyiha yopildi va hisob qayd etildi"); }, !!warn.length); },
  reportLive: e => { UI.reportLive = {...(UI.reportLive || {}), [e.dataset.id]:true}; render(); },
  staffPay: e => { const p = getP(e.dataset.id); const uid = e.dataset.u, role = e.dataset.r, left = num(e.dataset.v);
    openModal({title:`To'lov: ${userName(uid)}`, body:`<div class="form">${fld("Summa", "amount", Math.round(left), {num:true, req:true, hint:`${STAFF_ROLE[role] || role} · qolgan ${money(left)}`})}${fld("Sana", "date", today(), {type:"date"})}${fld("Izoh", "note", "", {full:true})}</div>`,
      submit: async v => { if (!(num(v.amount) > 0)) throw new Error("Summani kiriting"); const cat = role === "yiguvchi" ? "yigish" : role === "ornatuvchi" ? "ornatish" : "xodim_haqi";
        await B.saveExpense({project_id:p.id, date:v.date, category:cat, amount:num(v.amount), details:{worker:uid, role}, note:v.note}); log(p, `${STAFF_ROLE[role] || role}ga to'landi: ${userName(uid)} ${money(v.amount)}`); await saveP(p); await reload(); toast("To'lov yozildi"); }}); },
  copyReport: e => { const p = ST.projects.find(x => x.id === e.dataset.id); const R = p.final && p.status === "yopilgan" ? {...projectReport(p), ...p.final} : projectReport(p);
    const t = [`Loyiha hisobi: ${pno(p)} ${projectTitle(p)}`, `Jami daromad: ${money(R.rev)}`, `Mijoz to'ladi: ${money(R.paid)}${R.debt ? ` (qarz ${money(R.debt)})` : ""}`, `Pul aylanishi: ${money(R.turnover)}`, "", "Jarayonlar:", ...R.proc.filter(x => x.paid || x.left).map(x => `  ${x.n}: ${money(x.paid + (x.left || 0))}`), "", "Xodimlar:", ...R.staff.map(r => `  ${userName(r.uid)} (${STAFF_ROLE[r.role] || r.role}): ${money(r.accrued)}, to'langan ${money(r.paid)}`), "", `Jami xarajat: ${money(R.cost)}`, `Yalpi foyda: ${money(R.gross)} (${Math.round(R.margin * 100)}%)`].join("\n");
    navigator.clipboard?.writeText(t).then(() => toast("Hisob nusxalandi"), () => toast("Nusxa olib bo'lmadi")); }
});

/* Sozlamalar: xodimlar ulushi */
function commSettingsHTML(){
  if (!isRole("admin")) return "";
  const c = comm();
  return `<div class="card"><div class="card-h"><div><h2>Xodimlar ulushi</h2><div class="t2">Har bir sotilgan loyihada xodimlarga avtomatik ajratiladigan haq</div></div></div><form id="commForm" class="form">
    ${fld("Sotuvchi foizi (%)", "sotuvchi", c.sotuvchi || "", {num:true, hint:"shartnoma summasidan"})}${fld("Loyiha menejeri foizi (%)", "menejer", c.menejer || "", {num:true, hint:"shartnoma summasidan"})}
    ${fld("O'lchovchi haqi (so'm)", "olchovchi", c.olchovchi || "", {num:true, hint:"har bir o'lchov uchun"})}${fld("Texnolog haqi (so'm)", "texnolog", c.texnolog || "", {num:true, hint:"har bir loyiha uchun"})}
    <div class="full"><button class="btn pri" type="submit">Saqlash</button> <span class="small muted">Yig'uvchilar haqi har bir loyihada alohida kelishiladi.</span></div></form></div>`;
}
document.addEventListener("submit", async ev => {
  if (ev.target.getAttribute("id") !== "commForm") return; ev.preventDefault();
  const v = Object.fromEntries(new FormData(ev.target));
  try { await B.saveSettings({comm:{sotuvchi:num(v.sotuvchi), menejer:num(v.menejer), olchovchi:num(v.olchovchi), texnolog:num(v.texnolog)}}); await reload(); toast("Xodimlar ulushi saqlandi"); } catch (e) { toast(e.message); }
});
const _vSoz = VIEWS.sozlamalar; VIEWS.sozlamalar = () => _vSoz() + commSettingsHTML();

/* Moliya: loyihalar ko'rsatkichlari va xodimlar hisobi */
function projectsKpiHTML(){
  const rows = ST.projects.filter(p => p.sale && p.status !== "rad" && (inPeriod(p.closedAt) || inPeriod(p.sale.date) || (UI.period === "hammasi"))).map(p => ({p, R:p.status === "yopilgan" && p.final ? {...projectReport(p), ...p.final} : projectReport(p)}));
  if (!rows.length) return "";
  const T = k => sum(rows, x => x.R[k]);
  return `<div class="card"><div class="card-h"><div><h2>Loyihalar ko'rsatkichlari</h2><div class="t2">Har bir loyiha: daromad, aylanma, xodimlarga, foyda</div></div></div><div class="tblw"><table class="tbl"><thead><tr><th>Loyiha</th><th class="r">Daromad</th><th class="r">Aylanma</th><th class="r">Xarajat</th><th class="r">Xodimlarga</th><th class="r">Yalpi foyda</th><th class="r">%</th></tr></thead><tbody>${rows.map(({p, R}) => `<tr class="click" data-act="go" data-v="p-${p.id}"><td><div class="t1">${esc(projectTitle(p))}</div><div class="t2">${pno(p)} · ${p.status === "yopilgan" ? "yopilgan" : esc(SK[p.stage]?.n || "")}</div></td><td class="r">${mshort(R.rev)}</td><td class="r">${mshort(R.turnover)}</td><td class="r">${mshort(R.cost)}</td><td class="r">${mshort(R.staffTotal)}</td><td class="r ${R.gross >= 0 ? "ok-t" : "bad-t"}">${mshort(R.gross)}</td><td class="r">${Math.round(R.margin * 100)}%</td></tr>`).join("")}
    <tr class="tot"><td>Jami (${rows.length})</td><td class="r">${mshort(T("rev"))}</td><td class="r">${mshort(T("turnover"))}</td><td class="r">${mshort(T("cost"))}</td><td class="r">${mshort(T("staffTotal"))}</td><td class="r">${mshort(T("gross"))}</td><td class="r">${T("rev") ? Math.round(T("gross") / T("rev") * 100) : 0}%</td></tr></tbody></table></div></div>`;
}
function staffSummaryHTML(){
  const acc = {};
  ST.projects.filter(p => p.status !== "rad").forEach(p => (p.status === "yopilgan" && p.final?.staff ? p.final.staff : staffAlloc(p)).forEach(r => { const a = acc[r.uid] = acc[r.uid] || {uid:r.uid, accrued:0, paid:0, n:0}; a.accrued += r.accrued; a.paid += r.paid; a.n++; }));
  const list = Object.values(acc).sort((a, b) => (b.accrued - b.paid) - (a.accrued - a.paid));
  if (!list.length) return "";
  return `<div class="card"><div class="card-h"><div><h2>Xodimlar hisobi</h2><div class="t2">Barcha loyihalar bo'yicha ajratilgan, to'langan va qolgan haq</div></div></div><div class="tblw"><table class="tbl"><thead><tr><th>Xodim</th><th class="r">Loyiha</th><th class="r">Ajratilgan</th><th class="r">To'langan</th><th class="r">Qolgan</th></tr></thead><tbody>${list.map(a => `<tr><td class="t1">${esc(userName(a.uid))}</td><td class="r">${a.n}</td><td class="r">${mshort(a.accrued)}</td><td class="r">${mshort(a.paid)}</td><td class="r ${a.accrued - a.paid > 0 ? "bad-t" : ""}">${mshort(a.accrued - a.paid)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
const _vMol = VIEWS.moliya; VIEWS.moliya = () => _vMol() + projectsKpiHTML() + staffSummaryHTML();
