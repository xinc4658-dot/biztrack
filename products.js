
function openSidebar() {
  var side = document.getElementById('sidebar');
  side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
  document.getElementById('sidebar').style.display = 'none';
}


function openForm() {
    var form = document.getElementById("product-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("product-form").style.display = "none";
}


let products = [];

function init() {
  const storedProducts = localStorage.getItem("bizTrackProducts");
  if (storedProducts) {
      products = JSON.parse(storedProducts);
  } else {
      products = [
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
          prodName: "Sweatshirts",
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

      localStorage.setItem("bizTrackProducts", JSON.stringify(products));
    }

    renderProducts(products);
}

function addOrUpdate(event) {
  const submitBtn = document.getElementById("submitBtn");
  // 检查按钮的data-i18n属性来确定操作类型
  const i18nKey = submitBtn.getAttribute('data-i18n');
  if (i18nKey === 'products.save' && !submitBtn.dataset.isEdit) {
      newProduct(event);
  } else {
      const prodID = document.getElementById("product-id").value;
      updateProduct(prodID);
  }
}

function newProduct(event) {
  event.preventDefault();
  const prodID = document.getElementById("product-id").value;
  const prodName = document.getElementById("product-name").value;
  const prodDesc = document.getElementById("product-desc").value;
  const prodCat = document.getElementById("product-cat").value;
  const prodPrice = parseFloat(document.getElementById("product-price").value);
  const prodSold = parseInt(document.getElementById("product-sold").value);

  if (isDuplicateID(prodID, null)) {
    alert("Product ID already exists. Please use a unique ID.");
    return;
  }

  const product = {
    prodID,
    prodName,
    prodDesc,
    prodCat,
    prodPrice,
    prodSold,
  };

  products.push(product);

  renderProducts(products);
  localStorage.setItem("bizTrackProducts", JSON.stringify(products));

  document.getElementById("product-form").reset();
}


function renderProducts(products) {
  const prodTableBody = document.getElementById("tableBody");
  prodTableBody.innerHTML = "";

  const prodToRender = products;

  prodToRender.forEach(product => {
      const prodRow = document.createElement("tr");
      prodRow.className = "product-row";

      prodRow.dataset.prodID = product.prodID;
      prodRow.dataset.prodName = product.prodName;
      prodRow.dataset.prodDesc = product.prodDesc;
      prodRow.dataset.prodCat = product.prodCat;
      prodRow.dataset.prodPrice = product.prodPrice;
      prodRow.dataset.prodSold = product.prodSold;

      // 翻译产品名称和类别
      const translatedName = translateProductName(product.prodName);
      const translatedCat = translateProductCategory(product.prodCat);
      
      prodRow.innerHTML = `
          <td>${product.prodID}</td>
          <td>${translatedName}</td>
          <td>${product.prodDesc}</td>
          <td>${translatedCat}</td>
          <td>$${product.prodPrice.toFixed(2)}</td>
          <td>${product.prodSold}</td>
          <td class="action">
            <i title="Edit" onclick="editRow('${product.prodID}')" class="edit-icon fa-solid fa-pen-to-square"></i>
            <i onclick="deleteProduct('${product.prodID}')" class="delete-icon fas fa-trash-alt"></i>
          </td>
      `;
      prodTableBody.appendChild(prodRow);
  });
}

function editRow(prodID) {
  const productToEdit = products.find(product => product.prodID === prodID);

  document.getElementById("product-id").value = productToEdit.prodID;
  document.getElementById("product-name").value = productToEdit.prodName;
  document.getElementById("product-desc").value = productToEdit.prodDesc;
  document.getElementById("product-cat").value = productToEdit.prodCat;
  document.getElementById("product-price").value = productToEdit.prodPrice;
  document.getElementById("product-sold").value = productToEdit.prodSold;

  document.getElementById("submitBtn").dataset.isEdit = true;

  document.getElementById("product-form").style.display = "block";
}

function deleteProduct(prodID) {
  const indexToDelete = products.findIndex(product => product.prodID === prodID);

  if (indexToDelete !== -1) {
      products.splice(indexToDelete, 1);

      localStorage.setItem("bizTrackProducts", JSON.stringify(products));

      renderProducts(products);
  }
}

function updateProduct(prodID) {
    const indexToUpdate = products.findIndex(product => product.prodID === prodID);

    if (indexToUpdate !== -1) {
        const updatedProduct = {
            prodID: document.getElementById("product-id").value,
            prodName: document.getElementById("product-name").value,
            prodDesc: document.getElementById("product-desc").value,
            prodCat: document.getElementById("product-cat").value,
            prodPrice: parseFloat(document.getElementById("product-price").value),
            prodSold: parseInt(document.getElementById("product-sold").value),
        };

        if (isDuplicateID(updatedProduct.prodID, prodID)) {
            alert("Product ID already exists. Please use a unique ID.");
            return;
        }

        products[indexToUpdate] = updatedProduct;

        localStorage.setItem("bizTrackProducts", JSON.stringify(products));

        renderProducts(products);

        document.getElementById("product-form").reset();
        document.getElementById("submitBtn").dataset.isEdit = false;
    }
}

function isDuplicateID(prodID, currentID) {
    return products.some(product => product.prodID === prodID && product.prodID !== currentID);
}

// 翻译产品名称
function translateProductName(name) {
  if (!name) return name;
  
  // 获取当前语言，优先使用i18n.js中的currentLanguage变量
  let currentLang = 'en';
  if (typeof currentLanguage !== 'undefined') {
    currentLang = currentLanguage;
  } else {
    currentLang = localStorage.getItem('bizTrackLanguage') || 'en';
  }
  
  // 产品名称翻译映射
  const translations = {
    en: {
      'Baseball caps': 'Baseball caps',
      'Snapbacks': 'Snapbacks',
      'Beanies': 'Beanies',
      'Bucket hats': 'Bucket hats',
      'Mugs': 'Mugs',
      'Water bottles': 'Water bottles',
      'Tumblers': 'Tumblers',
      'T-shirts': 'T-shirts',
      'Sweatshirts': 'Sweatshirts',
      'Hoodies': 'Hoodies',
      'Pillow cases': 'Pillow cases',
      'Tote bags': 'Tote bags',
      'Stickers': 'Stickers',
      'Posters': 'Posters',
      'Framed posters': 'Framed posters',
      'Canvas prints': 'Canvas prints'
    },
    zh: {
      'Baseball caps': '棒球帽',
      'Snapbacks': '平沿帽',
      'Beanies': '无檐便帽',
      'Bucket hats': '渔夫帽',
      'Mugs': '马克杯',
      'Water bottles': '水瓶',
      'Tumblers': '平底杯',
      'T-shirts': 'T恤',
      'Sweatshirts': '运动衫',
      'Hoodies': '连帽衫',
      'Pillow cases': '枕套',
      'Tote bags': '托特包',
      'Stickers': '贴纸',
      'Posters': '海报',
      'Framed posters': '装裱海报',
      'Canvas prints': '帆布画'
    }
  };
  
  return translations[currentLang][name] || name;
}

// 翻译产品类别
function translateProductCategory(category) {
  if (!category) return category;
  
  // 获取当前语言，优先使用i18n.js中的currentLanguage变量
  let currentLang = 'en';
  if (typeof currentLanguage !== 'undefined') {
    currentLang = currentLanguage;
  } else {
    currentLang = localStorage.getItem('bizTrackLanguage') || 'en';
  }
  
  // 产品类别翻译映射
  const translations = {
    en: {
      'Hats': 'Hats',
      'Drinkware': 'Drinkware',
      'Clothing': 'Clothing',
      'Accessories': 'Accessories',
      'Home decor': 'Home decor'
    },
    zh: {
      'Hats': '帽子',
      'Drinkware': '饮具',
      'Clothing': '服装',
      'Accessories': '配饰',
      'Home decor': '家居装饰'
    }
  };
  
  return translations[currentLang][category] || category;
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "prodPrice" || column === "prodSold";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
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
    const rows = document.querySelectorAll(".product-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


function exportToCSV() {
  const currentLanguage = localStorage.getItem('bizTrackLanguage') || 'en';

  // 根据当前语言获取表头翻译
  const headerTranslations = {
    en: {
      prodID: 'Product ID',
      prodName: 'Product Name',
      prodDesc: 'Product Description',
      prodCategory: 'Product Category',
      prodPrice: 'Product Price',
      QtySold: 'Quantity Sold'
    },
    zh: {
      prodID: '产品ID',
      prodName: '产品名称',
      prodDesc: '产品描述',
      prodCategory: '产品类别',
      prodPrice: '产品价格',
      QtySold: '销售数量'
    }
  };

  const headers = headerTranslations[currentLanguage];

  const productsToExport = products.map(product => {
      return {
        prodID: product.prodID,
        prodName: product.prodName,
        prodDesc: product.prodDesc,
        prodCategory: product.prodCat,
        prodPrice: product.prodPrice.toFixed(2),
        QtySold: product.prodSold,
      };
  });

  const csvContent = generateCSV(productsToExport, headers);

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
  link.download = currentLanguage === 'zh' ? 'biztrack_产品表.csv' : 'biztrack_product_table.csv';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
}

function generateCSV(data, headers) {
  const headerRow = Object.keys(headers).map(key => headers[key]).join(',');
  const rows = data.map(order => Object.values(order).join(','));

  return `${headerRow}\n${rows.join('\n')}`;
}

// 确保在DOM加载完成后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // 等待i18n.js初始化完成
    setTimeout(init, 100);
  });
} else {
  // DOM已经加载完成，等待i18n.js初始化完成
  setTimeout(init, 100);
}