// Funzione di conversione: risposte del questionario → livello (1.0-7.0) + margine
// Specifica: ../funzione-conversione.md — ⚠️ i numeri sono ancora da tarare
// Regola: Claude tiene la struttura, Simone valida i numeri (giudizi di beach)
//
// Tre strade, decise dalla prima domanda:
//   C  federali (AIBVC L2/L1, FIPAV) → la categoria dice la fascia
//   A  tornei della scuola           → il tabellone dice la fascia
//   B  niente tornei                 → matrice anni sulla sabbia × indoor
//
// La rifinitura cambia bersaglio col livello (29/08, osservazione di Simone):
// i segnali dietro la schiena distinguono chi gioca da poco ma nel gold li
// fanno tutti; in alto distingue la battuta in salto; in mezzo il piazzamento.

export const FASCE = [
  { min: 1.0, max: 1.8, nome: "Principiante", sub: "prime volte sulla sabbia" },
  { min: 1.8, max: 2.6, nome: "Base", sub: "gioca da anni con gli amici" },
  { min: 2.6, max: 3.2, nome: "Intermedio", sub: "zona bronze dei tornei" },
  { min: 3.2, max: 3.8, nome: "Intermedio+", sub: "tra bronze e silver" },
  { min: 3.8, max: 4.4, nome: "Avanzato", sub: "zona silver" },
  { min: 4.4, max: 5.0, nome: "Avanzato+", sub: "tra silver e gold" },
  { min: 5.0, max: 5.6, nome: "Esperto", sub: "gold stabile" },
  { min: 5.6, max: 7.0, nome: "Agonista", sub: "AIBVC / FIPAV" }, // 📌 sottotitolo da rivedere
];

export function getFascia(valore) {
  const f = FASCE.find((f) => valore >= f.min && valore < f.max);
  return f || FASCE[FASCE.length - 1];
}

const BASE_FEDERALE = { AIBVC_L2: 5.8, AIBVC_L1: 6.2, FIPAV: 6.6 };

// Tabellone × quanto ci vai a fondo. Non è una base con una correzione, ma una
// tabella sola, perché l'apertura cambia moltissimo col tabellone (29/08,
// Simone): nel bronze ci sta dentro di tutto — chi ha appena iniziato il corso
// e fa il suo primo torneo, e chi sta per salire — mentre nel gold il ventaglio
// è stretto. Un bronze che parte da 1.3 con la stessa apertura del gold
// lascerebbe "Principiante" anche chi il bronze lo vince.
const MATRICE_SCUOLA = {
  bronze: { esco_subito: 1.3, una_due: 2.0, semi_finale: 2.7 },
  silver: { esco_subito: 3.0, una_due: 3.6, semi_finale: 4.2 },
  gold:   { esco_subito: 4.6, una_due: 5.0, semi_finale: 5.4 },
};
// e per lo stesso motivo l'incertezza è più larga in basso
const MARGINE_TABELLONE = { bronze: 0.8, silver: 0.6, gold: 0.5 };

const MATRICE_SENZA_TORNEI = {
  mai: { mai: 1.2, amatoriale: 1.6, serieDC: 2.8, serieBplus: 3.4 },
  da1a3: { mai: 1.9, amatoriale: 2.2, serieDC: 3.0, serieBplus: 3.6 },
  piuDi3: { mai: 2.2, amatoriale: 2.5, serieDC: 3.2, serieBplus: 3.8 },
};

// Per i federali che non sanno la loro classifica: lì il tabellone non c'è,
// resta solo quanto vanno a fondo.
const RIF_SPESSO = { esco_subito: -0.35, una_due: 0, semi_finale: 0.35 };
// Essere finiti in un tabellone più alto pesa pochissimo, ed è voluto: con un
// girone facile ci finisci per sorteggio. La domanda serve soprattutto a dare
// uno sfogo onesto a chi ci è arrivato — così non ha bisogno di gonfiare le
// altre risposte per farlo sapere (parole di Simone: "senza mentire").
const RIF_TABELLONE_ALTO = { mai: 0, male: 0.05, vicino: 0.10, vinto: 0.15 };
// La classifica AIBVC è l'unica misura oggettiva del questionario: pesa più di
// qualsiasi ricordo, ed è già una sintesi di 365 giorni di risultati.
const RIF_CLASSIFICA = { primi20: 0.40, tra21e50: 0.25, tra51e100: 0.05, oltre100: -0.20, non_lo_so: 0 };
const RIF_BATTUTA = { mai: -0.25, provo: -0.10, forte: 0.10, disinvolto: 0.25 };
const RIF_SEGNALI = { mai: -0.1, ogni_tanto: 0.1, sempre_codice: 0.3 };

