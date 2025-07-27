/* Constants & State */
const JSON_PATH = 'pokemonsleep_data.json';
const STORAGE_KEY = 'pokemonSleepChecks';

let rawData = {};
let checkState = {};

/* Initialization */
window.addEventListener('DOMContentLoaded', () => initializePage());

async function initializePage() {
  rawData = await fetchData(JSON_PATH);
  checkState = loadFromStorage();
  renderSummaryTable();
  renderMainTabs();
  bindExportImport();
}

/* Data Fetching */
async function fetchData(path) {
  const res = await fetch(path);
  return res.json();
}

/* Storage Handling */
function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return (data && typeof data === 'object') ? data : {};
  } catch {
    return {};
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkState));
}

/* Export / Import Backup */
function bindExportImport() {
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(checkState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported && typeof imported === 'object') {
          checkState = imported;
          saveToStorage();
          renderSummaryTable();
          renderMainTabs();
        }
      } catch {
        alert('無効なJSONファイルです。');
      }
    };
    reader.readAsText(file);
  });
}

/* Summary Table */
function renderSummaryTable() {
  const container = document.querySelector('.container');
  const baseData = rawData['すべての寝顔一覧'] || [];

  // Remove existing table
  const oldTable = container.querySelector('table.mt-4');
  if (oldTable) oldTable.remove();

  // Fields & Styles
  const fields = ['全寝顔', 'ワカクサ本島', 'シアンの砂浜', 'トープ洞窟', 'ウノハナ雪原', 'ラピスラズリ湖畔', 'ゴールド旧発電所'];
  const styles = ['うとうと', 'すやすや', 'ぐっすり'];

  const table = document.createElement('table');
  table.className = 'table table-bordered table-sm mt-4';

  // Header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th></th>
      ${fields.map(f => `<th>${f}</th>`).join('')}
    </tr>`;
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');

  // Row per style
  styles.forEach(style => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<th>${style}</th>`;

    fields.forEach(field => {
      const filtered = baseData.filter(row => {
        if (row.Style !== style) return false;
        if (field === '全寝顔') return true;
        return row[field]?.trim();
      });
      const total = filtered.length;
      const checkedCount = filtered.filter(r => checkState[r.ID]).length;
      const rate = total ? Math.round((checkedCount / total) * 100) : 0;
      tr.innerHTML += `<td>${checkedCount} / ${total}<br>取得率: ${rate}%</td>`;
    });

    tbody.appendChild(tr);
  });

  // Total row
  const trTotal = document.createElement('tr');
  trTotal.innerHTML = `<th>合計</th>` + fields.map(field => {
    const filtered = baseData.filter(row => field === '全寝顔' || row[field]?.trim());
    const total = filtered.length;
    const checkedCount = filtered.filter(r => checkState[r.ID]).length;
    const rate = total ? Math.round((checkedCount / total) * 100) : 0;
    return `<td>${checkedCount} / ${total}<br>取得率: ${rate}%</td>`;
  }).join('');
  tbody.appendChild(trTotal);

  table.appendChild(tbody);

  // Insert after description
  const description = container.querySelector('p');
  description.insertAdjacentElement('afterend', table);
}

/* Main Tabs */
function renderMainTabs() {
  const container = document.querySelector('.container');

  // Remove existing tabs
  const oldTabs = document.getElementById('main-tabs');
  if (oldTabs) oldTabs.remove();

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.id = 'main-tabs';

  // Parent tabs nav
  const nav = document.createElement('ul');
  nav.className = 'nav nav-tabs mt-3';
  nav.innerHTML = `
    <li class="nav-item">
      <a class="nav-link active" data-bs-toggle="tab" href="#tab-alltabs">寝顔の一覧・フィールドごとの情報</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" data-bs-toggle="tab" href="#tab-reverse">現在のフィールド・ランクから検索</a>
    </li>`;
  wrapper.appendChild(nav);

  // Tab content
  const content = document.createElement('div');
  content.className = 'tab-content border border-top-0 p-3 bg-white';
  content.innerHTML = `
    <!-- All lists with subtabs -->
    <div class="tab-pane fade show active" id="tab-alltabs">
      <ul class="nav nav-tabs mb-3" id="subTabNav">
        ${['すべての寝顔一覧','ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所']
          .map((label, i) =>
            `<li class="nav-item">
               <a class="nav-link ${i===0?'active':''}" data-bs-toggle="tab" href="#tab-${['all','wakakusa','cyan','taupe','unohana','lapis','gold'][i]}">${label}</a>
             </li>`
          ).join('')}
      </ul>
      <div class="tab-content" id="subTabContent">
        ${['all','wakakusa','cyan','taupe','unohana','lapis','gold']
          .map((id, i) =>
            `<div class="tab-pane fade${i===0?' show active':''}" id="tab-${id}"></div>`
          ).join('')}
      </div>
    </div>
    <!-- Reverse search -->
    <div class="tab-pane fade" id="tab-reverse">
      <div id="reverse-search" class="mb-3">
        <label>現在のフィールド:
          <select id="reverseField" class="form-select form-select-sm d-inline w-auto ms-2">
            <option value="">--選択--</option>
            ${['ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所']
              .map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </label>
        <label class="ms-4">現在のランク:
          <select id="reverseRank" class="form-select form-select-sm d-inline w-auto ms-2">
            <option value="">--選択--</option>
            ${generateRankOptions()}
          </select>
        </label>
        <button id="reverseBtn" class="btn btn-sm btn-outline-primary ms-4">未取得の寝顔を表示</button>
      </div>
      <div id="reverseResult"></div>
    </div>`;
  wrapper.appendChild(content);

  // Insert into DOM
  const summaryTable = document.querySelector('table.mt-4');
  if (summaryTable) summaryTable.insertAdjacentElement('afterend', wrapper);
  else container.appendChild(wrapper);

  // Initialize content & events
  renderAllTabs();
  bindReverseSearch();

  // Hide alltabs content when reverse tab active
  document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', e => {
      const isReverse = e.target.getAttribute('href') === '#tab-reverse';
      document.getElementById('tab-alltabs').style.display = isReverse ? 'none' : '';
    });
  });
}

