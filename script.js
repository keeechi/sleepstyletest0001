
const jsonPath = "pokemonsleep_data.json";
const STORAGE_KEY = "pokemonSleepChecks";
let rawData = {};
let checkState = {};

// ページ初期化
window.addEventListener("DOMContentLoaded", async () => {
  rawData = await fetchData(jsonPath);
  checkState = loadFromStorage();
  renderAllTabs();
  bindExportImport();
  renderSummaryTable();
  renderMainTabs();
});

// JSONデータ取得
async function fetchData(path) {
  const res = await fetch(path);
  return await res.json();
}

// ローカルストレージから読み込み
function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

// ローカルストレージに保存
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkState));
}

// サマリー表を描画
function renderSummaryTable() {
  const container = document.querySelector(".container");
  const baseData = rawData["すべての寝顔一覧"] || [];

// 既存のサマリー表を削除
  const existing = container.querySelector("table.mt-4");
  if (existing) existing.remove();

//描画
  const fields = ["全寝顔", "ワカクサ本島", "シアンの砂浜", "トープ洞窟", "ウノハナ雪原", "ラピスラズリ湖畔", "ゴールド旧発電所"];
  const styles = ["うとうと", "すやすや", "ぐっすり"];

  const summaryTable = document.createElement("table");
  summaryTable.className = "table table-bordered table-sm mt-4";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      ${fields.map(f => `<th>${f}</th>`).join("")}
    </tr>`;
  summaryTable.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const style of styles) {
    const tr = document.createElement("tr");
    const styleCell = document.createElement("th");
    styleCell.textContent = style;
    tr.appendChild(styleCell);

    for (const field of fields) {
      const filtered = baseData.filter(row => {
        if (row.Style !== style) return false;
        if (field === "全寝顔") return true;
        return typeof row[field] === "string" && row[field].trim() !== "";
      });

      const total = filtered.length;
      const checked = filtered.filter(row => checkState[row.ID]).length;
      const rate = total === 0 ? 0 : Math.round((checked / total) * 100);
      const td = document.createElement("td");
      td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  // 合計行
  const trTotal = document.createElement("tr");
  const totalTh = document.createElement("th");
  totalTh.textContent = "合計";
  trTotal.appendChild(totalTh);

  for (const field of fields) {
    const filtered = baseData.filter(row => {
      if (field === "全寝顔") return true;
      return typeof row[field] === "string" && row[field].trim() !== "";
    });

    const total = filtered.length;
    const checked = filtered.filter(row => checkState[row.ID]).length;
    const rate = total === 0 ? 0 : Math.round((checked / total) * 100);
    const td = document.createElement("td");
    td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
    trTotal.appendChild(td);
  }

  tbody.appendChild(trTotal);
  summaryTable.appendChild(tbody);

  // フィールド説明文の直後に挿入
  const description = container.querySelector("p");
  description.insertAdjacentElement("afterend", summaryTable);

  // ここでメインタブ（AllTab + 逆引き）を描画
  renderMainTabs();  // ← 追加
}
;

function renderMainTabs() {
  const container = document.querySelector(".container");

  // 既存タブを削除（再描画用）
  const existing = document.getElementById("main-tabs");
  if (existing) existing.remove();

  const tabsWrapper = document.createElement("div");
  tabsWrapper.id = "main-tabs";

  // タブ見出し（親タブ）
  const nav = document.createElement("ul");
  nav.className = "nav nav-tabs mt-3";
  nav.innerHTML = `
    <li class="nav-item">
      <a class="nav-link active" data-bs-toggle="tab" href="#tab-alltabs">寝顔の一覧・フィールドごとの情報</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" data-bs-toggle="tab" href="#tab-reverse">現在のフィールド・ランクから検索</a>
    </li>`;
  tabsWrapper.appendChild(nav);

  // タブ本体
  const content = document.createElement("div");
  content.className = "tab-content border border-top-0 p-3 bg-white";
  content.innerHTML = `
    <!-- サブタブを含むタブ -->
    <div class="tab-pane fade show active" id="tab-alltabs">
      <ul class="nav nav-tabs mb-3" id="subTabNav">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-all">すべての寝顔一覧</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-wakakusa">ワカクサ本島</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-cyan">シアンの砂浜</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-taupe">トープ洞窟</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-unohana">ウノハナ雪原</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-lapis">ラピスラズリ湖畔</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-gold">ゴールド旧発電所</a></li>
      </ul>
      <div class="tab-content" id="subTabContent">
        <div class="tab-pane fade show active" id="tab-all"></div>
        <div class="tab-pane fade" id="tab-wakakusa"></div>
        <div class="tab-pane fade" id="tab-cyan"></div>
        <div class="tab-pane fade" id="tab-taupe"></div>
        <div class="tab-pane fade" id="tab-unohana"></div>
        <div class="tab-pane fade" id="tab-lapis"></div>
        <div class="tab-pane fade" id="tab-gold"></div>
      </div>
    </div>

    <!-- 逆引き検索のタブ -->
    <div class="tab-pane fade" id="tab-reverse">
      <div id="reverse-search" class="mb-3">
        <label>現在のフィールド:
          <select id="reverseField" class="form-select form-select-sm d-inline w-auto ms-2">
            <option value="">--選択--</option>
            <option value="ワカクサ本島">ワカクサ本島</option>
            <option value="シアンの砂浜">シアンの砂浜</option>
            <option value="トープ洞窟">トープ洞窟</option>
            <option value="ウノハナ雪原">ウノハナ雪原</option>
            <option value="ラピスラズリ湖畔">ラピスラズリ湖畔</option>
            <option value="ゴールド旧発電所">ゴールド旧発電所</option>
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
  tabsWrapper.appendChild(content);

    // SummaryTableの直後に挿入
    const summaryTable = document.querySelector("table.mt-4");
    if (summaryTable) {
      summaryTable.insertAdjacentElement("afterend", tabsWrapper);
    } else {
      container.appendChild(tabsWrapper);
    }
  
    renderAllTabs();
    bindReverseSearch();
  
  document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener("shown.bs.tab", event => {
      const isReverse = event.target.getAttribute("href") === "#tab-reverse";
      const alltabsPane = document.getElementById("tab-alltabs");
      if (alltabsPane) {
        alltabsPane.style.display = isReverse ? "none" : "";
      }
    });
  });
    
}

