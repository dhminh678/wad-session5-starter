# Assistant Review & Verification (CSC13008 — IA#3)

## 1. Assistant Information
- **Tool:** Antigravity (Google DeepMind)
- **Model:** Gemini 3.8 Flash

## 2. Review Prompt Given to Assistant
```text
Review the three original files `public/versions/a.js`, `public/versions/b.js`, and `public/versions/c.js` against the specification in `brief.md`.
Identify all bugs, contract violations, syntax or runtime issues, and edge-case defects in each version.
Do not write fixed code yet; provide your evaluation for Version A, Version B, and Version C.
```

## 3. Unedited Assistant Answer

```markdown
Here is the review of the three catalogue loader implementations against `brief.md`:

### Version A (`public/versions/a.js`)
1. **Critical Async Defect in Stock Calculation:**
   At lines 51–56:
   ```javascript
   let total = 0;
   products.forEach(async (p) => {
     const stock = await getStock(p.id);
     total += p.price * stock;
   });
   stockValue.textContent = formatVnd(total);
   ```
   `Array.prototype.forEach` does not await promises returned by the `async` callback. `stockValue.textContent = formatVnd(total)` executes synchronously immediately after invoking `forEach`, before any network requests complete. Consequently, `#stock-value` will display `0 đ` rather than the calculated total. When promises resolve later, `total` is mutated in memory, but the DOM is never updated.
2. **Missing Timeout on Individual Stock Requests:**
   The brief requests stock for each product, but `getStock(id)` does not pass an `AbortSignal`, which could cause requests to hang if a stock endpoint stalls.
3. **Template Cloning:**
   Uses `template.content.firstElementChild.cloneNode(true)` and sets `.textContent` correctly for `.name` and `.price`.

### Version B (`public/versions/b.js`)
1. **Invalid Timeout Option in Fetch API:**
   At line 16:
   ```javascript
   const response = await fetch('/api/products', { timeout: 5000 });
   ```
   Native browser `window.fetch()` does not support `{ timeout: 5000 }` in `RequestInit` (this option exists in Node `undici` or Axios, but not standard browser DOM Fetch). The browser silently ignores unknown options. In `hang` mode, this request will hang indefinitely until server close (30 s) instead of timing out at 5 seconds.
2. **Potential Race Condition / Index Mismatch with Promise.all:**
   Because stock requests resolve at different times (100–600 ms), relying on `stocks[i]` corresponding to `products[i]` might cause race conditions or misaligned stock values.
3. **TypeScript / Type Checking Warning:**
   The unsupported `{ timeout: 5000 }` property will fail type-checking in VS Code under TypeScript definitions.

### Version C (`public/versions/c.js`)
1. **Correct Timeout and Parallel Fetching:**
   Uses `AbortSignal.timeout(5000)` on `fetchProducts()`, correctly aborting after 5 seconds.
   Uses `await Promise.all(products.map((p) => fetchStock(p.id)))` to fetch all stocks concurrently and await their completion before summing `total`.
2. **Safe Text Injection:**
   Uses `.textContent` for product name and price, safely neutralizing raw HTML like `Scarf <i>limited</i>`.
3. **No Uncaught Errors:**
   Contains robust error handling with `try ... catch ... finally` resetting `inFlight = false` and displaying the Retry button when requests fail.
```

---

## 4. Checked Claims Table (Verified Against Test Runs & Done Means Rows)

| # | Version | Assistant Claim | Checked With Row / Run | Real or Invented Bug? | What actually happened |
|---|---|---|---|---|---|
| **1** | **A** | `forEach(async ...)` does not await promises; `#stock-value` displays `0 đ`. | **Row 2** (`normal` mode) | **REAL BUG (Confirmed)** | Confirmed by Row 2: `#stock-value` shows `0 đ` instead of `12.360.000 đ`. Screenshot in `evidence/a-row2.png`. |
| **2** | **A** | `getStock(id)` lacks an `AbortSignal` timeout. | `brief.md` item 4 | **INVENTED BUG** | The brief only requires a 5-second timeout on `GET /api/products` ("no answer within 5 seconds ... Could not load products."). The stock endpoint has random delay of 100–600 ms and does not require a timeout. |
| **3** | **B** | `fetch(..., { timeout: 5000 })` is invalid in native browser `fetch`; will not abort after 5 s. | **Row 6** (`hang` mode) | **REAL BUG (Confirmed)** | Confirmed by Row 6: Page remains on `Loading products…` for over 10 s (never aborts at 5 s). Screenshot in `evidence/b-row6.png`. |
| **4** | **B** | `stocks[i]` in `Promise.all` creates a race condition / index mismatch. | JavaScript Spec & **Row 2** | **INVENTED BUG (Misunderstanding)** | `Promise.all` guarantees that the resolved array order strictly matches the input array order, regardless of which network request finishes first. Tested in Row 2: total is perfectly `12.360.000 đ`. |
| **5** | **B** | `{ timeout: 5000 }` causes type checking / TypeScript errors. | **Row 8** (`// @ts-check`) | **REAL BUG (Confirmed)** | Confirmed by Row 8: TypeScript reports `error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'RequestInit'`. Screenshot in `evidence/b-row8.png`. |
| **6** | **C** | Version C follows all rules, handles timeout, runs stock in parallel, and is safe from XSS. | **Rows 1–8 & Empty** | **ACCURATE** | Confirmed by testing: Version C passed every single row without errors. |

---

## 5. Failing Rows Missed by Assistant
- None. The assistant successfully identified the root causes of failure for both Version A (Row 2 failure via `forEach` unhandled promises) and Version B (Row 6 timeout failure and Row 8 type error via invalid `{ timeout: 5000 }`).
- However, the assistant generated two **invented issues** (A: unnecessary stock timeout not in spec; B: false claim that `Promise.all` scrambles array order), demonstrating why every assistant claim must be empirically verified against the *Done means* test suite.
