/* =====================================================================
   Mebel 24 — buyurtma tafsilotlari, narxlar xotirasi, furnitura xaridi,
   chek va chala ish rasmlari, Ta'minot bo'limi
   ===================================================================== */
"use strict";
const MATERIAL_TYPES = ["LDSP","MDF","Akril","PVC (plyonka)","LMDF","Shpon","Massiv","Boshqa"];
const COLORS = ["Oq","Qora","Kulrang","Grafit","Bej","Kapuchino","Yong'oq","Venge","Sonoma eman","Oq glyanets","Antratsit"];
const MATTRESS = [["","—"],["kerak","Matras kerak (bizdan)"],["bor","Matras mijozda bor"],["yoq","Matras kerak emas"]];
const isBed = t => /krovat|yotoq|karavot/i.test(t || "");

/* ---------------- Buyurtma ---------------- */
function orderCardHTML(p){
  const o = p.order || {}; const items = o.items || [];
  const flags = [o.delivery ? pill("✓ Yetkazib berish kiradi", "ok") : pill("Yetkazib berish kirmaydi"), o.install ? pill("✓ O'rnatish kiradi", "ok") : pill("O'rnatish kirmaydi")];
  return `<div class="card"><div class="card-h"><div><h2>Buyurtma</h2><div class="t2">${esc(p.client?.name || "")}${p.client?.address ? " · " + esc(p.client.address) : ""}</div></div><button class="btn sm ${items.length ? "" : "pri"}" data-act="orderEdit" data-id="${p.id}">${items.length ? `${ic("edit", 16)} Tahrirlash` : "Buyurtmani to'ldirish"}</button></div>
    ${items.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Mebel</th><th>Material</th><th>Rang</th><th class="r">Soni</th></tr></thead><tbody>${items.map(i => `<tr><td><div class="t1">${esc(i.type)}</div>${i.desc ? `<div class="t2">${esc(i.desc)}</div>` : ""}${i.mattress ? `<div class="t2">${esc(MATTRESS.find(m => m[0] === i.mattress)?.[1] || "")}</div>` : ""}</td><td>${esc(i.material || "—")}</td><td>${esc(i.color || "—")}</td><td class="r">${num(i.qty) || 1}</td></tr>`).join("")}</tbody></table></div>
      <div class="chips" style="margin-top:10px">${flags.join(" ")}</div>${o.note ? `<p class="small">${esc(o.note)}</p>` : ""}`
    : `<p class="muted small" style="margin:0">Mijozning to'liq ma'lumoti va har bir mebel (turi, materiali, rangi) hali kiritilmagan.</p>`}</div>`;
}
function oiRowHTML(i = {}){
  const sel = (f, list, v) => `<select class="inp" data-f="${f}" aria-label="${f}">${list.map(x => Array.isArray(x) ? `<option value="${esc(x[0])}" ${x[0] === (v || "") ? "selected" : ""}>${esc(x[1])}</option>` : `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>`;
  return `<div class="oitem"><div class="oi-grid">
    <div class="fld"><label>Mebel turi</label>${sel("type", NEED_TYPES, i.type || "Oshxona")}</div>
    <div class="fld"><label>Material</label>${sel("material", MATERIAL_TYPES, i.material || "LDSP")}</div>
    <div class="fld"><label>Rangi</label><input class="inp" data-f="color" list="dl-colors" value="${esc(i.color || "")}" placeholder="masalan: Oq glyanets"></div>
    <div class="fld"><label>Soni</label><input class="inp r" data-f="qty" inputmode="numeric" value="${esc(i.qty || 1)}"></div>
    <div class="fld"><label>Matras (krovat uchun)</label>${sel("mattress", MATTRESS, i.mattress)}</div>
    <div class="fld"><label>Izoh</label><input class="inp" data-f="desc" value="${esc(i.desc || "")}" placeholder="o'lcham, fasad, ruchka..."></div></div>
    <button type="button" class="btn sm danger" data-act="oiDel">${ic("trash", 14)} Olib tashlash</button></div>`;
}
Object.assign(ACT, {
  orderEdit: e => {
    const p = getP(e.dataset.id); const o = p.order || {};
    const items = (o.items && o.items.length) ? o.items : (p.need?.types || []).length ? p.need.types.map(t => ({type:t, desc:p.need.desc || ""})) : [{type:"Oshxona"}];
    openModal({title:"Buyurtmani to'ldirish", wide:true, ok:"Buyurtmani saqlash", body:`<div class="form">
      ${fld("Mijozning ism familiyasi", "name", p.client?.name || "", {req:true, auto:"name"})}${fld("Telefon", "phone", p.client?.phone || "", {type:"tel", req:true})}
      ${fld("Mebel o'rnatiladigan manzil", "address", p.client?.address || "", {full:true, ph:"Shahar, tuman, ko'cha, uy, xonadon"})}
      ${fld("Yetkazib berish", "delivery", o.delivery ?? true, {check:"Buyurtma ichida yetkazib berish bor"})}${fld("O'rnatish", "install", o.install ?? true, {check:"Buyurtma ichida o'rnatib berish bor"})}</div>
      <div class="sub">Mebellar</div><div id="oitems">${items.map(oiRowHTML).join("")}</div>
      <button type="button" class="btn" data-act="oiAdd" style="margin-top:8px">${ic("plus", 16)} Yana mebel qo'shish</button>
      <datalist id="dl-colors">${COLORS.map(c => `<option value="${esc(c)}">`).join("")}</datalist>
      <div class="form" style="margin-top:12px">${fld("Umumiy izoh", "onote", o.note || "", {area:true, full:true, rows:2})}</div>`,
      submit: async v => {
        const rows = [...document.querySelectorAll("#oitems .oitem")].map(r => { const g = f => r.querySelector(`[data-f="${f}"]`)?.value || ""; return {type:g("type"), material:g("material"), color:g("color").trim(), qty:num(g("qty")) || 1, mattress:g("mattress"), desc:g("desc").trim()}; });
        if (!rows.length) throw new Error("Kamida bitta mebel qo'shing");
        if (!v.name.trim()) throw new Error("Mijozning ismini kiriting");
        p.client = {...(p.client || {}), name:v.name.trim(), phone:v.phone.trim(), address:v.address.trim()};
        p.order = {items:rows, delivery:!!v.delivery, install:!!v.install, note:v.onote, filledAt:today()};
        p.need = {...(p.need || {}), types:[...new Set(rows.map(r => r.type))]};
        log(p, `Buyurtma to'ldirildi: ${rows.map(r => `${r.type} (${r.material}${r.color ? ", " + r.color : ""})`).join("; ")}`);
        await saveP(p, "Buyurtma saqlandi");
      }});
  },
  oiAdd: () => { $("#oitems")?.insertAdjacentHTML("beforeend", oiRowHTML({type:"Shkaf"})); },
  oiDel: e => { const r = e.closest(".oitem"); if (document.querySelectorAll("#oitems .oitem").length > 1) r.remove(); else toast("Kamida bitta mebel bo'lishi kerak"); }
});

/* ---------------- Narxlar xotirasi ---------------- */
const catFind = (kind, name) => (ST.catalog || []).find(c => c.kind === kind && c.name.trim().toLowerCase() === String(name || "").trim().toLowerCase());
async function rememberPrice(kind, name, price, extra = {}){
  name = String(name || "").trim(); price = Math.round(num(price));
  if (!name || !(price > 0)) return false;
  const c = catFind(kind, name);
  if (c && Math.round(num(c.price)) === price) return false;
  try { await B.saveCatalog({id:c?.id, kind, name, price, ...extra}); return true; } catch (e) { return false; }
}
const EDGE_KEY = {"0.4 mm":"k04", "1 mm":"k1", "2 mm":"k2"};
/* Usluga narxi: kesish (list), kromka (metr), rover (detal) */
function svcUnit(c, svcId, edgeType, dbl){
  const s = ST.services.find(x => x.id === svcId); const pr = s?.prices || {};
  if (c === "kesish") return num(pr.kesish);
  if (c === "kromka") return num(pr[EDGE_KEY[edgeType]]) + (dbl ? num(pr.dv) : 0);
  if (c === "rover") return num(pr.rover);
  return 0;
}

/* Xarajat oynasi: miqdor × narx = summa, narxlar o'zi qo'yiladi va yangilanadi */
openExpense = function(pid, cat){
  const p = pid ? ST.projects.find(x => x.id === pid) : null;
  const isGen = !p;
  const cats = isGen ? [...Object.entries(EXP).map(([k, v]) => [k, v.n]), ...Object.entries(EXP_GENERAL)] : Object.entries(EXP).map(([k, v]) => [k, v.n]);
  const c = cat || (isGen ? "umumiy" : "material");
  const svc = [["", "— tanlang —"], ...ST.services.filter(s => s.active !== false).map(s => [s.id, s.name + (s.own ? " (o'z sex)" : "")])];
  const pr = p?.prod || {};
  const defSvc = c === "kesish" ? pr.cutService : c === "kromka" ? pr.edgeService : c === "rover" ? pr.roverService : "";
  const mats = (ST.catalog || []).filter(x => x.kind === "material"), furns = (ST.catalog || []).filter(x => x.kind === "furnitura");
  const QTY = {material:"List soni", kesish:"List soni", kromka:"Metraj (m)", rover:"Detal soni", furnitura:"Soni"}[c];
  const UNIT = {material:"1 list narxi", kesish:"1 list kesish narxi", kromka:"1 metr narxi", rover:"1 detal narxi", furnitura:"Dona narxi"}[c];
  const det = {
    material:`${fld("Material nomi", "name", "", {ph:"masalan: LDSP Kronospan 16 mm oq", hint:mats.length ? "Ro'yxatdan tanlasangiz narx o'zi qo'yiladi" : ""})}${fld("Kimdan olindi", "supplier", "")}`,
    kesish:`${fld("Usluga", "service", defSvc || "", {sel:svc})}${fld("Arra", "saw", pr.saw || "", {sel:[["", "—"], ...SAWS.map(s => [s, s])]})}`,
    kromka:`${fld("Usluga", "service", defSvc || "", {sel:svc})}${fld("Kromka turi", "edgeType", pr.edgeType || "0.4 mm", {sel:EDGE_TYPES.map(x => [x, x])})}${fld("Dvaynoy", "double", !!pr.double, {check:"Dvaynoy kromka"})}<div></div>`,
    rover:`${fld("Usluga", "service", defSvc || "", {sel:svc})}<div></div>`,
    furnitura:`${fld("Turi", "ftype", "Petlya", {sel:FURN_TYPES.map(x => [x, x])})}${fld("Nomi / modeli", "name", "", {hint:furns.length ? "Ro'yxatdan tanlasangiz narx o'zi qo'yiladi" : ""})}`,
    yol_mijoz:`${fld("Qayerdan → qayerga", "route", "Sex → mijoz")}${fld("Shofyor", "worker", "", {sel:userOpts(["haydovchi"], "— tanlanmagan —")})}${fld("Mashina", "driver", "")}`,
    yol_sex:`${fld("Qayerdan → qayerga", "route", "Usluga → sex")}${fld("Shofyor", "worker", "", {sel:userOpts(["haydovchi"], "— tanlanmagan —")})}${fld("Mashina", "driver", "")}`,
    yigish:`${fld("Kimga", "worker", "", {sel:userOpts(["yiguvchi","ornatuvchi"])})}`,
    ornatish:`${fld("Kimga", "worker", "", {sel:userOpts(["ornatuvchi","yiguvchi"])})}`
  }[c] || "";
  const calc = QTY ? `${fld(QTY, "qty", "", {num:true})}${fld(UNIT + " (so'm)", "unit", "", {num:true, hint:"Yangi narx kiritsangiz, keyingi safar shu narx o'zi chiqadi"})}` : "";
  openModal({title:(isGen ? "Chiqim" : `Xarajat · ${pno(p)}`), wide:true, body:`<div class="form">
    ${fld("Turi", "category", c, {sel:cats})}${fld("Sana", "date", today(), {type:"date"})}
    ${det}${calc}${fld("Summa (so'm)", "amount", "", {num:true, req:true, hint:QTY ? "Miqdor × narx bo'yicha o'zi hisoblanadi" : ""})}${fld("Izoh", "note", "", {full:true})}</div>
    <datalist id="dl-cat">${(c === "material" ? mats : furns).map(x => `<option value="${esc(x.name)}">${esc(mshort(x.price))}</option>`).join("")}</datalist>`,
    submit: async v => {
      if (v.category !== c){ openExpense(pid, v.category); return "keep"; }
      const qty = num(v.qty), unit = num(v.unit);
      const amount = num(v.amount) || Math.round(qty * unit);
      if (!(amount > 0)) throw new Error("Summani kiriting yoki miqdor va narxni yozing");
      const details = {};
      ["name","supplier","saw","edgeType","double","route","driver","ftype","worker"].forEach(k => { if (v[k] !== undefined && v[k] !== "" && v[k] !== false) details[k] = v[k]; });
      if (qty) details[c === "kromka" ? "meters" : c === "kesish" || c === "material" ? "sheets" : "qty"] = qty;
      if (unit) details.unit = unit;
      await B.saveExpense({project_id:p?.id || null, date:v.date, category:c, service_id:v.service || null, amount, details, note:v.note});
      // Narx xotirasini yangilash
      let upd = false;
      if (unit && (c === "material" || c === "furnitura")) upd = await rememberPrice(c === "material" ? "material" : "furnitura", v.name, unit, {unit:c === "material" ? "list" : "dona", type:v.ftype || ""});
      if (unit && v.service && ["kesish","kromka","rover"].includes(c)){
        const s = ST.services.find(x => x.id === v.service);
        const key = c === "kesish" ? "kesish" : c === "rover" ? "rover" : EDGE_KEY[v.edgeType];
        const base = c === "kromka" && v.double ? unit - num(s?.prices?.dv) : unit;
        if (s && key && base > 0 && Math.round(num(s.prices?.[key])) !== Math.round(base)){ try { await B.saveService({...s, prices:{...(s.prices || {}), [key]:Math.round(base)}}); upd = true; } catch (e) {} }
      }
      if (p){ const pp = getP(p.id); log(pp, `Xarajat: ${EXP[c]?.n || c} — ${money(amount)}${qty ? ` (${qty} × ${money(unit)})` : ""}`); await saveP(pp); }
      await reload(); toast("Xarajat yozildi: " + money(amount) + (upd ? ". Narx xotirada yangilandi" : ""));
    }});
  setTimeout(() => {
    const m = $("#modal"); if (!m) return;
    const sel = $("#m-category"); if (sel) sel.addEventListener("change", () => openExpense(pid, sel.value));
    const nm = $("#m-name"); if (nm) nm.setAttribute("list", "dl-cat");
    const q = $("#m-qty"), u = $("#m-unit"), a = $("#m-amount"); if (!q || !u || !a) return;
    let uTouched = false, aTouched = false;
    const recalc = () => { if (!aTouched){ const t = num(q.value) * num(u.value); a.value = t ? Math.round(t) : ""; } };
    const fillUnit = () => {
      if (uTouched) return;
      let price = 0;
      if (c === "material" || c === "furnitura") price = num(catFind(c, nm?.value)?.price);
      else price = svcUnit(c, $("#m-service")?.value, $("#m-edgeType")?.value, $("#m-double")?.checked);
      u.value = price ? Math.round(price) : ""; recalc();
    };
    m.addEventListener("input", ev => { if (ev.target === u) uTouched = !!u.value; if (ev.target === a) aTouched = !!a.value; if (ev.target === q || ev.target === u) recalc(); if (ev.target === nm) fillUnit(); });
    m.addEventListener("change", ev => { if (["m-service","m-edgeType","m-double","m-name"].includes(ev.target.id)) fillUnit(); });
    fillUnit();
  }, 30);
};

/* ---------------- Rasmlar ---------------- */
async function compressImage(file){
  const max = B.mode === "local" ? 1000 : 1600, q = B.mode === "local" ? .6 : .74;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Rasmni ochib bo'lmadi")); i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise(res => cv.toBlob(res, "image/jpeg", q));
  } finally { URL.revokeObjectURL(url); }
}
async function uploadFiles(files, folder){
  const out = [];
  for (const f of [...files].slice(0, 6)){ const b = await compressImage(f); out.push(await B.uploadPhoto(b, folder)); }
  return out;
}
function thumbsHTML(refs){
  if (!(refs || []).length) return "";
  return `<div class="thumbs">${refs.map(r => { const u = B.photoUrl(r); return u ? `<button type="button" class="thumb" data-act="photoView" data-src="${esc(u)}"><img src="${esc(u)}" alt="Rasm" loading="lazy"></button>` : `<span class="thumb ph">${ic("copy", 16)}</span>`; }).join("")}</div>`;
}
const photoBtn = (kind, id, i, label = "Rasm qo'shish") => `<label class="btn sm photo-btn">${ic("plus", 14)} ${esc(label)}<input type="file" accept="image/*" multiple hidden data-photo="${kind}" data-id="${id}" data-i="${i ?? ""}"></label>`;
Object.assign(ACT, {
  photoView: e => openModal({title:"Rasm", wide:true, ok:"Yopish", noFocus:true, body:`<img src="${esc(e.dataset.src)}" alt="Rasm" style="width:100%;border-radius:10px">`, submit: async () => {}})
});
document.addEventListener("change", async ev => {
  const t = ev.target; if (!t.matches || !t.matches("input[data-photo]") || !t.files?.length) return;
  const kind = t.dataset.photo, id = t.dataset.id, i = t.dataset.i;
  try {
    toast("Rasm yuklanmoqda…");
    if (kind === "unfin"){
      const refs = await uploadFiles(t.files, "chala/" + id);
      const p = getP(id); const u = p.hand?.unfinished?.[+i]; if (!u) return;
      u.photos = [...(u.photos || []), ...refs]; log(p, `Chala ishga rasm qo'shildi: ${u.text}`); await saveP(p, "Rasm qo'shildi");
    } else if (kind === "buy"){
      const refs = await uploadFiles(t.files, "chek/" + id);
      UI.buyPhotos = [...(UI.buyPhotos || []), ...refs];
      const box = $("#buy-photos"); if (box) box.innerHTML = thumbsHTML(UI.buyPhotos);
      toast("Chek rasmi qo'shildi");
    }
  } catch (e) { toast(e.message || "Rasmni yuklab bo'lmadi"); }
  t.value = "";
});

