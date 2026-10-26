const KEY = "money-ledger-v3";
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const defaultExpenseCategories = ["Food","Transport","PG/Rent","Shopping","Bills","Personal","Other"];

let state = loadState();
let expenseView = new Date();
let editing = null;
let selectedIncomeCategory = null;
let expandedIncomeCategory = null;
let incomeForm = null;
let selectedAssetId = null;
let expenseMode = "month";
let pendingConfirmation = null;
let editingNoteId = null;
let expenseFormChanged = false;

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const homeSummary = document.getElementById("homeSummary");
const homeInsights = document.getElementById("homeInsights");
const incomeOverview = document.getElementById("incomeOverview");
const incomeDetail = document.getElementById("incomeDetail");
const expenseOverview = document.getElementById("expenseOverview");
const expenseCalendar = document.getElementById("expenseCalendar");
const expenseCurrentTotal = document.getElementById("expenseCurrentTotal");
const assetList = document.getElementById("assetList");
const assetTotal = document.getElementById("assetTotal");
const addIncomeBtn = document.getElementById("addIncomeBtn");
const addIncomeTypeBtn = document.getElementById("addIncomeTypeBtn");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const addAssetBtn = document.getElementById("addAssetBtn");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const expenseMonthPicker = document.getElementById("expenseMonthPicker");
const themeBtn = document.getElementById("themeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const resetBtn = document.getElementById("resetBtn");
const addPlainNoteBtn = document.getElementById("addPlainNoteBtn");
const notesList = document.getElementById("notesList");
const toastEl = document.getElementById("toast");
const closeModalBtn = document.getElementById("modalCloseBtn");
const modalBackdrop = document.querySelector(".modal-backdrop");

function freshState() {
  return {
    incomeCategories: ["Salary", "Interest", "Grow Interest", "Bonus", "Other"],
    expenseCategories: [...defaultExpenseCategories],
    income: [],
    expenses: [],
    assets: [],
    notes: []
  };
}

function normalizeState(value) {
  const base = freshState();
  return {
    incomeCategories: Array.isArray(value?.incomeCategories) && value.incomeCategories.length ? value.incomeCategories : base.incomeCategories,
    expenseCategories: Array.isArray(value?.expenseCategories) && value.expenseCategories.length ? value.expenseCategories : base.expenseCategories,
    income: Array.isArray(value?.income) ? value.income : [],
    expenses: Array.isArray(value?.expenses) ? value.expenses : [],
    assets: Array.isArray(value?.assets) ? value.assets.map((asset) => ({
      ...asset,
      transactions: Array.isArray(asset.transactions) ? asset.transactions : []
    })) : [],
    notes: Array.isArray(value?.notes) ? value.notes.map((note) => ({
      id: note.id || id(),
      body: note.type === "table"
        ? (note.entries || []).map((entry) => [entry.date, entry.amount, entry.description].filter(Boolean).join(" | ")).join("\n")
        : String(note.body || ""),
      type: "plain"
    })) : []
  };
}

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function ym(date) {
  const isDate = date instanceof Date;
  const base = isDate ? date : new Date(`${date}-01T00:00:00`);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function ymd(dateLike) {
  const base = new Date(`${dateLike}T00:00:00`);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.income) && Array.isArray(parsed.expenses) && Array.isArray(parsed.assets)) {
      return normalizeState(parsed);
    }
  } catch (error) {
    console.warn("Could not parse stored state", error);
  }
  return freshState();
}

