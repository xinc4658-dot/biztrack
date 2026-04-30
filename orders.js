
function openSidebar() {
    var side = document.getElementById('sidebar');
    side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
    document.getElementById('sidebar').style.display = 'none';
}


function openForm() {
    var form = document.getElementById("order-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("order-form").style.display = "none";
}

let orders = [];

async function syncOrdersToDb(action, record, beforeRecord) {
    if (!window.biztrackDbHelpers || !window.biztrackDbHelpers.isReady()) {
        return;
    }

    try {
        await window.biztrackDbHelpers.syncCollection("orders", orders, "orderID");
        if (action) {
            await window.biztrackDbHelpers.logActivity("orders", action, record.orderID, record, beforeRecord);
        }
    } catch (error) {
        console.error("Orders database sync failed:", error);
    }
}

window.onload = function () {
    // 等待i18n.js初始化完成
    setTimeout(function() {
        // 初始化日期选择器
        const orderDateInput = document.getElementById('order-date');
        if (orderDateInput) {
            // 设置placeholder
            orderDateInput.placeholder = currentLanguage === 'zh' ? '年-月-日' : 'YYYY-MM-DD';

            // 创建自定义按钮
            const createCustomButtons = (instance) => {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'flatpickr-custom-buttons';
                buttonsContainer.style.cssText = 'display: flex; justify-content: space-between; padding: 10px;';

                // 今天按钮
                const todayButton = document.createElement('button');
                todayButton.type = 'button';
                todayButton.className = 'flatpickr-today-button';
                todayButton.textContent = currentLanguage === 'zh' ? '今天' : 'Today';
                todayButton.style.cssText = 'background: #4a90e2; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;';
                todayButton.onclick = () => {
                    instance.setDate(new Date());
                };

                // 清除按钮
                const clearButton = document.createElement('button');
                clearButton.type = 'button';
                clearButton.className = 'flatpickr-clear-button';
                clearButton.textContent = currentLanguage === 'zh' ? '清除' : 'Clear';
                clearButton.style.cssText = 'background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;';
                clearButton.onclick = () => {
                    instance.clear();
                };

                buttonsContainer.appendChild(todayButton);
                buttonsContainer.appendChild(clearButton);

                return buttonsContainer;
            };

            flatpickr(orderDateInput, {
                dateFormat: 'Y-m-d',
                locale: currentLanguage === 'zh' ? 'zh' : 'default',
                allowInput: true,
                onReady: function(selectedDates, dateStr, instance) {
                    const calendarContainer = instance.calendarContainer;
                    const buttonsContainer = createCustomButtons(instance);
                    calendarContainer.appendChild(buttonsContainer);
                },
                onChange: function(selectedDates, dateStr, instance) {
                    // 更新按钮文本
                    const todayButton = instance.calendarContainer.querySelector('.flatpickr-today-button');
                    const clearButton = instance.calendarContainer.querySelector('.flatpickr-clear-button');
                    if (todayButton) {
                        todayButton.textContent = currentLanguage === 'zh' ? '今天' : 'Today';
                    }
                    if (clearButton) {
                        clearButton.textContent = currentLanguage === 'zh' ? '清除' : 'Clear';
                    }
                }
            });
        }

        const storedOrders = localStorage.getItem("bizTrackOrders");
        if (storedOrders) {
            orders = JSON.parse(storedOrders);
        } else {
            orders = [
            {
                orderID: "1001",
                orderDate: "2024-01-05",
                itemName: "Baseball caps",
                itemPrice: 25.00,
                qtyBought: 2,
                shipping: 2.50,
                taxes: 9.00,
                orderTotal: 61.50,
                orderStatus: "Pending"
            },
            {
                orderID: "1002",
                orderDate: "2024-03-05",
                itemName: "Water bottles",
                itemPrice: 17.00,
                qtyBought: 3,
                shipping: 3.50,
                taxes: 6.00,
                orderTotal: 60.50,
                orderStatus: "Processing"
            },
            {
                orderID: "1003",
                orderDate: "2024-02-05",
                itemName: "Tote bags",
                itemPrice: 20.00,
                qtyBought: 4,
                shipping: 2.50,
                taxes: 2.00,
                orderTotal: 84.50,
                orderStatus: "Shipped"
            },
            {
                orderID: "1004",
                orderDate: "2023-01-05",
                itemName: "Canvas prints",
                itemPrice: 55.00,
                qtyBought: 1,
                shipping: 2.50,
                taxes: 19.00,
                orderTotal: 76.50,
                orderStatus: "Delivered"
            },
            {
                orderID: "1005",
                orderDate: "2024-01-15",
                itemName: "Beanies",
                itemPrice: 15.00,
                qtyBought: 2,
                shipping: 3.90,
                taxes: 4.00,
                orderTotal: 37.90,
                orderStatus: "Pending"
            },
            ];

            localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
        }

        renderOrders(orders);
        syncOrdersToDb("sync", { orderID: "all-orders" });
        handleQuickAddOpen();
    }, 100);
}

function handleQuickAddOpen() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quickAdd") !== "1") return;

    const form = document.getElementById("order-form");
    if (!form) return;

    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addOrUpdate(event) {
    event.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const i18nKey = submitBtn.getAttribute('data-i18n');
    if (i18nKey === 'orders.save' && !submitBtn.dataset.isEdit) {
        newOrder(event);
    } else {
        const orderID = document.getElementById("order-id").value;
        updateOrder(orderID);
    }
}


function newOrder(event) {
  event.preventDefault();
  const orderID = document.getElementById("order-id").value;
  const orderDate = document.getElementById("order-date").value;
  const itemName = document.getElementById("item-name").value;
  const itemPrice = parseFloat(document.getElementById("item-price").value);
  const qtyBought = parseInt(document.getElementById("qty-bought").value);
  const shipping = parseFloat(document.getElementById("shipping").value);
  const taxes = parseFloat(document.getElementById("taxes").value);
  const orderTotal = ((itemPrice * qtyBought) + shipping + taxes);
  const orderStatus = document.getElementById("order-status").value;

  if (isDuplicateID(orderID, null)) {
    alert(window.t("common.orderIdExists"));
    return;
  }

  const order = {
    orderID,
    orderDate,
    itemName,
    itemPrice,
    qtyBought,
    shipping,
    taxes,
    orderTotal,
    orderStatus,
  };

  orders.push(order);

  renderOrders(orders);
  localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
  syncOrdersToDb("create", order);

  document.getElementById("order-form").reset();
}



// 翻译订单状态
function translateOrderStatus(status) {
  if (!status) return status;

  // 获取当前语言，优先使用i18n.js中的currentLanguage变量
  let currentLang = 'en';
  if (typeof currentLanguage !== 'undefined') {
    currentLang = currentLanguage;
  } else {
    currentLang = localStorage.getItem('bizTrackLanguage') || 'en';
  }

  // 订单状态翻译映射
  const translations = {
    en: {
      'Pending': 'Pending',
      'Processing': 'Processing',
      'Shipped': 'Shipped',
      'Delivered': 'Delivered'
    },
    zh: {
      'Pending': '待处理',
      'Processing': '处理中',
      'Shipped': '已发货',
      'Delivered': '已送达'
    }
  };

  return translations[currentLang][status] || status;
}

function renderOrders(orders) {
    const orderTableBody = document.getElementById("tableBody");
    orderTableBody.innerHTML = "";

    const orderToRender = orders;
    const statusMap = {
        "Pending": "pending",
        "Processing": "processing",
        "Shipped": "shipped",
        "Delivered": "delivered"
    }

    orderToRender.forEach(order => {
      const orderRow = document.createElement("tr");
      orderRow.className = "order-row";

      orderRow.dataset.orderID = order.orderID;
      orderRow.dataset.orderDate = order.orderDate;
      orderRow.dataset.itemName = order.itemName;
      orderRow.dataset.itemPrice = order.itemPrice;
      orderRow.dataset.qtyBought = order.qtyBought;
      orderRow.dataset.shipping = order.shipping;
      orderRow.dataset.taxes = order.taxes;
      orderRow.dataset.orderTotal = order.orderTotal;
      orderRow.dataset.orderStatus = order.orderStatus;

      const formattedPrice = typeof order.itemPrice === 'number' ? `$${order.itemPrice.toFixed(2)}` : '';
      const formattedShipping = typeof order.shipping === 'number' ? `$${order.shipping.toFixed(2)}` : '';
      const formattedTaxes = typeof order.taxes === 'number' ? `$${order.taxes.toFixed(2)}` : '';
      const formattedTotal = typeof order.orderTotal === 'number' ? `$${order.orderTotal.toFixed(2)}` : '';

      // 翻译产品名称和订单状态 - 使用i18n.js中的函数
      const translatedName = typeof translateProductName === 'function' ? translateProductName(order.itemName) : order.itemName;
      const translatedStatus = translateOrderStatus(order.orderStatus);

      // 【新增】对 itemName 进行转义
      const safeName = window.escapeHTML(translatedName);

      orderRow.innerHTML = `
        <td>${order.orderID}</td>
        <td>${order.orderDate}</td>
        <td>${safeName}</td>
        <td>${formattedPrice}</td>
        <td>${order.qtyBought}</td>
        <td>${formattedShipping}</td>
        <td>${formattedTaxes}</td>
        <td class="order-total">${formattedTotal}</td>
        <td>
            <div class="status ${statusMap[order.orderStatus]}"><span>${translatedStatus}</span></div>
        </td>
        <td class="action">
            <button title="Edit" onclick="editRow('${order.orderID}')" class="edit-icon fa-solid fa-pen-to-square" aria-label="Edit order"></button>
            <button onclick="deleteOrder('${order.orderID}')" class="delete-icon fas fa-trash-alt" aria-label="Delete order"></button>
          </td> 
      `;
      orderTableBody.appendChild(orderRow);
  });
  displayRevenue();
}

function displayRevenue() {
    const resultElement = document.getElementById("total-revenue");

    const totalRevenue = orders
        .reduce((total, order) => total + order.orderTotal, 0);

    // 获取当前语言，优先使用i18n.js中的currentLanguage变量
    let currentLang = 'en';
    if (typeof currentLanguage !== 'undefined') {
      currentLang = currentLanguage;
    } else {
      currentLang = localStorage.getItem('bizTrackLanguage') || 'en';
    }

    // 翻译"总收入"文本
    const totalRevenueText = currentLang === 'zh' ? '总收入' : 'Total Revenue';

    resultElement.innerHTML = `
        <span>${totalRevenueText}: $${totalRevenue.toFixed(2)}</span>
    `;
}

function editRow(orderID) {
    const orderToEdit = orders.find(order => order.orderID === orderID);

    document.getElementById("order-id").value = orderToEdit.orderID;
    document.getElementById("order-date").value = orderToEdit.orderDate;
    document.getElementById("item-name").value = orderToEdit.itemName;
    document.getElementById("item-price").value = orderToEdit.itemPrice;
    document.getElementById("qty-bought").value = orderToEdit.qtyBought;
    document.getElementById("shipping").value = orderToEdit.shipping;
    document.getElementById("taxes").value = orderToEdit.taxes;
    document.getElementById("order-total").value = orderToEdit.orderTotal;
    document.getElementById("order-status").value = orderToEdit.orderStatus;

    document.getElementById("submitBtn").dataset.isEdit = true;

    document.getElementById("order-form").style.display = "block";
}

function deleteOrder(orderID) {
  const indexToDelete = orders.findIndex(order => order.orderID === orderID);

  if (indexToDelete !== -1) {
      const deletedOrder = { ...orders[indexToDelete] };
      orders.splice(indexToDelete, 1);

      localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

      renderOrders(orders);
      syncOrdersToDb("delete", { orderID }, deletedOrder);
  }
}

function updateOrder(orderID) {
    const indexToUpdate = orders.findIndex(order => order.orderID === orderID);

    if (indexToUpdate !== -1) {
        const beforeOrder = { ...orders[indexToUpdate] };
        const itemPrice = parseFloat(document.getElementById("item-price").value);
        const qtyBought = parseInt(document.getElementById("qty-bought").value);
        const shipping = parseFloat(document.getElementById("shipping").value);
        const taxes = parseFloat(document.getElementById("taxes").value);
        const updatedOrder = {
            orderID: document.getElementById("order-id").value,
            orderDate: document.getElementById("order-date").value,
            itemName: document.getElementById("item-name").value,
            itemPrice: itemPrice,
            qtyBought: qtyBought,
            shipping: shipping,
            taxes: taxes,
            orderTotal: ((itemPrice * qtyBought) + shipping + taxes),
            orderStatus: document.getElementById("order-status").value,
        };

        if (isDuplicateID(updatedOrder.orderID, orderID)) {
            alert(window.t("common.orderIdExists"));
            return;
        }

        orders[indexToUpdate] = updatedOrder;

        localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

        renderOrders(orders);
        syncOrdersToDb("update", updatedOrder, beforeOrder);

        document.getElementById("order-form").reset();
        document.getElementById("submitBtn").dataset.isEdit = false;
    }
}

function isDuplicateID(orderID, currentID) {
    return orders.some(order => order.orderID === orderID && order.orderID !== currentID);
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "itemPrice" || column === "qtyBought" || column === "shipping"|| column === "taxes"|| column === "orderTotal";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
            // Case-insensitive string comparison for text columns
            return aValue.localeCompare(bValue, undefined, { sensitivity: "base" });
        } else {
            return aValue - bValue;
        }
    });

    rows.forEach(row => tbody.removeChild(row));

    sortedRows.forEach(row => tbody.appendChild(row));
}

