// Catalogue loader for session 5, written by an assistant from brief.md.
// panel.js imports this file for ?v=<letter>; it runs as soon as it loads.

const statusLine = /** @type {HTMLElement} */ (document.querySelector('#status'));
const list = /** @type {HTMLUListElement} */ (document.querySelector('#catalogue'));
const template = /** @type {HTMLTemplateElement} */ (document.querySelector('#card-template'));
const stockValue = /** @type {HTMLOutputElement} */ (document.querySelector('#stock-value'));
const retryButton = /** @type {HTMLButtonElement} */ (document.querySelector('#retry'));

const formatVnd = (n) => n.toLocaleString('vi-VN') + ' đ';

async function getProducts() {
  // Give up after 5 seconds, as the brief asks.
  const res = await fetch('/api/products', { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`GET /api/products failed: HTTP ${res.status}`);
  return res.json();
}

async function getStock(id) {
  const res = await fetch(`/api/stock/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`GET /api/stock/${id} failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.stock;
}

function renderCards(products) {
  const cards = products.map((p) => {
    const card = /** @type {HTMLLIElement} */ (template.content.firstElementChild.cloneNode(true));
    card.dataset.id = p.id;
    card.querySelector('.name').textContent = p.name;
    card.querySelector('.price').textContent = formatVnd(p.price);
    return card;
  });
  list.replaceChildren(...cards);
}

let busy = false;

async function load() {
  if (busy) return;
  busy = true;
  retryButton.hidden = true;
  stockValue.textContent = '—';
  statusLine.textContent = 'Loading products…';
  try {
    const products = await getProducts();
    renderCards(products);
    statusLine.textContent = products.length > 0 ? '' : 'No products yet.';

    // Stock for every product, requested at the same time.
    let total = 0;
    products.forEach(async (p) => {
      const stock = await getStock(p.id);
      total += p.price * stock;
    });
    stockValue.textContent = formatVnd(total);
  } catch {
    list.replaceChildren();
    statusLine.textContent = 'Could not load products.';
    retryButton.hidden = false;
  } finally {
    busy = false;
  }
}

retryButton.addEventListener('click', load);
load();
