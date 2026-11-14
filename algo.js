/* =====================================================================
   ALGORITHMEN – Hessenalgorithmen V4.2.1 LDK
   Liste mit Suche, nachgezeichnete Flussdiagramme, Medikamentenblätter,
   Originalseiten. Wird vor app.js geladen; Funktionen laufen erst beim Aufruf.
   ===================================================================== */
const ALGO_CATS = [
  { k: "K", name: "Krankheitsbilder", color: "#ff3b30", items: ALGO_K },
  { k: "M", name: "Medikamente", color: "#30b158", items: ALGO_M },
  { k: "P", name: "Prozeduren", color: "#ff9500", items: ALGO_P },
  { k: "V", name: "Verfahrensanweisungen", color: "#0a84ff", items: ALGO_V },
  { k: "U", name: "Mitgeltende Unterlagen", color: "#af52de", items: ALGO_U },
];
const ALGO_ALL = ALGO_CATS.flatMap((c) => c.items.map((a) => Object.assign(a, { cat: c })));
const ALGO_BY_ID = Object.fromEntries(ALGO_ALL.map((a) => [a.id, a]));
const algoState = { q: "", cat: "all" };

/* ---------- Suche ---------- */
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[*_]/g, "");
function algoText(a) {
  if (a._text) return a._text;
  const parts = [];
  const walk = (x) => {
    if (x == null) return;
    if (typeof x === "string") parts.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (typeof x === "object") Object.entries(x).forEach(([k, v]) => { if (k !== "cat" && k !== "_text" && k !== "_norm") walk(v); });
  };
  walk([a.flow, a.secs, a.info, a.letters]);
  a._text = parts.join(" · ").replace(/\*\*/g, "").replace(/\n/g, " ");
  a._norm = { id: norm(a.id), title: norm(a.title + " " + (a.short || "")), tags: norm(a.tags || ""), text: norm(a._text) };
  return a._text;
}
function algoSearch(q) {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  const res = [];
  for (const a of ALGO_ALL) {
    algoText(a);
    const n = a._norm;
    let score = 0, ok = true;
    for (const t of toks) {
      let s = 0;
      if (n.id === t) s += 60; else if (n.id.startsWith(t)) s += 30;
      if (n.title.includes(t)) s += n.title.split(/\W+/).some((w) => w.startsWith(t)) ? 25 : 15;
      if (n.tags.includes(t)) s += 10;
      if (n.text.includes(t)) s += 3;
      if (!s) { ok = false; break; }
      score += s;
    }
    if (ok) res.push({ a, score });
  }
  return res.sort((x, y) => y.score - x.score).map((r) => r.a);
}
function snippet(a, q) {
  const t = norm(q).split(/\s+/).filter(Boolean)[0];
  if (!t || a._norm.title.includes(t) || a._norm.tags.includes(t)) return "";
  const i = a._norm.text.indexOf(t);
  if (i < 0) return "";
  const s = Math.max(0, i - 30), e = Math.min(a._text.length, i + t.length + 50);
  return (s ? "… " : "") + esc(a._text.slice(s, i)) + "<mark>" + esc(a._text.slice(i, i + t.length)) + "</mark>" + esc(a._text.slice(i + t.length, e)) + (e < a._text.length ? " …" : "");
}