document.getElementById("searchInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        performSearch();
    }
});


function performSearch() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll(".order-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


function exportToCSV() {
    const ordersToExport = orders.map(order => {
        return {
            orderID: order.orderID,
            orderDate: order.orderDate,
            itemName: order.itemName,
            itemPrice: order.itemPrice.toFixed(2),
            qtyBought: order.qtyBought,
            shipping: order.shipping.toFixed(2),
            taxes: order.taxes.toFixed(2),
            orderTotal: order.orderTotal.toFixed(2),
            orderStatus: order.orderStatus,
        };
    });
  
    const currentLanguage = localStorage.getItem('bizTrackLanguage') || 'en';

    // 根据当前语言获取表头翻译
    const headerTranslations = {
        en: {
            orderID: 'Order ID',
            orderDate: 'Order Date',
            itemName: 'Product Name',
            itemPrice: 'Product Price',
            qtyBought: 'Quantity Bought',
            shipping: 'Shipping',
            taxes: 'Taxes',
            orderTotal: 'Order Total',
            orderStatus: 'Order Status'
        },
        zh: {
            orderID: '订单ID',
            orderDate: '订单日期',
            itemName: '产品名称',
            itemPrice: '产品价格',
            qtyBought: '购买数量',
            shipping: '运费',
            taxes: '税费',
            orderTotal: '订单总额',
            orderStatus: '订单状态'
        }
    };

    const headers = headerTranslations[currentLanguage];

    const csvContent = generateCSV(ordersToExport, headers);
  
    // 添加BOM以确保Excel能正确识别UTF-8编码
    // 使用TextEncoder处理编码问题
    const encoder = new TextEncoder();
    const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const csvBytes = encoder.encode(csvContent);
    const csvWithBOM = new Uint8Array(BOM.length + csvBytes.length);
    csvWithBOM.set(BOM, 0);
    csvWithBOM.set(csvBytes, BOM.length);
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
  
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = currentLanguage === 'zh' ? 'biztrack_订单表.csv' : 'biztrack_order_table.csv';
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
  
function generateCSV(data, headers) {
    const headerRow = Object.keys(headers).map(key => headers[key]).join(',');
    const rows = data.map(order => Object.values(order).join(','));

    return `${headerRow}\n${rows.join('\n')}`;
}
