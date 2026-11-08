"use strict";

/* =====================================================================
   Helpers
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const store = {
  get(k, d) { try { const v = localStorage.getItem("rdp_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("rdp_" + k, JSON.stringify(v)); } catch {} },
};
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1700);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Kopiert: " + text); }
  catch { askText({ title: "Kopieren", value: text, multiline: true, confirmLabel: "Fertig", footer: "Text markieren und kopieren." }); }
}
/* Haptik: iOS 18+ löst beim Umschalten eines <input switch> ein Feedback aus. */
function haptic() { if (isIOS) try { $("#hapticLabel").click(); } catch {} }

const ICON = {
  call: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  nav: '<svg viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" style="width:1.5rem;height:1.5rem;stroke-width:2.6"><path d="M15 18l-6-6 6-6"/></svg>',
};

/* =====================================================================
   Motion: Federn, Impuls-Projektion, Rubber-Banding (nach Apple, WWDC 2018)
   ===================================================================== */
function spring({ from, to, velocity = 0, damping = 1, response = 0.35, onUpdate, onDone }) {
  if (reducedMotion()) { onUpdate(to); onDone && onDone(); return { stop() {}, get x() { return to; } }; }
  const k = (2 * Math.PI / response) ** 2, c = (4 * Math.PI * damping) / response;
  let x = from, v = velocity, last = performance.now(), id = 0, done = false;
  const step = (now) => {
    // echte Zeit (max. 0,5 s je Frame) in festen 4-ms-Schritten → stabil und pünktlich, auch bei langsamen Frames
    const dt = Math.min(0.5, Math.max(0, (now - last) / 1000)); last = now;
    const n = Math.max(1, Math.ceil(dt / 0.004)), hs = dt / n;
    for (let i = 0; i < n; i++) { const a = -k * (x - to) - c * v; v += a * hs; x += v * hs; }
    if (Math.abs(x - to) < 0.25 && Math.abs(v) < 2) { done = true; onUpdate(to); onDone && onDone(); return; }
    onUpdate(x); id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return { stop() { cancelAnimationFrame(id); }, get x() { return x; }, get v() { return v; }, get done() { return done; } };
}
const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
const rubberband = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));
function velocityTracker() {
  const s = [];
  return {
    add(p) { const t = performance.now(); s.push({ t, p }); while (s.length > 2 && t - s[0].t > 100) s.shift(); },
    get() { if (s.length < 2) return 0; const a = s[0], b = s[s.length - 1]; return b.t === a.t ? 0 : ((b.p - a.p) / (b.t - a.t)) * 1000; },
  };
}

/* =====================================================================
   State & Migration
   ===================================================================== */
let contacts = store.get("contacts", null);
if (!contacts) contacts = DEFAULT_CONTACTS.map((c) => ({ ...c }));
else if (!store.get("contactsV2", false)) {
  contacts = contacts
    .filter((c) => !(c.group === "Notruf" && c.number.replace(/\D/g, "") === "112"))
    .map((c) => ({ ...c, name: c.name.replace(/\s*\(Amtsleitung\)/, ""),
      group: c.group === "Leitstelle" ? "Leitstellen" : c.group === "RTW" ? "RTW-Handys" : c.group }));
}
store.set("contacts", contacts); store.set("contactsV2", true);

/* Listen mit Kategorien (eigene Reihenfolge, Kategorien dürfen leer sein) */
function loadList(key, groupsKey, defGroups) {
  const L = { items: store.get(key, []), groups: store.get(groupsKey, null) || [...defGroups] };
  L.sync = () => { L.items.forEach((c) => { if (c.group && !L.groups.includes(c.group)) L.groups.push(c.group); }); store.set(groupsKey, L.groups); };
  L.save = () => { store.set(key, L.items); L.sync(); };
  L.save();
  return L;
}
const LISTS = {
  nummern: loadList("contacts", "groups", CONTACT_GROUPS),
  codes: loadList("codes", "codeGroups", []),
};

let hospitals = store.get("hospitalsV2", DEFAULT_HOSPITALS.map((x) => ({ ...x })));
let config = Object.assign({ theme: "auto", region: 144001 }, store.get("config", {}));
const pzc = store.get("pzc", { rmi: null, age: "", infant: false, urg: null });
let recentPzc = store.get("recentPzc", []);
const ui = { tab: store.get("tab", "nummern"), toolsSeg: "tapper", pzcSeg: "builder", schemaSeg: "schemata" };

function applyTheme() {
  if (config.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", config.theme);
}
applyTheme();

/* =====================================================================
   Navigation bar, Seiten-Stack, Tabs
   ===================================================================== */
const vp = $("#viewport"), navbar = $("#navbar");
function navButton(b) {
  const el = h(`<button class="navbtn ${b.bold ? "bold" : ""}" aria-label="${esc(b.aria || b.label || "")}">${b.icon || ""}${b.label ? `<span>${esc(b.label)}</span>` : ""}</button>`);
  el.addEventListener("click", b.onClick);
  return el;
}
let currentNav = null, navCapture = null;
function setNav(cfg = {}) {
  if (navCapture) { navCapture.cfg = cfg; return; } // Nachbarseite beim Wischen: Leiste noch nicht umschalten
  currentNav = cfg;
  $("#navTitle").textContent = cfg.title || "";
  const L = $("#navLeft"), R = $("#navRight");
  L.replaceChildren(...(cfg.left || []).map(navButton));
  R.replaceChildren(...(cfg.right || []).map(navButton));
  navbar.classList.toggle("always", !!cfg.alwaysTitle);
  onScroll();
}
function onScroll() { navbar.classList.toggle("scrolled", scrollY > 38); }
addEventListener("scroll", onScroll, { passive: true });

const TABS = ["nummern", "codes", "tools", "pzc", "kinder", "schema"];
const TITLES = { nummern: "Nummern", codes: "Schlüsselcodes", tools: "Tools", pzc: "PZC", kinder: "Kinder", schema: "Schemata" };
const RENDER = {};
const settingsBtn = { icon: ICON.gear, aria: "Einstellungen", onClick: () => openSettings() };
let renderingTab = null;
function rootNav(extraRight = []) { return { title: TITLES[renderingTab || ui.tab], left: [settingsBtn], right: extraRight }; }

function markTab(tab) { $$(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab)); }
function showTab(tab, { animate = true } = {}) {
  pagerReset();
  ui.tab = tab; store.set("tab", tab);
  cleanupTools();
  markTab(tab);
  const p = h(`<div class="page"></div>`);
  vp.replaceChildren(p);
  scrollTo(0, 0);
  RENDER[tab](p);
  if (animate && !reducedMotion()) p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
}
$$(".tabbar button").forEach((b) => b.addEventListener("pointerdown", () => {
  if (b.dataset.tab === ui.tab && vp.children.length > 1) return popPage();
  if (b.dataset.tab !== ui.tab) showTab(b.dataset.tab);
}));

/* Wischen zwischen den Reitern – wie Seiten auf dem Home-Bildschirm.
   Nachbarseite liegt daneben und folgt 1:1, Loslassen: Impuls-Projektion entscheidet. */
