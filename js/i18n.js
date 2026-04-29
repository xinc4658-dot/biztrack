// i18n.js - 国际化模块

// js/i18n.js 顶部添加转义函数
window.escapeHTML = function(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag)
  );
};

// 当前语言
let currentLanguage = localStorage.getItem('bizTrackLanguage') || 'en';

// 语言资源
const translations = {
  en: {
    sidebar: {
      dashboard: "Dashboard",
      products: "Products",
      orders: "Orders",
      expenses: "Expenses",
      help: "Help",
      meetDeveloper: "Meet the Developer",
      close: "Close",
      history: "History"
    },
    history: {
      pageTitle: "Activity History",
      sectionTitle: "Operation Logs",
      colTime: "Time",
      colEntity: "Entity",
      colRecordId: "Record ID",
      colAction: "Action",
      colBefore: "Before",
      colAfter: "After",
      noRecords: "No records yet",
      noHistoryYet: "No history logs yet",
      dbNotConnected: "Database is not connected.",
      entityProducts: "Products",
      entityOrders: "Orders",
      entityExpenses: "Expenses",
      actionCreate: "Create",
      actionUpdate: "Update",
      actionDelete: "Delete",
      actionSync: "Sync",
      fieldProdID: "Product ID",
      fieldProdName: "Product Name",
      fieldProdDesc: "Description",
      fieldProdCat: "Category",
      fieldProdPrice: "Price",
      fieldProdSold: "Units Sold",
      fieldOrderID: "Order ID",
      fieldOrderDate: "Order Date",
      fieldItemName: "Item Name",
      fieldItemPrice: "Item Price",
      fieldQtyBought: "Qty Bought",
      fieldShipping: "Shipping",
      fieldTaxes: "Taxes",
      fieldOrderTotal: "Order Total",
      fieldOrderStatus: "Order Status",
      fieldTrID: "S/N",
      fieldTrDate: "Date",
      fieldTrCategory: "Category",
      fieldTrAmount: "Amount",
      fieldTrNotes: "Notes"
    },
    dashboard: {
      title: "Dashboard",
      summary: "Summary",
      analytics: "Analytics",
      salesByProductCategory: "Sales by Product Category",
      expenses: "Expenses",
      revenue: "Revenue",
      balance: "Balance",
      orders: "Orders",
      totalSales: "Total Sales ($)"
    },
    products: {
      addProduct: "Add Product",
      downloadCSV: "Download CSV",
      productId: "Product ID",
      productName: "Product Name",
      chooseProduct: "Choose a product",
      productDesc: "Product Description",
      productDescPlaceholder: "For example: Travel Mug",
      productCategory: "Product Category",
      chooseCategory: "Choose a category",
      productPrice: "Product Price",
      productSold: "Number of Units Sold",
      hats: "Hats",
      baseballCaps: "Baseball caps",
      snapbacks: "Snapbacks",
      beanies: "Beanies",
      bucketHats: "Bucket hats",
      drinkware: "Drinkware",
      mugs: "Mugs",
      waterBottles: "Water bottles",
      tumblers: "Tumblers",
      clothing: "Clothing",
      tshirts: "T-shirts",
      sweatshirts: "Sweatshirts",
      hoodies: "Hoodies",
      accessories: "Accessories",
      pillowCases: "Pillow cases",
      toteBags: "Tote bags",
      stickers: "Stickers",
      homeDecor: "Home decor",
      posters: "Posters",
      framedPosters: "Framed posters",
      canvasPrints: "Canvas prints",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel"
    },
    // 产品名称翻译映射
    productNames: {
      "Baseball caps": "Baseball caps",
      "Snapbacks": "Snapbacks",
      "Beanies": "Beanies",
      "Bucket hats": "Bucket hats",
      "Mugs": "Mugs",
      "Water bottles": "Water bottles",
      "Tumblers": "Tumblers",
      "T-shirts": "T-shirts",
      "Sweatshirts": "Sweatshirts",
      "Hoodies": "Hoodies",
      "Pillow cases": "Pillow cases",
      "Tote bags": "Tote bags",
      "Stickers": "Stickers",
      "Posters": "Posters",
      "Framed posters": "Framed posters",
      "Canvas prints": "Canvas prints"
    },
    orders: {
      addOrder: "Add Order",
      exportCSV: "Export to CSV",
      orderId: "Order ID:",
      orderDate: "Order Date:",
      itemName: "Item Name:",
      chooseItem: "Choose an item",
      itemPrice: "Item Price:",
      quantityBought: "Quantity Bought:",
      shippingFee: "Shipping fee:",
      taxes: "Taxes (VAT/GST/HST):",
      orderStatus: "Order Status:",
      chooseStatus: "Choose a status",
      totalOrderAmount: "Total Order Amount:",
      calculated: "Calculated",
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      totalRevenue: "Total Revenue:"
    },
    expenses: {
      addExpense: "Add Expense",
      add: "Add",
      exportCSV: "Export to CSV",
      date: "Date:",
      category: "Category:",
      chooseCategory: "Choose an expense category",
      amount: "Amount:",
      notes: "Notes:",
      notesPlaceholder: "For example: Power bill",
      rent: "Rent",
      utilities: "Utilities",
      supplies: "Supplies",
      orderFulfillment: "Order Fulfillment",
      miscellaneous: "Miscellaneous",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      totalExpenses: "Total Expenses:"
    },
    common: {
      search: "Search",
      action: "Action",
      productIdExists: "Product ID already exists. Please use a unique ID.",
      categoryMustMatch: "Product category must match the selected product name.",
      orderIdExists: "Order ID already exists. Please use a unique ID.",
      selectDate: "Please select a date"
    },
    help: {
      title: "Using BizTrack: A Quick Guide",
      whatIsBizTrack: "What is BizTrack?",
      whatIsBizTrackContent: "BizTrack is your go-to business management tool designed with small business owners in mind. It's an all-in-one platform that helps you effortlessly manage your products, track orders, and stay on top of your finances. Let me walk you through the basics:",
      navigatingDashboard: "Navigating the Dashboard",
      navigatingDashboardContent: "The Dashboard is your central hub, giving you a snapshot of your business's overall performance. Here, you'll find key metrics like total expenses, revenues, profits and the number of orders. It's your command center for a quick overview.",
      expensesPage: "Expenses Page",
      recordExpenses: "Record Your Expenses:",
      recordExpensesContent: "Head to the Expenses page to add your business expenses. Fill in the date, choose a category, enter the amount, and jot down any notes. It's that simple.",
      editDeleteExpenses: "Edit or Delete Expenses:",
      editDeleteExpensesContent: "Made a mistake? No worries! You can easily edit or delete expense records right from the Expenses page.",
      ordersPage: "Orders Page",
      trackOrders: "Track Your Orders:",
      trackOrdersContent: "On the Orders page, you can keep tabs on all your orders. Each entry details the product, quantity, and order status.",
      effortlessEditing: "Effortless Editing:",
      effortlessEditingContent: "Need to update an order status? Click the \"Edit\" button and make your changes. It's hassle-free.",
      addingNew: "Adding a New Expense, Order or Product",
      addingNewStep1: "Click on \"Add Expense\" or the equivalent button on the order or product page.",
      addingNewStep2: "Fill in the product details or order details or transaction date, category, amount, and any notes.",
      addingNewStep3: "Hit \"Done,\" and you're all set. Your order, product or transaction will now appear in the respective page and on the Dashboard.",
      sortingSearching: "Sorting and Searching Entries/Tables",
      sortingSearchingStep1: "Click on any column heading (headers) to sort the entries in the table by that column in either ascending order or alphabetical order.",
      sortingSearchingStep2: "You can also search for a particular product, order or expense by entrering the value in the search box at the top of the respective page.",
      exportToCSV: "Export to CSV",
      exportToCSVContent1: "Want to keep a backup or analyze your data elsewhere? Simply click on \"Export to CSV\" to download a CSV file with all your business data.",
      exportToCSVContent2: "BizTrack is designed to be intuitive, user-friendly, and adaptable to your business needs. Explore the different pages, try out the features, and let BizTrack simplify your small business management.",
      contact: "Have questions, feedback, or just want to connect? Feel free to reach out!"
    },
    about: {
      title: "My Coding Journey",
      greeting: "Hey, I'm Sumayyah!",
      greetingContent: "Welcome to my little corner of the internet, where I'm rolling up my sleeves and diving into the coding world. I'm not your typical tech guru – I'm just a small business owner navigating the hustle and bustle of entrepreneurship. Oh, and did I mention I'm also part of the <a href=\"https://www.getcoding.ca/coaching-program-nl\" target=\"_blank\">GetCoding NL</a> program? Yeah, it's been quite the journey, and I owe a huge shoutout to my coding coach, Sam.",
      bizTrackStory: "Let me spill the tea on BizTrack, my brainchild. So, picture this: I'm running a small business, trying to keep tabs on products, orders, and the never-ending finances - It's a lot. That's when the light bulb moment happened, and BizTrack was born. It's not just a project; it's my answer to the chaos that comes with managing a business.",
      bizTrackPurpose: "BizTrack is my attempt at making life a bit more straightforward for small business owners like me. You know, the ones who are constantly multitasking and could use a break. It's a manifestation of my passion for leveraging technology to enhance the efficiency and effectiveness of business operations. It's not polished; it's not perfect, it's just a real solution for real-world challenges.",
      learningJourney: "I'm a student at GetCoding NL, a software development program that's turning me from someone who googles how websites work into someone who actually understands and builds them. And guess what? BizTrack is my first module project, allowing me to practically apply the skills and knowledge gained in the program. Learning by doing, they say, and that's exactly what I'm doing.",
      coachAppreciation: "But none of this would be possible without the guidance of my amazing coach, <a href=\"https://github.com/samwise-nl\" target=\"_blank\">Sam Russell</a>. Sam has been the compass in my coding journey. Patient, encouraging, and always ready with a helpful tip – he has made navigating the coding seas a whole lot less daunting.",
      invitation: "So, why spill all this in an about me section? Well, I'm not just sharing my story; I'm inviting you to join me on my journey. Whether you're into the chaos of small business life, curious about coding escapades, or just want to see where the two collide – you're welcome here.",
      thanks: "Here's to coding, chaos, everything in between and heartfelt thanks to Sam!"
    }
  },
  zh: {
    sidebar: {
      dashboard: "仪表盘",
      products: "产品",
      orders: "订单",
      expenses: "支出",
      help: "帮助",
      meetDeveloper: "开发者介绍",
      close: "关闭",
      history: "历史记录"
    },
    history: {
      pageTitle: "操作历史",
      sectionTitle: "操作记录",
      colTime: "时间",
      colEntity: "对象",
      colRecordId: "记录 ID",
      colAction: "操作",
      colBefore: "变更前",
      colAfter: "变更后",
      noRecords: "暂无记录",
      noHistoryYet: "暂无历史记录",
      dbNotConnected: "数据库未连接。",
      entityProducts: "产品",
      entityOrders: "订单",
      entityExpenses: "支出",
      actionCreate: "创建",
      actionUpdate: "更新",
      actionDelete: "删除",
      actionSync: "同步",
      fieldProdID: "产品 ID",
      fieldProdName: "产品名称",
      fieldProdDesc: "描述",
      fieldProdCat: "类别",
      fieldProdPrice: "价格",
      fieldProdSold: "销售数量",
      fieldOrderID: "订单 ID",
      fieldOrderDate: "订单日期",
      fieldItemName: "商品名称",
      fieldItemPrice: "商品单价",
      fieldQtyBought: "购买数量",
      fieldShipping: "运费",
      fieldTaxes: "税费",
      fieldOrderTotal: "订单总额",
      fieldOrderStatus: "订单状态",
      fieldTrID: "序号",
      fieldTrDate: "日期",
      fieldTrCategory: "类别",
      fieldTrAmount: "金额",
      fieldTrNotes: "备注"
    },
    dashboard: {
      title: "仪表盘",
      summary: "摘要",
      analytics: "分析",
      salesByProductCategory: "按产品类别销售",
      expenses: "支出",
      revenue: "收入",
      balance: "余额",
      orders: "订单",
      totalSales: "总销售额 ($)"
    },
    help: {
      title: "使用BizTrack：快速指南",
      whatIsBizTrack: "什么是BizTrack？",
      whatIsBizTrackContent: "BizTrack是专为小企业主设计的首选业务管理工具。它是一个一体化平台，帮助您轻松管理产品、跟踪订单并掌握财务状况。让我为您介绍基础知识：",
      navigatingDashboard: "导航仪表盘",
      navigatingDashboardContent: "仪表盘是您的中心枢纽，为您提供业务整体表现的快照。在这里，您可以找到总支出、收入、利润和订单数量等关键指标。它是您快速概览的指挥中心。",
      expensesPage: "支出页面",
      recordExpenses: "记录您的支出：",
      recordExpensesContent: "前往支出页面添加您的业务支出。填写日期，选择类别，输入金额，并记下任何备注。就这么简单。",
      editDeleteExpenses: "编辑或删除支出：",
      editDeleteExpensesContent: "犯错了？别担心！您可以直接从支出页面轻松编辑或删除支出记录。",
      ordersPage: "订单页面",
      trackOrders: "跟踪您的订单：",
      trackOrdersContent: "在订单页面上，您可以跟踪所有订单。每个条目都详细说明了产品、数量和订单状态。",
      effortlessEditing: "轻松编辑：",
      effortlessEditingContent: "需要更新订单状态？点击\"编辑\"按钮并进行更改。这非常简单。",
      addingNew: "添加新支出、订单或产品",
      addingNewStep1: "点击\"添加支出\"或订单或产品页面上的相应按钮。",
      addingNewStep2: "填写产品详情或订单详情或交易日期、类别、金额和任何备注。",
      addingNewStep3: "点击\"完成\"，您就设置好了。您的订单、产品或交易现在将出现在相应页面和仪表盘上。",
      sortingSearching: "排序和搜索条目/表格",
      sortingSearchingStep1: "点击任何列标题（表头）以按该列按升序或字母顺序对表格中的条目进行排序。",
      sortingSearchingStep2: "您还可以通过在相应页面顶部的搜索框中输入值来搜索特定产品、订单或支出。",
      exportToCSV: "导出为CSV",
      exportToCSVContent1: "想要保留备份或在其他地方分析您的数据？只需点击\"导出为CSV\"即可下载包含所有业务数据的CSV文件。",
      exportToCSVContent2: "BizTrack设计直观、用户友好，并能适应您的业务需求。探索不同的页面，尝试各种功能，让BizTrack简化您的小企业管理。",
      contact: "有问题、反馈，或者只是想联系？请随时联系我们！"
    },
    products: {
      addProduct: "添加产品",
      downloadCSV: "下载CSV",
      productId: "产品ID",
      productName: "产品名称",
      chooseProduct: "选择产品",
      productDesc: "产品描述",
      productDescPlaceholder: "例如: 旅行杯",
      productCategory: "产品类别",
      chooseCategory: "选择类别",
      productPrice: "产品价格",
      productSold: "已售数量",
      hats: "帽子",
      baseballCaps: "棒球帽",
      snapbacks: "平沿帽",
      beanies: "无檐便帽",
      bucketHats: "渔夫帽",
      drinkware: "饮具",
      mugs: "马克杯",
      waterBottles: "水瓶",
      tumblers: "平底杯",
      clothing: "服装",
      tshirts: "T恤",
      sweatshirts: "运动衫",
      hoodies: "连帽衫",
      accessories: "配饰",
      pillowCases: "枕套",
      toteBags: "托特包",
      stickers: "贴纸",
      homeDecor: "家居装饰",
      posters: "海报",
      framedPosters: "装裱海报",
      canvasPrints: "帆布画",
      edit: "编辑",
      delete: "删除",
      save: "保存",
      cancel: "取消"
    },
    // 产品名称翻译映射
    productNames: {
      "Baseball caps": "棒球帽",
      "Snapbacks": "平沿帽",
      "Beanies": "无檐便帽",
      "Bucket hats": "渔夫帽",
      "Mugs": "马克杯",
      "Water bottles": "水瓶",
      "Tumblers": "平底杯",
      "T-shirts": "T恤",
      "Sweatshirts": "运动衫",
      "Hoodies": "连帽衫",
      "Pillow cases": "枕套",
      "Tote bags": "托特包",
      "Stickers": "贴纸",
      "Posters": "海报",
      "Framed posters": "装裱海报",
      "Canvas prints": "帆布画"
    },
    orders: {
      addOrder: "添加订单",
      exportCSV: "导出为CSV",
      orderId: "订单ID：",
      orderDate: "订单日期：",
      itemName: "商品名称：",
      chooseItem: "选择商品",
      itemPrice: "商品价格：",
      quantityBought: "购买数量：",
      shippingFee: "运费：",
      taxes: "税费（VAT/GST/HST）：",
      orderStatus: "订单状态：",
      chooseStatus: "选择状态",
      totalOrderAmount: "订单总额：",
      calculated: "计算",
      pending: "待处理",
      processing: "处理中",
      shipped: "已发货",
      delivered: "已送达",
      edit: "编辑",
      delete: "删除",
      save: "保存",
      cancel: "取消",
      totalRevenue: "总收入："
    },
    expenses: {
      addExpense: "添加支出",
      add: "添加",
      exportCSV: "导出为CSV",
      date: "日期：",
      category: "类别：",
      chooseCategory: "选择支出类别",
      amount: "金额：",
      notes: "备注：",
      notesPlaceholder: "例如: 电费账单",
      rent: "租金",
      utilities: "公用事业",
      supplies: "用品",
      orderFulfillment: "订单履行",
      miscellaneous: "杂项",
      edit: "编辑",
      delete: "删除",
      save: "保存",
      cancel: "取消",
      totalExpenses: "总支出："
    },
    common: {
      search: "搜索",
      action: "操作",
      productIdExists: "产品ID已存在，请使用唯一的ID。",
      categoryMustMatch: "产品类别必须与所选产品名称匹配。",
      orderIdExists: "订单ID已存在，请使用唯一的ID。",
      selectDate: "请选择日期"
    },
    about: {
      title: "我的编程之旅",
      greeting: "嘿，我是Sumayyah！",
      greetingContent: "欢迎来到我在互联网上的小角落，在这里我卷起袖子，深入编程世界。我不是典型的技术专家——我只是一个在创业的喧嚣中导航的小企业主。哦，我有没有提到我也是<a href=\"https://www.getcoding.ca/coaching-program-nl\" target=\"_blank\">GetCoding NL</a>项目的一员？是的，这是一段相当长的旅程，我要向我的编程教练Sam致以巨大的感谢。",
      bizTrackStory: "让我告诉你BizTrack的故事，这是我的创意。想象一下：我经营着一家小企业，试图跟踪产品、订单和永无止境的财务——这太多了。就在那时，灵光一闪，BizTrack诞生了。它不仅仅是一个项目；它是我对管理业务所带来的混乱的回应。",
      bizTrackPurpose: "BizTrack是我尝试让像我这样的小企业主的生活变得更简单一点。你知道，那些不断 multitasking 并且需要休息的人。这是我利用技术提高业务运营效率和效果的激情的体现。它不精致；它不完美，它只是对现实世界挑战的真实解决方案。",
      learningJourney: "我是GetCoding NL的学生，这是一个软件开发项目，它让我从一个只会谷歌网站如何工作的人变成一个真正理解和构建网站的人。猜猜看？BizTrack是我的第一个模块项目，让我能够实际应用在项目中学到的技能和知识。他们说在做中学，这正是我在做的。",
      coachAppreciation: "但是，如果没有我出色的教练<a href=\"https://github.com/samwise-nl\" target=\"_blank\">Sam Russell</a>的指导，这一切都不可能实现。Sam是我编程旅程中的指南针。耐心、鼓励，总是准备着有用的提示——他让航行在编码的海洋中变得不再那么令人生畏。",
      invitation: "那么，为什么要在关于我的部分中分享这些呢？嗯，我不仅仅是在分享我的故事；我邀请您加入我的旅程。无论您是对小企业生活的混乱感兴趣，对编码冒险感到好奇，还是只是想看看两者的碰撞——您都受欢迎。",
      thanks: "为了编码、混乱以及介于两者之间的一切，以及对Sam的衷心感谢！"
    }
  }
};

