// Funzione di conversione: risposte alle 6 domande → livello (1.0-7.0) + margine
// Specifica: ../funzione-conversione.md — ⚠️ costanti segnaposto, da tarare col pilota
// Regola: Claude tiene la struttura, Simone valida i numeri (giudizi di beach)

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

const BASE_STRADA_C = { AIBVC_L2: 5.8, AIBVC_L1: 6.2, FIPAV: 6.6 };

const BASE_STRADA_A = {
  vince_raramente_bronze: 2.4,
  vince_bronze_perde_silver: 3.0,
  silver_se_la_gioca: 3.6,
  vince_silver_perde_gold: 4.4,
  gold_se_la_gioca: 5.0,
};

const MATRICE_STRADA_B = {
  mai: { mai: 1.2, amatoriale: 1.6, serieDC: 2.8, serieBplus: 3.4 },
  da1a3: { mai: 1.9, amatoriale: 2.2, serieDC: 3.0, serieBplus: 3.6 },
  piuDi3: { mai: 2.2, amatoriale: 2.5, serieDC: 3.2, serieBplus: 3.8 },
};

// 29/08: la domanda sull'alzata e' stata tolta. Era la seconda leva piu'
// pesante del questionario (cambiava fascia in 7-9 casi su 10) ma chiedeva un
// giudizio che l'amatore non puo' dare: nelle partite tra amici non c'e'
// nessun arbitro che fischia i doppi, quindi meta' delle risposte era
// inventata. Una risposta inventata che sposta di una fascia intera vale meno
// di una domanda in meno.
const Q4_RIFINITURA = { mai: -0.1, ogni_tanto: 0.1, sempre_codice: 0.3 };

// r = { q1, q2, q4, q5, q6, compagni }
export function computaLivello(r) {
  let strada, base, margineMin, margineMax;

  if (r.q5 in BASE_STRADA_C) {
    strada = "C";
    base = BASE_STRADA_C[r.q5];
    margineMin = margineMax = 0.5;
  } else if (r.q6 !== "non_faccio_tornei") {
    strada = "A";
    base = BASE_STRADA_A[r.q6];
    margineMin = margineMax = 0.6;
  } else {
    strada = "B";
    // rete di sicurezza: la strada B ha bisogno di q1 e q2, che il questionario
    // chiede solo a chi dice di non fare tornei. Se mancano (dato importato,
    // percorso cambiato a meta') non si tira a indovinare: valore centrale e
    // profilo segnato per la revisione di Simone.
    const riga = MATRICE_STRADA_B[r.q1];
    base = riga && riga[r.q2] !== undefined ? riga[r.q2] : 2.2;
    margineMin = margineMax = 0.8;
    // ex-indoor in rodaggio (13/08): margine asimmetrico, quasi impossibile
    // sia sotto, molto probabile sia sopra → si apre verso l'alto
    const exIndoorRodaggio =
      (r.q1 === "mai" || r.q1 === "da1a3") && (r.q2 === "serieDC" || r.q2 === "serieBplus");
    if (exIndoorRodaggio) {
      margineMin = 0.3;
      margineMax = 0.8;
    }
  }

  const rawRifinitura = Q4_RIFINITURA[r.q4] || 0;
  let rifinitura = strada === "C" ? rawRifinitura / 2 : rawRifinitura;
  rifinitura = Math.max(-0.4, Math.min(0.4, rifinitura));

  // Guardia di coerenza: la strada dice "forte" ma la rifinitura tecnica dice
  // "debole" (o viceversa) → non si sceglie, si allarga il margine e si segna
  // per la revisione di Simone. Euristica di primo passo, da raffinare.
  let guardiaAttiva = false;
  if (!(MATRICE_STRADA_B[r.q1] || {})[r.q2] && strada === "B") guardiaAttiva = true;
  // gioca tornei a buon livello ma a rete non fa mai segnali: una delle due
  // risposte non torna
  if (strada !== "B" && base >= 3.6 && r.q4 === "mai") guardiaAttiva = true;
  // dice di non fare tornei e di giocare poco, ma ha un codice di segnali fisso
  if (strada === "B" && base <= 2.0 && r.q4 === "sempre_codice") guardiaAttiva = true;
  // rete di sicurezza: dice di fare i tornei della scuola ma non dice dove
  // smette di vincere. Nel questionario non è più possibile, ma un dato
  // vecchio o importato finirebbe valutato come chi non gioca tornei.
  if (r.q5 === "scuola" && (!r.q6 || r.q6 === "non_faccio_tornei")) guardiaAttiva = true;
  if (guardiaAttiva) {
    margineMin = margineMax = 0.8;
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
