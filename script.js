// Script.js

function openSidebar() {
  var side = document.getElementById('sidebar');
  side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
  document.getElementById('sidebar').style.display = 'none';
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function escapeHtmlForText(text) {
  if (text == null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLowStockList(products) {
  const listEl = document.getElementById('low-stock-list');
  if (!listEl) return;

  const t = (key) => (typeof window.t === 'function' ? window.t(key) : key);

  if (!products || products.length === 0) {
    listEl.innerHTML = `<li class="low-stock-item low-stock-empty"><span class="low-stock-name">${escapeHtmlForText(t('dashboard.noProductData'))}</span></li>`;
    return;
  }

  const sorted = [...products]
    .map((p) => ({
      name: p.prodName,
      stock: toNumber(p.prodSold),
    }))
    .filter((p) => p.name)
    .sort((a, b) => a.stock - b.stock || String(a.name).localeCompare(String(b.name)))
    .slice(0, 3);

  listEl.innerHTML = sorted
    .map(
      (item) => `
    <li class="low-stock-item">
      <span class="low-stock-name">${escapeHtmlForText(typeof window.translateProductName === 'function' ? window.translateProductName(item.name) : item.name)}</span>
      <span class="low-stock-qty" title="${escapeHtmlForText(t('products.productSold'))}">${item.stock}</span>
    </li>`
    )
    .join('');
}

const DEFAULT_EXPENSES = [
  {
    trID: 1,
    trDate: "2024-01-05",
    trCategory: "Rent",
    trAmount: 100.00,
    trNotes: "January Rent"
  },
  {
    trID: 2,
    trDate: "2024-01-15",
    trCategory: "Order Fulfillment",
    trAmount: 35.00,
    trNotes: "Order #1005"
  },
  {
    trID: 3,
    trDate: "2024-01-08",
    trCategory: "Utilities",
    trAmount: 120.00,
    trNotes: "Internet"
  },
  {
    trID: 4,
    trDate: "2024-02-05",
    trCategory: "Supplies",
    trAmount: 180.00,
    trNotes: "Embroidery Machine"
  },
  {
    trID: 5,
    trDate: "2024-01-25",
    trCategory: "Miscellaneous",
    trAmount: 20.00,
    trNotes: "Pizza"
  },
];

const DEFAULT_ORDERS = [
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

// 与 products.js 默认目录一致（表单下拉顺序）
const DEFAULT_PRODUCTS = [
  { prodID: "PD001", prodName: "Baseball caps", prodDesc: "Peace embroidered cap", prodCat: "Hats", prodPrice: 25.0, prodSold: 20 },
  { prodID: "PD002", prodName: "Snapbacks", prodDesc: "Classic snapback fit", prodCat: "Hats", prodPrice: 28.0, prodSold: 15 },
  { prodID: "PD003", prodName: "Beanies", prodDesc: "Warm knit beanie", prodCat: "Hats", prodPrice: 18.5, prodSold: 32 },
  { prodID: "PD004", prodName: "Bucket hats", prodDesc: "Summer bucket style", prodCat: "Hats", prodPrice: 22.0, prodSold: 12 },
  { prodID: "PD005", prodName: "Mugs", prodDesc: "Ceramic travel mug", prodCat: "Drinkware", prodPrice: 14.0, prodSold: 45 },
  { prodID: "PD006", prodName: "Water bottles", prodDesc: "Floral lotus printed bottle", prodCat: "Drinkware", prodPrice: 48.5, prodSold: 10 },
  { prodID: "PD007", prodName: "Tumblers", prodDesc: "Insulated tumbler", prodCat: "Drinkware", prodPrice: 32.0, prodSold: 28 },
  { prodID: "PD008", prodName: "T-shirts", prodDesc: "Soft cotton tee", prodCat: "Clothing", prodPrice: 19.99, prodSold: 55 },
  { prodID: "PD009", prodName: "Sweatshirts", prodDesc: "Palestine sweater", prodCat: "Clothing", prodPrice: 17.5, prodSold: 70 },
  { prodID: "PD010", prodName: "Hoodies", prodDesc: "Fleece-lined hoodie", prodCat: "Clothing", prodPrice: 42.0, prodSold: 35 },
  { prodID: "PD011", prodName: "Pillow cases", prodDesc: "Morrocan print pillow case", prodCat: "Accessories", prodPrice: 17.0, prodSold: 40 },
  { prodID: "PD012", prodName: "Tote bags", prodDesc: "Canvas tote", prodCat: "Accessories", prodPrice: 24.0, prodSold: 22 },
  { prodID: "PD013", prodName: "Stickers", prodDesc: "Vinyl sticker pack", prodCat: "Accessories", prodPrice: 6.5, prodSold: 100 },
  { prodID: "PD014", prodName: "Posters", prodDesc: "Vibes printed poster", prodCat: "Home decor", prodPrice: 12.0, prodSold: 60 },
  { prodID: "PD015", prodName: "Framed posters", prodDesc: "Ready-to-hang frame", prodCat: "Home decor", prodPrice: 35.0, prodSold: 18 },
  { prodID: "PD016", prodName: "Canvas prints", prodDesc: "Gallery canvas wrap", prodCat: "Home decor", prodPrice: 55.0, prodSold: 14 },
];

let barChart = null;
let donutChart = null;

function calculateExpTotal(transactions) {
  return transactions.reduce((total, transaction) => total + toNumber(transaction.trAmount), 0);
}

function calculateRevTotal(orders) {
  return orders.reduce((total, order) => total + toNumber(order.orderTotal), 0);
}

const PRODUCT_CATEGORY_ORDER = ["Hats", "Drinkware", "Clothing", "Accessories", "Home decor"];

function findCategoryForItemName(itemName, products) {
  if (!itemName || typeof itemName !== "string") return null;
  const trimmed = itemName.trim();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p || !p.prodName) continue;
    if (p.prodName === trimmed) return p.prodCat;
  }
  const lower = trimmed.toLowerCase();
  for (let j = 0; j < products.length; j++) {
    const q = products[j];
    if (!q || !q.prodName) continue;
    if (q.prodName.trim().toLowerCase() === lower) return q.prodCat;
  }
  return null;
}

function calculateCategoryUnitsSoldFromOrders(orders, products) {
  const totals = {};
  PRODUCT_CATEGORY_ORDER.forEach((c) => {
    totals[c] = 0;
  });
  (orders || []).forEach((order) => {
    const cat = findCategoryForItemName(order.itemName, products);
    if (!cat || totals[cat] === undefined) return;
    totals[cat] += toNumber(order.qtyBought);
  });
  return totals;
}

window.PRODUCT_CATEGORY_ORDER = PRODUCT_CATEGORY_ORDER;
window.calculateCategoryUnitsSoldFromOrders = calculateCategoryUnitsSoldFromOrders;

function calculateCategoryExp(transactions) {
  const categoryExpenses = {};

  transactions.forEach(transaction => {
    const category = transaction.trCategory;

    if (!categoryExpenses[category]) {
      categoryExpenses[category] = 0;
    }

    categoryExpenses[category] += toNumber(transaction.trAmount);
  });

  return categoryExpenses;
}

function updateCardContent() {
  const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : localStorage.getItem('bizTrackLanguage') || 'en';

  const translate = (key, fallback) => (window.t ? window.t(key) : fallback);
  const cardTitles = {
    revenue: translate('dashboard.revenue', 'Revenue'),
    expenses: translate('dashboard.expenses', 'Expenses'),
    balance: translate('dashboard.balance', 'Balance'),
    orders: translate('dashboard.orders', 'Orders'),
  };

  const revDiv = document.getElementById('rev-amount');
  const expDiv = document.getElementById('exp-amount');
  const balDiv = document.getElementById('balance');
  const ordDiv = document.getElementById('num-orders');

  if (revDiv) {
    const titleElement = revDiv.querySelector('.title');
    const amountValueElement = revDiv.querySelector('.amount-value');
    if (titleElement) {
      titleElement.textContent = cardTitles.revenue;
    }
    if (!amountValueElement) {
      return;
    }
  }

  if (expDiv) {
    const titleElement = expDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitles.expenses;
    }
  }

  if (balDiv) {
    const titleElement = balDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitles.balance;
    }
  }

  if (ordDiv) {
    const titleElement = ordDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitles.orders;
    }
  }
}

