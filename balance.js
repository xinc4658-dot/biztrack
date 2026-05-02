import { openSidebar, closeSidebar } from './shared-utils.js';
import {
  DEFAULT_EXPENSES,
  DEFAULT_ORDERS,
  DEFAULT_PRODUCTS,
  getDataWithFallback
} from './data-service.js';
import {
  PRODUCT_CATEGORY_ORDER,
  aggregateByMonth,
  calculateCategoryUnitsSoldFromOrders,
  calculateCategoryExpenses
} from './analytics-service.js';

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
let trendChart = null;
let marginChart = null;
let salesCategoryChart = null;
let expenseCategoryChart = null;

function localMonthLabel(monthKey, lang) {
  const parts = monthKey.split("-");
  const y = parts[0];
  const m = Number(parts[1]);
  return lang === "zh" ? y + "年" + m + "月" : monthKey;
}

function getLanguage() {
  return window.getCurrentLanguage ? window.getCurrentLanguage() : localStorage.getItem("bizTrackLanguage") || "en";
}

function translate(key, fallback) {
  return window.t ? window.t(key) : fallback;
}

function setPageTexts(lang) {
  const chosen = {
    mainTitle: translate('balance.mainTitle', 'Balance Analytics'),
    trendTitle: translate('balance.trendTitle', 'Monthly Revenue, Expenses & Net Balance'),
    marginTitle: translate('balance.marginTitle', 'Monthly Net Margin (%)'),
    salesCategoryTitle: translate('balance.salesCategoryTitle', 'Units sold by product category'),
    expensesTitle: translate('balance.expensesTitle', 'Expenses'),
    trendFormula: translate('balance.trendFormula', 'Formula:\nNet Balance = Revenue - Expenses'),
    marginFormula: translate('balance.marginFormula', 'Formula:\nNet Margin (%) = ((Revenue - Expenses) / Revenue) x 100\nIf Revenue = 0, Net Margin is set to 0%.'),
  };
  const mainTitle = document.getElementById("balance-main-title");
  const trendTitle = document.getElementById("balance-trend-title");
  const marginTitle = document.getElementById("balance-margin-title");

  if (mainTitle) mainTitle.textContent = chosen.mainTitle;
  if (trendTitle) {
    trendTitle.textContent = chosen.trendTitle;
    trendTitle.setAttribute("data-formula", chosen.trendFormula);
  }
  if (marginTitle) {
    marginTitle.textContent = chosen.marginTitle;
    marginTitle.setAttribute("data-formula", chosen.marginFormula);
  }
  const salesCategoryTitle = document.getElementById("balance-sales-category-title");
  const expensesTitle = document.getElementById("balance-expenses-title");
  if (salesCategoryTitle) salesCategoryTitle.textContent = chosen.salesCategoryTitle;
  if (expensesTitle) expensesTitle.textContent = chosen.expensesTitle;
}

function renderTrendChart(monthlyData, lang) {
  const t = {
    revenue: translate('balance.chart.revenue', 'Revenue'),
    expenses: translate('balance.chart.expenses', 'Expenses'),
    net: translate('balance.chart.net', 'Net Balance'),
    xAxis: translate('balance.chart.xAxis', 'Month'),
    yAxis: translate('balance.chart.yAxis', 'Amount ($)'),
  };
  const categories = monthlyData.map(function (item) {
    return localMonthLabel(item.month, lang);
  });

  const options = {
    series: [
      { name: t.revenue, data: monthlyData.map(function (item) { return item.revenue; }) },
      { name: t.expenses, data: monthlyData.map(function (item) { return item.expenses; }) },
      { name: t.net, data: monthlyData.map(function (item) { return item.net; }) },
    ],
    chart: {
      type: "line",
      height: 350,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 4,
    },
    xaxis: {
      categories: categories,
      title: { text: t.xAxis },
    },
    yaxis: {
      title: { text: t.yAxis },
      labels: {
        formatter: function (val) {
          return "$" + Number(val).toFixed(2);
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "$" + Number(val).toFixed(2);
        },
      },
    },
    colors: ["#249672", "#A37A74", "#247BA0"],
  };

  if (trendChart) {
    trendChart.destroy();
  }
  const trendChartElement = document.querySelector("#balance-trend-chart");
  trendChartElement.innerHTML = "";
  trendChart = new ApexCharts(trendChartElement, options);
  trendChart.render();
}

function renderMarginChart(monthlyData, lang) {
  const t = {
    margin: translate('balance.chart.margin', 'Net Margin %'),
    xAxis: translate('balance.chart.marginXAxis', 'Month'),
    yAxis: translate('balance.chart.marginYAxis', 'Margin (%)'),
  };
  const categories = monthlyData.map(function (item) {
    return localMonthLabel(item.month, lang);
  });
  const marginValues = monthlyData.map(function (item) {
    return item.margin;
  });

  const options = {
    series: [{ name: t.margin, data: marginValues }],
    chart: {
      type: "bar",
      height: 350,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 4,
        colors: {
          ranges: [
            { from: -10000, to: -0.0001, color: "#e49273" },
            { from: 0, to: 10000, color: "#249672" },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Number(val).toFixed(1) + "%";
      },
    },
    xaxis: {
      categories: categories,
      title: { text: t.xAxis },
    },
    yaxis: {
      title: { text: t.yAxis },
      labels: {
        formatter: function (val) {
          return Number(val).toFixed(0) + "%";
        },
      },
    },
    grid: {
      borderColor: "#e0e0e0",
      yaxis: {
        lines: { show: true },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return Number(val).toFixed(2) + "%";
        },
      },
    },
  };

  if (marginChart) {
    marginChart.destroy();
  }
  const marginChartElement = document.querySelector("#balance-margin-chart");
  marginChartElement.innerHTML = "";
  marginChart = new ApexCharts(marginChartElement, options);
  marginChart.render();
}

