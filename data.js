/* RD Pocket – Inhaltsdaten
   Alle medizinischen Angaben sind Orientierungswerte. Vor Nutzung gegen
   lokale SOPs / ÄLRD-Vorgaben Lahn-Dill prüfen. */

const CONTACT_GROUPS = ["Leitstellen", "Giftnotruf", "RTW-Handys", "Sonstige"];

const DEFAULT_CONTACTS = [
  { group: "Leitstellen", name: "ZLS Lahn-Dill", number: "", note: "Nummer bitte eintragen" },
  { group: "Giftnotruf", name: "GIZ Mainz (zuständig für Hessen)", number: "06131 19240", note: "24 h erreichbar" },
  { group: "RTW-Handys", name: "RTW 1", number: "", note: "Nummer bitte eintragen" },
  { group: "RTW-Handys", name: "RTW 2", number: "", note: "Nummer bitte eintragen" },
];

/* IVENA Hessen – öffentliche Leitstellenansicht. Parameter getestet am 08.11.2026:
   ?auswahl_ueber_pzc=1&pzc=<PZC>&anonymous_oe[]=<Gebiets-ID> */
const IVENA_BASE = "https://www.ivena-hessen.de/leitstellenansicht.php";
const IVENA_REGIONS = [
  [144001, "Lahn-Dill-Kreis"], [98001, "Stadt und Landkreis Gießen"], [143001, "Landkreis Marburg-Biedenkopf"],
  [113001, "Landkreis Limburg-Weilburg"], [61001, "Wetteraukreis"], [107001, "Landkreis Vogelsberg"],
  [59001, "Hochtaunuskreis"], [251001, "Alle Stadt- und Landkreise (Hessen)"],
  [84001, "Landkreis Bergstraße"], [68001, "Landkreis Darmstadt-Dieburg"], [145001, "Landkreis Fulda"],
  [58001, "Landkreis Groß-Gerau"], [146001, "Landkreis Hersfeld-Rotenburg"], [20301, "Landkreis Offenbach"],
  [147001, "Landkreis Schwalm-Eder"], [149001, "Landkreis Waldeck-Frankenberg"], [148001, "Landkreis Werra-Meißner"],
  [57001, "Main-Kinzig-Kreis"], [49001, "Main-Taunus-Kreis"], [141001, "Odenwaldkreis"],
  [100001, "Rheingau-Taunus-Kreis"], [80001, "Stadt Darmstadt"], [20101, "Stadt Frankfurt am Main"],
  [20201, "Stadt Offenbach am Main"], [82001, "Stadt Wiesbaden"], [52001, "Stadt und Landkreis Kassel"],
];

/* PZC = RMI (3) + Alter (2) + Dringlichkeit (1)
   Quelle: PZC-Liste „Brandenburg / Bund“ V1.0 (Netzwerk 112, gültig ab 12.12.2022).
   Gegen die aktuelle IVENA-Liste des RD-Bereichs Lahn-Dill abgleichen! */
const PZC_URGENCY = [
  { d: 1, label: "Notfall / sofort", desc: "Sofortige Intervention im KH, sofortiger Arztkontakt (z. B. Schockraum, Stroke Unit)", cls: "u1" },
  { d: 2, label: "Stationär", desc: "Stationäre Aufnahme wahrscheinlich, kein unmittelbarer Handlungsbedarf (> 24 h)", cls: "u2" },
  { d: 3, label: "Ambulant", desc: "Vermutlich ambulant ausreichend oder Ausschlussdiagnostik (< 24 h)", cls: "u3" },
];

