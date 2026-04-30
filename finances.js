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
    const trDateInput = document.getElementById('tr-date');
    if (trDateInput) {
        // 设置placeholder
        trDateInput.placeholder = currentLanguage === 'zh' ? '年-月-日' : 'YYYY-MM-DD';

        // 创建自定义按钮
        const createCustomButtons = (instance) => {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'flatpickr-custom-buttons';
            buttonsContainer.style.cssText = 'display: flex; justify-content: space-between; padding: 10px;';

            // 今天按钮
            const todayButton = document.createElement('button');
            todayButton.type = 'button';
            todayButton.className = 'flatpickr-today-button';
            todayButton.textContent = currentLanguage === 'zh' ? '今天' : 'Today';
            todayButton.style.cssText = 'background: #4a90e2; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;';
            todayButton.onclick = () => {
                instance.setDate(new Date());
            };

            // 清除按钮
            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.className = 'flatpickr-clear-button';
            clearButton.textContent = currentLanguage === 'zh' ? '清除' : 'Clear';
            clearButton.style.cssText = 'background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;';
            clearButton.onclick = () => {
                instance.clear();
            };

            buttonsContainer.appendChild(todayButton);
            buttonsContainer.appendChild(clearButton);

            return buttonsContainer;
        };

        flatpickr(trDateInput, {
            dateFormat: 'Y-m-d',
            locale: currentLanguage === 'zh' ? 'zh' : 'default',
            allowInput: true,
            onReady: function(selectedDates, dateStr, instance) {
                const calendarContainer = instance.calendarContainer;
                const buttonsContainer = createCustomButtons(instance);
                calendarContainer.appendChild(buttonsContainer);
            },
            onChange: function(selectedDates, dateStr, instance) {
                // 更新按钮文本
                const todayButton = instance.calendarContainer.querySelector('.flatpickr-today-button');
                const clearButton = instance.calendarContainer.querySelector('.flatpickr-clear-button');
                if (todayButton) {
                    todayButton.textContent = currentLanguage === 'zh' ? '今天' : 'Today';
                }
                if (clearButton) {
                    clearButton.textContent = currentLanguage === 'zh' ? '清除' : 'Clear';
                }
            }
        });
    }

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
    const addText = currentLanguage === 'zh' ? '添加' : 'Add';
    const updateText = currentLanguage === 'zh' ? '更新' : 'Update';
    const saveText = currentLanguage === 'zh' ? '保存' : 'Save';

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
        const addText = currentLanguage === 'zh' ? '添加' : 'Add';
        const updateText = currentLanguage === 'zh' ? '更新' : 'Update';

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
        'Rent': currentLanguage === 'zh' ? '租金' : 'Rent',
        'Utilities': currentLanguage === 'zh' ? '水电费' : 'Utilities',
        'Supplies': currentLanguage === 'zh' ? '用品' : 'Supplies',
        'Order Fulfillment': currentLanguage === 'zh' ? '订单履行' : 'Order Fulfillment',
        'Miscellaneous': currentLanguage === 'zh' ? '杂项' : 'Miscellaneous'
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
                <button title="Edit" onclick="editRow('${transaction.trID}')" class="edit-icon fa-solid fa-pen-to-square" aria-label="Edit order"></button>
                <button onclick="deleteTransaction('${transaction.trID}')" class="delete-icon fas fa-trash-alt" aria-label="Delete order"></button>
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

    const totalExpensesText = currentLanguage === 'zh' ? '总支出: ' : 'Total Expenses: ';
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
  
    const updateText = currentLanguage === 'zh' ? '更新' : 'Update';
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
        const addText = currentLanguage === 'zh' ? '添加' : 'Add';
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
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll(".transaction-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


function exportToCSV() {
    const transactionsToExport = transactions.map(transaction => {
        return {
            trID: transaction.trID,
            trDate: transaction.trDate,
            trCategory: transaction.trCategory,
            trAmount: transaction.trAmount.toFixed(2),
            trNotes: transaction.trNotes,
        };
    });
  
    const currentLanguage = localStorage.getItem('bizTrackLanguage') || 'en';

    // 根据当前语言获取表头翻译
    const headerTranslations = {
        en: {
            trID: 'Transaction ID',
            trDate: 'Transaction Date',
            trCategory: 'Category',
            trAmount: 'Amount',
            trNotes: 'Notes'
        },
        zh: {
            trID: '交易ID',
            trDate: '交易日期',
            trCategory: '类别',
            trAmount: '金额',
            trNotes: '备注'
        }
    };

    const headers = headerTranslations[currentLanguage];

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
    link.download = currentLanguage === 'zh' ? 'biztrack_支出表.csv' : 'biztrack_expense_table.csv';
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
  
function generateCSV(data, headers) {
    const headerRow = Object.keys(headers).map(key => headers[key]).join(',');
    const rows = data.map(order => Object.values(order).join(','));

    return `${headerRow}\n${rows.join('\n')}`;
}