const pagerLayer = $("#pagerLayer");
const pager = { nb: null, dir: 0, x: 0, anim: null, drag: null };
function pagerApply(x) {
  pager.x = x;
  const cur = vp.firstElementChild; if (cur) cur.style.transform = x ? `translateX(${x}px)` : "";
  if (pager.nb) pager.nb.style.transform = `translateX(${x + pager.dir * innerWidth}px)`;
}
function pagerRemoveNeighbor() { if (pager.nb) pager.nb.remove(); pager.nb = null; pager.dir = 0; }
function pagerReset() {
  pager.anim && pager.anim.stop(); pager.anim = null; pager.drag = null;
  pagerRemoveNeighbor(); pager.x = 0;
  const cur = vp.firstElementChild; if (cur) cur.style.transform = "";
}
function pagerNeighbor(dir) {
  if (pager.nb && pager.dir === dir) return true;
  pagerRemoveNeighbor();
  const idx = TABS.indexOf(ui.tab) + dir;
  if (idx < 0 || idx >= TABS.length) return false;
  const tab = TABS[idx], nb = h(`<div class="page pager-nb"></div>`);
  pagerLayer.appendChild(nb);
  navCapture = {}; renderingTab = tab;
  try { RENDER[tab](nb); } finally { nb._nav = navCapture.cfg; nb._tab = tab; navCapture = null; renderingTab = null; }
  pager.nb = nb; pager.dir = dir;
  return true;
}
function pagerCommit() {
  const nb = pager.nb; pager.anim = null;
  if (!nb) return;
  const tab = nb._tab;
  nb.classList.remove("pager-nb"); nb.style.transform = "";
  pager.nb = null; pager.dir = 0; pager.x = 0;
  vp.replaceChildren(nb);
  scrollTo(0, 0);
  ui.tab = tab; store.set("tab", tab); markTab(tab);
  setNav(nb._nav); cleanupTools();
}
const SWIPE_BLOCK = ".handle,.tapbtn,input,textarea,select,.hscroll,.del-confirm";
vp.addEventListener("pointerdown", (e) => {
  if (vp.children.length !== 1 || e.button > 0 || e.target.closest(SWIPE_BLOCK) || $(".ed-item.lifted")) return;
  const grabbing = !!(pager.anim && !pager.anim.done);
  if (grabbing) pager.anim.stop();
  pager.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: pager.x, decided: grabbing, vt: velocityTracker() };
  if (grabbing) { try { vp.setPointerCapture(e.pointerId); } catch {} };
});
vp.addEventListener("pointermove", (e) => {
  const d = pager.drag; if (!d || e.pointerId !== d.id) return;
  const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
  if (!d.decided) {
    if (Math.hypot(dx, dy) < 10) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.2) { pager.drag = null; return; } // vertikal → normal scrollen
    d.decided = true; d.sx = e.clientX; { try { vp.setPointerCapture(e.pointerId); } catch {} };
    $$(".cell.pressed").forEach((c) => c.classList.remove("pressed"));
  }
  let x = d.x0 + (e.clientX - d.sx);
  const dir = x < 0 ? 1 : -1;
  if (x !== 0 && !pagerNeighbor(dir)) x = rubberband(x, innerWidth); // erster/letzter Reiter: weicher Widerstand
  d.vt.add(x); pagerApply(x);
});
const pagerEnd = (e) => {
  const d = pager.drag; if (!d || e.pointerId !== d.id) return;
  pager.drag = null;
  if (!d.decided) return;
  d.suppressClick = true; vp._suppressClick = true; setTimeout(() => (vp._suppressClick = false), 50);
  const v = d.vt.get(), W = innerWidth, x = pager.x;
  const proj = x + project(v, 0.99);
  const go = pager.nb && Math.sign(proj) === -pager.dir && Math.abs(proj) > W / 2;
  const to = go ? -pager.dir * W : 0;
  pager.anim = spring({ from: x, to, velocity: v, damping: 1, response: 0.32, onUpdate: pagerApply,
    onDone: () => { if (go) pagerCommit(); else { pagerRemoveNeighbor(); pagerApply(0); pager.anim = null; } } });
};
vp.addEventListener("pointerup", pagerEnd);
vp.addEventListener("pointercancel", (e) => { if (pager.drag && pager.drag.decided) pagerEnd(e); else pager.drag = null; });
// Nach einem Wisch keinen Klick auf das Element darunter auslösen
vp.addEventListener("click", (e) => { if (vp._suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);

/* Push / Pop mit Feder + Wisch-zurück vom linken Rand (interruptible) */
function pushPage(build, nav) {
  const base = vp.lastElementChild, sy = scrollY, W = innerWidth;
  base._nav = currentNav; base._sy = sy;
  Object.assign(base.style, { position: "fixed", top: -sy + "px", left: 0, right: 0 });
  const p = h(`<div class="page" style="position:relative;z-index:2;box-shadow:-12px 0 32px rgba(0,0,0,.28);touch-action:pan-y"></div>`);
  p._base = base; p._nav = nav; p._x = W;
  vp.appendChild(p);
  build(p); scrollTo(0, 0); setNav(nav);
  const apply = (x) => { p._x = x; p.style.transform = `translateX(${x}px)`; base.style.transform = `translateX(${(x - W) * 0.3}px)`; base.style.opacity = String(1 - 0.25 * (1 - x / W)); };
  p._apply = apply; apply(W);
  p._anim = spring({ from: W, to: 0, damping: 1, response: 0.38, onUpdate: apply, onDone: () => { p.style.transform = ""; } });
  attachEdgeSwipe(p);
}
function popPage(velocity = 0) {
  const p = vp.lastElementChild; if (!p || !p._base) return;
  const base = p._base, W = innerWidth;
  p._anim && p._anim.stop();
  p._anim = spring({ from: p._x || 0, to: W, velocity, damping: 1, response: 0.35, onUpdate: p._apply, onDone: () => {
    p.remove();
    Object.assign(base.style, { position: "", top: "", left: "", right: "", transform: "", opacity: "" });
    scrollTo(0, base._sy || 0);
    setNav(base._nav);
  } });
}
function attachEdgeSwipe(p) {
  let drag = null;
  p.addEventListener("pointerdown", (e) => {
    if (e.clientX > 24 && !(p._anim && !p._anim.done)) return;
    p._anim && p._anim.stop();
    drag = { id: e.pointerId, startX: e.clientX, x0: p._x || 0, vt: velocityTracker() };
    p.setPointerCapture(e.pointerId);
  });
  p.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    let x = drag.x0 + (e.clientX - drag.startX);
    if (x < 0) x = rubberband(x, innerWidth);
    drag.vt.add(x); p._apply(x);
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = drag.vt.get(), x = p._x; drag = null;
    if (x + project(v) > innerWidth / 2) popPage(v);
    else p._anim = spring({ from: x, to: 0, velocity: v, damping: 0.85, response: 0.35, onUpdate: p._apply, onDone: () => { p.style.transform = ""; } });
  };
  p.addEventListener("pointerup", end); p.addEventListener("pointercancel", end);
}
function detailNav(title, backLabel) {
  return { title, alwaysTitle: false, left: [{ icon: ICON.back, label: backLabel, onClick: () => popPage() }] };
}

/* Segmented Control – Thumb folgt per Feder vom aktuellen Wert aus */
function segmented(options, current, onChange) {
  const n = options.length;
  const el = h(`<div class="seg" role="tablist"><div class="thumb" style="width:calc((100% - 4px)/${n});left:2px"></div>${options.map(([k, l]) => `<button role="tab" data-k="${k}" class="${k === current ? "active" : ""}">${esc(l)}</button>`).join("")}</div>`);
  const thumb = $(".thumb", el);
  let pos = options.findIndex(([k]) => k === current), anim = null;
  const place = (i) => { pos = i; thumb.style.transform = `translateX(${i * 100}%)`; };
  place(pos);
  $$("button", el).forEach((b, i) => b.addEventListener("pointerdown", () => {
    if (b.classList.contains("active")) return;
    $$("button", el).forEach((x) => x.classList.toggle("active", x === b));
    anim && anim.stop();
    anim = spring({ from: pos, to: i, damping: 1, response: 0.3, onUpdate: place });
    onChange(b.dataset.k);
  }));
  return el;
}
function swapBody(body, fn) {
  fn(body);
  if (!reducedMotion()) body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
}

/* Sheets – ziehbar, Projektion entscheidet über Schließen */
function openSheet({ title, confirmLabel, onConfirm, onClose, build }) {
  let closed = false;
  const root = $("#sheetRoot");
  const scrim = h(`<div class="scrim"></div>`);
  const sheet = h(`<div class="sheet" role="dialog" aria-label="${esc(title)}">
      <div class="grabber"></div>
      <div class="sheet-head"><div></div><div class="h">${esc(title)}</div><div></div></div>
      <div class="sheet-body"></div></div>`);
  const head = $(".sheet-head", sheet);
  head.children[0].replaceWith(navButton({ label: confirmLabel ? "Abbrechen" : "", onClick: () => close() }));
  if (!confirmLabel) head.children[0].replaceWith(h("<div></div>"));
  head.children[2].replaceWith(navButton({ label: confirmLabel || "Fertig", bold: true, onClick: () => { if (!onConfirm || onConfirm() !== false) close(); } }));
  root.append(scrim, sheet);
  const api = { close: () => close(), body: $(".sheet-body", sheet) };
  build(api.body, api);
  let H = sheet.offsetHeight, y = H, anim = null;
  const apply = (v) => { y = v; sheet.style.transform = `translateY(${Math.max(v, -40)}px)`; scrim.style.opacity = String(Math.max(0, Math.min(1, 1 - v / H))); };
  apply(H);
  anim = spring({ from: H, to: 0, damping: 1, response: 0.38, onUpdate: apply });
  function close(velocity = 0) {
    if (!closed) { closed = true; onClose && onClose(); }
    anim && anim.stop();
    H = sheet.offsetHeight;
    anim = spring({ from: y, to: H + 20, velocity, damping: 1, response: 0.32, onUpdate: apply, onDone: () => { scrim.remove(); sheet.remove(); } });
  }
  scrim.addEventListener("click", () => close());
  // Ziehen an Griff/Kopfzeile oder an der Liste, wenn sie oben steht
  let drag = null;
  sheet.addEventListener("pointerdown", (e) => {
    const body = api.body;
    const onHead = !body.contains(e.target);
    if (!onHead && body.scrollTop > 0) return;
    if (e.target.closest("input,select,textarea")) return;
    drag = { id: e.pointerId, sy: e.clientY, y0: y, vt: velocityTracker(), active: onHead, onHead };
    anim && anim.stop();
  });
  sheet.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.sy;
    if (!drag.active) { if (dy > 10) { drag.active = true; drag.sy = e.clientY; sheet.setPointerCapture(e.pointerId); } else return; }
    let ny = drag.y0 + (e.clientY - drag.sy);
    if (ny < 0) ny = rubberband(ny, H);
    drag.vt.add(ny); apply(ny);
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const was = drag.active, v = drag.vt.get(); drag = null;
    if (!was) return;
    if (y + project(v) > H * 0.5) close(v);
    else anim = spring({ from: y, to: 0, velocity: v, damping: 0.8, response: 0.3, onUpdate: apply });
  };
  sheet.addEventListener("pointerup", end); sheet.addEventListener("pointercancel", end);
  return api;
}

/* Eigene Dialoge statt confirm()/prompt() – die werden in manchen Web-Ansichten blockiert. */
function confirmSheet({ title, message = "", action = "Löschen", destructive = true }) {
  return new Promise((resolve) => {
    const root = $("#sheetRoot");
    const scrim = h(`<div class="scrim"></div>`);
    const as = h(`<div class="action-sheet" role="alertdialog" aria-label="${esc(title)}">
        <div class="as-group">
          <div class="as-msg"><b>${esc(title)}</b>${message ? `<span>${esc(message)}</span>` : ""}</div>
          <button class="as-btn ${destructive ? "red" : ""}" data-ok>${esc(action)}</button>
        </div>
        <button class="as-btn as-cancel" data-no>Abbrechen</button></div>`);
    root.append(scrim, as);
    const H = as.offsetHeight + 20;
    let anim, y = H;
    const apply = (v) => { y = v; as.style.transform = `translateY(${v}px)`; scrim.style.opacity = String(Math.max(0, 1 - v / H)); };
    apply(H); anim = spring({ from: H, to: 0, damping: 1, response: 0.32, onUpdate: apply });
    let done = false;
    const finish = (ok) => {
      if (done) return; done = true; if (ok) haptic();
      anim.stop(); spring({ from: y, to: H, damping: 1, response: 0.28, onUpdate: apply, onDone: () => { scrim.remove(); as.remove(); } });
      resolve(ok);
    };
    $("[data-ok]", as).addEventListener("click", () => finish(true));
    $("[data-no]", as).addEventListener("click", () => finish(false));
    scrim.addEventListener("click", () => finish(false));
  });
}
function askText({ title, label = "Name", value = "", placeholder = "", confirmLabel = "Sichern", multiline = false, footer = "" }) {
  return new Promise((resolve) => {
    let v = value, done = false;
    openSheet({
      title, confirmLabel,
      onConfirm: () => { const t = v.trim(); if (!t) { toast("Bitte etwas eingeben"); return false; } done = true; resolve(t); },
      onClose: () => { if (!done) resolve(null); },
      build: (body) => {
        body.innerHTML = multiline
          ? `<textarea class="ta" placeholder="${esc(placeholder)}" style="margin-top:.5rem">${esc(value)}</textarea>`
          : `<div class="group" style="margin-top:.5rem"><div class="field"><label>${esc(label)}</label><input type="text" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></div></div>`;
        if (footer) body.insertAdjacentHTML("beforeend", `<p class="section-footer">${esc(footer)}</p>`);
        const inp = $("input,textarea", body);
        inp.addEventListener("input", (e) => (v = e.target.value));
        setTimeout(() => { try { inp.focus(); } catch {} }, 380);
      },
    });
  });
}

/* =====================================================================
   KATEGORIEN-LISTEN: Nummern & Schlüsselcodes (gleicher Aufbau)
   ===================================================================== */
const telHref = (n) => "tel:" + n.replace(/[^\d+]/g, "");
const HANDLE = '<span class="handle" aria-label="Verschieben"><svg viewBox="0 0 24 24"><path d="M4 8h16M4 12h16M4 16h16"/></svg></span>';

