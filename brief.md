# Brief — load the catalogue from the API

*This is the brief the assistant was given, word for word, three times. Each
answer is one file in `public/versions/`.*

---

Write `public/versions/<letter>.js`, a browser ES module that loads the shop
catalogue from the API and shows it on the page. `public/panel.js` imports the
file when the page is opened with `?v=<letter>`, so the code runs as soon as
it is imported. Plain JavaScript, no libraries, no build step.

## The page (already written — use these elements)

| Element | What it is for |
|---|---|
| `#status` (`role="status"`) | One line of status text |
| `#catalogue` (`<ul>`) | The product cards go here |
| `#card-template` (`<template>`) | One card: `<li class="card" data-id>` with `.name` and `.price` inside |
| `#stock-value` (`<output>`) | The total stock value |
| `#retry` (`<button hidden>`) | The Retry button, hidden at the start |

## The API (served by `server.mjs`, same origin)

- `GET /api/products` → `200` with a JSON array of
  `{ "id": "tshirt", "name": "T-shirt", "price": 180000 }`.
  It can also answer `500` with a JSON error body, answer slowly, or not
  answer at all.
- `GET /api/stock/:id` → `200` with `{ "id": "tshirt", "stock": 12 }`, after
  100–600 ms. Unknown id → `404`.

## What the code must do

1. On load, request `GET /api/products`. While waiting, `#status` says
   `Loading products…`.
2. For each product, copy the template and fill in `.name`, `.price`
   (formatted `price.toLocaleString('vi-VN') + ' đ'`, e.g. `180.000 đ`) and
   `data-id`. Put the cards into `#catalogue` in the order the API gives.
3. When the cards are on the page, clear `#status`. If the list is empty,
   `#status` says `No products yet.` instead.
4. If the request fails — a network error, a status that is not 2xx, or **no
   answer within 5 seconds** — `#status` says `Could not load products.` and
   the Retry button is shown. Pressing Retry hides it and tries again, from
   step 1.
5. When the products are loaded, compute the **stock value**: the sum of
   `price × stock` over all products, where each product's stock comes from
   `GET /api/stock/:id`. Request the stock of all products **in parallel**,
   not one after another. Write the total into `#stock-value` formatted
   `total.toLocaleString('vi-VN') + ' đ'`. With no products it is `0 đ`.
6. Every piece of text that comes from the API goes in with `textContent`,
   never `innerHTML` — product names are data, not markup.

## Constraints

- Do not edit `index.html`, `style.css`, `panel.js`, `server.mjs` or
  `jsconfig.json`.
- No `console.error` for expected failures — the Console must stay free of
  red errors when the API fails the way it is allowed to.