// 获取翻译文本
window.t = function(key) {
  const keys = key.split('.');
  let value = translations[currentLanguage];

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key;
    }
  }

  return value;
}

// 获取产品名称的翻译
window.translateProductName = function(name) {
  if (!name) return name;
  
  // 获取当前语言的产品名称翻译
  const productNames = translations[currentLanguage].productNames;
  
  // 如果找到翻译则返回，否则返回原始名称
  return productNames && productNames[name] ? productNames[name] : name;
};

// 更新日期选择器的语言
function updateDatePickers() {
  // 更新所有日期选择器的语言属性
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(dateInput => {
    // 根据当前语言设置日期格式
    if (currentLanguage === 'zh') {
      dateInput.setAttribute('lang', 'zh-CN');
      dateInput.setAttribute('data-lang', 'zh-CN');
    } else {
      dateInput.setAttribute('lang', 'en-US');
      dateInput.setAttribute('data-lang', 'en-US');
    }

    // 强制触发change事件以更新日期选择器UI
    const event = new Event('change', { bubbles: true });
    dateInput.dispatchEvent(event);

    // 强制触发blur和focus事件以刷新日期选择器
    const blurEvent = new Event('blur', { bubbles: true });
    dateInput.dispatchEvent(blurEvent);

    const focusEvent = new Event('focus', { bubbles: true });
    dateInput.dispatchEvent(focusEvent);

    // 强制触发input事件以更新日期选择器UI
    const inputEvent = new Event('input', { bubbles: true });
    dateInput.dispatchEvent(inputEvent);
  });
}