const LIST_CFG = {
  nummern: {
    title: "Nummern", newTitle: "Neue Nummer", editTitle: "Nummer bearbeiten", deleteLabel: "Nummer löschen",
    sectionLabel: "Kontakt", groupPlaceholder: "z. B. Kliniken", defaultGroup: "Leitstellen",
    fields: [
      { k: "name", label: "Name", ph: "z. B. ZLS Gießen" },
      { k: "number", label: "Nummer", ph: "0641 …", type: "tel" },
      { k: "note", label: "Notiz", ph: "optional" },
    ],
    sub: (c) => (c.number ? esc(c.number) : "Keine Nummer") + (c.note ? " · " + esc(c.note) : ""),
    editSub: (c) => (c.number ? esc(c.number) : "Keine Nummer"),
    right: (c) => c.number ? `<a class="round" href="${telHref(c.number)}" aria-label="${esc(c.name)} anrufen">${ICON.call}</a>` : `<span class="round off">${ICON.call}</span>`,
    empty: "Noch keine Nummern. Tippe auf +.",
    footer: "Mit + fügst du Nummern hinzu. Unter „Bearbeiten“ kannst du Einträge und Kategorien verschieben.",
  },
  codes: {
    title: "Schlüsselcodes", newTitle: "Neuer Schlüsselcode", editTitle: "Code bearbeiten", deleteLabel: "Code löschen",
    sectionLabel: "Schlüsselcode", groupPlaceholder: "z. B. Wetzlar", defaultGroup: null,
    fields: [
      { k: "name", label: "Objekt", ph: "z. B. Seniorenheim Am Park" },
      { k: "code", label: "Code", ph: "z. B. 4711", mono: true },
      { k: "note", label: "Notiz", ph: "z. B. Kasten links vom Eingang" },
    ],
    sub: (c) => (c.note ? esc(c.note) : ""),
    editSub: (c) => (c.code ? "Code " + esc(c.code) : "Kein Code"),
    right: (c) => `<span class="keycode ${c.code ? "" : "none"}">${c.code ? esc(c.code) : "–"}</span>`,
    copyField: "code",
    empty: "Noch keine Schlüsselcodes. Tippe auf +, lege eine Kategorie wie „Wetzlar“ an und trage den Code ein.",
    footer: "Antippen kopiert den Code. Schlüsselcodes werden nur auf diesem Gerät gespeichert.",
  },
};
ui.edit = {};

function renderCatList(p, tabKey) {
  const cfg = LIST_CFG[tabKey], L = LISTS[tabKey];
  const editing = () => !!ui.edit[tabKey];
  const draw = () => {
    setNav(rootNav([
      { label: editing() ? "Fertig" : "Bearbeiten", bold: editing(), onClick: () => { ui.edit[tabKey] = !editing(); draw(); } },
      ...(editing() ? [] : [{ icon: ICON.plus, aria: cfg.newTitle, onClick: () => itemSheet(tabKey, null, draw) }]),
    ]));
    editing() ? drawEdit() : drawNormal();
  };

  const drawNormal = () => {
    const shown = L.groups.filter((g) => L.items.some((c) => c.group === g));
    p.innerHTML = `<h1 class="large-title">${esc(cfg.title)}</h1>` + (shown.length ? shown.map((g) => `
      <div class="section-header">${esc(g)}</div>
      <div class="group">${L.items.map((c, i) => c.group !== g ? "" : `
        <div class="cell ${cfg.copyField ? "tappable" : ""}" data-i="${i}">
          <div class="grow"><div class="t">${esc(c.name || "Ohne Namen")}</div>${cfg.sub(c) ? `<div class="s">${cfg.sub(c)}</div>` : ""}</div>
          ${cfg.right(c)}
        </div>`).join("")}</div>`).join("")
      : `<p class="section-footer">${esc(cfg.empty)}</p>`) +
      `<p class="section-footer" style="margin-top:1rem">${esc(cfg.footer)}</p>`;
    if (cfg.copyField) $$(".cell[data-i]", p).forEach((cell) => cell.addEventListener("click", () => {
      const v = L.items[+cell.dataset.i][cfg.copyField]; if (v) { haptic(); copy(v); }
    }));
  };

  const drawEdit = () => {
    const rows = [];
    L.groups.forEach((g) => {
      const members = L.items.map((c, i) => [c, i]).filter(([c]) => c.group === g);
      rows.push(`<div class="ed-item ed-head" data-type="g" data-g="${esc(g)}">
        <button class="del-btn" data-gdel aria-label="Kategorie löschen">−</button>
        <button class="ed-gname" data-gren>${esc(g)}</button><button class="del-confirm" data-gdel-ok>Löschen</button>${HANDLE}</div>`);
      if (!members.length) rows.push(`<div class="ed-item ed-cell ed-empty only" data-type="e">Leer – Eintrag hierher ziehen</div>`);
      members.forEach(([c, i], k) => rows.push(`
        <div class="ed-item ed-cell ${k === 0 ? "first" : ""} ${k === members.length - 1 ? "last" : ""}" data-type="c" data-i="${i}">
          <button class="del-btn" data-cdel aria-label="Löschen">−</button>
          <div class="grow" data-edit><div class="t">${esc(c.name || "Ohne Namen")}</div><div class="s">${cfg.editSub(c)}</div></div>
          <button class="del-confirm" data-cdel-ok>Löschen</button>${HANDLE}</div>`));
    });
    p.innerHTML = `<h1 class="large-title">${esc(cfg.title)}</h1>
      ${rows.length ? `<div class="edit-list">${rows.join("")}</div>` : `<p class="section-footer">Noch keine Kategorien.</p>`}
      <button class="btn block" data-newgroup style="margin-top:1.5rem">Neue Kategorie</button>
      <p class="section-footer">Am Griff ≡ ziehen: Einträge innerhalb oder in eine andere Kategorie, Kategorien samt Inhalt nach oben oder unten. Kategorienamen antippen zum Umbenennen.</p>`;

    const list = $(".edit-list", p);
    $("[data-newgroup]", p).addEventListener("click", async () => {
      const n = await askText({ title: "Neue Kategorie", placeholder: cfg.groupPlaceholder, confirmLabel: "Hinzufügen" }); if (!n) return;
      if (L.groups.includes(n)) return toast("Kategorie gibt es schon");
      L.groups.push(n); L.save(); drawEdit();
    });
    if (!list) return;
    // iOS-Muster: Minus blendet „Löschen“ ein; ein Tipp woanders bricht ab.
    const clearReveal = () => $$(".ed-item.reveal", list).forEach((x) => x.classList.remove("reveal"));
    list.addEventListener("click", async (e) => {
      const item = e.target.closest(".ed-item"); if (!item) return;
      const open = $(".ed-item.reveal", list);
      if (e.target.closest("[data-cdel],[data-gdel]")) {
        const was = item.classList.contains("reveal"); clearReveal();
        if (!was) item.classList.add("reveal");
        return;
      }
      if (open && !e.target.closest("[data-cdel-ok],[data-gdel-ok]")) { clearReveal(); return; }
      if (item.dataset.type === "c") {
        const i = +item.dataset.i;
        if (e.target.closest("[data-cdel-ok]")) {
          const name = L.items[i].name || "Eintrag";
          L.items.splice(i, 1); L.save(); haptic(); drawEdit(); toast(`„${name}“ gelöscht`);
        } else if (e.target.closest("[data-edit]")) itemSheet(tabKey, i, draw);
      } else if (item.dataset.type === "g") {
        const g = item.dataset.g, n = L.items.filter((c) => c.group === g).length;
        if (e.target.closest("[data-gdel-ok]")) {
          if (n && !(await confirmSheet({ title: `Kategorie „${g}“ löschen?`, message: `Auch ${n} Eintr${n > 1 ? "äge" : "ag"} darin ${n > 1 ? "werden" : "wird"} gelöscht.`, action: "Kategorie löschen" }))) return clearReveal();
          L.items = L.items.filter((c) => c.group !== g); L.groups = L.groups.filter((x) => x !== g);
          L.save(); haptic(); drawEdit();
        } else if (e.target.closest("[data-gren]")) {
          const nn = await askText({ title: "Kategorie umbenennen", value: g });
          if (!nn || nn === g) return;
          if (L.groups.includes(nn)) return toast("Kategorie gibt es schon");
          L.groups = L.groups.map((x) => (x === g ? nn : x)); L.items.forEach((c) => { if (c.group === g) c.group = nn; });
          L.save(); drawEdit();
        }
      }
    });
    enableReorder(list, (els) => {
      let g = null; const ni = [], ng = [];
      els.forEach((el) => {
        if (el.dataset.type === "g") { g = el.dataset.g; ng.push(g); }
        else if (el.dataset.type === "c") { const c = L.items[+el.dataset.i]; c.group = g; ni.push(c); }
      });
      L.items = ni; L.groups = ng; L.save(); drawEdit();
    });
  };
  draw();
}
RENDER.nummern = (p) => renderCatList(p, "nummern");
RENDER.codes = (p) => renderCatList(p, "codes");

function itemSheet(tabKey, index, refresh) {
  const cfg = LIST_CFG[tabKey], L = LISTS[tabKey], isNew = index == null;
  const blank = { group: L.groups.includes(cfg.defaultGroup) ? cfg.defaultGroup : (L.groups[0] || null) };
  cfg.fields.forEach((f) => (blank[f.k] = ""));
  const c = isNew ? blank : { ...L.items[index] };
  const groupCell = (g, sel) => `<div class="cell tappable" data-g="${esc(g)}"><div class="grow t">${esc(g)}</div><span class="tick" style="color:var(--blue);font-weight:700;${sel ? "" : "opacity:0"}">✓</span></div>`;
  openSheet({
    title: isNew ? cfg.newTitle : cfg.editTitle,
    confirmLabel: "Sichern",
    onConfirm: () => {
      const [a, b] = cfg.fields;
      if (!String(c[a.k]).trim() && !String(c[b.k]).trim()) { toast(`${a.label} oder ${b.label} eingeben`); return false; }
      if (!c.group) { toast("Bitte eine Kategorie wählen"); return false; }
      if (isNew) L.items.push(c); else L.items[index] = c;
      L.save(); refresh(); toast("Gespeichert");
    },
    build: (body, api) => {
      body.innerHTML = `
        <div class="section-header">Kategorie</div>
        <div class="group" data-grplist>${L.groups.map((g) => groupCell(g, g === c.group)).join("")}
          <div class="cell tappable" data-g="__new"><div class="grow t" style="color:var(--blue)">Neue Kategorie …</div></div></div>
        <div class="section-header">${esc(cfg.sectionLabel)}</div>
        <div class="group">${cfg.fields.map((f) => `
          <div class="field"><label>${esc(f.label)}</label><input data-f="${f.k}" type="${f.type || "text"}" ${f.type === "tel" ? 'inputmode="tel"' : ""} placeholder="${esc(f.ph)}" value="${esc(c[f.k])}" autocomplete="off" ${f.mono ? 'style="font-family:ui-monospace,Menlo,monospace"' : ""}></div>`).join("")}
        </div>
        ${isNew ? "" : `<button class="btn tinted-red block" data-del style="margin-top:1.5rem">${esc(cfg.deleteLabel)}</button>`}`;
      const glist = $("[data-grplist]", body);
      const mark = () => $$(".cell[data-g]", glist).forEach((x) => { const t = $(".tick", x); if (t) t.style.opacity = x.dataset.g === c.group ? 1 : 0; });
      glist.addEventListener("click", async (e) => {
        const x = e.target.closest(".cell[data-g]"); if (!x) return;
        if (x.dataset.g === "__new") {
          const n = await askText({ title: "Neue Kategorie", placeholder: cfg.groupPlaceholder, confirmLabel: "Hinzufügen" }); if (!n) return;
          if (!L.groups.includes(n)) { L.groups.push(n); L.save(); x.before(h(groupCell(n, true))); }
          c.group = n; mark(); return;
        }
        c.group = x.dataset.g; mark();
      });
      $$("input[data-f]", body).forEach((inp) => inp.addEventListener("input", (e) => (c[inp.dataset.f] = e.target.value)));
      $("[data-del]", body)?.addEventListener("click", async () => {
        if (!(await confirmSheet({ title: `„${L.items[index].name || "Eintrag"}“ löschen?`, action: cfg.deleteLabel }))) return;
        L.items.splice(index, 1); L.save(); refresh(); api.close();
      });
    },
  });
}

