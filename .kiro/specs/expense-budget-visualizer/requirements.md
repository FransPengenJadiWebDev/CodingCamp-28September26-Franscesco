# Requirements Document

## Introduction

Expense & Budget Visualizer adalah web app mobile-friendly berbasis vanilla HTML/CSS/JavaScript yang memungkinkan pengguna melacak pengeluaran harian secara lokal di browser. Pengguna dapat menambah dan menghapus transaksi, melihat total pengeluaran secara real-time, memvisualisasikan distribusi pengeluaran per kategori melalui pie chart, serta menggunakan fitur tambahan seperti dark/light mode toggle, pengurutan transaksi, dan highlight pengeluaran yang melebihi batas tertentu. Semua data disimpan di Local Storage browser tanpa backend.

---

## Glossary

- **App**: Aplikasi web Expense & Budget Visualizer yang berjalan di browser.
- **Transaction**: Satu catatan pengeluaran yang terdiri dari Item Name, Amount, dan Category.
- **Transaction_List**: Komponen UI yang menampilkan seluruh daftar Transaction secara scrollable.
- **Input_Form**: Komponen UI berisi field Item Name, Amount, Category, dan tombol Submit.
- **Balance_Display**: Komponen UI di bagian atas yang menampilkan total keseluruhan Amount dari semua Transaction.
- **Pie_Chart**: Visualisasi Chart.js berbentuk pie chart yang menampilkan distribusi pengeluaran per Category.
- **Storage**: Mekanisme penyimpanan data menggunakan browser Local Storage.
- **Category**: Klasifikasi Transaction dengan nilai yang valid: Food, Transport, atau Fun.
- **Limit**: Nilai ambang batas Amount yang ditentukan pengguna; Transaction yang melebihi nilai ini akan di-highlight.
- **Theme_Toggle**: Komponen UI yang memungkinkan pengguna beralih antara dark mode dan light mode.
- **Sort_Control**: Komponen UI yang memungkinkan pengguna mengurutkan Transaction_List berdasarkan Amount atau Category.

---

## Requirements

### Requirement 1: Input Transaksi

**User Story:** As a user, I want to fill in and submit an expense form, so that I can add a new transaction to my expense list.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for Item Name with a maximum length of 100 characters, a numeric field for Amount accepting values between 0.01 and 999,999,999.99, and a dropdown for Category with exactly three options: Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled with valid values, THE App SHALL add a new Transaction to the Transaction_List containing the entered Item Name, Amount, and selected Category.
3. WHEN the user submits the Input_Form with one or more fields empty, THE App SHALL display a validation error message indicating which field(s) are empty and SHALL NOT add a Transaction to the Transaction_List.
4. WHEN the user submits the Input_Form with an Amount value less than 0.01, THE App SHALL display a validation error message indicating that Amount must be greater than zero and SHALL NOT add a Transaction to the Transaction_List.
5. WHEN a Transaction is successfully added to the Transaction_List, THE Input_Form SHALL reset the Item Name field to empty, the Amount field to empty, and the Category dropdown to its default unselected state.
6. WHEN the user submits the Input_Form with an Item Name exceeding 100 characters, THE App SHALL display a validation error message indicating the character limit and SHALL NOT add a Transaction to the Transaction_List.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list, so that I can review and manage my expenses.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each Transaction with its Item Name (maximum 100 characters), Amount (formatted as a decimal number with exactly 2 decimal places and the $ symbol), Category, and a delete button.
2. WHILE the total number of Transaction entries exceeds the visible area of the Transaction_List, THE Transaction_List SHALL be scrollable vertically without horizontal scrolling.
3. WHEN the user clicks the delete button on a Transaction, THE App SHALL immediately remove that Transaction from the Transaction_List and update the displayed list within 500 milliseconds.
4. IF the delete operation fails, THEN THE App SHALL display an error message indicating the deletion could not be completed and retain the Transaction in the Transaction_List.
5. WHEN no Transactions exist, THE Transaction_List SHALL display an empty-state message informing the user that no transactions have been recorded.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see the total of all my expenses at the top of the page, so that I always know my current spending total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction Amounts, rounded to 2 decimal places, with the $ symbol.
2. WHEN a new Transaction is added, THE Balance_Display SHALL update to reflect the new total within 100 milliseconds.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new total within 100 milliseconds.
4. WHEN no Transactions exist, THE Balance_Display SHALL display a total of 0.00.
5. IF a Transaction Amount has more than 2 decimal places, THEN THE App SHALL round it to 2 decimal places before including it in the Balance_Display calculation.