const TETTO_RIFINITURA = 0.70;

// r = { q5, q7, q8, q9, q10, q1, q2, q4, compagni }
export function computaLivello(r) {
  let strada, base, margineMin, margineMax, rifinitura, guardiaAttiva = false;

  if (r.q5 in BASE_FEDERALE) {
    strada = "C";
    base = BASE_FEDERALE[r.q5];
    margineMin = margineMax = 0.5;
    // chi sa la sua classifica viene valutato su quella; agli altri restano i
    // piazzamenti, che sono ricordi e valgono meno
    const daClassifica = r.q11 && r.q11 !== "non_lo_so";
    rifinitura = (RIF_BATTUTA[r.q10] || 0) + (daClassifica
      ? (RIF_CLASSIFICA[r.q11] || 0)
      : (RIF_SPESSO[r.q8] || 0) + (RIF_TABELLONE_ALTO[r.q9] || 0));
    if (daClassifica) margineMin = margineMax = 0.4;

  } else if (r.q5 === "scuola") {
    strada = "A";
    const riga = MATRICE_SCUOLA[r.q7];
    base = riga ? riga[r.q8] : undefined;
    margineMin = margineMax = MARGINE_TABELLONE[r.q7] || 0.8;
    // la battuta in salto si chiede solo nel gold: sotto non separa nessuno
    rifinitura = (RIF_TABELLONE_ALTO[r.q9] || 0) +
                 (r.q7 === "gold" ? (RIF_BATTUTA[r.q10] || 0) : 0);
    if (base === undefined) { base = 3.2; rifinitura = 0; guardiaAttiva = true; }

  } else {
    strada = "B";
    // rete di sicurezza: la strada B ha bisogno di q1 e q2. Se mancano (dato
    // importato, percorso cambiato a metà) non si tira a indovinare: valore
    // centrale e profilo segnato per la revisione di Simone.
    const riga = MATRICE_SENZA_TORNEI[r.q1];
    if (riga && riga[r.q2] !== undefined) {
      base = riga[r.q2];
    } else {
      base = 2.2;
      guardiaAttiva = true;
    }
    margineMin = margineMax = 0.8;
    rifinitura = RIF_SEGNALI[r.q4] || 0;
    // ex-indoor in rodaggio (13/08): margine asimmetrico, quasi impossibile
    // sia sotto, molto probabile sia sopra → si apre verso l'alto
    const exIndoorRodaggio =
      (r.q1 === "mai" || r.q1 === "da1a3") && (r.q2 === "serieDC" || r.q2 === "serieBplus");
    if (exIndoorRodaggio) {
      margineMin = 0.3;
      margineMax = 0.8;
    }
  }

  rifinitura = Math.max(-TETTO_RIFINITURA, Math.min(TETTO_RIFINITURA, rifinitura));

  // --- guardie di coerenza: non si sceglie chi ha ragione, si segna il profilo
  // e lo guarda Simone. Il margine intanto resta largo. ---

  // ai tornei L2 può iscriversi solo chi non è tra i primi 20 della classifica
  // AIBVC: le due risposte non possono stare insieme
  if (r.q5 === "AIBVC_L2" && r.q11 === "primi20") guardiaAttiva = true;
  // dice di arrivare in fondo quasi sempre, ma di non essere mai finito in un
  // tabellone più alto del solito
  if (r.q8 === "semi_finale" && r.q9 === "mai") guardiaAttiva = true;
  // gioca gold o federale ma non prova nemmeno la battuta in salto: una delle
  // due risposte non torna (a quel livello la saltano tutti)
  if ((strada === "C" || (strada === "A" && r.q7 === "gold")) && r.q10 === "mai") guardiaAttiva = true;
  // dice di non fare tornei e di giocare poco, ma ha un codice di segnali fisso
  if (strada === "B" && base <= 2.0 && r.q4 === "sempre_codice") guardiaAttiva = true;

  if (guardiaAttiva) {
    margineMin = Math.max(margineMin, 0.8);
    margineMax = Math.max(margineMax, 0.8);
  }

  let valore = base + rifinitura;
  valore = Math.max(1.0, Math.min(7.0, valore));

  const fascia = getFascia(valore);

  return {
    valore: Math.round(valore * 100) / 100,
    margineMin,
    margineMax,
    strada,
    guardiaAttiva,
    fasciaNome: fascia.nome,
    fasciaSottotitolo: fascia.sub,
  };
}
