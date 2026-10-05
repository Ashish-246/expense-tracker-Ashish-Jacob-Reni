const transactionForm = document.getElementById("transaction-form");
const formHeading = document.getElementById("form-heading");
const typeInput = document.getElementById("transaction-type");
const amountInput = document.getElementById("transaction-amount");
const categoryInput = document.getElementById("transaction-category");
const dateInput = document.getElementById("transaction-date");
const descriptionInput = document.getElementById("transaction-description");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit-button");

const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");

const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const balanceElement = document.getElementById("balance");

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
  transactionList.innerHTML = "";
  emptyMessage.hidden = transactions.length > 0;

  transactions.forEach(function (transaction) {
    transactionList.appendChild(createTransactionElement(transaction));
  });
}

function renderSummary() {
  const totals = calculateTotals();

  totalIncomeElement.textContent = formatMoney(totals.totalIncome);
  totalExpensesElement.textContent = formatMoney(totals.totalExpenses);
  balanceElement.textContent = formatMoney(totals.balance);
}

function render() {
  renderTransactions();
  renderSummary();
}

function resetForm() {
  transactionForm.reset();
  dateInput.value = getTodayDate();

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

  if (
    formTransaction.amount <= 0 ||
    !formTransaction.category ||
    !formTransaction.date ||
    !formTransaction.description
  ) {
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
  dateInput.value = getTodayDate();

  transactionForm.addEventListener("submit", handleFormSubmit);
  cancelEditButton.addEventListener("click", resetForm);
  transactionList.addEventListener("click", handleTransactionListClick);

  render();
}

init();
