const DATA_URL = './data/pokemons.json';
let pokemons = [];
let acquired = JSON.parse(localStorage.getItem('acquiredPokemons') || '{}');
const fields = [
  'ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所'
];

document.addEventListener('DOMContentLoaded', () => {
  fetch(DATA_URL)
    .then(r => r.json())
    .then(data => {
      pokemons = data['すべての寝顔一覧'];
      buildAllTable();
      buildFieldTables();
      // TODO: updateSummary();
    });

  // バックアップ
  document.getElementById('export-btn').addEventListener('click', () => {
    const txt = JSON.stringify(acquired);
    document.getElementById('backup-text').value = txt;
  });
  document.getElementById('import-btn').addEventListener('click', () => {
    try {
      acquired = JSON.parse(document.getElementById('backup-text').value);
      localStorage.setItem('acquiredPokemons', JSON.stringify(acquired));
      location.reload();
    } catch (e) { alert('JSON形式が不正です'); }
  });
});

function buildAllTable() {
  const tbody = document.querySelector('#all-table tbody');
  pokemons.forEach(r => {
    const tr = document.createElement('tr');
    // 図鑑No / 名前
    tr.innerHTML = `<td>${r.No}</td><td>${r.Name}</td>`;
    // ☆1〜☆4
    const starCount = (r.DisplayRarity.match(/★/g) || []).length;
    for (let i = 1; i <= 4; i++) {
      const td = document.createElement('td');
      if (i === starCount) {
        td.textContent = r.DisplayRarity;
        td.dataset.id = r.ID;
        td.classList.toggle('acquired', acquired[r.ID]);
        td.addEventListener('click', () => toggleAcquired(r.ID));
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

function buildFieldTables() {
  fields.forEach(field => {
    const key = field.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const tbody = document.querySelector(`#table-${key} tbody`);
    pokemons.forEach(r => {
      if (r[field]) {
        const tr = document.createElement('tr');
        // チェックボックス
        const tdChk = document.createElement('td');
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = !!acquired[r.ID];
        chk.addEventListener('change', () => toggleAcquired(r.ID));
        tdChk.appendChild(chk);
        tr.appendChild(tdChk);
        // No, Name, Rarity, Style, Rank
        tr.innerHTML += `
          <td>${r.No}</td>
          <td>${r.Name}</td>
          <td>${r.DisplayRarity}</td>
          <td>${r.Style}</td>
          <td>${r[field]}</td>
        `;
        tbody.appendChild(tr);
      }
    });
  });
}

function toggleAcquired(id) {
  acquired[id] = !acquired[id];
  localStorage.setItem('acquiredPokemons', JSON.stringify(acquired));
  // 簡易リロードでUIをリセット
  location.reload();
}
