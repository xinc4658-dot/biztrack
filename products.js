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

function init() {
  // 绑定事件：选择名称后自动填类别
  document.getElementById("product-name").addEventListener("change", syncCategoryWithSelectedName);

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
    syncProductsToDb("sync", { prodID: "all-products" });
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
  const headerTranslations = {
    en: { prodID: 'Product ID', prodName: 'Product Name', prodDesc: 'Product Description', prodCategory: 'Product Category', prodPrice: 'Product Price', QtySold: 'Quantity Sold' },
    zh: { prodID: '产品ID', prodName: '产品名称', prodDesc: '产品描述', prodCategory: '产品类别', prodPrice: '产品价格', QtySold: '销售数量' }
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
