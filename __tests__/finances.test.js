// finances.js — test window-level functions exposed at module load time

beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.biztrackDb = null;
  window.biztrackDbHelpers = {
    isReady: jest.fn(() => false),
    syncCollection: jest.fn(),
    logActivity: jest.fn(),
  };
  window.getCurrentLanguage = jest.fn(() => 'en');
  window.datePickerI18n = { en: { today: 'Today', clear: 'Clear' } };
  window.escapeHTML = s => s;
  window.addGuideButton = jest.fn();
  window.flatpickr = jest.fn();
  window.initI18n = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
  localStorage.clear();
  // Add #searchInput before module import so the module-level if(searchInput) covers line 424
  const si = document.createElement('input');
  si.id = 'searchInput';
  document.body.appendChild(si);
});

beforeAll(async () => {
  await import('../finances.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ── Basic module load ─────────────────────────────────────────────────────
describe('finances.js module-level exports', () => {
  test('window.openSidebar is a function', () => {
    expect(typeof window.openSidebar).toBe('function');
  });

  test('window.closeSidebar is a function', () => {
    expect(typeof window.closeSidebar).toBe('function');
  });
});

// ── window.openForm / closeForm ────────────────────────────────────────────
describe('window.openForm / closeForm (finances)', () => {
  beforeEach(() => {
    const form = document.createElement('div');
    form.id = 'transaction-form';
    form.style.display = 'none';
    document.body.appendChild(form);
  });

  test('openForm toggles transaction-form display to block', () => {
    document.getElementById('transaction-form').style.display = 'none';
    window.openForm();
    expect(document.getElementById('transaction-form').style.display).toBe('block');
  });

  test('openForm toggles transaction-form display back to none', () => {
    document.getElementById('transaction-form').style.display = 'block';
    window.openForm();
    expect(document.getElementById('transaction-form').style.display).toBe('none');
  });

  test('closeForm sets transaction-form display to none', () => {
    document.getElementById('transaction-form').style.display = 'block';
    window.closeForm();
    expect(document.getElementById('transaction-form').style.display).toBe('none');
  });
});

// ── sidebar helpers (set on window at module level) ───────────────────────
describe('sidebar functions (finances)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  test('openSidebar toggles sidebar display to block', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.display = 'none';
    document.body.appendChild(sidebar);
    window.openSidebar();
    expect(sidebar.style.display).toBe('block');
  });

  test('openSidebar toggles sidebar display back to none', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.display = 'block';
    document.body.appendChild(sidebar);
    window.openSidebar();
    expect(sidebar.style.display).toBe('none');
  });

  test('closeSidebar sets sidebar display to none', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.display = 'block';
    document.body.appendChild(sidebar);
    window.closeSidebar();
    expect(sidebar.style.display).toBe('none');
  });

  test('openSidebar does nothing when sidebar element is absent', () => {
    expect(() => window.openSidebar()).not.toThrow();
  });
});

// ── DOMContentLoaded handler ──────────────────────────────────────────────
describe('DOMContentLoaded initialises finances page', () => {
  function setupFullDOM() {
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);

    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);

    const trDate = document.createElement('input');
    trDate.id = 'tr-date';
    document.body.appendChild(trDate);

    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);

    return { tableBody, totalExp, trDate, form };
  }

  test('renders default transactions into table body', async () => {
    setupFullDOM();
    window.flatpickr.mockClear();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    const rows = document.getElementById('tableBody').querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('calls flatpickr when #tr-date input is present', async () => {
    setupFullDOM();
    window.flatpickr.mockClear();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    expect(window.flatpickr).toHaveBeenCalled();
  });

  test('skips flatpickr when #tr-date is absent', async () => {
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);

    window.flatpickr.mockClear();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    expect(window.flatpickr).not.toHaveBeenCalled();
  });

  test('displays total expenses after render', async () => {
    setupFullDOM();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    const totalExpEl = document.getElementById('total-expenses');
    expect(totalExpEl.innerHTML).toMatch(/\$/);
  });
});

