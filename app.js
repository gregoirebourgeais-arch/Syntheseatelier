// === Données globales ===
let data = JSON.parse(localStorage.getItem("syntheseData")) || {
  production: {},
  arrets: [],
  organisation: [],
  personnel: []
};
let currentPage = "atelier";

// === SAUVEGARDE AUTOMATIQUE ===
function saveData() {
  localStorage.setItem("syntheseData", JSON.stringify(data));
}

// === AFFICHAGE DES PAGES ===
function ouvrirPage(page) {
  currentPage = page;
  let contenu = document.getElementById("contenu");

  switch (page) {
    case "atelier": contenu.innerHTML = pageAtelier(); break;
    case "arrets": contenu.innerHTML = pageArrets(); break;
    case "organisation": contenu.innerHTML = pageOrganisation(); break;
    case "personnel": contenu.innerHTML = pagePersonnel(); break;
    default: contenu.innerHTML = pageLigne(page); break;
  }

  saveData();
}

// === PAGE ATELIER ===
function pageAtelier() {
  let lignes = Object.keys(data.production);
  let html = `<section><h2>Résumé Atelier</h2>
  <canvas id="chartAtelier"></canvas>
  <button onclick="exporterExcel()">📊 Export Excel</button></section>`;

  html += `<section><h3>Historique Arrêts</h3>
  <table><tr><th>Ligne</th><th>Durée (min)</th><th>Commentaire</th></tr>`;
  data.arrets.forEach(a => {
    html += `<tr><td>${a.ligne}</td><td>${a.duree}</td><td>${a.commentaire}</td></tr>`;
  });
  html += `</table></section>`;

  setTimeout(drawChartAtelier, 300);
  return html;
}

// === PAGE LIGNE ===
function pageLigne(ligne) {
  const prod = data.production[ligne] || { quantite: 0, debut: "", fin: "", cadence: 0, restante: 0 };
  return `
  <section>
    <h2>Ligne ${ligne.toUpperCase()}</h2>
    <label>Heure début :</label>
    <input type="time" id="debut" value="${prod.debut || ""}" onchange="updateField('${ligne}')"/>
    <label>Heure fin :</label>
    <input type="time" id="fin" value="${prod.fin || ""}" onchange="updateField('${ligne}')"/>
    <label>Quantité réalisée :</label>
    <input type="number" id="quantite" value="${prod.quantite}" onchange="updateField('${ligne}')"/>
    <label>Quantité restante :</label>
    <input type="number" id="restante" value="${prod.restante}" onchange="calcEstimation('${ligne}')"/>
    <p><strong>Cadence :</strong> <span id="cadence">${prod.cadence || 0}</span> colis/h</p>
    <p><strong>Fin estimée :</strong> <span id="finEstimee">--:--</span></p>
    <label>Commentaires :</label>
    <textarea id="commentaire" onchange="updateField('${ligne}')">${prod.commentaire || ""}</textarea>
    <button onclick="enregistrer('${ligne}')">💾 Enregistrer</button>
    <button onclick="remiseZero('${ligne}')">🔄 Remise à zéro</button>
  </section>

  <section>
    <h3>Historique</h3>
    <table id="table-${ligne}">
      <tr><th>Heure</th><th>Quantité</th><th>Cadence</th><th>Fin estimée</th></tr>
      ${(prod.historique || []).map(e => 
        `<tr><td>${e.heure}</td><td>${e.quantite}</td><td>${e.cadence}</td><td>${e.finEstimee}</td></tr>`
      ).join("")}
    </table>
  </section>

  <canvas id="chart-${ligne}"></canvas>
  `;
}

// === PAGE ARRÊTS ===
function pageArrets() {
  return `
  <section>
    <h2>Arrêts de ligne</h2>
    <label>Ligne :</label>
    <select id="ligneArret">
      <option value="">--Choisir--</option>
      ${["rapé","t2","rt","omori","t1","sticks","emballage","des","filets","predecoupes"].map(l => `<option value="${l}">${l}</option>`).join("")}
    </select>
    <label>Durée (min) :</label>
    <input type="number" id="dureeArret" placeholder="Durée"/>
    <label>Commentaire :</label>
    <textarea id="commentArret" placeholder="Motif ou cause..."></textarea>
    <button onclick="ajouterArret()">💾 Enregistrer</button>

    <h3>Historique</h3>
    <table><tr><th>Ligne</th><th>Durée</th><th>Commentaire</th></tr>
      ${data.arrets.map(a => `<tr><td>${a.ligne}</td><td>${a.duree}</td><td>${a.commentaire}</td></tr>`).join("")}
    </table>
  </section>`;
}

// === PAGE ORGANISATION ===
function pageOrganisation() {
  return `
  <section>
    <h2>Consignes & Organisation</h2>
    <textarea id="consigneTexte" placeholder="Écrire une consigne..."></textarea>
    <button onclick="ajouterConsigne()">💾 Ajouter</button>

    <h3>Historique des Consignes</h3>
    <ul>${data.organisation.map(c => `<li>${c.texte} (${c.date})</li>`).join("")}</ul>
  </section>`;
}

// === PAGE PERSONNEL ===
function pagePersonnel() {
  return `
  <section>
    <h2>Suivi du Personnel</h2>
    <label>Nom :</label>
    <input type="text" id="nomPerso" placeholder="Nom"/>
    <label>Motif :</label>
    <select id="motifPerso">
      <option value="">--Choisir--</option>
      <option value="Absence">Absence</option>
      <option value="Retard">Retard</option>
      <option value="Départ">Départ</option>
      <option value="Autre">Autre</option>
    </select>
    <label>Commentaire :</label>
    <textarea id="commentPerso"></textarea>
    <button onclick="ajouterPersonnel()">💾 Enregistrer</button>

    <h3>Historique</h3>
    <table><tr><th>Nom</th><th>Motif</th><th>Commentaire</th></tr>
      ${data.personnel.map(p => `<tr><td>${p.nom}</td><td>${p.motif}</td><td>${p.commentaire}</td></tr>`).join("")}
    </table>
  </section>`;
}

