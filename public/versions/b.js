// Catalogue loader for session 5, written by an assistant from brief.md.
// panel.js imports this file for ?v=<letter>; it runs as soon as it loads.

const catalogue = /** @type {HTMLUListElement} */ (document.getElementById('catalogue'));
const cardTemplate = /** @type {HTMLTemplateElement} */ (document.getElementById('card-template'));
const statusText = /** @type {HTMLElement} */ (document.getElementById('status'));
const stockOutput = /** @type {HTMLOutputElement} */ (document.getElementById('stock-value'));
const retry = /** @type {HTMLButtonElement} */ (document.getElementById('retry'));

function toVnd(amount) {
  return amount.toLocaleString('vi-VN') + ' đ';
}

async function loadProducts() {
  // Stop waiting after 5 seconds, as the brief asks.
  const response = await fetch('/api/products', { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Products request failed: HTTP ${response.status}`);
  return response.json();
}

async function loadStock(id) {
  const response = await fetch(`/api/stock/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`Stock request for ${id} failed: HTTP ${response.status}`);
  const { stock } = await response.json();
  return stock;
}

function createCard(product) {
  const card = /** @type {HTMLLIElement} */ (cardTemplate.content.firstElementChild.cloneNode(true));
  card.dataset.id = product.id;
  card.querySelector('.name').textContent = product.name;
  card.querySelector('.price').textContent = toVnd(product.price);
  return card;
}

let loading = false;

async function showCatalogue() {
  if (loading) return;
  loading = true;
  retry.hidden = true;
  catalogue.replaceChildren();
  stockOutput.textContent = '—';
  statusText.textContent = 'Loading products…';
  try {
    const products = await loadProducts();
    catalogue.append(...products.map(createCard));
    statusText.textContent = products.length === 0 ? 'No products yet.' : '';

    // All stock requests run in parallel; wait for every one of them.
    const stocks = await Promise.all(products.map((p) => loadStock(p.id)));
    const total = products.reduce((sum, p, i) => sum + p.price * stocks[i], 0);
    stockOutput.textContent = toVnd(total);
  } catch {
    statusText.textContent = 'Could not load products.';
    retry.hidden = false;
  } finally {
    loading = false;
  }
}

retry.addEventListener('click', showCatalogue);
showCatalogue();
