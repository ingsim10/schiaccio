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
  { key: "q7", testo: "In quale tabellone arrivi di solito?", opzioni: [
      ["bronze", "Bronze"], ["silver", "Silver"], ["gold", "Gold"] ] },

  // --- federali: la classifica AIBVC è una misura vera, batte i ricordi ---
  // Regolamento AIBVC: classifica unica nazionale, migliori 10 tornei degli
  // ultimi 365 giorni. Ai tornei L2 può iscriversi solo chi NON è tra i primi 20.
  { key: "q11", testo: "In classifica AIBVC, più o meno dove stai?", opzioni: [
      ["primi20", "Nei primi 20"], ["tra21e50", "Tra il 21° e il 50°"],
      ["tra51e100", "Tra il 51° e il 100°"], ["oltre100", "Oltre il 100°"],
      ["non_lo_so", "Non lo so / non ci sono"] ] },

  // --- chi fa tornei: quanto va a fondo. Il formato vero (parole di Simone):
  // 3 partite di girone che ti smistano nel bronze/silver/gold, poi 3-4 partite
  // al massimo. Quindi non "quarti/semifinale" ma quante partite vinci. ---
  { key: "q8", testo: "E lì dove arrivi più spesso?", opzioni: [
      ["esco_subito", "Eliminato subito"], ["una_due", "Un po' vado avanti"],
      ["semi_finale", "Semifinale o finale"] ] },
  // Non chiede il miglior piazzamento in sé — un girone facile ti porta nel gold
  // per caso — ma com'è andata quando ci sei arrivato: è lì che si vede se il
  // tabellone alto era tuo o del sorteggio.
  { key: "q9", testo: "Ti è capitato di finire in un tabellone più alto del solito?", opzioni: [
      ["mai", "No, mai"], ["male", "Sì, ma le ho prese"],
      ["vicino", "Sì, e ho perso di poco"], ["vinto", "Sì, e ho vinto qualche partita"] ] },

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

  // a un federale i piazzamenti si chiedono solo se non sa la sua classifica:
  // la classifica dice già come è andato negli ultimi 365 giorni
  const classificaIgnota = !risposte.q11 || risposte.q11 === "non_lo_so";

  return DOMANDE.filter((d) => {
    if (d.key === "q7") return scuola;
    if (d.key === "q11") return federale;
    if (d.key === "q8" || d.key === "q9") return scuola || (federale && classificaIgnota);
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
  if (!federale) delete risposte.q11;
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
