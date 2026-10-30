# AI-LOG.md — Catalogue Loader & Audit (CSC13008)

## 2026-10-30 — review original versions A, B, and C against brief.md
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: Review the three original files `public/versions/a.js`, `public/versions/b.js`, and `public/versions/c.js` against the specification in `brief.md` to identify all bugs, contract violations, syntax or runtime issues, and edge-case defects in each version before seeing my verdicts.
Kept: The identification that `a.js` lines 51–56 fails to await asynchronous callbacks in `Array.prototype.forEach`, which leaves `total === 0` when `stockValue.textContent` is written, and that `b.js` line 16 uses an invented `{ timeout: 5000 }` option in native `fetch()`.
Changed: The assistant claimed that `stocks[i]` in `b.js` creates a race condition because parallel network responses resolve out of order. I checked the ECMAScript specification for `Promise.all`: resolved elements strictly preserve the input array order regardless of network timing. I confirmed this by running Row 2 under `normal` mode: stock value rendered exactly `12.360.000 đ`.
Rejected: Its assertion that `getStock(id)` in `a.js` is defective for omitting an `AbortSignal.timeout`. Checking `brief.md` item 4 confirmed that the 5-second timeout constraint applies strictly to `GET /api/products` ("no answer within 5 seconds ... Could not load products."); stock requests have variable server delays (100–600 ms) and do not mandate client abortion.

## 2026-10-30 — fix Version A stock calculation (Row 2 & parallel check)
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: In `public/versions/a.js`, row 2 fails with `#stock-value` displaying `0 đ` because `products.forEach(async ...)` does not await stock fetches; await all stock requests in parallel with `Promise.all` and ensure requests remain concurrent without forming a waterfall.
Kept: Replacing the unawaited `forEach` block with `const stocks = await Promise.all(products.map((p) => getStock(p.id)))` and summing `total` via `reduce()`.
Changed: The assistant's initial snippet attempted to re-query DOM elements (`card.querySelector('.price')`) inside the stock calculation loop. I changed it to read `p.price` directly from the in-memory product objects, avoiding DOM access overhead and keeping data logic decoupled from presentation.
Rejected: A proposed sequential loop (`for (const p of products) { const s = await getStock(p.id); total += p.price * s; }`). While this would make the final stock value correct, DevTools Network tab immediately caught the flaw: the 8 stock requests executed sequentially as a staircase waterfall taking ~2.8 seconds instead of completing concurrently in ~580 ms, directly violating Brief item 5 and Criterion 2.

## 2026-10-30 — fix Version B fetch timeout (Rows 6 & 8)
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: In `public/versions/b.js`, rows 6 and 8 fail because `fetch('/api/products', { timeout: 5000 })` at line 16 uses an invalid option that native fetch ignores and TypeScript rejects; replace `{ timeout: 5000 }` with `{ signal: AbortSignal.timeout(5000) }` so hanging requests abort after 5 seconds without type errors.
Kept: Using `{ signal: AbortSignal.timeout(5000) }` as the second argument in `fetch('/api/products', ...)`.
Changed: In its first patch proposal, the assistant passed `AbortSignal.timeout(5000)` directly as the second parameter (`fetch('/api/products', AbortSignal.timeout(5000))`). Running `npx tsc -p jsconfig.json --checkJs` immediately failed with `error TS2345: Argument of type 'AbortSignal' is not assignable to parameter of type 'RequestInit'`. I corrected it to the required object property: `{ signal: AbortSignal.timeout(5000) }`.
Rejected: An alternative suggestion to construct a legacy `AbortController` combined with `setTimeout` and `res.on('close')` / `clearTimeout`. That introduced 12 lines of mutable state and timer cleanup boilerplate; native `AbortSignal.timeout(5000)` is modern browser standard, zero-dependency, and immediately passed both Row 6 (aborted at ~5.0 s under `hang` mode) and Row 8 (zero TS errors).

## 2026-10-30 — verification of Version C
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: Inspect `public/versions/c.js` against all 8 Done means rows, empty mode, and parallel stock constraints to determine if any fix or refactor is needed.
Kept: The decision to keep Version C completely untouched (`verdict: keep`).
Changed: Verified all 9 test conditions in the browser and terminal; Row 1–8 and empty passed with zero errors, stock value matched `12.360.000 đ`, and Network tab confirmed parallel dispatch (time spread < 20 ms).
Rejected: The assistant recommended rewriting `let total = 0; products.forEach((p, i) => { total += p.price * stock[i]; })` into `products.reduce(...)` to be "more functional and idiomatic". I rejected this refactoring because unnecessary code modifications on an already passing version violate scope minimalism and risk introducing regressions.

## 2026-10-30 — CSR vs SSR empirical investigation
Tool: none — Investigated manually using DevTools Network tab, Settings → Preferences → Debugger → Disable JavaScript, and View page source (`Ctrl+U`) on `http://localhost:5050/?v=c` and `http://localhost:5050/ssr`.