/* Drag & Drop wie in iOS-Listen: Zeile folgt 1:1 dem Finger (Griff-Versatz bleibt),
   die anderen weichen aus, beim Loslassen federt sie in ihren Platz. */
function enableReorder(list, onCommit) {
  list.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".handle"); if (!handle) return;
    e.preventDefault();
    const item = handle.closest(".ed-item"), isGroup = item.dataset.type === "g";
    const items = $$(".ed-item", list);
    let units;
    if (isGroup) { units = []; items.forEach((it) => { if (it.dataset.type === "g") units.push({ els: [it] }); else units[units.length - 1].els.push(it); }); }
    else units = items.map((it) => ({ els: [it] }));
    units.forEach((u) => {
      const a = u.els[0].getBoundingClientRect(), b = u.els[u.els.length - 1].getBoundingClientRect();
      u.top = a.top + scrollY; u.h = b.bottom - a.top;
    });
    const d = units.find((u) => u.els.includes(item));
    const others = units.filter((u) => u !== d), base = units[0].top;
    const startDocY = e.clientY + scrollY;
    let lastClientY = e.clientY, dy = 0, target = -1, seq = units, raf = 0;
    handle.setPointerCapture(e.pointerId);
    d.els.forEach((el) => el.classList.add("lifted"));
    others.forEach((u) => u.els.forEach((el) => el.classList.add("shifting")));
    haptic();

    const layout = () => {
      const center = d.top + d.h / 2 + dy;
      let t = others.filter((u) => u.top + u.h / 2 < center).length;
      if (!isGroup) t = Math.max(1, t); // Kontakte immer unter einer Kategorie
      if (t !== target) {
        if (target !== -1) haptic();
        target = t; seq = others.slice(); seq.splice(t, 0, d);
        let y = base; seq.forEach((u) => { u.newTop = y; y += u.h; });
        others.forEach((u) => { const s = u.newTop - u.top; u.els.forEach((el) => (el.style.transform = s ? `translateY(${s}px)` : "")); });
      }
      d.els.forEach((el) => (el.style.transform = `translateY(${dy}px) scale(1.02)`));
    };
    const autoScroll = () => {
      const edge = 90, bottomEdge = innerHeight - (parseFloat(getComputedStyle(document.documentElement).fontSize) * 3.25) - edge;
      let v = 0;
      if (lastClientY < edge + 40) v = -Math.ceil((edge + 40 - lastClientY) / 8);
      else if (lastClientY > bottomEdge) v = Math.ceil((lastClientY - bottomEdge) / 8);
      if (v) { scrollBy(0, v); dy = lastClientY + scrollY - startDocY; layout(); }
      raf = requestAnimationFrame(autoScroll);
    };
    raf = requestAnimationFrame(autoScroll);
    layout();

    const move = (ev) => { if (ev.pointerId !== e.pointerId) return; lastClientY = ev.clientY; dy = ev.clientY + scrollY - startDocY; layout(); };
    const up = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      cancelAnimationFrame(raf);
      handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); handle.removeEventListener("pointercancel", up);
      const to = d.newTop - d.top;
      spring({ from: dy, to, damping: 1, response: 0.28,
        onUpdate: (y) => d.els.forEach((el) => (el.style.transform = `translateY(${y}px) scale(${1 + 0.02 * Math.min(1, Math.abs(y - to) / 20)})`)),
        onDone: () => onCommit(seq.flatMap((u) => u.els)) });
    };
    handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up); handle.addEventListener("pointercancel", up);
  });
}

/* =====================================================================
   TOOLS: Puls/AF-Tapper + CPR-Metronom
   ===================================================================== */
RENDER.tools = (p) => {
  setNav(rootNav());
  p.innerHTML = `<h1 class="large-title">Tools</h1>`;
  const body = h(`<div></div>`);
  p.append(segmented([["tapper", "Puls / AF zählen"], ["cpr", "CPR-Metronom"]], ui.toolsSeg, (k) => {
    ui.toolsSeg = k; cleanupTools(); swapBody(body, k === "tapper" ? renderTapper : renderCpr);
  }), body);
  (ui.toolsSeg === "tapper" ? renderTapper : renderCpr)(body);
};

const tapCfg = {
  puls: { label: "Puls", unit: "Schläge / min", min: 10, timeout: 3000, cls: "puls" },
  af: { label: "Atemfrequenz", unit: "Atemzüge / min", min: 4, timeout: 15000, cls: "af" },
};
const taps = { puls: [], af: [] };
function tapResult(kind) {
  const arr = taps[kind], cfg = tapCfg[kind];
  if (arr.length < cfg.min) return null;
  const rate = Math.round(((arr.length - 1) * 60000) / (arr[arr.length - 1] - arr[0]));
  const iv = arr.slice(1).map((t, i) => t - arr[i]);
  const mean = iv.reduce((a, b) => a + b, 0) / iv.length;
  const sd = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / iv.length);
  return { rate, irregular: kind === "puls" && sd / mean > 0.15 };
}
function renderTapper(el) {
  el.innerHTML = `
    <div class="tapgrid">${["puls", "af"].map((k) => `
      <div class="tapper" id="tp-${k}">
        <div class="kind">${tapCfg[k].label}</div>
        <div class="num">–</div>
        <div class="unit">${tapCfg[k].unit}</div>
        <button class="tapbtn ${tapCfg[k].cls}" data-kind="${k}" aria-label="${tapCfg[k].label} tippen">TAP<span class="ring"></span></button>
        <div class="dots">${"<i></i>".repeat(tapCfg[k].min)}</div>
        <div class="info"></div>
        <button class="linkbtn" data-reset="${k}">Neu messen</button>
      </div>`).join("")}</div>
    <p class="section-footer" style="margin-top:1rem">Bei jedem gefühlten Pulsschlag bzw. jeder Einatmung tippen – Puls mind. ${tapCfg.puls.min}×, AF mind. ${tapCfg.af.min}×. Je länger, desto genauer. Nach ${tapCfg.puls.timeout / 1000} s (Puls) bzw. ${tapCfg.af.timeout / 1000} s (AF) Pause beginnt automatisch eine neue Messung.</p>`;
  const update = (k) => {
    const box = $("#tp-" + k, el), cfg = tapCfg[k], r = tapResult(k), n = taps[k].length;
    $(".num", box).textContent = r ? r.rate : "–";
    $$(".dots i", box).forEach((d, i) => d.classList.toggle("on", i < n));
    $(".dots", box).classList.toggle("done", n >= cfg.min);
    $(".info", box).innerHTML = n === 0 ? "Bereit" : n < cfg.min ? `noch ${cfg.min - n}×` : `${n} Taps${r.irregular ? " · <b>unregelmäßig?</b>" : ""}`;
  };
  $$(".tapbtn", el).forEach((b) => {
    const k = b.dataset.kind, ring = $(".ring", b);
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const now = performance.now(), arr = taps[k];
      if (arr.length && now - arr[arr.length - 1] > tapCfg[k].timeout) arr.length = 0;
      arr.push(now);
      b.classList.add("down"); haptic();
      ring.classList.remove("go"); void ring.offsetWidth; ring.classList.add("go");
      update(k);
    });
    const up = () => b.classList.remove("down");
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up);
  });
  $$("[data-reset]", el).forEach((b) => b.addEventListener("click", () => { taps[b.dataset.reset].length = 0; update(b.dataset.reset); }));
  update("puls"); update("af");
}

