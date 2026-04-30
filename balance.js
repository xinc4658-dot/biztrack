function openSidebar() {
  var side = document.getElementById("sidebar");
  side.style.display = side.style.display === "block" ? "none" : "block";
}

function closeSidebar() {
  document.getElementById("sidebar").style.display = "none";
}

const DEFAULT_EXPENSES = [
  { trID: 1, trDate: "2024-01-05", trCategory: "Rent", trAmount: 100.0, trNotes: "January Rent" },
  { trID: 2, trDate: "2024-01-15", trCategory: "Order Fulfillment", trAmount: 35.0, trNotes: "Order #1005" },
  { trID: 3, trDate: "2024-01-08", trCategory: "Utilities", trAmount: 120.0, trNotes: "Internet" },
  { trID: 4, trDate: "2024-02-05", trCategory: "Supplies", trAmount: 180.0, trNotes: "Embroidery Machine" },
  { trID: 5, trDate: "2024-01-25", trCategory: "Miscellaneous", trAmount: 20.0, trNotes: "Pizza" },
];

const DEFAULT_ORDERS = [
  { orderID: "1001", orderDate: "2024-01-05", itemName: "Baseball caps", itemPrice: 25.0, qtyBought: 2, shipping: 2.5, taxes: 9.0, orderTotal: 61.5, orderStatus: "Pending" },
  { orderID: "1002", orderDate: "2024-03-05", itemName: "Water bottles", itemPrice: 17.0, qtyBought: 3, shipping: 3.5, taxes: 6.0, orderTotal: 60.5, orderStatus: "Processing" },
  { orderID: "1003", orderDate: "2024-02-05", itemName: "Tote bags", itemPrice: 20.0, qtyBought: 4, shipping: 2.5, taxes: 2.0, orderTotal: 84.5, orderStatus: "Shipped" },
  { orderID: "1004", orderDate: "2023-01-05", itemName: "Canvas prints", itemPrice: 55.0, qtyBought: 1, shipping: 2.5, taxes: 19.0, orderTotal: 76.5, orderStatus: "Delivered" },
  { orderID: "1005", orderDate: "2024-01-15", itemName: "Beanies", itemPrice: 15.0, qtyBought: 2, shipping: 3.9, taxes: 4.0, orderTotal: 37.9, orderStatus: "Pending" },
];

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

let trendChart = null;
let marginChart = null;
let salesCategoryChart = null;
let expenseCategoryChart = null;

/** 与产品目录一致，用于 X 轴固定显示（无订单的类别为 0） */
const PRODUCT_CATEGORY_ORDER = ["Hats", "Drinkware", "Clothing", "Accessories", "Home decor"];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function monthKeyFromDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return y + "-" + m;
}

function localMonthLabel(monthKey, lang) {
  const parts = monthKey.split("-");
  const y = parts[0];
  const m = Number(parts[1]);
  return lang === "zh" ? y + "年" + m + "月" : monthKey;
}

async function getDataWithFallback(collectionName, localStorageKey, fallbackData) {
  const localData = JSON.parse(localStorage.getItem(localStorageKey) || "null");
  const fallback = localData || fallbackData;

  if (window.biztrackDb) {
    try {
      const snapshot = await window.biztrackDb.collection(collectionName).get();
      const remoteData = snapshot.docs.map(function (doc) {
        return doc.data();
      });

      if (remoteData.length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(remoteData));
        return remoteData;
      }
    } catch (error) {
      console.error("Failed to read " + collectionName + " from Firestore:", error);
    }
  }

  return fallback;
}

function aggregateByMonth(orders, expenses) {
  const monthMap = {};

  orders.forEach(function (order) {
    const month = monthKeyFromDate(order.orderDate);
    if (!month) return;
    if (!monthMap[month]) {
      monthMap[month] = { revenue: 0, expenses: 0 };
    }
    monthMap[month].revenue += toNumber(order.orderTotal);
  });

  expenses.forEach(function (item) {
    const month = monthKeyFromDate(item.trDate);
    if (!month) return;
    if (!monthMap[month]) {
      monthMap[month] = { revenue: 0, expenses: 0 };
    }
    monthMap[month].expenses += toNumber(item.trAmount);
  });

  const sortedMonths = Object.keys(monthMap).sort();
  return sortedMonths.map(function (month) {
    const revenue = monthMap[month].revenue;
    const exp = monthMap[month].expenses;
    const net = revenue - exp;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;

    return {
      month: month,
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(exp.toFixed(2)),
      net: Number(net.toFixed(2)),
      margin: Number(margin.toFixed(2)),
    };
  });
}

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

/**
 * 按订单中每条行的购买数量，累加到商品名对应的产品类别上（不再用库存×单价）。
 * 所有目录中的类别均返回，无销量为 0。
 */
function calculateCategoryUnitsSoldFromOrders(orders, products) {
  const totals = {};
  PRODUCT_CATEGORY_ORDER.forEach(function (c) {
    totals[c] = 0;
  });

  (orders || []).forEach(function (order) {
    const cat = findCategoryForItemName(order.itemName, products);
    if (!cat || totals[cat] === undefined) return;
    totals[cat] += toNumber(order.qtyBought);
  });

  return totals;
}

