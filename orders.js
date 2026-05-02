// orders.js —— 最终修复版：所有按钮正常、无控制台报错
import { replaceParams } from './i18n/utils.js';
import {
  escapeHTML,
  openSidebar,
  closeSidebar,
  debounce,
  sanitizeCSVField,
  generateCSV,
  downloadCSV,
  sortTableRowsByDataset
} from './shared-utils.js';
import { DEFAULT_ORDERS } from './data-service.js';

// 翻译函数
function translate(key, fallback, params = {}) {
  return window.t ? window.t(key, params) : fallback;
}

// ========== 全局工具函数（必须暴露给 HTML onclick） ==========
window.escapeCSVValue = sanitizeCSVField;

window.getCurrentLang = function() {
  return window.getCurrentLanguage ? window.getCurrentLanguage() : localStorage.getItem('bizTrackLanguage') || 'en';
};

window.translateOrderStatusForExport = function(status) {
  const currentLanguage = window.getCurrentLang();
  const statuses = {
    zh: { "Pending": "待处理", "Processing": "处理中", "Shipped": "已发货", "Delivered": "已送达" }
  };
  return statuses[currentLanguage]?.[status] || status;
};

window.debounce = debounce;

// ========== 侧边栏 / 表单 ==========
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

window.openForm = function() {
  const form = document.getElementById("order-form");
  form.style.display = form.style.display === "block" ? "none" : "block";
};

window.closeForm = function() {
  document.getElementById("order-form").style.display = "none";
};

// ========== 数据 ==========
let orders = [];

window.syncOrdersToDb = async function(action, record, beforeRecord) {
  if (!window.biztrackDbHelpers?.isReady()) return;
  try {
    await window.biztrackDbHelpers.syncCollection("orders", orders, "orderID");
    const isBulkPageSync = action === "sync" && record && String(record.orderID) === "all-orders";
    if (action && !isBulkPageSync) {
      await window.biztrackDbHelpers.logActivity("orders", action, record.orderID, record, beforeRecord);
    }
  } catch (e) {
    console.error("Orders sync failed:", e);
  }
};

// ========== 日期选择器（全局，语言切换可用） ==========
window.createOrderDatePicker = function() {
  const currentLang = window.getCurrentLang();
  const datePickerConfig = window.datePickerI18n?.[currentLang];
  const orderDateInput = document.getElementById('order-date');
  if (!orderDateInput) return;

  orderDateInput.placeholder = window.t?.('orders.orderDatePlaceholder') || 'YYYY-MM-DD';

  const createCustomButtons = (instance) => {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;justify-content:space-between;padding:10px;';

    const today = document.createElement('button');
    today.textContent = datePickerConfig?.today || window.t?.('common.today') || 'Today';
    today.style.cssText = 'background:#4a90e2;color:white;border:none;padding:5px 10px;border-radius:3px;cursor:pointer;';
    today.onclick = () => instance.setDate(new Date());

    const clear = document.createElement('button');
    clear.textContent = datePickerConfig?.clear || window.t?.('common.clear') || 'Clear';
    clear.style.cssText = 'background:#e74c3c;color:white;border:none;padding:5px 10px;border-radius:3px;cursor:pointer;';
    clear.onclick = () => instance.clear();

    container.append(today, clear);
    return container;
  };

  if (orderDateInput._flatpickr) orderDateInput._flatpickr.destroy();

  flatpickr(orderDateInput, {
    dateFormat: 'Y-m-d',
    locale: (currentLang === 'zh' || currentLang === 'zhTW') ? 'zh' : 'default',
    allowInput: true,
    onReady: (_, __, instance) => {
      instance.calendarContainer.appendChild(createCustomButtons(instance));
    }
  });
};

// ========== 核心业务函数（全部挂载 window，给 onclick 用） ==========
window.addOrUpdate = function(event) {
  event.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.dataset.isEdit ? window.updateOrder() : window.newOrder(event);
};

