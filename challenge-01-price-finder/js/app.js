
const state = { sorted: [] };

const $ = (s) => document.querySelector(s);
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function normalizeProduct(p, index) {
  return {
    id: p.id ?? p.productId ?? index,
    name: p.name ?? p.title ?? "Unnamed Product",
    price: Number(p.price ?? 0),
    brand: p.brand ?? "Unknown Brand",
    rating: Number(p.rating ?? 0),
    reviews: Number(p.reviews ?? p.reviewCount ?? 0),
    image: p.image ?? p.imageUrl ?? ""
  };
}

// Sort once. Every search after this uses binary search.
state.sorted = products.map(normalizeProduct).filter(p => Number.isFinite(p.price));
state.sorted.sort((a,b) => a.price - b.price);

function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid].price < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function closestProducts(target, count = 3) {
  if (!state.sorted.length) return [];

  const pos = lowerBound(state.sorted, target);
  let left = pos - 1, right = pos;
  const result = [];

  while (result.length < count && (left >= 0 || right < state.sorted.length)) {
    if (left < 0) result.push(state.sorted[right++]);
    else if (right >= state.sorted.length) result.push(state.sorted[left--]);
    else {
      const dl = Math.abs(state.sorted[left].price - target);
      const dr = Math.abs(state.sorted[right].price - target);
      if (dl <= dr) result.push(state.sorted[left--]);
      else result.push(state.sorted[right++]);
    }
  }
  return result;
}

function render(productsToShow) {
  const box = $("#results");
  $("#resultCount").textContent = productsToShow.length;
  if (!productsToShow.length) {
    box.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  box.innerHTML = productsToShow.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">
      <div class="card-body">
        <span class="badge">${escapeHtml(p.brand)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">${money(p.price)}</div>
        <div class="rating">⭐ ${p.rating.toFixed(1)} <span class="muted">(${p.reviews} reviews)</span></div>
        <button class="view" data-id="${p.id}">View Product</button>
      </div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function search() {
  const target = Number($("#targetPrice").value);
  if (!Number.isFinite(target) || target < 0) {
    $("#message").textContent = "Enter a valid non-negative price.";
    render([]);
    return;
  }
  $("#message").textContent = `Closest products to ${money(target)}`;
  render(closestProducts(target, 3));
}

$("#searchBtn").addEventListener("click", search);
$("#targetPrice").addEventListener("keydown", e => { if (e.key === "Enter") search(); });

$("#results").addEventListener("click", e => {
  if (e.target.classList.contains("view")) {
    const p = state.sorted.find(x => String(x.id) === e.target.dataset.id);
    if (p) alert(`${p.name}\n${money(p.price)}\n${p.brand}\n⭐ ${p.rating}`);
  }
});

render(state.sorted.slice(0,3));