---

### Requirement 4: Pie Chart Visualisasi Kategori

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money goes.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display one segment per Category that has at least one Transaction, showing each segment sized proportionally to that Category's total Amount as a percentage of the sum of all Transaction Amounts, where the percentage is calculated to two decimal places.
2. THE App SHALL load Chart.js exclusively via a CDN script tag in the HTML, with no local bundler, build tool, or locally hosted copy of the library.
3. WHEN a Transaction is added or deleted, THE Pie_Chart SHALL update to reflect the new category totals within 100 milliseconds of the triggering action completing.
4. WHEN all Transactions are deleted, THE Pie_Chart SHALL display a placeholder state showing no segments and a visible message indicating no data is available, without throwing a runtime error.
5. THE Pie_Chart SHALL render each of the three Categories (Food, Transport, Fun) in a visually distinct color such that no two segments share the same hue, and each segment includes a legend label identifying its Category name.
6. IF a Transaction Amount is zero or negative, THEN THE Pie_Chart SHALL exclude that Transaction from all category total calculations and not render a segment for it.

---

### Requirement 5: Persistensi Data (Local Storage)

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE Storage SHALL persist the complete Transaction_List (Item Name, Amount, Category for each entry) to browser Local Storage as a serialized JSON array.
2. WHEN a Transaction is deleted, THE Storage SHALL update the Transaction_List in browser Local Storage to reflect the deletion immediately.
3. WHEN the App initializes, THE App SHALL load all previously saved Transactions from Local Storage and render them in the Transaction_List, Balance_Display, and Pie_Chart before accepting user input.
4. IF Local Storage returns data that is not parseable as JSON or not a valid array, THEN THE App SHALL initialize with an empty Transaction_List and display a non-blocking warning message to the user.
5. IF a Local Storage write operation fails (e.g., quota exceeded), THEN THE App SHALL display a non-blocking warning message indicating the data could not be saved.

---

### Requirement 6: Kompatibilitas Browser

**User Story:** As a user, I want the app to work on any modern browser I use, so that I can access it regardless of my browser preference.

#### Acceptance Criteria

1. THE App SHALL satisfy all acceptance criteria defined in Requirements 1–10 when run on the latest stable version of Google Chrome.
2. THE App SHALL satisfy all acceptance criteria defined in Requirements 1–10 when run on the latest stable version of Mozilla Firefox.
3. THE App SHALL satisfy all acceptance criteria defined in Requirements 1–10 when run on the latest stable version of Microsoft Edge.
4. THE App SHALL satisfy all acceptance criteria defined in Requirements 1–10 when run on the latest stable version of Apple Safari.
5. THE App SHALL use only standard HTML5, CSS3, and ECMAScript 2015 (ES6) features natively supported by all four browsers above, without polyfills or transpilers.

---

### Requirement 7: Arsitektur File dan Kode

**User Story:** As a developer, I want the app to be contained in exactly three files with clean code, so that the project is easy to read and maintain.

#### Acceptance Criteria

1. THE App SHALL deliver all markup exclusively through `index.html` and SHALL NOT include any `<style>` blocks or inline `style` attributes in the HTML file.
2. THE App SHALL deliver all styles exclusively through `css/style.css`.
3. THE App SHALL deliver all JavaScript logic exclusively through `js/script.js`, which SHALL be loaded via a `<script defer>` tag inside `<head>` in `index.html`, and SHALL NOT include any inline `<script>` blocks directly in `index.html`.
4. THE App SHALL NOT introduce additional CSS files beyond `css/style.css`.
5. THE App SHALL NOT introduce additional JavaScript files beyond `js/script.js`.
6. THE App SHALL NOT depend on any JavaScript framework, CSS framework, backend server, or third-party library other than Chart.js loaded via CDN.
7. THE App SHALL apply the saved theme preference at the very beginning of `js/script.js` execution (before the DOM-ready event) by reading Local Storage and setting a CSS class on `<html>` or `<body>`, so that no flash of the wrong theme occurs.

