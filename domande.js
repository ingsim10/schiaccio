// Le domande dell'autovalutazione stanno qui, da sole, perché le usano DUE
// pagine: l'app vera (index.html) e il banco di prova (prova.html). Se stessero
// dentro una delle due, l'altra prima o poi resterebbe indietro — è già
// successo tra il prototipo e il sito pubblicato.
//
// 29/08 — L'ORDINE CONTA: la domanda sui tornei viene per prima perché è quella
// che decide tutto il resto. Misurato su 3.024 combinazioni: a chi fa
// AIBVC/FIPAV le altre cinque domande non spostavano la fascia nemmeno una
// volta, e a chi fa i tornei della scuola ne erano inutili due.

export const DOMANDE = [
  { key: "q5", testo: "A che tornei giochi?", opzioni: [
      ["non_faccio_tornei", "Non faccio tornei"], ["scuola", "Tornei della scuola"],
      ["AIBVC_L2", "AIBVC L2"], ["AIBVC_L1", "AIBVC L1"], ["FIPAV", "FIPAV"] ] },
  // solo per chi fa i tornei della scuola: è lì che il suo livello si decide
  { key: "q6", testo: "Nei tornei, dove smetti di vincere?", opzioni: [
      ["vince_raramente_bronze", "Vinco raramente anche nel bronze"],
      ["vince_bronze_perde_silver", "Vinco nel bronze, nel silver perdo"],
      ["silver_se_la_gioca", "Nel silver me la gioco"],
      ["vince_silver_perde_gold", "Vinco nel silver, nel gold perdo"],
      ["gold_se_la_gioca", "Nel gold me la gioco"] ] },
  // le due seguenti servono solo a chi non fa tornei: sono la sua unica misura
  { key: "q1", testo: "Da quanto giochi a beach volley?", opzioni: [
      ["mai", "Mai, o da quest'anno"], ["da1a3", "Da 1 a 3 anni"], ["piuDi3", "Più di 3 anni"] ] },
  { key: "q2", testo: "Hai giocato a pallavolo indoor? In che serie?", opzioni: [
      ["mai", "Mai"], ["amatoriale", "Amatoriale / CSI"], ["serieDC", "Serie D o C"], ["serieBplus", "Serie B o sopra"] ] },
  { key: "q4", testo: "Quando servite voi, chi sta a rete fa segnali dietro la schiena al compagno?", opzioni: [
      ["mai", "Mai"], ["ogni_tanto", "Ogni tanto"], ["sempre_codice", "Sempre, con un codice fisso"] ] },
  { key: "compagni", testo: "Con chi giochi di solito? (facoltativa)", libera: true },
];

// Ognuno vede solo le domande che nel suo caso entrano nel calcolo. Non è un
// risparmio di tempo e basta: una domanda che non conta nulla, ma che sembra
// contare, invita a rispondere a caso e sporca il resto.
export function domandeAttive(risposte){
  const q5 = risposte.q5;
  const federale = q5 === "AIBVC_L2" || q5 === "AIBVC_L1" || q5 === "FIPAV";
  const senzaTornei = q5 === "non_faccio_tornei";
  return DOMANDE.filter((d) => {
    if (d.key === "q6") return q5 === "scuola";
    if (d.key === "q1" || d.key === "q2") return senzaTornei;
    if (d.key === "q4") return !!q5 && !federale;
    return true;
  });
}

// La risposta sui tornei riscrive il percorso: le risposte vecchie che non
// c'entrano più vanno tolte, altrimenti il calcolo le legge come contraddizioni.
export function allineaRisposte(risposte, valoreQ5){
  if (valoreQ5 === "non_faccio_tornei") risposte.q6 = "non_faccio_tornei";
  else if (valoreQ5 !== "scuola") delete risposte.q6;
  else if (risposte.q6 === "non_faccio_tornei") delete risposte.q6;
  return risposte;
}