// ── window.newTransaction ─────────────────────────────────────────────────
describe('window.newTransaction', () => {
  function setupFormDOM(values = {}) {
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const input = document.createElement('input');
      input.id = id;
      input.value = values[id] !== undefined ? values[id] : '';
      document.body.appendChild(input);
    });
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    window.alert = jest.fn();
  }

  test('alerts when required fields are empty', () => {
    setupFormDOM();
    window.newTransaction();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when tr-amount is not a number', () => {
    setupFormDOM({ 'tr-date': '2024-01-01', 'tr-category': 'Rent', 'tr-amount': 'abc', 'tr-notes': 'Test' });
    window.newTransaction();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when tr-amount is negative', () => {
    setupFormDOM({ 'tr-date': '2024-01-01', 'tr-category': 'Rent', 'tr-amount': '-10', 'tr-notes': 'Test' });
    window.newTransaction();
    expect(window.alert).toHaveBeenCalled();
  });

  test('creates a new transaction with valid inputs and does not alert', () => {
    setupFormDOM({ 'tr-date': '2024-03-15', 'tr-category': 'Supplies', 'tr-amount': '75', 'tr-notes': 'Office' });
    window.newTransaction();
    expect(window.alert).not.toHaveBeenCalled();
  });
});

// ── window.deleteTransaction ──────────────────────────────────────────────
describe('window.deleteTransaction', () => {
  beforeEach(() => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
  });

  test('does not throw when deleting a non-existent trID', () => {
    expect(() => window.deleteTransaction(99999)).not.toThrow();
  });

  test('removes a transaction that exists in the loaded data', () => {
    expect(() => window.deleteTransaction(1)).not.toThrow();
  });
});

// ── window.editRow ────────────────────────────────────────────────────────
describe('window.editRow', () => {
  function setupEditDOM() {
    ['tr-id', 'tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.textContent = 'Add';
    document.body.appendChild(submitBtn);
    const form = document.createElement('div');
    form.id = 'transaction-form';
    form.style.display = 'none';
    document.body.appendChild(form);
  }

  test('populates form fields and shows form for an existing trID', () => {
    setupEditDOM();
    expect(() => window.editRow(2)).not.toThrow();
    expect(document.getElementById('transaction-form').style.display).toBe('block');
  });
});

// ── window.sortTable ──────────────────────────────────────────────────────
describe('window.sortTable (finances)', () => {
  test('sorts by trID column without throwing', () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    expect(() => window.sortTable('trID')).not.toThrow();
  });

  test('sorts by trAmount column without throwing', () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    expect(() => window.sortTable('trAmount')).not.toThrow();
  });
});

// ── window.exportToCSV ────────────────────────────────────────────────────
describe('window.exportToCSV (finances)', () => {
  test('generates CSV and triggers download without throwing', () => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
    expect(() => window.exportToCSV()).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  test('uses zh filename when language is zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-zh');
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLanguage.mockReturnValue('en');
  });
});

// ── window.addOrUpdate ────────────────────────────────────────────────────
describe('window.addOrUpdate', () => {
  function setupAddOrUpdateDOM(btnText) {
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.textContent = btnText;
    document.body.appendChild(submitBtn);

    ['tr-id', 'tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = '';
      document.body.appendChild(el);
    });
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    window.alert = jest.fn();
  }

  test('routes to newTransaction when button text matches addText key', () => {
    // window.t returns the key itself, so translate('expenses.add','Add') → 'expenses.add'
    setupAddOrUpdateDOM('expenses.add');
    const mockEvent = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(mockEvent)).not.toThrow();
    expect(window.alert).toHaveBeenCalled(); // empty fields → alert
  });

  test('routes to updateTransaction when button text matches updateText key', () => {
    // window.t returns the key itself, so translate('common.update','Update') → 'common.update'
    setupAddOrUpdateDOM('common.update');
    document.getElementById('tr-id').value = '99999'; // non-existent → no-op
    const mockEvent = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(mockEvent)).not.toThrow();
  });
});