const RMI = [
  ["Reanimation", [
    [131, "Reanimation laufend / intermittierend"], [132, "Reanimation ROSC"],
    [133, "Reanimation Trauma laufend / intermittierend"], [134, "Reanimation Hypothermie"]]],
  ["Trauma – mehrfach", [
    [211, "Polytrauma mit SHT"], [212, "Polytrauma ohne SHT"], [213, "Schockraumindikation nach Unfallhergang"],
    [214, "Mehrfachverletzung sonstige"], [215, "Mehrfachverletzung mit Augen"], [219, "Oberflächliche Verletzungen (bel. Lokalisation)"]]],
  ["Trauma – Gesicht / Kopf", [
    [221, "SHT offen"], [222, "SHT geschlossen"], [223, "Gesichtsverletzung"], [224, "Kopfverletzung"], [225, "Augenverletzung"]]],
  ["Trauma – Thorax", [
    [231, "Thorax penetrierend"], [232, "Thorax geschlossen / stumpf"], [233, "Pneumothorax traumatisch"]]],
  ["Trauma – Abdomen", [
    [241, "Abdomen penetrierend"], [242, "Abdomen geschlossen / stumpf"], [243, "Akutes Abdomen (nicht Trauma)"]]],
  ["Wirbelsäule", [
    [251, "Verl. Wirbelsäule mit neurol. Ausfällen"], [252, "Verl. Wirbelsäule ohne neurol. Ausfälle"],
    [253, "Rückenschmerzen akut mit neurolog. Symptomatik"], [254, "Rückenschmerzen nicht traumatisch ohne neurol. Ausfälle"],
    [255, "Lähmung / Querschnitt akut (nicht Stroke)"]]],
  ["Trauma – Becken / Urogenital", [
    [261, "Becken offen"], [262, "Becken geschlossen"], [263, "Urogenitaltrauma (isoliert)"]]],
  ["Trauma – Extremitäten / Hand", [
    [271, "Extremitäten offen"], [272, "Extremitäten geschlossen"], [273, "Hüft- / Schenkelhalsfraktur"],
    [274, "Verl. Extremität mit Gefäß-/Nervenverletzung"], [275, "Handverletzung"], [276, "Fingeramputation"],
    [277, "Hand- / Extremitätenamputation"]]],
  ["Physikalisch / chemisch", [
    [281, "Verbrennung / Verbrühung"], [282, "Verätzung"], [283, "Hochspannungstrauma"],
    [284, "Barotrauma / Tauchunfall / Dekompression"], [285, "Strahlentrauma"], [286, "Hitzeerschöpfung / Hitzschlag"],
    [287, "Unterkühlung / Erfrierung"], [288, "(Beinahe-)Ertrinken / Badeunfall"]]],
  ["Gefäß", [
    [291, "Aortenaneurysma"], [292, "Extremitätenischämie (akut)"], [293, "Aorta-ascendens-Dissektion (bestätigt)"],
    [299, "Gefäßchirurgischer Notfall, sonstiger"]]],
  ["Atmung / Lunge", [
    [311, "Atemnot (unklar) / Atembeschwerden / ARI"], [312, "Obstruktion (Asthma / COPD)"], [313, "Hämoptoe / Hämoptysen"],
    [314, "(Bolus-)Aspiration"], [315, "Bronchitis / Pneumonie"], [316, "Hyperventilation"],
    [317, "Lungenödem (nicht kardial)"], [318, "Spontanpneumothorax"], [319, "Pneumologischer Notfall, sonstiger"]]],
  ["Innere (sonstige)", [
    [321, "Anaphylaxie / Unverträglichkeitsreaktion"], [322, "Synkope / Kollaps"], [323, "Hypotonie"], [324, "Thrombose"],
    [325, "Unklares Fieber"], [326, "Exsikkose"], [329, "Internistischer Notfall, sonstiger"]]],
  ["Brustschmerz", [
    [331, "Unklarer Brust- / Thoraxschmerz"], [332, "STEMI / „OMI“"], [333, "NSTEMI, instabile AP"]]],
  ["Herz / Kreislauf", [
    [341, "Arrhythmie"], [342, "Bradykardie"], [343, "Tachykardie"], [344, "Elektrounfall (Schwachstrom)"],
    [345, "Hypertensiver Notfall / Krise"], [346, "Kardiogener Schock"], [347, "Herzinsuffizienz"], [348, "Lungenembolie"],
    [349, "Kardiologischer Notfall, sonstiger"]]],
  ["Abdomen (Erkrankung)", [
    [351, "GI-Blutung"], [353, "Bauchschmerzen"], [354, "Gastroenteritis"], [359, "Gastroenterologischer Notfall, sonstiger"]]],
  ["Intoxikationen", [
    [360, "Rauchgas / Reizgas (nicht CO)"], [361, "Alkohol"], [362, "Drogen / Rauschgift"], [363, "Sonstige Intoxikation"],
    [364, "Lebensmittel"], [365, "Medikamente"], [366, "Pflanzenschutzmittel"], [367, "Tierische Gifte"], [368, "Giftpflanzen"],
    [369, "Inhalative Intoxikation, sonstige"], [370, "Kohlenmonoxid-Vergiftung"]]],
  ["Spezielle Infektionen", [
    [371, "Meningitis / Enzephalitis"], [372, "TBC"], [373, "Sepsis (Infekt + qSOFA ≥ 2)"], [374, "Septischer Schock"],
    [375, "Hochkontagiöse Erkrankung (Sonderiso)"], [376, "Akute Infektionskrankheit (bestätigt)"],
    [377, "Akute Infektionskrankheit (nicht bestätigt)"], [378, "Infektionskrankheit zur Quarantäne"],
    [379, "Infektiologischer Notfall, sonstiger"]]],
  ["Stoffwechsel", [
    [391, "Akuter endokrinologischer Notfall"], [392, "Hyperglykämie"], [393, "Hypoglykämie"]]],
  ["Neurologisch", [
    [411, "Anhaltender epileptischer Anfall"], [412, "Epileptischer Anfall (stattgehabt)"],
    [413, "Kopf- / Gesichtsschmerz"], [414, "Vigilanzminderung / Koma (ohne Trauma)"], [415, "Schwindel"],
    [419, "Neurologischer Notfall, sonstiger"], [421, "Schlaganfall / Blutung < 24 h oder unklar"],
    [423, "Schlaganfall / Blutung > 24 h"], [425, "Diagnostizierter zerebraler Gefäßverschluss zur Thrombektomie"]]],
  ["Psychiatrisch", [
    [431, "Suizid, angedroht"], [432, "Einweisung, psychiatrische"], [433, "Einweisung (nach PsychKHG)"],
    [434, "Einweisung (nach PsychKHG) mit Fixierung"], [435, "Akute Verwirrtheit / Delir"]]],
  ["Pädiatrisch", [
    [511, "Pädiatrisch – Atemnot"], [512, "Schwerer Husten (Pseudokrupp)"], [513, "Pädiatrisch – Fieberkrampf"],
    [519, "Pädiatrischer Notfall, sonstiger"]]],
  ["Geburtshilfe – präklinische Geburt", [
    [521, "< 16 SSW"], [522, "16+0 – 21+6 SSW"], [523, "22+0 – 28+6 SSW"], [524, "29+0 – 31+6 SSW"],
    [525, "32+0 – 35+6 SSW / Wachstumsstörung"], [526, "ab 36+0 SSW"], [527, "ab 36+0 SSW bei Diabetes"],
    [528, "Drillinge bis 32+6 SSW, > 3 Mehrlinge"], [529, "Drillinge ab 33+0 SSW"]]],
  ["Geburtshilfe – einsetzende Geburt", [
    [530, "Akute fetale Gefährdung (Erstversorgung ggf. ungeeignete Klinik)"],
    [531, "< 16 SSW"], [532, "16+0 – 21+6 SSW"], [533, "22+0 – 28+6 SSW"], [534, "29+0 – 31+6 SSW"],
    [535, "32+0 – 35+6 SSW / Wachstumsstörung"], [536, "ab 36+0 SSW"], [537, "ab 36+0 SSW bei Diabetes"],
    [538, "Drillinge bis 32+6 SSW, > 3 Mehrlinge"], [539, "Drillinge ab 33+0 SSW"]]],
  ["Geburtshilfe – Notfall in der SS", [
    [540, "Akute fetale Gefährdung (Erstversorgung ggf. ungeeignete Klinik)"],
    [541, "< 16 SSW"], [542, "16+0 – 21+6 SSW"], [543, "22+0 – 28+6 SSW"], [544, "29+0 – 31+6 SSW"],
    [545, "32+0 – 35+6 SSW / Wachstumsstörung"], [546, "ab 36+0 SSW"], [547, "ab 36+0 SSW bei Diabetes"],
    [548, "Drillinge bis 32+6 SSW, > 3 Mehrlinge"], [549, "Drillinge ab 33+0 SSW"]]],
  ["Gynäkologisch", [
    [551, "Vaginale Blutung"], [552, "Unterbauchschmerzen"], [553, "Sexualdelikt"], [559, "Gynäkologischer Notfall, sonstiger"]]],
  ["Haut / Urologie", [
    [701, "Haut- und Geschlechtskrankheiten"], [711, "Nieren- / Harnleiterkolik"], [712, "Hodenschmerz"],
    [713, "Harnverhalt (akut)"], [714, "Hämaturie"], [715, "Katheterwechsel (transurethral)"],
    [716, "Katheterwechsel (suprapubisch)"], [717, "Katheterverlust / -verstopfung"], [718, "Harnwegsinfekt"],
    [719, "Urologischer Notfall, sonstiger"]]],
  ["Augen / HNO / MKG", [
    [721, "Akute Augenerkrankung"], [729, "Augennotfall, sonstiger"], [731, "Nasenbluten unstillbar"],
    [732, "(Nach-)Blutung HNO, akut"], [733, "Tracheostoma-Komplikation"], [739, "HNO-Notfall, sonstiger"],
    [749, "Mund-Kiefer-Gesicht-Notfall, sonstiger"]]],
  ["Sonstige", [
    [751, "Geriatrische Einweisung"], [779, "Sonstige Notfallsituationen"],
    [801, "Schmerz / Schwellung Bewegungsapparat (nicht traumatisch)"], [802, "Schwellung / Abszess, sonstige Lokalisation"],
    [809, "Allgemeinmedizin, sonstiger Notfall"]]],
];

