// finances.js
import {
    escapeHTML,
    openSidebar,
    closeSidebar,
    debounce,
    sanitizeCSVField,
    generateCSV,
    downloadCSV,
    sortTableRowsByDataset
} from './shared-utils.js';
import { replaceParams } from './i18n/utils.js';
import { DEFAULT_EXPENSES } from './data-service.js';

const escapeCSVValue = sanitizeCSVField;

function translate(key, fallback, params = {}) {
    return window.t ? window.t(key, params) : fallback;
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

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;


window.openForm = function() {
    var form = document.getElementById("transaction-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

window.closeForm = function() {
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

document.addEventListener('DOMContentLoaded', function() {
    // 初始化i18n
    if (typeof initI18n === 'function') {
        initI18n();
    }

    // 添加表单的submit事件监听器
    const form = document.getElementById('transaction-form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            addOrUpdate(event);
        });
    } else {
    }

    // 初始化日期选择器
    initTransactionDatePicker();

    const storedTransactions = localStorage.getItem("bizTrackTransactions");
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    } else {
        transactions = DEFAULT_EXPENSES.map(transaction => ({ ...transaction }));
        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));
    }

    serialNumberCounter = transactions.length + 1;
    renderTransactions(transactions);
    syncExpensesToDb("sync", { trID: "all-expenses" });
    handleQuickAddOpen();
    if (typeof window.addGuideButton === 'function') {
        window.addGuideButton('expenses');
    }
});

function handleQuickAddOpen() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quickAdd") !== "1") return;

    const form = document.getElementById("transaction-form");
    if (!form) return;

    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.addOrUpdate = function(event) {
    const type = document.getElementById("submitBtn").textContent.trim();
    const addText = translate('expenses.add', 'Add');
    const updateText = translate('common.update', 'Update');
    const saveText = translate('expenses.save', 'Save');

    if (type === addText || type === saveText) {
        newTransaction();
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


window.newTransaction = function() {
    const trDateInput = document.getElementById("tr-date");
    const trDate = trDateInput.value.trim();
    const trCategory = document.getElementById("tr-category").value.trim();
    const trAmount = parseFloat(document.getElementById("tr-amount").value.trim());
    const trNotes = document.getElementById("tr-notes").value.trim();

    // 调试信息
    const trDateLabel = (translate('history.fieldTrDate', 'Date')).replace(/[:：]\s*$/, '');
    const trCategoryLabel = (translate('history.fieldTrCategory', 'Category')).replace(/[:：]\s*$/, '');
    const trAmountLabel = (translate('history.fieldTrAmount', 'Amount')).replace(/[:：]\s*$/, '');
    const trNotesLabel = (translate('history.fieldTrNotes', 'Notes')).replace(/[:：]\s*$/, '');

    if (!trDate || !trCategory || !trNotes || isNaN(trAmount)) {
        alert(translate("common.fillAllFields", "Please fill in all required fields.") || "Please fill in all required fields.");
        return;
    }
    if (isNaN(trAmount)) {
        alert(translate("common.invalidNumber", `Please enter a valid number for ${trAmountLabel}`, {field: trAmountLabel}) || `Please enter a valid number for ${trAmountLabel}`);
        return;
    }
    if (trAmount < 0) {
        alert(translate("common.invalidPositive", `Please enter a positive number for ${trAmountLabel}`, {field: trAmountLabel}) || `Please enter a positive number for ${trAmountLabel}`);
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
    transactions.push(transaction);
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
                <button title="${window.t?.(`common.edit`) || `Edit`}" onclick="editRow('${transaction.trID}')" class="edit-icon fa-solid fa-pen-to-square" aria-label="${window.t?.(`common.edit`) || `Edit`}"></button>
                <button title="${window.t?.(`common.delete`) || `Delete`}" onclick="deleteTransaction('${transaction.trID}')" class="delete-icon fas fa-trash-alt" aria-label="${window.t?.(`common.delete`) || `Delete`}"></button>
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

window.editRow = function(trID) {
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
  
window.deleteTransaction = function(trID) {
    const indexToDelete = transactions.findIndex(transaction => transaction.trID == trID);

    if (indexToDelete !== -1) {
        const deletedTransaction = { ...transactions[indexToDelete] };
        transactions.splice(indexToDelete, 1);

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);
        syncExpensesToDb("delete", { trID }, deletedTransaction);
    }
}

  window.updateTransaction = function(trID) {
    const indexToUpdate = transactions.findIndex(transaction => transaction.trID === trID);

    if (indexToUpdate !== -1) {
        const beforeTransaction = { ...transactions[indexToUpdate] };
        
        // 获取表单数据
        const trDate = document.getElementById("tr-date").value.trim();
        const trCategory = document.getElementById("tr-category").value.trim();
        const trAmount = parseFloat(document.getElementById("tr-amount").value.trim());
        const trNotes = document.getElementById("tr-notes").value.trim();

        const trDateLabel = (translate('history.fieldTrDate', 'Date')).replace(/[:：]\s*$/, '');
        const trCategoryLabel = (translate('history.fieldTrCategory', 'Category')).replace(/[:：]\s*$/, '');
        const trAmountLabel = (translate('history.fieldTrAmount', 'Amount')).replace(/[:：]\s*$/, '');
        const trNotesLabel = (translate('history.fieldTrNotes', 'Notes')).replace(/[:：]\s*$/, '');

        if (!trDate || !trCategory || !trNotes || isNaN(trAmount)) {
            alert(translate("common.fillAllFields", "Please fill in all required fields.") || "Please fill in all required fields.");
            return;
        }
        if (isNaN(trAmount)) {
            alert(translate("common.invalidNumber", `Please enter a valid number for ${trAmountLabel}`, {field: trAmountLabel}) || `Please enter a valid number for ${trAmountLabel}`);
            return;
        }
        if (trAmount < 0) {
            alert(translate("common.invalidPositive", `Please enter a positive number for ${trAmountLabel}`, {field: trAmountLabel}) || `Please enter a positive number for ${trAmountLabel}`);
            return;
        }

        const updatedTransaction = {
            trID: trID,
            trDate: trDate,
            trCategory: trCategory,
            trAmount: trAmount,
            trNotes: trNotes,
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

window.sortTable = function(column) {
    const tbody = document.getElementById("tableBody");
    sortTableRowsByDataset(tbody, column, ["trID", "trAmount"]);
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", debounce(performSearch, 250));
}


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


window.exportToCSV = function() {
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
    const filename = currentLanguage === 'zh' ? 'biztrack_支出表.csv' : 'biztrack_expense_table.csv';
    downloadCSV(csvContent, filename);
}
  
window.sanitizeCSVField = sanitizeCSVField;
window.generateCSV = generateCSV;