window.newOrder = function(event) {
  event.preventDefault();
  const orderID = document.getElementById("order-id").value.trim();
  const orderDate = document.getElementById("order-date").value.trim();
  const itemName = document.getElementById("item-name").value.trim();
  const itemPriceRaw = document.getElementById("item-price").value.trim();
  const qtyBoughtRaw = document.getElementById("qty-bought").value.trim();
  const shippingRaw = document.getElementById("shipping").value.trim();
  const taxesRaw = document.getElementById("taxes").value.trim();
  const itemPrice = parseFloat(itemPriceRaw);
  const qtyBought = parseInt(qtyBoughtRaw);
  const shipping = parseFloat(shippingRaw);
  const taxes = parseFloat(taxesRaw);
  const orderStatus = document.getElementById("order-status").value.trim();
  const orderTotal = (itemPrice * qtyBought) + (shippingRaw !== "" ? shipping : 0) + (taxesRaw !== "" ? taxes : 0);
  const itemPriceLabel = (translate('history.fieldItemPrice', 'Item Price')).replace(/[:：]\s*$/, '');
  const qtyBoughtLabel = (translate('history.fieldQtyBought', 'Qty Bought')).replace(/[:：]\s*$/, '');
  const shippingLabel = (translate('history.fieldShipping', 'Shipping')).replace(/[:：]\s*$/, '');
  const taxesLabel = (translate('history.fieldTaxes', 'Taxes')).replace(/[:：]\s*$/, '');

  if (!orderID || !orderDate || !itemName || !orderStatus) {
    alert(translate("common.fillAllFields", "Please fill in all required fields."));
    return;
  }
  if (itemPriceRaw === "" || isNaN(itemPrice)) {
    alert(translate("common.invalidNumber", `「${itemPriceLabel}」should contain a number.`, { field: itemPriceLabel }));
    return;
  }
  if (qtyBoughtRaw === "" || isNaN(qtyBought)) {
    alert(translate("common.invalidNumber", `「${qtyBoughtLabel}」should contain a number.`, { field: qtyBoughtLabel }));
    return;
  }
  if (shippingRaw === "") {
    alert(translate("common.invalidNumber", `「${shippingLabel}」should contain a number.`, { field: shippingLabel }));
    return;
  }
  if (isNaN(shipping)) {
    alert(translate("common.invalidNumber", `「${shippingLabel}」should contain a number.`, { field: shippingLabel }));
    return;
  }
  if (taxesRaw === "") {
    alert(translate("common.invalidNumber", `「${taxesLabel}」should contain a number.`, { field: taxesLabel }));
    return;
  }
  if (isNaN(taxes)) {
    alert(translate("common.invalidNumber", `「${taxesLabel}」should contain a number.`, { field: taxesLabel }));
    return;
  }
  if (itemPrice < 0) {
    alert(translate("common.invalidPositive", `「${itemPriceLabel}」must be 0 or greater.`, { field: itemPriceLabel }));
    return;
  }
  if (qtyBought < 0) {
    alert(translate("common.invalidPositive", `「${qtyBoughtLabel}」must be 0 or greater.`, { field: qtyBoughtLabel }));
    return;
  }
  if (shipping < 0) {
    alert(translate("common.invalidPositive", `「${shippingLabel}」must be 0 or greater.`, { field: shippingLabel }));
    return;
  }
  if (taxes < 0) {
    alert(translate("common.invalidPositive", `「${taxesLabel}」must be 0 or greater.`, { field: taxesLabel }));
    return;
  }
  if (orders.some(o => o.orderID === orderID)) return alert(translate("common.orderIdExists", "ID exists"));

  const order = { orderID, orderDate, itemName, itemPrice, qtyBought, shipping, taxes, orderTotal, orderStatus };
  orders.push(order);
  localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
  window.renderOrders(orders);
  window.syncOrdersToDb("create", order);
  document.getElementById("order-form").reset();
};

