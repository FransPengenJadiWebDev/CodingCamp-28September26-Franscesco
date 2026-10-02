// =============================================================================
// SECTION 0 — Theme bootstrap IIFE
// Runs at the very top of the file, outside all event listeners.
// Reads saved theme from localStorage and applies it to <html> immediately,
// preventing any flash of the wrong theme before DOMContentLoaded fires.
// =============================================================================

(function applyThemeFromStorage() {
  const saved = localStorage.getItem('ebv_theme');
  document.documentElement.classList.toggle('dark', saved === 'dark');
})();


// =============================================================================
// SECTION 1 — Constants & State
// =============================================================================

/** localStorage key for the transactions array (JSON). */
const STORAGE_KEY_TRANSACTIONS = 'ebv_transactions';

/** localStorage key for the active theme ('dark' | 'light'). */
const STORAGE_KEY_THEME = 'ebv_theme';

/** localStorage key for the spending-limit value (numeric string). */
const STORAGE_KEY_LIMIT = 'ebv_limit';

/** Valid category names. */
const CATEGORIES = ['Food', 'Transport', 'Fun'];

/** Distinct fill colors per category, used by the pie chart. */
const CATEGORY_COLORS = {
  Food:      '#f87171',
  Transport: '#60a5fa',
  Fun:       '#4ade80',
};

/** In-memory source of truth for all transactions. */
let transactions = [];

/**
 * Active sort mode for the transaction list.
 * One of: 'none' | 'amount-asc' | 'amount-desc' | 'category-asc'
 */
let currentSort = 'none';

/**
 * Active spending-limit threshold.
 * null means "not set" → no highlighting.
 * 0 is treated the same as "not set" (Requirement 10.5).
 * @type {number|null}
 */
let spendLimit = null;

/** Holds the active Chart.js instance so it can be destroyed before recreation. */
let chartInstance = null;


// =============================================================================
// SECTION 2 — Storage utilities
// =============================================================================

/**
 * Shows a non-blocking warning toast appended to <body>.
 * The element auto-removes itself after 5 seconds.
 *
 * @param {string} msg - Human-readable warning message.
 */
function showWarning(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = [
    'position:fixed',
    'bottom:1rem',
    'right:1rem',
    'z-index:9999',
    'background:#b45309',
    'color:#fff',
    'padding:0.75rem 1rem',
    'border-radius:0.375rem',
    'font-size:0.875rem',
    'max-width:20rem',
    'box-shadow:0 2px 8px rgba(0,0,0,0.3)',
  ].join(';');

  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
}

/**
 * Loads saved data from localStorage into the in-memory state.
 *
 * - Parses the JSON transactions array; on any error initialises to []
 *   and shows a non-blocking warning (Requirement 5.4).
 * - Reads the saved spending limit (Requirement 10.6).
 */
function loadFromStorage() {
  // --- Transactions ---
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (raw === null) {
      // Nothing stored yet — start fresh, no warning needed.
      transactions = [];
    } else {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        // Stored data exists but is not an array — corrupt / unexpected format.
        throw new TypeError('Stored transactions data is not an array.');
      }
      transactions = parsed;
    }
  } catch (err) {
    // Invalid JSON or non-array structure — Requirement 5.4.
    transactions = [];
    showWarning('Could not load saved transactions. Starting with an empty list.');
    console.warn('[EBV] loadFromStorage – transactions error:', err);
  }

  // --- Spending limit ---
  const limitRaw = localStorage.getItem(STORAGE_KEY_LIMIT);
  if (limitRaw !== null) {
    const parsed = parseFloat(limitRaw);
    // Only apply a positive finite number; ignore garbage values silently.
    spendLimit = (isFinite(parsed) && parsed > 0) ? parsed : null;
  }
}

/**
 * Persists the current in-memory transactions array to localStorage.
 *
 * Catches QuotaExceededError (and any other storage exception) and shows a
 * non-blocking warning instead of throwing, keeping in-memory state intact
 * (Requirement 5.5).
 */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    // Most commonly a QuotaExceededError — Requirement 5.5.
    showWarning('Storage quota exceeded. Your latest change could not be saved.');
    console.warn('[EBV] saveToStorage – write error:', err);
  }
}


// =============================================================================
// SECTION 3 — Validation
// =============================================================================