/* ---- CPR-Metronom (Web Audio, Lookahead-Scheduler) ---- */
const cpr = {
  bpm: store.get("cprBpm", 110), mode: store.get("cprMode", "30:2"),
  running: false, ctx: null, nextTime: 0, count: 0, timer: null, raf: null, queue: [],
  startedAt: 0, cycleStart: 0, adrenAt: null, shocks: 0, lastVent: 0, wakeLock: null, clock: null,
};
const MODES = {
  "30:2": { comp: 30, t: "30 : 2", s: "Erwachsene" },
  "15:2": { comp: 15, t: "15 : 2", s: "Kinder" },
  kont: { comp: 0, t: "Kontinuierlich", s: "Atemweg gesichert · 10 Beatmungen/min" },
};
const VENT_PAUSE = 4;
function beep(time, freq, dur, vol = 0.6) {
  const o = cpr.ctx.createOscillator(), g = cpr.ctx.createGain();
  o.frequency.value = freq; o.type = "square";
  g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  o.connect(g).connect(cpr.ctx.destination); o.start(time); o.stop(time + dur + 0.02);
}
function scheduler() {
  const ctx = cpr.ctx, interval = 60 / cpr.bpm, m = MODES[cpr.mode];
  while (cpr.nextTime < ctx.currentTime + 0.12) {
    const t = cpr.nextTime;
    if (m.comp && cpr.count === m.comp) {
      beep(t, 440, 0.35, 0.5); beep(t + VENT_PAUSE / 2, 440, 0.35, 0.5);
      cpr.queue.push({ t, type: "vent" }); cpr.count = 0; cpr.nextTime = t + VENT_PAUSE; continue;
    }
    cpr.count++;
    beep(t, cpr.count === 1 && m.comp ? 1320 : 1000, 0.05);
    cpr.queue.push({ t, type: "beat", n: cpr.count });
    if (!m.comp && t - cpr.lastVent >= 6) { cpr.lastVent = t; beep(t + interval / 2, 440, 0.3, 0.4); cpr.queue.push({ t: t + interval / 2, type: "ventc" }); }
    cpr.nextTime += interval;
  }
}
function drawLoop() {
  const c = $("#cprCircle");
  if (!c || !cpr.ctx) return;
  while (cpr.queue.length && cpr.queue[0].t <= cpr.ctx.currentTime) {
    const ev = cpr.queue.shift();
    if (ev.type === "beat") {
      c.className = "cpr-circle beat"; $(".big", c).textContent = MODES[cpr.mode].comp ? ev.n : "●"; $(".lbl", c).textContent = "Drücken";
      setTimeout(() => c.classList.remove("beat"), 110);
    } else if (ev.type === "vent") { c.className = "cpr-circle vent"; $(".big", c).textContent = "2×"; $(".lbl", c).textContent = "Beatmen"; }
    else { c.classList.add("vent"); $(".lbl", c).textContent = "Beatmung"; setTimeout(() => c.classList.remove("vent"), 400); }
  }
  cpr.raf = requestAnimationFrame(drawLoop);
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function updateClocks() {
  const now = Date.now(), tot = $("#tTotal"); if (!tot) return;
  if (cpr.startedAt) tot.textContent = fmt((now - cpr.startedAt) / 1000);
  if (cpr.cycleStart) {
    const left = 120 - (now - cpr.cycleStart) / 1000;
    $("#tCycle").textContent = left > 0 ? fmt(left) : "Analyse";
    $("#tCycle").parentElement.classList.toggle("alert", left <= 10);
  }
  if (cpr.adrenAt) { const s = (now - cpr.adrenAt) / 1000; $("#tAdren").textContent = fmt(s); $("#tAdren").parentElement.classList.toggle("alert", s >= 180); }
}
async function cprStart() {
  cpr.ctx = cpr.ctx || new (window.AudioContext || window.webkitAudioContext)();
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
  await cpr.ctx.resume();
  cpr.running = true; cpr.count = 0; cpr.queue = [];
  cpr.nextTime = cpr.ctx.currentTime + 0.1; cpr.lastVent = cpr.nextTime;
  if (!cpr.startedAt) cpr.startedAt = Date.now();
  if (!cpr.cycleStart) cpr.cycleStart = Date.now();
  cpr.timer = setInterval(scheduler, 25); scheduler();
  cancelAnimationFrame(cpr.raf); cpr.raf = requestAnimationFrame(drawLoop);
  try { cpr.wakeLock = await navigator.wakeLock?.request("screen"); } catch {}
}
function cprStop() {
  cpr.running = false; clearInterval(cpr.timer); cancelAnimationFrame(cpr.raf);
  try { cpr.wakeLock?.release(); } catch {} cpr.wakeLock = null;
}
function cleanupTools() {
  if (cpr.running && !(ui.tab === "tools" && ui.toolsSeg === "cpr" && $("#cprCircle"))) cprStop();
  if (!(ui.tab === "tools" && ui.toolsSeg === "cpr")) { clearInterval(cpr.clock); cpr.clock = null; }
}
function renderCpr(el) {
  el.innerHTML = `
    <div class="cpr-wrap"><div id="cprCircle" class="cpr-circle"><div><div class="big">${cpr.bpm}</div><div class="lbl">pro Minute</div></div></div></div>
    <button id="cprToggle" class="btn ${cpr.running ? "tinted-red" : "red"} block" style="font-size:1.25rem;padding:1rem">${cpr.running ? "Stopp" : "Start"}</button>
    <div class="section-header">Tempo</div>
    <div class="group"><div class="cell"><div class="grow t"><span id="bpmV">${cpr.bpm}</span> / min</div>
      <div class="stepper"><button data-d="-5" aria-label="Langsamer">−</button><button data-d="5" aria-label="Schneller">+</button></div></div></div>
    <p class="section-footer">Leitlinie: 100–120/min, Drucktiefe 5–6 cm (Kinder ⅓ des Thorax).</p>
    <div class="section-header">Modus</div>
    <div class="group" id="modes">${Object.entries(MODES).map(([k, m]) => `
      <div class="cell tappable chk ${k === cpr.mode ? "sel" : ""}" data-m="${k}"><div class="grow"><div class="t">${m.t}</div><div class="s">${m.s}</div></div><span class="tick">✓</span></div>`).join("")}</div>
    <div class="section-header">Timer</div>
    <div class="timers">
      <div class="timer"><div class="tl">Gesamt</div><div class="tv" id="tTotal">0:00</div></div>
      <div class="timer"><div class="tl">2-min-Zyklus</div><div class="tv" id="tCycle">2:00</div></div>
      <div class="timer"><div class="tl">Seit Adrenalin</div><div class="tv" id="tAdren">–</div></div>
      <div class="timer"><div class="tl">Schocks</div><div class="tv" id="tShock">${cpr.shocks}</div></div>
    </div>
    <div class="btn-row" style="margin-top:.625rem">
      <button class="btn" id="bAdren">Adrenalin</button>
      <button class="btn" id="bShock">Schock +1</button>
      <button class="btn" id="bCycle">Neuer Zyklus</button>
      <button class="btn tinted-red" id="bReset">Zurücksetzen</button>
    </div>
    <p class="section-footer">Ton läuft auch im Stumm-Modus (iOS 17+), das Display bleibt an. Der Adrenalin-Timer wird nach 3 min rot.</p>`;
  $("#cprToggle", el).addEventListener("click", async () => {
    haptic();
    if (cpr.running) cprStop(); else await cprStart();
    const b = $("#cprToggle", el); b.textContent = cpr.running ? "Stopp" : "Start"; b.className = `btn ${cpr.running ? "tinted-red" : "red"} block`;
    if (!cpr.running) { const c = $("#cprCircle", el); c.className = "cpr-circle"; $(".big", c).textContent = cpr.bpm; $(".lbl", c).textContent = "pro Minute"; }
  });
  $$(".stepper button", el).forEach((b) => b.addEventListener("click", () => {
    cpr.bpm = Math.max(100, Math.min(120, cpr.bpm + Number(b.dataset.d)));
    store.set("cprBpm", cpr.bpm); $("#bpmV", el).textContent = cpr.bpm;
    if (!cpr.running) $("#cprCircle .big", el).textContent = cpr.bpm;
  }));
  $$("#modes .cell", el).forEach((c) => c.addEventListener("click", () => {
    cpr.mode = c.dataset.m; cpr.count = 0; store.set("cprMode", cpr.mode);
    $$("#modes .cell", el).forEach((x) => x.classList.toggle("sel", x === c));
  }));
  $("#bCycle", el).addEventListener("click", () => { cpr.cycleStart = Date.now(); updateClocks(); });
  $("#bAdren", el).addEventListener("click", () => { cpr.adrenAt = Date.now(); haptic(); updateClocks(); toast("Adrenalin-Zeit gesetzt"); });
  $("#bShock", el).addEventListener("click", () => { cpr.shocks++; haptic(); $("#tShock", el).textContent = cpr.shocks; cpr.cycleStart = Date.now(); updateClocks(); });
  $("#bReset", el).addEventListener("click", async () => {
    if (!(await confirmSheet({ title: "Alle CPR-Timer zurücksetzen?", message: "Gesamtzeit, Zyklus, Adrenalin und Schocks werden auf null gesetzt.", action: "Zurücksetzen" }))) return;
    cprStop(); Object.assign(cpr, { startedAt: 0, cycleStart: 0, adrenAt: null, shocks: 0 }); renderCpr(el);
  });
  clearInterval(cpr.clock); cpr.clock = setInterval(updateClocks, 250); updateClocks();
  if (cpr.running) { cancelAnimationFrame(cpr.raf); cpr.raf = requestAnimationFrame(drawLoop); }
}

/* =====================================================================
   PZC + IVENA
   ===================================================================== */
const rmiLookup = new Map(RMI.flatMap(([cat, items]) => items.map(([c, l]) => [c, { label: l, cat }])));
const pzcAgeStr = () => pzc.infant ? "00" : (pzc.age === "" || pzc.age == null) ? null : String(Math.max(0, Math.min(99, parseInt(pzc.age, 10) || 0))).padStart(2, "0");
const pzcCode = () => { const a = pzcAgeStr(); return pzc.rmi && a && pzc.urg ? `${pzc.rmi}${a}${pzc.urg}` : null; };
const savePzc = () => store.set("pzc", pzc);
const regionName = () => (IVENA_REGIONS.find(([id]) => id === config.region) || [0, "Hessen"])[1];
function ivenaUrl(code) {
  const r = `anonymous_oe%5B%5D=${config.region}`;
  return code ? `${IVENA_BASE}?si=&auswahl_ueber_pzc=1&pzc=${code}&${r}` : `${IVENA_BASE}?${r}`;
}
function rememberPzc() {
  const c = pzcCode(); if (!c) return;
  recentPzc = [c, ...recentPzc.filter((x) => x !== c)].slice(0, 6); store.set("recentPzc", recentPzc);
}

RENDER.pzc = (p) => {
  setNav(rootNav());
  p.innerHTML = `<h1 class="large-title">PZC</h1>`;
  const body = h(`<div></div>`);
  p.append(segmented([["builder", "PZC erstellen"], ["klinik", "Kliniken"]], ui.pzcSeg, (k) => {
    ui.pzcSeg = k; swapBody(body, k === "builder" ? renderPzcBuilder : renderKlinik);
  }), body);
  (ui.pzcSeg === "builder" ? renderPzcBuilder : renderKlinik)(body);
};

function pzcHeroHtml() {
  const a = pzcAgeStr(), info = pzc.rmi ? rmiLookup.get(pzc.rmi) : null;
  const part = (s, n) => (s ? esc(s) : `<span class="ph">${"–".repeat(n)}</span>`);
  return `<div class="pzc-code" aria-label="PZC">${part(pzc.rmi, 3)}<span class="gap"></span>${part(a, 2)}<span class="gap"></span>${part(pzc.urg, 1)}</div>
    <div class="pzc-parts"><span>RMI</span><span>Alter</span><span>Dr.</span></div>
    <div class="pzc-label">${info ? esc(info.label) : '<span class="muted">Rückmeldeindikation wählen</span>'}</div>`;
}

function renderPzcBuilder(el) {
  el.innerHTML = `
    <div class="card pzc-hero" id="pzcHero">${pzcHeroHtml()}</div>
    <a class="btn filled block ivena-btn" id="pIvena" target="_blank" rel="noopener" style="margin-top:.75rem;text-decoration:none">In IVENA anzeigen</a>
    <div class="btn-row" style="margin-top:.5rem"><button class="btn" id="pCopy">Kopieren</button><button class="btn" id="pClear">Leeren</button></div>
    <p class="section-footer" id="pRegion">Gebiet: ${esc(regionName())} · änderbar unter „Kliniken“</p>

    <div class="section-header">Dringlichkeit</div>
    <div class="urg">${PZC_URGENCY.map((u) => `<button class="${u.cls} ${pzc.urg === u.d ? "sel" : ""}" data-u="${u.d}"><span class="dot"></span>${u.d} · ${u.label}</button>`).join("")}</div>
    <p class="section-footer" id="urgDesc">${pzc.urg ? esc(PZC_URGENCY[pzc.urg - 1].desc) : "1 = sofort · 2 = stationär · 3 = ambulant"}</p>

    <div class="section-header">Alter</div>
    <div class="age-row">
      <input class="age-input" type="number" inputmode="numeric" id="pAge" placeholder="Jahre" min="0" max="99" value="${pzc.infant ? "" : esc(pzc.age)}" ${pzc.infant ? "disabled" : ""}>
      <button class="chip ${pzc.infant ? "sel" : ""}" id="pInfant">Säugling &lt; 1 J.</button>
    </div>

    <div id="recentWrap"></div>

    <div class="section-header">Rückmeldeindikation</div>
    <input type="search" class="search" id="pSearch" placeholder="Suchen – z. B. Stroke, 332, Hypo" style="margin-bottom:.6rem" autocomplete="off">
    <div class="group" id="rmiList"></div>
    <p class="section-footer">Codeliste: PZC Bund/Brandenburg V1.0 (2022) – IVENA zeigt die gültige Bezeichnung zur Kontrolle an. Säuglinge 0–11 Monate = Alter 00.</p>`;

  const list = $("#rmiList", el);
  const rowHtml = ([c, l]) => `<div class="cell tappable rmi ${pzc.rmi === c ? "sel" : ""}" data-rmi="${c}"><span class="code">${c}</span><span class="grow">${esc(l)}</span><span class="check">✓</span></div>`;
  const drawList = (q) => {
    q = q.trim().toLowerCase();
    if (!q) list.innerHTML = RMI.map(([cat, items]) => `<details class="cat" ${items.some(([c]) => c === pzc.rmi) ? "open" : ""}><summary class="cell tappable"><span class="grow t">${esc(cat)}</span><span class="chev">›</span></summary>${items.map(rowHtml).join("")}</details>`).join("");
    else {
      const hits = RMI.flatMap(([cat, items]) => items.filter(([c, l]) => String(c).startsWith(q) || l.toLowerCase().includes(q) || cat.toLowerCase().includes(q)));
      list.innerHTML = hits.length ? hits.map(rowHtml).join("") : `<div class="cell muted">Kein Treffer</div>`;
    }
  };
  const drawRecent = () => {
    $("#recentWrap", el).innerHTML = recentPzc.length ? `<div class="section-header">Zuletzt verwendet</div><div class="chips">${recentPzc.map((c) => `<button class="chip mono" data-recent="${c}">${c.slice(0, 3)} ${c.slice(3, 5)} ${c[5]}</button>`).join("")}</div>` : "";
    $$("[data-recent]", el).forEach((b) => b.addEventListener("click", () => {
      const c = b.dataset.recent; pzc.rmi = Number(c.slice(0, 3)); const a = c.slice(3, 5);
      pzc.infant = a === "00"; pzc.age = pzc.infant ? "" : String(Number(a)); pzc.urg = Number(c[5]);
      savePzc(); renderPzcBuilder(el); scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    }));
  };
  const refresh = () => {
    savePzc();
    $("#pzcHero", el).innerHTML = pzcHeroHtml();
    const code = pzcCode(), a = $("#pIvena", el);
    a.href = ivenaUrl(code);
    a.classList.toggle("filled", !!code);
    a.textContent = code ? "In IVENA anzeigen" : "IVENA öffnen (ohne PZC)";
    $("#pCopy", el).disabled = !code;
  };
  drawList(""); drawRecent(); refresh();

  list.addEventListener("click", (e) => {
    const r = e.target.closest("[data-rmi]"); if (!r) return;
    pzc.rmi = Number(r.dataset.rmi); haptic();
    $$(".rmi", list).forEach((x) => x.classList.toggle("sel", x === r));
    refresh(); scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
  });
  $("#pSearch", el).addEventListener("input", (e) => drawList(e.target.value));
  $$(".urg button", el).forEach((b) => b.addEventListener("click", () => {
    pzc.urg = Number(b.dataset.u); haptic();
    $$(".urg button", el).forEach((x) => x.classList.toggle("sel", x === b));
    $("#urgDesc", el).textContent = PZC_URGENCY[pzc.urg - 1].desc; refresh();
  }));
  $("#pAge", el).addEventListener("input", (e) => { pzc.age = e.target.value; refresh(); });
  $("#pInfant", el).addEventListener("click", (e) => {
    pzc.infant = !pzc.infant; e.currentTarget.classList.toggle("sel", pzc.infant);
    const a = $("#pAge", el); a.disabled = pzc.infant; a.value = pzc.infant ? "" : pzc.age; refresh();
  });
  $("#pIvena", el).addEventListener("click", () => { rememberPzc(); drawRecent(); });
  $("#pCopy", el).addEventListener("click", () => { rememberPzc(); drawRecent(); copy(pzcCode()); });
  $("#pClear", el).addEventListener("click", () => {
    Object.assign(pzc, { rmi: null, age: "", infant: false, urg: null }); savePzc(); renderPzcBuilder(el);
  });
}

function haversine(a, b, c, d) {
  const R = 6371, r = Math.PI / 180, dLat = (c - a) * r, dLon = (d - b) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
let lastPos = null;
function renderKlinik(el) {
  const code = pzcCode(), info = pzc.rmi ? rmiLookup.get(pzc.rmi) : null;
  let list = hospitals.map((x) => ({ ...x, km: lastPos ? haversine(lastPos.lat, lastPos.lon, x.lat, x.lon) : null }));
  if (lastPos) list.sort((a, b) => a.km - b.km);
  el.innerHTML = `
    <div class="group">
      <div class="cell"><div class="grow"><div class="s">Aktueller PZC</div>
        <div class="t" style="font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:1.25rem">${code ? `${code.slice(0, 3)} ${code.slice(3, 5)} ${code[5]}` : "–"}</div>
        <div class="s">${info && code ? esc(info.label) : "Kein vollständiger PZC – IVENA zeigt dann die Gebietsübersicht."}</div></div></div>
      <div class="field"><label for="kRegion">IVENA-Gebiet</label>
        <select id="kRegion">${IVENA_REGIONS.map(([id, n]) => `<option value="${id}" ${id === config.region ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
    </div>
    <a class="btn filled block ivena-btn" id="kIvena" href="${ivenaUrl(code)}" target="_blank" rel="noopener" style="margin-top:.75rem;text-decoration:none">${code ? "Aufnahmebereite Kliniken in IVENA" : "IVENA-Übersicht öffnen"}</a>
    <p class="section-footer">IVENA zeigt live, welche Klinik für diesen PZC im gewählten Gebiet aufnahmebereit ist.</p>

    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center">
      <span>Navigation${lastPos ? " · Luftlinie" : ""}</span>
      <button class="linkbtn" id="kLoc" style="padding:0;font-size:.8125rem;text-transform:none">${lastPos ? "Aktualisieren" : "Nach Entfernung sortieren"}</button>
    </div>
    <div class="group">${list.map((x) => `
      <a class="cell tappable" href="https://maps.apple.com/?daddr=${x.lat},${x.lon}&dirflg=d" target="_blank" rel="noopener" style="text-decoration:none">
        <div class="grow"><div class="t">${esc(x.name)}</div><div class="s">${esc(x.city)}</div></div>
        ${x.km != null ? `<span class="dist">${x.km.toFixed(1).replace(".", ",")} km</span>` : ""}
        <span class="round blue">${ICON.nav}</span>
      </a>`).join("")}</div>
    <p class="section-footer">Tippen startet die Navigation in Apple Karten. Kliniken änderst du in den Einstellungen.</p>`;
  $("#kRegion", el).addEventListener("change", (e) => {
    config.region = Number(e.target.value); store.set("config", config);
    $("#kIvena", el).href = ivenaUrl(code); toast("Gebiet: " + regionName());
  });
  $("#kIvena", el).addEventListener("click", () => rememberPzc());
  $("#kLoc", el).addEventListener("click", () => {
    if (!navigator.geolocation) return toast("Standort nicht verfügbar");
    toast("Standort wird bestimmt …");
    navigator.geolocation.getCurrentPosition(
      (pos) => { lastPos = { lat: pos.coords.latitude, lon: pos.coords.longitude }; renderKlinik(el); },
      () => toast("Standortfreigabe fehlt"), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });
}

/* =====================================================================
   KINDER
   ===================================================================== */
RENDER.kinder = (p) => {
  setNav(rootNav());
  const s = store.get("kidAge", { val: "", unit: "J" });
  p.innerHTML = `
    <h1 class="large-title">Kinder</h1>
    <div class="section-header">Rechner nach Alter</div>
    <div class="age-row">
      <input class="age-input" type="number" inputmode="decimal" id="kAge" placeholder="Alter" value="${esc(s.val)}">
      <div id="kUnitWrap" style="width:10rem"></div>
    </div>
    <div class="age-row" style="margin-top:.5rem">
      <input class="age-input" type="number" inputmode="decimal" id="kKg" placeholder="Gewicht in kg (optional)">
    </div>
    <div id="kOut"></div>
    <div class="section-header">Normwerte</div>
    <div class="card hscroll" style="padding:.25rem .5rem .5rem;overflow-x:auto">
      <table class="vt" id="kTable"><tr><th>Alter</th><th>HF</th><th>AF</th><th>RR sys</th><th>kg</th></tr>
        ${PEDS_TABLE.map((r, i) => `<tr data-r="${i}"><td>${r.age}</td><td>${r.hf}</td><td>${r.af}</td><td>${r.rr}</td><td>${r.kg}</td></tr>`).join("")}</table>
    </div>
    <p class="section-footer">Orientierungswerte – Trend und Gesamteindruck (pädiatrisches Beurteilungsdreieck) zählen mehr als Einzelwerte. Gewicht nach APLS, Dosierungen nach ERC 2021. Maßgeblich sind die Vorgaben des ÄLRD.</p>`;
  let unit = s.unit;
  const segEl = segmented([["M", "Monate"], ["J", "Jahre"]], unit, (k) => { unit = k; calc(); });
  segEl.style.margin = "0"; $("#kUnitWrap", p).append(segEl);
  const out = $("#kOut", p);
  const calc = () => {
    const val = parseFloat($("#kAge", p).value);
    store.set("kidAge", { val: $("#kAge", p).value, unit });
    $$("#kTable tr", p).forEach((r) => r.classList.remove("hl"));
    if (isNaN(val)) { out.innerHTML = ""; return; }
    const years = unit === "M" ? val / 12 : val, months = unit === "M" ? val : val * 12;
    const est = months < 12 ? 0.5 * months + 4 : years <= 5 ? 2 * years + 8 : 3 * years + 7;
    const kgIn = parseFloat($("#kKg", p).value), kg = !isNaN(kgIn) && kgIn > 0 ? kgIn : est;
    const r = (x, d = 0) => x.toLocaleString("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d });
    const ri = months < 1 ? 0 : months < 12 ? 1 : years < 3 ? 2 : years < 6 ? 3 : years <= 12 ? 4 : 5, row = PEDS_TABLE[ri];
    $(`#kTable tr[data-r="${ri}"]`, p).classList.add("hl");
    const items = [
      ["Gewicht", `${r(kg, 1)} kg${isNaN(kgIn) ? " (geschätzt)" : ""}`],
      ["Herzfrequenz", row.hf + " /min"], ["Atemfrequenz", row.af + " /min"], ["RR systolisch", row.rr + " mmHg"],
      ...(years >= 1 && years <= 10 ? [["RR sys Untergrenze", `${Math.round(70 + 2 * years)} mmHg`]] : []),
      ["Tubus ID", years >= 1 ? `${r(years / 4 + 3.5, 1)} mit / ${r(years / 4 + 4, 1)} ohne Cuff` : "3,0–3,5 mit Cuff"],
    ];
    const drugs = [
      ["Defibrillation 4 J/kg", `${Math.round(Math.min(4 * kg, 360))} J`],
      ["Adrenalin 10 µg/kg", `${r(Math.min(0.01 * kg, 1), 2)} mg`],
      ["Amiodaron 5 mg/kg", `${Math.round(Math.min(5 * kg, 300))} mg`],
      ["Volumenbolus 10 ml/kg", `${Math.round(10 * kg)} ml`],
      ["Glukose 0,2 g/kg", `${r(2 * kg)} ml G10`],
    ];
    const g = (arr) => `<div class="group kv">${arr.map(([k, v]) => `<div class="cell"><div class="grow t">${k}</div><div class="val">${v}</div></div>`).join("")}</div>`;
    out.innerHTML = `<div class="section-header">Werte</div>${g(items)}<div class="section-header">Reanimation · 15 : 2</div>${g(drugs)}`;
  };
  $("#kAge", p).addEventListener("input", calc);
  $("#kKg", p).addEventListener("input", calc);
  calc();
};

/* =====================================================================
   SCHEMATA + RECHNER
   ===================================================================== */
const CALCS = [
  { id: "gcs", title: "Glasgow Coma Scale", sub: "GCS 3–15", type: "points", groups: [
    ["Augen öffnen", [[4, "spontan"], [3, "auf Ansprache"], [2, "auf Schmerzreiz"], [1, "keine Reaktion"]]],
    ["Verbale Reaktion", [[5, "orientiert"], [4, "verwirrt"], [3, "inadäquate Worte"], [2, "unverständliche Laute"], [1, "keine"]]],
    ["Motorische Reaktion", [[6, "befolgt Aufforderungen"], [5, "gezielte Schmerzabwehr"], [4, "ungezielte Abwehr / Wegziehen"], [3, "Beugesynergismen"], [2, "Strecksynergismen"], [1, "keine"]]],
  ], interpret: (s) => (s <= 8 ? "Schwere Bewusstseinsstörung – Atemwegssicherung erwägen" : s <= 12 ? "Mittelschwere Bewusstseinsstörung" : "Leichte bzw. keine Störung") },
  { id: "apgar", title: "APGAR", sub: "Neugeborene · nach 1, 5, 10 min", type: "points", groups: [
    ["Atmung", [[0, "keine"], [1, "unregelmäßig, flach"], [2, "regelmäßig, schreit"]]],
    ["Puls", [[0, "kein"], [1, "< 100 /min"], [2, "> 100 /min"]]],
    ["Grundtonus", [[0, "schlaff"], [1, "träge Flexion"], [2, "aktive Bewegung"]]],
    ["Aussehen", [[0, "blau / blass"], [1, "Stamm rosig, Extremitäten blau"], [2, "rosig"]]],
    ["Reflexe", [[0, "keine"], [1, "Grimassieren"], [2, "Schreien, Husten, Niesen"]]],
  ], interpret: (s) => (s >= 7 ? "Lebensfrisch" : s >= 4 ? "Mäßige Depression" : "Schwere Depression") },
  { id: "qsofa", title: "qSOFA", sub: "Sepsis-Screening", type: "check", items: [
    "Atemfrequenz ≥ 22 /min", "RR systolisch ≤ 100 mmHg", "Veränderter Bewusstseinszustand (GCS < 15)",
  ], interpret: (n) => (n >= 2 ? "Erhöhtes Risiko – bei Infektverdacht an Sepsis denken (PZC 373)" : "qSOFA negativ – Sepsis damit nicht ausgeschlossen") },
  { id: "fast4d", title: "FAST-4D", sub: "Schlaganfall · Konzept Mittelhessen", type: "check", items: [
    "Face – Gesichtslähmung", "Arm – Absinken / Pronation", "Speech – Sprach-/Sprechstörung",
    "Doppelbilder", "Gesichtsfelddefekt", "Dreh-/Schwankschwindel", "Dysmetrie / Ataxie",
  ], extra: "Time: Symptombeginn bzw. „last seen well“ dokumentieren.",
  interpret: (n) => (n === 0 ? "Kein Symptom ausgewählt" : n >= 4 ? "≥ 4: ggf. direkt endovaskuläres Zentrum (Thrombektomie)" : "Stroke-Verdacht → Stroke Unit (≤ 24 h nächste, > 24 h nächste freie)") },
  { id: "nexus", title: "NEXUS", sub: "HWS-Verletzung unwahrscheinlich?", type: "check", items: [
    "Kein Druckschmerz über der HWS-Mittellinie", "Kein fokal-neurologisches Defizit", "Normale Vigilanz",
    "Keine Intoxikation", "Keine ablenkende, schmerzhafte Verletzung",
  ], interpret: (n, t) => (n === t ? "Alle erfüllt – HWS-Verletzung unwahrscheinlich" : `${t - n} nicht erfüllt – HWS-Verletzung möglich`) },
  { id: "skips", title: "S-KIPS", sub: "Indikation Beckenschlinge", type: "check", items: [
    "Schock (hämodynamisch instabil) – Pflicht", "Kinematik passend", "Inspektion auffällig", "Palpation auffällig", "Schmerzen im Becken",
  ], interpret: (n, t, sel) => (sel[0] && n >= 2 ? "Indikation zur Beckenschlinge gegeben" : !sel[0] ? "Kein Schock – keine Indikation nach S-KIPS" : "Schock, aber noch kein weiteres Kriterium") },
  { id: "si", title: "Schockindex", sub: "HF ÷ RR systolisch", type: "si" },
];

RENDER.schema = (p) => {
  setNav(rootNav());
  p.innerHTML = `<h1 class="large-title">Schemata</h1>`;
  const body = h(`<div></div>`);
  const draw = (b) => {
    b.innerHTML = ui.schemaSeg === "schemata"
      ? `<div class="group">${SCHEMES.map((s) => `<div class="cell tappable" data-s="${s.id}"><div class="letter sm">${esc(s.title.replace(/[^A-Za-z0-9]/g, "").slice(0, 5))}</div><div class="grow"><div class="t">${esc(s.title)}</div><div class="s">${esc(s.sub)}</div></div><span class="chev">›</span></div>`).join("")}</div>`
      : `<div class="group">${CALCS.map((c) => `<div class="cell tappable" data-c="${c.id}"><div class="grow"><div class="t">${esc(c.title)}</div><div class="s">${esc(c.sub)}</div></div><span class="chev">›</span></div>`).join("")}</div>`;
    $$("[data-s]", b).forEach((r) => r.addEventListener("click", () => {
      const s = SCHEMES.find((x) => x.id === r.dataset.s);
      pushPage((pg) => renderSchemeDetail(pg, s), detailNav(s.title, "Schemata"));
    }));
    $$("[data-c]", b).forEach((r) => r.addEventListener("click", () => {
      const c = CALCS.find((x) => x.id === r.dataset.c);
      pushPage((pg) => renderCalc(pg, c), detailNav(c.title, "Rechner"));
    }));
  };
  p.append(segmented([["schemata", "Schemata"], ["rechner", "Rechner"]], ui.schemaSeg, (k) => { ui.schemaSeg = k; swapBody(body, draw); }), body);
  draw(body);
};

function renderSchemeDetail(p, s) {
  p.innerHTML = `<h1 class="large-title">${esc(s.title)}</h1><p class="subtitle">${esc(s.sub)}</p>
    <div class="group">${s.items.map(([l, t, d]) => `<div class="cell scheme-item"><div class="letter">${esc(l)}</div><div class="grow"><div class="t">${esc(t)}</div><div class="s">${esc(d)}</div></div></div>`).join("")}</div>
    ${s.note ? `<div class="notice"><span class="ico">ⓘ</span><span>${esc(s.note)}</span></div>` : ""}`;
}

function renderCalc(p, c) {
  const head = `<h1 class="large-title">${esc(c.title)}</h1><p class="subtitle">${esc(c.sub)}</p>`;
  if (c.type === "si") {
    p.innerHTML = head + `<div class="score-bar"><div class="st" id="cTxt">HF und RR eingeben</div><div class="sv" id="cV">–</div></div>
      <div class="group"><div class="field"><label for="siHf">HF</label><input id="siHf" type="number" inputmode="numeric" placeholder="/min"></div>
      <div class="field"><label for="siRr">RR sys</label><input id="siRr" type="number" inputmode="numeric" placeholder="mmHg"></div></div>
      <p class="section-footer">SI &gt; 1 spricht für relevanten Volumenmangel bzw. Schock. Bei Kindern, Älteren und unter Betablockern eingeschränkt aussagekräftig.</p>`;
    const calc = () => {
      const hf = +$("#siHf", p).value, rr = +$("#siRr", p).value;
      if (!hf || !rr) { $("#cV", p).textContent = "–"; $("#cTxt", p).textContent = "HF und RR eingeben"; return; }
      const si = hf / rr; $("#cV", p).textContent = si.toFixed(2).replace(".", ",");
      $("#cTxt", p).textContent = si > 1 ? "Schock wahrscheinlich" : si >= 0.7 ? "Grenzwertig" : "Normal";
    };
    $("#siHf", p).addEventListener("input", calc); $("#siRr", p).addEventListener("input", calc);
    return;
  }
  if (c.type === "points") {
    const sel = c.groups.map(() => null);
    p.innerHTML = head + `<div class="score-bar"><div class="st" id="cTxt"></div><div class="sv" id="cV">–</div></div>` +
      c.groups.map(([g, opts], gi) => `<div class="section-header">${esc(g)}</div><div class="group">${opts.map(([pt, l]) => `<div class="cell tappable opt" data-g="${gi}" data-p="${pt}"><span class="pts">${pt}</span><span class="grow t">${esc(l)}</span><span class="tick">✓</span></div>`).join("")}</div>`).join("") +
      `<button class="btn block" id="cReset" style="margin-top:1.5rem">Zurücksetzen</button>`;
    const upd = () => {
      const chosen = sel.filter((x) => x != null).length, sum = sel.reduce((a, b) => a + (b ?? 0), 0);
      $("#cV", p).textContent = chosen ? sum : "–";
      $("#cTxt", p).textContent = chosen === sel.length ? c.interpret(sum) : `${chosen} von ${sel.length} ausgewählt`;
    };
    $$(".opt", p).forEach((o) => o.addEventListener("click", () => {
      const g = +o.dataset.g; sel[g] = +o.dataset.p; haptic();
      $$(`.opt[data-g="${g}"]`, p).forEach((x) => x.classList.toggle("sel", x === o)); upd();
    }));
    $("#cReset", p).addEventListener("click", () => { sel.fill(null); $$(".opt", p).forEach((x) => x.classList.remove("sel")); upd(); scrollTo({ top: 0, behavior: "smooth" }); });
    return upd();
  }
  const sel = c.items.map(() => false);
  p.innerHTML = head + `<div class="score-bar"><div class="st" id="cTxt"></div><div class="sv" id="cV">0</div></div>
    <div class="group">${c.items.map((it, i) => `<div class="cell tappable chk" data-i="${i}"><span class="box">✓</span><span class="grow t">${esc(it)}</span></div>`).join("")}</div>
    ${c.extra ? `<p class="section-footer">${esc(c.extra)}</p>` : ""}
    <button class="btn block" id="cReset" style="margin-top:1.5rem">Zurücksetzen</button>`;
  const upd = () => { const n = sel.filter(Boolean).length; $("#cV", p).textContent = n; $("#cTxt", p).textContent = c.interpret(n, sel.length, sel); };
  $$(".chk", p).forEach((o) => o.addEventListener("click", () => { sel[+o.dataset.i] = !sel[+o.dataset.i]; o.classList.toggle("sel"); haptic(); upd(); }));
  $("#cReset", p).addEventListener("click", () => { sel.fill(false); $$(".chk", p).forEach((x) => x.classList.remove("sel")); upd(); });
  upd();
}

/* =====================================================================
   EINSTELLUNGEN (Sheet)
   ===================================================================== */
function openSettings() {
  openSheet({
    title: "Einstellungen",
    build: (body) => {
      const draw = () => {
        body.innerHTML = `
          <div class="section-header">IVENA</div>
          <div class="group"><div class="field"><label for="sRegion">Gebiet</label>
            <select id="sRegion">${IVENA_REGIONS.map(([id, n]) => `<option value="${id}" ${id === config.region ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div></div>
          <p class="section-footer">Wird beim Öffnen von IVENA vorausgewählt.</p>
          <div class="section-header">Darstellung</div>
          <div id="sTheme"></div>
          <div class="section-header">Kliniken für Navigation</div>
          <div class="group" id="sHosp">${hospitals.map((x, i) => `<div class="cell tappable" data-h="${i}"><div class="grow"><div class="t">${esc(x.name || "Ohne Namen")}</div><div class="s">${esc(x.city)}</div></div><span class="chev">›</span></div>`).join("")}
            <div class="cell tappable" data-h="new"><div class="grow t" style="color:var(--blue)">Klinik hinzufügen …</div></div></div>
          <div class="section-header">Mit Kolleg:innen teilen</div>
          <div class="group">
            <div class="cell tappable" id="sExp"><div class="grow t" style="color:var(--blue)">Nummern & Kliniken kopieren</div></div>
            <div class="cell tappable" id="sExpCodes"><div class="grow t" style="color:var(--blue)">Schlüsselcodes kopieren</div></div>
            <div class="cell tappable" id="sImp"><div class="grow t" style="color:var(--blue)">Aus Zwischenablage einfügen</div></div>
          </div>
          <p class="section-footer">Kopierte Daten z. B. per Messenger schicken – der Empfänger fügt sie hier ein. Schlüsselcodes werden getrennt geteilt, damit sie nicht versehentlich mitgehen.</p>
          <div class="group" style="margin-top:1.5rem"><div class="cell tappable" id="sReset"><div class="grow t" style="color:var(--red)">Alles zurücksetzen</div></div></div>
          <p class="disclaimer">RD Pocket ist eine private Merkhilfe und kein Medizinprodukt. Alle Angaben ohne Gewähr – maßgeblich sind die SOPs und Vorgaben des ÄLRD Lahn-Dill.</p>`;
        const ts = segmented([["auto", "Automatisch"], ["dark", "Dunkel"], ["light", "Hell"]], config.theme, (k) => { config.theme = k; store.set("config", config); applyTheme(); });
        ts.style.margin = "0"; $("#sTheme", body).append(ts);
        $("#sRegion", body).addEventListener("change", (e) => { config.region = Number(e.target.value); store.set("config", config); if (ui.tab === "pzc") showTab("pzc", { animate: false }); });
        $$("[data-h]", body).forEach((c) => c.addEventListener("click", () => hospitalSheet(c.dataset.h === "new" ? null : +c.dataset.h, draw)));
        $("#sExp", body).addEventListener("click", () => copy(JSON.stringify({ rdpocket: 2, contacts: LISTS.nummern.items, groups: LISTS.nummern.groups, hospitals, region: config.region })));
        $("#sExpCodes", body).addEventListener("click", () => copy(JSON.stringify({ rdpocket: 2, codes: LISTS.codes.items, codeGroups: LISTS.codes.groups })));
        $("#sImp", body).addEventListener("click", async () => {
          let txt = ""; try { txt = await navigator.clipboard.readText(); } catch {}
          if (!txt) txt = (await askText({ title: "Daten einfügen", multiline: true, placeholder: "Kopierte RD-Pocket-Daten hier einfügen", confirmLabel: "Weiter" })) || "";
          if (!txt) return;
          try {
            const d = JSON.parse(txt);
            const hasNum = Array.isArray(d.contacts), hasCodes = Array.isArray(d.codes);
            if (!d.rdpocket || (!hasNum && !hasCodes)) throw 0;
            const what = hasCodes ? "Deine Schlüsselcodes werden" : "Deine Nummern und Kliniken werden";
            if (!(await confirmSheet({ title: "Daten übernehmen?", message: `${what} durch die eingefügten Daten ersetzt.`, action: "Ersetzen" }))) return;
            if (hasNum) {
              const L = LISTS.nummern; L.items = d.contacts; L.groups = Array.isArray(d.groups) ? d.groups : [...CONTACT_GROUPS]; L.save();
              if (Array.isArray(d.hospitals)) hospitals = d.hospitals; if (d.region) config.region = d.region;
              store.set("hospitalsV2", hospitals); store.set("config", config);
            }
            if (hasCodes) { const L = LISTS.codes; L.items = d.codes; L.groups = Array.isArray(d.codeGroups) ? d.codeGroups : []; L.save(); }
            toast("Übernommen"); draw(); showTab(ui.tab, { animate: false });
          } catch { toast("Keine gültigen RD-Pocket-Daten"); }
        });
        $("#sReset", body).addEventListener("click", async () => {
          if (!(await confirmSheet({ title: "Alles zurücksetzen?", message: "Alle eigenen Nummern, Schlüsselcodes, Kliniken und Einstellungen werden gelöscht. Das lässt sich nicht rückgängig machen.", action: "Alles löschen" }))) return;
          Object.keys(localStorage).filter((k) => k.startsWith("rdp_")).forEach((k) => localStorage.removeItem(k));
          location.reload();
        });
      };
      draw();
    },
  });
}

function hospitalSheet(index, refresh) {
  const isNew = index == null;
  const x = isNew ? { name: "", city: "", lat: "", lon: "" } : { ...hospitals[index] };
  openSheet({
    title: isNew ? "Neue Klinik" : "Klinik bearbeiten",
    confirmLabel: "Sichern",
    onConfirm: () => {
      const lat = parseFloat(String(x.lat).replace(",", ".")), lon = parseFloat(String(x.lon).replace(",", "."));
      if (!x.name.trim() || isNaN(lat) || isNaN(lon)) { toast("Name und Koordinaten angeben"); return false; }
      const v = { name: x.name.trim(), city: x.city.trim(), lat, lon };
      if (isNew) hospitals.push(v); else hospitals[index] = v;
      store.set("hospitalsV2", hospitals); refresh(); if (ui.tab === "pzc" && ui.pzcSeg === "klinik") showTab("pzc", { animate: false });
    },
    build: (body, api) => {
      body.innerHTML = `
        <div class="group" style="margin-top:.5rem">
          <div class="field"><label for="hN">Name</label><input id="hN" type="text" value="${esc(x.name)}" placeholder="Klinikname"></div>
          <div class="field"><label for="hC">Ort</label><input id="hC" type="text" value="${esc(x.city)}" placeholder="Ort"></div>
          <div class="field"><label for="hLat">Breite</label><input id="hLat" type="text" inputmode="decimal" value="${esc(x.lat)}" placeholder="50,5585"></div>
          <div class="field"><label for="hLon">Länge</label><input id="hLon" type="text" inputmode="decimal" value="${esc(x.lon)}" placeholder="8,5040"></div>
        </div>
        <p class="section-footer">Koordinaten z. B. in Apple Karten: Ort lange drücken → Koordinaten kopieren.</p>
        ${isNew ? "" : `<button class="btn tinted-red block" id="hDel" style="margin-top:1.5rem">Klinik löschen</button>`}`;
      [["hN", "name"], ["hC", "city"], ["hLat", "lat"], ["hLon", "lon"]].forEach(([id, f]) => $("#" + id, body).addEventListener("input", (e) => (x[f] = e.target.value)));
      $("#hDel", body)?.addEventListener("click", async () => {
        if (!(await confirmSheet({ title: `„${hospitals[index].name}“ löschen?`, action: "Klinik löschen" }))) return;
        hospitals.splice(index, 1); store.set("hospitalsV2", hospitals); refresh(); api.close();
      });
    },
  });
}

/* =====================================================================
   Start
   ===================================================================== */
showTab(ui.tab, { animate: false });
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