function seedDemoData() {
  const s = freshState();
  [
    ["2025-08", 63540], ["2025-09", 49191], ["2025-10", 56191], ["2025-11", 51911],
    ["2025-12", 51264], ["2026-01", 54521], ["2026-02", 51266], ["2026-03", 51266],
    ["2026-04", 60566], ["2026-05", 49567], ["2026-06", 49567], ["2026-07", 60316],
    ["2026-08", 55472]
  ].forEach(([month, amount]) => s.income.push({ id: id(), month, category: "Salary", amount, note: "Monthly salary" }));

  [
    ["2026-09", 170, "Interest", "Bank interest"],
    ["2026-09", 2882, "Interest", "Savings interest"],
    ["2026-09", 239, "Grow Interest", "Investment return"],
    ["2026-09", 625, "Interest", "FD payout"]
  ].forEach(([month, amount, category, note]) => s.income.push({ id: id(), month, amount, category, note }));

  [
    ["2026-09-01", 120, "Groceries", "Food", ""],
    ["2026-09-02", 260, "Travel", "Transport", ""],
    ["2026-09-03", 850, "PG rent", "PG/Rent", ""],
    ["2026-09-05", 150, "Snacks", "Food", ""],
    ["2026-09-07", 75, "Recharge", "Bills", ""],
    ["2026-09-09", 990, "Shopping", "Shopping", ""],
    ["2026-09-10", 50, "Medicine", "Personal", ""],
    ["2026-09-12", 180, "Dinner", "Food", ""],
    ["2026-09-15", 70, "Bus pass", "Transport", ""],
    ["2026-09-18", 70, "Internet", "Bills", ""],
    ["2026-09-20", 420, "Home needs", "Other", ""],
    ["2026-09-22", 624, "Weekend shopping", "Shopping", ""],
    ["2026-09-25", 1200, "Rent deposit", "PG/Rent", ""],
    ["2026-09-27", 210, "Personal spend", "Personal", ""],
    ["2026-09-29", 160, "Food order", "Food", ""],
    ["2026-08-05", 200, "Movie", "Food", ""],
    ["2026-08-10", 645, "Travel", "Transport", ""],
    ["2026-08-18", 4700, "PG rent", "PG/Rent", ""],
    ["2026-07-03", 110, "Coffee", "Food", ""],
    ["2026-07-11", 450, "Shopping", "Shopping", ""],
    ["2026-07-26", 3000, "Bills", "Bills", ""],
    ["2026-06-09", 315, "Food", "Food", ""],
    ["2026-06-15", 510, "Travel", "Transport", ""],
    ["2026-06-20", 4400, "Rent", "PG/Rent", ""],
    ["2026-05-06", 190, "Grocery", "Food", ""],
    ["2026-05-18", 320, "Movie", "Personal", ""],
    ["2026-05-29", 4000, "PG rent", "PG/Rent", ""]
  ].forEach(([date, amount, description, category, note]) => s.expenses.push({ id: id(), date, amount, description, category, note }));

  [
    ["Bank", 547071], ["FD", 100000], ["Axis FD", 200000], ["Nana", -5000], ["MyLends", 21400],
    ["Chits", 0], ["CoinDCX", 10000], ["Grow", 0], ["IPO", 0], ["MyIPO", 59811]
  ].forEach(([name, opening]) => s.assets.push({ id: id(), name, opening, note: "", transactions: [] }));

  const nana = s.assets.find((asset) => asset.name === "Nana");
  [
    ["2026-09-01", "out", 9000, "PhonePe"],
    ["2026-09-11", "out", 45000, "PhonePe"],
    ["2026-08-02", "in", 35000, "PhonePe"],
    ["2026-08-06", "in", 20000, "PhonePe"],
    ["2026-08-13", "in", 10000, "PhonePe"],
    ["2026-08-14", "out", 10000, "Kannaiah"],
    ["2026-08-15", "in", 10000, "PhonePe"],
    ["2026-08-18", "out", 10000, "PhonePe"],
    ["2026-08-21", "in", 10000, "PhonePe"],
    ["2026-07-04", "in", 15000, "PhonePe"]
  ].forEach(([date, direction, amount, description]) => nana.transactions.push({ id: id(), date, direction, amount, description, note: "" }));

  const lend = s.assets.find((asset) => asset.name === "MyLends");
  [
    ["2026-01-01", "in", 2000, "Ravi anna"],
    ["2026-01-02", "out", 2000, "Rama"],
    ["2026-01-03", "in", 1000, "Nikhil"],
    ["2026-02-04", "out", 2000, "Gangu"],
    ["2026-03-05", "in", 5000, "Wahid"]
  ].forEach(([date, direction, amount, description]) => lend.transactions.push({ id: id(), date, direction, amount, description, note: "" }));

  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
  render();
}

