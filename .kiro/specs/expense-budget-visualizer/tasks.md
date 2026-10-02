# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi dilakukan sepenuhnya di tiga file: `index.html`, `css/style.css`, dan `js/script.js`. Tidak ada backend, build tool, atau framework — hanya vanilla HTML5, CSS3, dan ES6+, dengan Chart.js via CDN. Urutan task mengikuti dependency: HTML scaffold dulu, lalu CSS (foundation → komponen), lalu JS (core → rendering → interaksi & init).

## Tasks

- [x] 1. Scaffold `index.html` — struktur semantik lengkap
  - Buat `<head>` dengan: `<script src="Chart.js CDN">`, `<script defer src="js/script.js">`, `<link rel="stylesheet" href="css/style.css">`. Tidak ada `<style>` block atau inline `style` attribute di mana pun di file ini.
  - Buat `<header>` berisi `<h1>` judul app dan `<button id="theme-toggle">`.
  - Buat `<section id="balance-section">` berisi `<p id="balance-display">$0.00</p>`.
  - Buat `<section id="form-section">` berisi `<form id="transaction-form">` dengan: `<input id="item-name" type="text" maxlength="100" required>`, `<input id="amount" type="number" min="0.01" max="999999999.99" step="0.01" required>`, `<select id="category" required>` dengan opsi Food/Transport/Fun plus placeholder, dan `<button type="submit">`. Tambahkan `<div id="form-errors" role="alert" aria-live="polite">`.
  - Buat `<section id="controls-section">` berisi `<select id="sort-select">` (opsi: none/amount-asc/amount-desc/category-asc), `<input id="limit-input" type="number">`, dan `<div id="limit-error" role="alert" aria-live="polite">`.
  - Buat `<section id="list-section">` berisi `<ul id="transaction-list">` dan `<p id="empty-state" hidden>`.
  - Buat `<section id="chart-section">` berisi `<canvas id="pie-chart">` dan `<p id="chart-empty" hidden>`.
  - _Requirements: 1.1, 2.1, 2.5, 3.1, 4.2, 7.1, 7.2, 7.3, 8.1_

- [x] 2. CSS foundation — custom properties, reset, layout responsif (`css/style.css`)
  - Definisikan semua CSS custom properties di `:root` untuk light mode: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-border`, `--color-highlight`, `--color-highlight-border`.
  - Definisikan override `html.dark { ... }` dengan nilai dark mode untuk semua token yang sama.
  - Tambahkan CSS reset/base: `box-sizing: border-box`, `margin`/`padding` reset, `font-family`, `font-size` minimal 14px untuk body text, `background-color: var(--color-bg)`, `color: var(--color-text)`.
  - Implementasikan layout responsif mobile-first menggunakan CSS Flexbox/Grid: base styles (single-column, lebar 320px+), breakpoint `@media (min-width: 600px)` untuk form dua kolom, breakpoint `@media (min-width: 900px)` untuk list dan chart side-by-side.
  - _Requirements: 6.5, 7.2, 7.4, 8.4, 8.6, 8.7, NFR-2, NFR-3_

- [x] 3. CSS komponen — styling semua UI element (`css/style.css`)
  - Style `<header>`: flexbox, space-between, align-items center, visible di semua viewport.
  - Style `#balance-display`: ukuran font besar, warna aksen, visual hierarchy jelas.
  - Style `#transaction-form` dan field-nya: input/select menggunakan `var(--color-surface)`, `var(--color-border)`, `var(--color-text)`; tombol submit menggunakan `var(--color-accent)`.
  - Style `#form-errors` dan `#limit-error`: warna error merah, `role="alert"` sudah ada di HTML.
  - Style `#transaction-list`: `max-height` dengan `overflow-y: auto` untuk scrollable vertical tanpa horizontal scroll; setiap `<li>` menampilkan item name, amount, category, dan delete button dengan layout yang rapi.
  - Style `li.over-limit`: `background-color: var(--color-highlight)` dan `border-left: 4px solid var(--color-highlight-border)`.
  - Style `#chart-section` dan `<canvas>`: lebar responsif, tidak overflow.
  - Style `#empty-state` dan `#chart-empty`: teks muted, centered.
  - Style tombol delete: ukuran kecil, warna berbeda dari tombol submit.
  - _Requirements: 2.2, 8.1, 8.6, 8.7, NFR-2, NFR-3_

