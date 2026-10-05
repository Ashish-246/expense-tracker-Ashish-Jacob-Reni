const transactionForm = document.getElementById("transaction-form");
const formHeading = document.getElementById("form-heading");
const typeInput = document.getElementById("transaction-type");
const amountInput = document.getElementById("transaction-amount");
const categoryInput = document.getElementById("transaction-category");
const dateInput = document.getElementById("transaction-date");
const descriptionInput = document.getElementById("transaction-description");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit-button");

const filterTypeSelect = document.getElementById("filter-type");
const filterCategorySelect = document.getElementById("filter-category");
const resetFiltersButton = document.getElementById("reset-filters-button");

const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");

const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const balanceElement = document.getElementById("balance");

const monthlySummaryBody = document.getElementById("monthly-summary-body");
const categoryChart = document.getElementById("category-chart");

const fields = {
  amount: {
    input: amountInput,
    error: document.getElementById("amount-error"),
  },
  category: {
    input: categoryInput,
    error: document.getElementById("category-error"),
  },
  date: {
    input: dateInput,
    error: document.getElementById("date-error"),
  },
  description: {
    input: descriptionInput,
    error: document.getElementById("description-error"),
  },
};

const STORAGE_KEY = "expense-tracker-transactions";

let transactions = [];
let editingTransactionId = null;

// "food" -> "Food"
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatMoney(amount) {
  return amount.toFixed(2);
}

// Returns a signed amount: "+2500.00" or "-45.50"
function formatSignedAmount(transaction) {
  const sign = transaction.type === "income" ? "+" : "-";
  return sign + formatMoney(transaction.amount);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text) {
    element.textContent = text;
  }
  return element;
}

// Today's date as "YYYY-MM-DD" (the format a date input expects)
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonth(monthKey) {
  const parts = monthKey.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function calculateTotals() {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(function (transaction) {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else {
      totalExpenses += transaction.amount;
    }
  });

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  };
}

function groupExpenses(getKey) {
  const totals = {};

  transactions.forEach(function (transaction) {
    if (transaction.type !== "expense") {
      return;
    }

    const key = getKey(transaction);
    totals[key] = (totals[key] || 0) + transaction.amount;
  });

  return totals;
}

function getFilteredTransactions() {
  const selectedType = filterTypeSelect.value;
  const selectedCategory = filterCategorySelect.value;

  return transactions.filter(function (transaction) {
    const matchesType =
      selectedType === "all" || transaction.type === selectedType;
    const matchesCategory =
      selectedCategory === "all" || transaction.category === selectedCategory;

    return matchesType && matchesCategory;
  });
}

function validateTransaction(transaction) {
  const errors = {};

  if (!(transaction.amount > 0)) {
    errors.amount = "Enter an amount greater than 0.";
  } else if (Number(transaction.amount.toFixed(2)) !== transaction.amount) {
    errors.amount = "Use no more than 2 decimal places.";
  }

  if (!transaction.category) {
    errors.category = "Select a category.";
  }

  if (!transaction.date) {
    errors.date = "Choose a date.";
  }

  if (!transaction.description) {
    errors.description = "Enter a description.";
  }

  return errors;
}

function setFieldError(name, message) {
  const field = fields[name];
  field.error.textContent = message;

  if (message) {
    field.input.setAttribute("aria-invalid", "true");
  } else {
    field.input.removeAttribute("aria-invalid");
  }
}

function showErrors(errors) {
  Object.keys(fields).forEach(function (name) {
    setFieldError(name, errors[name] || "");
  });
}

function createTransactionElement(transaction) {
  const item = createElement(
    "li",
    `transaction-item transaction-item--${transaction.type}`
  );
  item.dataset.id = transaction.id;

  const details = createElement("div", "transaction-item__details");
  details.appendChild(
    createElement(
      "p",
      "transaction-item__description",
      transaction.description
    )
  );
  details.appendChild(
    createElement(
      "p",
      "transaction-item__meta",
      `${capitalize(transaction.category)} \u2022 ${transaction.date}`
    )
  );

  const amount = createElement(
    "p",
    "transaction-item__amount",
    formatSignedAmount(transaction)
  );

  const actions = createElement("div", "transaction-item__actions");

  const editButton = createElement("button", "btn btn--small", "Edit");
  editButton.type = "button";
  editButton.dataset.action = "edit";

  const deleteButton = createElement(
    "button",
    "btn btn--small btn--danger",
    "Delete"
  );
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  item.appendChild(details);
  item.appendChild(amount);
  item.appendChild(actions);

  return item;
}

function renderTransactions() {
  const visibleTransactions = getFilteredTransactions();

  transactionList.innerHTML = "";
  emptyMessage.hidden = visibleTransactions.length > 0;
  emptyMessage.textContent =
    transactions.length === 0
      ? "No transactions yet. Add your first one above."
      : "No transactions match your filters.";

  visibleTransactions.forEach(function (transaction) {
    transactionList.appendChild(createTransactionElement(transaction));
  });
}

function renderSummary() {
  const totals = calculateTotals();

  totalIncomeElement.textContent = formatMoney(totals.totalIncome);
  totalExpensesElement.textContent = formatMoney(totals.totalExpenses);
  balanceElement.textContent = formatMoney(totals.balance);
}

