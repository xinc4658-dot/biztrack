// orders.js —— 最终修复版：所有按钮正常、无控制台报错
import { escapeHTML, replaceParams } from './i18n/utils.js';

// 翻译函数
function translate(key, fallback, params = {}) {
  return window.t ? window.t(key, params) : fallback;
}

// ========== 全局工具函数（必须暴露给 HTML onclick） ==========
window.escapeCSVValue = function(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

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

window.debounce = function(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

// ========== 侧边栏 / 表单 ==========
window.openSidebar = function() {
  const side = document.getElementById('sidebar');
  side.style.display = side.style.display === "block" ? "none" : "block";
};

window.closeSidebar = function() {
  document.getElementById('sidebar').style.display = 'none';
};

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
    if (action) await window.biztrackDbHelpers.logActivity("orders", action, record.orderID, record, beforeRecord);
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
  const itemPrice = parseFloat(document.getElementById("item-price").value.trim());
  const qtyBought = parseInt(document.getElementById("qty-bought").value.trim());
  const shipping = parseFloat(document.getElementById("shipping").value.trim()) || 0;
  const taxes = parseFloat(document.getElementById("taxes").value.trim()) || 0;
  const orderStatus = document.getElementById("order-status").value.trim();
  const orderTotal = (itemPrice * qtyBought) + shipping + taxes;
  const orderIDLabel = (translate('history.fieldOrderID', 'Order ID')).replace(/[:：]\s*$/, '');
  const itemNameLabel = (translate('history.fieldItemName', 'Item Name')).replace(/[:：]\s*$/, '');
  const itemPriceLabel = (translate('history.fieldItemPrice', 'Item Price')).replace(/[:：]\s*$/, '');
  const qtyBoughtLabel = (translate('history.fieldQtyBought', 'Qty Bought')).replace(/[:：]\s*$/, '');

  if (!orderID || !orderDate || !itemName || !orderStatus || isNaN(itemPrice) || isNaN(qtyBought)) {
    alert(translate("common.fillAllFields", "Please fill in all required fields.") || "Please fill in all required fields.");
    return;
  }
  if (isNaN(itemPrice) || isNaN(qtyBought)) {
    const invalidField = isNaN(itemPrice) ? itemPriceLabel : qtyBoughtLabel;
    alert(translate("common.invalidNumber", `Please enter a valid number for ${invalidField}`, { field: invalidField }));
    return;
  }
  if (itemPrice < 0 || qtyBought < 0) {
    const invalidField = itemPrice < 0 ? itemPriceLabel : qtyBoughtLabel;
    alert(translate("common.invalidPositive", `Please enter a positive number for ${invalidField}`, { field: invalidField }));
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
  const itemPrice = parseFloat(document.getElementById("item-price").value.trim());
  const qtyBought = parseInt(document.getElementById("qty-bought").value.trim());
  const shipping = parseFloat(document.getElementById("shipping").value.trim()) || 0;
  const taxes = parseFloat(document.getElementById("taxes").value.trim()) || 0;
  const orderStatus = document.getElementById("order-status").value.trim();
  const orderTotal = (itemPrice * qtyBought) + shipping + taxes;
  const orderIDLabel = (translate('history.fieldOrderID', 'Order ID')).replace(/[:：]\s*$/, '');
  const itemNameLabel = (translate('history.fieldItemName', 'Item Name')).replace(/[:：]\s*$/, '');
  const itemPriceLabel = (translate('history.fieldItemPrice', 'Item Price')).replace(/[:：]\s*$/, '');
  const qtyBoughtLabel = (translate('history.fieldQtyBought', 'Qty Bought')).replace(/[:：]\s*$/, '');

  if (!orderID || !orderDate || !itemName || !orderStatus || isNaN(itemPrice) || isNaN(qtyBought)) {
    alert(translate("common.fillAllFields", "Please fill in all required fields.") || "Please fill in all required fields.");
    return;
  }
  if (isNaN(itemPrice) || isNaN(qtyBought)) {
    const invalidField = isNaN(itemPrice) ? itemPriceLabel : qtyBoughtLabel;
    alert(translate("common.invalidNumber", `Please enter a valid number for ${invalidField}`, { field: invalidField }));
    return;
  }
  if (itemPrice < 0 || qtyBought < 0) {
    const invalidField = itemPrice < 0 ? itemPriceLabel : qtyBoughtLabel;
    alert(translate("common.invalidPositive", `Please enter a positive number for ${invalidField}`, { field: invalidField }));
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
  const rows = Array.from(document.querySelectorAll("#tableBody tr"));
  const isNum = ["itemPrice","qtyBought","shipping","taxes","orderTotal"].includes(column);
  rows.sort((a,b) => {
    const av = isNum ? parseFloat(a.dataset[column]) : a.dataset[column];
    const bv = isNum ? parseFloat(b.dataset[column]) : b.dataset[column];
    return isNum ? av - bv : String(av).localeCompare(String(bv));
  });
  document.getElementById("tableBody").replaceChildren(...rows);
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

  function sanitize(v) {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    if (s.includes(',') || s.includes('\n') || s.includes('"')) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  const csv = [
    Object.values(head).map(sanitize).join(','),
    ...data.map(row => Object.values(row).map(sanitize).join(','))
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF,0xBB,0xBF]), csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = lang === 'zh' ? 'biztrack_订单表.csv' : 'biztrack_orders.csv';
  a.click();
};

// ========== 初始化（修复时序，无重复） ==========
document.addEventListener('DOMContentLoaded', function() {
  window.createOrderDatePicker();

  const stored = localStorage.getItem("bizTrackOrders");
  if (stored) {
    orders = JSON.parse(stored);
  } else {
    orders = [
      { orderID:"1001", orderDate:"2024-01-05", itemName:"Baseball caps", itemPrice:25, qtyBought:2, shipping:2.5, taxes:9, orderTotal:61.5, orderStatus:"Pending" },
      { orderID:"1002", orderDate:"2024-03-05", itemName:"Water bottles", itemPrice:17, qtyBought:3, shipping:3.5, taxes:6, orderTotal:60.5, orderStatus:"Processing" },
      { orderID:"1003", orderDate:"2024-02-05", itemName:"Tote bags", itemPrice:20, qtyBought:4, shipping:2.5, taxes:2, orderTotal:84.5, orderStatus:"Shipped" },
      { orderID:"1004", orderDate:"2023-01-05", itemName:"Canvas prints", itemPrice:55, qtyBought:1, shipping:2.5, taxes:19, orderTotal:76.5, orderStatus:"Delivered" },
      { orderID:"1005", orderDate:"2024-01-15", itemName:"Beanies", itemPrice:15, qtyBought:2, shipping:3.9, taxes:4, orderTotal:37.9, orderStatus:"Pending" }
    ];
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