/* Kliniken für die Navigation (Koordinaten ungefähr, in den Einstellungen änderbar). */
const DEFAULT_HOSPITALS = [
  { name: "Klinikum Wetzlar", city: "Wetzlar", lat: 50.5585, lon: 8.5040 },
  { name: "BDH-Klinik Braunfels", city: "Braunfels", lat: 50.5150, lon: 8.3890 },
  { name: "Dill-Kliniken Dillenburg", city: "Dillenburg", lat: 50.7395, lon: 8.2870 },
  { name: "Universitätsklinikum Gießen (UKGM)", city: "Gießen", lat: 50.5747, lon: 8.6637 },
  { name: "Universitätsklinikum Marburg (UKGM)", city: "Marburg", lat: 50.8167, lon: 8.8086 },
  { name: "Ev. Krankenhaus Mittelhessen", city: "Gießen", lat: 50.5876, lon: 8.6710 },
  { name: "St. Josefs Krankenhaus Balserische Stiftung", city: "Gießen", lat: 50.5800, lon: 8.6850 },
  { name: "Asklepios Klinik Lich", city: "Lich", lat: 50.5215, lon: 8.8160 },
  { name: "Kreisklinik Biedenkopf", city: "Biedenkopf", lat: 50.9137, lon: 8.5313 },
  { name: "St. Vincenz-Krankenhaus Limburg", city: "Limburg", lat: 50.3870, lon: 8.0700 },
];

