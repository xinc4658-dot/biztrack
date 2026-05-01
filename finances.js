// finances.js
function escapeCSVValue(value) {
    const text = String(value ?? "");
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function translate(key, fallback) {
    return window.t ? window.t(key) : fallback;
}

function translateExpenseCategoryForExport(category) {
    const translations = {
        Rent: translate('expenses.rent', 'Rent'),
        Utilities: translate('expenses.utilities', 'Utilities'),
        Supplies: translate('expenses.supplies', 'Supplies'),
        'Order Fulfillment': translate('expenses.orderFulfillment', 'Order Fulfillment'),
        Miscellaneous: translate('expenses.miscellaneous', 'Miscellaneous'),
    };

    return translations[category] || category;
}
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
    var form = document.getElementById("transaction-form")
    console.log('Form display before toggle:', form.style.display);
    form.style.display = (form.style.display === "block") ? "none" : "block";
    console.log('Form display after toggle:', form.style.display);
}

function closeForm() {
    document.getElementById("transaction-form").style.display = "none";
}


let transactions = [];
let serialNumberCounter;

async function syncExpensesToDb(action, record, beforeRecord) {
    if (!window.biztrackDbHelpers || !window.biztrackDbHelpers.isReady()) {
        return;
    }

    try {
        await window.biztrackDbHelpers.syncCollection("expenses", transactions, "trID");
        if (action) {
            await window.biztrackDbHelpers.logActivity("expenses", action, record.trID, record, beforeRecord);
        }
    } catch (error) {
        console.error("Expenses database sync failed:", error);
    }
}

function getCurrentLang() {
    return window.getCurrentLanguage ? window.getCurrentLanguage() : localStorage.getItem('bizTrackLanguage') || 'en';
}

function initTransactionDatePicker() {
    const currentLang = getCurrentLang();
    const datePickerConfig = window.datePickerI18n ? window.datePickerI18n[currentLang] : null;
    const trDateInput = document.getElementById('tr-date');

    if (!trDateInput) return;

    trDateInput.placeholder = translate('expenses.datePlaceholder', 'YYYY-MM-DD');

    const createCustomButtons = (instance) => {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flatpickr-custom-buttons';
        buttonsContainer.style.cssText = 'display: flex; justify-content: space-between; padding: 10px;';

        const todayButton = document.createElement('button');
        todayButton.type = 'button';
        todayButton.className = 'flatpickr-today-button';
        todayButton.textContent = datePickerConfig ? datePickerConfig.today : translate('common.today', 'Today');
        todayButton.style.cssText = 'background: #4a90e2; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;';
        todayButton.onclick = () => {
            instance.setDate(new Date());
        };

        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'flatpickr-clear-button';
        clearButton.textContent = datePickerConfig ? datePickerConfig.clear : translate('common.clear', 'Clear');
        clearButton.style.cssText = 'background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;';
        clearButton.onclick = () => {
            instance.clear();
        };

        buttonsContainer.appendChild(todayButton);
        buttonsContainer.appendChild(clearButton);
        return buttonsContainer;
    };

    const trDateInputExisting = document.getElementById('tr-date');
    if (trDateInputExisting._flatpickr) {
        trDateInputExisting._flatpickr.destroy();
    }

    flatpickr(trDateInputExisting, {
        dateFormat: 'Y-m-d',
        locale: (currentLang === 'zh' || currentLang === 'zhTW') ? 'zh' : 'default',
        allowInput: true,
        onReady: function(selectedDates, dateStr, instance) {
            const calendarContainer = instance.calendarContainer;
            const buttonsContainer = createCustomButtons(instance);
            calendarContainer.appendChild(buttonsContainer);
        },
        onChange: function(selectedDates, dateStr, instance) {
            const todayButton = instance.calendarContainer.querySelector('.flatpickr-today-button');
            const clearButton = instance.calendarContainer.querySelector('.flatpickr-clear-button');
            if (todayButton) {
                todayButton.textContent = datePickerConfig ? datePickerConfig.today : translate('common.today', 'Today');
            }
            if (clearButton) {
                clearButton.textContent = datePickerConfig ? datePickerConfig.clear : translate('common.clear', 'Clear');
            }
        }
    });
}

