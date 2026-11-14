/* Hessenalgorithmen V4.2.1 für den Lahn-Dill-Kreis (ÄLRD), gültig ab 01.01.2026 – nachgezeichnet.
   Knoten:  { c, t, r, ra }  Schritt.  c = Farbe/Kompetenz:
              w  Standardmaßnahme NotSan (weiß)        y  invasiv, ÄLRD-Mitwirkung §4(2)2c (gelb)
              o  invasiv, lokale Vorgabe (orange)      r  rein ärztlich (rot)
              c  Kompetenzniveau RA (türkis)           b  Einstieg / Ziel / Hinweis (blau)
            r = Verweise ["M11"], ra = auch Kompetenzniveau RA
            { na: 1 }                         NA alarmieren
            { q, b: [[label, [knoten]], …] }  Entscheidung mit Zweigen (leer = weiter im Hauptpfad)
            { go: "K1", t }                   Verweis auf anderen Algorithmus
            { n: "…" }                        kleiner Hinweis im Ablauf
   Text: **fett**, \n = Zeilenumbruch */
const ALGO_K = [
  {
    id: "BA", title: "Basisalgorithmus", page: "E06",
    tags: "Basis SSSS Ersteinschätzung xABCDE EVM Monitoring Differentialdiagnostik Arbeitsdiagnose Notarztindikation",
    flow: [
      { c: "b", r: ["P5"], t: "**Scene, Safety, Situation, Support (SSSS)**\n**Ersteinschätzung**\nKontaktaufnahme, Beurteilung, Hautfarbe, GCS, Puls\nLagerung optimieren\nSauerstoff sofern indiziert" },
      { q: "Reanimationspflichtig?", b: [
        ["nein", [
          { c: "y", t: "**xABCDE**\nggf. EVM" },
          { q: "Unmittelbare vitale Gefährdung? → Zeitnah behebbar?", b: [
            ["ja", []],
            ["nein", [{ na: 1 }]],
          ] },
          { c: "w", r: ["U3"], t: "**Monitoring und Vitalparameter**\nO₂-Sättigung, Puls, Blutdruck, EKG\n(12-Kanal-EKG nach Indikation*), AF, Temperatur, ggf. BZ" },
          { c: "w", t: "**Differentialdiagnostik**\nkörperliche Untersuchung (ggf. ABCDE)\nSAMPLER(S), OPQRST\nUnterlagen, Arztbriefe, Medikamentenliste, Informationen aus dem Umfeld, Sonstiges" },
          { c: "y", t: "**Arbeitsdiagnose**" },
          { q: "Indikation für Notarzt?", b: [["ja", [{ na: 1 }]], ["nein", []]] },
          { q: "Indikation für EVM?", b: [
            ["ja", [{ c: "b", t: "**EVM-Algorithmus** (siehe K-Algorithmen)" }]],
            ["nein", [{ c: "w", t: "**Geeignete Weiterbehandlung**" }]],
          ] },
        ]],
        ["ja", [{ na: 1 }, { go: "K12", t: "Reanimation nach Algorithmus (K12 / K13)" }]],
      ] },
    ],
    info: [
      ["Mitzunehmende Unterlagen", "Elektronische Gesundheitskarte · Pflegeüberleitungsbogen · Angehörigenerreichbarkeit · Medikationsliste · Vorsorgevollmacht / Patientenverfügung · etc."],
      ["*", "12-Kanal-EKG nach Indikation: siehe U4. Erläuterungen zum Basisalgorithmus: U3."],
    ],
  },
  {
    id: "K1", title: "Akutes Koronarsyndrom", page: "K01",
    tags: "ACS STEMI NSTEMI OMI Herzinfarkt Brustschmerz Angina pectoris Nitro ASS Heparin Morphin PCI",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "y", t: "Venöser Zugang – **LINKS**\nlangsame VEL-Infusion", ra: 1, star: "Links: ggf. rechte Ellenbeuge, NICHT rechter Handrücken oder Unterarm (dort arterieller Zugang für die Untersuchung)" },
      { c: "w", t: "**12-Kanal-EKG**\nggf. um V7–9 bzw. V3r–V6r ergänzen\nspätestens 10 min nach Eintreffen" },
      { q: "STEMI / OMI / STEMI-Äquivalent?", b: [
        ["ja", [{ na: 1 }]],
        ["nein", [{ q: "EKG u./o. Symptomatik* mit akut bedrohlicher koronarer Ursache?", b: [["ja", [{ na: 1 }]], ["nein", []]] }]],
      ] },
      { q: "RRsys > 150 mmHg und HF 50–130/min?", b: [
        ["ja", [{ c: "y", ra: 1, r: ["M11"], t: "**Nitrogabe** 1 Hub s.l. (0,4 mg)\nIndikation/Kontraindikation beachten!\nWiederholung frühestens nach 3 min (max. 3 Hübe)" }]],
        ["nein", []],
      ] },
      { c: "y", r: ["M1"], t: "**Acetylsalicylsäure** 300 mg p.o. **zerkauen** oder 300 mg i.v." },
      { q: "Arbeitsdiagnose", b: [
        ["V.a. ACS / NSTEMI", [{ c: "w", t: "Geeignete Zielklinik festlegen\n(PCI-Möglichkeit!)" }]],
        ["STEMI", [
          { c: "o", r: ["M12"], t: "Bei fehlenden Kontraindikationen:\n**Heparin 5000 IE i.v.**" },
          { c: "o", r: ["M16", "K16c"], t: "Anhaltende Angina pectoris NRS > 5, Indikation/Kontraindikation beachten!\n**Morphin** 1 Amp. (10 mg/1 ml) mit 9 ml NaCl 0,9 % verdünnen = 1 mg/ml\n2 mg langsam > 30 s i.v." },
          { c: "o", t: "Voraussetzungen erfüllt, NRS > 5 und keine UAW:\nRepetition nach 3 min mit 2 mg (= 2 ml), max. Gesamtdosis 6 mg" },
          { c: "r", t: "**PCI anmelden**" },
        ]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Symptome", "Schwere, Druck, Enge im Brustkorb · Ausstrahlung (Arm / Bauch / Kopf / Rücken) · atem- und bewegungs**un**abhängig · oft aus der Ruhe heraus · vegetative Symptome (Kaltschweißigkeit, Übelkeit, Erbrechen)"],
      ["Untypische Symptome", "oft bei Diabetikern · bei Frauen"],
      ["* Bedrohliche Symptomatik", "schwere Herzinsuffizienz · Schock · Synkope · Warnarrhythmie (ventrikuläre Extrasystolen) · Schmerzen"],
    ],
  },
  {
    id: "K2", title: "Linksherzinsuffizienz mit akuter Dyspnoe", page: "K02",
    tags: "Lungenödem kardial Dyspnoe CPAP NIV Nitro Morphin Rasselgeräusche Herzinsuffizienz",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "CPAP kontraindiziert?", b: [
        ["nein", [
          { c: "o", r: ["P2", "V1"], t: "**CPAP-Anwendung***\nBeginn mit 5 cmH₂O" },
          { q: "Anlegen der CPAP-Maske möglich?", b: [
            ["ja", [{ n: "Nitrogabe erwägen (siehe unten)" }]],
            ["nein, agitiert", [
              { c: "o", r: ["M16"], t: "**Morphin:**\nMorphin 1 Amp. mit 9 ml NaCl 0,9 % (= 1 mg/ml)\n2 ml (= 2 mg) > 30 s" },
              { n: "weiter agitiert" },
              { c: "o", t: "Keine UAW:\nRepetition nach 3 min 2 ml (= 2 mg)\nmax. Gesamtdosis 6 mg" },
            ]],
          ] },
        ]],
        ["ja", []],
      ] },
      { q: "RRsys > 150 mmHg + HF 50–130/min?", b: [
        ["ja", [{ c: "y", ra: 1, r: ["M11"], t: "**Nitrogabe** 1 Hub s.l. (0,4 mg)\nWiederholung frühestens nach 3 min, falls Bedingungen weiterhin erfüllt (max. 3 Hübe)" }]],
        ["nein", [{ na: 1 }, { n: "→ Transport" }]],
      ] },
      { q: "Besserungstendenz nach Therapieausschöpfung?", b: [
        ["ja", []],
        ["nein", [{ na: 1 }]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Befunde", "z. B. beidseits feuchte Rasselgeräusche, auch obstruktive Rasselgeräusche möglich, Distanzrasseln, schaumiges, teils hämorrhagisches Sputum"],
      ["* CPAP", "Eine einmal begonnene CPAP-Anwendung soll bei komplikationsfreiem Verlauf grundsätzlich nicht unterbrochen werden. Ausnahmen: kurze Unterbrechung für erforderliche zusätzliche Nitrogabe situativ häufig vertretbar; der Patient lehnt die CPAP-Anwendung ab."],
      ["Notarzt", "Weitere Maßnahmen durch Notarzt je nach Erfordernis (Schleifendiuretika etc.)"],
    ],
  },
  {
    id: "K3", title: "Bedrohliche Bradykardie mit Symptomen", page: "K03",
    tags: "Bradykardie AV-Block Mobitz Atropin Adrenalin Push-Dose Pacing Schrittmacher Spritzenpumpe Perfusor",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "w", t: "Symptomatische Bradykardie?" },
      { na: 1 },
      { c: "w", t: "Vorbereitung transthorakales Pacing\nReanimationsbereitschaft" },
      { q: "• AV-Block II° Mobitz II\n• AV-Block III° mit **breitem QRS**\n• ventrikulärer Escape-Rhythmus\n• Infarkt (LAD mit Leitungsstörung)\n• Transplantatherz", b: [
        ["nein", [
          { c: "y", r: ["M4"], t: "**Atropin 0,5 mg i.v.**" },
          { q: "Besserungstendenz nach 2 min?", b: [
            ["ja", [
              { q: "Symptomatische Bradykardie?", b: [
                ["ja", [
                  { c: "y", r: ["M4"], t: "**Atropin 0,5 mg i.v.**\nWiederholungsgaben alle 3–5 min\nMaximaldosis 3 mg" },
                  { q: "Symptomatische Bradykardie?", b: [
                    ["ja", [{ c: "o", t: "Wechsel von Atropin auf Adrenalin" }, { n: "→ Push-Dose (siehe ja-Zweig oben)" }]],
                    ["nein", [{ n: "→ ärztliche Entscheidung" }]],
                  ] },
                ]],
                ["nein", [{ n: "→ ärztliche Entscheidung" }]],
              ] },
            ]],
            ["nein", [{ n: "→ Push-Dose (siehe ja-Zweig oben)" }]],
          ] },
        ]],
        ["ja", [
          { c: "o", r: ["M2"], t: "Bridging bis Spritzenpumpe verfügbar (Ziel HF 50/min)\n**Push-Dose**\n1 mg Adrenalin auf 100 ml NaCl 0,9 %\n**Dosis** 1 ml (10 µg) i.v." },
          { c: "o", r: ["M2"], t: "**Adrenalin-Spritzenpumpe:**\n1 mg Adrenalin auf 100 ml NaCl 0,9 %\n**Laufgeschwindigkeit** (Ziel HF 50/min)\n12 ml/h = 2 µg/min", star: "Perfusor-Spritze aus der Push-Dose-Flasche aufziehen!" },
          { n: "3 min abwarten" },
          { c: "o", t: "**Laufgeschwindigkeit anpassen**\n(Ziel HF 50/min)\nbis 60 ml/h = 10 µg/min" },
        ]],
      ] },
      { c: "r", t: "**Ärztliche Entscheidung über weitere antibradykarde bzw. kausale Therapie**" },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Ursachen", "Bradykardien können Folge respiratorischer oder sonstiger Ursachen sein! Diese vor symptomatischer Behandlung ausschließen und ggf. beheben!"],
      ["Symptome", "z. B. Schläfrigkeit, Schwindel, Übelkeit, Atemnot, Synkope, dekompensierte Herzinsuffizienz"],
      ["EKG", "AV-Block II° Typ Mobitz II: PQ-Intervall konstant, regelmäßig Ausbleiben der Überleitung · AV-Block III°: keine Beziehung zwischen P und QRS"],
    ],
  },
  {
    id: "K4", title: "Hypertensiver Notfall", page: "K04",
    tags: "Hypertonie Bluthochdruck Urapidil hypertensive Entgleisung Krise",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "Begleitsymptome, die in einem eigenen Algorithmus behandelt werden?", b: [
        ["ja", [{ go: "K1", t: "ACS" }, { go: "K2", t: "Linksherzinsuffizienz mit akuter Dyspnoe" }, { go: "K11", t: "Schlaganfall" }]],
        ["nein", [
          { c: "o", r: ["M25"], t: "**Urapidil**\n5 mg i.v. über 1 min\nWiederholung bis max. 25 mg" },
          { q: "RR um 10–15 % gesenkt?", b: [
            ["ja", []],
            ["nein", [{ na: 1 }, { c: "r", t: "Ärztliche Entscheidung über weitere Therapie" }]],
          ] },
          { c: "b", t: "Transport" },
        ]],
      ] },
    ],
    info: [
      ["Grenzwerte", "**Hypertonie mit Organsymptomatik:** RRsys ≥ 180 mmHg oder RRdia ≥ 110 mmHg · **Schwangerschaft:** RRsys > 160 mmHg oder RRdia > 110 mmHg · **Apoplex:** RRsys ≥ 220 mmHg oder RRdia ≥ 120 mmHg"],
      ["Definition hypertensiver Notfall", "Kritische Hypertonie (RRsys > 180 mmHg und/oder RRdia > 110 mmHg) **mit Organsymptomatik**, z. B. Angina pectoris, Dyspnoe, Kopfschmerzen, Sehstörungen, Schwindel, Übelkeit, Netzhautblutungen. **Ziel** ist *nicht* die optimale Blutdruckeinstellung (cave beim Apoplex), sondern die Absenkung von Extremwerten um ca. 10–15 %! Potenziell hochkomplexes internistisches Krankheitsbild!"],
      ["Abgrenzung: Hypertensive Entgleisung", "Blutdruck über 180/110 mmHg **ohne akute Symptome**: kein eigentlicher Notfall, da keine vitale Gefährdung. Außerklinische Akuttherapie in der Regel nicht erforderlich. Transport zur ärztlichen Vorstellung zur Neueinstellung oder Anpassung einer oralen Medikation muss erfolgen. Erfolgskontrolle ambulant durch niedergelassenen Arzt."],
    ],
  },
  {
    id: "K5", title: "Akute obstruktive Atemwegserkrankung (Erwachsene/Jugendliche > 12 J.)", short: "Obstruktion Erwachsene", page: "K05",
    tags: "Asthma COPD Bronchospasmus Giemen Salbutamol Ipratropium Prednisolon CPAP NIV Status asthmaticus",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "Anaphylaxie?", b: [["ja", [{ go: "K9", t: "Anaphylaxie" }]], ["nein", []]] },
      { c: "y", ra: 1, r: ["M22"], t: "**Salbutamol Fertiginhalat**\n2 Amp. à 1,25 mg (= 2,5 mg/5 ml) mit O₂ vernebeln\n(nach 15 min wiederholen)" },
      { c: "y", ra: 1, t: "Venöser Zugang (wenn zeitnah möglich)\nggf. langsame VEL-Infusion" },
      { n: "ggf. direkte Ipratropiumbromidgabe bei vorausgegangener Selbstmedikation mit Beta-Mimetika" },
      { q: "Besserung?", b: [
        ["ja", [{ n: "→ Transport" }]],
        ["nein", [
          { c: "o", ra: 1, r: ["M13"], t: "**Ipratropiumbromid Fertiginhalat**\n2 Amp. à 0,25 mg in 2 ml (= 0,5 mg/4 ml) mit O₂ vernebeln\n(nach 30 min wiederholbar)" },
          { c: "o", ra: 1, r: ["M21"], t: "**Prednisolon 100 mg i.v.**" },
          { q: "Nachlassen der Symptome?", b: [
            ["ja", [{ n: "→ Transport" }]],
            ["nein", [
              { q: "CPAP / NIV kontraindiziert?", b: [
                ["nein", [
                  { c: "o", r: ["P2", "V1"], t: "• **CPAP:** 5 cmH₂O, max. 10 cmH₂O\n• **NIV:** CPAP 5 cmH₂O, delta ASB 7 cmH₂O, max. CPAP 8 cmH₂O, delta ASB 12–15 cmH₂O\n(Steigerung in 2-cmH₂O-Schritten)" },
                  { q: "Anlegen der CPAP-Maske möglich?", b: [
                    ["ja", []],
                    ["nein, agitiert", [
                      { c: "o", r: ["M16"], t: "**Morphin:**\nMorphin 1 Amp. mit 9 ml NaCl 0,9 % (= 1 mg/ml)\n2 ml (= 2 mg) > 30 s" },
                      { n: "weiter agitiert" },
                      { c: "o", t: "Keine UAW:\nRepetition nach 3 min 2 ml (= 2 mg)\nmax. Gesamtdosis 6 mg" },
                    ]],
                  ] },
                  { q: "Besserung? (SpO₂, Vigilanz)", b: [
                    ["ja", [{ n: "→ Transport" }]],
                    ["nein", [{ na: 1 }, { c: "r", t: "**Notarzt:** (schwerer Asthmaanfall, Status asthmaticus)\nggf. Reproterol 0,09 mg i.v. (Wh. 10 min)\nggf. Magnesiumsulfat i.v. 2 g in 20 min\nggf. endotracheale Intubation/Beatmung" }]],
                  ] },
                ]],
                ["ja", [{ na: 1 }, { c: "r", t: "**Notarzt:** (schwerer Asthmaanfall, Status asthmaticus)\nggf. Reproterol 0,09 mg i.v. (Wh. 10 min)\nggf. Magnesiumsulfat i.v. 2 g in 20 min\nggf. endotracheale Intubation/Beatmung" }]],
              ] },
            ]],
          ] },
        ]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Symptome", "Dyspnoe · exspiratorischer Stridor · hörbares Giemen, Orthopnoe · respiratorische Erschöpfung, Zyanose · Konfusion, Koma · SpO₂ < 90 % · kein Atemgeräusch – „silent chest“"],
    ],
  },
  {
    id: "K6", title: "Akute obstruktive Atemwegserkrankung (Kinder 4–12 J.)", short: "Obstruktion Kinder 4–12 J.", page: "K06", kids: 1,
    tags: "Asthma Kind Kinder Giemen Salbutamol Ipratropium Prednisolon Supp rektal",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "Anaphylaxie?", b: [["ja", [{ go: "K9", t: "Anaphylaxie" }]], ["nein", []]] },
      { c: "y", ra: 1, r: ["M22"], t: "**Salbutamol Fertiginhalat**\n2 Amp. à 1,25 mg (= 2,5 mg/5 ml) mit O₂ vernebeln\n(nach 15 min wiederholen)" },
      { q: "Besserung?", b: [
        ["ja", [{ n: "→ direkt Prednisolon" }]],
        ["nein", [{ c: "o", ra: 1, r: ["M13"], t: "**Ipratropiumbromid Fertiginhalat**\n1 Amp. à 0,25 mg (2 ml) mit O₂ vernebeln\n2× nach jeweils 20 min wiederholbar" }]],
      ] },
      { c: "y", ra: 1, r: ["M21"], t: "**Prednisolon Supp 100 mg rektal**" },
      { q: "Nachlassen der Symptome?", b: [
        ["ja", []],
        ["nein", [
          { na: 1 },
          { c: "y", t: "Venöser Zugang (wenn unproblematisch möglich), dann langsame VEL-Infusion" },
          { c: "r", t: "**Notarzt:** (schwerer Asthmaanfall, Status asthmaticus)\nvenöser Zugang (sehr kritisch abwägen), langsame VEL-Infusion\nPrednisolon i.v. (von Eltern bereits Prednisolon 100 mg rektal?)\nggf. Magnesiumsulfat 25–40 mg/kgKG i.v.\nggf. Reproterol 1 µg/kgKG i.v.\nggf. endotracheale Intubation/Beatmung" },
        ]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Symptome", "Dyspnoe, exspiratorischer Stridor · Husten (= subglottisch) · auskult. Giemen / Brummen, Orthopnoe · kein Atemgeräusch „silent chest“ · Erschöpfung, Konfusion, Koma · Kind „schweigt“ = hochgradige Gefährdung!!! · Zyanose, SpO₂ < 90 % · häufig Virusinfekt (Trigger), Fieber?"],
      ["Kontraindikationen", "Überdosierung mit Betamimetika: Tachykardie > 150/min, Tachyarrhythmie"],
      ["Vorsicht", "Verschiedene Konzentrationen bei Fertiginhalaten. Bei evtl. Verdünnung eines Inhalates mit NaCl 0,9 % bitte Herstellerempfehlungen beachten."],
    ],
  },
  {
    id: "K6A", title: "Akute obstruktive Atemwegserkrankung (Kinder 0–4 J.)", short: "Obstruktion Kinder 0–4 J.", page: "K07", kids: 1,
    tags: "Asthma Kleinkind Säugling obstruktive Bronchitis Giemen Salbutamol Ipratropium",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { n: "Ziel: Sauerstoffsättigung 94–98 %" },
      { na: 1 },
      { q: "Anaphylaxie?", b: [["ja", [{ go: "K9", t: "Anaphylaxie" }]], ["nein", []]] },
      { c: "y", ra: 1, r: ["M22"], t: "**Salbutamol Fertiginhalat**\n2 Amp. à 1,25 mg (= 2,5 mg/5 ml) mit O₂ vernebeln\n2× nach jeweils 20 min wiederholbar" },
      { q: "Besserung?", b: [
        ["ja", []],
        ["nein", [{ c: "o", ra: 1, r: ["M13"], t: "**Ipratropiumbromid Fertiginhalat**\n1 Amp. à 0,25 mg (2 ml) mit O₂ vernebeln\n2× nach jeweils 20 min wiederholbar" }]],
      ] },
      { q: "Nachlassen der Symptome?", b: [
        ["ja", []],
        ["nein", [{ c: "r", t: "**Notarzt:** (schwerer Asthmaanfall, Status asthmaticus)\nvenöser Zugang (sehr kritisch abwägen), langsame VEL-Infusion\nPrednisolon 2 mg/kgKG, max. 20 mg bis zum 2. LJ, max. 30 mg vom 2.–4. LJ oral\nggf. Magnesiumsulfat 25–40 mg/kgKG i.v.\nggf. Reproterol 1 µg/kgKG i.v.\nggf. endotracheale Intubation/Beatmung" }]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Symptome", "Dyspnoe, exspiratorischer Stridor · Husten (= subglottisch) · auskult. Giemen / Brummen, Orthopnoe · kein Atemgeräusch „silent chest“ · Erschöpfung, Konfusion, Koma · Kind „schweigt“ = hochgradige Gefährdung!!! · Zyanose, SpO₂ < 90 % · häufig Virusinfekt (Trigger), Fieber?"],
      ["Milde/moderate Ausprägung", "Herzfrequenz ≤ 180/min (< 3. LJ) bzw. ≤ 150/min (4.–5. LJ), Sauerstoffsättigung ≥ 92 %"],
      ["Schwere Ausprägung", "Herzfrequenz ≥ 180/min (< 3. LJ) bzw. ≥ 150/min (4.–5. LJ), Sauerstoffsättigung ≤ 92 %"],
    ],
  },
  {
    id: "K7", title: "Extrapulmonale Atemwegsobstruktion (Kind)", short: "Pseudokrupp / Epiglottitis Kind", page: "K08", kids: 1,
    tags: "Pseudokrupp Krupp Epiglottitis Stridor inspiratorisch Kind Adrenalin vernebeln Prednisolon rektal",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { n: "⚠︎ Keine Manipulationen im Oropharyngealraum!" },
      { q: "Anaphylaxie?", b: [["ja", [{ go: "K9", t: "Anaphylaxie" }]], ["nein", []]] },
      { q: "Schweregrad?", b: [
        ["I–II", [{ n: "→ direkt Steroid" }]],
        ["III–IV", [
          { na: 1 },
          { c: "y", ra: 1, r: ["M2"], t: "**Adrenalin:**\n5 mg mit O₂ vernebeln" },
        ]],
      ] },
      { c: "y", ra: 1, r: ["M21"], t: "**Steroid:** (falls noch nicht verabreicht)\nPrednisolon 100 mg rektal\nggf. Prednisolon 2 mg/kgKG i.v." },
      { q: "Nachlassen der Symptome?", b: [
        ["ja", []],
        ["nein", [{ na: 1 }, { c: "r", t: "**Notarzt:**\nvenöser Zugang (sehr kritisch abwägen), langsame VEL-Infusion\nggf. Optimierung der Maskenbeatmung (z. B. 2-Helfer-Methode)\nggf. endotracheale Intubation/Beatmung (Tubus 0,5 mm kleiner)" }]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Symptome", "Inspiratorischer Stridor · Dyspnoe, Räuspern · Würgen (= supraglottisch) · Erschöpfung, Konfusion, Koma · Zyanose, SpO₂ < 92 %"],
      ["Auslöser", "Virusinfekt (glottisch, subglottisch)"],
      ["Cave", "in- und exspiratorischer Stridor"],
      ["DD Epiglottitis", "Bei schweren kruppartigen Krankheitsbildern an Epiglottitis denken (Alter, Sprache, sitzend, Speichel, Sepsis). Immer Notarztbegleitung!"],
      ["Schweregrade", "**I:** bellender Husten, Heiserkeit, leiser Stridor bei Erregung · **II:** Ruhestridor, beginnende Dyspnoe, leichte juguläre Einziehungen · **III:** Dyspnoe in Ruhe, ausgeprägte thorakale Einziehungen, Blässe, Tachykardie > 160/min · **IV:** hochgradige Dyspnoe mit zunehmender Ateminsuffizienz, Zyanose, Erstickungsgefahr, Bradykardie und Somnolenz"],
      ["Adrenalin / Steroid", "**Adrenalin:** schnelle, aber kurze Wirksamkeit; Vasokonstriktion im Entzündungsbereich; nie ohne Steroid. **Steroid:** mittelfristig, stabilisierend, antiphlogistisch. Bei älteren Kindern ist aus psychischen Gründen die rektale Gabe gegen die i.v.-Gabe abzuwägen."],
    ],
  },
  {
    id: "K7A", title: "Extrapulmonale Atemwegsobstruktion (Erwachsene)", short: "Angioödem / Stridor Erwachsene", page: "K09",
    tags: "Angioödem Quincke ACE-Hemmer Stridor inspiratorisch Adrenalin vernebeln Prednisolon",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "Anaphylaxie?", b: [["ja", [{ go: "K9", t: "Anaphylaxie" }, { go: "K5", t: "Obstruktive Atemwegserkrankung" }]], ["nein", []]] },
      { q: "Angioödem?", b: [] },
      { na: 1 },
      { c: "y", ra: 1, r: ["M2"], t: "**Adrenalin:**\n5 mg mit O₂ vernebeln" },
      { c: "y", ra: 1, r: ["M21"], t: "**Prednisolon 250 mg i.v.**" },
      { q: "Nachlassen der Symptome?", b: [
        ["ja", []],
        ["nein", [{ c: "r", t: "**Notarzt:**\nggf. endotracheale Intubation/Koniotomie (Tubus kleiner wählen)" }]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Typische Symptome", "Inspiratorischer Stridor · Dyspnoe, Räuspern · Würgen (= supraglottisch) · Erschöpfung, Konfusion, Koma · Zyanose, SpO₂ < 92 %"],
      ["Auslöser", "Medikamente (ACE-Hemmer) · hereditär · Nahrungsmittel · Infektion"],
      ["Cave", "in- und exspiratorischer Stridor"],
      ["Adrenalin", "Schnelle, aber kurze Wirksamkeit · Vasokonstriktion im Entzündungsbereich"],
    ],
  },
  {
    id: "K8", title: "Symptomatische Hypoglykämie", page: "K10",
    tags: "Hypoglykämie Unterzucker BZ Blutzucker Glukose Glucose Thiamin Diabetes Insulin",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "w", t: "ggf. weitere Insulinzufuhr stoppen (Insulinpumpe?)" },
      { n: "Patienten z. T. mit Eigenmedikation ausgestattet (z. B. Glucagon)" },
      { q: "Patient wach und schluckfähig?", b: [
        ["ja", [{ c: "w", t: "Glukose / schnellwirksame Kohlenhydrate oral bis Blutzucker im Normbereich" }]],
        ["nein", [
          { c: "y", ra: 1, t: "Venöser Zugang\nlangsame **VEL**-Infusion" },
          { c: "y", ra: 1, r: ["M24"], t: "**Thiamin** 100 mg i.v." },
          { c: "y", ra: 1, r: ["M10"], t: "**Glukose** i.v.\nErwachsene 8 g\nKinder – 12 J.: 0,2 g/kgKG\nWiederholung alle 3 min bis BZ im Normbereich" },
        ]],
      ] },
      { q: "Besserung?", b: [
        ["ja", []],
        ["nein", [{ na: 1 }]],
      ] },
      { c: "b", t: "Arztkontakt sicherstellen" },
    ],
    info: [
      ["Definition", "**Erwachsene:** Bewusstseinseinschränkung mit Blutglukose < 60 mg/dl bzw. 3,3 mmol/l · **Kindesalter:** < 45 mg/dl (2,5 mmol/l) · **Neugeborene:** < 50 mg/dl (2,8 mmol/l)"],
      ["Symptome", "z. B. Bewusstseinsstörung, Desorientierung, neurologische oder psychiatrische Auffälligkeiten, Unruhe, Zittern, Kaltschweißigkeit, Bewusstlosigkeit, Krampfanfall, Herzkreislaufstillstand"],
    ],
  },
  {
    id: "K9", title: "Anaphylaktische Reaktion", short: "Anaphylaxie", page: "K11",
    tags: "Anaphylaxie Allergie allergische Reaktion Schock Adrenalin i.m. Dimetinden Prednisolon Urtikaria Quincke",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "w", t: "**Allergenzufuhr stoppen**" },
      { q: "Symptomatik?", b: [
        ["Leichte Symptomatik (Grad I)", [
          { n: "Pruritus, Flush, Urtikaria, Angioödeme = **nur Haut- und Allgemeinsymptome**" },
          { c: "y", ra: 1, t: "Venöser Zugang, Infusion VEL:\nbis 60 kgKG 10–20 ml/kgKG, ab 60 kgKG 500–1000 ml" },
          { c: "o", r: ["M7", "M21"], t: "• **Dimetindenmaleat** 0,1 mg/kgKG i.v.\n• **Prednisolon:** bis 60 kgKG 2 mg/kgKG, ab 60 kgKG 250–1000 mg i.v." },
          { q: "Symptome, die in einem eigenen Algorithmus behandelt werden?", b: [
            ["ja", [{ go: "K18", t: "Übelkeit" }, { go: "K16a", t: "Abdomineller Schmerz" }, { go: "K7", t: "Obstruktion obere Atemwege (K7, K7A)" }, { go: "K5", t: "Obstruktion untere Atemwege (K5, K6, K6A)" }, { c: "b", t: "Transport" }]],
            ["nein", [{ c: "b", t: "Ärztliche Weiterbehandlung sicherstellen" }]],
          ] },
        ]],
        ["Schwere Symptomatik (Grad II–III)", [
          { n: "Schock, Bewusstlosigkeit, Obstruktion obere und untere Atemwege, isolierte abdominelle Symptome wie Übelkeit, viszerale Schmerzen, Erbrechen = **ABCD-Problem**" },
          { na: 1, t: "NA alarmieren (Grad III)" },
          { c: "y", ra: 1, r: ["M2"], t: "**Adrenalin i.m.**\n(1× Wdh. möglich nach 5 min)\n< 30 kgKG: 0,01 mg/kgKG**\n30–60 kgKG: 0,1 mg/10 kgKG\n> 60 kgKG: 0,6 mg", star: "Bei Kindern bis 10 kgKG: Supra-Tankstelle wie K13 verwenden" },
          { q: "Schock?", b: [
            ["nein", [
              { c: "y", ra: 1, t: "Venöser Zugang, Infusion VEL:\nbis 60 kgKG 10–20 ml/kgKG, ab 60 kgKG 500–1000 ml" },
              { c: "o", r: ["M7", "M21"], t: "• **Dimetindenmaleat** 0,1 mg/kgKG i.v.\n• **Prednisolon:** bis 60 kgKG 2 mg/kgKG, ab 60 kgKG 250–1000 mg i.v." },
              { q: "Symptome, die in einem eigenen Algorithmus behandelt werden?", b: [
                ["ja", [{ go: "K18", t: "Übelkeit" }, { go: "K16a", t: "Abdomineller Schmerz" }, { go: "K7", t: "Obstruktion obere Atemwege (K7, K7A)" }, { go: "K5", t: "Obstruktion untere Atemwege (K5, K6, K6A)" }, { c: "b", t: "Transport" }]],
                ["nein", [{ c: "b", t: "Ärztliche Weiterbehandlung sicherstellen" }]],
              ] },
            ]],
            ["ja", [
              { q: "i.v.-Zugang zügig möglich?", b: [
                ["ja", [{ c: "y", ra: 1, t: "**Venöser Zugang\n1000 ml VEL-Infusion**" }]],
                ["nein", []],
              ] },
              { c: "r", t: "**Maßnahmen Notarzt**" },
              { c: "b", t: "Transport" },
            ]],
          ] },
        ]],
        ["Kreislaufstillstand (Grad IV)", [
          { n: "= **Reanimation**" },
          { na: 1 },
          { c: "y", ra: 1, t: "**Reanimation**", r: ["K12", "K13"] },
        ]],
      ] },
    ],
    info: [
      ["Schweregrade", "siehe U5 Schweregradskala Anaphylaxie"],
    ],
  },
  {
    id: "K10", title: "Status epilepticus", page: "K12",
    tags: "Krampfanfall Krampf Epilepsie Status Midazolam nasal Levetiracetam Grand mal",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { n: "u. a. Schutz vor weiteren Verletzungen, Aspiration, evtl. stabile Seitenlage" },
      { q: "Venöser Zugang vorhanden/möglich?", b: [
        ["nein", [{ c: "y", ra: 1, r: ["M15"], t: "**Midazolam nasal pur***\n> 40 kgKG: 10 mg Bolus\n< 40 kgKG: 5 mg\n(verteilt auf beide Nasenlöcher)" }]],
        ["ja", [{ c: "y", ra: 1, r: ["M15"], t: "**Midazolam i.v. pur***\n0,2 mg/kgKG\n< 40 kgKG: max. 5 mg\n> 40 kgKG: max. 10 mg\nggf. nach 5 min 1× wiederholen" }]],
      ] },
      { q: "Anfall beendet?", b: [
        ["ja", []],
        ["nein", [
          { na: 1 },
          { q: "i.v.-Zugang vorhanden/möglich?", b: [
            ["ja", [{ c: "r", r: ["M14"], t: "Einleitung einer Therapie mit\n**Levetiracetam 60 mg/kgKG,\nmax. 4500 mg in 10 min**" }]],
            ["nein", []],
          ] },
          { c: "r", t: "ggf. Narkoseeinleitung (Thiopental oder Propofol als Hypnotikum in adäquater Dosierung), inkl. Relaxierung zur Atemwegssicherung.\nDifferentialdiagnose? Fremdanamnese!" },
        ]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Definition „Status epilepticus“ (DGN)", "Krampfanfall länger als 5 min oder mindestens 2 Anfälle hintereinander ohne Bewusstsein dazwischen"],
      ["* Midazolam", "Gute Überwachung! A- und B-Problem durch Midazolam auslösbar! (Atemwegssicherung – Antidot Flumazenil sehr kritisch in Erwägung ziehen)"],
    ],
  },
  {
    id: "K10A", title: "Fieberkrampf", page: "K13", kids: 1,
    tags: "Fieberkrampf Kind Krampfanfall Fieber Midazolam nasal Paracetamol Zäpfchen",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { na: 1 },
      { q: "Krampfanfall > 5 min?", b: [
        ["nein", [{ n: "→ Transport" }]],
        ["ja", [
          { c: "y", ra: 1, r: ["M15"], t: "**Midazolam nasal pur***\n0,2 mg/kgKG (max. 5 mg)\n(verteilt auf beide Nasenlöcher)\nFalls binnen 5 min keine Wirkung: 1× wiederholen" },
          { q: "Anfall beendet?", b: [
            ["ja", []],
            ["nein", [{ c: "r", t: "**Levetiracetam** 20–40 mg/kgKG, max. 500 mg in 10 min\nggf. Narkoseeinleitung inkl. Relaxierung zur Atemwegssicherung.\nDifferentialdiagnose? Fremdanamnese!" }]],
          ] },
        ]],
      ] },
      { c: "b", t: "Transport" },
    ],
    info: [
      ["Midazolam nasal nach Alter", [["Alter", "Gewicht kgKG", "Dosis mg"],
        ["1. Monat", "4,5", "1"], ["2. Monat", "5,5", "1"], ["3. Monat", "6,5", "1"], ["4. Monat", "7", "1"], ["5. Monat", "7,5", "2"], ["6. Monat", "8", "2"],
        ["7. Monat", "8", "2"], ["8. Monat", "8,5", "2"], ["9. Monat", "9", "2"], ["10. Monat", "9", "2"], ["11. Monat", "9,5", "2"], ["1 Jahr", "9,5", "2"],
        ["2 Jahre", "14", "3"], ["3 Jahre", "16", "3"], ["4 Jahre", "18", "4"], ["5 Jahre", "21", "4"], ["6 Jahre", "24", "5"], ["7 Jahre", "27", "5"]]],
      ["Fiebersenkung", "Temperatursenkung durch Paracetamol supp. **verhindert keinen erneuten Krampfanfall!** Dient nur dem Komfort des Kindes. PCM supp. 125 mg: 6 Monate (7 kg) bis 2 Jahre (12 kg). PCM supp. 250 mg (**cave! Soja-/Erdnussallergie**): 2 Jahre (13 kg) bis 8 Jahre (25 kg)."],
      ["* Midazolam", "Gute Überwachung! A- und B-Problem durch Midazolam auslösbar! (Atemwegssicherung – Antidot Flumazenil sehr kritisch in Erwägung ziehen)"],
    ],
  },
  {
    id: "K11", title: "Schlaganfall", page: "K14",
    tags: "Schlaganfall Apoplex Stroke Insult FAST-4D Thrombektomie Stroke Unit Lyse",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "w", ra: 1, r: ["P5"], t: "Sauerstoffgabe" },
      { c: "y", ra: 1, t: "Venöser Zugang, 18 G, Ellenbeuge auf der **nicht betroffenen** Seite\nlangsame VEL-Infusion 500 ml" },
      { q: "Begleitsymptome, die in einem eigenen Algorithmus behandelt werden?", b: [
        ["ja", [{ go: "K8", t: "Hypoglykämie" }, { go: "K4", t: "ggf. Hypertoniebehandlung" }]],
        ["nein", []],
      ] },
      { q: "Beginn ≤ 24 h?", b: [
        ["ja", [
          { q: "FAST-4D ≥ 4 Punkte?", b: [
            ["ja", [
              { q: "Thrombektomiezentrum < 10 min?", b: [
                ["ja", [{ c: "b", t: "**Transport in Thrombektomiezentrum (TZ)***" }]],
                ["nein", [{ c: "b", t: "**Transport Stroke Unit (SU)***" }]],
              ] },
            ]],
            ["nein", [{ c: "b", t: "**Transport Stroke Unit (SU)***" }]],
          ] },
        ]],
        ["nein", [{ c: "b", t: "**Transport Stroke Unit (SU)***" }]],
      ] },
      { n: "* Dokumentation nach Schlaganfallprotokoll · Telefonat mit aufnehmender Klinik/Neurologe" },
    ],
    info: [
      ["Notarztnachforderung", "Bewusstloser Patient **mit mind. einem** der folgenden Kriterien: pathologische Atmung · Hinweis auf Aspiration/unzureichende Schutzreflexe · SpO₂ < 94 % trotz O₂-Gabe von 8 l/min · RR < 90 mmHg · stärkste Kopfschmerzen · allgemeine Zeichen der vitalen Bedrohung/Instabilität · progredienter/fluktuierender Verlauf · ergibt sich aus anderem Algorithmus"],
      ["FAST-4D", "**F**ace (faziale Parese) · **A**rm (Arm-/Beinparese) · **S**peech (Sprach-/Sprechstörung) · **T**ime (Zeitfenster) · **D**iplopic images (Doppelbilder) · **D**eficit in field of view (Gesichtsfelddefekt) · **D**izziness/vertigo (Dreh-/Schwankschwindel) · **D**ysmetria/ataxia (Dysmetrie/Ataxie)"],
    ],
  },
  {
    id: "K12", title: "Kreislaufstillstand Erwachsene – CPR", short: "Reanimation Erwachsene", page: "K15",
    tags: "Reanimation CPR ALS Kreislaufstillstand Herzstillstand Kammerflimmern VF PVT PEA Asystolie Adrenalin Amiodaron Defibrillation Schock",
    flow: [
      { c: "b", t: "Patient reagiert nicht\nfehlende oder nicht normale Atmung" },
      { na: 1 },
      { c: "w", t: "**CPR 30 : 2**\nDefibrillator/EKG-Monitor anschließen\nAtemwege freimachen" },
      { q: "Rhythmusanalyse", loop: 1, b: [
        ["VF / PVT – schockbar", [
          { c: "w", t: "**1 Schock**" },
          { c: "w", t: "Sofort **CPR 30 : 2 für 2 min**\n*Gesicherter Atemweg ohne Leckage: HDM durchgehend*" },
          { c: "y", ra: 1, r: ["M2", "M3"], t: "**nach 3. Schock**\nAdrenalin 1 mg i.v./i.o.\nund Amiodaron 300 mg i.v./i.o.\n(nach 5. Schock 150 mg i.v.)" },
          { n: "↺ zurück zur Rhythmusanalyse" },
        ]],
        ["ROSC", [
          { n: "Wiederherstellung eines Spontankreislaufs" },
          { c: "r", r: ["K15"], t: "**Postreanimationsphase** nach ABCDE\n• Zielwert SpO₂ 94–98 %\n• Normokapnie\n• RRsys > 100 mmHg oder MAD > 60–65 mmHg\n• 12-Kanal-EKG\n• Erkennen und Behandeln der Ursache\n• Hyperthermie vermeiden" },
          { c: "b", t: "Anmeldung Zielklinik\nTransport" },
        ]],
        ["PEA / Asystolie – nicht schockbar", [
          { c: "w", t: "Sofort **CPR 30 : 2 für 2 min**\n*gesicherter Atemweg ohne Leckage: HDM durchgehend*" },
          { c: "y", ra: 1, r: ["M2"], t: "**Adrenalin 1 mg i.v./i.o.\nbaldmöglichst!**" },
          { n: "↺ zurück zur Rhythmusanalyse" },
        ]],
      ] },
    ],
    info: [
      ["Pad-Position", "Apikales (laterales) Pad korrekt positionieren (d. h. unterhalb der Achselhöhle in der mittleren Axillarlinie). **Erwäge Wechsel auf antero-posteriore Pad-Position nach drei fehlgeschlagenen Schocks:** vorderes Pad links vom Sternum, hinteres Pad auf gleicher Höhe direkt medial vom linken Schulterblatt."],
      ["Während CPR", "**Hochwertige Thoraxkompressionen:** Frequenz 100–120/min, Tiefe 5–6 cm, Entlastung, Wechsel alle 2 min, minimale Unterbrechung. **Atemwegssicherung:** O₂-Gabe 100 %, SGA/Intubation, Kapnometrie/-graphie, Absaugung, Pulsoxymetrie. **Zugang:** i.v./i.o.; Adrenalin 1 mg alle 3–5 min; ggf. Amiodaron/Lidocain; ggf. Magnesium; Midazolam 2–5 mg bei V. a. Awareness. **Reversible Ursachen:** 4 H's & HITS erkennen und beheben. Vom Hersteller empfohlene Energie, da abhängig vom Defibrillator-Modell."],
      ["Pulskontrolle, wenn", "CO₂ signifikant ansteigt · allgemeine Zeichen des Lebens: Atmung, Bewegung, Abwehrreaktionen"],
      ["Reversible Ursachen „4 H's & HITS“", "Hypoxie · Hypovolämie · Hypo-/Hyperthermie · Hypo-/Hyperkaliämie · Herzbeuteltamponade · Intoxikation · Thrombembolie · Spannungspneumothorax"],
      ["Beachte", "Besondere Bedingungen bei einem HKS durch ein Trauma · ggf. Notfallsonographie (ärztlich, Dauer < 10 Sekunden)"],
      ["Unterbrechung des Algorithmus nur, wenn", "Spontanatmung eintritt · der Notarzt dies entscheidet (Abbruch)"],
    ],
  },
  {
    id: "K13", title: "Kreislaufstillstand Kind – CPR", short: "Reanimation Kind", page: "K16", kids: 1,
    tags: "Reanimation Kind Kinder PLS CPR Kreislaufstillstand Adrenalin Amiodaron Defibrillation 4 J/kg Supra-Tankstelle",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { na: 1 },
      { c: "w", t: "Atemwege freimachen\n**CPR** (5 initiale Beatmungen, dann **15 : 2**)\nDefibrillator/EKG-Monitor anschließen" },
      { q: "Rhythmusanalyse", loop: 1, b: [
        ["VF / PVT – Schock indiziert*", [
          { c: "w", t: "**1× Schock 4 J/kgKG**\nab 6. Schock 8 J/kgKG" },
          { c: "w", t: "Sofort **CPR 15 : 2 für 2 min**\nunterbrechungsfrei\ngesicherter Atemweg (SGA/ET): HDM durchgehend" },
          { c: "y", ra: 1, r: ["M2", "M3"], t: "**nach 3. Schock**\n**Adrenalin** 0,01 mg/kgKG i.v./i.o. alle 3–5 min wiederholen\n**Amiodaron** 5 mg/kgKG i.v./i.o. (nach 5. Schock wiederholen, max. 150 mg)" },
          { n: "↺ zurück zu CPR / Rhythmusanalyse" },
        ]],
        ["ROSC", [
          { n: "Wiederherstellung eines Spontankreislaufs" },
          { c: "w", r: ["K15"], t: "Postreanimationsphase" },
          { c: "r", t: "RRsys > 10. Perzentile, sonst Katecholamine\nSedierung · Narkose · Normoxämie · Normokapnie · Hyperthermie vermeiden" },
          { c: "b", t: "Transport\ngeeignete Zielklinik\nAnmeldung" },
        ]],
        ["PEA / Asystolie – kein Schock", [
          { c: "w", t: "Sofort **CPR 15 : 2 für 2 min**\nunterbrechungsfrei\ngesicherter Atemweg (SGA/ET): HDM durchgehend" },
          { c: "y", ra: 1, r: ["M2"], t: "**Adrenalin baldmöglichst!!!**\n0,01 mg/kgKG i.v./i.o.\nalle 3–5 min wiederholen" },
          { n: "↺ zurück zu CPR / Rhythmusanalyse" },
        ]],
      ] },
    ],
    info: [
      ["Pad-Position", "< 25 kgKG **antero-posteriore** Pad-Position: vorderes Pad links vom Sternum, hinteres Pad auf gleicher Höhe direkt medial vom linken Schulterblatt."],
      ["Gewicht Kinder (Abschätzung)", "Neugeborenes: 4 kg (NLS-Algorithmus) · 1 Jahr: 10 kg · 3 Jahre: 15 kg · 6 Jahre: 20 kg · 10 Jahre: 30 kg"],
      ["Während CPR", "**Optimale CPR:** Frequenz 100–120/min, Tiefe altersadaptiert, Entlastung, Wechsel alle 2 min. **Atemwegssicherung:** O₂-Gabe 100 %, Absaugung, Zugang i.v./i.o., Pulsoxymetrie, Kapnometrie/-graphie. 4 H's & HITS erkennen und beheben (Notfallsonographie?). *bzw. vom Hersteller empfohlene Energie, da abhängig vom Defibrillator-Modell."],
      ["Reversible Ursachen „4 H's & HITS“", "Hypoxie · Hypovolämie · Hypoglykämie* · Hypo-/Hyperthermie · Hypo-/Hyperkaliämie · Herzbeuteltamponade · Intoxikation · Thrombembolie · Spannungspneumothorax (*Hypoglykämie zusätzlich zu den ERC Guidelines)"],
      ["Beachte", "Besondere Bedingungen bei einem HKS durch ein Trauma"],
      ["Unterbrechung des Algorithmus nur, wenn", "Spontanatmung eintritt · der Notarzt dies entscheidet (Abbruch)"],
      ["RRsys 10. Perzentile (mmHg)", [["Alter", "RR"], ["1. LJ", "98/52"], ["2. LJ", "100/55"], ["3. LJ", "101/58"], ["4. LJ", "102/60"], ["5. LJ", "103/63"], ["6. LJ", "105/66"], ["7. LJ", "106/68"], ["8. LJ", "107/69"], ["9. LJ", "107/70"], ["10. LJ", "108/72"], ["11. LJ", "110/74"], ["12. LJ", "113/75"]]],
      ["Supra-Tankstelle", "Adrenalin 1 mg mit 9 ml NaCl 0,9 % (0,01 mg = 0,1 ml/kgKG), 3-Wegehahn entlüften! Video: youtube.com/watch?v=iZChnN6OJPY"],
    ],
  },
  {
    id: "K14", title: "Erstversorgung Neugeborenes", short: "Neugeborenes / NLS", page: "K17", kids: 1,
    tags: "Neugeborenes Geburt NLS Neugeborenenreanimation APGAR Abnabeln Frühgeborenes Wärmeerhalt",
    flow: [
      { c: "b", t: "Basisalgorithmus für die Mutter" },
      { n: "In jeder Phase: Brauche ich Hilfe?" },
      { c: "w", t: "Vor der Geburt Teambriefing und Equipmentcheck" },
      { na: 1 },
      { c: "w", t: "**Geburt** – Uhr starten und Geburtstermin notieren\nmöglichst verzögerte Abnabelung – Alternative: Ausstreichen der Nabelschnur" },
      { c: "w", t: "Trocknen – Wärmen/Wärmeerhalt – **Atemwege frei?**" },
      { c: "w", t: "Schnappatmung/keine Atmung?" },
      { c: "w", t: "**Initial 5 Beatmungen**, Inspirationszeit 2–3 s\n(PIP > 32+0 SSW: 30 cmH₂O)\n(PIP bis 31+6 SSW: 25 cmH₂O)\nPulsoxymetrie, EKG erwägen" },
      { q: "Unzureichende Thoraxbewegungen unter Beatmung?", b: [
        ["ja", [{ c: "w", t: "• Kopf repositionieren\n• Maske dicht?\n• Sekret?\n• Atemhilfen erwägen\n• 2-Hände-Esmarch-Handgriff\n• Spitzendruck erhöhen" }, { n: "↺ erneut 5 Beatmungen" }]],
        ["nein", []],
      ] },
      { c: "w", t: "Weiter Beatmung\nInspirationszeit < 1 s" },
      { c: "w", t: "Beurteilung Herzfrequenz nach 30 s" },
      { q: "Herzfrequenz?", b: [
        ["HF > 60/min", [{ c: "w", t: "Beatmung 30/min bis suffiziente Spontanatmung und Herzfrequenz > 100/min" }]],
        ["HF < 60/min", [
          { c: "w", t: "**CPR 3 : 1**\nThoraxkompressionen / Beatmung\n100 % O₂-Gabe\nPulsoxymetrie/EKG" },
          { q: "Wiederbeurteilung alle 30 s: Herzfrequenz < 60/min?", b: [
            ["ja", [{ c: "w", t: "Weiter CPR\ni.v./i.o.-Zugang und Medikamente erwägen" }]],
            ["nein", [{ n: "→ Beatmung 30/min bis HF > 100/min" }]],
          ] },
        ]],
      ] },
      { n: "Bei ROSC (Wiederherstellung eines Spontankreislaufs) → Postreanimationsphase (K15)" },
      { c: "r", t: "RRsys > 10. Perzentile, sonst Katecholamine\nSedierung · Narkose · Normoxämie · Normokapnie · Wärmeerhalt" },
      { c: "b", t: "Transport in geeignete Zielklinik\nAnmeldung" },
      { c: "b", t: "Nach der Versorgung: Information an die Eltern – Teamdebriefing" },
    ],
    info: [
      ["Frühgeborenenversorgung", "Wärmeerhalt!!!! · Nicht trocken reiben → Tüten-/Neoprenanzug nutzen"],
      ["Sauerstoff-Erstgabe", [["SSW", "FiO₂"], ["> 32+0", "21 %"], ["28+0 – 31+6", "21–30 %"], ["< 28+0", "30 %"], ["bei HDM", "100 %"]]],
      ["Thoraxkompressionen", "Kompressionsfrequenz 120/min (entsprechend 15 Zyklen von Thoraxkompressionen und Ventilationen in 30 s) · Thorax umgreifen, 2-Daumen-Technik · Druckpunkt unterhalb der gedachten Linie zwischen den Mamillen · Kompressionstiefe 1/3 des Thoraxdurchmessers · Beurteilung alle 30 s"],
      ["Reversible Ursachen?", "Spannungspneumothorax · Hypovolämie"],
      ["APGAR-Score", [["", "0 Punkte", "1 Punkt", "2 Punkte"], ["Appearance", "blass/blau", "rosiger Stamm, blaue Extremitäten", "rosig"], ["Pulse", "kein Puls", "< 100/min", "> 100/min"], ["Grimace", "keine", "grimassiert", "schreit"], ["Activity", "schlaff", "träge Bewegungen", "aktive Bewegungen"], ["Respiration", "keine", "langsam und/oder unregelmäßig", "regelmäßig (ca. 40/min) oder schreit kräftig"]]],
      ["APGAR-Bewertung", "Verlaufsbeurteilung nach 1, 5 und 10 Minuten · < 6: vitale Bedrohung · 6–8: Beobachtung · 9–10: normal"],
      ["RRsys 10. Perzentile", "siehe K13"],
    ],
  },
  {
    id: "K15", title: "Post-Reanimationsphase", short: "Post-Reanimation / ROSC", page: "K18",
    tags: "ROSC Postreanimation Post-Reanimationsphase Analgosedierung MAP etCO2 Normokapnie TTM",
    flow: [
      { c: "b", t: "**ROSC** (return of spontaneous circulation)" },
      { c: "w", t: "12-Kanal-EKG" },
      { q: "Spontanes Erwachen?", b: [
        ["ja", [{ n: "→ weiter bei BZ-Kontrolle" }]],
        ["nein", [
          { q: "Toleriert Beatmung?", b: [
            ["ja", []],
            ["nein", [{ c: "y", t: "z. B. **Midazolam**, ggf. Wdh.\n> 50 kgKG: 5 mg\n< 50 kgKG: 1 mg/10 kg" }, { c: "r", t: "Analgosedierung" }]],
          ] },
          { q: "HF 50–150/min?", b: [
            ["ja", []],
            ["nein", [
              { c: "o", t: "**HF zu niedrig?**\nErwäge: **Atropin/Adrenalin**" },
              { c: "r", t: "Schrittmacher" },
              { c: "r", t: "**HF zu hoch?**\nErwäge: *Analgosedierung, Antiarrhythmika/Kardioversion", star: "ggf. Warten auf Abklingen der Adrenalinwirkung" },
            ]],
          ] },
          { q: "MAP* > 60–65 mmHg?", b: [
            ["ja", []],
            ["nein", [
              { c: "r", t: "**MAP zu niedrig?**\nErwäge: Katecholamine (z. B. (Nor-)Adrenalin-Spritzenpumpe)" },
              { c: "r", t: "**MAP zu hoch?**\nErwäge: Analgosedierung, antihypertensive Therapie" },
            ]],
          ] },
          { q: "etCO₂ 35–45 mmHg?", b: [
            ["ja", []],
            ["nein", [{ c: "w", t: "Normoventilation anstreben" }, { n: "NB: CO₂-Abfall kann auch zirkulatorisch bedingt sein!" }]],
          ] },
          { q: "Temperatur < 37 °C?", b: [
            ["ja", []],
            ["nein", [{ c: "b", t: "Hyperthermie vermeiden" }]],
          ] },
        ]],
      ] },
      { q: "BZ > 60 mg/dl?", b: [
        ["ja", []],
        ["nein", [{ go: "K8", t: "Hypoglykämie" }]],
      ] },
      { q: "SpO₂ 94–98 %?", b: [
        ["ja", []],
        ["nein", [{ go: "P5", t: "Sauerstoffgabe" }]],
      ] },
      { q: "12-K-EKG: V. a. STEMI?", b: [
        ["ja", [{ go: "K1", t: "Akutes Koronarsyndrom (ACS)" }]],
        ["nein", []],
      ] },
      { c: "b", t: "• Transport nach Anmeldung Zielklinik\n• lückenloses Standardmonitoring\n• Rea-Bereitschaft (TTM? PCI?)" },
    ],
    info: [
      ["Lagerung", "Möglichst mit 30° OK-Hochlage zur Sicherstellung des venösen Rückflusses (= Hirnödemprophylaxe). Zurückhaltung mit Zervikalstütze (insbesondere, wenn kein Trauma vorliegt, Vermeidung ICP-Anstieg!), ggf. Headblocks vorziehen."],
      ["* MAP", "Meist oszillometrisch gemessen. MAP = (syst. + 2 × diast. RR) / 3"],
      ["CO-Intoxikation", "NB: Zum Ausschluss einer CO-Intoxikation einmalig auch HbCO bestimmen! (falls Analysegerät verfügbar)"],
    ],
  },
  {
    id: "K16a", title: "Abdomineller Schmerz", page: "K19",
    tags: "Bauchschmerz Kolik Nierenkolik Gallenkolik Paracetamol Butylscopolamin Buscopan Piritramid Analgesie",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "y", t: "Venöser Zugang\nlangsame **VEL**-Infusion 500 ml" },
      { q: "RRsys > 100 mmHg, HF 50–130/min, SpO₂ > 92 %?", b: [
        ["ja", [
          { c: "o", r: ["M19"], t: "**Paracetamol**\nab 10 kgKG: 15 mg/kgKG\nab 50 kgKG: 1000 mg" },
          { q: "Anhalt für Gallenkolik?", b: [
            ["ja", [{ c: "o", r: ["M5"], t: "Falls nicht kontraindiziert:\n**Butylscopolamin** 20 mg i.v. langsam\nwenn kein ausreichender Erfolg: Piritramid" }]],
            ["nein", []],
          ] },
          { c: "o", r: ["M20"], t: "**Piritramid**\n1 Amp. (15 mg/2 ml) mit 8 ml NaCl 0,9 % (≙ 1,5 mg/ml)\n0,1 mg/kgKG, > 30 s, max. 7,5 mg Einzeldosis" },
          { c: "o", t: "**Repetition Piritramid:**\nfrühestens nach 3 min, gleiche Dosierung wie initial\nmaximale Gesamtdosis 15 mg" },
          { q: "Besserung der Beschwerden?", b: [
            ["ja", []],
            ["nein", [
              { q: "Aus einem anderen Algorithmus kommend?", b: [
                ["ja", [{ go: "K16", t: "Ausgangsalgorithmus" }]],
                ["nein", [{ na: 1 }, { c: "r", t: "Notärztliche Entscheidung über weitere Maßnahmen" }]],
              ] },
            ]],
          ] },
        ]],
        ["nein", [{ na: 1 }, { c: "r", t: "Notärztliche Entscheidung über weitere Maßnahmen" }]],
      ] },
      { c: "b", t: "Transport in geeignete Zielklinik" },
    ],
    info: [
      ["AWMF-Leitlinien (Stand 4.7.2021)", "**DG Urologie Nierenkolik:** Butylscopolamin **nicht** empfohlen · **DG Gastroenterologie Gallenkolik:** Butylscopolamin empfohlen"],
      ["Ziel", "Nicht lebensbedrohliche Situation und Erkrankung: Ziel ist, die Transportfähigkeit herzustellen."],
      ["Beachte", "Übermäßige Volumenzufuhr kann bei der Nierenkolik aufgrund des Harnstaus zur Verstärkung der Schmerzen führen – daher Infusion langsam laufen lassen."],
    ],
  },
  {
    id: "K16b", title: "Traumatischer Schmerz / nicht-traumatischer Rückenschmerz", short: "Traumatischer Schmerz", page: "K20",
    tags: "Trauma Schmerz Fraktur Rückenschmerz Analgesie Esketamin Ketanest Midazolam Piritramid Paracetamol",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "i.v.-Zugang möglich?", b: [
        ["ja", [
          { c: "y", t: "Langsame VEL-Infusion" },
          { q: "NRS > 7?", b: [
            ["ja", []],
            ["nein", [
              { c: "o", r: ["M19"], t: "**Paracetamol**\nab 10 kgKG: 15 mg/kgKG\nab 50 kgKG: 1000 mg" },
              { q: "NRS > 5?", b: [["ja", []], ["nein", [{ n: "→ Transport" }]]] },
            ]],
          ] },
          { q: "Esketamin möglich?", b: [
            ["ja", [
              { c: "o", r: ["M8"], t: "**Esketamin**\ntraumatischer Schmerz / nicht-traumatischer Rückenschmerz, langsam i.v.\n**Erwachsene und Kinder:**\nErstgabe: 0,125–0,250 mg/kgKG\nRepetition: nach 3–5 min – insgesamt max. 0,5 mg/kgKG" },
              { q: "Psychedelische Wirkungen von Esketamin?", b: [
                ["ja", [{ c: "o", r: ["M15"], t: "ggf. **Midazolam*** langsam i.v.\n**Kinder und Erwachsene:**\n10–50 kgKG: 0,2 mg/10 kgKG\n> 50 kgKG: 1 mg" }]],
                ["nein", []],
              ] },
              { q: "Schmerz ≥ 5?", b: [["ja", []], ["nein", [{ n: "→ Transport" }]]] },
            ]],
            ["nein", []],
          ] },
          { c: "o", r: ["M20"], t: "**Piritramid**\n1 Amp. (15 mg/2 ml) mit 8 ml NaCl 0,9 % (≙ 1,5 mg/ml)\n0,1 mg/kgKG > 30 s, max. 7,5 mg Einzeldosis" },
          { c: "o", t: "**Repetition Piritramid:**\nfrühestens nach 3 min, gleiche Dosis\nmaximale Gesamtdosis 15 mg" },
          { q: "Schmerz ≤ 5?", b: [
            ["ja", []],
            ["nein", [
              { q: "Aus einem anderen Algorithmus kommend?", b: [
                ["ja", [{ go: "K16", t: "Ausgangsalgorithmus" }]],
                ["nein", [{ na: 1 }, { c: "r", t: "Ärztliche Entscheidung über weitere Maßnahmen" }]],
              ] },
            ]],
          ] },
        ]],
        ["nein", [
          { c: "o", t: "ggf. Analgesie über anderen Applikationsweg" },
          { q: "Transportfähigkeit?", b: [
            ["ja", [{ n: "→ Transport" }]],
            ["nein", [{ na: 1 }, { c: "r", t: "Ärztliche Entscheidung über weitere Maßnahmen" }]],
          ] },
        ]],
      ] },
      { c: "b", t: "Transport in geeignete Klinik / Arztvorstellung" },
    ],
    info: [
      ["* Midazolam", "Gute Überwachung! A- und B-Problem durch Midazolam auslösbar! (Atemwegssicherung – Antidot Flumazenil sehr kritisch in Erwägung ziehen)"],
    ],
  },
  {
    id: "K16c", title: "Thorakaler Schmerz", page: "K21",
    tags: "Brustschmerz Thoraxschmerz Big Five Lungenembolie Aortendissektion Pneumothorax Boerhaave Morphin",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "o", t: "**BIG FIVE**" },
      { na: 1 },
      { q: "i.v.-Zugang möglich?", b: [
        ["ja", [
          { c: "y", t: "Venöser Zugang\nlangsame VEL-Infusion" },
          { q: "RRsys > 100 mmHg und *HF 50–130/min und SpO₂ > 92 %?", b: [
            ["ja", []],
            ["nein", [{ c: "r", t: "Ärztliche Entscheidung über weitere Maßnahmen" }]],
          ] },
        ]],
        ["nein", [{ n: "→ ärztliche Entscheidung" }]],
      ] },
      { q: "NRS > 5?", b: [
        ["ja", [
          { c: "o", r: ["M16", "M16A"], t: "**bei BIG FIVE: Morphin**\n2 mg langsam > 30 s i.v." },
          { c: "o", r: ["M16", "M16A"], t: "Voraussetzungen erfüllt und keine UAW:\n**Repetition Morphin** nach 3 min mit 2 mg (= 2 ml), max. Gesamtdosis 6 mg" },
        ]],
        ["nein", [{ c: "r", t: "Ärztliche Entscheidung über weitere Maßnahmen" }]],
      ] },
      { c: "r", t: "Ärztliche Entscheidung über weitere Maßnahmen" },
    ],
    info: [
      ["BIG FIVE: Kardial", "ACS-STEMI: retrosternaler dumpfer, drückender, brennender Schmerz · mehrere Minuten anhaltend (sekundenweise anhaltender und/oder bewegungs**ab**hängiger Schmerz meist nicht kardial)"],
      ["BIG FIVE: Lungenembolie", "Meist atemabhängiger, stechender Schmerz · fast immer Begleitsymptome (z. B. Atemnot, Tachykardie)"],
      ["BIG FIVE: Aortendissektion", "Plötzlich auftretende, reißende, z. T. wandernde Thoraxschmerzen"],
      ["BIG FIVE: Boerhaave-Syndrom", "Retrosternaler Vernichtungsschmerz nach Erbrechen"],
      ["BIG FIVE: Pneumothorax", "Plötzlich einsetzende, stechende, atemabhängige Schmerzen"],
    ],
  },
  {
    id: "K16", title: "Starke Schmerzzustände", short: "Schmerz – Übersicht", page: "K22",
    tags: "Schmerz Analgesie NRS Schmerztherapie Übersicht",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "w", t: "Erfassung der Schmerzintensität (NRS/NAS/VAS)" },
      { c: "w", t: "Nichtmedikamentöse Schmerztherapie\n(Lagerung / Ruhigstellung / Zuwendung)" },
      { q: "Pat. > 1 Jahr (10 kg)?", b: [
        ["ja", [
          { c: "w", t: "**Mittelwahl:** aufgrund Substanzklasse, Schmerzursache, Intensität und Vorgabe" },
          { go: "K16a", t: "Abdomineller Schmerz" },
          { go: "K16b", t: "Traumatischer Schmerz" },
          { go: "K16c", t: "Thorakaler Schmerz" },
          { q: "Transportfähigkeit?", b: [
            ["ja", [{ c: "b", t: "Arztkontakt sicherstellen" }]],
            ["nein", [{ na: 1 }]],
          ] },
        ]],
        ["nein", [{ na: 1 }]],
      ] },
    ],
    info: [
      ["Ziel der Analgesie für NotSan", "Schmerzlinderung! (z. B. NRS ≤ 5)"],
      ["Numerische Rating Skala (NRS)", "0 kein Schmerz · 1–2 leichter · 3–4 mittlerer · 5–6 starker · 7–8 sehr starker · 9–10 stärkster vorstellbarer Schmerz"],
    ],
  },
  {
    id: "K17", title: "Opioid-Überdosierung / Opioid-Intoxikation", short: "Opioid-Intoxikation", page: "K23",
    tags: "Opioid Opiat Heroin Fentanyl Überdosis Intoxikation Naloxon Narcanti Atemdepression",
    flow: [
      { c: "w", t: "V. a. Opioid-Überdosierung / Intoxikation?" },
      { c: "w", t: "Lebensbedrohliches ABC-Problem?" },
      { c: "b", t: "Opioid-Zufuhr stoppen" },
      { c: "b", t: "O₂-Gabe 15 l/min" },
      { c: "b", t: "Basisalgorithmus" },
      { q: "Vitalzeichen pathologisch?", b: [
        ["ja", [
          { q: "Opioid-Überdosis im Rahmen einer Analgesie durch den Rettungsdienst?", b: [
            ["ja", [{ c: "o", r: ["M17"], t: "**Naloxon i.v.**\n0,4 mg (1 Amp.) mit 3 ml NaCl 0,9 % aufziehen\n1 ml Bolus" }]],
            ["nein", [
              { na: 1 },
              { q: "i.v.-Zugang möglich?", b: [
                ["ja", [
                  { c: "y", t: "Venöser Zugang\nlangsame VEL-Infusion" },
                  { c: "o", r: ["M17"], t: "**Naloxon i.v.**\n0,4 mg (1 Amp.) mit 3 ml NaCl 0,9 % aufziehen\n1 ml Bolus" },
                ]],
                ["nein", [
                  { c: "o", r: ["M17"], t: "**Naloxon i.m.**\n0,1 mg/10 kgKG" },
                  { n: "oder" },
                  { c: "o", r: ["M17"], t: "**Naloxon nasal**\n0,4 mg (1 Amp.)" },
                ]],
              ] },
            ]],
          ] },
          { q: "Vitalzeichen weiterhin pathologisch?", b: [
            ["ja", [
              { c: "o", t: "Naloxon i.v./nasal in gleicher Dosierung alle 2 min repetieren, max. 0,8 mg" },
              { c: "r", t: "Ärztliche Entscheidung über weitere Maßnahmen, ggf. invasive Beatmung" },
            ]],
            ["nein", []],
          ] },
        ]],
        ["nein", []],
      ] },
      { c: "b", t: "Transport in geeignete Klinik\nÜberwachung: **Cave! Rebound**" },
    ],
    info: [
      ["Frühes Atemwegsmanagement", "Kommandoatmung · Kopf überstrecken/Esmarch-Handgriff · Güdeltubus"],
      ["Monitoring", "Monitoring um Kapnometrie und Atemfrequenz erweitern"],
    ],
  },
  {
    id: "K18", title: "Starke Übelkeit", page: "K24",
    tags: "Übelkeit Erbrechen Emesis Kinetose Reisekrankheit Dimenhydrinat Vomex Ondansetron QTc",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { c: "y", t: "Venöser Zugang\nlangsame **VEL**-Infusion 500 ml" },
      { q: "Kinetose?", b: [
        ["ja", [{ c: "o", r: ["M6"], t: "**Dimenhydrinat**\n(langsam i.v. oder als Kurzinfusion)\nErw./Jugendl.: max. 62 mg\nKinder 6–14 J.: 1,25 mg/kgKG" }]],
        ["nein", [{ c: "o", r: ["M18"], t: "**Ondansetron**\n(langsam i.v.)\nErw./Jugendl.: 0,1 mg/kgKG\nmax. 4 mg" }]],
      ] },
      { n: "Bei unzureichender Wirkung: jeweils anderes Medikament erwägen" },
      { c: "b", t: "**Ausgangsalgorithmus**" },
      { c: "b", t: "Transport in geeignete Zielklinik" },
    ],
    info: [
      ["Starke Übelkeit", "Zu erwartende schwere Einschränkung des Patienten hinsichtlich Compliance und Aspirationsgefahr"],
      ["Kinetose", "Körperliche Reaktion auf ungewohnte Bewegungen, z. B. in Verkehrsmitteln (Reisekrankheit)"],
      ["QTc-Zeit", "**Normwerte:** Männer < 450 ms, Frauen < 460 ms · **verlängert:** Männer > 470 ms, Frauen > 480 ms · **QTc > 500 ms:** hohes Risiko für maligne Arrhythmien wie Torsades de Pointes. Die QTc-Zeit steht im 12-Kanal-EKG-Ausdruck (Gesamtes QTc-Intervall)."],
    ],
  },
  {
    id: "K19", title: "Sepsis – septischer Schock", short: "Sepsis", page: "K25",
    tags: "Sepsis septischer Schock Infektion NEWS2 Fieber Noradrenalin qSOFA",
    flow: [
      { c: "b", t: "Basisalgorithmus" },
      { q: "Patient instabil?", b: [["ja", [{ na: 1 }]], ["nein", []]] },
      { c: "y", t: "Peripher-venöser Zugang und VEL-Infusion" },
      { q: "NEWS-2-Score?", b: [
        ["Score ≤ 4", [
          { q: "Patient stabil?", b: [
            ["ja", [{ c: "b", t: "**Transport in geeignete Zielklinik**" }]],
            ["nein", [{ n: "→ wie Score ≥ 5" }]],
          ] },
        ]],
        ["Score ≥ 5", [
          { c: "w", t: "**Notarztnachforderung kritisch prüfen:**\nRRsys nach Flüssigkeitsgabe ≤ 90 mmHg\nggf. präklinische Laborparameter bewerten" },
          { c: "y", t: "VEL-Infusion 500–1000 ml\nggf. zweiter peripher-venöser Zugang\nO₂-Gabe großzügig" },
          { q: "Patient stabil?", b: [
            ["ja", []],
            ["nein", [
              { na: 1 },
              { c: "r", t: "**Notarzt – Katecholamingabe: Noradrenalin**\nPerfusor: 5 Amp. (5 mg) Norepinephrin + 45 ml NaCl 0,9 %\nStart mit 0,1 µg/kg/min = 5 ml bei 70–80 kgKG\nSteigerung jeweils um 1 ml (Ziel MAD mind. 65 mmHg)" },
            ]],
          ] },
          { c: "w", t: "Nach klinischem Zustand des Patienten:\nggf. Schockraumindikation, nichttraumatologisch" },
          { c: "b", t: "Transport in geeignete Zielklinik" },
        ]],
      ] },
    ],
    info: [
      ["Einstieg", "Patient mit Verdacht auf eine Infektion (z. B. Pneumonie, Harnwegsinfekt, Peritonitis)"],
      ["Mögliche Symptome", "Fieber, auch Hypothermie · Tachypnoe · Tachykardie (HF > 100/min) · Hypotonie (RRsys < 100 mmHg) · Vigilanzminderung"],
      ["NEWS2-Score", [["Parameter", "3", "2", "1", "0", "1", "2", "3"],
        ["Atemfrequenz", "≤ 8", "", "9–11", "12–20", "", "21–24", "≥ 25"],
        ["SpO₂", "≤ 91", "92–93", "94–95", "≥ 96", "", "", ""],
        ["O₂-Bedarf", "", "ja", "", "nein", "", "", ""],
        ["Temperatur", "≤ 35,0", "", "35,1–36,0", "36,1–38,0", "38,1–39,0", "≥ 39,1", ""],
        ["RR systolisch", "≤ 90", "91–100", "101–110", "111–219", "", "", "≥ 220"],
        ["Herzfrequenz", "≤ 40", "", "41–50", "51–90", "91–110", "111–130", "≥ 131"],
        ["Wachheitsgrad", "", "", "", "wach", "", "", "somnolent"]]],
      ["NEWS2-Bewertung", "Punktzahl 0–4: geringes Risiko · 3 in einem einzelnen Parameter: geringes bis mittleres Risiko · 5–6: mittleres Risiko · ≥ 7: hohes Risiko. Je höher die Gesamtpunktzahl, desto höher das Risiko einer klinischen Verschlechterung."],
      ["CAVE", "Jegliche Vorerkrankung bei Score-Erhebung und Laktatmessung berücksichtigen! COPD, Laktatazidose, pneumologische Vorerkrankung, Diabetes, nephrologische Vorerkrankung, Hepatitis, Leberzirrhose, kardiale Vorerkrankung, bek. Tumorleiden, Stoffwechselerkrankungen, Traumata und chirurgische Eingriffe."],
    ],
  },
  {
    id: "K20", title: "Kohlenmonoxid-Vergiftung", short: "CO-Vergiftung", page: "K26",
    tags: "CO Kohlenmonoxid Vergiftung Rauchgas COHb Druckkammer HBO CPAP Sauerstoff",
    flow: [
      { n: "Algorithmus greift nur, wenn von Exposition auszugehen ist" },
      { c: "b", t: "Basisalgorithmus" },
      { q: "Symptomatik?", b: [
        ["keine", [{ c: "b", t: "ggf. Arztkontakt herstellen" }]],
        ["leicht bis moderat", [
          { n: "Kopfschmerzen, Konzentrationsschwierigkeiten, Verwirrung, Sehstörungen, Übelkeit, Schwindel, Erbrechen, Bauchschmerzen" },
          { c: "o", t: "**unabhängig von CO-Messung:**\n**CPAP 5–12 mbar\nPEEP 5 mbar\n100 % Sauerstoff**" },
          { c: "b", t: "Zuweisung geeignete Klinik\n→ ggf. Sekundärverlegung zur Druckkammer" },
        ]],
        ["schwer", [
          { n: "Orientierungsstörungen, Bewusstseinsstörung, Krampfanfall, Angina pectoris, Herzrhythmusstörungen, Dyspnoe, Tachypnoe, Lungenödem, EKG-Veränderungen" },
          { na: 1 },
          { c: "r", t: "**Maßnahmen durch Notarzt**\nggf. ITN\n100 % Sauerstoff\nhoher PEEP" },
          { c: "o", t: "**unabhängig von CO-Messung:**\n**CPAP 5–12 mbar\nPEEP 5 mbar\n100 % Sauerstoff**" },
          { c: "b", t: "Zuweisung geeignete Klinik\n→ ggf. Sekundärverlegung zur Druckkammer" },
        ]],
      ] },
    ],
    info: [
      ["Normalwerte COHb", "< 5 % Nichtraucher · < 10 % Raucher"],
      ["Sauerstoff", "Die Indikation zur Sauerstoffgabe richtet sich nach der Klinik, nicht nach der Sauerstoffsättigung."],
      ["Siehe auch", "U9 Kohlenmonoxid – Maßnahmen/Verhalten"],
    ],
  },
];
