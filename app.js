const STORAGE_KEY = "restaurant-wishlist-v1";

const form = document.querySelector("#restaurant-form");
const nameInput = document.querySelector("#name-input");
const addressInput = document.querySelector("#address-input");
const noteInput = document.querySelector("#note-input");
const list = document.querySelector("#restaurant-list");
const emptyState = document.querySelector("#empty-state");
const totalCount = document.querySelector("#total-count");
const tastedCount = document.querySelector("#tasted-count");
const filterButtons = document.querySelectorAll(".filter-button");

const dialog = document.querySelector("#detail-dialog");
const dialogName = document.querySelector("#dialog-name");
const dialogStatus = document.querySelector("#dialog-status");
const dialogAddress = document.querySelector("#dialog-address");
const dialogNote = document.querySelector("#dialog-note");
const closeDialog = document.querySelector("#close-dialog");
const deleteButton = document.querySelector("#delete-button");
const mapButton = document.querySelector("#map-button");
const toggleTastedButton = document.querySelector("#toggle-tasted-button");

let restaurants = loadRestaurants();
let activeFilter = "all";
let activeRestaurantId = null;

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const restaurant = {
    id: createId(),
    name: nameInput.value.trim(),
    address: addressInput.value.trim(),
    note: noteInput.value.trim(),
    tasted: false,
    createdAt: Date.now(),
  };

  if (!restaurant.name || !restaurant.address) return;

  restaurants = [restaurant, ...restaurants];
  saveRestaurants();
  form.reset();
  nameInput.focus();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

closeDialog.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

toggleTastedButton.addEventListener("click", () => {
  restaurants = restaurants.map((restaurant) => {
    if (restaurant.id !== activeRestaurantId) return restaurant;
    return { ...restaurant, tasted: !restaurant.tasted };
  });
  saveRestaurants();
  render();
  openDetails(activeRestaurantId);
});

deleteButton.addEventListener("click", () => {
  restaurants = restaurants.filter((restaurant) => restaurant.id !== activeRestaurantId);
  saveRestaurants();
  dialog.close();
  render();
});

function render() {
  const visibleRestaurants = getVisibleRestaurants();

  totalCount.textContent = restaurants.length;
  tastedCount.textContent = restaurants.filter((restaurant) => restaurant.tasted).length;

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === activeFilter);
  });

  list.innerHTML = "";
  emptyState.classList.toggle("visible", visibleRestaurants.length === 0);

  visibleRestaurants.forEach((restaurant) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "restaurant-card";
    card.addEventListener("click", () => openDetails(restaurant.id));

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    const address = document.createElement("p");
    title.textContent = restaurant.name;
    address.textContent = restaurant.address;
    copy.append(title, address);

    const badge = document.createElement("span");
    badge.className = `badge${restaurant.tasted ? " tasted" : ""}`;
    badge.textContent = restaurant.tasted ? "已品尝" : "想吃";

    card.append(copy, badge);
    list.append(card);
  });
}

function openDetails(id) {
  const restaurant = restaurants.find((item) => item.id === id);
  if (!restaurant) return;

  activeRestaurantId = id;
  dialogName.textContent = restaurant.name;
  dialogStatus.textContent = restaurant.tasted ? "已品尝" : "还没吃";
  dialogAddress.textContent = restaurant.address;
  dialogNote.textContent = restaurant.note || "暂无备注";
  mapButton.href = `https://map.baidu.com/search/${encodeURIComponent(restaurant.address)}`;
  toggleTastedButton.textContent = restaurant.tasted ? "改为未品尝" : "标记为已品尝";

  if (!dialog.open) dialog.showModal();
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisibleRestaurants() {
  if (activeFilter === "pending") {
    return restaurants.filter((restaurant) => !restaurant.tasted);
  }
  if (activeFilter === "tasted") {
    return restaurants.filter((restaurant) => restaurant.tasted);
  }
  return restaurants;
}

function loadRestaurants() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRestaurants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