function totalIncome() {
  return state.income.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function totalExpense() {
  return state.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function assetBalance(asset) {
  const txTotal = (asset.transactions || []).reduce((sum, tx) => {
    const value = Number(tx.amount || 0);
    return sum + (tx.direction === "in" ? value : -value);
  }, 0);
  return Number(asset.opening || 0) + txTotal;
}

function totalAssets() {
  return state.assets.reduce((sum, asset) => sum + assetBalance(asset), 0);
}

function showModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal() {
  const wasExpenseForm = Boolean(modalBody.querySelector("#expenseForm"));
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  editing = null;
  pendingConfirmation = null;
  if (editingNoteId) {
    const note = state.notes.find((item) => item.id === editingNoteId);
    if (note && !note.body.trim()) state.notes = state.notes.filter((item) => item.id !== editingNoteId);
    editingNoteId = null;
    persistState();
    renderNotes();
  }
  if (wasExpenseForm && expenseFormChanged) {
    expenseFormChanged = false;
    renderExpenses();
    renderDashboard();
  }
}

function askConfirmation(message, action) {
  pendingConfirmation = action;
  showModal("Please confirm", `
    <div class="confirm-dialog">
      <p>${esc(message)}</p>
      <div class="form-actions">
        <button type="button" class="cancel" onclick="hideModal()">Cancel</button>
        <button type="button" class="danger-action" onclick="confirmPendingAction()">Confirm</button>
      </div>
    </div>
  `);
}

function confirmPendingAction() {
  const action = pendingConfirmation;
  pendingConfirmation = null;
  hideModal();
  if (action) action();
}

function formButtons() {
  return `
    <div class="form-actions">
      <button type="button" class="cancel" onclick="hideModal()">Cancel</button>
      <button class="save" type="submit">Save</button>
    </div>
  `;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function renderDashboard() {
  const incomeTotal = totalIncome();
  const expenseTotal = totalExpense();
  const assetsTotal = totalAssets();

  document.getElementById("dashAssets").textContent = money(assetsTotal);
  document.getElementById("dashAssetCount").textContent = `${state.assets.length} asset${state.assets.length === 1 ? "" : "s"}`;

  const cards = [
    { key: "income", label: "Income", value: incomeTotal, detail: `${state.income.length} entries`, tone: "green" },
    { key: "expenses", label: "Expenses", value: expenseTotal, detail: `${state.expenses.length} entries`, tone: "orange" },
    { key: "assets", label: "Assets", value: assetsTotal, detail: `${state.assets.length} items`, tone: "blue" }
  ];

  homeSummary.innerHTML = cards.map((card) => `
    <button class="summary-card ${card.tone}" data-home-summary="${card.key}">
      <span>${card.label}</span>
      <strong>${money(card.value)}</strong>
      <small>${card.detail}</small>
    </button>
  `).join("");

  homeSummary.querySelectorAll("[data-home-summary]").forEach((button) => {
    button.addEventListener("click", () => showHomeSummary(button.dataset.homeSummary));
  });

  const expected = incomeTotal - expenseTotal;
  const difference = assetsTotal - expected;
  const currentMonth = ym(new Date());
  const currentIncome = state.income.filter((entry) => entry.month === currentMonth).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const currentExpenses = state.expenses.filter((entry) => ymd(entry.date) === currentMonth).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  homeInsights.innerHTML = `
    <div class="insight-card ${Math.abs(difference) < 0.01 ? "matched" : "unmatched"}">
      <div><span class="eyebrow">money check</span><strong>${Math.abs(difference) < 0.01 ? "MATCHED" : "CHECK DIFFERENCE"}</strong><small>Assets compared with income minus expenses</small></div>
      <b>${money(difference)}</b>
    </div>
    <div class="insight-grid">
      <div><span>This month income</span><strong>${money(currentIncome)}</strong></div>
      <div><span>This month expenses</span><strong>${money(currentExpenses)}</strong></div>
      <div><span>Available after expenses</span><strong>${money(currentIncome - currentExpenses)}</strong></div>
    </div>
  `;

}

function renderIncome() {
  const categories = state.incomeCategories.length ? state.incomeCategories : ["Other"];
  if (!selectedIncomeCategory || !categories.includes(selectedIncomeCategory)) {
    selectedIncomeCategory = categories[0];
  }

  const totals = categories.map((category) => {
    const entries = state.income.filter((entry) => entry.category === category);
    return {
      category,
      total: entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      count: entries.length
    };
  });

  incomeOverview.innerHTML = totals.map(({ category, total, count }) => {
    const expanded = expandedIncomeCategory === category;
    const entries = state.income.filter((entry) => entry.category === category).sort((a, b) => b.month.localeCompare(a.month));
    return `
      <div class="expand-card ${expanded ? "active" : ""}">
        <button class="expand-head" data-income-toggle="${esc(category)}" aria-expanded="${expanded}">
          <span><b>${esc(category)}</b><small>${count} entries</small></span>
          <strong>${money(total)}</strong>
          <i class="chevron" aria-hidden="true"></i>
        </button>
        ${expanded ? `
          <div class="expand-body">
            <div class="row-actions"><button class="primary small" data-add-category="${esc(category)}">Add entry</button><button class="secondary small" data-delete-category="${esc(category)}">Delete</button></div>
            ${incomeForm && incomeForm.category === category && incomeForm.mode === "add" ? incomeFormMarkup(category) : ""}
            <div class="table-wrap">
              <table class="ledger-table">
                <thead><tr><th>Month</th><th>Amount</th><th>Note</th><th></th></tr></thead>
                <tbody>${entries.length ? entries.map((entry) => `
                  <tr><td>${entry.month}</td><td>${money(entry.amount)}</td><td>${esc(entry.note || "—")}</td><td><div class="income-row-actions"><button class="small-btn" onclick="editIncome('${entry.id}')">Edit</button><button class="row-delete" onclick="deleteIncome('${entry.id}')" aria-label="Delete income entry" title="Delete income entry">×</button></div></td></tr>
                  ${incomeForm?.mode === "edit" && incomeForm.id === entry.id ? `<tr class="inline-edit-row"><td colspan="4">${incomeFormMarkup(category)}</td></tr>` : ""}
                `).join("") : '<tr><td colspan="4"><div class="empty-state">No entries yet.</div></td></tr>'}</tbody>
              </table>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  incomeOverview.querySelectorAll("[data-income-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      expandedIncomeCategory = expandedIncomeCategory === button.dataset.incomeToggle ? null : button.dataset.incomeToggle;
      selectedIncomeCategory = expandedIncomeCategory || selectedIncomeCategory;
      renderIncome();
    });
  });

  incomeOverview.querySelectorAll("[data-add-category]").forEach((button) => {
    button.addEventListener("click", () => {
      incomeForm = { mode: "add", category: button.dataset.addCategory };
      expandedIncomeCategory = button.dataset.addCategory;
      renderIncome();
    });
  });

  incomeOverview.querySelectorAll("[data-delete-category]").forEach((button) => {
    button.addEventListener("click", () => deleteIncomeType(button.dataset.deleteCategory));
  });

  incomeOverview.querySelectorAll("[data-income-form]").forEach((form) => form.addEventListener("submit", submitIncome));
  incomeOverview.querySelectorAll("[data-income-cancel]").forEach((button) => button.addEventListener("click", () => {
    incomeForm = null;
    renderIncome();
  }));

  incomeDetail.innerHTML = `<div class="section-total card"><span>Total income</span><strong>${money(totalIncome())}</strong></div>`;
}

function incomeFormMarkup(category) {
  const entry = incomeForm.mode === "edit" ? state.income.find((item) => item.id === incomeForm.id) : null;
  return `
    <form class="inline-income-form" data-income-form>
      <div class="inline-form-grid">
        <label>Month<input name="month" type="month" value="${entry?.month || ym(new Date())}" required></label>
        <label>Amount<input name="amount" type="number" min="0" step="0.01" value="${entry?.amount || ""}" required></label>
        <label class="inline-note">Note<input name="note" value="${esc(entry?.note || "")}" placeholder="Optional note"></label>
      </div>
      <div class="row-actions">
        <button type="button" class="secondary small" data-income-cancel>Cancel</button>
        <button type="submit" class="primary small">${incomeForm.mode === "edit" ? "Save changes" : "Save entry"}</button>
      </div>
    </form>
  `;
}

function editIncome(idValue) {
  const entry = state.income.find((item) => item.id === idValue);
  if (!entry) return;

  selectedIncomeCategory = entry.category;
  expandedIncomeCategory = entry.category;
  incomeForm = { mode: "edit", id: idValue, category: entry.category };
  renderIncome();
}

function deleteIncome(idValue) {
  askConfirmation("Delete this income entry?", () => {
    state.income = state.income.filter((entry) => entry.id !== idValue);
    if (incomeForm?.id === idValue) incomeForm = null;
    saveState();
    toast("Income entry deleted");
  });
}

function submitIncome(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    id: incomeForm?.id || id(),
    month: form.elements.month.value,
    category: incomeForm?.category || selectedIncomeCategory || "Other",
    amount: Number(form.elements.amount.value || 0),
    note: form.elements.note.value.trim()
  };

  if (!payload.month || payload.amount <= 0) return;

  if (incomeForm?.mode === "edit") {
    const index = state.income.findIndex((item) => item.id === incomeForm.id);
    if (index >= 0) state.income[index] = payload;
  } else {
    state.income.push(payload);
  }

  selectedIncomeCategory = payload.category;
  expandedIncomeCategory = payload.category;
  incomeForm = null;
  saveState();
  toast("Income saved");
}

function addIncomeType() {
  const value = window.prompt("Create a new income type");
  const cleaned = value ? value.trim() : "";
  if (!cleaned) return;
  if (!state.incomeCategories.includes(cleaned)) {
    state.incomeCategories.push(cleaned);
    selectedIncomeCategory = cleaned;
    saveState();
    toast("Income type added");
  }
}

function deleteIncomeType(category) {
  if (state.incomeCategories.length <= 1) {
    toast("Keep at least one income type");
    return;
  }

  askConfirmation(`Delete ${category} and all its income entries?`, () => {
    state.incomeCategories = state.incomeCategories.filter((item) => item !== category);
    state.income = state.income.filter((entry) => entry.category !== category);
    if (selectedIncomeCategory === category) selectedIncomeCategory = null;
    if (expandedIncomeCategory === category) expandedIncomeCategory = null;
    incomeForm = null;
    saveState();
    toast("Income type deleted");
  });
}

function renderExpenses() {
  const key = ym(expenseView);
  const year = expenseView.getFullYear();
  const monthIndex = expenseView.getMonth();
  expenseMonthPicker.textContent = `${months[monthIndex]} ${year}`;

  const monthTotal = state.expenses.filter((entry) => ymd(entry.date) === key).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const monthlyKeys = [...new Set(state.expenses.map((entry) => ymd(entry.date)))].sort().reverse();
  const overallTotal = monthlyKeys.reduce((sum, monthKey) => {
    const total = state.expenses.filter((entry) => ymd(entry.date) === monthKey).reduce((inner, entry) => inner + Number(entry.amount || 0), 0);
    return sum + total;
  }, 0);

  const overallExpanded = expenseMode === "overall";
  expenseOverview.innerHTML = `
    <div class="expand-card expense-overall-card ${overallExpanded ? "active" : ""}">
      <button class="expand-head" data-expense-mode="overall" aria-expanded="${overallExpanded}">
        <span><b>Overall summary</b><small>${monthlyKeys.length} months</small></span>
        <strong>${money(overallTotal)}</strong>
        <i class="chevron ${overallExpanded ? "up" : ""}" aria-hidden="true"></i>
      </button>
      ${overallExpanded ? `
        <div class="expand-body expense-overall-body">
          <div class="table-wrap">
            <table class="ledger-table">
              <thead><tr><th>Month</th><th>Total</th></tr></thead>
              <tbody>${monthlyKeys.map((monthKey) => `<tr><td>${monthLabel(monthKey)}</td><td>${money(state.expenses.filter((entry) => ymd(entry.date) === monthKey).reduce((sum, entry) => sum + Number(entry.amount || 0), 0))}</td></tr>`).join("") || '<tr><td colspan="2">No expense data yet.</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      ` : ""}
    </div>
  `;
  expenseCurrentTotal.innerHTML = `<span>This month</span><strong>${money(monthTotal)}</strong><small>${months[monthIndex]} ${year}</small>`;

  expenseOverview.querySelectorAll("[data-expense-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      expenseMode = expenseMode === button.dataset.expenseMode ? "month" : button.dataset.expenseMode;
      renderExpenses();
    });
  });

  if (expenseMode === "overall") {
    const monthTotals = monthlyKeys.map((monthKey) => ({
      monthKey,
      total: state.expenses.filter((entry) => ymd(entry.date) === monthKey).reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    }));

    expenseCalendar.innerHTML = "";
    return;
  }

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let html = "";

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${key}-${String(day).padStart(2, "0")}`;
    const rows = state.expenses.filter((entry) => entry.date === date);
    const total = rows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const weekday = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });

    html += `
      <div id="day-${date}" class="day-card">
        <div class="day-head">
          <div><span class="day-number">${day}</span><span class="day-name">${weekday}</span></div>
          <span class="day-total">${money(total)}</span>
        </div>
        <div class="expense-table">
          <div class="expense-table-head"><span>Amount</span><span>Description</span><span></span></div>
          ${rows.length ? rows.map((entry) => `
            <div class="expense-edit-row" data-entry-id="${entry.id}">
              <input class="quick-amount" type="number" value="${entry.amount}" data-entry-id="${entry.id}">
              <input class="quick-desc" value="${esc(entry.description)}" data-entry-id="${entry.id}">
              <button class="row-delete" onclick="removeExpense('${entry.id}')">×</button>
            </div>
          `).join("") : '<div class="empty-row">No expense entries.</div>'}
          <div id="newrows-${date}"></div>
          <div class="row-actions">
            <button class="secondary small" onclick="addExpenseRow('${date}')">Add row</button>
          </div>
        </div>
      </div>
    `;
  }

  expenseCalendar.innerHTML = html;
}

