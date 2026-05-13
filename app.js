const STORAGE_KEY = "restaurant-wishlist-v1";

const form = document.querySelector("#restaurant-form");
const nameInput = document.querySelector("#name-input");
const regionInput = document.querySelector("#region-input");
const addressInput = document.querySelector("#address-input");
const noteInput = document.querySelector("#note-input");
const list = document.querySelector("#restaurant-list");
const emptyState = document.querySelector("#empty-state");
const totalCount = document.querySelector("#total-count");
const tastedCount = document.querySelector("#tasted-count");
const filterButtons = document.querySelectorAll(".filter-button");
const districtFilter = document.querySelector("#district-filter");
const recommendation = document.querySelector("#recommendation");
const helpButton = document.querySelector("#help-button");
const recommendButton = document.querySelector("#recommend-button");
const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const importInput = document.querySelector("#import-input");

const dialog = document.querySelector("#detail-dialog");
const dialogName = document.querySelector("#dialog-name");
const dialogStatus = document.querySelector("#dialog-status");
const dialogRegion = document.querySelector("#dialog-region");
const dialogAddress = document.querySelector("#dialog-address");
const dialogLocationStatus = document.querySelector("#dialog-location-status");
const dialogNote = document.querySelector("#dialog-note");
const revisitInput = document.querySelector("#revisit-input");
const ratingInput = document.querySelector("#rating-input");
const reviewInput = document.querySelector("#review-input");
const saveReviewButton = document.querySelector("#save-review-button");
const closeDialog = document.querySelector("#close-dialog");
const helpDialog = document.querySelector("#help-dialog");
const closeHelpDialog = document.querySelector("#close-help-dialog");
const deleteButton = document.querySelector("#delete-button");
const appleMapButton = document.querySelector("#apple-map-button");
const amapButton = document.querySelector("#amap-button");
const savePlaceLocationButton = document.querySelector("#save-place-location-button");
const toggleTastedButton = document.querySelector("#toggle-tasted-button");

let restaurants = loadRestaurants();
let activeFilter = "all";
let activeDistrict = "all";
let activeRestaurantId = null;

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const restaurant = {
    id: createId(),
    name: nameInput.value.trim(),
    region: regionInput.value.trim(),
    district: getDistrict(regionInput.value),
    address: addressInput.value.trim(),
    note: noteInput.value.trim(),
    tasted: false,
    revisit: false,
    rating: 0,
    review: "",
    coordinates: null,
    createdAt: Date.now(),
  };

  if (!restaurant.name || !restaurant.region || !restaurant.address) return;

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

districtFilter.addEventListener("change", () => {
  activeDistrict = districtFilter.value;
  render();
});

recommendButton.addEventListener("click", recommendNearestRevisitRestaurant);
exportButton.addEventListener("click", confirmExportRestaurants);
importButton.addEventListener("click", showImportGuide);
importInput.addEventListener("change", importRestaurants);
helpButton.addEventListener("click", () => helpDialog.showModal());
closeHelpDialog.addEventListener("click", () => helpDialog.close());

closeDialog.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
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

savePlaceLocationButton.addEventListener("click", saveCurrentLocationForActiveRestaurant);
saveReviewButton.addEventListener("click", saveEatingRecord);
revisitInput.addEventListener("change", saveEatingRecord);
ratingInput.addEventListener("change", saveEatingRecord);

function render() {
  hydrateDistrictFilter();
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
    const meta = document.createElement("p");
    const rating = document.createElement("p");
    title.textContent = restaurant.name;
    address.textContent = restaurant.address;
    meta.textContent = restaurant.region || "未填写省市区";
    meta.className = "restaurant-meta";
    rating.textContent = formatRating(restaurant.rating);
    rating.className = "restaurant-rating";
    copy.append(title, address, meta, rating);

    const badgeGroup = document.createElement("div");
    badgeGroup.className = "badge-group";
    const statusBadge = document.createElement("span");
    statusBadge.className = `badge${restaurant.tasted ? " tasted" : ""}`;
    statusBadge.textContent = restaurant.tasted ? "已品尝" : "想吃";
    badgeGroup.append(statusBadge);
    if (restaurant.revisit) {
      const revisitBadge = document.createElement("span");
      revisitBadge.className = "badge revisit";
      revisitBadge.textContent = "再来吃";
      badgeGroup.append(revisitBadge);
    }

    card.append(copy, badgeGroup);
    list.append(card);
  });
}