function renderSalesCategoryChart(orders, products, lang) {
  const categoryKeyMap = {
    'Home decor': 'homeDecor',
    Accessories: 'accessories',
    Apparel: 'apparel',
    Clothing: 'clothing',
    Hats: 'hats',
    Drinkware: 'drinkware',
    Bags: 'bags',
  };

  const chartName = translate('balance.chart.salesSeriesName', 'Units sold');
  const axisTitle = translate('balance.chart.salesAxisTitle', 'Cumulative units sold');

  const raw = calculateCategoryUnitsSoldFromOrders(orders, products);
  const labels = PRODUCT_CATEGORY_ORDER.map(function (key) {
    const transKey = categoryKeyMap[key] || key.toLowerCase().replace(/\s+/g, '');
    return translate(`products.${transKey}`, key);
  });
  const data = PRODUCT_CATEGORY_ORDER.map(function (key) {
    return raw[key] != null ? raw[key] : 0;
  });

  const options = {
    series: [{
      name: chartName,
      data: data,
    }],
    chart: {
      type: "bar",
      height: 350,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    theme: { palette: "palette9" },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 3,
        horizontal: false,
        columnWidth: "50%",
      },
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: "top" },
    fill: { opacity: 0.7 },
    xaxis: {
      categories: labels,
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: axisTitle },
      axisTicks: { show: false },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return String(Math.round(Number(val)));
        },
      },
    },
  };

  if (salesCategoryChart) {
    salesCategoryChart.destroy();
  }
  const salesCategoryChartElement = document.querySelector("#balance-sales-category-chart");
  salesCategoryChartElement.innerHTML = "";
  salesCategoryChart = new ApexCharts(salesCategoryChartElement, options);
  salesCategoryChart.render();
}

function renderExpenseCategoryChart(expenses, lang) {
  const categoryKeyMap = {
    Rent: 'rent',
    'Order Fulfillment': 'orderFulfillment',
    Utilities: 'utilities',
    Supplies: 'supplies',
    Miscellaneous: 'miscellaneous',
  };

  const raw = calculateCategoryExpenses(expenses);
  const labels = Object.keys(raw).map(function (key) {
    const transKey = categoryKeyMap[key] || key.toLowerCase().replace(/\s+/g, '');
    return translate(`expenses.${transKey}`, key);
  });

  const options = {
    series: Object.values(raw),
    labels: labels,
    chart: {
      type: "donut",
      width: "100%",
      animations: { enabled: false },
      toolbar: { show: false },
    },
    theme: { palette: "palette1" },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "14px",
        fontFamily: "Lato, sans-serif",
      },
    },
    plotOptions: {
      pie: {
        customScale: 0.8,
        donut: { size: "60%" },
        offsetY: 20,
      },
      stroke: {
        colors: undefined,
      },
    },
    legend: {
      position: "left",
      offsetY: 55,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "$" + Number(val).toFixed(2);
        },
      },
    },
  };

  if (expenseCategoryChart) {
    expenseCategoryChart.destroy();
  }
  const expenseCategoryChartElement = document.querySelector("#balance-expenses-chart");
  expenseCategoryChartElement.innerHTML = "";
  expenseCategoryChart = new ApexCharts(expenseCategoryChartElement, options);
  expenseCategoryChart.render();
}

async function renderBalanceCharts() {
  const [orders, expenses, products] = await Promise.all([
    getDataWithFallback("orders", "bizTrackOrders", DEFAULT_ORDERS),
    getDataWithFallback("expenses", "bizTrackTransactions", DEFAULT_EXPENSES),
    getDataWithFallback("products", "bizTrackProducts", DEFAULT_PRODUCTS),
  ]);

  const lang = getLanguage();
  const monthlyData = aggregateByMonth(orders, expenses);
  setPageTexts(lang);
  renderTrendChart(monthlyData, lang);
  renderMarginChart(monthlyData, lang);
  renderSalesCategoryChart(orders, products, lang);
  renderExpenseCategoryChart(expenses, lang);
}

document.addEventListener("DOMContentLoaded", function () {
  renderBalanceCharts();

  const selector = document.getElementById("languageSelector");
  if (selector) {
    selector.addEventListener("change", function () {
      setTimeout(renderBalanceCharts, 0);
    });
  }
});

window.addEventListener("storage", function (event) {
  if (event.key === "bizTrackLanguage") {
    renderBalanceCharts();
  }
});

window.addEventListener("languageChanged", function () {
  renderBalanceCharts();
});

window.calculateCategoryUnitsSoldFromOrders = calculateCategoryUnitsSoldFromOrders;
window.PRODUCT_CATEGORY_ORDER = PRODUCT_CATEGORY_ORDER;
