function openSidebar() {
  var side = document.getElementById("sidebar");
  side.style.display = side.style.display === "block" ? "none" : "block";
}

function closeSidebar() {
  document.getElementById("sidebar").style.display = "none";
}

const db = window.biztrackDb;
const logsRef = db ? db.collection("activity_logs") : null;

function formatTimestamp(timestamp, fallback) {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString();
  }
  return fallback || "-";
}

function formatData(data) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return "-";
  }

  const lines = Object.entries(data).map(([key, value]) => {
    const formattedValue = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    return `<div><span class="log-key">${key}</span>: ${formattedValue}</div>`;
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
    const formattedValue = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    return `<div><span class="log-key">${key}</span>: ${formattedValue}</div>`;
  });

  const afterLines = orderedKeys.map((key) => {
    const value = key in afterObj ? afterObj[key] : "-";
    const formattedValue = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    return `<div><span class="log-key">${key}</span>: ${formattedValue}</div>`;
  });

  return {
    beforeHtml: `<div class="log-data">${beforeLines.join("")}</div>`,
    afterHtml: `<div class="log-data">${afterLines.join("")}</div>`,
  };
}

function renderLogs(logs) {
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = "";

  if (!logs.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="6" style="text-align:center;">No records yet</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  logs.forEach((log) => {
    const entityName = log.entityType || log.entity || "-";
    const beforeData = log.beforeData;
    const afterData = log.afterData || log.changedData;
    const comparable = formatComparableData(beforeData, afterData, entityName);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatTimestamp(log.createdAt, log.clientTime || log.changedAt)}</td>
      <td>${entityName}</td>
      <td>${log.entityId || log.recordId || "-"}</td>
      <td>${log.action || "-"}</td>
      <td class="history-cell">${comparable.beforeHtml}</td>
      <td class="history-cell">${comparable.afterHtml}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadHistory() {
  try {
    if (!logsRef) {
      throw new Error("Database is not connected.");
    }

    const snapshot = await logsRef.orderBy("createdAt", "desc").get();
    const logs = snapshot.docs
      .map((doc) => doc.data())
      .filter((log) => {
        const action = (log.action || "").toLowerCase();
        return action === "create" || action === "update" || action === "delete";
      });
    renderLogs(logs);
  } catch (error) {
    console.error("Failed to load activity logs:", error);
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No history logs yet</td></tr>`;
  }
}

window.onload = loadHistory;