function renderMonthlySummary() {
  const totals = groupExpenses(function (transaction) {
    return transaction.date.slice(0, 7);
  });
  const months = Object.keys(totals).sort().reverse();

  monthlySummaryBody.innerHTML = "";

  if (months.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = createElement("td", "empty-message", "No expenses yet.");
    emptyCell.colSpan = 2;
    emptyRow.appendChild(emptyCell);
    monthlySummaryBody.appendChild(emptyRow);
    return;
  }

  months.forEach(function (month) {
    const row = document.createElement("tr");
    row.appendChild(createElement("td", "", formatMonth(month)));
    row.appendChild(createElement("td", "", formatMoney(totals[month])));
    monthlySummaryBody.appendChild(row);
  });
}

function renderCategoryChart() {
  const totals = groupExpenses(function (transaction) {
    return transaction.category;
  });
  const categories = Object.keys(totals).sort(function (a, b) {
    return totals[b] - totals[a];
  });
  const totalExpenses = calculateTotals().totalExpenses;

  categoryChart.innerHTML = "";

  if (categories.length === 0) {
    categoryChart.appendChild(
      createElement(
        "p",
        "empty-message",
        "Your chart will appear here once you add expenses."
      )
    );
    return;
  }

  categories.forEach(function (category) {
    const percent = (totals[category] / totalExpenses) * 100;

    const header = createElement("div", "chart-row__header");
    header.appendChild(
      createElement("span", "chart-row__label", capitalize(category))
    );
    header.appendChild(
      createElement(
        "span",
        "chart-row__value",
        `${formatMoney(totals[category])} (${Math.round(percent)}%)`
      )
    );

    const bar = createElement("div", "chart-row__bar");
    bar.style.width = `${percent}%`;

    const track = createElement("div", "chart-row__track");
    track.setAttribute("aria-hidden", "true");
    track.appendChild(bar);

    const row = createElement("div", "chart-row");
    row.appendChild(header);
    row.appendChild(track);
    categoryChart.appendChild(row);
  });
}

function render() {
  renderTransactions();
  renderSummary();
  renderMonthlySummary();
  renderCategoryChart();
}

function resetFilters() {
  filterTypeSelect.value = "all";
  filterCategorySelect.value = "all";
  renderTransactions();
}

function resetForm() {
  transactionForm.reset();
  dateInput.value = getTodayDate();
  showErrors({});

  editingTransactionId = null;
  formHeading.textContent = "Add transaction";
  submitButton.textContent = "Add transaction";
  cancelEditButton.hidden = true;

  amountInput.focus();
}

function startEditing(id) {
  const transaction = transactions.find(function (item) {
    return item.id === id;
  });

  if (!transaction) {
    return;
  }

  editingTransactionId = id;
  showErrors({});

  typeInput.value = transaction.type;
  amountInput.value = transaction.amount;
  categoryInput.value = transaction.category;
  dateInput.value = transaction.date;
  descriptionInput.value = transaction.description;

  formHeading.textContent = "Edit transaction";
  submitButton.textContent = "Save changes";
  cancelEditButton.hidden = false;

  formHeading.scrollIntoView({ behavior: "smooth" });
  amountInput.focus({ preventScroll: true });
}

function handleFormSubmit(event) {
  // Stop the browser from reloading the page
  event.preventDefault();

  const isEditing = editingTransactionId !== null;

  const formTransaction = {
    id: isEditing ? editingTransactionId : Date.now(),
    type: typeInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    description: descriptionInput.value.trim(),
  };

  const errors = validateTransaction(formTransaction);
  showErrors(errors);

  const invalidFields = Object.keys(errors);
  if (invalidFields.length > 0) {
    fields[invalidFields[0]].input.focus();
    return;
  }

  if (isEditing) {
    const index = transactions.findIndex(function (item) {
      return item.id === editingTransactionId;
    });
    transactions[index] = formTransaction;
  } else {
    // Add to the START of the array so the newest appears first
    transactions.unshift(formTransaction);
  }

  saveTransactions();
  render();
  resetForm();
}

function deleteTransaction(id) {
  const confirmed = confirm("Delete this transaction?");
  if (!confirmed) {
    return;
  }

  transactions = transactions.filter(function (transaction) {
    return transaction.id !== id;
  });

  if (id === editingTransactionId) {
    resetForm();
  }

  saveTransactions();
  render();
}

function handleTransactionListClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const item = button.closest("li");
  const id = Number(item.dataset.id);

  if (button.dataset.action === "edit") {
    startEditing(id);
  } else if (button.dataset.action === "delete") {
    deleteTransaction(id);
  }
}

function init() {
  transactions = loadTransactions();
  dateInput.value = getTodayDate();

  transactionForm.addEventListener("submit", handleFormSubmit);
  cancelEditButton.addEventListener("click", resetForm);
  transactionList.addEventListener("click", handleTransactionListClick);

  filterTypeSelect.addEventListener("change", renderTransactions);
  filterCategorySelect.addEventListener("change", renderTransactions);
  resetFiltersButton.addEventListener("click", resetFilters);

  Object.keys(fields).forEach(function (name) {
    fields[name].input.addEventListener("input", function () {
      setFieldError(name, "");
    });
  });

  render();
}

init();