function persistState() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function updateExpenseTotals(date) {
  const rows = state.expenses.filter((entry) => entry.date === date);
  const total = rows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const dayTotal = document.querySelector(`#day-${date} .day-total`);
  if (dayTotal) dayTotal.textContent = money(total);

  const monthKey = ym(expenseView);
  const monthTotal = state.expenses
    .filter((entry) => ymd(entry.date) === monthKey)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  expenseCurrentTotal.innerHTML = `<span>This month</span><strong>${money(monthTotal)}</strong><small>${months[expenseView.getMonth()]} ${expenseView.getFullYear()}</small>`;
  renderDashboard();
}

function autosaveExpenseRow(row, date) {
  const amountInput = row.querySelector(".quick-amount");
  const descInput = row.querySelector(".quick-desc");
  const amount = Number(amountInput?.value || 0);
  const description = descInput?.value.trim() || "";
  const entryId = row.dataset.entryId;
  const existing = state.expenses.find((entry) => entry.id === entryId);

  if (!amount || !description) return;

  if (existing) {
    existing.amount = amount;
    existing.description = description;
  } else {
    const entry = { id: id(), date, amount, description, category: "Other", note: "" };
    state.expenses.push(entry);
    row.dataset.entryId = entry.id;
    row.classList.remove("new");
    amountInput.dataset.entryId = entry.id;
    descInput.dataset.entryId = entry.id;
  }

  persistState();
  updateExpenseTotals(date);
}

