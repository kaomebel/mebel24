/* Sinov rejimi uchun namuna ma'lumotlar (faqat shu brauzerda, haqiqiy serverga yozilmaydi) */
"use strict";
async function seedDemo(B){
  if (B.mode !== "local") return;
  const d = B.db; const T = today();
  const users = [
    ["Akmal Karimov","admin","123456","admin"],["Dilshod (sotuvchi)","dilshod","111111","sotuvchi"],["Jasur (o'lchovchi)","jasur","222222","olchovchi"],
    ["Nodira (texnolog)","nodira","333333","texnolog"],["Bekzod (menejer)","bekzod","444444","menejer"],["Rustam (yig'uvchi)","rustam","555555","yiguvchi"],
    ["Sherzod (yig'uvchi)","sherzod","666666","yiguvchi"],["Ulug'bek (o'rnatuvchi)","ulugbek","777777","ornatuvchi"],["Malika (kassir)","malika","888888","buxgalter"],["Otabek (ta'minot)","otabek","999999","taminot"]
  ];
  const U = {};
  const extra = {bekzod:["menejer","sotuvchi"], malika:["buxgalter","sotuvchi"], rustam:["yiguvchi","ornatuvchi"]};
  users.push(["Anvar (shofyor)","anvar","101010","haydovchi"]);
  for (const [name, login, pass, role] of users){ const id = uidGen(); U[login] = id; d.users.push({id, name, login, role, roles:extra[login] || [role], phone:"", active:true, created_at:new Date().toISOString(), pass: await sha256(login + ":" + pass)}); }
  const svc = [["KAO sexi", true, ["Altendorf"], {kesish:30000, k04:2500, k1:4000, dv:1500}], ["Ilhom", false, ["Pilni sentr"], {kesish:35000, k04:3000, k1:4500, k2:6500, dv:2000}], ["Zamin Baraka sexi", false, ["Altendorf","Pilni sentr"], {kesish:32000, k04:2800, k1:4200, rover:6000}], ["Latif Wood", false, ["Pilni sentr"], {kesish:38000, k1:4800, k2:7000, rover:5500}], ["Marg'ilon Makon (Murodil Qori)", false, ["Altendorf"], {kesish:28000, k04:2400, k1:3900}]];
  const S = {};
  svc.forEach(([name, own, saws, prices]) => { const id = uidGen(); S[name] = id; d.services.push({id, name, own, saws, prices, phone:"", address:"", note:"namuna", active:true}); });
  d.settings = {company:"KAO Mebel (namuna)", defaultDays:25};
  const nm = ["Aziza Rahimova","Sardor Toshmatov","Gulnora Aliyeva","Bobur Xasanov","Feruza Yo'ldosheva","Jamshid Nazarov","Madina Qodirova","Otabek Ergashev","Nilufar Sobirova","Rustam Mirzayev","Zarina Usmonova","Kamol Abdullayev"];
  const mk = (i, stage, status, extra = {}) => {
    const created = addDays(-(40 - i * 3));
    const p = {id:uidGen(), no:++d.seq, stage, status, created_at:created + "T10:00:00.000Z", updated_at:new Date().toISOString(), created_by:U.dilshod, sellerId:U.dilshod,
      client:{name:nm[i], phone:"+998 9" + (i % 4) + " " + (100 + i * 7) + " " + (10 + i) + " " + (20 + i), address:["Chilonzor","Yunusobod","Sergeli","Mirzo Ulug'bek","Yakkasaroy"][i % 5] + " tumani", source:SOURCES[i % SOURCES.length]},
      need:{types:[NEED_TYPES[i % 4]], desc:["Burchakli oshxona, 3,2 m, MDF emal","Shkaf-kupe 2,4 m, ko'zguli","Kiyim shkafi 1,6 m","Yotoqxona to'plami"][i % 4]},
      lead:{approxPrice:[18e6, 9e6, 0, 24e6][i % 4], date:created}, log:[{d:fdate(created) + " 10:00", ts:created + "T10:00:00Z", u:"Dilshod (sotuvchi)", t:"Lead qo'shildi"}], ...extra};
    d.projects.push(p); return p;
  };
  const pay = (p, amount, kind, date) => d.payments.push({id:uidGen(), project_id:p.id, date, amount, kind, method:"naqd", note:"", created_by:U.malika, created_at:new Date().toISOString()});
  const exp = (p, category, amount, date, details = {}, service = null) => d.expenses.push({id:uidGen(), project_id:p ? p.id : null, date, category, service_id:service, amount, details, note:"", created_by:U.otabek, created_at:new Date().toISOString()});
  const sale = (price, ago, dl) => ({date:addDays(-ago), price, deadline:addDays(dl), model3d:true, by:U.dilshod});
  const zam = (price, ago) => ({assignedTo:U.jasur, plannedDate:addDays(-ago - 1), doneDate:addDays(-ago), by:U.jasur, dims:"Devor 3200 mm, balandlik 2700 mm", exactPrice:price, model3d:true});
  // 1-2: leadlar
  mk(11, "lead", "faol", {lead:{approxPrice:0, date:T}, created_at:T + "T09:00:00Z"});
  mk(10, "lead", "faol");
  // 3: o'lchov rejalashtirilgan
  mk(9, "zamer", "faol", {zamer:{assignedTo:U.jasur, plannedDate:T, plannedTime:"15:00"}});
  // 4: o'lchandi, qaror kutilmoqda
  mk(8, "zamer", "faol", {zamer:zam(21e6, 2)});
  // 5: o'ylab ko'radi
  mk(7, "zamer", "kutish", {zamer:zam(14e6, 6), decision:{type:"kutish", date:addDays(-5), followup:addDays(-1), note:"Oilasi bilan maslahatlashadi", followups:[{date:addDays(-5), note:"O'ylab ko'radi", by:"Dilshod (sotuvchi)"}]}});
  // 6: rad etdi
  mk(6, "zamer", "rad", {zamer:zam(26e6, 10), decision:{type:"rad", date:addDays(-9), reason:"qimmat", note:"Boshqa joyda 21 mln aytishgan"}});
  // 7: loyihalash
  const p7 = mk(5, "loyiha", "faol", {zamer:zam(19e6, 4), sale:sale(19e6, 3, 22), managerId:U.bekzod, design:{by:U.nodira, checks:{model3d:{by:"Nodira (texnolog)", d:fdate(addDays(-1))}}, furn:[{type:"Petlya", name:"Blum Clip Top", qty:14, price:45000},{type:"Salaska (yo'naltiruvchi)", name:"Tandem 500", qty:3, price:180000},{type:"Ruchka", name:"128 mm, qora", qty:12, price:25000}]}});
  pay(p7, 8e6, "zaklat", addDays(-3));
  // 8: ishlab chiqarish
  const p8 = mk(4, "ishlab", "faol", {zamer:zam(23e6, 12), sale:sale(23e6, 10, 15), managerId:U.bekzod, design:{by:U.nodira, checks:{model3d:{by:"Nodira", d:""}, parts:{by:"Nodira", d:""}, furn:{by:"Nodira", d:""}}},
    prod:{cutService:S["Zamin Baraka sexi"], saw:"Pilni sentr", edgeService:S["Zamin Baraka sexi"], edgeType:"1 mm", double:false, rover:true, roverService:S["Latif Wood"], checks:{material:{by:"Otabek", d:""}, kesishga:{by:"Otabek", d:""}, kesildi:{by:"Otabek", d:""}}}});
  pay(p8, 1e7, "zaklat", addDays(-10));
  exp(p8, "material", 5.2e6, addDays(-7), {name:"LDSP Kronospan 16 mm, oq", sheets:10, supplier:"Bozor"});
  exp(p8, "kesish", 320000, addDays(-6), {saw:"Pilni sentr", sheets:10}, S["Zamin Baraka sexi"]);
  // 9: yig'ish
  const p9 = mk(3, "yigish", "faol", {zamer:zam(16e6, 20), sale:sale(16e6, 18, 4), managerId:U.bekzod, design:{by:U.nodira}, prod:{cutService:S["KAO sexi"], saw:"Altendorf", edgeService:S["Ilhom"], edgeType:"0.4 mm"}, asm:{start:addDays(-2), workers:[{id:U.rustam, pay:1.2e6, note:"korpus"},{id:U.sherzod, pay:800000, note:"fasad"}]}});
  pay(p9, 7e6, "zaklat", addDays(-18));
  exp(p9, "material", 3.9e6, addDays(-15), {name:"LDSP Egger 16 mm", sheets:7}); exp(p9, "kesish", 210000, addDays(-14), {saw:"Altendorf", sheets:7}, S["KAO sexi"]);
  exp(p9, "kromka", 330000, addDays(-13), {edgeType:"0.4 mm", meters:110}, S["Ilhom"]); exp(p9, "yol_sex", 150000, addDays(-12), {route:"Ilhom → sex"});
  exp(p9, "furnitura", 1.1e6, addDays(-11), {ftype:"Petlya", name:"Blum", qty:20, unit:55000});
  // 10: o'rnatish
  const p10 = mk(2, "ornatish", "faol", {zamer:zam(12e6, 28), sale:sale(12e6, 26, 1), managerId:U.bekzod, design:{by:U.nodira}, prod:{cutService:S["Ilhom"], saw:"Pilni sentr", edgeService:S["Ilhom"], edgeType:"1 mm"}, asm:{start:addDays(-6), workers:[{id:U.rustam, pay:900000}]}, install:{date:T, team:[U.ulugbek, U.rustam]}});
  pay(p10, 5e6, "zaklat", addDays(-26)); exp(p10, "material", 3.1e6, addDays(-22)); exp(p10, "kesish", 210000, addDays(-21), {sheets:6}, S["Ilhom"]); exp(p10, "kromka", 380000, addDays(-20), {edgeType:"1 mm", meters:85}, S["Ilhom"]); exp(p10, "furnitura", 900000, addDays(-18), {ftype:"Salaska (yo'naltiruvchi)"}); exp(p10, "yigish", 900000, addDays(-3), {worker:U.rustam});
  // 11: topshirish
  const p11 = mk(1, "topshirish", "faol", {zamer:zam(9.5e6, 35), sale:sale(9.5e6, 33, -3), managerId:U.bekzod, design:{by:U.nodira}, asm:{workers:[{id:U.sherzod, pay:700000}]}, install:{date:addDays(-1), team:[U.ulugbek]},
    hand:{date:T, satisfied:"qisman", complaints:["furnitura"], complaintText:"Bitta eshik qiyshiq yopilmoqda", unfinished:[{text:"Eshik petlyasini sozlash", done:false}]}});
  pay(p11, 4e6, "zaklat", addDays(-33)); exp(p11, "material", 2.6e6, addDays(-30)); exp(p11, "kesish", 150000, addDays(-29), {sheets:5}, S["Marg'ilon Makon (Murodil Qori)"]); exp(p11, "kromka", 220000, addDays(-28), {edgeType:"0.4 mm", meters:90}, S["Marg'ilon Makon (Murodil Qori)"]); exp(p11, "furnitura", 650000, addDays(-25)); exp(p11, "yigish", 700000, addDays(-5), {worker:U.sherzod}); exp(p11, "yol_mijoz", 200000, addDays(-1), {route:"Sex → mijoz"});
  // 12: yopilgan
  const p12 = mk(0, "topshirish", "yopilgan", {zamer:zam(15e6, 45), sale:sale(15e6, 42, -20), managerId:U.bekzod, design:{by:U.nodira}, asm:{workers:[{id:U.rustam, pay:1e6}]}, install:{date:addDays(-17), team:[U.ulugbek]}, hand:{date:addDays(-16), satisfied:"ha", complaints:[]}, closedAt:addDays(-15), closedBy:U.admin});
  pay(p12, 6e6, "zaklat", addDays(-42)); pay(p12, 9e6, "qoldiq", addDays(-16));
  exp(p12, "material", 4.2e6, addDays(-38)); exp(p12, "kesish", 240000, addDays(-37), {saw:"Altendorf", sheets:8}, S["KAO sexi"]); exp(p12, "kromka", 300000, addDays(-36), {edgeType:"0.4 mm", meters:120}, S["KAO sexi"]); exp(p12, "rover", 450000, addDays(-35), {qty:75}, S["Latif Wood"]); exp(p12, "yol_sex", 150000, addDays(-34)); exp(p12, "furnitura", 1.4e6, addDays(-33)); exp(p12, "yigish", 1e6, addDays(-20), {worker:U.rustam}); exp(p12, "ornatish", 400000, addDays(-17), {worker:U.ulugbek}); exp(p12, "yol_mijoz", 200000, addDays(-17));
  exp(null, "ijara", 6e6, addDays(-5)); exp(null, "reklama", 1.5e6, addDays(-8));
  B._save();
}