// 更新页面上的所有翻译
function updateTranslations() {
  // 更新带有data-i18n属性的元素 (排除 option 和 optgroup，防止内部选项被清空)
  const elements = document.querySelectorAll('[data-i18n]:not(option):not(optgroup)');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = window.t(key);
    if (translation) {
      // 检查元素是否有子元素（除了文本节点）
      const hasChildElements = Array.from(element.childNodes).some(node => 
        node.nodeType === Node.ELEMENT_NODE
      );

      if (hasChildElements) {
        // 如果有子元素，先清空元素内容，然后重新插入HTML
        element.innerHTML = translation;
      } else {
        // 如果没有子元素，直接更新文本内容
        element.textContent = translation;
      }
    }
  });

  // 更新带有data-i18n-placeholder属性的元素
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = window.t(key);
    if (translation) {
      element.placeholder = translation;
    }
  });

  // 更新select选项的翻译
  const selectElements = document.querySelectorAll('select');
  selectElements.forEach(select => {
    const options = select.querySelectorAll('option[data-i18n]');
    options.forEach(option => {
      const key = option.getAttribute('data-i18n');
      const translation = window.t(key);
      // 只有当翻译存在且不是原始键时才更新文本内容
      if (translation && translation !== key) {
        option.textContent = translation;
      }
      // 如果翻译失败或与原始键相同，保持原始文本内容不变
    });

    // 更新optgroup的翻译
    const optgroups = select.querySelectorAll('optgroup[data-i18n]');
    optgroups.forEach(optgroup => {
      const key = optgroup.getAttribute('data-i18n');
      const translation = window.t(key);
      if (translation) {
        optgroup.label = translation;
      }
    });
  });

  // 更新带有data-i18n-title属性的元素
  const titleElements = document.querySelectorAll('[data-i18n-title]');
  titleElements.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = window.t(key);
    if (translation) {
      element.title = translation;
    }
  });

  // 更新日期选择器的本地化
  updateDatePickers();
}