/* ---------- Liste ---------- */
const acode = (a) => `<span class="acode" style="--ac:${a.cat.color}">${esc(a.id)}</span>`;
function algoRow(a, sub) {
  return `<div class="cell tappable algo-row" data-id="${esc(a.id)}">${acode(a)}<div class="grow"><div class="t">${esc(a.short || a.title)}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>${a.kids ? `<span class="kid-tag">Kind</span>` : ""}<span class="chev">›</span></div>`;
}
function renderAlgoTab(p) {
  setNav(rootNav());
  p.innerHTML = `
    <h1 class="large-title">Algorithmen</h1>
    <p class="subtitle">Hessenalgorithmen V4.2.1 · Lahn-Dill-Kreis · gültig ab 01.01.2026</p>
    <div class="search-wrap"><input type="search" class="search" id="aSearch" placeholder="Suchen – z. B. Krampf, Nitro, K12" autocomplete="off" value="${esc(algoState.q)}"></div>
    <div class="hscroll cat-chips" id="aCats">${[["all", "Alle"], ...ALGO_CATS.map((c) => [c.k, c.name])].map(([k, l]) =>
      `<button class="chip ${algoState.cat === k ? "sel" : ""}" data-k="${k}">${k === "all" ? l : `<b>${k}</b> ${esc(l)}`}</button>`).join("")}</div>
    <div id="aList"></div>
    <div class="section-header">Offline</div>
    <div class="group"><div class="cell tappable" id="aOffline"><div class="grow"><div class="t" style="color:var(--blue)">Originalseiten offline speichern</div><div class="s">ca. 11 MB · danach auch ohne Netz verfügbar</div></div></div></div>
    <p class="section-footer">Nachgezeichnet aus den Hessenalgorithmen V4.2.1 für den Lahn-Dill-Kreis (ÄLRD). Verbindlich ist die Originalfassung – zu jedem Eintrag gibt es die Originalseite zum Gegenprüfen.</p>`;
  const list = $("#aList", p), inp = $("#aSearch", p);
  const draw = () => {
    const q = algoState.q.trim();
    const inCat = (a) => algoState.cat === "all" || a.cat.k === algoState.cat;
    let html = "";
    if (q) {
      const r = algoSearch(q).filter(inCat);
      html = r.length
        ? `<div class="section-header">${r.length} Treffer</div><div class="group">${r.map((a) => algoRow(a, snippet(a, q) || esc(a.cat.name))).join("")}</div>`
        : `<div class="empty">Nichts gefunden für „${esc(q)}“</div>`;
    } else {
      const recent = store.get("algoRecent", []).map((id) => ALGO_BY_ID[id]).filter((a) => a && inCat(a));
      if (recent.length && algoState.cat === "all") html += `<div class="section-header">Zuletzt geöffnet</div><div class="group">${recent.map((a) => algoRow(a, esc(a.cat.name))).join("")}</div>`;
      for (const c of ALGO_CATS) {
        if (algoState.cat !== "all" && algoState.cat !== c.k) continue;
        html += `<div class="section-header"><span class="cat-dot" style="background:${c.color}"></span>${esc(c.name)}</div><div class="group">${c.items.map((a) => algoRow(a, a.short && a.short !== a.title ? esc(a.title) : "")).join("")}</div>`;
      }
    }
    list.innerHTML = html;
    $$(".algo-row", list).forEach((r) => r.addEventListener("click", () => openAlgo(r.dataset.id, "Algorithmen")));
  };
  inp.addEventListener("input", () => { algoState.q = inp.value; draw(); });
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") inp.blur(); });
  $$("#aCats .chip", p).forEach((b) => b.addEventListener("click", () => {
    algoState.cat = b.dataset.k; haptic();
    $$("#aCats .chip", p).forEach((x) => x.classList.toggle("sel", x === b)); swapBody(list, draw);
  }));
  $("#aOffline", p).addEventListener("click", cacheOriginals);
  draw();
}

async function cacheOriginals() {
  const pages = [...new Set(["E05", ...ALGO_ALL.flatMap((a) => a.pages || [a.page])])];
  let done = 0, fail = 0;
  toast(`Lade ${pages.length} Seiten …`);
  for (const pg of pages) {
    try { const r = await fetch(`orig/${pg}.jpg`); if (!r.ok) throw 0; done++; } catch { fail++; }
  }
  toast(fail ? `${done} gespeichert, ${fail} fehlgeschlagen` : `Alle ${done} Seiten offline verfügbar`);
}

/* ---------- Detail ---------- */
function openAlgo(id, backLabel) {
  const a = ALGO_BY_ID[id];
  if (!a) return toast(`${id} nicht gefunden`);
  const rec = store.get("algoRecent", []).filter((x) => x !== id); rec.unshift(id); store.set("algoRecent", rec.slice(0, 5));
  haptic();
  pushPage((pg) => renderAlgoDetail(pg, a), detailNav(a.short || a.title, backLabel));
}
const md = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/(^|[\s(„])\*([^*\n]+?)\*(?=[\s).,:;!?“]|$)/g, "$1<i>$2</i>")
  .replace(/\n/g, "<br>");