window.onload = function () {
    console.log('finances.js loaded');
    console.log('addOrUpdate function:', typeof addOrUpdate);
    console.log('newTransaction function:', typeof newTransaction);

    // 初始化i18n
    if (typeof initI18n === 'function') {
        initI18n();
    }

    // 添加表单的submit事件监听器
    const form = document.getElementById('transaction-form');
    console.log('Form:', form);
    if (form) {
        console.log('Form found');
        form.addEventListener('submit', function(event) {
            console.log('Form submitted');
            console.log('Event type:', event.type);
            console.log('Event target:', event.target);
            event.preventDefault();
            addOrUpdate(event);
        });
    } else {
        console.log('Form not found');
    }

    // 初始化日期选择器
    initTransactionDatePicker();

    const storedTransactions = localStorage.getItem("bizTrackTransactions");
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    } else {
        transactions = [
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

        serialNumberCounter = transactions.length + 1
  
        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));
    }
  
    renderTransactions(transactions);
    syncExpensesToDb("sync", { trID: "all-expenses" });
    handleQuickAddOpen();
    if (typeof window.addGuideButton === 'function') {
        window.addGuideButton('expenses');
    }
}

function handleQuickAddOpen() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quickAdd") !== "1") return;

    const form = document.getElementById("transaction-form");
    if (!form) return;

    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addOrUpdate(event) {
    event.preventDefault();
    const type = document.getElementById("submitBtn").textContent.trim();
    const addText = translate('expenses.add', 'Add');
    const updateText = translate('common.update', 'Update');
    const saveText = translate('expenses.save', 'Save');

    if (type === addText || type === saveText) {
        newTransaction(event);
    } else if (type === updateText) {
        const trId = document.getElementById("tr-id").value;
        updateTransaction(+trId);
    }
}

// 更新提交按钮的文本
function updateSubmitButtonText() {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        const currentText = submitBtn.textContent;
        const addText = translate('expenses.add', 'Add');
        const updateText = translate('common.update', 'Update');

        if (currentText === 'Add' || currentText === '添加') {
            submitBtn.textContent = addText;
        } else if (currentText === 'Update' || currentText === '更新') {
            submitBtn.textContent = updateText;
        }
    }
}


function newTransaction(event) {
    event.preventDefault();
    const trDateInput = document.getElementById("tr-date");
    const trDate = trDateInput.value;
    const trCategory = document.getElementById("tr-category").value;
    const trAmount = parseFloat(document.getElementById("tr-amount").value);
    const trNotes = document.getElementById("tr-notes").value;

    // 调试信息
    console.log('trDate:', trDate);
    console.log('trCategory:', trCategory);
    console.log('trAmount:', trAmount);
    console.log('trNotes:', trNotes);

    // 检查日期是否为空
    if (!trDate) {
        alert(window.t("common.selectDate"));
        return;
    }

    // 生成唯一的 trID
    let maxID = 0;
    transactions.forEach(t => {
        if (t.trID > maxID) {
            maxID = t.trID;
        }
    });
    let trID = maxID + 1;
    
    const transaction = {
      trID,
      trDate,
      trCategory,
      trAmount,
      trNotes,
    };
    
    console.log('New transaction:', transaction);
    console.log('Transactions before push:', transactions);

    transactions.push(transaction);

    console.log('Transactions after push:', transactions);
  
    renderTransactions(transactions);
    localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));
    syncExpensesToDb("create", transaction);

    serialNumberCounter = trID;
    displayExpenses();
  
    document.getElementById("transaction-form").reset();

    // 清除 Flatpickr 的日期选择
    const fp = trDateInput._flatpickr;
    if (fp) {
        fp.clear();
    }
}

