// products.js（纯净版，无重复、无冲突）
import { replaceParams } from './i18n/utils.js';
import {
  escapeHTML,
  openSidebar,
  closeSidebar,
  debounce,
  generateCSV,
  downloadCSV,
  sortTableRowsByDataset
} from './shared-utils.js';
import { DEFAULT_PRODUCTS } from './data-service.js';

// ========== 全局函数（必须挂到 window，给 onclick 用） ==========
window.translateProductDescription = function(description) {
  if (!description) return description;
  const key = `product.desc.${description}`;
  const translated = window.t ? window.t(key) : description;
  return translated === key ? description : translated;
};

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

window.openForm = function() {
  const form = document.getElementById("product-form");
  form.style.display = form.style.display === "block" ? "none" : "block";
};

window.closeForm = function() {
  document.getElementById("product-form").style.display = "none";
};

// ========== 数据 ==========
let products = [];

window.syncProductsToDb = async function(action, record, beforeRecord) {
  if (!window.biztrackDbHelpers?.isReady()) return;
  try {
    await window.biztrackDbHelpers.syncCollection("products", products, "prodID");
    if (action) await window.biztrackDbHelpers.logActivity("products", action, record.prodID, record, beforeRecord);
  } catch (e) {
    console.error("syncProductsToDb", e);
  }
};

const productCategoryMap = Object.fromEntries(
  DEFAULT_PRODUCTS.map((product) => [product.prodName, product.prodCat])
);
const productCategoryTranslationKey = {
  'Hats': 'products.hats',
  'Drinkware': 'products.drinkware',
  'Clothing': 'products.clothing',
  'Accessories': 'products.accessories',
  'Home decor': 'products.homeDecor'
};

window.syncCategoryWithSelectedName = function() {
  const prodName = document.getElementById("product-name").value;
  const prodCat = productCategoryMap[prodName];
  if (prodCat) document.getElementById("product-cat").value = prodCat;
};

window.translateProductCategory = function(category) {
  const key = productCategoryTranslationKey[category];
  if (!key) return category;
  const translated = window.t ? window.t(key) : category;
  return translated === key ? category : translated;
};

function isNameCategoryPairValid(prodName, prodCat) {
  return productCategoryMap[prodName] === prodCat;
}

const PRODUCTS_CATALOG_VERSION = "full-16-v1";
function loadProductsFromStorage() {
  const stored = localStorage.getItem("bizTrackProducts");
  const ver = localStorage.getItem("bizTrackProductsCatalogVersion");
  if (!stored || ver !== PRODUCTS_CATALOG_VERSION) {
    products = DEFAULT_PRODUCTS.map(x => ({...x}));
    localStorage.setItem("bizTrackProducts", JSON.stringify(products));
    localStorage.setItem("bizTrackProductsCatalogVersion", PRODUCTS_CATALOG_VERSION);
    return;
  }
  products = JSON.parse(stored);
}