/* ---------------- Chala ishlar (rasm bilan) ---------------- */
function unfinHTML(p){
  const list = p.hand?.unfinished || []; if (!list.length) return "";
  return `<div class="sub">Chala ishlar</div><div class="unfin">${list.map((u, i) => `<div class="uf ${u.done ? "done" : ""}"><button class="chk ${u.done ? "on" : ""}" data-act="unfin" data-id="${p.id}" data-i="${i}"><i>${u.done ? ic("check", 14) : ""}</i><span>${esc(u.text)}</span></button>${thumbsHTML(u.photos)}${photoBtn("unfin", p.id, i)}</div>`).join("")}</div>`;
}

/* ---------------- Furnitura ro'yxati va xarid ---------------- */
function furnRows(p){ return (p.design?.furn || []).map((f, i) => ({...f, i})); }
function furnListHTML(p){
  const rows = furnRows(p); const pend = rows.filter(f => f.status !== "olindi");
  const buys = ST.expenses.filter(e => e.project_id === p.id && e.category === "furnitura" && (e.details?.photos || []).length);
  const head = `<div class="furn-h"><div class="t2">${rows.length ? `${rows.length - pend.length}/${rows.length} olindi · reja ${money(sum(rows, f => num(f.qty) * num(f.price)))}` : "Ro'yxat bo'sh"}</div><div class="actions" style="margin:0">${pend.length ? `<button class="btn sm pri" data-act="furnBuy" data-id="${p.id}">${ic("check", 14)} Furnitura keldi — tasdiqlash</button><button class="btn sm" data-act="furnCopy" data-id="${p.id}">${ic("copy", 14)} Furniturachiga ro'yxat</button>` : ""}<button class="btn sm" data-act="furnAdd" data-id="${p.id}">+ Qator</button></div></div>`;
  if (!rows.length) return head + `<p class="muted small">Kerakli furniturani qo'shing: petlya, salaska, ruchka, nojka, mexanizm, shurup va boshqalar. Ro'yxat furniturachiga yuboriladi.</p>`;
  return head + `<div class="tblw"><table class="tbl"><thead><tr><th>Nomi</th><th class="r">Soni</th><th class="r">Narx</th><th class="r">Summa</th><th>Holat</th><th></th></tr></thead><tbody>${rows.map(f => { const got = f.status === "olindi"; const q = got ? num(f.factQty ?? f.qty) : num(f.qty), pr = got ? num(f.factPrice ?? f.price) : num(f.price); const diff = got && (Math.round(pr) !== Math.round(num(f.price)) || q !== num(f.qty));
    return `<tr><td><div class="t1">${esc(f.name || f.type)}</div><div class="t2">${esc(f.type)}</div></td><td class="r">${q}</td><td class="r">${mshort(pr)}${diff ? `<div class="t2">reja ${mshort(f.price)}</div>` : ""}</td><td class="r">${money(q * pr)}</td><td>${got ? pill("✓ olindi", "ok") : pill("kerak", "warn")}</td><td class="r">${got ? "" : `<button class="iconbtn sm" data-act="furnDel" data-id="${p.id}" data-i="${f.i}" aria-label="O'chirish">${ic("trash", 16)}</button>`}</td></tr>`; }).join("")}</tbody></table></div>
    ${buys.length ? `<div class="sub">Cheklar</div>${thumbsHTML(buys.flatMap(e => e.details.photos))}` : ""}`;
}
Object.assign(ACT, {
  furnAdd: e => { const p = getP(e.dataset.id); const furns = (ST.catalog || []).filter(x => x.kind === "furnitura");
    openModal({title:"Furnitura qatori", body:`<div class="form">${fld("Turi", "type", "Petlya", {sel:FURN_TYPES.map(x => [x, x])})}${fld("Nomi / modeli", "name", "", {ph:"masalan: Blum Clip Top 110°"})}${fld("Soni", "qty", "1", {num:true})}${fld("Dona narxi", "price", "", {num:true, hint:"Ro'yxatdagi nom tanlansa narx o'zi chiqadi"})}</div><datalist id="dl-furn">${furns.map(x => `<option value="${esc(x.name)}">${esc(mshort(x.price))}</option>`).join("")}</datalist>`,
      submit: async v => { if (!v.name.trim() && !v.type) throw new Error("Nomini kiriting"); p.design = {...(p.design || {})}; p.design.furn = [...(p.design.furn || []), {type:v.type, name:v.name.trim() || v.type, qty:num(v.qty) || 1, price:num(v.price), status:"kerak"}]; log(p, `Furnitura ro'yxatiga: ${v.name || v.type} × ${num(v.qty) || 1}`); await saveP(p, "Qo'shildi"); }});
    setTimeout(() => { const n = $("#m-name"), pr = $("#m-price"); if (!n || !pr) return; n.setAttribute("list", "dl-furn"); const fill = () => { const c = catFind("furnitura", n.value); if (c && !pr.dataset.t) pr.value = Math.round(c.price); }; n.addEventListener("input", fill); n.addEventListener("change", fill); pr.addEventListener("input", () => pr.dataset.t = "1"); }, 40); },
  furnCopy: e => { const p = ST.projects.find(x => x.id === e.dataset.id); const pend = furnRows(p).filter(f => f.status !== "olindi");
    const t = [`Furnitura: ${pno(p)} ${projectTitle(p)}`, ...pend.map((f, k) => `${k + 1}. ${f.name || f.type} — ${num(f.qty)} dona${num(f.price) ? ` (taxm. ${mshort(f.price)})` : ""}`), `Jami taxminan: ${money(sum(pend, f => num(f.qty) * num(f.price)))}`].join("\n");
    navigator.clipboard?.writeText(t).then(() => toast("Ro'yxat nusxalandi: furniturachiga yuboring"), () => toast("Nusxa olib bo'lmadi")); },
  furnBuy: e => { const p = getP(e.dataset.id); const pend = furnRows(p).filter(f => f.status !== "olindi"); UI.buyPhotos = [];
    openModal({title:`Furnitura keldi · ${pno(p)}`, wide:true, ok:"Tasdiqlash va qaydnomaga yozish", body:`<p class="small muted" style="margin-top:0">Narx yoki soni boshqacha kelgan bo'lsa, shu yerda o'zgartiring. Kelmaganini belgidan chiqaring.</p>
      <div class="buy">${pend.map(f => `<div class="buy-row" data-i="${f.i}"><label class="cbx" style="padding:0"><input type="checkbox" data-b="on" checked> <span><b>${esc(f.name || f.type)}</b><small class="t2"> ${esc(f.type)}</small></span></label>
        <div class="buy-in"><div class="fld"><label>Soni</label><input class="inp r" data-b="qty" inputmode="decimal" value="${esc(num(f.qty))}"></div><div class="fld"><label>Dona narxi</label><input class="inp r" data-b="price" inputmode="decimal" value="${esc(Math.round(num(f.price)) || "")}"></div></div></div>`).join("")}</div>
      <div class="buy-tot" id="buy-tot"></div>
      <div class="form" style="margin-top:10px"><div class="fld full"><label>Chek rasmi</label><div id="buy-photos"></div>${photoBtn("buy", p.id, "", "Chekni rasmga olish yoki tanlash")}</div>${fld("Qayerdan olindi", "supplier", "", {})}${fld("Sana", "date", today(), {type:"date"})}</div>`,
      submit: async v => {
        const rows = [...document.querySelectorAll(".buy-row")].map(r => ({i:+r.dataset.i, on:r.querySelector('[data-b="on"]').checked, qty:num(r.querySelector('[data-b="qty"]').value), price:num(r.querySelector('[data-b="price"]').value)})).filter(r => r.on);
        if (!rows.length) throw new Error("Kelgan furniturani belgilang");
        if (rows.some(r => !(r.qty > 0) || !(r.price > 0))) throw new Error("Har bir qatorga soni va narxini kiriting");
        const items = rows.map(r => { const f = p.design.furn[r.i]; return {type:f.type, name:f.name || f.type, qty:r.qty, unit:r.price, plan:num(f.price)}; });
        const amount = Math.round(sum(items, x => x.qty * x.unit));
        await B.saveExpense({project_id:p.id, date:v.date, category:"furnitura", service_id:null, amount, details:{items, photos:UI.buyPhotos || [], supplier:v.supplier, name:items.map(x => x.name).join(", ").slice(0, 120)}, note:""});
        let changed = 0;
        rows.forEach(r => { const f = p.design.furn[r.i]; if (Math.round(r.price) !== Math.round(num(f.price)) || r.qty !== num(f.qty)) changed++; Object.assign(f, {status:"olindi", factQty:r.qty, factPrice:r.price, boughtAt:today(), by:ST.me.name}); });
        for (const x of items) await rememberPrice("furnitura", x.name, x.unit, {unit:"dona", type:x.type});
        p.prod = {...(p.prod || {})}; if (p.design.furn.every(f => f.status === "olindi")){ p.prod.checks = {...(p.prod.checks || {}), furnitura:{by:ST.me.name, d:fdate(today())}}; }
        log(p, `Furnitura keldi: ${items.length} xil, ${money(amount)}${changed ? `, ${changed} tasi boshqa narx/sonda` : ", reja narxlarida"}${(UI.buyPhotos || []).length ? ", chek biriktirildi" : ""}`);
        await saveP(p); await reload(); UI.buyPhotos = []; toast("Furnitura qaydnomaga yozildi: " + money(amount));
      }});
    setTimeout(() => { const box = $("#modal"); const tot = () => { const t = sum([...document.querySelectorAll(".buy-row")].filter(r => r.querySelector('[data-b="on"]').checked), r => num(r.querySelector('[data-b="qty"]').value) * num(r.querySelector('[data-b="price"]').value)); const el = $("#buy-tot"); if (el) el.innerHTML = `Jami: <b>${money(t)}</b>`; }; box?.addEventListener("input", tot); box?.addEventListener("change", tot); tot(); }, 40); },
  catEdit: e => { const it = (ST.catalog || []).find(x => x.id === e.dataset.id) || {kind:e.dataset.k || "material"};
    openModal({title:it.id ? "Narxni o'zgartirish" : "Yangi narx", body:`<div class="form">${fld("Turi", "kind", it.kind, {sel:[["material","Material (plita, laminat)"],["furnitura","Furnitura"]]})}${fld("Nomi", "name", it.name || "", {req:true, ph:"masalan: LDSP Kronospan 16 mm oq"})}${fld("Narxi (so'm)", "price", it.price ? Math.round(it.price) : "", {num:true, req:true})}${fld("Birligi", "unit", it.unit || (it.kind === "furnitura" ? "dona" : "list"), {})}</div>`,
      submit: async v => { if (!v.name.trim() || !(num(v.price) > 0)) throw new Error("Nomi va narxini kiriting"); await B.saveCatalog({id:it.id, kind:v.kind, name:v.name.trim(), price:num(v.price), unit:v.unit}); await reload(); toast("Narx saqlandi"); }}); }
});