/* Kinder – Orientierungswerte (angelehnt an PALS / gängige Kitteltaschenkarten) */
const PEDS_TABLE = [
  { age: "Neugeborenes", hf: "110–160", af: "30–60", rr: "60–80", kg: "3–4", },
  { age: "Säugling (1–12 Mon.)", hf: "100–160", af: "30–50", rr: "70–95", kg: "4–10" },
  { age: "Kleinkind (1–3 J.)", hf: "90–150", af: "24–40", rr: "80–100", kg: "10–14" },
  { age: "Vorschulkind (3–6 J.)", hf: "80–140", af: "22–34", rr: "90–110", kg: "14–20" },
  { age: "Schulkind (6–12 J.)", hf: "70–120", af: "18–30", rr: "90–120", kg: "20–40" },
  { age: "Jugendlicher (> 12 J.)", hf: "60–100", af: "12–20", rr: "100–130", kg: "> 40" },
];

const SCHEMES = [
  {
    id: "xabcde", title: "xABCDE", sub: "Strukturierte Patientenversorgung",
    items: [
      ["x", "eXsanguinating hemorrhage", "Lebensbedrohliche äußere Blutung sofort stoppen: Druck, Packing, Druckverband, Tourniquet."],
      ["A", "Airway (+ HWS)", "Atemweg frei? Fremdkörper, Schwellung, Geräusche. Atemweg sichern. Bei Trauma HWS mitdenken."],
      ["B", "Breathing", "AF, SpO₂, Atemmuster, Thoraxbewegung, Auskultation, Zyanose. O₂ nach Bedarf, ggf. Beatmung, Entlastung."],
      ["C", "Circulation", "Puls (Frequenz, Qualität), RR, Rekap-Zeit, Hautkolorit, EKG. Innere Blutung? Zugang, Volumen."],
      ["D", "Disability", "GCS / AVPU, Pupillen, BZ, Motorik/Sensibilität, FAST-4D, Schmerz."],
      ["E", "Exposure / Environment", "Entkleiden & Bodycheck, Temperatur, Wärmeerhalt, Umfeld, Begleitumstände."],
    ],
  },
  {
    id: "sampler", title: "SAMPLER", sub: "Anamnese",
    items: [
      ["S", "Symptome", "Was ist das Hauptproblem? Seit wann?"],
      ["A", "Allergien", "Medikamente, Lebensmittel, Latex …"],
      ["M", "Medikamente", "Dauermedikation, Bedarf, Antikoagulation, Neues."],
      ["P", "Patientengeschichte", "Vorerkrankungen, OPs, Schwangerschaft."],
      ["L", "Letzte …", "Letzte Mahlzeit / Flüssigkeit, Stuhlgang, Wasserlassen, Periode."],
      ["E", "Ereignis", "Was ist passiert? Auslöser, Hergang."],
      ["R", "Risikofaktoren", "Rauchen, Alkohol/Drogen, Familie, Reisen, soziales Umfeld."],
    ],
  },
  {
    id: "opqrst", title: "OPQRST", sub: "Schmerzanamnese",
    items: [
      ["O", "Onset", "Beginn: plötzlich oder schleichend? Was haben Sie gerade gemacht?"],
      ["P", "Provocation / Palliation", "Was verstärkt, was lindert? Bewegung, Atmung, Lage, Nitro?"],
      ["Q", "Quality", "Wie fühlt es sich an? Stechend, brennend, drückend, ziehend, kolikartig?"],
      ["R", "Region / Radiation", "Wo genau? Ausstrahlung?"],
      ["S", "Severity", "Stärke (NRS 0–10)."],
      ["T", "Time", "Seit wann? Dauerhaft oder wellenförmig? Schon einmal gehabt?"],
    ],
  },
  {
    id: "fast4d", title: "FAST-4D", sub: "Schlaganfall – konsentiertes Konzept Mittelhessen (UKGM)",
    items: [
      ["F", "Face", "Lächeln lassen: Hängt eine Gesichtshälfte herunter?"],
      ["A", "Arm", "Beide Arme heben, Handflächen nach oben: Sinkt ein Arm / dreht eine Hand nach innen?"],
      ["S", "Speech", "Einfachen Satz nachsprechen: undeutlich oder nicht möglich?"],
      ["T", "Time", "Symptombeginn < 24 h oder unklar? Last seen well erfragen!"],
      ["D", "Doppelbilder", "Finger links–rechts / oben–unten verfolgen: Doppelbilder?"],
      ["D", "Gesichtsfelddefekt", "Ausfall des Gesichtsfeldes oder auf einem Auge blind?"],
      ["D", "Dreh-/Schwankschwindel", "Plötzlicher Schwindel, Gefühl wie im Aufzug, Fallneigung zur Seite?"],
      ["D", "Dysmetrie / Ataxie", "Finger-Nase mit geschlossenen Augen: unsicher / verfehlt die Nase?"],
    ],
    note: "Beginn ≤ 24 h → nächste Stroke Unit · > 24 h → nächste freie Stroke Unit · FAST4D ≥ 4 ggf. direkt endovaskuläres Zentrum. Anamnese nach STROKE: Symptombeginn, Time last seen well, Risikofaktoren, Orale Antikoagulation, Kontaktdaten Angehörige, Einnahme Medikamente.",
  },
  {
    id: "skips", title: "S-KIPS", sub: "Indikation Beckenschlinge (ersetzt KISS)",
    items: [
      ["S", "Schock", "Pflichtkriterium: hämodynamische Instabilität."],
      ["K", "Kinematik", "Unfallmechanismus mit möglicher Beckenbeteiligung."],
      ["I", "Inspektion", "Sichtbare Beckenverletzung, Fehlstellung, Prellmarken."],
      ["P", "Palpation", "Auffälliger Tastbefund (vorsichtig, keine Kompressions-Wiederholung)."],
      ["S", "Schmerzen", "Schmerzen im Beckenbereich."],
    ],
    note: "Schock + mindestens ein weiteres Kriterium aus K-I-P-S → Beckenschlinge (Höhe Trochanter major, Beine leicht innenrotieren).",
  },
  {
    id: "nexus", title: "NEXUS-Kriterien", sub: "HWS-Immobilisation / Bildgebung nötig?",
    items: [
      ["N", "Neurologie", "Kein fokal-neurologisches Defizit."],
      ["E", "Ebriety", "Keine Intoxikation (Alkohol / Drogen)."],
      ["X", "eXtreme distracting injury", "Keine ablenkende, schmerzhafte Verletzung."],
      ["U", "Unaltered mental status", "Normaler Bewusstseinszustand (wach, orientiert)."],
      ["S", "Spine tenderness", "Kein Druckschmerz über der HWS-Mittellinie."],
    ],
    note: "Nur wenn ALLE 5 Kriterien erfüllt sind, ist eine HWS-Verletzung unwahrscheinlich. Ist eines nicht erfüllt → HWS-Verletzung möglich, nach lokalem Algorithmus vorgehen.",
  },
];