const CROSS = `<svg class="na-ico" viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="4" fill="#fff"/><path d="M7.5 3h5v4.5H17v5h-4.5V17h-5v-4.5H3v-5h4.5z" fill="#d70015"/></svg>`;
const refBtns = (r) => r && r.length ? `<span class="fl-refs">${r.map((x) => `<button class="ref" data-go="${esc(x)}">${esc(x)}</button>`).join("")}</span>` : "";
function brClass(l) { return /^ja\b/i.test(l) ? "yes" : /^nein\b/i.test(l) ? "no" : "alt"; }
function fnode(n) {
  if (n.q !== undefined) return fdec(n);
  if (n.na) return `<div class="fl-node fl-na">${CROSS}<span>${md(n.t || "NA alarmieren")}</span></div>`;
  if (n.go) return `<button class="fl-node fl-go" data-go="${esc(n.go)}"><span class="grow">${md(n.t)}</span><span class="ref">${esc(n.go)}</span><span class="chev">›</span></button>`;
  if (n.n) return `<div class="fl-note">${md(n.n)}</div>`;
  if (n.tri) return `<div class="fl-node fl-tri tri-${n.tri === "grün" ? "gruen" : n.tri}">${esc(n.t)}</div>`;
  return `<div class="fl-node fl-${n.c || "w"}">${md(n.t)}${refBtns(n.r)}${n.star ? `<div class="fl-star">ⓘ ${md(n.star)}</div>` : ""}${n.ra ? `<div class="fl-ra">Kompetenzniveau für RA</div>` : ""}</div>`;
}
function fdec(n) {
  const head = `<div class="fl-q"><span>${md(n.q)}</span></div>`;
  if (!n.b || !n.b.length) return head;
  const light = n.b.length === 2 && n.b.every(([, ns]) => ns.length <= 1 && !ns.some((x) => x.q !== undefined) && !ns.some((x) => (x.t || x.n || "").length > 70));
  return `<div class="fl-dec">${head}<div class="fl-branches${light ? " two" : ""}">${n.b.map(([lab, ns]) =>
    `<div class="fl-br ${brClass(lab)}"><div class="fl-lab">${esc(lab)}</div>${ns.length ? fseq(ns) : `<div class="fl-cont">weiter ↓</div>`}</div>`).join("")}</div></div>`;
}
const fseq = (ns) => `<div class="fl-seq">${ns.map(fnode).join("")}</div>`;

