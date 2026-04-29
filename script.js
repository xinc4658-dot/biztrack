// SIDEBAR TOGGLE

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

const DEFAULT_PRODUCTS = [
  {
    prodID: "PD001",
    prodName: "Baseball caps",
    prodDesc: "Peace embroidered cap",
    prodCat: "Hats",
    prodPrice: 25.00,
    prodSold: 20
  },
  {
    prodID: "PD002",
    prodName: "Water bottles",
    prodDesc: "Floral lotus printed bottle",
    prodCat: "Drinkware",
    prodPrice: 48.50,
    prodSold: 10
  },
  {
    prodID: "PD003",
    prodName: "Sweatshirt",
    prodDesc: "Palestine sweater",
    prodCat: "Clothing",
    prodPrice: 17.50,
    prodSold: 70
  },
  {
    prodID: "PD004",
    prodName: "Posters",
    prodDesc: "Vibes printed poster",
    prodCat: "Home decor",
    prodPrice: 12.00,
    prodSold: 60
  },
  {
    prodID: "PD005",
    prodName: "Pillow cases",
    prodDesc: "Morrocan print pillow case",
    prodCat: "Accessories",
    prodPrice: 17.00,
    prodSold: 40
  },
];

let barChart = null;
let donutChart = null;

function calculateExpTotal(transactions) {
  return transactions.reduce((total, transaction) => total + toNumber(transaction.trAmount), 0);
}

function calculateRevTotal(orders) {
  return orders.reduce((total, order) => total + toNumber(order.orderTotal), 0);
}

function calculateCategorySales(products) {
  const categorySales = {};

  products.forEach(product => {
    const category = product.prodCat;

    if (!categorySales[category]) {
      categorySales[category] = 0;
    }

    categorySales[category] += toNumber(product.prodPrice) * toNumber(product.prodSold);
  });

  return categorySales;
}

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
  const currentLang = typeof currentLanguage !== 'undefined' ? currentLanguage : localStorage.getItem('bizTrackLanguage') || 'en';

  const cardTitleTranslations = {
    en: {
      revenue: 'Revenue',
      expenses: 'Expenses',
      balance: 'Balance',
      orders: 'Orders',
    },
    zh: {
      revenue: '收入',
      expenses: '支出',
      balance: '余额',
      orders: '订单',
    }
  };

  const revDiv = document.getElementById('rev-amount');
  const expDiv = document.getElementById('exp-amount');
  const balDiv = document.getElementById('balance');
  const ordDiv = document.getElementById('num-orders');

  if (revDiv) {
    const titleElement = revDiv.querySelector('.title');
    const amountValueElement = revDiv.querySelector('.amount-value');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].revenue;
    }
    if (!amountValueElement) {
      return;
    }
  }

  if (expDiv) {
    const titleElement = expDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].expenses;
    }
  }

  if (balDiv) {
    const titleElement = balDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].balance;
    }
  }

  if (ordDiv) {
    const titleElement = ordDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].orders;
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

  const currentLang = localStorage.getItem('bizTrackLanguage') || 'en';

  const cardTitleTranslations = {
    en: {
      revenue: 'Revenue',
      expenses: 'Expenses',
      balance: 'Balance',
      orders: 'Orders',
    },
    zh: {
      revenue: '收入',
      expenses: '支出',
      balance: '余额',
      orders: '订单',
    }
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
      <span class="title">${cardTitleTranslations[currentLang].revenue}</span>
      <span class="amount-value">$${totalRevenues.toFixed(2)}</span>
  `;
  }

  if (expDiv) {
    expDiv.innerHTML = `
    <span class="title">${cardTitleTranslations[currentLang].expenses}</span>
    <span class="amount-value">$${totalExpenses.toFixed(2)}</span>
  `;
  }

  if (balDiv) {
    balDiv.innerHTML = `
    <span class="title">${cardTitleTranslations[currentLang].balance}</span>
    <span class="amount-value">$${totalBalance.toFixed(2)}</span>
  `;
  }

  if (ordDiv) {
    ordDiv.innerHTML = `
    <span class="title">${cardTitleTranslations[currentLang].orders}</span>
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
}

async function initializeChart() {
  const currentLang = localStorage.getItem('bizTrackLanguage') || 'en';

  const chartTranslations = {
    en: {
      totalSales: 'Total Sales',
      totalSalesYAxis: 'Total Sales ($)',
    },
    zh: {
      totalSales: '总销售额',
      totalSalesYAxis: '总销售额 ($)',
    }
  };

  const categoryTranslations = {
    en: {
      'Home decor': 'Home decor',
      'Accessories': 'Accessories',
      'Apparel': 'Apparel',
      'Clothing': 'Clothing',
      'Hats': 'Hats',
      'Drinkware': 'Drinkware',
      'Bags': 'Bags',
    },
    zh: {
      'Home decor': '家居装饰',
      'Accessories': '配饰',
      'Apparel': '服装',
      'Clothing': '服装',
      'Hats': '帽子',
      'Drinkware': '饮具',
      'Bags': '包袋',
    }
  };

  const items = await getDataWithFallback("products", "bizTrackProducts", DEFAULT_PRODUCTS);
  const categorySalesData = calculateCategorySales(items);

  const sortedCategorySales = Object.entries(categorySalesData)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  const translatedCategories = Object.keys(sortedCategorySales).map(category =>
    (categoryTranslations[currentLang] && categoryTranslations[currentLang][category]) || category
  );

  const barChartOptions = {
    series: [{
      name: chartTranslations[currentLang].totalSales,
      data: Object.values(sortedCategorySales),
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
        text: chartTranslations[currentLang].totalSalesYAxis,
      },
      axisTicks: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return '$' + val.toFixed(2);
        }
      }
    }
  };

  if (barChart) {
    barChart.destroy();
  }

  barChart = new ApexCharts(
    document.querySelector('#bar-chart'),
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

  const translatedExpCategories = Object.keys(categoryExpData).map(category =>
    (expCategoryTranslations[currentLang] && expCategoryTranslations[currentLang][category]) || category
  );

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
    await loadDashboardSummary();

    if (typeof initI18n === 'function') {
      initI18n();
    } else {
      setTimeout(function () {
        if (typeof initI18n === 'function') {
          initI18n();
        }
      }, 100);
    }
  })();
};