async function getDataWithFallback(collectionName, localStorageKey, fallbackData) {
  const localData = JSON.parse(localStorage.getItem(localStorageKey) || "null");
  const fallback = localData || fallbackData;

  if (window.biztrackDb) {
    try {
      const snapshot = await window.biztrackDb.collection(collectionName).get();
      const remoteData = snapshot.docs.map((doc) => doc.data());

      if (remoteData.length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(remoteData));
        return remoteData;
      }
    } catch (error) {
      console.error(`Failed to read ${collectionName} from Firestore:`, error);
    }
  }

  return fallback;
}

async function loadDashboardSummary() {
  const expenses = await getDataWithFallback("expenses", "bizTrackTransactions", DEFAULT_EXPENSES);
  const revenues = await getDataWithFallback("orders", "bizTrackOrders", DEFAULT_ORDERS);

  const totalExpenses = calculateExpTotal(expenses);
  const totalRevenues = calculateRevTotal(revenues);
  const totalBalance = totalRevenues - totalExpenses;
  const numOrders = revenues.length;
  const pendingOrders = revenues.filter((order) => order.orderStatus === "Pending").length;
  const processingOrders = revenues.filter((order) => order.orderStatus === "Processing").length;
  const shippedOrders = revenues.filter((order) => order.orderStatus === "Shipped").length;
  const deliveredOrders = revenues.filter((order) => order.orderStatus === "Delivered").length;

  const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : localStorage.getItem('bizTrackLanguage') || 'en';
  const translate = (key, fallback) => (window.t ? window.t(key) : fallback);

  const cardTitleTranslations = {
    revenue: translate('dashboard.revenue', 'Revenue'),
    expenses: translate('dashboard.expenses', 'Expenses'),
    balance: translate('dashboard.balance', 'Balance'),
    orders: translate('dashboard.orders', 'Orders'),
  };

  const revDiv = document.getElementById('rev-amount');
  const expDiv = document.getElementById('exp-amount');
  const balDiv = document.getElementById('balance');
  const ordDiv = document.getElementById('num-orders');

  if (revDiv) revDiv.dataset.lang = currentLang;
  if (expDiv) expDiv.dataset.lang = currentLang;
  if (balDiv) balDiv.dataset.lang = currentLang;
  if (ordDiv) ordDiv.dataset.lang = currentLang;

  if (revDiv) {
    revDiv.innerHTML = `
      <span class="title">${cardTitleTranslations.revenue}</span>
      <span class="amount-value">$${totalRevenues.toFixed(2)}</span>
  `;
  }

  if (expDiv) {
    expDiv.innerHTML = `
    <span class="title">${cardTitleTranslations.expenses}</span>
    <span class="amount-value">$${totalExpenses.toFixed(2)}</span>
  `;
  }

  if (balDiv) {
    balDiv.innerHTML = `
    <span class="title">${cardTitleTranslations.balance}</span>
    <span class="amount-value">$${totalBalance.toFixed(2)}</span>
  `;
  }

  if (ordDiv) {
    ordDiv.innerHTML = `
    <span class="title">${cardTitleTranslations.orders}</span>
    <span class="amount-value">${numOrders}</span>
  `;
  }

  const pendingCountElement = document.getElementById("pending-order-count");
  const processingCountElement = document.getElementById("processing-order-count");
  const shippedCountElement = document.getElementById("shipped-order-count");
  const deliveredCountElement = document.getElementById("delivered-order-count");
  if (pendingCountElement) pendingCountElement.textContent = String(pendingOrders);
  if (processingCountElement) processingCountElement.textContent = String(processingOrders);
  if (shippedCountElement) shippedCountElement.textContent = String(shippedOrders);
  if (deliveredCountElement) deliveredCountElement.textContent = String(deliveredOrders);

  const products = await getDataWithFallback('products', 'bizTrackProducts', DEFAULT_PRODUCTS);
  renderLowStockList(products);
  if (typeof window.addGuideButton === 'function') {
    window.addGuideButton('dashboard');
  }
}