/* All Tabs Content */
function renderAllTabs() {
  const fields = ['すべての寝顔一覧','ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所'];
  const keyMap = {
    'ワカクサ本島':'ワカクサ本島','シアンの砂浜':'シアンの砂浜','トープ洞窟':'トープ洞窟',
    'ウノハナ雪原':'ウノハナ雪原','ラピスラズリ湖畔':'ラピスラズリ湖畔','ゴールド旧発電所':'ゴールド旧発電所'
  };
  const base = rawData['すべての寝顔一覧'] || [];

  fields.forEach(name => {
    const id = getTabIdByName(name);
    const container = document.getElementById(id);
    if (!container) return;

    const records = keyMap[name]
      ? base.filter(r => r[keyMap[name]]?.trim())
      : base;

    const wrapper = createTable(records);
    container.innerHTML = '';
    container.appendChild(wrapper);
  });
}

/* Reverse Search */
function bindReverseSearch() {
  document.getElementById('reverseBtn').addEventListener('click', () => {
    const field = document.getElementById('reverseField').value;
    const rank = document.getElementById('reverseRank').value;
    if (!field || !rank) return;

    const base = rawData['すべての寝顔一覧'] || [];
    const threshold = getRankIndex(rank);

    const filtered = base.filter(r => {
      const fr = r[field];
      return fr && getRankIndex(fr) <= threshold && !checkState[r.ID];
    });

    renderReverseResult(filtered);
  });
}

function renderReverseResult(data) {
  const container = document.getElementById('reverseResult');
  container.innerHTML = '';
  container.appendChild(createTable(data));
}