function addExpenseRow(date) {
  const container = document.getElementById(`newrows-${date}`);
  if (!container) return;

  const row = document.createElement("div");
  row.className = "expense-edit-row new";
  row.innerHTML = `
    <input class="quick-amount" type="number" placeholder="Amount" inputmode="decimal">
    <input class="quick-desc" placeholder="Description">
    <button class="row-delete" onclick="confirmRemoveDraftRow(this)">×</button>
  `;
  container.appendChild(row);
}

function removeExpense(idValue) {
  askConfirmation("Delete this expense?", () => {
    state.expenses = state.expenses.filter((entry) => entry.id !== idValue);
    saveState();
    toast("Expense removed");
  });
}

function confirmRemoveDraftRow(button) {
  const row = button.parentElement;
  if (row?.dataset.entryId) {
    removeExpense(row.dataset.entryId);
    return;
  }
  askConfirmation("Remove this unsaved row?", () => button.parentElement.remove());
}

function addExpenseForDate(date) {
  expenseFormChanged = false;
  showModal("Add expense", `
    <form id="expenseForm" class="form" onsubmit="event.preventDefault(); hideModal()">
      <div class="field"><label>Date</label><input id="fDate" type="date" value="${date}" required></div>
      <div class="field"><label>Amount</label><input id="fAmount" type="number" min="0" step="0.01" required></div>
      <div class="field"><label>Description</label><input id="fDescription" placeholder="e.g. Grocery, rent, travel" required></div>
      <div class="field"><label>Category</label><select id="fCategory">${state.expenseCategories.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}</select></div>
      <div class="field"><label>Note</label><input id="fNote" placeholder="Optional note"></div>
      <div class="form-actions"><button type="button" class="cancel" onclick="hideModal()">Close</button></div>
    </form>
  `);
  const form = document.getElementById("expenseForm");
  form.addEventListener("input", autosaveExpenseForm);
  form.addEventListener("change", autosaveExpenseForm);
}