function cellHtml(v) { return md(v); }
function tableHtml(rows) {
  const [head, ...body] = rows;
  return `<div class="hscroll tblwrap"><table class="vt atbl"><tr>${head.map((c) => `<th>${cellHtml(c)}</th>`).join("")}</tr>${body.map((r) => `<tr>${r.map((c) => `<td>${cellHtml(c)}</td>`).join("")}</tr>`).join("")}</table></div>`;
}
function infoHtml(info) {
  return (info || []).map(([t, v, tone]) => `<div class="algo-card${tone ? " tone-" + tone : ""}"><div class="ac-h">${md(t)}</div>${Array.isArray(v) ? tableHtml(v) : `<div class="ac-b">${md(v).replace(/ · /g, '<span class="sep"> · </span>')}</div>`}</div>`).join("");
}
const MED_TOP = ["Dosierung", "Repetition"];
function medHtml(secs) {
  const isKI = (l) => /^Kontraindikation/i.test(l);
  const list = (items) => items.length === 1 ? `<div class="ac-b">${md(items[0])}</div>` : `<ul class="ac-ul">${items.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
  const top = secs.filter(([l]) => MED_TOP.includes(l));
  const rest = secs.filter(([l]) => !MED_TOP.includes(l));
  const card = ([l, items], cls = "") => `<div class="algo-card ${cls}"><div class="ac-h">${esc(l)}</div>${list(items)}</div>`;
  const split = ([l, items]) => [l, items.map((i) => i.replace(/ · /g, "\n"))];
  return `<div class="dose-block">${top.map((s) => card(split(s), "tone-dose")).join("")}</div>` +
    rest.map((s) => card(s, isKI(s[0]) ? "tone-r" : /^Indikation/i.test(s[0]) ? "tone-ind" : "")).join("");
}
function lettersHtml(letters) {
  return `<div class="group">${letters.map(([l, t, d]) => `<div class="cell scheme-item"><div class="letter" style="background:var(--ac-color)">${esc(l)}</div><div class="grow"><div class="t">${esc(t)}</div><div class="s">${md(d)}</div></div></div>`).join("")}</div>`;
}
const LEGEND = [
  ["w", "Standardmaßnahme NotSan (oft Delegation an RettSan möglich)"],
  ["c", "Kompetenzniveau RA (ÄLRD-Mitwirkungsaufgabe)"],
  ["y", "Invasiv – NotSan ÄLRD-Mitwirkungsaufgabe § 4(2)2c, je nach Situation Assistenz/Delegation"],
  ["o", "Invasiv – in einzelnen RDB eigenständige ÄLRD-Mitwirkungsaufgabe (lokale Vorgabe)"],
  ["r", "Invasiv „rein ärztlich“ (Assistenz § 4(2)2a, Delegation vor Ort § 4(2)2b)"],
  ["b", "Einstieg, Ziel, Verweis oder Hinweis"],
];
function renderAlgoDetail(p, a) {
  p.style.setProperty("--ac-color", a.cat.color);
  let body = "";
  if (a.flow) body += `<details class="legend"><summary>Farblegende</summary>${LEGEND.map(([c, t]) => `<div class="lg-row"><span class="lg-sw fl-${c}"></span>${esc(t)}</div>`).join("")}</details><div class="fl">${fseq(a.flow)}</div>`;
  if (a.secs) body += medHtml(a.secs);
  if (a.letters) body += lettersHtml(a.letters);
  if (a.info && a.info.length) body += `${a.flow || a.letters ? '<div class="section-header">Hinweise</div>' : ""}${infoHtml(a.info)}`;
  p.innerHTML = `
    <div class="algo-head">${acode(a)}<span class="algo-cat">${esc(a.cat.name)}</span>${a.kids ? `<span class="kid-tag">Kind</span>` : ""}</div>
    <h1 class="large-title algo-title">${esc(a.title)}</h1>
    <div class="algo-body">${body}</div>
    <button class="btn block" id="aOrig" style="margin-top:1.25rem">${a.pages && a.pages.length > 1 ? `Originalseiten ansehen (${a.pages.length})` : "Originalseite ansehen"}</button>
    <p class="section-footer">Nachgezeichnet aus den Hessenalgorithmen V4.2.1 LDK. Maßgeblich ist das Original des ÄLRD.</p>`;
  $$("[data-go]", p).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openAlgo(b.dataset.go, a.id); }));
  $("#aOrig", p).addEventListener("click", () => pushPage((pg) => renderOriginal(pg, a), detailNav("Original", a.id)));
}
function renderOriginal(p, a) {
  p.style.touchAction = "pan-x pan-y pinch-zoom";
  const pages = a.pages || [a.page];
  p.innerHTML = `<h1 class="large-title">${esc(a.id)} · Original</h1><p class="subtitle">Mit zwei Fingern zoomen</p>
    ${pages.map((pg) => `<a href="orig/${pg}.jpg" target="_blank" rel="noopener" class="orig-wrap"><img class="orig-img" src="orig/${pg}.jpg" alt="Originalseite ${esc(a.id)}" loading="lazy"></a>`).join("")}
    <p class="section-footer">Tippen öffnet die Seite einzeln (zum Vergrößern). Ohne Netz nur verfügbar, wenn die Seite schon einmal geöffnet oder offline gespeichert wurde.</p>`;
  $$(".orig-img", p).forEach((img) => img.addEventListener("error", () => { img.replaceWith(h(`<div class="empty">Seite offline nicht verfügbar</div>`)); }));
}
