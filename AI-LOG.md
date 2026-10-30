# AI-LOG.md — Catalogue Loader & Audit (CSC13008)

## 2026-10-30 — review original versions A, B, and C against brief.md
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: Review the three original files `public/versions/a.js`, `public/versions/b.js`, and `public/versions/c.js` against the specification in `brief.md` to identify all bugs, contract violations, syntax or runtime issues, and edge-case defects in each version.
Kept: The identification that `a.js` lines 51–56 fails to await promises in `forEach`, causing `#stock-value` to show `0 đ`, and that `b.js` uses an unsupported `{ timeout: 5000 }` option in `fetch()`.
Changed: Checked its claim that `stocks[i]` in `b.js` causes a race condition; rejected that claim because `Promise.all` preserves input array order by ECMAScript specification, and confirmed Row 2 passes in `b.js`.
Rejected: Its claim that `getStock(id)` in `a.js` requires an `AbortSignal.timeout`. The brief only mandates a 5-second timeout on `GET /api/products`; stock endpoints have a random delay of 100–600 ms and are not required to timeout.

## 2026-10-30 — fix Version A stock calculation
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: In `public/versions/a.js`, row 2 fails with `#stock-value` displaying `0 đ` because `products.forEach(async ...)` does not await stock fetches; await all stock requests in parallel with `Promise.all` and ensure requests remain concurrent without forming a waterfall.
Kept: Replacing `products.forEach(async ...)` with `await Promise.all(products.map(...))` and summing `p.price * stocks[i]` with `reduce()`.
Changed: Preserved the existing JSDoc comments and the `formatVnd(total)` helper function rather than introducing custom formatting logic.
Rejected: An initial proposal to wrap stock fetching in a sequential `for ... of` loop, which would violate brief item 5 (requests must run in parallel, not one after another).

## 2026-10-30 — fix Version B fetch timeout
Tool: Gemini 3.8 Flash in Antigravity.
Asked for: In `public/versions/b.js`, rows 6 and 8 fail because `fetch('/api/products', { timeout: 5000 })` at line 16 uses an invalid option that native fetch ignores and TypeScript rejects; replace `{ timeout: 5000 }` with `{ signal: AbortSignal.timeout(5000) }` so hanging requests abort after 5 seconds without type errors.
Kept: Replacing `{ timeout: 5000 }` with `{ signal: AbortSignal.timeout(5000) }`.
Changed: Kept the exact error message and throw condition (`Products request failed: HTTP ${response.status}`) to maintain compatibility with `showCatalogue()` catch block.
Rejected: An alternative suggestion to use a manual `setTimeout` + `AbortController` pair with `clearTimeout`, which is verbose legacy boilerplate compared to native `AbortSignal.timeout(5000)`.

## 2026-10-30 — CSR vs SSR analysis
Tool: none — I inspected the network waterfall, disabled JavaScript in DevTools, and compared `view-source` of `/?v=c` and `/ssr` directly.
