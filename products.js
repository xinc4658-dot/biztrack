function debounce(fn, delay = 250) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

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

async function syncProductsToDb(action, record, beforeRecord) {
  if (!window.biztrackDbHelpers || !window.biztrackDbHelpers.isReady()) {
    return;
  }

  try {
    await window.biztrackDbHelpers.syncCollection("products", products, "prodID");
    if (action) {
      await window.biztrackDbHelpers.logActivity("products", action, record.prodID, record, beforeRecord);
    }
  } catch (error) {
    console.error("Products database sync failed:", error);
  }
}

// 产品名称 -> 类别的映射 (用于自动填充；与存储的 prodCat 英文值一致)
let productCategoryMap = {
  'Baseball caps': 'Hats',
  'Snapbacks': 'Hats',
  'Beanies': 'Hats',
  'Bucket hats': 'Hats',
  'Mugs': 'Drinkware',
  'Water bottles': 'Drinkware',
  'Tumblers': 'Drinkware',
  'T-shirts': 'Clothing',
  'Sweatshirts': 'Clothing',
  'Hoodies': 'Clothing',
  'Pillow cases': 'Accessories',
  'Tote bags': 'Accessories',
  'Stickers': 'Accessories',
  'Posters': 'Home decor',
  'Framed posters': 'Home decor',
  'Canvas prints': 'Home decor'
};

// 当选择产品名称时，自动填充类别
function syncCategoryWithSelectedName() {
  const prodName = document.getElementById("product-name").value;
  const prodCat = productCategoryMap[prodName];
  if (prodCat) {
    document.getElementById("product-cat").value = prodCat;
  }
}

function isNameCategoryPairValid(prodName, prodCat) {
  const expectedCategory = productCategoryMap[prodName];
  return expectedCategory && expectedCategory === prodCat;
}

// 默认商品：顺序与表单下拉一致 — Hats → Drinkware → Clothing → Accessories → Home decor
var PRODUCTS_CATALOG_VERSION = "full-16-v1";
var DEFAULT_PRODUCTS_FULL = [
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

function loadProductsFromStorage() {
  var storedProducts = localStorage.getItem("bizTrackProducts");
  var catalogVersion = localStorage.getItem("bizTrackProductsCatalogVersion");
  var needsFullCatalog =
    !storedProducts ||
    catalogVersion !== PRODUCTS_CATALOG_VERSION;

  if (needsFullCatalog) {
    products = DEFAULT_PRODUCTS_FULL.map(function (row) {
      return Object.assign({}, row);
    });
    localStorage.setItem("bizTrackProducts", JSON.stringify(products));
    localStorage.setItem("bizTrackProductsCatalogVersion", PRODUCTS_CATALOG_VERSION);
    return;
  }

  products = JSON.parse(storedProducts);
}

function init() {
  // 绑定事件：选择名称后自动填类别
  document.getElementById("product-name").addEventListener("change", syncCategoryWithSelectedName);

  loadProductsFromStorage();
  renderProducts(products);
  syncProductsToDb("sync", { prodID: "all-products" });
  handleQuickAddOpen();
}

function handleQuickAddOpen() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("quickAdd") !== "1") return;

  const form = document.getElementById("product-form");
  if (!form) return;

  form.style.display = "block";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addOrUpdate(event) {
  event.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
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
  const prodID = document.getElementById("product-id").value.trim();
  const prodName = document.getElementById("product-name").value.trim();
  const prodDesc = document.getElementById("product-desc").value.trim();
  const prodCat = document.getElementById("product-cat").value.trim();
  const prodPriceInput = document.getElementById("product-price").value.trim();
  const prodSoldInput = document.getElementById("product-sold").value.trim();

  // 空输入校验
  if (!prodID) {
    alert(window.t("common.required", { field: window.t("products.productId") }));
    return;
  }
  if (!prodName) {
    alert(window.t("common.required", { field: window.t("products.productName") }));
    return;
  }
  if (!prodCat) {
    alert(window.t("common.required", { field: window.t("products.productCategory") }));
    return;
  }
  if (!prodPriceInput) {
    alert(window.t("common.required", { field: window.t("products.productPrice") }));
    return;
  }
  if (!prodSoldInput) {
    alert(window.t("common.required", { field: window.t("products.productSold") }));
    return;
  }

  // 数字类型校验
  const prodPrice = parseFloat(prodPriceInput);
  const prodSold = parseInt(prodSoldInput);
  if (isNaN(prodPrice)) {
    alert(window.t("common.invalidNumber", { field: window.t("products.productPrice") }));
    return;
  }
  if (isNaN(prodSold)) {
    alert(window.t("common.invalidNumber", { field: window.t("products.productSold") }));
    return;
  }

  if (isDuplicateID(prodID, null)) {
    alert(window.t("common.productIdExists"));
    return;
  }

  if (!isNameCategoryPairValid(prodName, prodCat)) {
    alert(window.t("common.categoryMustMatch"));
    return;
  }

  const product = { prodID, prodName, prodDesc, prodCat, prodPrice, prodSold };
  products.push(product);

  renderProducts(products);
  localStorage.setItem("bizTrackProducts", JSON.stringify(products));
  syncProductsToDb("create", product);

  document.getElementById("product-form").reset();
}