function openDetails(id) {
  const restaurant = restaurants.find((item) => item.id === id);
  if (!restaurant) return;

  activeRestaurantId = id;
  dialogName.textContent = restaurant.name;
  dialogStatus.textContent = restaurant.tasted ? "已品尝" : "还没吃";
  dialogRegion.textContent = restaurant.region || "未填写";
  dialogAddress.textContent = restaurant.address;
  dialogLocationStatus.textContent = restaurant.coordinates ? "已保存店铺位置" : "未保存店铺位置";
  dialogNote.textContent = restaurant.note || "暂无备注";
  revisitInput.checked = Boolean(restaurant.revisit);
  ratingInput.value = String(restaurant.rating || 0);
  reviewInput.value = restaurant.review || "";
  appleMapButton.href = createAppleMapUrl(restaurant);
  amapButton.href = createAmapUrl(restaurant);
  toggleTastedButton.textContent = restaurant.tasted ? "改为未品尝" : "标记为已品尝";

  if (!dialog.open) dialog.showModal();
}

function saveEatingRecord() {
  if (!activeRestaurantId) return;

  restaurants = restaurants.map((restaurant) => {
    if (restaurant.id !== activeRestaurantId) return restaurant;
    return {
      ...restaurant,
      revisit: revisitInput.checked,
      rating: Number(ratingInput.value),
      review: reviewInput.value.trim(),
    };
  });
  saveRestaurants();
  render();
  openDetails(activeRestaurantId);
}

function getVisibleRestaurants() {
  return restaurants.filter((restaurant) => {
    const statusMatches =
      activeFilter === "all" ||
      (activeFilter === "pending" && !restaurant.tasted) ||
      (activeFilter === "tasted" && restaurant.tasted);
    const districtMatches = activeDistrict === "all" || restaurant.district === activeDistrict;
    return statusMatches && districtMatches;
  });
}

function hydrateDistrictFilter() {
  const districts = [...new Set(restaurants.map((restaurant) => restaurant.district).filter(Boolean))].sort();
  const previousValue = activeDistrict;
  districtFilter.innerHTML = '<option value="all">全部地区</option>';
  districts.forEach((district) => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    districtFilter.append(option);
  });
  activeDistrict = districts.includes(previousValue) ? previousValue : "all";
  districtFilter.value = activeDistrict;
}