// 翻译类别
function translateCategory(category) {
    const categoryTranslations = {
        'Rent': translate('expenses.rent', 'Rent'),
        'Utilities': translate('expenses.utilities', 'Utilities'),
        'Supplies': translate('expenses.supplies', 'Supplies'),
        'Order Fulfillment': translate('expenses.orderFulfillment', 'Order Fulfillment'),
        'Miscellaneous': translate('expenses.miscellaneous', 'Miscellaneous')
    };
    return categoryTranslations[category] || category;
}

function renderTransactions(transactions) {
    const transactionTableBody = document.getElementById("tableBody");
    transactionTableBody.innerHTML = "";

    // 调试信息
    console.log('renderTransactions called with:', transactions);
    console.log('transactionTableBody:', transactionTableBody);

    const transactionToRender = transactions;

    transactionToRender.forEach(transaction => {
        const transactionRow = document.createElement("tr");
        transactionRow.className = "transaction-row";

        transactionRow.dataset.trID = transaction.trID;
        transactionRow.dataset.trDate = transaction.trDate;
        transactionRow.dataset.trCategory = transaction.trCategory;
        transactionRow.dataset.trAmount = transaction.trAmount;
        transactionRow.dataset.trNotes = transaction.trNotes;

        const formattedAmount = typeof transaction.trAmount === 'number' ? `$${transaction.trAmount.toFixed(2)}` : '';
        const translatedCategory = translateCategory(transaction.trCategory);

        // 【新增】对用户输入的备注进行 XSS 净化
        const safeNotes = window.escapeHTML(transaction.trNotes);

        transactionRow.innerHTML = `
            <td>${transaction.trID}</td>
            <td>${transaction.trDate}</td>
            <td>${translatedCategory}</td>
            <td class="tr-amount">${formattedAmount}</td>
            <td>${safeNotes}</td>
            <td class="action">
                <button title="${window.t ? window.t(`common.edit`) : `Edit`}" onclick="editRow('${transaction.trID}')" class="edit-icon fa-solid fa-pen-to-square" aria-label="${window.t ? window.t(`common.edit`) : `Edit`}"></button>
                <button title="${window.t ? window.t(`common.delete`) : `Delete`}" onclick="deleteTransaction('${transaction.trID}')" class="delete-icon fas fa-trash-alt" aria-label="${window.t ? window.t(`common.delete`) : `Delete`}"></button>
            </td> 
        `;
        transactionTableBody.appendChild(transactionRow);
  });
  displayExpenses();
}

function displayExpenses() {
    const resultElement = document.getElementById("total-expenses");

    const totalExpenses = transactions
        .reduce((total, transaction) => total + transaction.trAmount,0);

    const totalExpensesText = translate('expenses.totalExpenses', 'Total Expenses: ');
    resultElement.innerHTML = `
        <span>${totalExpensesText}$${totalExpenses.toFixed(2)}</span>
    `;
}

function editRow(trID) {
    const trToEdit = transactions.find(transaction => transaction.trID == trID);
    
    document.getElementById("tr-id").value = trToEdit.trID;      
    document.getElementById("tr-date").value = trToEdit.trDate;
    document.getElementById("tr-category").value = trToEdit.trCategory;
    document.getElementById("tr-amount").value = trToEdit.trAmount;
    document.getElementById("tr-notes").value = trToEdit.trNotes;
  
    const updateText = translate('common.update', 'Update');
    document.getElementById("submitBtn").textContent = updateText;

    document.getElementById("transaction-form").style.display = "block";
  }
  