// 切换语言
function changeLanguage(lang) {
  // 更新当前语言
  currentLanguage = lang;

  // 保存到localStorage
  localStorage.setItem('bizTrackLanguage', lang);

  // 更新html标签的lang属性
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  // 更新页面上的所有翻译
  updateTranslations();

  // 保存表单数据
  const orderForm = document.getElementById('order-form');
  const transactionForm = document.getElementById('transaction-form');

  let orderFormData = null;
  let transactionFormData = null;

  if (orderForm) {
    orderFormData = {
      orderId: document.getElementById('order-id').value,
      orderDate: document.getElementById('order-date').value,
      itemName: document.getElementById('item-name').value,
      itemPrice: document.getElementById('item-price').value,
      qtyBought: document.getElementById('qty-bought').value,
      shipping: document.getElementById('shipping').value,
      taxes: document.getElementById('taxes').value,
      orderTotal: document.getElementById('order-total').value,
      orderStatus: document.getElementById('order-status').value
    };
  }

  if (transactionForm) {
    transactionFormData = {
      trDate: document.getElementById('tr-date').value,
      trCategory: document.getElementById('tr-category').value,
      trAmount: document.getElementById('tr-amount').value,
      trNotes: document.getElementById('tr-notes').value
    };
  }

  // 更新日期选择器的语言
  updateDatePickers();

  // 恢复表单数据
  if (orderForm && orderFormData) {
    document.getElementById('order-id').value = orderFormData.orderId;
    document.getElementById('order-date').value = orderFormData.orderDate;
    document.getElementById('item-name').value = orderFormData.itemName;
    document.getElementById('item-price').value = orderFormData.itemPrice;
    document.getElementById('qty-bought').value = orderFormData.qtyBought;
    document.getElementById('shipping').value = orderFormData.shipping;
    document.getElementById('taxes').value = orderFormData.taxes;
    document.getElementById('order-total').value = orderFormData.orderTotal;
    document.getElementById('order-status').value = orderFormData.orderStatus;
  }

  if (transactionForm && transactionFormData) {
    document.getElementById('tr-date').value = transactionFormData.trDate;
    document.getElementById('tr-category').value = transactionFormData.trCategory;
    document.getElementById('tr-amount').value = transactionFormData.trAmount;
    document.getElementById('tr-notes').value = transactionFormData.trNotes;
  }

  // 更新图表的翻译
  updateChartTranslations();

  // 更新Flatpickr日期选择器的语言
  const flatpickrInstances = document.querySelectorAll('.flatpickr-input');
  flatpickrInstances.forEach(instance => {
    const fp = instance._flatpickr;
    if (fp) {
      fp.set('locale', currentLanguage === 'zh' ? 'zh' : 'default');
      // 更新placeholder
      instance.placeholder = currentLanguage === 'zh' ? '年-月-日' : 'YYYY-MM-DD';

      // 更新今天和清除按钮的文本
      const todayButton = fp.calendarContainer.querySelector('.flatpickr-today-button');
      const clearButton = fp.calendarContainer.querySelector('.flatpickr-clear-button');
      if (todayButton) {
        todayButton.textContent = currentLanguage === 'zh' ? '今天' : 'Today';
      }
      if (clearButton) {
        clearButton.textContent = currentLanguage === 'zh' ? '清除' : 'Clear';
      }
    }
  });

  // 更新语言选择器的值
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.value = lang;
  }

  // 更新卡片内容
  if (typeof updateCardContent === 'function') {
    updateCardContent();
  }

  // 在Products页面重新渲染表格
  if (window.location.pathname.includes('products.html')) {
    if (typeof renderProducts === 'function') {
      const products = JSON.parse(localStorage.getItem('bizTrackProducts')) || [];
      renderProducts(products);
    }
  }

  // 在Orders页面重新渲染表格
  if (window.location.pathname.includes('orders.html')) {
    if (typeof renderOrders === 'function') {
      const orders = JSON.parse(localStorage.getItem('bizTrackOrders')) || [];
      renderOrders(orders);
    }
  }

  // 在Expenses页面重新渲染表格
  if (window.location.pathname.includes('finances.html')) {
    if (typeof renderTransactions === 'function') {
      const transactions = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [];
      renderTransactions(transactions);
    }
    // 更新提交按钮的文本
    if (typeof updateSubmitButtonText === 'function') {
      updateSubmitButtonText();
    }
  }

  if (window.location.pathname.includes('history.html')) {
    if (typeof window.refreshHistoryLogs === 'function') {
      window.refreshHistoryLogs();
    }
  }

  // 强制刷新日期选择器
  setTimeout(() => {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(dateInput => {
      const currentValue = dateInput.value;
      const id = dateInput.id;
      const name = dateInput.name;
      const required = dateInput.required;
      const className = dateInput.className;
      const placeholder = dateInput.placeholder;

      // 根据当前语言设置日期格式
      const langValue = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';

      // 创建新的日期输入元素
      const newDateInput = document.createElement('input');
      newDateInput.type = 'date';
      newDateInput.id = id;
      newDateInput.name = name;
      newDateInput.required = required;
      newDateInput.className = className;
      newDateInput.lang = langValue;
      newDateInput.placeholder = placeholder;
      newDateInput.value = currentValue;

      // 替换旧元素
      const parent = dateInput.parentNode;
      parent.replaceChild(newDateInput, dateInput);

      // 触发多个事件以强制刷新日期选择器
      setTimeout(() => {
        const events = ['click', 'focus', 'blur', 'change', 'input'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          newDateInput.dispatchEvent(event);
        });
      }, 0);
    });

  }, 100);
}

