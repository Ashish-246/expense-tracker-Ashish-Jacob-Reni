
//  Select the DOM elements we need
const transactionForm = document.getElementById("transaction-form");
const typeInput = document.getElementById("transaction-type");
const amountInput = document.getElementById("transaction-amount");
const categoryInput = document.getElementById("transaction-category");
const dateInput = document.getElementById("transaction-date");
const descriptionInput = document.getElementById("transaction-description");
 
const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");

//  Data

// Temporary sample data so we can practice rendering.
// Each transaction is an object, and the list of them is an array.
const transactions = [];

// Helper functions


// "food" -> "Food"
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Returns a signed amount: "+2500.00" or "-45.50"
function formatAmount(transaction) {
  const sign = transaction.type === "income" ? "+" : "-";
  return sign + transaction.amount.toFixed(2);
}

// Creates an element, gives it a class and some text, and returns it
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


//  Rendering (turning data into HTML)


// Builds ONE <li> for ONE transaction object
function createTransactionElement(transaction) {
  const item = createElement(
    "li",
    `transaction-item transaction-item--${transaction.type}`
  );
  item.dataset.id = transaction.id;

  // Left side: description and meta line
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

  // Middle: amount
  const amount = createElement(
    "p",
    "transaction-item__amount",
    formatAmount(transaction)
  );

  // Right side: buttons (they don't do anything yet)
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

  // Put the three parts inside the <li>
  item.appendChild(details);
  item.appendChild(amount);
  item.appendChild(actions);

  return item;
}

// Clears the list and draws every transaction again
function renderTransactions() {
  transactionList.innerHTML = "";

  // Only show the empty message when there is nothing to show
  emptyMessage.hidden = transactions.length > 0;

  transactions.forEach(function (transaction) {
    transactionList.appendChild(createTransactionElement(transaction));
  });
}

// Clears the form and gets it ready for the next entry
function resetForm() {
  transactionForm.reset();
  dateInput.value = getTodayDate();
  amountInput.focus();
}
 
// Runs when the user submits the form
function handleFormSubmit(event) {
  // Stop the browser from reloading the page
  event.preventDefault();
 
  // Read the values from the form and build a transaction object
  const newTransaction = {
    id: Date.now(),
    type: typeInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    description: descriptionInput.value.trim(),
  };
 
  // Temporary safety check
  if (
    newTransaction.amount <= 0 ||
    !newTransaction.category ||
    !newTransaction.date ||
    !newTransaction.description
  ) {
    return;
  }
 
  // Add to the START of the array so the newest appears first
  transactions.unshift(newTransaction);
 
  renderTransactions();
  resetForm();
}

//  Start the app

function init() {
  dateInput.value = getTodayDate();
  renderTransactions();
}

init();