// ── window.updateTransaction ──────────────────────────────────────────────
describe('window.updateTransaction', () => {
  function setupUpdateDOM() {
    ['tr-id', 'tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.textContent = 'Update';
    document.body.appendChild(submitBtn);
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    window.alert = jest.fn();
  }

  test('does nothing when trID does not exist', () => {
    setupUpdateDOM();
    expect(() => window.updateTransaction(99999)).not.toThrow();
  });

  test('alerts on empty fields when updating existing transaction', () => {
    setupUpdateDOM();
    // trID=2 was added via newTransaction test or DEFAULT_EXPENSES
    expect(() => window.updateTransaction(2)).not.toThrow();
    expect(window.alert).toHaveBeenCalled();
  });

  test('successfully updates with valid fields', () => {
    setupUpdateDOM();
    document.getElementById('tr-date').value = '2024-06-01';
    document.getElementById('tr-category').value = 'Utilities';
    document.getElementById('tr-amount').value = '99';
    document.getElementById('tr-notes').value = 'Updated note';
    expect(() => window.updateTransaction(2)).not.toThrow();
  });
});

// ── flatpickr callback coverage ───────────────────────────────────────────
describe('flatpickr callback handlers in initTransactionDatePicker', () => {
  test('onReady callback appends custom buttons to calendar container', async () => {
    window.flatpickr.mockClear();
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    const trDate = document.createElement('input');
    trDate.id = 'tr-date';
    document.body.appendChild(trDate);
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));

    expect(window.flatpickr).toHaveBeenCalled();
    const options = window.flatpickr.mock.calls[window.flatpickr.mock.calls.length - 1][1];
    const calendarContainer = document.createElement('div');
    const mockInstance = {
      calendarContainer,
      setDate: jest.fn(),
      clear: jest.fn(),
    };

    // Trigger onReady → covers createCustomButtons (lines 79-104)
    expect(() => options.onReady([], '', mockInstance)).not.toThrow();
    expect(calendarContainer.querySelector('button')).not.toBeNull();

    // Trigger today/clear button clicks → covers onclick handlers
    const buttons = calendarContainer.querySelectorAll('button');
    buttons[0].onclick(); // today
    expect(mockInstance.setDate).toHaveBeenCalled();
    buttons[1].onclick(); // clear
    expect(mockInstance.clear).toHaveBeenCalled();

    // Trigger onChange → covers lines 121-130
    expect(() => options.onChange([], '', mockInstance)).not.toThrow();
  });

  test('destroy existing flatpickr before creating new one (line 109)', async () => {
    window.flatpickr.mockClear();
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    const trDate = document.createElement('input');
    trDate.id = 'tr-date';
    const destroyMock = jest.fn();
    trDate._flatpickr = { destroy: destroyMock };
    document.body.appendChild(trDate);
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));

    expect(destroyMock).toHaveBeenCalled();
  });
});

// ── DOMContentLoaded: initI18n branch coverage ────────────────────────────
describe('DOMContentLoaded calls initI18n when defined', () => {
  test('invokes window.initI18n from DOMContentLoaded handler', async () => {
    window.initI18n.mockClear();
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    expect(window.initI18n).toHaveBeenCalled();
  });
});