/* Table Creation with Filters & Bulk Actions */
function createTable(data) {
  const wrapper = document.createElement('div');

  // Bulk control & modal
  const control = document.createElement('div'); control.className = 'mb-2';
  const btnCheckAll = createBtn('全てを取得済にする', 'success');
  const btnUncheckAll = createBtn('全てを未取得にする', 'danger');
  control.append(btnCheckAll, btnUncheckAll);
  wrapper.appendChild(control);

  const modalHtml = `
    <div class="modal fade" id="confirmModal" tabindex="-1">
      <div class="modal-dialog"><div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">確認</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body"><p id="confirmMessage">この操作を実行しますか？</p></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">実行しません</button>
          <button type="button" class="btn btn-primary" id="confirmOkBtn">実行します</button>
        </div>
      </div></div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
  let modalAction = null;

  // Bulk actions
  btnCheckAll.addEventListener('click', () => showConfirm('全ての寝顔を取得済の状態にしますか？', () => {
    data.forEach(r => checkState[r.ID] = true);
    applyAfterBulk();
  }));

  btnUncheckAll.addEventListener('click', () => showConfirm('全ての寝顔を未取得の状態にしますか？', () => {
    data.forEach(r => delete checkState[r.ID]);
    applyAfterBulk();
  }));

  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    modalAction?.();
    confirmModal.hide();
  });

  function showConfirm(message, action) {
    document.getElementById('confirmMessage').textContent = message;
    modalAction = action;
    confirmModal.show();
  }

  function applyAfterBulk() {
    saveToStorage();
    renderAllTabs();
    renderSummaryTable();
  }

  // Create table
  const table = document.createElement('table');
  table.className = 'table table-bordered table-hover table-sm';

  const columns = [
    '取得','図鑑No','ポケモン名','レア度','睡眠タイプ',
    'ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所'
  ];

  // Header & Filters
  const thead = document.createElement('thead');
  const filterRow = document.createElement('tr');
  const headerRow = document.createElement('tr');
  const filters = {};
  const inputs = {};

  columns.forEach(col => {
    // Header cell
    const th = document.createElement('th'); th.textContent = col;
    headerRow.appendChild(th);

    // Filter cell
    const thFilter = document.createElement('th');
    if (col === '取得') {
      inputs.check = createSelect(['全て','取得済','未取得']);
      thFilter.appendChild(inputs.check);
    } else if (col === 'レア度' || col === '睡眠タイプ') {
      inputs[col] = createSelect(['全て']);
      thFilter.appendChild(inputs[col]);
    } else if (col === 'ポケモン名') {
      inputs.name = document.createElement('input');
      inputs.name.type = 'text'; inputs.name.placeholder = '名前で検索';
      inputs.name.className = 'form-control form-control-sm';
      thFilter.appendChild(inputs.name);
    }
    filterRow.appendChild(thFilter);
  });

  thead.append(filterRow, headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const allRows = [];

  data.forEach(row => {
    const tr = document.createElement('tr');
    // Checkbox
    const tdCheck = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.dataset.id = row.ID;
    cb.checked = !!checkState[row.ID];
    cb.addEventListener('change', () => {
      if (cb.checked) checkState[row.ID] = true;
      else delete checkState[row.ID];
      saveToStorage();
      syncCheckboxes(row.ID, cb.checked);
      renderSummaryTable();
      renderAllTabs();
    });
    tdCheck.appendChild(cb);
    tr.appendChild(tdCheck);

    // Other columns
    ['No','Name','DisplayRarity','Style','ワカクサ本島','シアンの砂浜','トープ洞窟','ウノハナ雪原','ラピスラズリ湖畔','ゴールド旧発電所']
      .forEach(key => {
        const td = document.createElement('td');
        td.textContent = row[key] || '';
        tr.appendChild(td);
      });

    tbody.appendChild(tr);
    allRows.push({ element: tr, data: row });
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);

  // Populate filter options
  populateOptions(inputs['レア度'], new Set(data.map(r => r.DisplayRarity)));
  populateOptions(inputs['睡眠タイプ'], new Set(data.map(r => r.Style)));

  // Filter logic
  Object.values(inputs).forEach(input => input.addEventListener('input', applyFilters));

  function applyFilters() {
    const selRarity = inputs['レア度'].value;
    const selStyle = inputs['睡眠タイプ'].value;
    const nameVal = toHiragana(inputs.name.value.trim());
    const selCheck = inputs.check.value;

    allRows.forEach(({ element, data }) => {
      const checked = !!checkState[data.ID];
      const nameHira = toHiragana(data.Name);
      const matches = (
        (!selRarity || data.DisplayRarity === selRarity) &&
        (!selStyle  || data.Style === selStyle) &&
        (!inputs.name.value || data.Name.includes(inputs.name.value) || nameHira.includes(nameVal)) &&
        (!selCheck || (selCheck === '取得済' ? checked : !checked))
      );
      element.style.display = matches ? '' : 'none';
    });
  }

  return wrapper;

  // Helpers inside createTable
  function createBtn(text, type) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm btn-outline-${type} me-2`;
    btn.textContent = text;
    return btn;
  }
  function createSelect(options) {
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm';
    // 「全て」を選択肢として表示する場合は value を空文字に設定
    select.innerHTML = options.map(o => {
      const val = (o === '全て') ? '' : o;
      return `<option value="${val}">${o}</option>`;
    }).join('');
    return select;
  }">${o}</option>`).join('');
    return select;
  }
  function populateOptions(select, values) {
    values.forEach(v => select.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`));
  }
}

/* Utilities */
function generateRankOptions() {
  const groups = ['ノーマル','スーパー','ハイパー','マスター'];
  return groups.flatMap((g, i) => {
    const count = g === 'マスター' ? 20 : 5;
    return Array.from({ length: count }, (_, idx) => `<option value="${g}${idx+1}">${g}${idx+1}</option>`);
  }).join('');
}

function getRankIndex(rank) {
  const levels = { ノーマル: 0, スーパー: 1, ハイパー: 2, マスター: 3 };
  const match = rank.match(/(ノーマル|スーパー|ハイパー|マスター)(\d+)/);
  if (!match) return -1;
  const [_, label, num] = match;
  return levels[label] * 100 + parseInt(num);
}

function getTabIdByName(name) {
  return {
    'すべての寝顔一覧':'tab-all', 'ワカクサ本島':'tab-wakakusa', 'シアンの砂浜':'tab-cyan',
    'トープ洞窟':'tab-taupe', 'ウノハナ雪原':'tab-unohana', 'ラピスラズリ湖畔':'tab-lapis',
    'ゴールド旧発電所':'tab-gold'
  }[name];
}

function syncCheckboxes(id, checked) {
  document.querySelectorAll(`input[type="checkbox"][data-id="${id}"]`).forEach(cb => {
    if (cb.checked !== checked) cb.checked = checked;
  });
}

const toHiragana = str =>
  str.replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