- [x] 4. JS core — theme bootstrap, constants, state, storage, validasi (`js/script.js`)
  - **Baris pertama file**: IIFE `applyThemeFromStorage()` yang membaca `localStorage.getItem('ebv_theme')` dan memanggil `document.documentElement.classList.toggle('dark', saved === 'dark')`. Ini harus berada di luar semua event listener agar berjalan sebelum DOM ready dan mencegah flash of wrong theme.
  - Definisikan constants: `STORAGE_KEY_TRANSACTIONS = 'ebv_transactions'`, `STORAGE_KEY_THEME = 'ebv_theme'`, `STORAGE_KEY_LIMIT = 'ebv_limit'`, `CATEGORIES`, `CATEGORY_COLORS` (Food: `#f87171`, Transport: `#60a5fa`, Fun: `#4ade80`).
  - Definisikan state variables: `let transactions = []`, `let currentSort = 'none'`, `let spendLimit = null`, `let chartInstance = null`.
  - Implementasikan `loadFromStorage()`: parse JSON dari `ebv_transactions` (try/catch untuk invalid JSON dan non-array — jika error, set `transactions = []` dan tampilkan non-blocking warning); baca `ebv_limit` dan set `spendLimit`.
  - Implementasikan `saveToStorage()`: serialize `transactions` ke JSON dengan `localStorage.setItem` (try/catch untuk `QuotaExceededError` — tampilkan non-blocking warning toast, jangan throw).
  - Implementasikan `validateTransactionForm(item, amount, category)`: kembalikan `{ valid: boolean, errors: string[] }`. Validasi: item tidak boleh kosong, item ≤ 100 karakter, amount harus angka dan ≥ 0.01, category harus salah satu dari `CATEGORIES`.
  - Implementasikan `validateLimit(value)`: kembalikan `{ valid: boolean, error: string }`. Nilai kosong atau 0 dianggap valid (no highlight); non-numerik adalah error.
  - _Requirements: 1.1, 1.3, 1.4, 1.6, 5.4, 5.5, 7.3, 7.7, 8.4, 8.5, 10.4_

- [x] 5. JS state mutations & rendering (`js/script.js`)
  - Implementasikan `addTransaction(item, amount, category)`: buat objek transaction dengan `id` (pakai `crypto.randomUUID()` atau fallback `Date.now().toString()`), `item`, `amount` (parsed float), `category`, `createdAt` (Date.now()); push ke `transactions`; panggil `saveToStorage()` lalu `renderAll()`.
  - Implementasikan `deleteTransaction(id)`: cari index di `transactions`, splice 1 elemen; panggil `saveToStorage()` lalu `renderAll()`.
  - Implementasikan `renderBalance()`: hitung sum semua `t.amount`, round ke 2 desimal, tampilkan sebagai `$X.XX` di `#balance-display`. List kosong → `$0.00`.
  - Implementasikan `renderTransactionList()`: panggil `getSortedTransactions()` (stub untuk sekarang, akan diisi di task 6); untuk setiap transaction buat `<li>` berisi item name, `$X.XX` (2 desimal), category, dan `<button class="delete-btn" data-id="...">`. Terapkan `over-limit` class jika `spendLimit > 0 && t.amount > spendLimit`. Jika list kosong, tampilkan `#empty-state` (remove `hidden`), sembunyikan jika tidak kosong.
  - Implementasikan `renderPieChart()`: destroy `chartInstance` jika ada; hitung `computeCategoryTotals()` (Map dari category ke sum, hanya amount > 0); jika kosong, sembunyikan canvas dan tampilkan `#chart-empty`; jika ada data, buat instance `Chart` baru (type: 'pie', labels dari Map keys, data dari Map values, backgroundColor dari `CATEGORY_COLORS`, legend position bottom).
  - Implementasikan `renderAll()`: panggil `renderTransactionList()`, `renderBalance()`, `renderPieChart()`.
  - _Requirements: 1.2, 1.5, 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 10.2_