/* ---------------- Ta'minot bo'limi ---------------- */
function vTaminot(){
  const act = ST.projects.filter(p => p.status === "faol" && ["loyiha","ishlab","yigish","ornatish"].includes(p.stage));
  const needs = act.map(p => ({p, rows:furnRows(p).filter(f => f.status !== "olindi")})).filter(x => x.rows.length)
    .sort((a, b) => (a.p.sale?.deadline || "9999").localeCompare(b.p.sale?.deadline || "9999"));
  const total = sum(needs, x => sum(x.rows, f => num(f.qty) * num(f.price)));
  let h = `<div class="head"><div><h1>Ta'minot</h1><p class="muted">Sotib olinishi kerak bo'lgan furnitura va saqlangan narxlar</p></div></div>`;
  h += `<div class="kpis"><div class="kpi"><span>Olinishi kerak</span><b>${sum(needs, x => x.rows.length)}</b></div><div class="kpi"><span>Loyihalar</span><b>${needs.length}</b></div><div class="kpi"><span>Taxminiy summa</span><b>${mshort(total)}</b></div></div>`;
  h += needs.length ? needs.map(({p, rows}) => `<div class="card"><div class="card-h"><div><a href="#p-${p.id}" class="t1">${pno(p)} · ${esc(projectTitle(p))}</a><div class="t2">${esc(SK[p.stage]?.n || "")}${p.sale?.deadline ? " · muddat " + fdate(p.sale.deadline) : ""}</div></div><div class="actions" style="margin:0"><button class="btn sm pri" data-act="furnBuy" data-id="${p.id}">${ic("check", 14)} Keldi — tasdiqlash</button><button class="btn sm" data-act="furnCopy" data-id="${p.id}">${ic("copy", 14)} Ro'yxat</button></div></div>
      <div class="list">${rows.map(f => `<div class="row"><div class="grow"><div class="t1">${esc(f.name || f.type)}</div><div class="t2">${esc(f.type)}</div></div><b class="nowrap">${num(f.qty)} dona</b><span class="t2 nowrap" style="min-width:70px;text-align:right">${num(f.price) ? mshort(f.price) : "—"}</span></div>`).join("")}</div></div>`).join("")
    : `<div class="card"><div class="empty"><h3>Hozircha sotib olinadigan furnitura yo'q</h3><p>Loyihaning «Loyihalash» bosqichida furnitura ro'yxati tuzilsa, shu yerda chiqadi.</p></div></div>`;
  const cat = ST.catalog || []; const canEdit = isRole("admin","menejer","taminot","buxgalter");
  h += `<div class="card"><div class="card-h"><div><h2>Saqlangan narxlar</h2><div class="t2">Xarajat yozilganda yangi narx kiritilsa, bu ro'yxat o'zi yangilanadi</div></div>${canEdit ? `<button class="btn sm" data-act="catEdit" data-id="">+ Narx</button>` : ""}</div>
    ${cat.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Nomi</th><th>Turi</th><th class="r">Narx</th><th>Yangilangan</th><th></th></tr></thead><tbody>${cat.slice().sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)).map(c => `<tr><td class="t1">${esc(c.name)}</td><td class="t2">${c.kind === "material" ? "Material" : "Furnitura"}</td><td class="r nowrap">${money(c.price)}${c.unit ? ` / ${esc(c.unit)}` : ""}</td><td class="t2 nowrap">${fdate(c.updated_at)}${c.updated_by ? " · " + esc(userName(c.updated_by)) : ""}</td><td class="r">${canEdit ? `<button class="btn sm" data-act="catEdit" data-id="${c.id}">${ic("edit", 14)}</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Hali narx saqlanmagan. Birinchi material yoki furnitura xarajatini yozganingizda shu yerda paydo bo'ladi.</div>`}
    <p class="small muted">Raspil (kesish), kromka va rover narxlari «Uslugalar» bo'limida har bir sex uchun saqlanadi va xarajat yozganda o'zi qo'yiladi.</p></div>`;
  return h;
}
VIEWS.taminot = vTaminot;
