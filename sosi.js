/* =====================================================================
   Fahrzeit mit Sonder- und Wegerechten (ENTWICKLUNG) – grobe Schätzung
   ---------------------------------------------------------------------
   Grundlage: OSRM-Route (PKW) mit Zeit je Streckenabschnitt + Ampeln aus
   OpenStreetMap (signals.js). Modell:
     normal (realistisch) = OSRM-Zeit + Ampeln × Wartezeit ohne Sonderrechte
     Sonderrechte         = innerorts-Zeit × fUrban + außerorts-Zeit × fRural
                            + Ampeln × Restverzögerung, × Kalibrierfaktor
   Alle Faktoren sind Annahmen; über eingetragene echte Fahrzeiten wird ein
   persönlicher Kalibrierfaktor gelernt.
   ===================================================================== */
const SOSI = {
  urbanKmh: 55,            // Abschnitte mit geringerer OSRM-Geschwindigkeit gelten als innerorts
  fUrban: [0.65, 0.85],    // Zeitfaktor innerorts (beste … schlechteste Annahme)
  fRural: [0.85, 0.97],    // Zeitfaktor außerorts / Autobahn
  waitNormal: 15,          // s mittlere Ampel-Verzögerung ohne Sonderrechte
  waitSosi: [3, 8],        // s Restverzögerung je Ampel mit Sonderrechten
  matchM: 25,              // Ampel gilt als „auf der Route“, wenn näher als … m
  clusterM: 60,            // Ampeln innerhalb … m Strecke = eine Kreuzung
  bbox: [50.25, 7.80, 51.00, 8.95],
};
const SOSI_ROUTERS = ["https://routing.openstreetmap.de/routed-car/route/v1/driving/", "https://router.project-osrm.org/route/v1/driving/"];

let SIGNAL_GRID = null;
function signalGrid() {
  if (SIGNAL_GRID) return SIGNAL_GRID;
  const g = new Map();
  let la = 0, lo = 0;
  for (let i = 0; i < TRAFFIC_SIGNALS.length; i += 2) {
    la += TRAFFIC_SIGNALS[i]; lo += TRAFFIC_SIGNALS[i + 1];
    const lat = la / 1e5, lon = lo / 1e5, k = `${Math.floor(lat * 1000)}:${Math.floor(lon * 1000)}`;
    (g.get(k) || g.set(k, []).get(k)).push([lat, lon, i]);
  }
  return (SIGNAL_GRID = g);
}
const mDist = (a, b, c, d) => { const x = (d - b) * 71500, y = (c - a) * 111200; return Math.hypot(x, y); }; // ~50° N

/* Ampeln entlang einer Route zählen (Kreuzungen zusammengefasst). coords = [[lon, lat], …] */
function countSignals(coords) {
  const g = signalGrid(), hit = new Map(); // Ampel-Id -> Streckenposition (m)
  let along = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lo1, la1] = coords[i - 1], [lo2, la2] = coords[i];
    const seg = mDist(la1, lo1, la2, lo2), n = Math.max(1, Math.ceil(seg / 12));
    for (let s = 0; s <= n; s++) {
      const f = s / n, lat = la1 + (la2 - la1) * f, lon = lo1 + (lo2 - lo1) * f;
      const ci = Math.floor(lat * 1000), cj = Math.floor(lon * 1000);
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        for (const [sl, so, id] of g.get(`${ci + di}:${cj + dj}`) || []) {
          if (!hit.has(id) && mDist(lat, lon, sl, so) < SOSI.matchM) hit.set(id, along + seg * f);
        }
      }
    }
    along += seg;
  }
  const pos = [...hit.values()].sort((a, b) => a - b);
  let clusters = 0, last = -1e9;
  for (const p of pos) { if (p - last > SOSI.clusterM) clusters++; last = p; }
  return clusters;
}
const inBox = (lat, lon) => lat >= SOSI.bbox[0] && lat <= SOSI.bbox[2] && lon >= SOSI.bbox[1] && lon <= SOSI.bbox[3];

async function fetchRoute(from, to) {
  const q = `${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&annotations=distance,duration`;
  for (const base of SOSI_ROUTERS) {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(base + q, { signal: ctl.signal }); clearTimeout(t);
      const j = await r.json();
      if (j.code === "Ok" && j.routes?.[0]) return j.routes[0];
    } catch { /* nächster Server */ }
  }
  return null;
}
function sosiCalib() {
  const runs = store.get("sosiCal", []);
  if (runs.length < 2) return { k: 1, n: runs.length };
  const r = runs.map((x) => x.actual / x.pred).sort((a, b) => a - b), m = r[Math.floor(r.length / 2)];
  return { k: Math.min(1.6, Math.max(0.6, m)), n: runs.length };
}
/* Bestehende Schätzung an neuen Kalibrierfaktor anpassen */
function rescale(e) { const { k, n } = sosiCalib(); return { lo: (e.lo / e.k) * k, hi: (e.hi / e.k) * k, k, n }; }
/* Schätzung für eine Route */
function sosiEstimate(route) {
  let urban = 0, rural = 0;
  for (const leg of route.legs) {
    const { distance: ds, duration: ts } = leg.annotation;
    ts.forEach((t, i) => { const kmh = t > 0 ? (ds[i] / t) * 3.6 : 0; if (kmh < SOSI.urbanKmh) urban += t; else rural += t; });
  }
  const coords = route.geometry.coordinates;
  const covered = coords.every(([lo, la], i) => i % 20 || inBox(la, lo));
  const signals = covered ? countSignals(coords) : null;
  const sig = signals ?? 0;
  const { k, n } = sosiCalib();
  const lo = (urban * SOSI.fUrban[0] + rural * SOSI.fRural[0] + sig * SOSI.waitSosi[0]) * k;
  const hi = (urban * SOSI.fUrban[1] + rural * SOSI.fRural[1] + sig * SOSI.waitSosi[1]) * k;
  return {
    osrm: route.duration, km: route.distance / 1000, urbanShare: urban / (urban + rural || 1),
    signals, normal: route.duration + sig * SOSI.waitNormal, lo, hi, pred: (lo + hi) / 2 / k, k, n,
  };
}
/* Alle Kliniken: Ergebnis-Array in Reihenfolge von hospitals (null = nicht berechenbar) */
async function sosiForAll(pos, list) {
  const out = new Array(list.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      const r = await fetchRoute(pos, list[i]);
      if (r) out[i] = sosiEstimate(r);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return out;
}
