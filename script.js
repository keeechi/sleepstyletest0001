// script.js

const jsonPath = "pokemonsleep_data.json";
const STORAGE_KEY = "pokemonSleepChecks";
let rawData = {};
let checkState = {};

// ページ初期化
window.addEventListener("DOMContentLoaded", async () => {
  rawData = await fetchData(jsonPath);
  checkState = loadFromStorage();
  renderSummaryTable();    // 以前のサマリー表を維持
  renderMainTabs();        // 新しい３タブ UI を描画
});

// JSONデータ取得
async function fetchData(path) {
  const res = await fetch(path);
  return await res.json();
}

// ローカルストレージ読み込み・保存
function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkState));
}

// ── メインタブ描画 ──
function renderMainTabs() {
  renderAllChecklist();
  renderFieldLists();
  bindExportImport();
}

// １．全寝顔チェックリスト
function renderAllChecklist() {
  const tbody = document.querySelector("#allChecklist tbody");
  tbody.innerHTML = "";
  const data = rawData["すべての寝顔一覧"] || [];

  // ポケモン名ごとに「DisplayRarityの★数」を集約
  const groups = {};
  data.forEach(row => {
    const key = row.Name;
    if (!groups[key]) {
      groups[key] = { No: row.No, Name: row.Name, variants: {} };
    }
    const starCount = (row.DisplayRarity.match(/★/g) || []).length;
    if (starCount >= 1 && starCount <= 4) {
      groups[key].variants[starCount] = row.ID;
    }
  });

  Object.values(groups).forEach(g => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.No}</td>
      <td>${g.Name}</td>
      ${[1,2,3,4].map(i => {
        const id = g.variants[i] || "";
        const acquired = id && checkState[id];
        return `<td class="star-cell" data-id="${id}" data-star="${i}"
                   style="cursor:pointer;${acquired?"background:lightblue":""}">
                  ${id?("☆"+i):""}
                </td>`;
      }).join("")}
    `;
    tbody.appendChild(tr);
  });

  // クリックでトグル
  document.querySelectorAll("#allChecklist .star-cell").forEach(td => {
    td.addEventListener("click", () => {
      const id = td.dataset.id;
      if (!id) return;
      if (checkState[id]) {
        delete checkState[id];
        td.style.background = "";
      } else {
        checkState[id] = true;
        td.style.background = "lightblue";
      }
      saveToStorage();
    });
  });
}

// ２．フィールドごとの寝顔一覧
function renderFieldLists() {
  const fields = ["ワカクサ本島","シアンの砂浜","トープ洞窟","ウノハナ雪原","ラピスラズリ湖畔","ゴールド旧発電所"];
  const data = rawData["すべての寝顔一覧"] || [];

  fields.forEach((field, idx) => {
    const tbody = document.querySelector(`#field-${idx} tbody`);
    tbody.innerHTML = "";

    data.forEach(row => {
      // 出現しない場合はスキップ
      if (!row[field]) return;
      const starCount = (row.DisplayRarity.match(/★/g) || []).length;
      if (starCount < 1 || starCount > 4) return;

      const acquired = checkState[row.ID];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.No}</td>
        <td>${row.Name}</td>
        ${[1,2,3,4].map(i => {
          if (i === starCount) {
            return `<td class="star-cell" data-id="${row.ID}" data-star="${i}"
                      style="cursor:pointer;${acquired?"background:lightblue":""}">
                     ☆${i}
                    </td>`;
          } else {
            return "<td></td>";
          }
        }).join("")}
      `;
      tbody.appendChild(tr);
    });

    // トグルバインド
    document.querySelectorAll(`#field-${idx} .star-cell`).forEach(td => {
      td.addEventListener("click", () => {
        const id = td.dataset.id;
        if (checkState[id]) {
          delete checkState[id];
          td.style.background = "";
        } else {
          checkState[id] = true;
          td.style.background = "lightblue";
        }
        saveToStorage();
      });
    });
  });
}

// ３．バックアップ＆復旧
function bindExportImport() {
  const exportBtn = document.getElementById("exportBtn");
  const importFile = document.getElementById("importFile");

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(checkState, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (typeof imported === "object") {
          checkState = imported;
          saveToStorage();
          renderAllChecklist();
          renderFieldLists();
        }
      } catch {
        alert("無効なJSONファイルです。");
      }
    };
    reader.readAsText(file);
  });
}