window.renderOrders = function(orders) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();
  const statusMap = { Pending:"pending", Processing:"processing", Shipped:"shipped", Delivered:"delivered" };

  orders.forEach(order => {
    const tr = document.createElement("tr");
    tr.className = "order-row";
    tr.dataset.orderID = order.orderID;
    tr.dataset.orderDate = order.orderDate;
    tr.dataset.itemName = order.itemName;
    tr.dataset.itemPrice = order.itemPrice;
    tr.dataset.qtyBought = order.qtyBought;
    tr.dataset.shipping = order.shipping;
    tr.dataset.taxes = order.taxes;
    tr.dataset.orderTotal = order.orderTotal;
    tr.dataset.orderStatus = order.orderStatus;

    const safeName = window.escapeHTML?.(window.translateProductName?.(order.itemName) || order.itemName) || order.itemName;
    const statusText = window.t?.(`orders.${order.orderStatus.toLowerCase()}`) || order.orderStatus;

    tr.innerHTML = `
      <td>${order.orderID}</td>
      <td>${order.orderDate}</td>
      <td>${safeName}</td>
      <td>$${order.itemPrice.toFixed(2)}</td>
      <td>${order.qtyBought}</td>
      <td>$${order.shipping.toFixed(2)}</td>
      <td>$${order.taxes.toFixed(2)}</td>
      <td>$${order.orderTotal.toFixed(2)}</td>
      <td><div class="status ${statusMap[order.orderStatus]}">${statusText}</div></td>
      <td class="action">
        <button onclick="editRow('${order.orderID}')" class="edit-icon fa-solid fa-pen-to-square" title="${window.t?.('common.edit') || 'Edit'}"></button>
        <button onclick="deleteOrder('${order.orderID}')" class="delete-icon fas fa-trash-alt" title="${window.t?.('common.delete') || 'Delete'}"></button>
      </td>
    `;
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
  window.displayRevenue();
};

window.displayRevenue = function() {
  const el = document.getElementById("total-revenue");
  if (!el) return;
  const total = orders.reduce((sum, o) => sum + o.orderTotal, 0);
  const label = window.t?.('orders.totalRevenue') || 'Total Revenue';
  el.innerHTML = `<span>${label}: $${total.toFixed(2)}</span>`;
};

// 关键：暴露给 onclick
window.editRow = function(orderID) {
  const order = orders.find(o => o.orderID === orderID);
  if (!order) return;
  document.getElementById("order-id").value = order.orderID;
  document.getElementById("order-date").value = order.orderDate;
  document.getElementById("item-name").value = order.itemName;
  document.getElementById("item-price").value = order.itemPrice;
  document.getElementById("qty-bought").value = order.qtyBought;
  document.getElementById("shipping").value = order.shipping;
  document.getElementById("taxes").value = order.taxes;
  document.getElementById("order-status").value = order.orderStatus;
  document.getElementById("submitBtn").dataset.isEdit = "true";
  document.getElementById("order-form").style.display = "block";
};

// 关键：暴露给 onclick
window.deleteOrder = function(orderID) {
  const idx = orders.findIndex(o => o.orderID === orderID);
  if (idx === -1) return;
  const deleted = { ...orders[idx] };
  orders.splice(idx, 1);
  localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
  window.renderOrders(orders);
  window.syncOrdersToDb("delete", { orderID }, deleted);
};

window.updateOrder = function() {
  const orderID = document.getElementById("order-id").value.trim();
  const idx = orders.findIndex(o => o.orderID === orderID);
  if (idx === -1) return;

  const orderDate = document.getElementById("order-date").value.trim();
  const itemName = document.getElementById("item-name").value.trim();
  const itemPriceRaw = document.getElementById("item-price").value.trim();
  const qtyBoughtRaw = document.getElementById("qty-bought").value.trim();
  const shippingRaw = document.getElementById("shipping").value.trim();
  const taxesRaw = document.getElementById("taxes").value.trim();
  const itemPrice = parseFloat(itemPriceRaw);
  const qtyBought = parseInt(qtyBoughtRaw);
  const shipping = parseFloat(shippingRaw);
  const taxes = parseFloat(taxesRaw);
  const orderStatus = document.getElementById("order-status").value.trim();
  const orderTotal = (itemPrice * qtyBought) + (shippingRaw !== "" ? shipping : 0) + (taxesRaw !== "" ? taxes : 0);
  const itemPriceLabel = (translate('history.fieldItemPrice', 'Item Price')).replace(/[:：]\s*$/, '');
  const qtyBoughtLabel = (translate('history.fieldQtyBought', 'Qty Bought')).replace(/[:：]\s*$/, '');
  const shippingLabel = (translate('history.fieldShipping', 'Shipping')).replace(/[:：]\s*$/, '');
  const taxesLabel = (translate('history.fieldTaxes', 'Taxes')).replace(/[:：]\s*$/, '');

  if (!orderID || !orderDate || !itemName || !orderStatus) {
    alert(translate("common.fillAllFields", "Please fill in all required fields."));
    return;
  }
  if (itemPriceRaw === "" || isNaN(itemPrice)) {
    alert(translate("common.invalidNumber", `「${itemPriceLabel}」should contain a number.`, { field: itemPriceLabel }));
    return;
  }
  if (qtyBoughtRaw === "" || isNaN(qtyBought)) {
    alert(translate("common.invalidNumber", `「${qtyBoughtLabel}」should contain a number.`, { field: qtyBoughtLabel }));
    return;
  }
  if (shippingRaw === "" || isNaN(shipping)) {
    alert(translate("common.invalidNumber", `「${shippingLabel}」should contain a number.`, { field: shippingLabel }));
    return;
  }
  if (taxesRaw === "" || isNaN(taxes)) {
    alert(translate("common.invalidNumber", `「${taxesLabel}」should contain a number.`, { field: taxesLabel }));
    return;
  }
  if (itemPrice < 0) {
    alert(translate("common.invalidPositive", `「${itemPriceLabel}」must be 0 or greater.`, { field: itemPriceLabel }));
    return;
  }
  if (qtyBought < 0) {
    alert(translate("common.invalidPositive", `「${qtyBoughtLabel}」must be 0 or greater.`, { field: qtyBoughtLabel }));
    return;
  }
  if (shipping < 0) {
    alert(translate("common.invalidPositive", `「${shippingLabel}」must be 0 or greater.`, { field: shippingLabel }));
    return;
  }
  if (taxes < 0) {
    alert(translate("common.invalidPositive", `「${taxesLabel}」must be 0 or greater.`, { field: taxesLabel }));
    return;
  }

  const before = { ...orders[idx] };
  orders[idx] = { orderID, orderDate, itemName, itemPrice, qtyBought, shipping, taxes, orderTotal, orderStatus };
  localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
  window.renderOrders(orders);
  window.syncOrdersToDb("update", orders[idx], before);
  document.getElementById("order-form").reset();
  delete document.getElementById("submitBtn").dataset.isEdit;
};

// 关键：暴露给 onclick
window.sortTable = function(column) {
  const tbody = document.getElementById("tableBody");
  sortTableRowsByDataset(tbody, column, ["itemPrice", "qtyBought", "shipping", "taxes", "orderTotal"]);
};

window.performSearch = function() {
  const kw = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!kw) return window.renderOrders(orders);
  const filtered = orders.filter(o =>
    [o.orderID, o.orderDate, o.itemName, o.orderStatus, o.itemPrice, o.qtyBought].some(v =>
      String(v).toLowerCase().includes(kw)
    )
  );
  window.renderOrders(filtered);
};

