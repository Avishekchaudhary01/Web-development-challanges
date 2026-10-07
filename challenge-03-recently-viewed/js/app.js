
const HISTORY_KEY = "productExplorer.recentlyViewed";
const MAX_HISTORY = 5;

const $ = s => document.querySelector(s);
const money = n => `₹${Number(n).toLocaleString("en-IN")}`;

function normalizeProduct(p, index) {
  return {
    id: String(p.id ?? p.productId ?? index),
    name: p.name ?? p.title ?? "Unnamed Product",
    price: Number(p.price ?? 0),
    brand: p.brand ?? "Unknown Brand",
    rating: Number(p.rating ?? 0),
    reviews: Number(p.reviews ?? p.reviewCount ?? 0),
    image: p.image ?? p.imageUrl ?? ""
  };
}

const allProducts = products.map(normalizeProduct);
let recentlyViewed = loadHistory();

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .map(String)
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(recentlyViewed));
}

function getProduct(id) {
  return allProducts.find(p => p.id === String(id));
}

// Basic array-based implementation.
// Remove existing ID, put it at the front, cap at 5.
function addToHistory(id) {
  const key = String(id);
  recentlyViewed = recentlyViewed.filter(x => x !== key);
  recentlyViewed.unshift(key);
  if (recentlyViewed.length > MAX_HISTORY) recentlyViewed.pop();
  saveHistory();
  renderHistory();
  showToast("Added to Recently Viewed");
}

function removeFromHistory(id) {
  recentlyViewed = recentlyViewed.filter(x => x !== String(id));
  saveHistory();
  renderHistory();
}

function clearHistory() {
  recentlyViewed = [];
  saveHistory();
  renderHistory();
}

function renderProducts(list) {
  $("#products").innerHTML = list.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">
      <div class="card-body">
        <span class="badge">${escapeHtml(p.brand)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">${money(p.price)}</div>
        <div class="rating">⭐ ${p.rating.toFixed(1)} <span class="muted">(${p.reviews})</span></div>
        <button class="view" data-id="${p.id}">View Product</button>
      </div>
    </article>
  `).join("");
}

function renderHistory() {
  const box = $("#history");
  const items = recentlyViewed.map(getProduct).filter(Boolean);

  if (!items.length) {
    box.innerHTML = `<div class="empty">No recently viewed products yet. Open a product above.</div>`;
    $("#clearBtn").disabled = true;
    return;
  }

  $("#clearBtn").disabled = false;
  box.innerHTML = items.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">
      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">${money(p.price)}</div>
        <button class="secondary remove" data-id="${p.id}">Remove</button>
        <button class="view" data-id="${p.id}">View Again</button>
      </div>
    </article>
  `).join("");
}

function openProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  addToHistory(id);
  $("#modalTitle").textContent = p.name;
  $("#modalContent").innerHTML = `
    <p><b>Brand:</b> ${escapeHtml(p.brand)}</p>
    <p><b>Price:</b> ${money(p.price)}</p>
    <p><b>Rating:</b> ⭐ ${p.rating.toFixed(1)} (${p.reviews} reviews)</p>
  `;
  $("#modal").showModal();
}

function showToast(text) {
  const t = $("#toast");
  t.textContent = text; t.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.style.display = "none", 1400);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

$("#products").addEventListener("click", e => {
  if (e.target.classList.contains("view")) openProduct(e.target.dataset.id);
});

$("#history").addEventListener("click", e => {
  const id = e.target.dataset.id;
  if (e.target.classList.contains("view")) openProduct(id);
  if (e.target.classList.contains("remove")) removeFromHistory(id);
});

$("#clearBtn").addEventListener("click", clearHistory);
$("#closeModal").addEventListener("click", () => $("#modal").close());

renderProducts(allProducts);
renderHistory();