function generateRankOptions() {
  const groups = ["ノーマル", "スーパー", "ハイパー", "マスター"];
  let options = "";
  groups.forEach((g, i) => {
    const count = g === "マスター" ? 20 : 5;
    for (let j = 1; j <= count; j++) {
      options += `<option value="${g}${j}">${g}${j}</option>`;
    }
  });
  return options;
}

// ランクの順序を比較できるように数値化
function getRankIndex(rank) {
  const levels = { ノーマル: 0, スーパー: 1, ハイパー: 2, マスター: 3 };
  const match = rank.match(/(ノーマル|スーパー|ハイパー|マスター)(\d+)/);
  if (!match) return -1;
  const [_, label, num] = match;
  return levels[label] * 100 + parseInt(num);
}

// 逆引き検索イベント
function bindReverseSearch() {
  document.getElementById("reverseBtn").addEventListener("click", () => {
    const field = document.getElementById("reverseField").value;
    const rank = document.getElementById("reverseRank").value;
    if (!field || !rank) return;

    const baseData = rawData["すべての寝顔一覧"] || [];
    const rankThreshold = getRankIndex(rank);

    const filtered = baseData.filter(row => {
      const fieldRank = row[field];
      if (!fieldRank || getRankIndex(fieldRank) > rankThreshold) return false;
      return !checkState[row.ID];
    });

    renderReverseResult(filtered);
  });
}

// 逆引き結果テーブル描画
function renderReverseResult(data) {
  const container = document.getElementById("reverseResult");
  container.innerHTML = ""; // クリア

  const tableWrapper = createTable(data);
  container.appendChild(tableWrapper);
}