---

### Requirement 8: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_Toggle SHALL be reachable with a single click or tap without requiring the user to scroll, and SHALL remain visible at all viewport widths from 320px to 1440px.
2. WHEN the user activates the Theme_Toggle, THE App SHALL switch the active color theme between dark mode and light mode with no flash of the previous theme.
3. WHEN the user activates the Theme_Toggle, THE App SHALL persist the selected theme preference to Local Storage.
4. WHEN the App initializes with no saved theme preference, THE App SHALL apply light mode as the default theme.
5. WHEN the App initializes with a saved theme preference, THE App SHALL apply that theme at the start of `js/script.js` execution (before DOM content is fully parsed) by reading Local Storage and setting a CSS class, ensuring no flash of the wrong theme is visible to the user.
6. WHILE dark mode is active, THE App SHALL apply a dark background color and light foreground text color such that contrast ratios meet WCAG AA (minimum 4.5:1 for normal text) across all UI components.
7. WHILE light mode is active, THE App SHALL apply a light background color and dark foreground text color such that contrast ratios meet WCAG AA (minimum 4.5:1 for normal text) across all UI components.

---

### Requirement 9: Pengurutan Transaksi

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can find and analyze my expenses more easily.

#### Acceptance Criteria

1. THE Sort_Control SHALL provide options to sort the Transaction_List by Amount ascending, by Amount descending, and by Category in case-insensitive alphabetical order.
2. WHEN the user selects a sort option, THE Transaction_List SHALL re-render all Transactions in the selected order within 100 milliseconds.
3. WHEN a new Transaction is added while a sort option is active, THE Transaction_List SHALL insert the new Transaction at the position determined by the active sort order.
4. WHEN two or more Transactions have equal sort keys, THE Transaction_List SHALL order those Transactions by their chronological order of entry (earliest first).
5. THE Sort_Control SHALL display the currently active sort option at all times.
6. WHEN the App initializes, THE Transaction_List SHALL default to displaying Transactions in chronological order of entry (no sort applied).

---

### Requirement 10: Highlight Pengeluaran Melebihi Batas

**User Story:** As a user, I want transactions that exceed a spending limit to be visually highlighted, so that I can quickly identify overspending.

#### Acceptance Criteria

1. THE App SHALL provide an input field where the user can define a numeric Limit value between 0.01 and 999,999,999.99.
2. WHEN the Limit is set to a valid value and a Transaction has an Amount strictly greater than the Limit, THE Transaction_List SHALL render that Transaction with a distinct visual highlight (e.g., a colored border or background) that differs from non-highlighted Transactions.
3. WHEN the user changes the Limit value to a valid number, THE Transaction_List SHALL re-evaluate and update the highlight state of all Transactions within 100 milliseconds.
4. WHEN the Limit input contains a non-numeric value, THE App SHALL display a validation error message and SHALL NOT apply any highlighting.
5. WHEN the Limit input is empty or has a value of 0, THE App SHALL not highlight any Transaction and SHALL NOT display any error message.
6. THE App SHALL persist the Limit value to Local Storage so that it is restored when the App initializes.

---

## Non-Functional Requirements

### NFR-1: Performa

THE App SHALL update the Balance_Display, Transaction_List, and Pie_Chart within 100 milliseconds of any user action (add, delete, sort, or limit change) on a device with at least 2GB RAM running a supported browser.

### NFR-2: Tipografi dan Hierarki Visual

THE App SHALL use a readable font size of at least 14px for body text, maintain clear visual hierarchy between the Balance_Display, Transaction_List, and Pie_Chart sections, and ensure color contrast ratios meet WCAG AA standard (minimum 4.5:1 for normal text).

### NFR-3: Responsivitas

THE App SHALL render all UI components usably on screen widths from 320px to 1440px without horizontal overflow or truncated content.

### NFR-4: Kode Bersih

THE App code in `index.html`, `css/style.css`, and `js/script.js` SHALL be consistently indented, use descriptive variable and function names in English, and include inline comments for non-obvious logic sections.
