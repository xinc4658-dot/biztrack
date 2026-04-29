function openSidebar() {
  var side = document.getElementById("sidebar");
  side.style.display = side.style.display === "block" ? "none" : "block";
}

function closeSidebar() {
  document.getElementById("sidebar").style.display = "none";
}

const db = window.biztrackDb;
const logsRef = db ? db.collection("activity_logs") : null;

let historyLogsCache = null;

const FIELD_I18N_KEY = {
  prodID: "fieldProdID",
  prodName: "fieldProdName",
  prodDesc: "fieldProdDesc",
  prodCat: "fieldProdCat",
  prodPrice: "fieldProdPrice",
  prodSold: "fieldProdSold",
  orderID: "fieldOrderID",
  orderDate: "fieldOrderDate",
  itemName: "fieldItemName",
  itemPrice: "fieldItemPrice",
  qtyBought: "fieldQtyBought",
  shipping: "fieldShipping",
  taxes: "fieldTaxes",
  orderTotal: "fieldOrderTotal",
  orderStatus: "fieldOrderStatus",
  trID: "fieldTrID",
  trDate: "fieldTrDate",
  trCategory: "fieldTrCategory",
  trAmount: "fieldTrAmount",
  trNotes: "fieldTrNotes",
};

function translateFieldKey(key) {
  const sub = FIELD_I18N_KEY[key];
  if (sub) {
    const msg = window.t("history." + sub);
    const miss = "history." + sub;
    if (msg && msg !== miss) return msg;
  }
  return key;
}

function translateEntityType(entity) {
  const e = (entity || "").toLowerCase();
  if (e === "products") return window.t("history.entityProducts");
  if (e === "orders") return window.t("history.entityOrders");
  if (e === "expenses") return window.t("history.entityExpenses");
  return entity || "-";
}

function translateActionLabel(action) {
  const a = (action || "").toLowerCase();
  const map = {
    create: "actionCreate",
    update: "actionUpdate",
    delete: "actionDelete",
    sync: "actionSync",
  };
  const sub = map[a];
  if (sub) {
    const msg = window.t("history." + sub);
    const miss = "history." + sub;
    if (msg && msg !== miss) return msg;
  }
  return action || "-";
}

function translateOrderStatusValue(status) {
  const map = {
    Pending: "orders.pending",
    Processing: "orders.processing",
    Shipped: "orders.shipped",
    Delivered: "orders.delivered",
  };
  const path = map[status];
  if (path) {
    const tr = window.t(path);
    if (tr !== path) return tr;
  }
  return status;
}

function translateExpenseCategoryValue(cat) {
  const map = {
    Rent: "expenses.rent",
    Utilities: "expenses.utilities",
    Supplies: "expenses.supplies",
    "Order Fulfillment": "expenses.orderFulfillment",
    Miscellaneous: "expenses.miscellaneous",
  };
  const path = map[cat];
  if (path) {
    const tr = window.t(path);
    if (tr !== path) return tr;
  }
  return cat;
}

function translateProductCategoryValue(cat) {
  const catMap = {
    Hats: "products.hats",
    Drinkware: "products.drinkware",
    Clothing: "products.clothing",
    Accessories: "products.accessories",
    "Home decor": "products.homeDecor",
  };
  const path = catMap[cat];
  if (path) {
    const tr = window.t(path);
    if (tr !== path) return tr;
  }
  return cat;
}

function translateCellValue(fieldKey, raw) {
  if (raw === null || raw === undefined) return "-";
  if (raw === "-") return "-";
  const str = typeof raw === "object" && raw !== null ? JSON.stringify(raw) : String(raw);

  if (fieldKey === "itemName" && typeof translateProductName === "function") {
    return translateProductName(str);
  }
  if (fieldKey === "orderStatus") {
    return translateOrderStatusValue(str);
  }
  if (fieldKey === "trCategory") {
    return translateExpenseCategoryValue(str);
  }
  if (fieldKey === "prodCat") {
    return translateProductCategoryValue(str);
  }
  return str;
}

function formatTimestamp(timestamp, fallback) {
  const lang =
    typeof currentLanguage !== "undefined"
      ? currentLanguage
      : localStorage.getItem("bizTrackLanguage") || "en";
  const locale = lang === "zh" ? "zh-CN" : "en-US";

  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString(locale);
  }
  if (fallback) {
    const d = new Date(fallback);
    if (!isNaN(d.getTime())) return d.toLocaleString(locale);
    return String(fallback);
  }
  return "-";
}