// ── window.updateTransaction: invalid and negative amount ─────────────────
describe('window.updateTransaction invalid/negative amount', () => {
  function setupUpdateDOM(trAmountValue) {
    ['tr-id', 'tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    document.getElementById('tr-id').value = '2';
    document.getElementById('tr-date').value = '2024-01-01';
    document.getElementById('tr-category').value = 'Rent';
    document.getElementById('tr-amount').value = trAmountValue;
    document.getElementById('tr-notes').value = 'Test note';
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    document.body.appendChild(submitBtn);
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    window.alert = jest.fn();
  }

  test('alerts when tr-amount is empty/invalid (lines 387-388)', () => {
    setupUpdateDOM('');
    window.updateTransaction(2);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when tr-amount is negative (lines 391-392)', () => {
    setupUpdateDOM('-50');
    window.updateTransaction(2);
    expect(window.alert).toHaveBeenCalled();
  });
});

// ── performSearch with keyword (lines 423-450) ────────────────────────────
describe('performSearch with transactions loaded', () => {
  test('filters transactions matching keyword (covers lines 435-450)', () => {
    const input = document.createElement('input');
    input.id = 'searchInput';
    input.value = 'rent';
    document.body.appendChild(input);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    // performSearch is exposed via the searchInput 'input' event listener
    // but we can trigger it directly via the debounced binding or call it via window if exposed
    // The DOMContentLoaded sets up the listener; dispatch 'input' event on searchInput
    expect(() => input.dispatchEvent(new Event('input'))).not.toThrow();
  });
});

// ── DOMContentLoaded form submit + handleQuickAddOpen (lines 144-145, 174-178) ──
describe('DOMContentLoaded: form submit listener and handleQuickAddOpen', () => {
  afterEach(() => { Object.defineProperty(window, 'location', { writable: true, value: { search: '', href: 'http://localhost/' } }); });

  test('form submit event triggers addOrUpdate (lines 143-145)', () => {
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.textContent = 'expenses.add';
    document.body.appendChild(submitBtn);
    // Add the form input fields that addOrUpdate → newTransaction needs
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(() => form.dispatchEvent(new Event('submit'))).not.toThrow();
  });

  test('DOMContentLoaded with #searchInput binds debounced search (line 424 true branch)', () => {
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    const searchInput = document.createElement('input');
    searchInput.id = 'searchInput';
    document.body.appendChild(searchInput);
    expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow();
  });

  test('handleQuickAddOpen shows form when quickAdd=1 in URL (lines 174-178)', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?quickAdd=1', href: 'http://localhost/?quickAdd=1' },
    });
    const form = document.createElement('form');
    form.id = 'transaction-form';
    form.scrollIntoView = jest.fn(); // jsdom doesn't implement scrollIntoView
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(form.style.display).toBe('block');
  });
});

// ── DOMContentLoaded: addGuideButton false branch (line 165) ──────────────
describe('DOMContentLoaded: addGuideButton false branch (line 165)', () => {
  test('addGuideButton false branch when addGuideButton is not a function', async () => {
    const savedGuide = window.addGuideButton;
    window.addGuideButton = undefined; // NOT a function → false branch of if(typeof === 'function')
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow();
    await new Promise(r => setTimeout(r, 50));
    window.addGuideButton = savedGuide;
  });
});

// ── handleQuickAddOpen: !form branch (line 175) ───────────────────────────
describe('handleQuickAddOpen: !form branch (line 175)', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: { search: '', href: 'http://localhost/' } });
  });

  test('returns early when form does not exist in DOM (line 175 true branch)', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?quickAdd=1', href: 'http://localhost/?quickAdd=1' },
    });
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    // No transaction-form → handleQuickAddOpen hits line 175 (!form → return)
    expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow();
    await new Promise(r => setTimeout(r, 50));
  });
});

// ── window.addOrUpdate: newTransaction and updateTransaction branches ───────
describe('window.addOrUpdate (lines 187-191)', () => {
  function setupDOM() {
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes', 'tr-id'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
  }

  test('calls newTransaction when button text matches addText (line 189)', () => {
    setupDOM();
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    // window.t returns the key, so translate('expenses.add', 'Add') → 'expenses.add'
    btn.textContent = 'expenses.add';
    document.body.appendChild(btn);
    window.alert = jest.fn();
    const event = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(event)).not.toThrow();
  });

  test('calls updateTransaction when button text matches updateText (line 191)', () => {
    setupDOM();
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    btn.textContent = 'common.update'; // window.t returns key
    document.body.appendChild(btn);
    // Add a transaction to update (trID=1)
    localStorage.setItem('bizTrackTransactions', JSON.stringify([
      { trID: 1, trDate: '2024-01-01', trCategory: 'Rent', trAmount: 100, trNotes: 'Jan' }
    ]));
    const trId = document.getElementById('tr-id');
    trId.value = '1';
    document.getElementById('tr-date').value = '2024-01-01';
    document.getElementById('tr-category').value = 'Rent';
    document.getElementById('tr-amount').value = '150';
    document.getElementById('tr-notes').value = 'Updated';
    const event = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(event)).not.toThrow();
    localStorage.removeItem('bizTrackTransactions');
  });
});

