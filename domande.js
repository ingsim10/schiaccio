// Le domande dell'autovalutazione stanno qui, da sole, perché le usano TRE
// pagine: l'app (index.html), il banco di prova (prova.html) e la revisione
// (revisione.html). Se stessero dentro una di loro, le altre prima o poi
// resterebbero indietro — è già successo tra il prototipo e il sito pubblicato.
//
// L'ORDINE CONTA: la domanda sui tornei viene per prima perché decide tutto il
// resto. Misurato su 3.024 combinazioni (29/08): a chi fa AIBVC/FIPAV le altre
// cinque domande non spostavano la fascia nemmeno una volta.
//
// 29/08 sera — una domanda sola non può separare tutta la scala (osservazione
// di Simone, confermata dai numeri): i segnali dietro la schiena distinguono
// chi gioca da poco, ma nel gold li fanno tutti. Quindi la rifinitura cambia
// bersaglio col livello: segnali in basso, piazzamenti in mezzo, battuta in
// salto in alto.

export const DOMANDE = [
  { key: "q5", testo: "A che tornei giochi?", opzioni: [
      ["non_faccio_tornei", "Non faccio tornei"], ["scuola", "Tornei della scuola"],
      ["AIBVC_L2", "AIBVC L2"], ["AIBVC_L1", "AIBVC L1"], ["FIPAV", "FIPAV"] ] },

  // --- chi fa i tornei della scuola: il tabellone dice la fascia di partenza ---
  { key: "q7", testo: "In quale tabellone giochi di solito?", opzioni: [
      ["bronze", "Bronze"], ["silver", "Silver"], ["gold", "Gold"] ] },

  // --- chi fa tornei (scuola o federali): quanto va a fondo ---
  // "più spesso" pesa, "il migliore" dà solo un piccolo incremento: così chi in
  // silver ci è arrivato una domenica per caso non viene contato come chi ci sta
  { key: "q8", testo: "Nei tornei che fai, dove arrivi più spesso?", opzioni: [
      ["gironi", "Esco nei gironi"], ["quarti", "Arrivo ai quarti"],
      ["semifinale", "Arrivo in semifinale"], ["finale", "Finale o vittoria"] ] },
  { key: "q9", testo: "E il tuo miglior piazzamento?", opzioni: [
      ["gironi", "Mai oltre i gironi"], ["quarti", "Quarti"],
      ["semifinale", "Semifinale"], ["finale", "Finale o vittoria"] ] },

  // --- gold e federali: qui i segnali non dicono più niente, la battuta sì ---
  { key: "q10", testo: "La battuta in salto?", opzioni: [
      ["mai", "Non ci provo mai"], ["provo", "Ci provo"],
      ["forte", "Cerco di tirare forte"], ["disinvolto", "La tiro in modo disinvolto"] ] },

  // --- chi non fa tornei: da quanto gioca, l'indoor, e i segnali ---
  { key: "q1", testo: "Da quanto giochi a beach volley?", opzioni: [
      ["mai", "Mai, o da quest'anno"], ["da1a3", "Da 1 a 3 anni"], ["piuDi3", "Più di 3 anni"] ] },
  { key: "q2", testo: "Hai giocato a pallavolo indoor? In che serie?", opzioni: [
      ["mai", "Mai"], ["amatoriale", "Amatoriale / CSI"], ["serieDC", "Serie D o C"], ["serieBplus", "Serie B o sopra"] ] },
  { key: "q4", testo: "Quando servite voi, chi sta a rete fa segnali dietro la schiena al compagno?", opzioni: [
      ["mai", "Mai"], ["ogni_tanto", "Ogni tanto"], ["sempre_codice", "Sempre, con un codice fisso"] ] },

  { key: "compagni", testo: "Con chi giochi di solito? (facoltativa)", libera: true },
];

export const FEDERALI = ["AIBVC_L2", "AIBVC_L1", "FIPAV"];

// Ognuno vede solo le domande che nel suo caso entrano nel calcolo. Non è un
// risparmio di tempo e basta: una domanda che non conta nulla, ma che sembra
// contare, invita a rispondere a caso e sporca il resto.
export function domandeAttive(risposte){
  const q5 = risposte.q5;
  const federale = FEDERALI.includes(q5);
  const scuola = q5 === "scuola";
  const tornei = federale || scuola;
  const senzaTornei = q5 === "non_faccio_tornei";
  // la battuta in salto si chiede solo dove distingue davvero: gold e federali
  const alto = federale || (scuola && risposte.q7 === "gold");

  return DOMANDE.filter((d) => {
    if (d.key === "q7") return scuola;
    if (d.key === "q8" || d.key === "q9") return tornei;
    if (d.key === "q10") return alto;
    if (d.key === "q1" || d.key === "q2") return senzaTornei;
    if (d.key === "q4") return senzaTornei;
    return true;
  });
}

// La risposta sui tornei riscrive il percorso: le risposte vecchie che non
// c'entrano più vanno tolte, altrimenti restano lì e il calcolo le legge.
export function allineaRisposte(risposte, valoreQ5){
  const federale = FEDERALI.includes(valoreQ5);
  const scuola = valoreQ5 === "scuola";
  if (!scuola) delete risposte.q7;
  if (!federale && !scuola) { delete risposte.q8; delete risposte.q9; delete risposte.q10; }
  if (valoreQ5 !== "non_faccio_tornei") { delete risposte.q1; delete risposte.q2; delete risposte.q4; }
  delete risposte.q6;   // vecchia domanda "dove smetti di vincere", non esiste più
  return risposte;
}

// Etichette leggibili per ogni risposta, ricavate dalle domande stesse: serve
// alla pagina di revisione e al banco di prova, senza ricopiare niente.
export const ETICHETTE = (() => {
  const out = {};
  DOMANDE.forEach((d) => {
    if (!d.opzioni) return;
    out[d.key] = {};
    d.opzioni.forEach(([val, label]) => { out[d.key][val] = label; });
  });
  return out;
})();