function renderProducts(products) {
  const prodTableBody = document.getElementById("tableBody");
  prodTableBody.innerHTML = "";

  products.forEach(product => {
      const prodRow = document.createElement("tr");
      prodRow.className = "product-row";
      prodRow.dataset.prodID = product.prodID;
      prodRow.dataset.prodName = product.prodName;
      prodRow.dataset.prodDesc = product.prodDesc;
      prodRow.dataset.prodCat = product.prodCat;
      prodRow.dataset.prodPrice = product.prodPrice;
      prodRow.dataset.prodSold = product.prodSold;

      const translatedName = typeof translateProductName === 'function' ? translateProductName(product.prodName) : product.prodName;
      const translatedCat = window.t(`products.${product.prodCat.toLowerCase()}`) || product.prodCat;
      
      // 【新增】对可能包含恶意代码的用户输入进行 XSS 转义
      const safeName = window.escapeHTML(translatedName);
      const safeDesc = window.escapeHTML(product.prodDesc);

      prodRow.innerHTML = `
          <td>${product.prodID}</td>
          <td>${safeName}</td>
          <td>${safeDesc}</td>
          <td>${translatedCat}</td>
          <td>$${product.prodPrice.toFixed(2)}</td>
          <td>${product.prodSold}</td>
          <td class="action">
            <button title="Edit" onclick="editRow('${product.prodID}')" class="edit-icon fa-solid fa-pen-to-square" aria-label="Edit order"></button>
            <button title="Delete" onclick="deleteProduct('${product.prodID}')" class="delete-icon fas fa-trash-alt" aria-label="Delete order"></button>
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

  syncCategoryWithSelectedName(); // 编辑时也确保类别对应

}

function deleteProduct(prodID) {
  const indexToDelete = products.findIndex(product => product.prodID === prodID);
  if (indexToDelete !== -1) {
      const deletedProduct = { ...products[indexToDelete] };
      products.splice(indexToDelete, 1);
      localStorage.setItem("bizTrackProducts", JSON.stringify(products));
      renderProducts(products);
      syncProductsToDb("delete", { prodID }, deletedProduct);
  }
}

function updateProduct(prodID) {
    const indexToUpdate = products.findIndex(product => product.prodID === prodID);
    if (indexToUpdate !== -1) {
        const beforeProduct = { ...products[indexToUpdate] };
        const updatedId = document.getElementById("product-id").value.trim();
        const updatedName = document.getElementById("product-name").value.trim();
        const updatedDesc = document.getElementById("product-desc").value.trim();
        const updatedCat = document.getElementById("product-cat").value.trim();
        const updatedPriceInput = document.getElementById("product-price").value.trim();
        const updatedSoldInput = document.getElementById("product-sold").value.trim();

        if (!updatedId) {
            alert(window.t("common.required", { field: window.t("products.productId") }));
            return;
        }
        if (!updatedName) {
            alert(window.t("common.required", { field: window.t("products.productName") }));
            return;
        }
        if (!updatedCat) {
            alert(window.t("common.required", { field: window.t("products.productCategory") }));
            return;
        }
        if (!updatedPriceInput) {
            alert(window.t("common.required", { field: window.t("products.productPrice") }));
            return;
        }
        if (!updatedSoldInput) {
            alert(window.t("common.required", { field: window.t("products.productSold") }));
            return;
        }

        const updatedPrice = parseFloat(updatedPriceInput);
        const updatedSold = parseInt(updatedSoldInput);
        if (isNaN(updatedPrice)) {
            alert(window.t("common.invalidNumber", { field: window.t("products.productPrice") }));
            return;
        }
        if (isNaN(updatedSold)) {
            alert(window.t("common.invalidNumber", { field: window.t("products.productSold") }));
            return;
        }

        const updatedProduct = {
            prodID: updatedId,
            prodName: updatedName,
            prodDesc: updatedDesc,
            prodCat: updatedCat,
            prodPrice: updatedPrice,
            prodSold: updatedSold,
        };

        if (isDuplicateID(updatedProduct.prodID, prodID)) {
            alert(window.t("common.productIdExists"));
            return;
        }

        if (!isNameCategoryPairValid(updatedProduct.prodName, updatedProduct.prodCat)) {
            alert(window.t("common.categoryMustMatch"));
            return;
        }

        products[indexToUpdate] = updatedProduct;
        localStorage.setItem("bizTrackProducts", JSON.stringify(products));
        renderProducts(products);
        syncProductsToDb("update", updatedProduct, beforeProduct);

        document.getElementById("product-form").reset();
        document.getElementById("submitBtn").dataset.isEdit = false;
    }
}

function isDuplicateID(prodID, currentID) {
    return products.some(product => product.prodID === prodID && product.prodID !== currentID);
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

    tbody.replaceChildren(...sortedRows);
}

document.getElementById("searchInput").addEventListener("input", debounce(performSearch, 250));

function performSearch() {
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();

    if (!keyword) {
        renderProducts(products);
        return;
    }

    const filteredProducts = products.filter(product => {
        const translatedName = typeof translateProductName === "function"
            ? translateProductName(product.prodName)
            : product.prodName;

        const translatedCategory = typeof window.t === "function"
            ? window.t(`products.${String(product.prodCat).toLowerCase()}`)
            : product.prodCat;

        return [
            product.prodID,
            product.prodName,
            translatedName,
            product.prodDesc,
            product.prodCat,
            translatedCategory,
            product.prodPrice,
            product.prodSold
        ].some(value => String(value).toLowerCase().includes(keyword));
    });

    renderProducts(filteredProducts);
}

function exportToCSV() {
  const currentLanguage = localStorage.getItem('bizTrackLanguage') || 'en';
  const headerTranslations = {
    en: { prodID: 'Product ID', prodName: 'Product Name', prodDesc: 'Product Description', prodCategory: 'Product Category', prodPrice: 'Product Price', QtySold: 'Stock Quantity' },
    zh: { prodID: '产品ID', prodName: '产品名称', prodDesc: '产品描述', prodCategory: '产品类别', prodPrice: '产品价格', QtySold: '库存量' }
  };

  const headers = headerTranslations[currentLanguage];
  const productsToExport = products.map(product => ({
        prodID: product.prodID,
        prodName: product.prodName,
        prodDesc: product.prodDesc,
        prodCategory: product.prodCat,
        prodPrice: product.prodPrice.toFixed(2),
        QtySold: product.prodSold,
  }));

  const csvContent = generateCSV(productsToExport, headers);
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

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(init, 100);
  });
} else {
  setTimeout(init, 100);
}