// タブごとの表を描画（出現しないポケモンは除外）
function renderAllTabs() {
  const fieldKeys = {
    "ワカクサ本島": "ワカクサ本島",
    "シアンの砂浜": "シアンの砂浜",
    "トープ洞窟": "トープ洞窟",
    "ウノハナ雪原": "ウノハナ雪原",
    "ラピスラズリ湖畔": "ラピスラズリ湖畔",
    "ゴールド旧発電所": "ゴールド旧発電所"
  };

  const baseData = rawData["すべての寝顔一覧"] || [];

  for (const tabName of [
    "すべての寝顔一覧",
    "ワカクサ本島",
    "シアンの砂浜",
    "トープ洞窟",
    "ウノハナ雪原",
    "ラピスラズリ湖畔",
    "ゴールド旧発電所"
  ]) {
    const tabId = getTabIdByName(tabName);
    const container = document.getElementById(tabId);
    if (!container) continue;

    let displayRecords = baseData;

    if (fieldKeys[tabName]) {
      const fieldKey = fieldKeys[tabName];
      displayRecords = baseData.filter(row => {
        const val = row[fieldKey];
        return typeof val === "string" && val.trim() !== "";
      });
    }

  const tableWrapper = createTable(displayRecords);
  container.innerHTML = "";
  container.appendChild(tableWrapper);
  }
}

// タブ名 → HTML上のIDに変換
function getTabIdByName(name) {
  return {
    "すべての寝顔一覧": "tab-all",
    "ワカクサ本島": "tab-wakakusa",
    "シアンの砂浜": "tab-cyan",
    "トープ洞窟": "tab-taupe",
    "ウノハナ雪原": "tab-unohana",
    "ラピスラズリ湖畔": "tab-lapis",
    "ゴールド旧発電所": "tab-gold"
  }[name];
}

// 表の作成
function createTable(data) {
  const tableWrapper = document.createElement("div");
  
// 一括チェックON/OFF ボタン + モーダル実装
const controlWrapper = document.createElement("div");
controlWrapper.className = "mb-2";

// ボタン作成
const checkAllBtn = document.createElement("button");
checkAllBtn.className = "btn btn-sm btn-outline-success me-2";
checkAllBtn.textContent = "全てを取得済にする";

const uncheckAllBtn = document.createElement("button");
uncheckAllBtn.className = "btn btn-sm btn-outline-danger";
uncheckAllBtn.textContent = "全てを未取得にする";

controlWrapper.appendChild(checkAllBtn);
controlWrapper.appendChild(uncheckAllBtn);
tableWrapper.appendChild(controlWrapper);

// モーダル用のHTMLを作成
const modal = document.createElement("div");
modal.innerHTML = `
<div class="modal fade" tabindex="-1" id="confirmModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">確認</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button>
      </div>
      <div class="modal-body">
        <p id="confirmMessage">この操作を実行しますか？</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">実行しません</button>
        <button type="button" class="btn btn-primary" id="confirmOkBtn">実行します</button>
      </div>
    </div>
  </div>
</div>`;
document.body.appendChild(modal);

// モーダル制御用
let modalAction = null;
const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
const confirmMessage = document.getElementById("confirmMessage");
const confirmOkBtn = document.getElementById("confirmOkBtn");

// ボタンイベント設定
checkAllBtn.addEventListener("click", () => {
  confirmMessage.textContent = "全ての寝顔を取得済の状態にしますか？";
  modalAction = () => {
    data.forEach(row => {
      checkState[row.ID] = true;
    });
    saveToStorage();
    renderAllTabs();
    renderSummaryTable();
    renderMainTabs();
  };
  confirmModal.show();
});

uncheckAllBtn.addEventListener("click", () => {
  confirmMessage.textContent = "全ての寝顔を未取得の状態にしますか？";
  modalAction = () => {
    data.forEach(row => {
      delete checkState[row.ID];
    });
    saveToStorage();
    renderAllTabs();
    renderSummaryTable();
    renderMainTabs();
  };
  confirmModal.show();
});

// 実行ボタン押下時の動作
confirmOkBtn.addEventListener("click", () => {
  if (typeof modalAction === "function") {
    modalAction();
  }
  confirmModal.hide();
});
  
  const table = document.createElement("table");
  table.className = "table table-bordered table-hover table-sm";

  const thead = document.createElement("thead");
  const filterRow = document.createElement("tr");
  const headerRow = document.createElement("tr");

  const columns = [
    "取得", "図鑑No", "ポケモン名", "レア度", "睡眠タイプ",
    "ワカクサ本島", "シアンの砂浜", "トープ洞窟", "ウノハナ雪原",
    "ラピスラズリ湖畔", "ゴールド旧発電所"
  ];

  const filters = {};
  const selectElements = {};

  columns.forEach((col, index) => {
  const th = document.createElement("th");
  th.textContent = col;
  headerRow.appendChild(th);

  const filterTh = document.createElement("th");

  if (col === "取得") {
    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    select.innerHTML = `
      <option value="">全て</option>
      <option value="取得済">取得済</option>
      <option value="未取得">未取得</option>`;
    filterTh.appendChild(select);
    selectElements[col] = select;

    select.addEventListener("change", updateFilteredRows);
  }

  else if (col === "レア度" || col === "睡眠タイプ") {
    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    select.innerHTML = `<option value="">全て</option>`;
    selectElements[col] = select;
    filterTh.appendChild(select);

    select.addEventListener("change", updateFilteredRows);
  }

  else if (col === "ポケモン名") {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "名前で検索";
    input.className = "form-control form-control-sm";
    filterTh.appendChild(input);
    selectElements[col] = input;

    input.addEventListener("input", updateFilteredRows);
  }

  filterRow.appendChild(filterTh);
});

  thead.appendChild(filterRow);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  const allRows = [];

  for (const row of data) {
    const tr = document.createElement("tr");

    // チェックボックス列
    const tdCheck = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("data-id", row.ID);
    checkbox.checked = !!checkState[row.ID];
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        checkState[row.ID] = true;
      } else {
        delete checkState[row.ID];
      }
      saveToStorage();
      syncCheckboxes(row.ID, checkbox.checked);
      renderSummaryTable();
      renderMainTabs();
    });
    tdCheck.appendChild(checkbox);
    tr.appendChild(tdCheck);

    // 残りの列
    const rowValues = [
      row.No, row.Name, row.DisplayRarity, row.Style,
      row["ワカクサ本島"] || "",
      row["シアンの砂浜"] || "",
      row["トープ洞窟"] || "",
      row["ウノハナ雪原"] || "",
      row["ラピスラズリ湖畔"] || "",
      row["ゴールド旧発電所"] || ""
    ];

    rowValues.forEach((val, idx) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
    allRows.push({ element: tr, row });
  }

  table.appendChild(tbody);
  tableWrapper.appendChild(table);

  // ユニーク値を抽出してセレクトボックスに反映
  const raritySet = new Set(data.map(row => row.DisplayRarity));
  const styleSet = new Set(data.map(row => row.Style));
  raritySet.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    selectElements["レア度"].appendChild(option);
  });
  styleSet.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    selectElements["睡眠タイプ"].appendChild(option);
  });