function calculateCategoryExpenses(expenses) {
  const categoryExp = {};
  expenses.forEach(function (item) {
    const category = item.trCategory;
    if (!categoryExp[category]) {
      categoryExp[category] = 0;
    }
    categoryExp[category] += toNumber(item.trAmount);
  });
  return categoryExp;
}

function getLanguage() {
  return localStorage.getItem("bizTrackLanguage") || "en";
}

function setPageTexts(lang) {
  const labels = {
    en: {
      mainTitle: "Balance Analytics",
      trendTitle: "Monthly Revenue, Expenses & Net Balance",
      marginTitle: "Monthly Net Margin (%)",
      salesCategoryTitle: "Units sold by product category",
      expensesTitle: "Expenses",
      trendFormula: "Formula:\nNet Balance = Revenue - Expenses",
      marginFormula:
        "Formula:\nNet Margin (%) = ((Revenue - Expenses) / Revenue) x 100\nIf Revenue = 0, Net Margin is set to 0%.",
    },
    zh: {
      mainTitle: "余额分析",
      trendTitle: "月度收入、支出与净余额",
      marginTitle: "月度净收益率（%）",
      salesCategoryTitle: "按产品类别销售件数",
      expensesTitle: "支出",
      trendFormula: "公式：\n净余额 = 收入 - 支出",
      marginFormula:
        "公式：\n净收益率（%）= ((收入 - 支出) / 收入) x 100\n当收入为 0 时，净收益率按 0% 处理。",
    },
  };

  const chosen = labels[lang] || labels.en;
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
  const textMap = {
    en: {
      revenue: "Revenue",
      expenses: "Expenses",
      net: "Net Balance",
      xAxis: "Month",
      yAxis: "Amount ($)",
    },
    zh: {
      revenue: "收入",
      expenses: "支出",
      net: "净余额",
      xAxis: "月份",
      yAxis: "金额 ($)",
    },
  };

  const t = textMap[lang] || textMap.en;
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
  trendChart = new ApexCharts(document.querySelector("#balance-trend-chart"), options);
  trendChart.render();
}

function renderMarginChart(monthlyData, lang) {
  const textMap = {
    en: {
      margin: "Net Margin %",
      xAxis: "Month",
      yAxis: "Margin (%)",
    },
    zh: {
      margin: "净收益率 %",
      xAxis: "月份",
      yAxis: "收益率 (%)",
    },
  };

  const t = textMap[lang] || textMap.en;
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
  marginChart = new ApexCharts(document.querySelector("#balance-margin-chart"), options);
  marginChart.render();
}

function renderSalesCategoryChart(orders, products, lang) {
  const categoryTranslations = {
    en: {
      "Home decor": "Home decor",
      Accessories: "Accessories",
      Apparel: "Apparel",
      Clothing: "Clothing",
      Hats: "Hats",
      Drinkware: "Drinkware",
      Bags: "Bags",
    },
    zh: {
      "Home decor": "家居装饰",
      Accessories: "配饰",
      Apparel: "服装",
      Clothing: "服装",
      Hats: "帽子",
      Drinkware: "饮具",
      Bags: "包袋",
    },
  };

  const chartNames = {
    en: "Units sold",
    zh: "销售件数",
  };

  const axisTitle = {
    en: "Cumulative units sold",
    zh: "累计销售件数",
  };

  const raw = calculateCategoryUnitsSoldFromOrders(orders, products);
  const labels = PRODUCT_CATEGORY_ORDER.map(function (key) {
    return (categoryTranslations[lang] && categoryTranslations[lang][key]) || key;
  });
  const data = PRODUCT_CATEGORY_ORDER.map(function (key) {
    return raw[key] != null ? raw[key] : 0;
  });

  const options = {
    series: [{
      name: chartNames[lang] || chartNames.en,
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
      title: { text: axisTitle[lang] || axisTitle.en },
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
  salesCategoryChart = new ApexCharts(document.querySelector("#balance-sales-category-chart"), options);
  salesCategoryChart.render();
}

function renderExpenseCategoryChart(expenses, lang) {
  const expCategoryTranslations = {
    en: {
      Rent: "Rent",
      "Order Fulfillment": "Order Fulfillment",
      Utilities: "Utilities",
      Supplies: "Supplies",
      Miscellaneous: "Miscellaneous",
    },
    zh: {
      Rent: "租金",
      "Order Fulfillment": "订单履行",
      Utilities: "公用事业",
      Supplies: "用品",
      Miscellaneous: "杂项",
    },
  };

  const raw = calculateCategoryExpenses(expenses);
  const labels = Object.keys(raw).map(function (key) {
    return (expCategoryTranslations[lang] && expCategoryTranslations[lang][key]) || key;
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
  expenseCategoryChart = new ApexCharts(document.querySelector("#balance-expenses-chart"), options);
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

window.addEventListener("load", function () {
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

window.calculateCategoryUnitsSoldFromOrders = calculateCategoryUnitsSoldFromOrders;
window.PRODUCT_CATEGORY_ORDER = PRODUCT_CATEGORY_ORDER;
