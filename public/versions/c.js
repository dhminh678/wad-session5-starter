// Catalogue loader for session 5, written by an assistant from brief.md.
// panel.js imports this file for ?v=<letter>; it runs as soon as it loads.

const ui = {
  status: /** @type {HTMLElement} */ (document.querySelector('#status')),
  list: /** @type {HTMLUListElement} */ (document.querySelector('#catalogue')),
  template: /** @type {HTMLTemplateElement} */ (document.querySelector('#card-template')),
  stockValue: /** @type {HTMLOutputElement} */ (document.querySelector('#stock-value')),
  retry: /** @type {HTMLButtonElement} */ (document.querySelector('#retry')),
};

const money = (value) => value.toLocaleString('vi-VN') + ' đ';

async function fetchProducts() {
  // Abort after 5 seconds, as the brief asks.
  const res = await fetch('/api/products', { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from /api/products`);
  return res.json();
}

async function fetchStock(id) {
  const res = await fetch(`/api/stock/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} from /api/stock/${id}`);
  const body = await res.json();
  return body.stock;
}

function render(products) {
  const fragment = document.createDocumentFragment();
  for (const p of products) {
    const card = /** @type {HTMLLIElement} */ (ui.template.content.firstElementChild.cloneNode(true));
    card.dataset.id = p.id;
    card.querySelector('.name').textContent = p.name;
    card.querySelector('.price').textContent = money(p.price);
    fragment.append(card);
  }
  ui.list.replaceChildren(fragment);
}

let inFlight = false;

async function start() {
  if (inFlight) return;
  inFlight = true;
  ui.retry.hidden = true;
  ui.stockValue.textContent = '—';
  ui.status.textContent = 'Loading products…';
  try {
    const products = await fetchProducts();
    render(products);
    ui.status.textContent = products.length ? '' : 'No products yet.';

    // One stock request per product, all sent at once.
    const stock = await Promise.all(products.map((p) => fetchStock(p.id)));
    let total = 0;
    products.forEach((p, i) => { total += p.price * stock[i]; });
    ui.stockValue.textContent = money(total);
  } catch {
    ui.list.replaceChildren();
    ui.status.textContent = 'Could not load products.';
    ui.retry.hidden = false;
  } finally {
    inFlight = false;
  }
}

ui.retry.addEventListener('click', start);
start();