/**
 * Validates the transaction form inputs.
 *
 * Rules (Requirements 1.1, 1.3, 1.4, 1.6):
 *   - item must not be empty.
 *   - item must be ≤ 100 characters.
 *   - amount must be a number and ≥ 0.01.
 *   - category must be one of the valid CATEGORIES.
 *
 * @param {string} item     - Item name from the text field.
 * @param {*}      amount   - Raw amount value (string or number from the input).
 * @param {string} category - Selected category value.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTransactionForm(item, amount, category) {
  const errors = [];

  // --- Item name ---
  const trimmedItem = typeof item === 'string' ? item.trim() : '';
  if (trimmedItem.length === 0) {
    errors.push('Item name is required.');
  } else if (trimmedItem.length > 100) {
    errors.push('Item name must be 100 characters or fewer.');
  }

  // --- Amount ---
  const parsedAmount = parseFloat(amount);
  if (amount === '' || amount === null || amount === undefined || isNaN(parsedAmount)) {
    errors.push('Amount must be a valid number.');
  } else if (parsedAmount < 0.01) {
    errors.push('Amount must be at least 0.01.');
  }

  // --- Category ---
  if (!CATEGORIES.includes(category)) {
    errors.push('Please select a valid category (Food, Transport, or Fun).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates the spending-limit input.
 *
 * Rules (Requirement 10.4, 10.5):
 *   - Empty string or the value 0 → valid, no highlight (not an error).
 *   - Non-numeric text → error.
 *   - Any other numeric value → valid.
 *
 * @param {string} value - Raw string from the limit input field.
 * @returns {{ valid: boolean, error: string }}
 */
function validateLimit(value) {
  const trimmed = typeof value === 'string' ? value.trim() : String(value ?? '').trim();

  // Empty input is valid — means "no limit" (Requirement 10.5).
  if (trimmed === '') {
    return { valid: true, error: '' };
  }

  const parsed = parseFloat(trimmed);

  // Non-numeric — Requirement 10.4.
  if (isNaN(parsed)) {
    return { valid: false, error: 'Please enter a valid number for the spending limit.' };
  }

  // 0 is valid — treated as "no limit" (Requirement 10.5).
  return { valid: true, error: '' };
}


// =============================================================================
// SECTION 4 — State mutations
// (Stubs — to be implemented in Task 5)
// =============================================================================

/**
 * Adds a new transaction to the in-memory list, persists, and re-renders.
 *
 * @param {string} item     - Validated item name.
 * @param {number} amount   - Validated, parsed amount.
 * @param {string} category - Validated category.
 */
function addTransaction(item, amount, category) {
  const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : Date.now().toString();

  transactions.push({
    id,
    item,
    amount: parseFloat(amount),
    category,
    createdAt: Date.now(),
  });

  saveToStorage();
  renderAll();
}

/**
 * Removes the transaction with the given id, persists, and re-renders.
 *
 * @param {string} id - The transaction id to delete.
 */
function deleteTransaction(id) {
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
    saveToStorage();
    renderAll();
  }
}


// =============================================================================
// SECTION 5 — Rendering
// (Stubs — to be implemented in Task 5)
// =============================================================================

/**
 * Returns a Map<category, sum> for transactions with amount > 0.
 * Used as a local helper by renderPieChart().
 *
 * @returns {Map<string, number>}
 */
function computeCategoryTotals() {
  const totals = new Map();
  for (const t of transactions) {
    if (t.amount > 0) {
      totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
    }
  }
  return totals;
}

/**
 * Re-renders the transaction list <ul> from current state.
 */