const toHiragana = str =>
  str.replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

function updateFilteredRows() {
  const rarity = selectElements["レア度"].value;
  const style = selectElements["睡眠タイプ"].value;
  const nameFilter = selectElements["ポケモン名"].value.trim();
  const checkFilter = selectElements["取得"].value;

  const nameFilterHira = toHiragana(nameFilter);

  allRows.forEach(({ element, row }) => {
    const isChecked = !!checkState[row.ID];
    const name = row.Name;
    const nameHira = toHiragana(name);

    const matchesRarity = !rarity || row.DisplayRarity === rarity;
    const matchesStyle = !style || row.Style === style;
    const matchesName =
      !nameFilter ||
      name.includes(nameFilter) ||
      nameHira.includes(nameFilterHira);
    const matchesCheck = !checkFilter ||
      (checkFilter === "取得済" && isChecked) ||
      (checkFilter === "未取得" && !isChecked);

    const shouldShow = matchesRarity && matchesStyle && matchesName && matchesCheck;
    element.style.display = shouldShow ? "" : "none";
  });
}

  return tableWrapper;
}

// 同じIDのチェックボックスを全タブで連動
function syncCheckboxes(id, checked) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id="' + id + '"]');
  checkboxes.forEach(cb => {
    if (cb.checked !== checked) {
      cb.checked = checked;
    }
  });
}

// バックアップ用：エクスポート・インポート
function bindExportImport() {
  const exportBtn = document.getElementById("exportBtn");
  const importFile = document.getElementById("importFile");

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(checkState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported === "object") {
          checkState = imported;
          saveToStorage();
          renderAllTabs();
        }
      } catch {
        alert("無効なJSONファイルです。");
      }
    };
    reader.readAsText(file);
  });
}
