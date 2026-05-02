import { openSidebar, closeSidebar, escapeHTML } from './shared-utils.js';
import {
  DEFAULT_EXPENSES,
  DEFAULT_ORDERS,
  DEFAULT_PRODUCTS,
  getDataWithFallback,
  toNumber
} from './data-service.js';
import {
  PRODUCT_CATEGORY_ORDER,
  calculateCategoryUnitsSoldFromOrders,
  calculateCategoryExpenses as calculateCategoryExp,
  calculateDashboardSummary
} from './analytics-service.js';

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

const escapeHtmlForText = escapeHTML;
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

let barChart = null;
let donutChart = null;

window.PRODUCT_CATEGORY_ORDER = PRODUCT_CATEGORY_ORDER;
window.calculateCategoryUnitsSoldFromOrders = calculateCategoryUnitsSoldFromOrders;

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

async function loadDashboardSummary() {
  const expenses = await getDataWithFallback("expenses", "bizTrackTransactions", DEFAULT_EXPENSES);
  const revenues = await getDataWithFallback("orders", "bizTrackOrders", DEFAULT_ORDERS);

  const summary = calculateDashboardSummary(expenses, revenues);
  const totalExpenses = summary.totalExpenses;
  const totalRevenues = summary.totalRevenues;
  const totalBalance = summary.totalBalance;
  const numOrders = summary.numOrders;
  const pendingOrders = summary.statusCounts.Pending;
  const processingOrders = summary.statusCounts.Processing;
  const shippedOrders = summary.statusCounts.Shipped;
  const deliveredOrders = summary.statusCounts.Delivered;

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