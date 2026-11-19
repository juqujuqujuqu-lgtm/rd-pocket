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
  { name: "St. Vincenz-Krankenhaus Limburg", city: "Limburg", lat: 50.3870, lon: 8.0700 },
  ...SIEGEN_HOSPITALS(),
];
function SIEGEN_HOSPITALS() {
  return [
    { name: "St. Marien-Krankenhaus Siegen", city: "Siegen", lat: 50.8791, lon: 8.0298 },
    { name: "Diakonie Klinikum Jung-Stilling", city: "Siegen", lat: 50.8517, lon: 8.0179 },
    { name: "Kreisklinikum Siegen", city: "Siegen-Weidenau", lat: 50.9030, lon: 8.0203 },
  ];
}
/* Fachabteilungen & Notfall-Kompetenzen (recherchiert 11/2026 von den Klinik-Websites, ohne Gewähr).
   caps: Wert 1 = vorhanden, 0 = nicht vorhanden/nicht gelistet, null bzw. fehlend = unbekannt;
   als Objekt { v, d } mit Detailtext. */
const HOSP_CAPS = [
  ["zna", "Notaufnahme"], ["hkl", "Herzkatheter"], ["cpu", "Chest Pain Unit"], ["stroke", "Stroke Unit"],
  ["thromb", "Thrombektomie"], ["trauma", "Traumazentrum"], ["nch", "Neurochirurgie"], ["paed", "Kinderklinik"],
  ["geb", "Geburtshilfe"], ["psych", "Psychiatrie"], ["gefaess", "Gefäßchirurgie"], ["its", "Intensivstation"], ["heli", "Hubschrauber-Landeplatz"],
];
const HOSPITAL_INFO = {
  "Klinikum Wetzlar": {
    caps: { zna: { v: 1, d: "rund um die Uhr, Schockraum" }, hkl: { v: 1, d: "Herzkatheterzentrum, 3 Messplätze (24/7 nicht angegeben)" }, stroke: { v: 1, d: "zertifiziert, 16 Monitorplätze" },
      trauma: { v: 1, d: "regional (DGU)" }, nch: 0, paed: 0, geb: 1, psych: 0, gefaess: { v: 1, d: "Gefäßzentrum, Angiologie" }, its: 1 },
    depts: ["Allgemeine, Viszerale und Onkologische Chirurgie", "Anästhesiologie und Intensivmedizin", "Angiologie", "Diagnostische und Interventionelle Radiologie", "Gefäßchirurgie", "Gynäkologie und Geburtshilfe", "Hämatologie / Onkologie und Palliativmedizin", "Medizinische Klinik I (Kardiologie, Angiologie, Pulmologie, Nephrologie, Dialyse, Intensivmedizin)", "Medizinische Klinik II (Gastroenterologie, Endoskopie)", "Neurologie mit Stroke Unit", "Plastische, Ästhetische und Handchirurgie", "Strahlentherapie und Radioonkologie", "Unfallchirurgie und Orthopädie", "Urologie, Kinderurologie und Urologische Onkologie", "Zentrale Notaufnahme"],
    centers: ["Regionales Traumazentrum", "Gefäßzentrum Wetzlar", "Brustzentrum Lahn-Dill", "Onkologisches Zentrum Lahn-Dill", "Mittelhessisches Darmzentrum", "Endoprothetikzentrum"],
    src: "lahn-dill-kliniken.de",
  },
  "BDH-Klinik Braunfels": {
    caps: { stroke: { v: 1, d: "6 zertifizierte Überwachungsbetten, CT/MRT rund um die Uhr, Lyse" }, trauma: 0, paed: 0, geb: 0, psych: 0, gefaess: 0, its: 1 },
    depts: ["Neurologische Akutbehandlung", "Stroke Unit", "Intensivmedizin", "Neurologische Frührehabilitation (Phase B)", "Neurologische Rehabilitation"],
    note: "Neurologisches Fachkrankenhaus – keine allgemeine Notaufnahme angegeben.",
    src: "bdh-klinik-braunfels.de",
  },
  "Dill-Kliniken Dillenburg": {
    caps: { zna: { v: 1, d: "Manchester-Triage, Schockraum" }, stroke: 0, trauma: { v: 1, d: "lokal (DGU)" }, nch: 0, paed: 0, geb: 0, psych: 0, gefaess: 1, its: 1 },
    depts: ["Allgemeine, Viszerale und Onkologische Chirurgie", "Anästhesie, Intensiv- und Notfallmedizin", "Augenheilkunde", "Gefäßchirurgie", "Innere Medizin", "Orthopädie und Unfallchirurgie", "Radiologie Lahn-Dill", "Stationäre Schmerztherapie", "Urologie", "Zentrale Notaufnahme"],
    centers: ["Lokales Traumazentrum"],
    src: "lahn-dill-kliniken.de",
  },
  "Universitätsklinikum Gießen (UKGM)": {
    caps: { zna: { v: 1, d: "rund um die Uhr; Kinder-, geburtshilfliche und Herznotfälle in den Spezialabteilungen" }, hkl: { v: 1, d: "Kardiologie-Angiologie mit Intensivstation (24/7 nicht explizit angegeben)" },
      stroke: { v: 1, d: "zertifiziert, überregionales neurovaskuläres Zentrum" }, trauma: { v: 1, d: "überregional (DGU), AltersTraumaZentrum, SAV" }, nch: 1,
      paed: { v: 1, d: "Kinderklinik inkl. Neonatologie, Kinderchirurgie, Kinderherzzentrum" }, geb: 1, psych: 1, gefaess: { v: 1, d: "Herz-, Kinderherz- und Gefäßchirurgie" }, its: { v: 1, d: "inkl. ARDS-/ECMO-Center" } },
    depts: ["Allgemein-, Viszeral-, Thorax- und Transplantationschirurgie", "Unfall-, Hand- und Wiederherstellungschirurgie", "Herz-, Kinderherz- und Gefäßchirurgie", "Neurochirurgie", "Orthopädie und Orthopädische Chirurgie", "Mund-, Kiefer- und Gesichtschirurgie", "Urologie, Kinderurologie und Andrologie", "Anästhesiologie und operative Intensivmedizin", "Kardiologie-Angiologie", "Pneumologie, Gastroenterologie, Nephrologie, internistische Intensivmedizin", "Endokrinologie, Diabetologie, Stoffwechsel", "Hämatologie-Onkologie", "Infektiologie", "Neurologie", "Neuroradiologie", "Psychiatrie und Psychotherapie", "Psychosomatik und Psychotherapie", "Allgemeine Pädiatrie und Neonatologie", "Pädiatrische Kardiologie und Intensivmedizin", "Kinderchirurgie", "Pädiatrische Neurologie", "Pädiatrische Hämatologie und Onkologie", "Frauenheilkunde und Geburtshilfe", "Augenheilkunde", "HNO", "Dermatologie und Allergologie", "Radiologie, Strahlentherapie, Nuklearmedizin"],
    centers: ["Überregionales Traumazentrum", "Neurovaskuläres Zentrum", "Kinderherzzentrum", "ARDS-ECMO Center", "Transplantationszentrum"],
    phone: [["Vermittlung", "0641 985-52900"]],
    src: "ukgm.de",
  },
  "Universitätsklinikum Marburg (UKGM)": {
    caps: { zna: { v: 1, d: "Zentrum für Notfallmedizin, Kinder-Notaufnahme integriert" }, hkl: { v: 1, d: "Kardiologie, Cardiac Arrest Center (24/7 nicht explizit angegeben)" },
      trauma: { v: 1, d: "überregional (DGU), 2 Schockräume" }, nch: { v: 1, d: "inkl. Schädelbasiszentrum" }, paed: { v: 1, d: "Kinder- und Jugendmedizin, Kinderchirurgie" },
      geb: { v: 1, d: "Perinatalzentrum Level I" }, psych: { v: 1, d: "inkl. Kinder- und Jugendpsychiatrie" }, gefaess: 1, its: 1 },
    depts: ["Visceral-, Thorax- und Gefäßchirurgie", "Orthopädie und Unfallchirurgie", "Herz- und thorakale Gefäßchirurgie", "Neurochirurgie", "Urologie", "Mund-, Kiefer- und Gesichtschirurgie", "Anästhesiologie und operative Intensivmedizin", "Kardiologie", "Pneumologie", "Gastroenterologie, Endokrinologie, Infektiologie", "Hämatologie, Onkologie und Immunologie", "Nephrologie", "Neurologie", "Neuroradiologie", "Psychiatrie und Psychotherapie", "Psychosomatik", "Kinder- und Jugendmedizin", "Kinder- und Jugendpsychiatrie", "Kinderchirurgie und Kinderurologie", "Frauenheilkunde und Geburtshilfe", "Augenheilkunde", "HNO", "Dermatologie", "Radiologie, Strahlentherapie, Nuklearmedizin"],
    centers: ["Zentrum für Notfallmedizin", "Überregionales Traumazentrum", "Perinatalzentrum Level I", "Cardiac Arrest Center", "Epilepsiezentrum", "Schädelbasiszentrum"],
    src: "ukgm.de",
  },
  "Ev. Krankenhaus Mittelhessen": {
    caps: { zna: { v: 1, d: "Klinik für Akut- und Notfallmedizin, 24 h" }, hkl: { v: 1, d: "24-h-Rufdienst, 2 Linksherzkatheter-Messplätze" }, trauma: { v: 1, d: "DGU-Siegel (Stufe nicht angegeben), Alterstraumazentrum" },
      nch: 0, paed: 0, geb: 0, psych: 0, gefaess: 1, its: { v: 1, d: "inkl. IMC und Weaning" } },
    depts: ["Klinik für Akut- und Notfallmedizin", "Allgemein-, Viszeral- und Endokrine Chirurgie", "Gefäßchirurgie", "Orthopädie, Unfallchirurgie und Wirbelsäulenchirurgie", "Plastische, Ästhetische, Rekonstruktive und Handchirurgie", "Medizinische Klinik I: Gastroenterologie, Diabetologie, Geriatrie", "Medizinische Klinik II: Kardiologie und Angiologie", "Medizinische Klinik III: Pneumologie", "Anästhesie, Intensivmedizin und Schmerztherapie", "Interventionelle Radiologie", "Urologie (Belegabteilung)"],
    centers: ["Alterstraumatologisches Zentrum"],
    phone: [["Notaufnahme", "0641 9606-260"]],
    src: "ekm-gi.de",
  },
  "St. Josefs Krankenhaus Balserische Stiftung": {
    caps: { geb: 1, its: 1 },
    depts: ["Innere Medizin und Intensivmedizin", "Geriatrie (inkl. Alterstraumatologie, Tagesklinik)", "Chirurgie", "Orthopädie", "Frauenheilkunde und Geburtshilfe", "Anästhesie und operative Intensivmedizin", "HNO"],
    note: "Website nicht erreichbar – Angaben aus Klinikverzeichnissen (krankenhaus.de, klinikradar.de), bitte prüfen.",
    src: "krankenhaus.de",
  },
  "St. Vincenz-Krankenhaus Limburg": {
    caps: { zna: { v: 1, d: "rund um die Uhr, umfassende Notfallversorgung (Stufe 3), Schockraum" }, hkl: { v: 1, d: "24-h-Bereitschaft, Cardiac Arrest Center" },
      stroke: { v: 1, d: "regional, 10 Betten" }, trauma: { v: 1, d: "regional (DGU)" }, nch: 0, paed: { v: 1, d: "Kinder- und Jugendmedizin mit Neonatologie" },
      geb: { v: 1, d: "perinataler Schwerpunkt, ab 32+0 SSW" }, psych: 0, gefaess: { v: 1, d: "zertifiziertes Gefäßzentrum" }, its: 1 },
    depts: ["Allgemein- und Viszeralchirurgie, Proktologie", "Anästhesie und Intensivmedizin", "Diagnostische und Interventionelle Radiologie", "Frauenklinik inkl. Geburtshilfe", "Gastroenterologie, Diabetologie und Hepatologie", "Gefäßchirurgie, vaskuläre und endovaskuläre Chirurgie", "HNO (Belegabteilung)", "Hämatologie, Internistische Onkologie und Palliativmedizin", "Kardiologie, Pneumologie und Internistische Intensivmedizin", "Kinder- und Jugendmedizin", "Neurologie mit Stroke Unit", "Nephrologie und Hypertensiologie", "Strahlentherapie und Radioonkologie", "Urologie und Kinderurologie", "Zentrum für Orthopädie und Traumatologie", "Zentrale Notaufnahme"],
    centers: ["Regionales Traumazentrum", "Regionale Stroke Unit", "Cardiac Arrest Center", "Gefäßzentrum", "Brustzentrum"],
    src: "st-vincenz.de",
  },
  "St. Marien-Krankenhaus Siegen": {
    caps: { zna: { v: 1, d: "rund um die Uhr, 18 Plätze, Schockraum" }, hkl: { v: 1, d: "24/7-Messplatz, 3 Herzkatheterlabore" }, cpu: 1, nch: 0, paed: 0,
      geb: { v: 1, d: "über 1.200 Geburten/Jahr" }, psych: 0, gefaess: { v: 1, d: "Sektion im Herz- und Gefäßzentrum" }, its: { v: 1, d: "interdisziplinär" }, heli: { v: 1, d: "24 h nutzbar" } },
    depts: ["Kardiologie, Angiologie und internistische Intensivmedizin", "Kardiologie, Rhythmologie und Elektrophysiologie", "Allgemeine Innere Medizin, Gastroenterologie und Diabetologie", "Hämatologie, Medizinische Onkologie und Palliativmedizin", "Orthopädie, Unfallchirurgie und Sportverletzungen", "Allgemein- und Viszeralchirurgie", "Gynäkologie und Geburtshilfe", "Anästhesie, Intensiv-, Notfall- und Schmerzmedizin", "Radio-Onkologie und Strahlentherapie", "Diagnostische und interventionelle Radiologie", "Nuklearmedizin (Beleg)", "Zentrale Notaufnahme"],
    centers: ["Herz- und Gefäßzentrum", "Chest Pain Unit", "Brustzentrum Siegen-Olpe"],
    phone: [["Zentrale", "0271 231-0"]],
    src: "marien-kliniken.de",
  },
  "Diakonie Klinikum Jung-Stilling": {
    caps: { zna: { v: 1, d: "365 Tage rund um die Uhr" }, hkl: { v: 1, d: "Herzkatheterlabore (24/7 nicht angegeben)" }, trauma: { v: 1, d: "überregional (DGU)" },
      nch: { v: 1, d: "inkl. Neurovaskuläres Zentrum (DGNC)" }, paed: { v: 1, d: "keine Kinderklinik, aber Neugeborenen-Intensivstation" }, geb: { v: 1, d: "Perinatalzentrum Level 1" },
      psych: 0, gefaess: { v: 1, d: "inkl. Aortenzentrum Südwestfalen" }, its: 1, heli: 1 },
    depts: ["Allgemein- und Viszeralchirurgie", "Anästhesiologie, Intensiv- und Notfallmedizin", "Unfall- und Wiederherstellungschirurgie", "Neurochirurgie", "Gefäßchirurgie", "Mund-, Kiefer- und Gesichtschirurgie", "HNO-Heilkunde", "Urologie und Robotische Urologie", "Medizinische Klinik I: Gastroenterologie", "Medizinische Klinik II: Kardiologie, Angiologie, Rhythmologie", "Medizinische Klinik III: Onkologie, Hämatologie, Palliativmedizin", "Geriatrie", "Geburtshilfe und Pränatalmedizin", "Gynäkologie und gynäkologische Onkologie", "Radiologie", "Neuroradiologie", "Zentrale Notaufnahme"],
    centers: ["Überregionales Traumazentrum", "Perinatalzentrum Level 1", "Neurovaskuläres Zentrum", "Aortenzentrum Südwestfalen", "Alterstraumazentrum", "Wirbelsäulenzentrum"],
    phone: [["Notaufnahme", "0271 333-4513"]],
    src: "jung-stilling.de",
  },
  "Kreisklinikum Siegen": {
    caps: { zna: { v: 1, d: "24/7, ca. 40.000 Pat./Jahr, Schockraum" }, hkl: { v: 1, d: "24/7 bei Herzinfarkt" }, stroke: { v: 1, d: "überregional" }, thromb: 1,
      trauma: { v: 1, d: "regional (DGU), VAV" }, nch: { v: 0, d: "keine eigene NCH – Neurotraumatologie und Wirbelsäulenchirurgie" },
      paed: { v: 0, d: "→ DRK-Kinderklinik Siegen" }, geb: { v: 0, d: "→ St. Marien-Krankenhaus" }, psych: { v: 1, d: "Zentrum für seelische Gesundheit" }, gefaess: 0, its: 1 },
    depts: ["Anästhesie, Intensivmedizin, Schmerztherapie und Notfallmedizin", "Medizinische Klinik I: Allgemeine Innere Medizin und Gastroenterologie", "Medizinische Klinik II: Lungenklinik", "Medizinische Klinik III: Kardiologie und Internistische Intensivmedizin", "Neurologie mit überregionaler Stroke Unit", "Geriatrie", "Unfallchirurgie, Orthopädie, Handchirurgie und Sportmedizin", "Neurotraumatologie und Wirbelsäulenchirurgie", "Thoraxchirurgie", "Viszeralmedizinische Chirurgie, Adipositaschirurgie", "Plastische, Rekonstruktive und Ästhetische Chirurgie", "Urologie", "Radiologie und Neuroradiologie", "Zentrum für seelische Gesundheit", "HNO (Belegabteilung)", "Zentrale Notaufnahme"],
    centers: ["Regionales Traumazentrum", "Überregionale Stroke Unit", "Lungenkrebszentrum", "Weaningzentrum"],
    phone: [["Herzkatheterlabor", "0271 705-601608"]],
    src: "klinikum-siegen.de",
  },
};

