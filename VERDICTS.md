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

---

## Actual Test Runs & Verdicts (27 Lines: 9 Rows × 3 Versions)

### Version A — Actual Results

| Row | Status | What I saw (Screen, Network tab, Console, Terminal) |
|---|---|---|
| **Row 1** | **PASS** | Mode `normal`, reload: 8 cards rendered in API order, prices formatted (`180.000 đ`), `#status` is empty. |
| **Row 2** | **FAIL** | Mode `normal`, reload, wait 1 s: `#stock-value` shows `0 đ` instead of `12.360.000 đ`. Screenshot: `evidence/a-row2.png`. |
| **Row 3** | **PASS** | Last card name text is literally `Scarf <i>limited</i>`; DevTools Elements inspector confirms no `<i>` DOM element created (`textContent` preserved raw tags). |
| **Row 4** | **PASS** | Mode `slow`, reload: `#status` displays `Loading products…` for ~3 s; then 8 cards appear and `#status` becomes empty. |
| **Row 5** | **PASS** | Mode `error`, reload: `#status` shows `Could not load products.`, `#retry` is visible, `#catalogue` has 0 cards. Switch mode `normal`, click Retry: 8 cards render, error message and Retry button disappear. |
| **Row 6** | **PASS** | Mode `hang`, reload, count to 7: after ~5.0 s `AbortSignal.timeout(5000)` aborts request; `#status` shows `Could not load products.` and Retry appears; terminal shows `no answer: the browser gave up after 4991 ms`. |
| **Row 7** | **PASS** | Console during rows 1–6: zero `Uncaught …` errors, no red exceptions other than the browser's native `GET /api/products 500` network report. |
| **Row 8** | **PASS** | Open in VS Code with `// @ts-check` (or `tsc -p jsconfig.json --checkJs`): 0 errors reported, nothing underlined in red. |
| **Empty** | **PASS** | Mode `empty`, reload: `#status` displays `No products yet.`, `#stock-value` displays `0 đ`, `#catalogue` is empty. |

- **Line(s) of code responsible for FAIL:**
  - `public/versions/a.js:52-56`:
    ```javascript
    let total = 0;
    products.forEach(async (p) => {
      const stock = await getStock(p.id);
      total += p.price * stock;
    });
    stockValue.textContent = formatVnd(total);
    ```
    `forEach` ignores the returned promises and does not pause; `stockValue.textContent` updates immediately when `total === 0`.
- **Verdict:** **fix** (decided by Row 2).
- **The one sentence I would tell the assistant:**
  *"In `public/versions/a.js`, row 2 fails with `#stock-value` displaying `0 đ` because `products.forEach(async ...)` does not await the asynchronous stock fetches before formatting `total`; await all stock requests in parallel with `Promise.all` and ensure requests remain concurrent without forming a waterfall."*

---

### Version B — Actual Results

| Row | Status | What I saw (Screen, Network tab, Console, Terminal) |
|---|---|---|
| **Row 1** | **PASS** | Mode `normal`, reload: 8 cards rendered in API order, prices formatted (`180.000 đ`), `#status` is empty. |
| **Row 2** | **PASS** | Mode `normal`, reload, wait 1 s: `#stock-value` shows `12.360.000 đ`; Network tab shows all 8 `/api/stock/*` requests dispatched in parallel (spread < 5 ms). |
| **Row 3** | **PASS** | Last card name text reads `Scarf <i>limited</i>` with angle brackets visible, nothing in italics. |
| **Row 4** | **PASS** | Mode `slow`, reload: `#status` displays `Loading products…` for ~3 s, then 8 cards appear and status line clears. |
| **Row 5** | **PASS** | Mode `error`, reload: `#status` displays `Could not load products.`, Retry button visible, 0 cards. Switch mode `normal`, click Retry: 8 cards render cleanly. |
| **Row 6** | **FAIL** | Mode `hang`, reload, count to 7: page continues displaying `Loading products…` beyond 5 s and 10 s; browser does not abort until 30 s gateway timeout. Screenshot: `evidence/b-row6.png`. |
| **Row 7** | **PASS** | Console during rows 1–6: zero uncaught runtime errors. |
| **Row 8** | **FAIL** | Adding `// @ts-check` at line 1 (or `tsc -p jsconfig.json --checkJs`): line 16 has red squiggle: `error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'RequestInit'`. Screenshot: `evidence/b-row8.png`. |
| **Empty** | **PASS** | Mode `empty`, reload: `#status` displays `No products yet.`, `#stock-value` displays `0 đ`, 0 cards. |

- **Line(s) of code responsible for FAIL:**
  - `public/versions/b.js:16`:
    ```javascript
    const response = await fetch('/api/products', { timeout: 5000 });
    ```
    Native browser `fetch()` does not support `{ timeout: 5000 }` in `RequestInit`. It is silently ignored at runtime (causing row 6 to hang for 30 s) and causes TS2353 type failure under `// @ts-check` (row 8).
- **Verdict:** **fix** (decided by Row 6 and Row 8).
- **The one sentence I would tell the assistant:**
  *"In `public/versions/b.js`, rows 6 and 8 fail because `fetch('/api/products', { timeout: 5000 })` at line 16 uses an invalid option that native fetch ignores and TypeScript rejects; replace `{ timeout: 5000 }` with `{ signal: AbortSignal.timeout(5000) }` so hanging requests abort after 5 seconds without type errors."*

---

### Version C — Actual Results

| Row | Status | What I saw (Screen, Network tab, Console, Terminal) |
|---|---|---|
| **Row 1** | **PASS** | Mode `normal`, reload: 8 cards rendered in order, prices formatted (`180.000 đ`), `#status` is empty. |
| **Row 2** | **PASS** | Mode `normal`, reload, wait 1 s: `#stock-value` displays `12.360.000 đ`; Network tab confirms 8 parallel stock requests (spread < 20 ms). |
| **Row 3** | **PASS** | Last card name text is `Scarf <i>limited</i>` with literal angle brackets visible. |
| **Row 4** | **PASS** | Mode `slow`, reload: `#status` shows `Loading products…` for ~3 s, then renders 8 cards and clears status. |
| **Row 5** | **PASS** | Mode `error`, reload: `#status` shows `Could not load products.`, Retry shown. Switching to normal and clicking Retry successfully renders 8 cards. |
| **Row 6** | **PASS** | Mode `hang`, reload, count to 7: after ~5.0 s `AbortSignal.timeout(5000)` aborts request, `#status` displays `Could not load products.` and Retry is shown; terminal logs `no answer: the browser gave up after 4992 ms`. |
| **Row 7** | **PASS** | Console during rows 1–6: zero uncaught exceptions, no unexpected red logs. |
| **Row 8** | **PASS** | Open in VS Code with `// @ts-check` (or `tsc -p jsconfig.json --checkJs`): 0 errors, completely type-clean. |
| **Empty** | **PASS** | Mode `empty`, reload: `#status` displays `No products yet.`, `#stock-value` displays `0 đ`. |

- **Line(s) of code responsible for FAIL:** None. All rows passed.
- **Verdict:** **keep** (decided by passing all 9 rows and the parallel request requirement).
- **The one sentence I would tell the assistant:**
  *"Version C passes all 9 rows and the parallel network constraint without modification; keep as is."*
