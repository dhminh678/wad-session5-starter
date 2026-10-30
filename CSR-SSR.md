# CSR vs SSR: The Same Catalogue Built in Two Places (CSC13008 — IA#3)

This report answers the five CSR vs SSR architectural questions from `README.md` based on empirical observations made between the client-rendered application (`http://localhost:5050/?v=c`) and the server-rendered application (`http://localhost:5050/ssr`).

---

### Question 1: Where are the product names and stock value in "View page source" (`Ctrl+U`)?

- **Client-Side Rendering (`/?v=c`):**
  - **Product names:** Not present in the initial HTML document. The catalogue container is completely empty: `<ul class="catalogue" id="catalogue"></ul>`. The product names exist only as empty placeholders inside the `<template id="card-template">` tag (`<h2 class="name"></h2>`).
  - **Stock value:** Not present. The HTML contains only the fallback placeholder: `<output id="stock-value">—</output>`.
  - **Why:** The browser receives an empty HTML shell. The client-side JavaScript (`panel.js` and `versions/c.js`) must download, execute, fetch data from `/api/products` and `/api/stock/*`, and manually build the DOM tree.

- **Server-Side Rendering (`/ssr`):**
  - **Product names:** Fully present in the HTML document delivered by the server. All 8 products are pre-rendered into `<li class="card">` elements with their actual text (e.g. `<h2 class="name">T-shirt</h2>`, `<h2 class="name">Hoodie</h2>`).
  - **Stock value:** Fully present in the markup: `<output id="stock-value">12.360.000 đ</output>`.
  - **Why:** `server.mjs` executes `renderSsrPage()`, computing the stock total and concatenating HTML strings into finished markup before sending the response to the browser.

---

### Question 2: In `/ssr`'s source, find the scarf. Why does it read `&lt;i&gt;` there, and what does that have in common with `textContent` in the browser?

- **Observation in `/ssr` source:**
  ```html
  <li class="card" data-id="scarf">
    <h2 class="name">Scarf &lt;i&gt;limited&lt;/i&gt;</h2>
    <p class="price">160.000 đ</p>
  </li>
  ```
- **Why it reads `&lt;i&gt;`:**
  In `server.mjs`, when assembling the HTML template string, all product attributes are passed through `escapeHtml()`:
  ```javascript
  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }
  ```
  This converts literal `<` and `>` into HTML character entities (`&lt;` and `&gt;`). When the browser renders the HTML, the parser displays literal angle brackets instead of creating an HTML italic element `<i>`.
- **Commonality with `textContent` in the browser:**
  Both mechanisms enforce the fundamental security principle of **contextual data-vs-code separation**:
  - In the browser, assigning to `node.textContent = p.name` bypasses HTML parsing entirely, treating the assigned string strictly as textual data in the DOM tree.
  - On the server, `escapeHtml(p.name)` sanitizes untrusted input before string interpolation into the HTML response stream.
  Both prevent Cross-Site Scripting (XSS) by ensuring that strings containing `<...>` are never interpreted as markup.

---

### Question 3: Disable JavaScript in DevTools and reload both pages. What is left of each?

- **Client-Side Rendering (`/?v=c`):**
  - The page is a broken, empty skeleton.
  - The catalogue remains completely blank (`#catalogue` has 0 cards).
  - The status line displays `"Pick a version above: A, B or C."` (or nothing), and stock value remains frozen at `—`.
  - The application is non-functional because it relies 100% on client-side JS execution to fetch and render data.

- **Server-Side Rendering (`/ssr`):**
  - The page renders **completely intact**: all 8 product cards, formatted prices, and `Stock value: 12.360.000 đ` are fully visible.
  - The user can read the entire catalogue without running a single line of JavaScript in the client.

---

### Question 4: Count the requests in the Network tab before the stock value appears. Which page would a search engine or a user on a slow phone see first?

- **Request counts in Network tab:**
  - **SSR (`/ssr`): Exactly 2 requests**
    1. `GET /ssr` (HTML document with full content and stock value)
    2. `GET /style.css` (Stylesheet)
    *(The stock value is visible on request #1!)*
  - **CSR (`/?v=c`): 13 requests**
    1. `GET /?v=c` (Empty HTML shell)
    2. `GET /style.css` (Stylesheet)
    3. `GET /panel.js` (Harness script)
    4. `GET /__mode` (Mode checking API)
    5. `GET /versions/c.js` (Catalogue module script)
    6. `GET /api/products` (Catalogue API request)
    7–14. `GET /api/stock/:id` (8 parallel stock API requests: tshirt, hoodie, somi, cap, tote, socks, jacket, scarf)
- **Which page would be seen first:**
  - **The SSR page (`/ssr`) is seen dramatically faster.**
  - **Search engines (SEO):** Web crawlers can index the entire product catalogue and pricing immediately in the first HTTP response without running an expensive JavaScript execution sandbox.
  - **Slow mobile devices:** On high-latency connections (e.g. 3G or Slow 4G), the CSR waterfall takes multiple seconds across 13 sequential and parallel round-trips before rendering, whereas SSR delivers the complete page in a single round-trip.

---

### Question 5: When would you want the server to render, and when the browser? (One sentence)

> Use **server-side rendering (SSR)** for public, SEO-critical, and content-first web pages that require immediate first-paint times and universal accessibility across slow devices, and use **client-side rendering (CSR)** for rich, highly interactive, authenticated web applications or dashboards where state updates frequently and partial page transitions avoid full reloads.
