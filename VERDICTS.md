# Verdicts — Session 5 (IA#3)

## Predictions (from reading alone, before running)

### Version A — Prediction
- **Reading analysis**:
  - In `public/versions/a.js`, lines 51–56:
    ```javascript
    let total = 0;
    products.forEach(async (p) => {
      const stock = await getStock(p.id);
      total += p.price * stock;
    });
    stockValue.textContent = formatVnd(total);
    ```
    `Array.prototype.forEach` does not await asynchronous callbacks. The call `stockValue.textContent = formatVnd(total)` executes synchronously immediately after dispatching the promises, while `total` is still `0`. As each `getStock` promise resolves later, `total` is mutated in memory, but `stockValue.textContent` is never re-rendered.
  - Timeout handling: Line 14 uses `AbortSignal.timeout(5000)`, which is the modern standard Fetch API way to abort hanging requests after 5 seconds.
  - Security / XSS: Uses `.textContent` for product names and formatted prices.
  - Type checking: Code types seem well-annotated with JSDoc cast comments.
- **Predicted outcome**:
  - Row 2 will **FAIL**: Stock value will read `0 đ` instead of `12.360.000 đ`.
  - All other rows (1, 3, 4, 5, 6, 7, 8, empty) are predicted to PASS.
- **Predicted verdict**: **fix** (decided by Row 2: fix asynchronous stock calculation to await all parallel requests before updating DOM).

---

### Version B — Prediction
- **Reading analysis**:
  - In `public/versions/b.js`, line 16:
    ```javascript
    const response = await fetch('/api/products', { timeout: 5000 });
    ```
    Native browser `fetch()` does not recognize `{ timeout: 5000 }` in `RequestInit` (this option only exists in libraries like Axios or `node-fetch`). In standard browser fetch, unknown options in `RequestInit` are silently ignored.
  - When the server is in `hang` mode, the request will not abort at 5 seconds; it will stay pending for 30 seconds until `server.mjs` sends HTTP 504.
  - In VS Code with `// @ts-check` (or `tsc -p jsconfig.json --checkJs`), TypeScript will flag `{ timeout: 5000 }` with `error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'RequestInit'`.
  - Stock calculation: Lines 51–53 use `await Promise.all(products.map((p) => loadStock(p.id)))` and `reduce()`, which correctly requests stock in parallel and updates `stockOutput.textContent` with `toVnd(total)`.
- **Predicted outcome**:
  - Row 6 will **FAIL**: Mode `hang` will not abort after 5 seconds; it will hang for 30 seconds.
  - Row 8 will **FAIL**: `// @ts-check` will flag `{ timeout: 5000 }`.
  - Rows 1, 2, 3, 4, 5, 7, empty are predicted to PASS.
- **Predicted verdict**: **fix** (decided by Row 6 and Row 8: replace invalid `{ timeout: 5000 }` with `{ signal: AbortSignal.timeout(5000) }`).

---

### Version C — Prediction
- **Reading analysis**:
  - In `public/versions/c.js`:
    - Timeout: Line 16 uses `{ signal: AbortSignal.timeout(5000) }`.
    - Stock calculation: Lines 54–57 use `await Promise.all(products.map((p) => fetchStock(p.id)))`, then iterates through results to sum `total`, and updates `ui.stockValue.textContent = money(total)`. All stock requests are sent in parallel.
    - Security: Uses `.textContent` for `.name` and `.price`.
    - Rendering: Efficient DOM batching using `document.createDocumentFragment()`.
    - Error handling: Graceful `try ... catch ... finally` resetting `inFlight`, displaying `Could not load products.`, and revealing the Retry button.
    - Type check: JSDoc type assertions match DOM elements without error.
- **Predicted outcome**:
  - All rows (1, 2, 3, 4, 5, 6, 7, 8, empty) are predicted to **PASS**.
- **Predicted verdict**: **keep** (no defects found against `brief.md`).