// ========== 渲染 & 按钮逻辑（全部挂 window） ==========
window.renderProducts = function(products) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  products.forEach(p => {
    const tr = document.createElement("tr");
    tr.className = "product-row";
    tr.dataset.prodID = p.prodID;
    tr.dataset.prodName = p.prodName;
    tr.dataset.prodDesc = p.prodDesc;
    tr.dataset.prodCat = p.prodCat;
    tr.dataset.prodPrice = p.prodPrice;
    tr.dataset.prodSold = p.prodSold;
    tr.innerHTML = `
      <td>${escapeHTML(p.prodID)}</td>
      <td>${escapeHTML(window.translateProductName ? window.translateProductName(p.prodName) : p.prodName)}</td>
      <td>${escapeHTML(window.translateProductDescription ? window.translateProductDescription(p.prodDesc) : p.prodDesc)}</td>
      <td>${escapeHTML(window.translateProductCategory ? window.translateProductCategory(p.prodCat) : p.prodCat)}</td>
      <td>$${p.prodPrice.toFixed(2)}</td>
      <td>${escapeHTML(String(p.prodSold))}</td>
      <td class="action">
        <button title="${window.t?.('common.edit')||'Edit'}" onclick="editRow('${escapeHTML(p.prodID)}')" class="edit-icon fa-solid fa-pen-to-square"></button>
        <button title="${window.t?.('common.delete')||'Delete'}" onclick="deleteProduct('${escapeHTML(p.prodID)}')" class="delete-icon fas fa-trash-alt"></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.editRow = function(prodID) {
  const p = products.find(x => x.prodID === prodID);
  if (!p) return;
  document.getElementById("product-id").value = p.prodID;
  document.getElementById("product-name").value = p.prodName;
  document.getElementById("product-desc").value = p.prodDesc;
  document.getElementById("product-cat").value = p.prodCat;
  document.getElementById("product-price").value = p.prodPrice;
  document.getElementById("product-sold").value = p.prodSold;
  document.getElementById("submitBtn").dataset.isEdit = "true";
  document.getElementById("product-form").style.display = "block";
  window.syncCategoryWithSelectedName();
};

window.deleteProduct = function(prodID) {
  const idx = products.findIndex(x => x.prodID === prodID);
  if (idx === -1) return;
  const deleted = {...products[idx]};
  products.splice(idx,1);
  localStorage.setItem("bizTrackProducts", JSON.stringify(products));
  window.renderProducts(products);
  window.syncProductsToDb("delete", {prodID}, deleted);
};

window.addOrUpdate = function(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  const isEdit = submitBtn.dataset.isEdit === "true";
  isEdit ? window.updateProduct() : window.newProduct(e);
};

window.newProduct = function(e) {
  e.preventDefault();
  const prodID = document.getElementById("product-id").value.trim();
  const prodName = document.getElementById("product-name").value.trim();
  const prodDesc = document.getElementById("product-desc").value.trim();
  const prodCat = document.getElementById("product-cat").value.trim();
  const prodPrice = parseFloat(document.getElementById("product-price").value.trim());
  const prodSold = parseInt(document.getElementById("product-sold").value.trim());
  const priceLabel = (window.t?.('products.productPrice') || 'Product Price').replace(/[:：]\s*$/, '');
  const soldLabel = (window.t?.('products.productSold') || 'Stock Quantity').replace(/[:：]\s*$/, '');

  if (!prodID || !prodName || !prodCat || isNaN(prodPrice) || isNaN(prodSold)) {
    alert(window.t?.("common.fillAllFields")||"Please fill in all required fields.");
    return;
  }
  if (isNaN(prodPrice) || isNaN(prodSold)) {
    const invalidField = isNaN(prodPrice) ? priceLabel : soldLabel;
    alert(window.t?.("common.invalidNumber", { field: invalidField }) || `Please enter a valid number for ${invalidField}`);
    return;
  }
  if (prodPrice < 0 || prodSold < 0) {
    const invalidField = prodPrice < 0 ? priceLabel : soldLabel;
    alert(window.t?.("common.invalidPositive", { field: invalidField }) || `Please enter a positive number for ${invalidField}`);
    return;
  }
  if (products.some(x => x.prodID === prodID)) {
    alert(window.t?.("common.productIdExists")||"Product ID exists");
    return;
  }
  if (!isNameCategoryPairValid(prodName, prodCat)) {
    alert(window.t?.("common.categoryMustMatch")||"Category must match name");
    return;
  }

  const p = {prodID, prodName, prodDesc, prodCat, prodPrice, prodSold};
  products.push(p);
  localStorage.setItem("bizTrackProducts", JSON.stringify(products));
  window.renderProducts(products);
  window.syncProductsToDb("create", p);
  document.getElementById("product-form").reset();
};

window.updateProduct = function() {
  const prodID = document.getElementById("product-id").value.trim();
  const idx = products.findIndex(x => x.prodID === prodID);
  if (idx === -1) return;

  const prodName = document.getElementById("product-name").value.trim();
  const prodDesc = document.getElementById("product-desc").value.trim();
  const prodCat = document.getElementById("product-cat").value.trim();
  const prodPrice = parseFloat(document.getElementById("product-price").value.trim());
  const prodSold = parseInt(document.getElementById("product-sold").value.trim());
  const priceLabel = (window.t?.('products.productPrice') || 'Product Price').replace(/[:：]\s*$/, '');
  const soldLabel = (window.t?.('products.productSold') || 'Stock Quantity').replace(/[:：]\s*$/, '');

  if (!prodID || !prodName || !prodCat || isNaN(prodPrice) || isNaN(prodSold)) {
    alert(window.t?.("common.fillAllFields")||"Please fill in all required fields.");
    return;
  }
  if (isNaN(prodPrice) || isNaN(prodSold)) {
    const invalidField = isNaN(prodPrice) ? priceLabel : soldLabel;
    alert(window.t?.("common.invalidNumber", { field: invalidField }) || `Please enter a valid number for ${invalidField}`);
    return;
  }
  if (prodPrice < 0 || prodSold < 0) {
    const invalidField = prodPrice < 0 ? priceLabel : soldLabel;
    alert(window.t?.("common.invalidPositive", { field: invalidField }) || `Please enter a positive number for ${invalidField}`);
    return;
  }
  if (!isNameCategoryPairValid(prodName, prodCat)) {
    alert(window.t?.("common.categoryMustMatch")||"Category must match name");
    return;
  }

  const before = {...products[idx]};
  const updated = {prodID, prodName, prodDesc, prodCat, prodPrice, prodSold};
  products[idx] = updated;
  localStorage.setItem("bizTrackProducts", JSON.stringify(products));
  window.renderProducts(products);
  window.syncProductsToDb("update", updated, before);
  document.getElementById("product-form").reset();
  document.getElementById("submitBtn").dataset.isEdit = "";
};

// ========== 导出CSV ==========


window.exportToCSV = function() {
  const currentLang = window.getCurrentLanguage?.() || 'en';
  const translate = (k, f) => window.t?.(k) || f;
  const headers = {
    prodID: translate('products.exportHeaders.prodID','Product ID'),
    prodName: translate('products.exportHeaders.prodName','Product Name'),
    prodDesc: translate('products.exportHeaders.prodDesc','Description'),
    prodCat: translate('products.exportHeaders.prodCategory','Category'),
    prodPrice: translate('products.exportHeaders.prodPrice','Price'),
    prodSold: translate('products.exportHeaders.QtySold','Stock')
  };
  const data = products.map(p => ({
    prodID: p.prodID,
    prodName: window.translateProductName?.(p.prodName)||p.prodName,
    prodDesc: window.translateProductDescription?.(p.prodDesc)||p.prodDesc,
    prodCat: window.translateProductCategory?.(p.prodCat)||p.prodCat,
    prodPrice: p.prodPrice.toFixed(2),
    prodSold: p.prodSold
  }));
  const csv = generateCSV(data, headers);
  const filename = currentLang === 'zh' || currentLang === 'zhTW'
    ? 'biztrack_产品表.csv'
    : 'biztrack_product_table.csv';

  downloadCSV(csv, filename);
};

// ========== 搜索 & 排序 ==========

window.performSearch = function() {
  const kw = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!kw) return window.renderProducts(products);
  const filtered = products.filter(p =>
    [p.prodID, p.prodName, p.prodDesc, p.prodCat, String(p.prodPrice), String(p.prodSold)]
      .some(x => x.toLowerCase().includes(kw))
  );
  window.renderProducts(filtered);
};

window.sortTable = function(col) {
  const tbody = document.getElementById("tableBody");
  sortTableRowsByDataset(tbody, col, ["prodPrice", "prodSold"]);
};

// ========== 初始化（只执行一次，时序正确） ==========
function init() {
  document.getElementById("product-name")?.addEventListener("change", window.syncCategoryWithSelectedName);
  loadProductsFromStorage();
  window.renderProducts(products);
  window.addEventListener('languageChanged', () => window.renderProducts(products));
  window.syncProductsToDb("sync", {prodID:"all-products"});
  if (typeof window.addGuideButton === 'function') {
    window.addGuideButton('products');
  }
  document.getElementById("searchInput")?.addEventListener("input", debounce(window.performSearch));
}

// 只在 DOM 就绪执行一次
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}