function recommendNearestRevisitRestaurant() {
  const candidates = restaurants.filter((restaurant) => restaurant.revisit && restaurant.coordinates);
  if (!candidates.length) {
    recommendation.textContent = "还没有可推荐的“再来吃”店铺。请先在店铺详情里勾选“再来吃”，并到店保存当前位置为店铺位置。";
    return;
  }
  if (!navigator.geolocation) {
    recommendation.textContent = "当前浏览器不支持定位，暂时无法推荐最近的店。";
    return;
  }

  recommendation.textContent = "正在获取你的位置...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const nearest = candidates
        .map((restaurant) => ({
          restaurant,
          distance: getDistanceInKm(userLocation, restaurant.coordinates),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      recommendation.textContent = `最近的再来吃：${nearest.restaurant.name}，约 ${formatDistance(nearest.distance)}。`;
      activeDistrict = "all";
      activeFilter = "all";
      render();
      openDetails(nearest.restaurant.id);
    },
    () => {
      recommendation.textContent = "没有获得定位权限。请允许浏览器访问位置后再试。";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function saveCurrentLocationForActiveRestaurant() {
  if (!navigator.geolocation) {
    alert("当前浏览器不支持定位。");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      restaurants = restaurants.map((restaurant) => {
        if (restaurant.id !== activeRestaurantId) return restaurant;
        return { ...restaurant, coordinates };
      });
      saveRestaurants();
      render();
      openDetails(activeRestaurantId);
      alert("已保存店铺位置。");
    },
    () => {
      alert("没有获得定位权限，请允许浏览器访问位置后再试。");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDistrict(region) {
  const parts = region
    .trim()
    .split(/[\s,，/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

function createAppleMapUrl(restaurant) {
  const query = encodeURIComponent(`${restaurant.name} ${restaurant.region || ""} ${restaurant.address}`);
  if (restaurant.coordinates) {
    return `https://maps.apple.com/?ll=${restaurant.coordinates.lat},${restaurant.coordinates.lng}&q=${query}`;
  }
  return `https://maps.apple.com/?q=${query}`;
}

function createAmapUrl(restaurant) {
  const name = encodeURIComponent(restaurant.name);
  if (restaurant.coordinates) {
    return `https://uri.amap.com/marker?position=${restaurant.coordinates.lng},${restaurant.coordinates.lat}&name=${name}`;
  }
  const keyword = encodeURIComponent(`${restaurant.name} ${restaurant.region || ""} ${restaurant.address}`);
  return `https://uri.amap.com/search?keyword=${keyword}`;
}

function getDistanceInKm(from, to) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function formatDistance(distance) {
  if (distance < 1) return `${Math.round(distance * 1000)} 米`;
  return `${distance.toFixed(1)} 公里`;
}

function formatRating(rating) {
  const score = Number(rating) || 0;
  if (!score) return "未评分";
  return `${"★".repeat(score)}${"☆".repeat(5 - score)} ${score} 分`;
}

function loadRestaurants() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return normalizeImportedRestaurants(parsed, { tolerateLegacy: true });
  } catch {
    return [];
  }
}

function saveRestaurants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
}

function confirmExportRestaurants() {
  const confirmed = confirm(
    `导出数据会下载一个 JSON 备份文件，用来换手机或恢复清单。\n\n请妥善保存这个文件，不要随便发给别人。\n\n确定要导出当前 ${restaurants.length} 家店吗？`,
  );
  if (!confirmed) return;

  exportRestaurants();
}

function exportRestaurants() {
  const data = JSON.stringify(restaurants, null, 2);
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `猪猪美食之旅-${getTodayText()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showImportGuide() {
  const confirmed = confirm(
    `导入数据说明：\n\n1. 先在旧手机点击“导出数据”，保存 JSON 备份文件。\n2. 通过 AirDrop、iCloud Drive、微信文件、邮件或网盘把文件传到新手机。\n3. 在新手机打开这个网页，点击“导入数据”，选择那个 JSON 文件。\n4. 导入会覆盖当前手机上的清单，包括店名、地址、备注、吃后感、评分和已品尝状态。\n\n注意事项：\n- 请选择本应用导出的 JSON 文件。\n- 导入前如果当前手机也有数据，建议先导出备份。\n- 备份文件没有加密，不要发给无关的人。\n\n已了解并继续导入吗？`,
  );
  if (confirmed) {
    importInput.click();
  }
}

function importRestaurants(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      const nextRestaurants = normalizeImportedRestaurants(imported);
      const confirmed = confirm(`导入会覆盖当前清单，并恢复 ${nextRestaurants.length} 家店。确定继续吗？`);
      if (!confirmed) return;

      restaurants = nextRestaurants;
      activeFilter = "all";
      activeDistrict = "all";
      activeRestaurantId = null;
      recommendation.textContent = "";
      saveRestaurants();
      if (dialog.open) dialog.close();
      render();
      alert("导入成功。");
    } catch {
      alert("导入失败，请选择之前导出的 JSON 文件。");
    }
  });
  reader.readAsText(file, "utf-8");
}

function normalizeImportedRestaurants(imported, options = {}) {
  if (!Array.isArray(imported)) {
    throw new Error("Backup must be an array.");
  }

  return imported.map((item) => {
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const address = typeof item.address === "string" ? item.address.trim() : "";
    const region = typeof item.region === "string" ? item.region.trim() : "";
    const note = typeof item.note === "string" ? item.note : "";
    const review = typeof item.review === "string" ? item.review : "";
    const coordinates = normalizeCoordinates(item.coordinates);
    const rating = Number(item.rating);

    if (!name || !address || (!region && !options.tolerateLegacy)) {
      throw new Error("Restaurant requires name, region, and address.");
    }

    return {
      id: typeof item.id === "string" && item.id ? item.id : createId(),
      name,
      region,
      district: typeof item.district === "string" && item.district ? item.district : getDistrict(region),
      address,
      note,
      tasted: Boolean(item.tasted),
      revisit: Boolean(item.revisit),
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
      review,
      coordinates,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    };
  });
}

function normalizeCoordinates(coordinates) {
  if (!coordinates || typeof coordinates !== "object") return null;
  const lat = Number(coordinates.lat);
  const lng = Number(coordinates.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function getTodayText() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
