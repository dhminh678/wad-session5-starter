# Assistant Review & Verification (CSC13008 — IA#3)

## 1. Assistant Information
- **Tool:** Antigravity (Google DeepMind)
- **Model:** Gemini 3.8 Flash

## 2. Review Prompt Given to Assistant
```text
Review the three original files public/versions/a.js, public/versions/b.js, and public/versions/c.js against the specification in brief.md.
Identify all bugs, contract violations, syntax or runtime issues, and edge-case defects in each version.
Do not write fixed code yet; provide your evaluation for Version A, Version B, and Version C.
```

## 3. Unedited Assistant Answer

````markdown
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
````

---

## 4. Checked Claims Table (Verified Against Test Runs & Done Means Rows)

| # | Version | Assistant Claim | Checked With Row / Run | Real or Invented Bug? | What actually happened |
|---|---|---|---|---|---|
| **1** | **A** | `forEach(async ...)` does not await promises; `#stock-value` displays `0 đ`. | **Row 2** (`normal` mode) | **REAL BUG (Confirmed)** | Confirmed by Row 2: `#stock-value` shows `0 đ` instead of `12.360.000 đ`. Screenshot in `evidence/a-row2.png`. |
| **2** | **A** | `getStock(id)` lacks an `AbortSignal` timeout. | Run: temporary copy with stock delay set to 30 s, `?v=a`, watched for 7 s | **NOT A BRIEF BUG (behaviour real)** | 8 cards render, stock value stays `—`, no error, no Retry. Brief item 4 only covers `GET /api/products` ("no answer within 5 seconds ... Could not load products.") and no Done means row measures stock timeout, so it violates no specification. |
| **3** | **A** | Template cloning via `cloneNode(true)` and `textContent` for text injection. | **Rows 1 and 3** | **ACCURATE** | Confirmed by Rows 1 and 3: 8 cards clone properly into `#catalogue`, and `Scarf <i>limited</i>` preserves literal angle brackets without rendering HTML italic markup. |
| **4** | **B** | `fetch(..., { timeout: 5000 })` is invalid in browser `fetch`; will not abort after 5 s. | **Row 6** (`hang` mode) | **REAL BUG (Confirmed)** | Confirmed by Row 6: Page remains on `Loading products…` for over 15 s (does not abort at 5 s). Screenshot in `evidence/b-row6.png`. |
| **5** | **B** | Assistant claimed `{ timeout: 5000 }` exists in Node `undici`. | Run: Node 22 script with `fetch(url, { timeout: 500 })` against hanging server | **INVENTED BUG / FALSE CLAIM** | Running native `fetch` in Node 22 with `{ timeout: 500 }` remains pending beyond 2000 ms. In `undici`, timeouts are configured at the Dispatcher/Client level, not as a `RequestInit` property. |
| **6** | **B** | `stocks[i]` in `Promise.all` creates a race condition / index mismatch. | JavaScript Spec & **Row 2** (10 reloads) | **INVENTED BUG (Misunderstanding)** | `Promise.all` strictly preserves input array ordering in the resolved array by ECMAScript specification. Reloaded Version B 10 consecutive times with random delays (100–600 ms) producing 10 different arrival orders, yet total remained strictly `12.360.000 đ`. |
| **7** | **B** | `{ timeout: 5000 }` causes type checking / TypeScript errors under `// @ts-check`. | **Row 8** (`// @ts-check` + `tsc -p jsconfig.json`) | **REAL BUG (Confirmed)** | Confirmed by Row 8: TypeScript reports `error TS2353: Object literal may only specify known properties, and 'timeout' does not exist in type 'RequestInit'`. Screenshot in `evidence/b-row8.png`. |
| **8** | **C** | Correct timeout (`AbortSignal.timeout(5000)`) and parallel fetching via `Promise.all`. | **Rows 6 & 2**, Parallel check | **ACCURATE** | Confirmed: Aborts in 5.0 s under `hang`, computes `12.360.000 đ`, and all 8 stock requests dispatch concurrently with time spread < 20 ms. |
| **9** | **C** | Safe text injection via `textContent` preventing XSS. | **Row 3** | **ACCURATE** | Confirmed: Angle brackets visible on scarf card, zero italic DOM elements created. |
| **10** | **C** | Robust error handling resetting `inFlight = false` and displaying Retry button. | **Rows 5, 6, 7** | **ACCURATE** | Confirmed: Retry appears on failure, clicking Retry recovers to 8 cards, and zero uncaught exceptions in Console. |

---

## 5. Failing Rows Missed by Assistant
- None of the failing Done means rows were missed. The assistant successfully pinpointed the two real breaking defects in original files:
  1. Version A: Row 2 failure (unawaited `async` callback in `forEach`).
  2. Version B: Row 6 failure (invalid `{ timeout: 5000 }` not aborting after 5 seconds) and Row 8 failure (TS2353 type error).
- However, the assistant asserted two **invented issues / misunderstandings**:
  1. A false claim that `Promise.all` suffers from index-matching race conditions (disproved by ECMAScript spec and 10 random delay reloads).
  2. A false assertion that `{ timeout: 5000 }` is valid in Node `undici` native `fetch` (disproved by running a test script in Node 22).
  3. A spec-creep claim that `getStock(id)` required an abort timeout (disproved by checking `brief.md` item 4 and confirming no row tests stock endpoint timeout).