function formatData(data) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return "-";
  }

  const lines = Object.entries(data).map(([key, value]) => {
    const formattedValue =
      typeof value === "object" && value !== null ? JSON.stringify(value) : translateCellValue(key, value);
    return `<div><span class="log-key">${translateFieldKey(key)}</span>: ${formattedValue}</div>`;
  });

  return `<div class="log-data">${lines.join("")}</div>`;
}

function getPreferredFieldOrder(entity) {
  const fieldOrders = {
    products: ["prodID", "prodName", "prodDesc", "prodCat", "prodPrice", "prodSold"],
    orders: ["orderID", "orderDate", "itemName", "itemPrice", "qtyBought", "shipping", "taxes", "orderTotal", "orderStatus"],
    expenses: ["trID", "trDate", "trCategory", "trAmount", "trNotes"],
  };

  return fieldOrders[entity] || [];
}

function formatComparableData(beforeData, afterData, entity) {
  const hasBefore = beforeData && typeof beforeData === "object";
  const hasAfter = afterData && typeof afterData === "object";

  if (!hasBefore && !hasAfter) {
    return { beforeHtml: "-", afterHtml: "-" };
  }

  const beforeObj = hasBefore ? beforeData : {};
  const afterObj = hasAfter ? afterData : {};
  const preferredOrder = getPreferredFieldOrder(entity);
  const keySet = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
  const remainingKeys = Array.from(keySet).filter((key) => !preferredOrder.includes(key)).sort();
  const orderedKeys = [...preferredOrder.filter((key) => keySet.has(key)), ...remainingKeys];

  const beforeLines = orderedKeys.map((key) => {
    const value = key in beforeObj ? beforeObj[key] : "-";
    const formattedValue =
      typeof value === "object" && value !== null ? JSON.stringify(value) : translateCellValue(key, value);
    return `<div><span class="log-key">${translateFieldKey(key)}</span>: ${formattedValue}</div>`;
  });

  const afterLines = orderedKeys.map((key) => {
    const value = key in afterObj ? afterObj[key] : "-";
    const formattedValue =
      typeof value === "object" && value !== null ? JSON.stringify(value) : translateCellValue(key, value);
    return `<div><span class="log-key">${translateFieldKey(key)}</span>: ${formattedValue}</div>`;
  });

  return {
    beforeHtml: `<div class="log-data">${beforeLines.join("")}</div>`,
    afterHtml: `<div class="log-data">${afterLines.join("")}</div>`,
  };
}

function renderLogs(logs) {
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = "";

  const emptyMsg = window.t("history.noRecords");
  const emptyText = emptyMsg !== "history.noRecords" ? emptyMsg : "No records yet";

  if (!logs.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="6" style="text-align:center;">${emptyText}</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  logs.forEach((log) => {
    const entityRaw = log.entityType || log.entity || "-";
    const entityName = translateEntityType(entityRaw);
    const beforeData = log.beforeData;
    const afterData = log.afterData || log.changedData;
    const comparable = formatComparableData(beforeData, afterData, entityRaw);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatTimestamp(log.createdAt, log.clientTime || log.changedAt)}</td>
      <td>${entityName}</td>
      <td>${log.entityId || log.recordId || "-"}</td>
      <td>${translateActionLabel(log.action)}</td>
      <td class="history-cell">${comparable.beforeHtml}</td>
      <td class="history-cell">${comparable.afterHtml}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadHistory() {
  const tbody = document.getElementById("historyTableBody");
  const errMsg = window.t("history.dbNotConnected");
  const errText = errMsg !== "history.dbNotConnected" ? errMsg : "Database is not connected.";
  const noHistMsg = window.t("history.noHistoryYet");
  const noHistText = noHistMsg !== "history.noHistoryYet" ? noHistMsg : "No history logs yet";

  try {
    if (!logsRef) {
      throw new Error(errText);
    }

    const snapshot = await logsRef.orderBy("createdAt", "desc").get();
    const logs = snapshot.docs
      .map((doc) => doc.data())
      .filter((log) => {
        const action = (log.action || "").toLowerCase();
        return action === "create" || action === "update" || action === "delete";
      });
    historyLogsCache = logs;
    renderLogs(logs);
  } catch (error) {
    console.error("Failed to load activity logs:", error);
    historyLogsCache = null;
    const cellMsg = !logsRef ? errText : noHistText;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${cellMsg}</td></tr>`;
  }
}

window.refreshHistoryLogs = function () {
  if (historyLogsCache !== null) {
    renderLogs(historyLogsCache);
  } else {
    loadHistory();
  }
};

window.addEventListener("load", function () {
  loadHistory();
});