async function initializeChart() {
  const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : localStorage.getItem('bizTrackLanguage') || 'en';
  const translate = (key, fallback) => (window.t ? window.t(key) : fallback);
  const categoryKeyMap = {
    'Home decor': 'homeDecor',
    'Accessories': 'accessories',
    'Apparel': 'apparel',
    'Clothing': 'clothing',
    'Hats': 'hats',
    'Drinkware': 'drinkware',
    'Bags': 'bags',
  };
  const expenseCategoryKeyMap = {
    Rent: 'rent',
    'Order Fulfillment': 'orderFulfillment',
    Utilities: 'utilities',
    Supplies: 'supplies',
    Miscellaneous: 'miscellaneous',
  };

  const chartTranslations = {
    seriesName: translate('dashboard.chart.seriesName', 'Units sold'),
    yAxis: translate('dashboard.chart.yAxis', 'Cumulative units sold'),
  };

  const orders = await getDataWithFallback("orders", "bizTrackOrders", DEFAULT_ORDERS);
  const items = await getDataWithFallback("products", "bizTrackProducts", DEFAULT_PRODUCTS);
  const categoryUnits = calculateCategoryUnitsSoldFromOrders(orders, items);
  const translatedCategories = PRODUCT_CATEGORY_ORDER.map((category) => {
    const key = categoryKeyMap[category] || category.toLowerCase().replace(/\s+/g, '');
    return translate(`products.${key}`, category);
  });
  const data = PRODUCT_CATEGORY_ORDER.map((c) => (categoryUnits[c] != null ? categoryUnits[c] : 0));

  const barChartOptions = {
    series: [{
      name: chartTranslations.seriesName,
      data: data,
    }],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
    },
    theme: {
      palette: 'palette9'
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 3,
        horizontal: false,
        columnWidth: '50%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      position: 'top',
    },
    fill: {
      opacity: 0.7,
    },
    xaxis: {
      categories: translatedCategories,
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: chartTranslations.yAxis,
      },
      axisTicks: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return String(Math.round(Number(val)));
        }
      }
    }
  };

  if (barChart) {
    barChart.destroy();
  }

  const barEl = document.querySelector('#bar-chart');
  if (!barEl) return;

  barChart = new ApexCharts(
    barEl,
    barChartOptions
  );
  barChart.render();
  window.chart = barChart;

  const expCategoryTranslations = {
    en: {
      'Rent': 'Rent',
      'Order Fulfillment': 'Order Fulfillment',
      'Utilities': 'Utilities',
      'Supplies': 'Supplies',
      'Miscellaneous': 'Miscellaneous',
    },
    zh: {
      'Rent': '租金',
      'Order Fulfillment': '订单履行',
      'Utilities': '公用事业',
      'Supplies': '用品',
      'Miscellaneous': '杂项',
    }
  };

  const expItems = await getDataWithFallback("expenses", "bizTrackTransactions", DEFAULT_EXPENSES);
  const categoryExpData = calculateCategoryExp(expItems);

  const translatedExpCategories = Object.keys(categoryExpData).map(category => {
    const key = expenseCategoryKeyMap[category] || category.toLowerCase().replace(/\s+/g, '');
    return translate(`expenses.${key}`, category);
  });

  const donutChartOptions = {
    series: Object.values(categoryExpData),
    labels: translatedExpCategories,
    chart: {
      type: 'donut',
      width: '100%',
      toolbar: {
        show: false,
      },
    },
    theme: {
      palette: 'palette1'
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Loto, sans-serif',
        fontWeight: 'regular',
      },
    },
    plotOptions: {
      pie: {
        customScale: 0.8,
        donut: {
          size: '60%',
        },
        offsetY: 20,
      },
      stroke: {
        colors: undefined
      }
    },
    legend: {
      position: 'left',
      offsetY: 55,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return '$' + val.toFixed(2);
        }
      }
    },
  };

  if (donutChart) {
    donutChart.destroy();
  }

  donutChart = new ApexCharts(
    document.querySelector('#donut-chart'),
    donutChartOptions
  );
  donutChart.render();
  window.donutChart = donutChart;
}

window.onload = function () {
  (async () => {
    // 先初始化 i18n
    if (typeof initI18n === 'function') {
      initI18n();
    } else {
      await new Promise(resolve => {
        const checkInit = setInterval(() => {
          if (typeof initI18n === 'function') {
            clearInterval(checkInit);
            initI18n();
            resolve();
          }
        }, 50);
      });
    }

    // i18n 初始化完成后再加载仪表盘数据
    await loadDashboardSummary();
  })();
};

window.addEventListener('languageChanged', async () => {
  if (typeof loadDashboardSummary === 'function') {
    await loadDashboardSummary();
  }
});

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;