function deleteTransaction(trID) {
    const indexToDelete = transactions.findIndex(transaction => transaction.trID == trID);

    if (indexToDelete !== -1) {
        const deletedTransaction = { ...transactions[indexToDelete] };
        transactions.splice(indexToDelete, 1);

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);
        syncExpensesToDb("delete", { trID }, deletedTransaction);
    }
}

  function updateTransaction(trID) {
    const indexToUpdate = transactions.findIndex(transaction => transaction.trID === trID);

    if (indexToUpdate !== -1) {
        const beforeTransaction = { ...transactions[indexToUpdate] };
        const updatedTransaction = {
            trID: trID,
            trDate: document.getElementById("tr-date").value,
            trCategory: document.getElementById("tr-category").value,
            trAmount: parseFloat(document.getElementById("tr-amount").value),
            trNotes: document.getElementById("tr-notes").value,
        };

        transactions[indexToUpdate] = updatedTransaction;

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);
        syncExpensesToDb("update", updatedTransaction, beforeTransaction);

        document.getElementById("transaction-form").reset();
        const addText = translate('expenses.add', 'Add');
        document.getElementById("submitBtn").textContent = addText;
    }
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "trID" || column === "trAmount";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
            // Case-insensitive string comparison for text columns
            return aValue.localeCompare(bValue, undefined, { sensitivity: "base" });
        } else {
            return aValue - bValue;
        }
    });

    tbody.replaceChildren(...sortedRows);
}

document.getElementById("searchInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        performSearch();
    }
});


function performSearch() {
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();

    if (!keyword) {
        renderTransactions(transactions);
        return;
    }

    const filteredTransactions = transactions.filter(transaction => {
        const translatedCategory = typeof translateCategory === "function"
            ? translateCategory(transaction.trCategory)
            : transaction.trCategory;

        return [
            transaction.trID,
            transaction.trDate,
            transaction.trCategory,
            translatedCategory,
            transaction.trAmount,
            transaction.trNotes
        ].some(value => String(value).toLowerCase().includes(keyword));
    });

    renderTransactions(filteredTransactions);
}


function exportToCSV() {
    const transactionsToExport = transactions.map(transaction => {
        return {
            trID: transaction.trID,
            trDate: transaction.trDate,
            trCategory: translateExpenseCategoryForExport(transaction.trCategory),
            trAmount: transaction.trAmount.toFixed(2),
            trNotes: transaction.trNotes,
        };
    });
  
    const currentLanguage = getCurrentLang();
    const headers = {
        trID: translate('expenses.exportId', 'Transaction ID'),
        trDate: translate('expenses.exportDate', 'Transaction Date'),
        trCategory: translate('expenses.exportCategory', 'Category'),
        trAmount: translate('expenses.exportAmount', 'Amount'),
        trNotes: translate('expenses.exportNotes', 'Notes'),
    };

    const csvContent = generateCSV(transactionsToExport, headers);
  
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
    const filenameKey = currentLanguage === 'zh' ? 'expenses.exportFilenameZh' : 'expenses.exportFilenameEn';
    link.download = translate(filenameKey, currentLanguage === 'zh' ? 'biztrack_支出表.csv' : 'biztrack_expense_table.csv');
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
  
// 新增一个专门用来净化 CSV 字段的辅助函数
function sanitizeCSVField(value) {
    // 将 null、undefined 等转为空字符串，其他转为字符串
    let strValue = value === null || value === undefined ? "" : String(value);

    // 1. 防御 CSV 注入攻击 (Macro Injection)
    // 如果内容是以 =、+、- 或 @ 开头，在其前面追加一个单引号，迫使 Excel 将其识别为纯文本
    if (/^[=+\-@]/.test(strValue)) {
        strValue = "'" + strValue;
    }

    // 2. 修复 CSV 格式错乱问题
    // 如果内容本身包含逗号（,）、换行符（\n）或双引号（"），必须用双引号把它包起来，
    // 并且将内部原有的双引号转义（替换为两个双引号 ""）
    if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        strValue = '"' + strValue.replace(/"/g, '""') + '"';
    }

    return strValue;
}

// 替换原有的 generateCSV 函数
function generateCSV(data, headers) {
    // 对表头进行处理
    const headerRow = Object.keys(headers).map(key => sanitizeCSVField(headers[key])).join(',');
    
    // 对每一行数据的每一个字段进行安全净化处理
    const rows = data.map(item => {
        return Object.values(item).map(val => sanitizeCSVField(val)).join(',');
    });

    return `${headerRow}\n${rows.join('\n')}`;
}
