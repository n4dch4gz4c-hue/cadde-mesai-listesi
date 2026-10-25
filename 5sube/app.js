/* 5 Şube Mesai Listesi — Taslak
   Veri: localStorage, şube bazlı ayrık
   Oranlar: mesai saat başı 300 TL, HS adet başı 1250 TL
*/

const BRANCHES = ["Şube 1", "Şube 2", "Şube 3", "Şube 4", "Şube 5"];
const LS_KEY = "bes_sube_mesai_v1";

let state = load();
let currentBranch = BRANCHES[0];

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const empty = {};
  BRANCHES.forEach(b => empty[b] = { people: [] });
  return empty;
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function getPeople() {
  return state[currentBranch]?.people || [];
}

function setPeople(list) {
  if (!state[currentBranch]) state[currentBranch] = { people: [] };
  state[currentBranch].people = list;
  save();
  render();
}

function calc(p) {
  const mesai = (Number(p.mesaiSaat) || 0) * 300;
  const hs = (Number(p.hsAdet) || 0) * 1250;
  const prim = Number(p.prim) || 0;
  const yol = Number(p.yol) || 0;
  return { mesai, hs, prim, yol, toplam: mesai + hs + prim + yol };
}

function renderBranchBar() {
  const bar = document.getElementById("branchBar");
  bar.innerHTML = BRANCHES.map(b =>
    `<button class="${b === currentBranch ? 'active' : ''}" onclick="switchBranch('${b}')">${b}</button>`
  ).join("") + `<button onclick="switchBranch('ALL')">Tüm Şubeler</button>`;
}

function switchBranch(b) {
  currentBranch = b;
  render();
}

function render() {
  renderBranchBar();
  const tbody = document.getElementById("tbody");
  const summary = document.getElementById("summary");

  if (currentBranch === "ALL") {
    let rows = "";
    let grand = 0;
    BRANCHES.forEach((b, i) => {
      const people = state[b]?.people || [];
      const sub = people.reduce((s, p) => s + calc(p).toplam, 0);
      grand += sub;
      rows += `<tr><td>${i+1}</td><td colspan="7"><b>${b}</b> (${people.length} kişi)</td><td>${tl(sub)}</td><td></td></tr>`;
    });
    tbody.innerHTML = rows;
    summary.textContent = `Genel toplam: ${tl(grand)}`;
    return;
  }

  const people = getPeople();
  let total = 0;
  tbody.innerHTML = people.map((p, i) => {
    const c = calc(p);
    total += c.toplam;
    return `<tr>
      <td>${i+1}</td>
      <td contenteditable="true" onblur="updateName(${i}, this.textContent)">${esc(p.name)}</td>
      <td><input type="number" value="${p.mesaiSaat||''}" onchange="updateField(${i},'mesaiSaat',this.value)"></td>
      <td>${tl(c.mesai)}</td>
      <td><input type="number" value="${p.hsAdet||''}" onchange="updateField(${i},'hsAdet',this.value)"></td>
      <td>${tl(c.hs)}</td>
      <td><input type="number" value="${p.prim||''}" onchange="updateField(${i},'prim',this.value)"></td>
      <td><input type="number" value="${p.yol||''}" onchange="updateField(${i},'yol',this.value)"></td>
      <td><b>${tl(c.toplam)}</b></td>
      <td><button onclick="removePerson(${i})">Sil</button></td>
    </tr>`;
  }).join("");

  summary.textContent = `${currentBranch}: ${people.length} kişi · Toplam ${tl(total)}`;
}

function updateName(i, name) {
  const people = getPeople();
  people[i].name = name.trim();
  setPeople(people);
}

function updateField(i, field, value) {
  const people = getPeople();
  people[i][field] = value === "" ? "" : Number(value);
  setPeople(people);
}

function addPerson() {
  const name = prompt("Ad Soyad:");
  if (!name) return;
  const people = getPeople();
  people.push({ name: name.trim(), mesaiSaat: "", hsAdet: "", prim: "", yol: "" });
  setPeople(people);
}

function removePerson(i) {
  if (!confirm("Silinsin mi?")) return;
  const people = getPeople();
  people.splice(i, 1);
  setPeople(people);
}

function resetCurrent() {
  if (currentBranch === "ALL") return;
  if (!confirm(currentBranch + " tamamen sıfırlansın mı?")) return;
  setPeople([]);
}

function exportCSV() {
  const people = currentBranch === "ALL" ? [] : getPeople();
  let csv = "Ad Soyad,Mesai Saat,HS Adet,Prim,Yol,Toplam\n";
  people.forEach(p => {
    const c = calc(p);
    csv += `"${p.name}",${p.mesaiSaat||0},${p.hsAdet||0},${p.prim||0},${p.yol||0},${c.toplam}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (currentBranch === "ALL" ? "tum-subeler" : currentBranch) + ".csv";
  a.click();
}

function tl(n) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n || 0);
}

function esc(s) {
  const map = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};
  return String(s || "").replace(/[&<>"']/g, c => map[c] || c);
}

render();