// 更新图表的翻译
function updateChartTranslations() {
  // 在Dashboard页面不重新加载，而是更新图表和卡片内容
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    // 更新卡片内容
    if (typeof updateCardContent === 'function') {
      updateCardContent();
    }

    // 尝试直接更新图表的语言
    if (typeof window.chart !== 'undefined' && window.chart) {
      // 使用i18n.js中的currentLanguage变量
      const currentLang = currentLanguage;

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

      // 获取原始类别数据
      const items = JSON.parse(localStorage.getItem('bizTrackProducts')) || [];
      const categorySalesData = typeof calculateCategorySales === 'function' ? calculateCategorySales(items) : {};
      const sortedCategorySales = Object.entries(categorySalesData)
        .sort(([, a], [, b]) => b - a)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      // 翻译类别名称
      const translatedCategories = Object.keys(sortedCategorySales).map(category =>
        categoryTranslations[currentLang][category] || category
      );

      // 合并所有更新到一个updateOptions调用中
      window.chart.updateOptions({
        yaxis: {
          title: {
            text: chartTranslations[currentLang].totalSalesYAxis,
          }
        },
        xaxis: {
          categories: translatedCategories
        },
        series: [{
          name: chartTranslations[currentLang].totalSales,
          data: Object.values(sortedCategorySales)
        }]
      }, false); // 添加false参数，避免重新渲染整个图表
    }

    // 尝试直接更新Donut Chart的语言
    if (typeof window.donutChart !== 'undefined' && window.donutChart) {
      // 使用i18n.js中的currentLanguage变量
      const currentLang = currentLanguage;

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

      // 获取原始类别数据
      const expItems = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [];
      const categoryExpData = typeof calculateCategoryExp === 'function' ? calculateCategoryExp(expItems) : {};

      // 翻译类别名称
      const translatedExpCategories = Object.keys(categoryExpData).map(category =>
        expCategoryTranslations[currentLang][category] || category
      );

      // 更新Donut Chart的标签
      window.donutChart.updateOptions({
        labels: translatedExpCategories
      }, false); // 添加false参数，避免重新渲染整个图表
    }
  }
}