/* Kliniken, die aus der Liste genommen wurden (für vorhandene Installationen) */
const REMOVED_HOSPITALS = ["Asklepios Klinik Lich", "Kreisklinik Biedenkopf"];

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
  {
    id: "hits", title: "4 H's und HITS", abbr: "HITS", sub: "Reversible Ursachen des Kreislaufstillstands (ERC)",
    items: [
      ["H", "Hypoxie", "Atemweg sichern, Beatmung mit 100 % O₂, Tubuslage und Beatmung prüfen (Kapnografie)."],
      ["H", "Hypovolämie", "Blutung stoppen (Tourniquet, Beckenschlinge), Volumen i.v./i.o."],
      ["H", "Hypo-/Hyperkaliämie, metabolisch", "Anamnese (Dialyse? Niereninsuffizienz?), BZ messen, BGA wenn verfügbar."],
      ["H", "Hypo-/Hyperthermie", "Temperatur messen. Hypothermie: Wärmeerhalt, Transport ins ECLS-Zentrum erwägen."],
      ["H", "Herzbeuteltamponade", "Trauma, Z. n. Herz-OP, Dissektion. Sono wenn verfügbar, Perikardentlastung."],
      ["I", "Intoxikation", "Auffindesituation, Tabletten, Anamnese. Antidot erwägen, Giftnotruf. Lange reanimieren."],
      ["T", "Thrombose (koronar / pulmonal)", "Myokardinfarkt → PCI. Lungenembolie → Lyse erwägen, danach CPR 60–90 min fortführen."],
      ["S", "Spannungspneumothorax", "Einseitig fehlendes Atemgeräusch, gestaute Halsvenen, Trauma. Entlastungspunktion / Thorakostomie."],
    ],
    note: "Während der laufenden CPR systematisch abarbeiten. Behandelbare Ursachen frühzeitig erkennen und gezielt therapieren.",
  },
  { id: "neuner", title: "Neunerregel", abbr: "9 %", sub: "Verbrennungsausdehnung in % KOF", type: "burn" },
];