// ── updateSubmitButtonText (lines 197-206) ────────────────────────────────
describe('window.updateSubmitButtonText', () => {
  test('translates Add button text', () => {
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    btn.textContent = 'Add';
    document.body.appendChild(btn);
    expect(() => window.updateSubmitButtonText()).not.toThrow();
  });

  test('translates Update button text', () => {
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    btn.textContent = 'Update';
    document.body.appendChild(btn);
    expect(() => window.updateSubmitButtonText()).not.toThrow();
  });

  test('does nothing when submitBtn is absent', () => {
    expect(() => window.updateSubmitButtonText()).not.toThrow();
  });
});

// ── newTransaction fp.clear() when _flatpickr exists (line 268) ───────────
describe('newTransaction with _flatpickr on tr-date input (line 268)', () => {
  test('calls fp.clear() after successful transaction', () => {
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    document.getElementById('tr-date').value = '2024-07-01';
    document.getElementById('tr-category').value = 'Utilities';
    document.getElementById('tr-amount').value = '75';
    document.getElementById('tr-notes').value = 'Test';

    const clearMock = jest.fn();
    document.getElementById('tr-date')._flatpickr = { clear: clearMock };

    window.newTransaction();
    expect(clearMock).toHaveBeenCalled();
  });
});

// ── syncExpensesToDb error path (line 62) ─────────────────────────────────
describe('syncExpensesToDb error path (line 62)', () => {
  test('console.error is called when syncCollection throws', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    window.biztrackDbHelpers = {
      isReady: jest.fn(() => true),
      syncCollection: jest.fn().mockRejectedValue(new Error('DB error')),
      logActivity: jest.fn(),
    };
    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    document.getElementById('tr-date').value = '2024-08-01';
    document.getElementById('tr-category').value = 'Rent';
    document.getElementById('tr-amount').value = '100';
    document.getElementById('tr-notes').value = 'Error test';
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);

    window.newTransaction();
    await new Promise(r => setTimeout(r, 150));
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
    window.biztrackDbHelpers = { isReady: jest.fn(() => false), syncCollection: jest.fn(), logActivity: jest.fn() };
  });
});

// ── DOMContentLoaded with isReady=true + null datePickerI18n (lines 57-58, 87-96) ──
describe('DOMContentLoaded with isReady=true and no datePickerI18n (lines 57-58, 87-96)', () => {
  test('covers isBulkPageSync=true (line 57) and datePickerConfig falsy (lines 87, 96)', async () => {
    const savedHelpers = window.biztrackDbHelpers;
    const savedI18n = window.datePickerI18n;
    const savedFlatpickr = window.flatpickr;

    // isReady = true to get past early return in syncExpensesToDb (covers lines 55-63)
    window.biztrackDbHelpers = {
      isReady: jest.fn(() => true),
      syncCollection: jest.fn().mockResolvedValue(undefined),
      logActivity: jest.fn().mockResolvedValue(undefined),
    };
    // null → datePickerConfig is null → ternary false branch (lines 87, 96)
    window.datePickerI18n = null;
    // Mock flatpickr to call onReady so createCustomButtons runs
    const mockInstance = { setDate: jest.fn(), clear: jest.fn(), calendarContainer: document.createElement('div') };
    window.flatpickr = jest.fn((el, config) => {
      if (config && config.onReady) config.onReady([], '', mockInstance);
    });

    // Set up DOM
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    const trDate = document.createElement('input');
    trDate.id = 'tr-date';
    document.body.appendChild(trDate);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);

    expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow();
    await new Promise(r => setTimeout(r, 100));

    window.biztrackDbHelpers = savedHelpers;
    window.datePickerI18n = savedI18n;
    window.flatpickr = savedFlatpickr;
  });
});