// 关键：暴露给按钮
window.exportToCSV = function() {
  const lang = window.getCurrentLang();
  const headers = {
    en: { orderID:"Order ID", orderDate:"Date", itemName:"Product", itemPrice:"Price", qtyBought:"Qty", shipping:"Shipping", taxes:"Taxes", orderTotal:"Total", orderStatus:"Status" },
    zh: { orderID:"订单ID", orderDate:"日期", itemName:"产品", itemPrice:"价格", qtyBought:"数量", shipping:"运费", taxes:"税费", orderTotal:"总额", orderStatus:"状态" }
  };
  const head = headers[lang] || headers.en;
  const data = orders.map(o => ({
    orderID: o.orderID,
    orderDate: o.orderDate,
    itemName: window.translateProductName?.(o.itemName) || o.itemName,
    itemPrice: o.itemPrice.toFixed(2),
    qtyBought: o.qtyBought,
    shipping: o.shipping.toFixed(2),
    taxes: o.taxes.toFixed(2),
    orderTotal: o.orderTotal.toFixed(2),
    orderStatus: window.translateOrderStatusForExport(o.orderStatus)
  }));

  const csv = generateCSV(data, head);
  const filename = lang === 'zh' ? 'biztrack_订单表.csv' : 'biztrack_orders.csv';
  downloadCSV(csv, filename);
};

// ========== 初始化（修复时序，无重复） ==========
document.addEventListener('DOMContentLoaded', function() {
  window.createOrderDatePicker();

  const stored = localStorage.getItem("bizTrackOrders");
  if (stored) {
    orders = JSON.parse(stored);
  } else {
    orders = DEFAULT_ORDERS.map(order => ({ ...order }));
    localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
  }

  window.renderOrders(orders);
  window.syncOrdersToDb("sync", { orderID:"all-orders" });
  window.handleQuickAddOpen?.();
  window.addGuideButton?.('orders');

  // 搜索绑定
  const search = document.getElementById("searchInput");
  if (search) search.addEventListener("input", window.debounce(window.performSearch, 250));
});

window.addEventListener('languageChanged', () => {
  window.createOrderDatePicker();
  window.renderOrders(orders);
});

window.handleQuickAddOpen = function() {
  if (new URLSearchParams(location.search).get("quickAdd") === "1") {
    const form = document.getElementById("order-form");
    if (form) form.style.display = "block";
  }
};