/* Neunerregel nach Wallace – Werte in % Körperoberfläche */
const BURN_REGIONS = {
  erw:  [["Kopf und Hals", 9], ["Arm links", 9], ["Arm rechts", 9], ["Rumpf vorne", 18], ["Rumpf hinten", 18], ["Bein links", 18], ["Bein rechts", 18], ["Genitalbereich", 1]],
  kind: [["Kopf und Hals", 14], ["Arm links", 9], ["Arm rechts", 9], ["Rumpf vorne", 18], ["Rumpf hinten", 18], ["Bein links", 16], ["Bein rechts", 16]],
  sgl:  [["Kopf und Hals", 18], ["Arm links", 9], ["Arm rechts", 9], ["Rumpf vorne", 18], ["Rumpf hinten", 18], ["Bein links", 14], ["Bein rechts", 14]],
};

/* Pädiatrisches Beurteilungsdreieck (PAT) – was ist AUFFÄLLIG? */
const PAT_SIDES = [
  { id: "a", title: "Aussehen", sub: "TICLS", items: [
    ["Tonus", "schlaff, kaum Spontanbewegung"],
    ["Interaktion", "teilnahmslos, kein Interesse an Umgebung / Spielzeug"],
    ["Beruhigbarkeit", "nicht zu trösten oder zu beruhigen"],
    ["Blick", "starr, leer, fixiert nicht"],
    ["Sprache / Schreien", "schwach, heiser, wimmernd oder fehlend"],
  ] },
  { id: "b", title: "Atemarbeit", sub: "hören und sehen", items: [
    ["Abnorme Atemgeräusche", "Stridor, Giemen, Stöhnen / Knorksen, Gurgeln"],
    ["Einziehungen", "jugulär, interkostal, sternal, subkostal"],
    ["Nasenflügeln", ""],
    ["Kopfnicken", "„Head bobbing“ bei Säuglingen"],
    ["Abnorme Haltung", "Schnüffelposition, Dreifußhaltung, Kutschersitz"],
  ] },
  { id: "c", title: "Hautdurchblutung", sub: "Zirkulation", items: [
    ["Blässe", ""],
    ["Marmorierung", "fleckige, netzartige Hautzeichnung"],
    ["Zyanose", "zentral oder peripher"],
  ] },
];