function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  const sorted = getSortedTransactions();

  if (sorted.length === 0) {
    emptyState.removeAttribute('hidden');
    list.hidden = true;
    return;
  }

  emptyState.hidden = true;
  list.removeAttribute('hidden');
  list.innerHTML = '';

  for (const t of sorted) {
    const li = document.createElement('li');

    if (spendLimit !== null && spendLimit > 0 && t.amount > spendLimit) {
      li.classList.add('over-limit');
    }

    const itemSpan = document.createElement('span');
    itemSpan.className = 'tx-item';
    itemSpan.textContent = t.item;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'tx-amount';
    amountSpan.textContent = '$' + t.amount.toFixed(2);

    const categorySpan = document.createElement('span');
    categorySpan.className = 'tx-category';
    categorySpan.textContent = t.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.dataset.id = t.id;
    deleteBtn.textContent = 'Delete';

    li.appendChild(itemSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

/**
 * Re-renders the balance display from current state.
 */
function renderBalance() {
  const sum = transactions.reduce((acc, t) => acc + t.amount, 0);
  const rounded = Math.round(sum * 100) / 100;
  document.getElementById('balance-display').textContent = '$' + rounded.toFixed(2);
}

/**
 * Destroys and recreates the Chart.js pie chart from current state.
 */
function renderPieChart() {
  try {
    if (chartInstance) {
      chartInstance.destroy();
    }
  } catch (e) {
    // Chart.js may not be loaded
  }
  chartInstance = null;

  const canvas = document.getElementById('pie-chart');
  const chartEmpty = document.getElementById('chart-empty');
  const totals = computeCategoryTotals();

  if (totals.size === 0) {
    canvas.hidden = true;
    chartEmpty.hidden = false;
    return;
  }

  canvas.hidden = false;
  chartEmpty.hidden = true;

  try {
    chartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: [...totals.keys()],
        datasets: [{
          data: [...totals.values()],
          backgroundColor: [...totals.keys()].map(c => CATEGORY_COLORS[c]),
        }],
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  } catch (e) {
    // Chart.js not available
    console.warn('[EBV] renderPieChart – Chart.js error:', e);
  }
}

/**
 * Calls all three render functions in sequence.
 */
function renderAll() {
  renderTransactionList();
  renderBalance();
  renderPieChart();
}


// =============================================================================
// SECTION 6 — Sort & Limit helpers
// (Stubs — to be implemented in Task 6)
// =============================================================================

/**
 * Returns a sorted copy of the transactions array based on currentSort.
 * Never mutates the source array.
 * TODO: implement in Task 6
 *
 * @returns {Array} Sorted (or original order) transaction array.
 */
function getSortedTransactions() {
  const list = [...transactions];

  if (currentSort === 'none') {
    return list;
  }

  list.sort((a, b) => {
    let primary;

    if (currentSort === 'amount-asc') {
      primary = a.amount - b.amount;
    } else if (currentSort === 'amount-desc') {
      primary = b.amount - a.amount;
    } else if (currentSort === 'category-asc') {
      primary = a.category.toLowerCase().localeCompare(b.category.toLowerCase());
    } else {
      primary = 0;
    }

    return primary !== 0 ? primary : a.createdAt - b.createdAt;
  });

  return list;
}


// =============================================================================
// SECTION 7 — Theme functions
// (Stub — to be implemented in Task 6)
// =============================================================================

/**
 * Toggles dark/light mode on <html> and persists the selection to localStorage.
 * No re-render needed — CSS custom properties cascade automatically.
 * TODO: implement in Task 6
 */
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('ebv_theme', isDark ? 'dark' : 'light');
  // No re-render needed — CSS custom properties cascade automatically
}


// =============================================================================
// SECTION 8 — Event listeners & initialisation (inside DOMContentLoaded)
// (Stub — to be implemented in Task 6)
// =============================================================================

document.addEventListener('DOMContentLoaded', function () {
  // 1. Cache DOM references
  const form = document.getElementById('transaction-form');
  const itemNameInput = document.getElementById('item-name');
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');
  const formErrors = document.getElementById('form-errors');
  const sortSelect = document.getElementById('sort-select');
  const limitInput = document.getElementById('limit-input');
  const limitError = document.getElementById('limit-error');
  const transactionList = document.getElementById('transaction-list');
  const themeToggle = document.getElementById('theme-toggle');

  // 2. Load persisted state
  loadFromStorage();

  // 3. Restore limit field if a limit was loaded from storage
  if (spendLimit !== null) {
    limitInput.value = spendLimit;
  }

  // 4. Form submit — validate then add transaction
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const item = itemNameInput.value;
    const amount = amountInput.value;
    const category = categorySelect.value;

    const result = validateTransactionForm(item, amount, category);
    if (!result.valid) {
      formErrors.innerHTML = result.errors.join('<br>');
      return;
    }

    formErrors.textContent = '';
    addTransaction(item.trim(), parseFloat(amount), category);
    itemNameInput.value = '';
    amountInput.value = '';
    categorySelect.value = '';
  });

  // 5. Transaction list click — event delegation for delete buttons
  transactionList.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-delete')) {
      deleteTransaction(e.target.dataset.id);
    }
  });

  // 6. Sort select change
  sortSelect.addEventListener('change', function () {
    currentSort = sortSelect.value;
    renderAll();
  });

  // 7. Limit input — validate and update spendLimit
  limitInput.addEventListener('input', function () {
    const raw = limitInput.value.trim();
    const result = validateLimit(raw);

    if (!result.valid) {
      limitError.textContent = result.error;
      spendLimit = null;
      renderAll();
      return;
    }

    limitError.textContent = '';

    if (raw === '' || parseFloat(raw) === 0) {
      spendLimit = null;
      localStorage.removeItem(STORAGE_KEY_LIMIT);
    } else {
      spendLimit = parseFloat(raw);
      localStorage.setItem(STORAGE_KEY_LIMIT, raw);
    }

    renderAll();
  });

  // 8. Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // 9. Initial render
  renderAll();
});