- [x] 6. JS theme, sort, limit, event listeners & init sequence (`js/script.js`)
  - Implementasikan `toggleTheme()`: `document.documentElement.classList.toggle('dark')`; simpan hasil ke `localStorage.setItem('ebv_theme', isDark ? 'dark' : 'light')`.
  - Implementasikan `getSortedTransactions()`: buat copy `[...transactions]`; sort berdasarkan `currentSort` (`amount-asc`, `amount-desc`, `category-asc` case-insensitive); tie-break selalu pakai `createdAt` ascending. Kembalikan list asli jika `currentSort === 'none'`.
  - Di dalam `DOMContentLoaded` listener:
    - Cache semua DOM element references (`form`, `itemNameInput`, `amountInput`, `categorySelect`, `formErrors`, `sortSelect`, `limitInput`, `limitError`, `transactionList`, `emptyState`, `pieCanvas`, `chartEmpty`, `balanceDisplay`, `themeToggle`).
    - Panggil `loadFromStorage()`.
    - Attach event listener `form.addEventListener('submit', ...)`: panggil `validateTransactionForm`, tampilkan errors di `#form-errors` jika invalid; jika valid, panggil `addTransaction` dan reset form (item='', amount='', category='').
    - Attach event listener `transactionList.addEventListener('click', ...)` (event delegation): jika target adalah `.delete-btn`, panggil `deleteTransaction(target.dataset.id)`.
    - Attach event listener `sortSelect.addEventListener('change', ...)`: set `currentSort = sortSelect.value`; panggil `renderAll()`.
    - Attach event listener `limitInput.addEventListener('input', ...)`: validasi dengan `validateLimit`; jika valid dan non-empty dan non-zero, set `spendLimit = parseFloat(value)` dan simpan ke `localStorage`; jika kosong atau 0, set `spendLimit = null`; jika invalid, tampilkan error dan set `spendLimit = null`; panggil `renderAll()`.
    - Attach event listener `themeToggle.addEventListener('click', toggleTheme)`.
    - Panggil `renderAll()` di akhir init sequence.
  - _Requirements: 1.2, 1.3, 1.5, 2.3, 5.3, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.3, 10.5, 10.6_

- [x] 7. Checkpoint — verifikasi akhir
  - Pastikan semua file sesuai aturan arsitektur: tidak ada `<style>` block atau inline `style` di HTML, tidak ada `<script>` inline di HTML, semua JS di `js/script.js`, semua CSS di `css/style.css`.
  - Pastikan `applyThemeFromStorage` IIFE ada di baris pertama `js/script.js` (sebelum `DOMContentLoaded`).
  - Pastikan Chart.js dimuat via CDN `<script>` tag di `<head>`, bukan dari file lokal.
  - Buka `index.html` di browser, coba: tambah transaksi, hapus transaksi, sort, set limit, toggle theme, refresh halaman (data harus persist).

## Notes

- Tidak ada task testing — implementasi saja sesuai permintaan.
- Task 4, 5, dan 6 semuanya di `js/script.js` — urutan section di file harus mengikuti desain: Section 0 (theme bootstrap IIFE) → Section 1 (constants & state) → Section 2 (storage) → Section 3 (validation) → Section 4 (mutations) → Section 5 (rendering) → Section 6 (sort & limit helpers) → Section 7 (theme functions) → Section 8 (event listeners & init).
- Setiap task references requirements spesifik untuk traceability.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3", "4"] },
    { "id": 3, "tasks": ["5"] },
    { "id": 4, "tasks": ["6"] },
    { "id": 5, "tasks": ["7"] }
  ]
}
```