// === MISE À JOUR DES CHAMPS ===
function updateField(ligne) {
  if (!data.production[ligne]) data.production[ligne] = {};
  let p = data.production[ligne];
  p.debut = document.getElementById("debut").value;
  p.fin = document.getElementById("fin").value;
  p.quantite = parseFloat(document.getElementById("quantite").value) || 0;
  p.restante = parseFloat(document.getElementById("restante").value) || 0;
  p.commentaire = document.getElementById("commentaire").value;
  saveData();
  calcCadence(ligne);
}

// === CALCUL CADENCE ET ESTIMATION ===
function calcCadence(ligne) {
  let p = data.production[ligne];
  if (!p.debut || !p.fin || !p.quantite) return;
  let [hd, md] = p.debut.split(":").map(Number);
  let [hf, mf] = p.fin.split(":").map(Number);
  let diff = ((hf * 60 + mf) - (hd * 60 + md)) / 60;
  if (diff <= 0) diff += 24;
  p.cadence = (p.quantite / diff).toFixed(2);
  document.getElementById("cadence").textContent = p.cadence;
  calcEstimation(ligne);
  saveData();
}

function calcEstimation(ligne) {
  let p = data.production[ligne];
  if (!p.cadence || !p.restante) return;
  let heuresRestantes = (p.restante / p.cadence);
  let finEstimee = new Date();
  finEstimee.setHours(finEstimee.getHours() + heuresRestantes);
  const affichage = finEstimee.toTimeString().slice(0,5);
  document.getElementById("finEstimee").textContent = affichage;
  saveData();
}

// === ENREGISTREMENT ===
function enregistrer(ligne) {
  const p = data.production[ligne];
  if (!p.historique) p.historique = [];
  p.historique.push({
    heure: new Date().toLocaleTimeString(),
    quantite: p.quantite,
    cadence: p.cadence,
    finEstimee: document.getElementById("finEstimee").textContent
  });
  saveData();
  ouvrirPage(ligne);
}

// === REMISE À ZÉRO ===
function remiseZero(ligne) {
  data.production[ligne] = { quantite: 0, debut: "", fin: "", cadence: 0, restante: 0, historique: [] };
  saveData();
  ouvrirPage(ligne);
}

// === ARRÊTS ===
function ajouterArret() {
  const ligne = document.getElementById("ligneArret").value;
  const duree = document.getElementById("dureeArret").value;
  const commentaire = document.getElementById("commentArret").value;
  if (!ligne || !duree) return alert("Sélectionner ligne et durée !");
  data.arrets.push({ ligne, duree, commentaire });
  saveData();
  ouvrirPage("arrets");
}

// === ORGANISATION ===
function ajouterConsigne() {
  const texte = document.getElementById("consigneTexte").value;
  if (!texte) return;
  data.organisation.push({ texte, date: new Date().toLocaleDateString() });
  saveData();
  ouvrirPage("organisation");
}

// === PERSONNEL ===
function ajouterPersonnel() {
  const nom = document.getElementById("nomPerso").value;
  const motif = document.getElementById("motifPerso").value;
  const commentaire = document.getElementById("commentPerso").value;
  if (!nom || !motif) return alert("Nom et motif requis !");
  data.personnel.push({ nom, motif, commentaire });
  saveData();
  ouvrirPage("personnel");
}

// === EXPORT EXCEL ===
function exporterExcel() {
  let rows = [["Section","Ligne","Quantité","Cadence","Fin estimée","Commentaire"]];
  for (let l in data.production) {
    let p = data.production[l];
    (p.historique || []).forEach(h =>
      rows.push(["Production", l, h.quantite, h.cadence, h.finEstimee, p.commentaire || ""])
    );
  }
  data.arrets.forEach(a => rows.push(["Arrêt", a.ligne, "", "", "", a.commentaire]));
  data.personnel.forEach(p => rows.push(["Personnel", "", "", "", "", `${p.nom} (${p.motif})`]));
  data.organisation.forEach(o => rows.push(["Organisation", "", "", "", "", o.texte]));

  let csv = rows.map(r => r.join(";")).join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Synthese_Equipe_${new Date().toLocaleDateString()}.csv`;
  a.click();
}

// === GRAPHIQUE ATELIER ===
function drawChartAtelier() {
  let ctx = document.getElementById("chartAtelier");
  if (!ctx) return;
  const labels = Object.keys(data.production);
  const valeurs = labels.map(l => parseFloat(data.production[l]?.quantite || 0));
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Quantités produites",
        data: valeurs,
        backgroundColor: "#0072ce"
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

// === CALCULATRICE ===
function toggleCalculatrice() {
  const calc = document.getElementById("calculatrice");
  calc.style.display = calc.style.display === "block" ? "none" : "block";
}
function ajouterCalc(v) {
  document.getElementById("calc-affichage").value += v;
}
function calculerCalc() {
  const input = document.getElementById("calc-affichage");
  try { input.value = eval(input.value); } catch { input.value = "Erreur"; }
}
function effacerCalc() {
  document.getElementById("calc-affichage").value = "";
}

// === INIT ===
window.onload = () => ouvrirPage("atelier");