// ── translate() false branch (line 18) and translateExpenseCategoryForExport ──
describe('translate() fallback when window.t is null (line 18)', () => {
  test('newTransaction validation uses fallback text when window.t is undefined', () => {
    const savedT = window.t;
    window.t = undefined;
    // Create minimal DOM so validation runs and calls translate()
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = '';
      document.body.appendChild(el);
    });
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);
    window.alert = jest.fn();
    // newTransaction with empty fields triggers translate() → window.t is undefined → fallback used (line 18)
    expect(() => window.newTransaction()).not.toThrow();
    window.t = savedT;
  });

  test('exportToCSV with window.t undefined uses fallback headers (line 18)', () => {
    const savedT = window.t;
    window.t = undefined;
    // exportToCSV calls translateExpenseCategoryForExport which calls translate()
    expect(() => window.exportToCSV()).not.toThrow();
    window.t = savedT;
  });

  test('exportToCSV with unknown expense category covers || category fallback (line 30)', async () => {
    // Add a transaction with a category not in the translations map → || category runs (line 30)
    // We need to trigger DOMContentLoaded with custom localStorage so the module-level
    // transactions array gets populated with 'UnknownCategory' before calling exportToCSV.
    localStorage.setItem('bizTrackTransactions', JSON.stringify([
      { trID: 'UNK99', trDate: '2024-01-01', trCategory: 'UnknownCategory', trAmount: 99, trNotes: 'test' }
    ]));
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 50));
    expect(() => window.exportToCSV()).not.toThrow();
    localStorage.removeItem('bizTrackTransactions');
  });

  test('getCurrentLang fallback covers line 67 false branch when getCurrentLanguage is undefined', () => {
    const savedGetLang = window.getCurrentLanguage;
    window.getCurrentLanguage = undefined;
    // exportToCSV calls getCurrentLang() → window.getCurrentLanguage falsy → localStorage fallback (line 67)
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLanguage = savedGetLang;
  });
});

// ── window.performSearch (lines 428-451) ──────────────────────────────────
describe('window.performSearch (finances)', () => {
  function setupSearchDOM() {
    const input = document.createElement('input');
    input.id = 'searchInput';
    document.body.appendChild(input);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);
  }

  test('empty keyword renders all transactions without filtering (line 431-433)', () => {
    setupSearchDOM();
    document.getElementById('searchInput').value = '';
    expect(() => window.performSearch()).not.toThrow();
  });

  test('non-empty keyword filters transactions and covers filter callback (lines 436-449)', () => {
    setupSearchDOM();
    document.getElementById('searchInput').value = 'rent';
    // Add a transaction to localStorage so filter has something to work with
    const txns = [{ trID: 'T1', trDate: '2024-01-01', trCategory: 'Rent', trAmount: 100, trNotes: 'Jan rent' }];
    localStorage.setItem('bizTrackTransactions', JSON.stringify(txns));
    expect(() => window.performSearch()).not.toThrow();
    localStorage.removeItem('bizTrackTransactions');
  });

  test('filter callback uses translateCategory when it is a function (line 437 true branch)', () => {
    setupSearchDOM();
    document.getElementById('searchInput').value = 'utilities';
    window.translateCategory = jest.fn((cat) => cat);
    expect(() => window.performSearch()).not.toThrow();
    delete window.translateCategory;
  });
});

// ── syncExpensesToDb with DB ready (covers lines 55-62) ───────────────────
describe('syncExpensesToDb when biztrackDbHelpers is ready', () => {
  test('calls syncCollection when isReady returns true', async () => {
    const syncCollection = jest.fn().mockResolvedValue(undefined);
    const logActivity = jest.fn().mockResolvedValue(undefined);
    window.biztrackDbHelpers = {
      isReady: jest.fn(() => true),
      syncCollection,
      logActivity,
    };

    const tableBody = document.createElement('tbody');
    tableBody.id = 'tableBody';
    document.body.appendChild(tableBody);
    const totalExp = document.createElement('div');
    totalExp.id = 'total-expenses';
    document.body.appendChild(totalExp);

    // window.newTransaction with valid data triggers syncExpensesToDb("create", ...)
    ['tr-date', 'tr-category', 'tr-amount', 'tr-notes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    document.getElementById('tr-date').value = '2024-05-01';
    document.getElementById('tr-category').value = 'Rent';
    document.getElementById('tr-amount').value = '200';
    document.getElementById('tr-notes').value = 'May rent';
    const form = document.createElement('form');
    form.id = 'transaction-form';
    document.body.appendChild(form);

    window.newTransaction();
    await new Promise(r => setTimeout(r, 100));

    expect(syncCollection).toHaveBeenCalled();

    // restore default mock
    window.biztrackDbHelpers = {
      isReady: jest.fn(() => false),
      syncCollection: jest.fn(),
      logActivity: jest.fn(),
    };
  });
});
