/* =====================================================================
   Backend: ikki rejim, bir xil interfeys.
   LocalBackend    — sinov: ma'lumot shu brauzerda (localStorage).
   SupabaseBackend — ish: Supabase Auth + jadvallar + RLS + realtime.
   ===================================================================== */
"use strict";
const LOGIN_RE = /^[a-z0-9._-]{3,32}$/;
const uidGen = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2));
async function sha256(s){
  try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  catch (e) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return "x" + h; }
}
const safeLS = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k){ try { localStorage.removeItem(k); } catch (e) {} }
};

/* ---------------- Sinov rejimi ---------------- */
class LocalBackend {
  constructor(){ this.mode = "local"; this.key = "mebel-ilova-v1"; this.listeners = []; this.me = null; }
  _load(){ try { return JSON.parse(safeLS.get(this.key) || "null"); } catch (e) { return null; } }
  _save(){ if (!safeLS.set(this.key, JSON.stringify(this.db))) this.memoryOnly = true; this._emit(); }
  _emit(){ this.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  onChange(f){ this.listeners.push(f); }
  async init(){
    this.db = this._load() || {users:[], services:[], projects:[], payments:[], expenses:[], settings:{}, seq:0};
    const sid = safeLS.get(this.key + ":session");
    this.me = sid ? this.db.users.find(u => u.id === sid && u.active) || null : null;
    return {needsBootstrap: !this.db.users.length};
  }
  async bootstrap({name, login, password}){
    login = String(login).trim().toLowerCase();
    if (!LOGIN_RE.test(login)) throw new Error("Login: 3–32 ta lotin harf yoki raqam");
    if (String(password).length < 6) throw new Error("Parol kamida 6 belgi bo'lsin");
    const u = {id:uidGen(), name, login, role:"admin", roles:["admin"], phone:"", active:true, created_at:new Date().toISOString(), pass: await sha256(login + ":" + password)};
    this.db.users.push(u); this._save(); this.me = u; safeLS.set(this.key + ":session", u.id);
    return this._pub(u);
  }
  async signIn(login, password){
    login = String(login).trim().toLowerCase();
    const u = this.db.users.find(x => x.login === login);
    if (!u || u.pass !== await sha256(login + ":" + password)) throw new Error("Login yoki parol noto'g'ri");
    if (!u.active) throw new Error("Bu xodim faol emas. Administratorga murojaat qiling");
    this.me = u; safeLS.set(this.key + ":session", u.id);
    return this._pub(u);
  }
  async signOut(){ this.me = null; safeLS.del(this.key + ":session"); }
  current(){ return this.me ? this._pub(this.me) : null; }
  _pub(u){ const {pass, ...r} = u; return r; }
  async loadAll(){
    const d = this.db; const paid = {};
    d.payments.forEach(p => { if (p.project_id) paid[p.project_id] = (paid[p.project_id] || 0) + Number(p.amount); });
    return {users:d.users.map(u => this._pub(u)), services:d.services, projects:d.projects.filter(p => !p.deleted), payments:d.payments, expenses:d.expenses, settings:d.settings || {}, paid};
  }
  async saveProject(p){
    const now = new Date().toISOString();
    const i = this.db.projects.findIndex(x => x.id === p.id);
    if (i < 0){ this.db.seq = (this.db.seq || 0) + 1; p = {...p, id:p.id || uidGen(), no:this.db.seq, created_at:now, created_by:this.me?.id}; this.db.projects.push(p); }
    else this.db.projects[i] = p = {...p};
    p.updated_at = now; this._save(); return p;
  }
  async deleteProject(id){ this._admin(); this.db.projects = this.db.projects.filter(p => p.id !== id); this.db.payments = this.db.payments.filter(p => p.project_id !== id); this.db.expenses = this.db.expenses.filter(e => e.project_id !== id); this._save(); }
  async addPayment(p){ const r = {...p, id:uidGen(), created_by:this.me?.id, created_at:new Date().toISOString()}; this.db.payments.push(r); this._save(); return r; }
  async deletePayment(id){ this.db.payments = this.db.payments.filter(p => p.id !== id); this._save(); }
  async saveExpense(e){ const i = this.db.expenses.findIndex(x => x.id === e.id); if (i >= 0) this.db.expenses[i] = {...this.db.expenses[i], ...e}; else this.db.expenses.push({...e, id:uidGen(), created_by:this.me?.id, created_at:new Date().toISOString()}); this._save(); }
  async deleteExpense(id){ this.db.expenses = this.db.expenses.filter(e => e.id !== id); this._save(); }
  async saveService(s){ const i = this.db.services.findIndex(x => x.id === s.id); if (i >= 0) this.db.services[i] = s; else this.db.services.push({...s, id:uidGen()}); this._save(); }
  async deleteService(id){ this.db.services = this.db.services.filter(s => s.id !== id); this._save(); }
  async saveSettings(s){ this.db.settings = {...this.db.settings, ...s}; this._save(); }
  _admin(){ const r = this.me?.roles?.length ? this.me.roles : [this.me?.role]; if (!r.includes("admin")) throw new Error("Faqat administrator uchun"); }
  async saveUser(u, password){
    this._admin();
    const login = String(u.login || "").trim().toLowerCase();
    if (!u.id){
      if (!LOGIN_RE.test(login)) throw new Error("Login: 3–32 ta lotin harf yoki raqam");
      if (this.db.users.some(x => x.login === login)) throw new Error("Bu login band");
      if (!password || String(password).length < 6) throw new Error("Parol kamida 6 belgi");
      this.db.users.push({id:uidGen(), name:u.name, login, role:u.role, roles:u.roles || [u.role], phone:u.phone || "", active:true, created_at:new Date().toISOString(), pass: await sha256(login + ":" + password)});
    } else {
      const t = this.db.users.find(x => x.id === u.id); if (!t) throw new Error("Xodim topilmadi");
      if (t.id === this.me.id && (u.active === false || !(u.roles || [u.role]).includes("admin"))) throw new Error("O'zingizni administratorlikdan chiqara olmaysiz");
      Object.assign(t, {name:u.name, role:u.role, roles:u.roles || [u.role], phone:u.phone || "", active:u.active !== false});
      if (password){ if (String(password).length < 6) throw new Error("Parol kamida 6 belgi"); t.pass = await sha256(t.login + ":" + password); }
    }
    this._save();
  }
  async changeMyPassword(oldP, newP){
    const u = this.db.users.find(x => x.id === this.me?.id);
    if (!u || u.pass !== await sha256(u.login + ":" + oldP)) throw new Error("Joriy parol noto'g'ri");
    if (String(newP).length < 6) throw new Error("Yangi parol kamida 6 belgi");
    u.pass = await sha256(u.login + ":" + newP); this._save();
  }
  async seed(fn){ await fn(this); }
  async resetAll(){ safeLS.del(this.key); safeLS.del(this.key + ":session"); }
}

/* ---------------- Ish rejimi: Supabase ---------------- */
function sbErr(e){
  const m = String(e?.message || e || "");
  if (/Invalid login credentials/i.test(m)) return "Login yoki parol noto'g'ri";
  if (/banned/i.test(m)) return "Bu xodim faol emas. Administratorga murojaat qiling";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "Internet aloqasi yo'q. Ulanishni tekshiring";
  if (/row-level security|permission denied/i.test(m)) return "Bu amal uchun huquqingiz yo'q";
  return m || "Xato yuz berdi";
}
class SupabaseBackend {
  constructor(cfg){
    this.mode = "supabase"; this.cfg = cfg; this.listeners = []; this.me = null;
    this.domain = cfg.loginDomain || "ilova.local";
    this.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true, storageKey:"mebel-ilova-auth"}});
  }
  onChange(f){ this.listeners.push(f); }
  _emit(){ clearTimeout(this._t); this._t = setTimeout(() => this.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }), 150); }
  async init(){
    const {data:has, error} = await this.sb.rpc("il_has_users");
    if (error && /Failed to fetch|NetworkError/i.test(error.message || "")) throw new Error("Internet aloqasi yo'q. Ulanishni tekshiring");
    const {data} = await this.sb.auth.getSession();
    if (data?.session) await this._loadMe(data.session.user.id).catch(() => {});
    return {needsBootstrap: !error && has === false && !this.me};
  }
  async _loadMe(id){
    const {data, error} = await this.sb.from("il_users").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(sbErr(error));
    if (!data || !data.active){ await this.sb.auth.signOut(); this.me = null; throw new Error("Bu xodim faol emas yoki ro'yxatda yo'q"); }
    this.me = data; this._realtime(); return data;
  }
  current(){ return this.me; }
  async _fn(body){
    const {data, error} = await this.sb.functions.invoke("ilova-admin", {body});
    if (error){ let m = error.message; try { const j = await error.context.json(); m = j.error || m; } catch (e) {} throw new Error(m); }
    if (data?.error) throw new Error(data.error);
    return data;
  }
  async bootstrap({name, login, password}){ await this._fn({action:"bootstrap", name, login, password}); return this.signIn(login, password); }
  async signIn(login, password){
    const email = String(login).trim().toLowerCase() + "@" + this.domain;
    const {data, error} = await this.sb.auth.signInWithPassword({email, password});
    if (error) throw new Error(sbErr(error));
    return this._loadMe(data.user.id);
  }
  async signOut(){ try { this.chan && this.sb.removeChannel(this.chan); } catch (e) {} this.chan = null; await this.sb.auth.signOut(); this.me = null; }
  _realtime(){
    if (this.chan) return;
    this.chan = this.sb.channel("ilova");
    ["il_projects","il_payments","il_expenses","il_services","il_users"].forEach(t => this.chan.on("postgres_changes", {event:"*", schema:"public", table:t}, () => this._emit()));
    this.chan.subscribe();
  }
  async _all(table, sel = "*", q = x => x){
    const out = []; for (let from = 0; ; from += 1000){
      const {data, error} = await q(this.sb.from(table).select(sel)).range(from, from + 999);
      if (error) throw new Error(sbErr(error)); out.push(...data); if (data.length < 1000) break;
    } return out;
  }
  async loadAll(){
    const [users, services, projects, payments, expenses, st, paidRows] = await Promise.all([
      this._all("il_users"), this._all("il_services"), this._all("il_projects", "*", q => q.eq("deleted", false)),
      this._all("il_payments"), this._all("il_expenses"),
      this.sb.from("il_settings").select("data").eq("id", 1).maybeSingle(), this.sb.rpc("il_project_paid")
    ]);
    const paid = {}; (paidRows.data || []).forEach(r => paid[r.project_id] = Number(r.paid));
    return {users, services, projects:projects.map(r => ({...r.data, id:r.id, no:r.no, stage:r.stage, status:r.status, created_at:r.created_at, updated_at:r.updated_at, created_by:r.created_by, sellerId:r.seller_id, managerId:r.manager_id})),
      payments:payments.map(p => ({...p, amount:Number(p.amount)})), expenses:expenses.map(e => ({...e, amount:Number(e.amount)})), settings:st.data?.data || {}, paid};
  }
  _row(p){
    const {id, no, stage, status, created_at, updated_at, created_by, sellerId, managerId, ...data} = p;
    return {stage, status, client_name:p.client?.name || "", client_phone:p.client?.phone || "", seller_id:sellerId || null, manager_id:managerId || null, data};
  }
  async saveProject(p){
    if (!p.no){
      const {data, error} = await this.sb.from("il_projects").insert(this._row(p)).select().single();
      if (error) throw new Error(sbErr(error)); this._emit(); return {...p, id:data.id, no:data.no, created_at:data.created_at, updated_at:data.updated_at};
    }
    let q = this.sb.from("il_projects").update(this._row(p)).eq("id", p.id);
    if (p.updated_at) q = q.eq("updated_at", p.updated_at);
    const {data, error} = await q.select();
    if (error) throw new Error(sbErr(error));
    if (!data.length) throw new Error("Bu loyihani boshqa xodim hozirgina o'zgartirdi. Sahifa yangilandi, amalni qayta bajaring");
    this._emit(); return {...p, updated_at:data[0].updated_at};
  }
  async deleteProject(id){ const {error} = await this.sb.from("il_projects").delete().eq("id", id); if (error) throw new Error(sbErr(error)); this._emit(); }
  async addPayment(p){ const {data, error} = await this.sb.from("il_payments").insert({...p, created_by:this.me.id}).select().single(); if (error) throw new Error(sbErr(error)); this._emit(); return data; }
  async deletePayment(id){ const {error} = await this.sb.from("il_payments").delete().eq("id", id); if (error) throw new Error(sbErr(error)); this._emit(); }
  async saveExpense(e){
    const r = {project_id:e.project_id || null, date:e.date, category:e.category, service_id:e.service_id || null, amount:e.amount, details:e.details || {}, note:e.note || ""};
    const {error} = e.id ? await this.sb.from("il_expenses").update(r).eq("id", e.id) : await this.sb.from("il_expenses").insert({...r, created_by:this.me.id});
    if (error) throw new Error(sbErr(error)); this._emit();
  }
  async deleteExpense(id){ const {error} = await this.sb.from("il_expenses").delete().eq("id", id); if (error) throw new Error(sbErr(error)); this._emit(); }
  async saveService(s){ const {id, created_at, ...r} = s; const {error} = id ? await this.sb.from("il_services").update(r).eq("id", id) : await this.sb.from("il_services").insert(r); if (error) throw new Error(sbErr(error)); this._emit(); }
  async deleteService(id){ const {error} = await this.sb.from("il_services").update({active:false}).eq("id", id); if (error) throw new Error(sbErr(error)); this._emit(); }
  async saveSettings(s){ const {data} = await this.sb.from("il_settings").select("data").eq("id", 1).maybeSingle(); const {error} = await this.sb.from("il_settings").update({data:{...(data?.data || {}), ...s}}).eq("id", 1); if (error) throw new Error(sbErr(error)); this._emit(); }
  async saveUser(u, password){
    if (!u.id) await this._fn({action:"create", name:u.name, login:u.login, role:u.role, roles:u.roles, phone:u.phone, password});
    else await this._fn({action:"update", id:u.id, name:u.name, role:u.role, roles:u.roles, phone:u.phone, active:u.active !== false, password:password || undefined});
    this._emit();
  }
  async changeMyPassword(oldP, newP){
    const email = this.me.login + "@" + this.domain;
    const {error: e1} = await this.sb.auth.signInWithPassword({email, password:oldP}); if (e1) throw new Error("Joriy parol noto'g'ri");
    if (String(newP).length < 6) throw new Error("Yangi parol kamida 6 belgi");
    const {error} = await this.sb.auth.updateUser({password:newP}); if (error) throw new Error(sbErr(error));
  }
}

function makeBackend(){
  const c = window.ILOVA_CONFIG || {};
  if (c.supabaseUrl && c.supabaseAnonKey && window.supabase?.createClient){
    try { return new SupabaseBackend(c); } catch (e) { console.error(e); }
  }
  return new LocalBackend();
}
