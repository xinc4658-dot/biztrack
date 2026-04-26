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

      // 翻译产品名称和类别 - 使用i18n.js中的函数
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

// ==================== 新增/修改的智能联动逻辑开始 ====================

// 产品名称与类别的映射
const productCategoryMap = {
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

// 保存原始的选项HTML结构，用于恢复
let originalProductOptionsHTML = '';

document.addEventListener('DOMContentLoaded', function() {
  const productNameSelect = document.getElementById('product-name');
  const productCategorySelect = document.getElementById('product-cat');
  
  if (productNameSelect && productCategorySelect) {
    // 保存原始的选项结构 (等待一小会儿确保 i18n 已经渲染过一次)
    setTimeout(() => {
        originalProductOptionsHTML = productNameSelect.innerHTML;
    }, 150);

    // 1. 当选择了一个具体产品时，自动填充产品类别
    productNameSelect.addEventListener('change', function() {
      const selectedProduct = this.value;
      if (productCategoryMap[selectedProduct]) {
        productCategorySelect.value = productCategoryMap[selectedProduct];
      }
    });

    // 2. 当选择了产品类别时，智能排序产品名称
    productCategorySelect.addEventListener('change', function() {
      const selectedCategory = this.value;
      smartSortProductOptions(selectedCategory, productNameSelect);
    });
  }
});

/**
 * 智能排序产品名称选项
 * @param {string} selectedCategory - 当前选中的类别
 * @param {HTMLSelectElement} productNameSelect - 产品名称选择器元素
 */
function smartSortProductOptions(selectedCategory, productNameSelect) {
  // 如果还没保存原始结构，先保存
  if (!originalProductOptionsHTML) {
    originalProductOptionsHTML = productNameSelect.innerHTML;
  }

  const currentValue = productNameSelect.value;
  
  // 1. 检查当前选中的产品是否属于新类别，如果不属于则清空
  if (currentValue && productCategoryMap[currentValue] !== selectedCategory) {
    productNameSelect.value = "";
  }

  // 2. 创建一个临时容器来存放新的顺序
  const tempContainer = document.createElement('div');
  
  // 3. 先复制一份原始的选项
  tempContainer.innerHTML = originalProductOptionsHTML;
  
  // 4. 获取所有的 optgroup
  const optgroups = tempContainer.querySelectorAll('optgroup');
  
  // 5. 创建文档片段用于重新组装
  const fragment = document.createDocumentFragment();
  
  // 6. 先把"请选择产品"的默认选项放回去
  const firstOption = tempContainer.querySelector('option[value=""][disabled]');
  if (firstOption) {
    fragment.appendChild(firstOption.cloneNode(true));
  }

  // 7. 如果选中了类别，找到对应的 optgroup 并优先放在最前面
  if (selectedCategory) {
    let priorityOptgroup = null;
    
    // 遍历寻找匹配的 optgroup
    for (let optgroup of optgroups) {
      // 这里我们通过 value 映射来反向查找，或者直接比较 label
      // 为了兼容 i18n，我们检查该组下的第一个产品属于哪个类别
      const firstOptionInGroup = optgroup.querySelector('option');
      if (firstOptionInGroup && productCategoryMap[firstOptionInGroup.value] === selectedCategory) {
        priorityOptgroup = optgroup;
        break;
      }
    }

    if (priorityOptgroup) {
      fragment.appendChild(priorityOptgroup.cloneNode(true));
      
      // 添加一个分隔线
      const separator = document.createElement('option');
      separator.disabled = true;
      separator.textContent = '──────────────';
      fragment.appendChild(separator);
    }
  }

  // 8. 添加所有其他的 optgroup（保持默认顺序）
  for (let optgroup of optgroups) {
    // 检查是否已经添加过了 (通过检查该组的第一个选项值是否已存在)
    const firstOptionVal = optgroup.querySelector('option')?.value;
    const isAlreadyAdded = fragment.querySelector(`option[value="${firstOptionVal}"]`);
    
    if (!isAlreadyAdded) {
      fragment.appendChild(optgroup.cloneNode(true));
    }
  }

  // 9. 清空并重新填充选择器
  productNameSelect.innerHTML = '';
  productNameSelect.appendChild(fragment);
  
  // 10. 重新触发 i18n 翻译，确保新插入的元素文字是对的
  if (typeof updateTranslations === 'function') {
     // 只翻译这个 select 内部，避免副作用
     const selectOptions = productNameSelect.querySelectorAll('option[data-i18n], optgroup[data-i18n]');
     selectOptions.forEach(el => {
         const key = el.getAttribute('data-i18n');
         if (key && window.t) {
             if (el.tagName === 'OPTGROUP') {
                 el.label = window.t(key);
             } else {
                 el.textContent = window.t(key);
             }
         }
     });
  }
}

// ==================== 新增/修改的智能联动逻辑结束 ====================

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