// 初始化i18n
function initI18n() {
  // 从localStorage中读取当前语言
  const savedLanguage = localStorage.getItem('bizTrackLanguage');

  if (savedLanguage) {
    currentLanguage = savedLanguage;
  }

  // 初始化html标签的lang属性
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';

  // 设置语言选择器的初始值
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.value = currentLanguage;

    // 添加语言选择器的事件监听器
    languageSelector.addEventListener('change', function(e) {
      changeLanguage(e.target.value);
    });
  }

  // 更新页面上的所有翻译
  updateTranslations();

  // 更新日期选择器的语言
  updateDatePickers();

  // 更新Flatpickr日期选择器的语言
  const flatpickrInstances = document.querySelectorAll('.flatpickr-input');
  flatpickrInstances.forEach(instance => {
    const fp = instance._flatpickr;
    if (fp) {
      fp.set('locale', currentLanguage === 'zh' ? 'zh' : 'default');
      // 更新placeholder
      instance.placeholder = currentLanguage === 'zh' ? '年-月-日' : 'YYYY-MM-DD';

      // 更新今天和清除按钮的文本
      const todayButton = fp.calendarContainer.querySelector('.flatpickr-today-button');
      const clearButton = fp.calendarContainer.querySelector('.flatpickr-clear-button');
      if (todayButton) {
        todayButton.textContent = currentLanguage === 'zh' ? '今天' : 'Today';
      }
      if (clearButton) {
        clearButton.textContent = currentLanguage === 'zh' ? '清除' : 'Clear';
      }
    }
  });

  // 延迟更新日期选择器，确保DOM完全加载
  setTimeout(() => {
    updateDatePickers();

    // 强制刷新日期选择器
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(dateInput => {
      const currentValue = dateInput.value;
      const id = dateInput.id;
      const name = dateInput.name;
      const required = dateInput.required;
      const className = dateInput.className;
      const placeholder = dateInput.placeholder;

      // 根据当前语言设置日期格式
      const langValue = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';

      // 创建新的日期输入元素
      const newDateInput = document.createElement('input');
      newDateInput.type = 'date';
      newDateInput.id = id;
      newDateInput.name = name;
      newDateInput.required = required;
      newDateInput.className = className;
      newDateInput.lang = langValue;
      newDateInput.placeholder = placeholder;
      newDateInput.value = currentValue;

      // 替换旧元素
      const parent = dateInput.parentNode;
      parent.replaceChild(newDateInput, dateInput);
    });
  }, 100);

  // 在Products页面重新渲染表格
  if (window.location.pathname.includes('products.html')) {
    if (typeof renderProducts === 'function') {
      const products = JSON.parse(localStorage.getItem('bizTrackProducts')) || [];
      renderProducts(products);
    }
  }

  // 在Orders页面重新渲染表格
  if (window.location.pathname.includes('orders.html')) {
    if (typeof renderOrders === 'function') {
      const orders = JSON.parse(localStorage.getItem('bizTrackOrders')) || [];
      renderOrders(orders);
    }
  }

  // 在Expenses页面重新渲染表格
  if (window.location.pathname.includes('finances.html')) {
    if (typeof renderTransactions === 'function') {
      const transactions = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [];
      renderTransactions(transactions);
    }
    // 更新提交按钮的文本
    if (typeof updateSubmitButtonText === 'function') {
      updateSubmitButtonText();
    }
  }

  // 在Dashboard页面更新卡片内容
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    // 延迟执行，确保script.js中的updateCardContent函数已定义
    setTimeout(function() {
      if (typeof updateCardContent === 'function') {
        updateCardContent();
      }
    }, 100);
  }

  // 监听localStorage变化，实现跨页面语言同步
  window.addEventListener('storage', function(e) {
    if (e.key === 'bizTrackLanguage' && e.newValue && e.newValue !== currentLanguage) {
      currentLanguage = e.newValue;
      updateTranslations();

      // 更新语言选择器的值
      if (languageSelector) {
        languageSelector.value = currentLanguage;
      }

      // 在Products页面重新渲染表格
      if (window.location.pathname.includes('products.html')) {
        if (typeof renderProducts === 'function') {
          const products = JSON.parse(localStorage.getItem('bizTrackProducts')) || [];
          renderProducts(products);
        }
      }

      // 在Orders页面重新渲染表格
      if (window.location.pathname.includes('orders.html')) {
        if (typeof renderOrders === 'function') {
          const orders = JSON.parse(localStorage.getItem('bizTrackOrders')) || [];
          renderOrders(orders);
        }
      }

      // 在Expenses页面重新渲染表格
      if (window.location.pathname.includes('finances.html')) {
        if (typeof renderTransactions === 'function') {
          const transactions = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [];
          renderTransactions(transactions);
        }
      }

      if (window.location.pathname.includes('history.html')) {
        if (typeof window.refreshHistoryLogs === 'function') {
          window.refreshHistoryLogs();
        }
      }

      // 在Dashboard页面更新卡片内容
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        if (typeof updateCardContent === 'function') {
          updateCardContent();
        }
      }
    }
  });
}

// 页面加载完成后初始化i18n
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initI18n();
  });
} else {
  // DOMContentLoaded已经触发，直接初始化
  initI18n();
}