function autosaveExpenseForm() {
  const form = document.getElementById("expenseForm");
  if (!form || !form.checkValidity()) return;
  const date = document.getElementById("fDate").value;
  const payload = {
    date,
    amount: Number(document.getElementById("fAmount").value || 0),
    description: document.getElementById("fDescription").value.trim(),
    category: document.getElementById("fCategory").value,
    note: document.getElementById("fNote").value.trim()
  };
  if (!payload.date || !payload.description || payload.amount <= 0) return;

  const existing = form.dataset.entryId
    ? state.expenses.find((item) => item.id === form.dataset.entryId)
    : null;
  if (existing) {
    Object.assign(existing, payload);
  } else {
    payload.id = id();
    state.expenses.push(payload);
    form.dataset.entryId = payload.id;
  }

  expenseView = new Date(`${date}T00:00:00`);
  expenseFormChanged = true;
  persistState();
}

function renderAssets() {
  assetTotal.textContent = money(totalAssets());

  if (!state.assets.length) {
    assetList.innerHTML = '<div class="empty-state">No assets yet. Add a bank, FD, or investment account.</div>';
    return;
  }

  assetList.innerHTML = state.assets.map((asset) => {
    const open = selectedAssetId === asset.id;
    const balance = assetBalance(asset);
    const rows = [...(asset.transactions || [])].sort((a, b) => b.date.localeCompare(a.date));

    return `
      <div class="asset-card ${open ? "active" : ""}" data-asset-id="${asset.id}">
        <div class="asset-head" data-asset-toggle="${asset.id}" role="button" tabindex="0" aria-expanded="${open}">
          <div class="asset-main">
            <div class="asset-icon">${esc(asset.name.slice(0, 1).toUpperCase())}</div>
            <div>
              <h3>${esc(asset.name)}</h3>
              <p>Opening ${money(asset.opening || 0)} • ${rows.length} entries</p>
            </div>
          </div>
          <div class="asset-side">
            <strong>${money(balance)}</strong>
            <i class="chevron ${open ? "up" : ""}" aria-hidden="true"></i>
          </div>
        </div>

        ${open ? `
          <div class="asset-detail">
            <div class="detail-header compact">
              <div>
                <div class="eyebrow">ledger</div>
                <h4>${esc(asset.name)}</h4>
              </div>
              <button class="secondary small" data-asset-add="${asset.id}">Add entry</button>
            </div>

            <div id="assetDraft-${asset.id}" class="draft-box"></div>

            <div class="asset-table-wrap">
              <table class="ledger-table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th></th></tr>
                </thead>
                <tbody>
                  ${rows.length ? rows.map((tx) => `
                    <tr class="asset-row-edit" data-transaction-id="${tx.id}">
                      <td><input value="${tx.date}" data-row-field="date"></td>
                      <td>
                        <select data-row-field="direction">
                          <option value="in" ${tx.direction === "in" ? "selected" : ""}>In</option>
                          <option value="out" ${tx.direction === "out" ? "selected" : ""}>Out</option>
                        </select>
                      </td>
                      <td><input type="number" value="${tx.amount}" data-row-field="amount"></td>
                      <td><input value="${esc(tx.description)}" data-row-field="description"></td>
                      <td><button class="row-delete" onclick="deleteAssetTx('${asset.id}','${tx.id}')">×</button></td>
                    </tr>
                  `).join("") : '<tr><td colspan="5"><div class="empty-state">No transactions yet.</div></td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="row-actions">
              <button class="secondary small" onclick="deleteAsset('${asset.id}')">Delete</button>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  assetList.querySelectorAll(".asset-head[data-asset-toggle]").forEach((header) => {
    const toggle = () => {
      selectedAssetId = selectedAssetId === header.dataset.assetToggle ? null : header.dataset.assetToggle;
      renderAssets();
    };
    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  assetList.querySelectorAll("[data-asset-add]").forEach((button) => {
    button.addEventListener("click", () => addAssetDraftRow(button.dataset.assetAdd));
  });

  assetList.oninput = autosaveAssetRow;
  assetList.onchange = autosaveAssetRow;
}

function addAssetDraftRow(assetId) {
  const draftBox = document.getElementById(`assetDraft-${assetId}`);
  if (!draftBox) return;

  const row = document.createElement("div");
  row.className = "asset-draft-row";
  row.innerHTML = `
    <input type="date" value="${new Date().toISOString().slice(0, 10)}" data-row-field="date">
    <select data-row-field="direction">
      <option value="in">In</option>
      <option value="out">Out</option>
    </select>
    <input type="number" placeholder="Amount" step="0.01" data-row-field="amount">
    <input type="text" placeholder="Description" data-row-field="description">
    <button class="row-delete" onclick="removeAssetDraftRow(this)">×</button>
  `;
  draftBox.appendChild(row);
  let actions = draftBox.querySelector(".asset-draft-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "row-actions asset-draft-actions";
    actions.innerHTML = `<button class="primary small" type="button">Save entry</button>`;
    draftBox.appendChild(actions);
    actions.querySelector("button").addEventListener("click", () => saveAssetDraftRows(assetId));
  }
}

function autosaveAssetRow(event) {
  const input = event.target.closest("[data-row-field]");
  const row = input?.closest(".asset-row-edit");
  const assetId = row?.closest(".asset-card")?.dataset.assetId;
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;

  const fields = row.querySelectorAll("[data-row-field]");
  const values = Object.fromEntries([...fields].map((field) => [field.dataset.rowField, field.value]));
  const amount = Number(values.amount || 0);
  const description = values.description?.trim() || "";
  const transaction = asset.transactions.find((tx) => tx.id === row.dataset.transactionId);
  if (!transaction || !values.date || !description || amount <= 0) return;

  Object.assign(transaction, {
    date: values.date,
    direction: values.direction || "in",
    amount,
    description
  });

  persistState();
  assetTotal.textContent = money(totalAssets());
  const balance = row.closest(".asset-card").querySelector(".asset-side strong");
  if (balance) balance.textContent = money(assetBalance(asset));
  const count = row.closest(".asset-card").querySelector(".asset-main p");
  if (count) count.textContent = `Opening ${money(asset.opening || 0)} • ${asset.transactions.length} entries`;
  renderDashboard();
}

function saveAssetDraftRows(assetId) {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;

  const draftRows = [...document.querySelectorAll(`#assetDraft-${assetId} .asset-draft-row`)];
  const validRows = draftRows.filter((row) => {
    const values = Object.fromEntries([...row.querySelectorAll("[data-row-field]")]
      .map((field) => [field.dataset.rowField, field.value]));
    return values.date && values.description?.trim() && Number(values.amount) > 0;
  });
  if (!validRows.length) return;

  validRows.forEach((row) => {
    const values = Object.fromEntries([...row.querySelectorAll("[data-row-field]")]
      .map((field) => [field.dataset.rowField, field.value]));
    asset.transactions.push({
      id: id(),
      date: values.date,
      direction: values.direction || "in",
      amount: Number(values.amount),
      description: values.description.trim(),
      note: ""
    });
    row.remove();
  });

  if (!draftRows.some((row) => row.isConnected)) {
    document.querySelector(`#assetDraft-${assetId} .asset-draft-actions`)?.remove();
  }
  saveState();
  toast("Asset entry saved");
}

function removeAssetDraftRow(button) {
  const row = button.closest(".asset-draft-row");
  const draftBox = row?.parentElement;
  row?.remove();
  if (draftBox && !draftBox.querySelector(".asset-draft-row")) {
    draftBox.querySelector(".asset-draft-actions")?.remove();
  }
}

function deleteAssetTx(assetId, txId) {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;

  askConfirmation("Delete this asset transaction?", () => {
    asset.transactions = (asset.transactions || []).filter((tx) => tx.id !== txId);
    saveState();
    toast("Transaction removed");
  });
}

function addAsset() {
  showModal("Add asset", `
    <form class="form" onsubmit="submitAsset(event)">
      <div class="field"><label>Name</label><input id="fName" placeholder="e.g. Bank, FD, Nana" required></div>
      <div class="field"><label>Opening balance</label><input id="fOpening" type="number" min="0" step="0.01" value="0" required></div>
      <div class="field"><label>Note</label><input id="fNote" placeholder="Optional note"></div>
      ${formButtons()}
    </form>
  `);
}

function submitAsset(event) {
  event.preventDefault();
  const name = document.getElementById("fName").value.trim();
  const opening = Number(document.getElementById("fOpening").value || 0);
  if (!name) return;

  state.assets.push({ id: id(), name, opening, note: document.getElementById("fNote").value.trim(), transactions: [] });
  hideModal();
  saveState();
  toast("Asset added");
}

function deleteAsset(assetId) {
  askConfirmation("Delete this asset and all its transactions?", () => {
    state.assets = state.assets.filter((item) => item.id !== assetId);
    selectedAssetId = null;
    saveState();
    toast("Asset deleted");
  });
}

function showHomeSummary(type) {
  const labels = { income: "Income summary", expenses: "Expense summary", assets: "Asset summary" };
  let content = "";
  if (type === "income") {
    content = state.incomeCategories.map((category) => {
      const total = state.income.filter((entry) => entry.category === category).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      return `<div class="dialog-stat"><span>${esc(category)}</span><strong>${money(total)}</strong></div>`;
    }).join("");
  } else if (type === "expenses") {
    const totals = [...new Set(state.expenses.map((entry) => ymd(entry.date)))].sort().reverse().slice(0, 6);
    content = totals.map((month) => `<div class="dialog-stat"><span>${monthLabel(month)}</span><strong>${money(state.expenses.filter((entry) => ymd(entry.date) === month).reduce((sum, entry) => sum + Number(entry.amount || 0), 0))}</strong></div>`).join("");
  } else {
    content = state.assets.map((asset) => `<div class="dialog-stat"><span>${esc(asset.name)}</span><strong>${money(assetBalance(asset))}</strong></div>`).join("");
  }
  showModal(labels[type], `<div class="dialog-summary">${content || '<div class="empty-state">No data yet.</div>'}</div>`);
}

function renderNotes() {
  const notes = Array.isArray(state.notes) ? state.notes : [];
  notesList.innerHTML = notes.length ? notes.map((note) => `
    <article class="note-card" data-note-open="${note.id}">
      <div class="note-card-head"><p class="note-preview">${esc((note.body || "").slice(0, 160))}</p><button class="row-delete" onclick="deleteNote('${note.id}')">×</button></div>
    </article>
  `).join("") : '<div class="empty-state">No notes yet.</div>';
  notesList.querySelectorAll("[data-note-open]").forEach((card) => card.addEventListener("click", (event) => {
    if (!event.target.closest("button")) editNote(card.dataset.noteOpen);
  }));
}

function editNote(noteId) {
  const note = (state.notes || []).find((item) => item.id === noteId);
  if (!note) return;
  editingNoteId = noteId;
  showModal("Note", `<textarea id="noteBody" class="note-editor" aria-label="Note" placeholder="Take a note...">${esc(note.body || "")}</textarea>`);
  const editor = document.getElementById("noteBody");
  editor.addEventListener("input", () => {
    note.body = editor.value;
    persistState();
  });
  editor.focus();
}

function addNote() {
  state.notes = Array.isArray(state.notes) ? state.notes : [];
  const note = { id: id(), body: "", type: "plain" };
  state.notes.unshift(note);
  persistState();
  editNote(note.id);
}

function deleteNote(noteId) {
  askConfirmation("Delete this note?", () => {
    state.notes = (state.notes || []).filter((note) => note.id !== noteId);
    saveState();
    toast("Note deleted");
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => go(button.dataset.screen)));

  if (addIncomeBtn) addIncomeBtn.addEventListener("click", () => {
    const category = selectedIncomeCategory || state.incomeCategories[0] || "Other";
    expandedIncomeCategory = category;
    incomeForm = { mode: "add", category };
    renderIncome();
  });
  if (addIncomeTypeBtn) addIncomeTypeBtn.addEventListener("click", addIncomeType);
  if (addExpenseBtn) addExpenseBtn.addEventListener("click", () => addExpenseForDate(new Date().toISOString().slice(0, 10)));
  if (addAssetBtn) addAssetBtn.addEventListener("click", addAsset);
  if (addPlainNoteBtn) addPlainNoteBtn.addEventListener("click", addNote);
  if (closeModalBtn) closeModalBtn.addEventListener("click", hideModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", hideModal);
  if (expenseCalendar) expenseCalendar.addEventListener("input", (event) => {
    const input = event.target.closest(".quick-amount, .quick-desc");
    const row = input?.closest(".expense-edit-row");
    const date = row?.closest(".day-card")?.id.replace("day-", "");
    if (row && date) autosaveExpenseRow(row, date);
  });
  if (prevMonth) prevMonth.addEventListener("click", () => {
    expenseView = new Date(expenseView.getFullYear(), expenseView.getMonth() - 1, 1);
    renderExpenses();
  });

  if (nextMonth) nextMonth.addEventListener("click", () => {
    expenseView = new Date(expenseView.getFullYear(), expenseView.getMonth() + 1, 1);
    renderExpenses();
  });

  if (expenseMonthPicker) expenseMonthPicker.addEventListener("click", () => {
    const value = window.prompt("Enter month as YYYY-MM", ym(expenseView));
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      expenseView = new Date(`${value}-01T00:00:00`);
      renderExpenses();
    }
  });

  if (themeBtn) themeBtn.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("money-theme", dark ? "dark" : "light");
  });

  if (settingsBtn) settingsBtn.addEventListener("click", () => go("settings"));

  if (exportBtn) exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `money-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast("Backup exported");
  });

  if (importFile) importFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.income) || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.assets)) throw new Error();
      state = normalizeState(parsed);
      saveState();
      toast("Backup imported");
    } catch (error) {
      alert("Invalid backup file");
    }
    event.target.value = "";
  });

  if (resetBtn) resetBtn.addEventListener("click", () => {
    askConfirmation("Reset all data? This cannot be undone.", () => {
      state = freshState();
      saveState();
      toast("All data reset");
    });
  });

  const prefersLight = localStorage.getItem("money-theme") === "light";
  document.documentElement.classList.toggle("dark", !prefersLight);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js?v=20260918-20").catch(() => {}));
  }
}

function go(screen) {
  document.querySelectorAll(".screen").forEach((panel) => panel.classList.toggle("active", panel.id === screen));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.screen === screen));
  if (settingsBtn) settingsBtn.classList.toggle("active", screen === "settings");
}

function render() {
  renderDashboard();
  renderIncome();
  renderExpenses();
  renderAssets();
  renderNotes();
}

bindEvents();
render();
