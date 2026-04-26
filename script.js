// SIDEBAR TOGGLE

function openSidebar() {
  var side = document.getElementById('sidebar');
  side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
  document.getElementById('sidebar').style.display = 'none';
}

// 计算支出总额
function calculateExpTotal(transactions) {
  return transactions.reduce((total, transaction) => total + transaction.trAmount, 0);
}

// 计算收入总额
function calculateRevTotal(orders) {
  return orders.reduce((total, order) => total + order.orderTotal, 0);
}

// 计算类别销售额
function calculateCategorySales(products) {
  const categorySales = {};

  products.forEach(product => {
    const category = product.prodCat;

    if (!categorySales[category]) {
      categorySales[category] = 0;
    }

    categorySales[category] += product.prodPrice * product.prodSold;
  });

  return categorySales;
}

// 计算类别支出
function calculateCategoryExp(transactions) {
  const categoryExpenses = {};

  transactions.forEach(transaction => {
    const category = transaction.trCategory;

    if (!categoryExpenses[category]) {
      categoryExpenses[category] = 0;
    }

    categoryExpenses[category] += transaction.trAmount;
  });

  return categoryExpenses;
}

// 更新卡片内容
function updateCardContent() {
  // 使用i18n.js中的currentLanguage变量
  const currentLang = typeof currentLanguage !== 'undefined' ? currentLanguage : localStorage.getItem('bizTrackLanguage') || 'en';

  // 定义卡片标题的翻译
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

  // 更新收入卡片
  if (revDiv) {
    const titleElement = revDiv.querySelector('.title');
    const amountValueElement = revDiv.querySelector('.amount-value');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].revenue;
    }
    // 如果没有金额值元素，说明卡片还没有初始化，跳过
    if (!amountValueElement) {
      return;
    }
  }

  // 更新支出卡片
  if (expDiv) {
    const titleElement = expDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].expenses;
    }
  }

  // 更新余额卡片
  if (balDiv) {
    const titleElement = balDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].balance;
    }
  }

  // 更新订单卡片
  if (ordDiv) {
    const titleElement = ordDiv.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = cardTitleTranslations[currentLang].orders;
    }
  }
}

// 初始化图表
function initializeChart() {
  const items = JSON.parse(localStorage.getItem('bizTrackProducts')) || [
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
      prodDesc: "Stainless steel water bottle",
      prodCat: "Drinkware",
      prodPrice: 17.00,
      prodSold: 50
    },
    {
      prodID: "PD003",
      prodName: "Tote bags",
      prodDesc: "Canvas tote bag with print",
      prodCat: "Bags",
      prodPrice: 20.00,
      prodSold: 35
    },
    {
      prodID: "PD004",
      prodName: "Canvas prints",
      prodDesc: "Morrocan print canvas",
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
  const categorySalesData = calculateCategorySales(items);

  const sortedCategorySales = Object.entries(categorySalesData)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  // 获取当前语言
  const currentLang = localStorage.getItem('bizTrackLanguage') || 'en';

  // 定义图表文本的翻译
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

  // 定义产品类别的翻译
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

  // 翻译类别名称
  const translatedCategories = Object.keys(sortedCategorySales).map(category => 
    categoryTranslations[currentLang][category] || category
  );

  const barChartOptions = {
      series: [{
          name: chartTranslations[currentLang].totalSales,
          data: Object.values(sortedCategorySales),
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {show: false},
      },
      theme: {
        palette: 'palette9' // upto palette10
      },
      // colors: ['#247BA0', '#A37A74', '#249672', '#e49273', '#9AADBF'],
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

  const barChart = new ApexCharts(
    document.querySelector('#bar-chart'), barChartOptions
  );
  barChart.render();

  // 将图表对象存储在window.chart变量中，以便在语言切换时可以更新
  window.chart = barChart;


  // DONUT CHART

  const expItems = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [
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
  const categoryExpData = calculateCategoryExp(expItems);

  // 定义支出类别的翻译
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

  // 翻译类别名称
  const translatedExpCategories = Object.keys(categoryExpData).map(category => 
    expCategoryTranslations[currentLang][category] || category
  );

  const donutChartOptions = {
    series: Object.values(categoryExpData),
    labels: translatedExpCategories,
    chart: {
      // height: 350,
      type: 'donut',
      width: '100%',
      toolbar: {
        show: false,
      },
    },
    theme: {
      palette: 'palette1' // upto palette10
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

  const donutChart = new ApexCharts(
    document.querySelector('#donut-chart'),
    donutChartOptions
  );
  donutChart.render();

  // 将Donut Chart对象存储在window.donutChart变量中，以便在语言切换时可以更新
  window.donutChart = donutChart;
}

// 页面加载时初始化
window.onload = function () {
  const expenses = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [
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
  const revenues = JSON.parse(localStorage.getItem('bizTrackOrders')) || [
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

  const totalExpenses = calculateExpTotal(expenses);
  const totalRevenues = calculateRevTotal(revenues);
  const totalBalance = totalRevenues - totalExpenses;
  const numOrders = revenues.length;

  // 获取当前语言
  const currentLang = localStorage.getItem('bizTrackLanguage') || 'en';

  // 定义卡片标题的翻译
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

  // 使用data属性存储当前语言，以便updateCardContent函数能够正确更新
  if (revDiv) revDiv.dataset.lang = currentLang;
  if (expDiv) expDiv.dataset.lang = currentLang;
  if (balDiv) balDiv.dataset.lang = currentLang;
  if (ordDiv) ordDiv.dataset.lang = currentLang;

  revDiv.innerHTML = `
      <span class="title">${cardTitleTranslations[currentLang].revenue}</span>
      <span class="amount-value">$${totalRevenues.toFixed(2)}</span>
  `;

  expDiv.innerHTML = `
    <span class="title">${cardTitleTranslations[currentLang].expenses}</span>
    <span class="amount-value">$${totalExpenses.toFixed(2)}</span>
  `;

  balDiv.innerHTML = `
    <span class="title">${cardTitleTranslations[currentLang].balance}</span>
    <span class="amount-value">$${totalBalance.toFixed(2)}</span>
  `;

  ordDiv.innerHTML = `
    <span class="title">${cardTitleTranslations[currentLang].orders}</span>
    <span class="amount-value">${numOrders}</span>
  `;

  // 初始化图表
  initializeChart();

  // 初始化i18n
  if (typeof initI18n === 'function') {
    initI18n();
  } else {
    // 如果i18n未初始化，延迟执行
    setTimeout(function() {
      if (typeof initI18n === 'function') {
        initI18n();
      }
    }, 100);
  }
};

// changeLanguage函数已在i18n.js中定义，会自动调用updateCardContent函数
