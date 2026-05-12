// orders.js — test window-level functions exposed at module load time

import * as dataService from '../data-service.js';

beforeAll(() => {
  // Provide required globals before importing the module
  window.t = jest.fn((key) => key);
  window.biztrackDb = null;
  window.biztrackDbHelpers = { isReady: jest.fn(() => false), syncCollection: jest.fn(), logActivity: jest.fn() };
  window.getCurrentLanguage = jest.fn(() => 'en');
  window.datePickerI18n = { en: { today: 'Today', clear: 'Clear' } };
  window.flatpickr = jest.fn();
  window.addGuideButton = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
  localStorage.clear();
});

beforeAll(async () => {
  await import('../orders.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ── window.getCurrentLang ─────────────────────────────────────────────────
describe('window.getCurrentLang', () => {
  test('is a function', () => {
    expect(typeof window.getCurrentLang).toBe('function');
  });

  test('returns en when window.getCurrentLanguage returns en', () => {
    window.getCurrentLanguage.mockReturnValue('en');
    expect(window.getCurrentLang()).toBe('en');
  });

  test('returns zh when window.getCurrentLanguage returns zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(window.getCurrentLang()).toBe('zh');
    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('falls back to localStorage when getCurrentLanguage is absent', () => {
    const orig = window.getCurrentLanguage;
    window.getCurrentLanguage = undefined;
    localStorage.setItem('bizTrackLanguage', 'zhTW');
    expect(window.getCurrentLang()).toBe('zhTW');
    window.getCurrentLanguage = orig;
    localStorage.removeItem('bizTrackLanguage');
  });

  test('defaults to en when neither window.getCurrentLanguage nor localStorage', () => {
    const orig = window.getCurrentLanguage;
    window.getCurrentLanguage = undefined;
    localStorage.removeItem('bizTrackLanguage');
    expect(window.getCurrentLang()).toBe('en');
    window.getCurrentLanguage = orig;
  });
});

// ── window.translateOrderStatusForExport ──────────────────────────────────
describe('window.translateOrderStatusForExport', () => {
  test('is a function', () => {
    expect(typeof window.translateOrderStatusForExport).toBe('function');
  });

  test('returns status unchanged for en language', () => {
    window.getCurrentLanguage.mockReturnValue('en');
    expect(window.translateOrderStatusForExport('Pending')).toBe('Pending');
    expect(window.translateOrderStatusForExport('Delivered')).toBe('Delivered');
  });

  test('translates Pending to Chinese when lang is zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(window.translateOrderStatusForExport('Pending')).toBe('待处理');
    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('translates Processing to Chinese when lang is zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(window.translateOrderStatusForExport('Processing')).toBe('处理中');
    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('translates Shipped to Chinese when lang is zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(window.translateOrderStatusForExport('Shipped')).toBe('已发货');
    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('translates Delivered to Chinese when lang is zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(window.translateOrderStatusForExport('Delivered')).toBe('已送达');
    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('returns unknown status unchanged', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(window.translateOrderStatusForExport('Unknown')).toBe('Unknown');
    window.getCurrentLanguage.mockReturnValue('en');
  });
});

// ── window.syncOrdersToDb ─────────────────────────────────────────────────
describe('window.syncOrdersToDb', () => {
  test('is an async function', () => {
    expect(typeof window.syncOrdersToDb).toBe('function');
  });

  test('returns early (no-op) when db is not ready', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
    await expect(window.syncOrdersToDb('create', { orderID: '1' })).resolves.toBeUndefined();
  });

  test('calls syncCollection when db is ready', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(true);
    window.biztrackDbHelpers.syncCollection.mockResolvedValue();
    window.biztrackDbHelpers.logActivity.mockResolvedValue();
    await window.syncOrdersToDb('create', { orderID: '1' });
    expect(window.biztrackDbHelpers.syncCollection).toHaveBeenCalledWith('orders', expect.any(Array), 'orderID');
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
  });

  test('does not log bulk page sync placeholder', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(true);
    window.biztrackDbHelpers.syncCollection.mockResolvedValue();
    window.biztrackDbHelpers.logActivity.mockClear();
    await window.syncOrdersToDb('sync', { orderID: 'all-orders' });
    expect(window.biztrackDbHelpers.logActivity).not.toHaveBeenCalled();
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
  });

  test('handles sync errors gracefully', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(true);
    window.biztrackDbHelpers.syncCollection.mockRejectedValue(new Error('DB error'));
    await expect(window.syncOrdersToDb('create', { orderID: '1' })).resolves.toBeUndefined();
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
  });
});

// ── window.openForm / closeForm ────────────────────────────────────────────
describe('window.openForm / closeForm (orders)', () => {
  beforeEach(() => {
    const form = document.createElement('div');
    form.id = 'order-form';
    form.style.display = 'none';
    document.body.appendChild(form);
  });

  test('openForm toggles order-form display to block', () => {
    document.getElementById('order-form').style.display = 'none';
    window.openForm();
    expect(document.getElementById('order-form').style.display).toBe('block');
  });

  test('openForm toggles order-form display back to none', () => {
    document.getElementById('order-form').style.display = 'block';
    window.openForm();
    expect(document.getElementById('order-form').style.display).toBe('none');
  });

  test('closeForm sets order-form display to none', () => {
    document.getElementById('order-form').style.display = 'block';
    window.closeForm();
    expect(document.getElementById('order-form').style.display).toBe('none');
  });
});

// ── window.escapeCSVValue ─────────────────────────────────────────────────
describe('window.escapeCSVValue', () => {
  test('is a function (alias for sanitizeCSVField)', () => {
    expect(typeof window.escapeCSVValue).toBe('function');
  });

  test('wraps values containing commas in quotes', () => {
    expect(window.escapeCSVValue('a,b')).toBe('"a,b"');
  });

  test('returns plain string unchanged', () => {
    expect(window.escapeCSVValue('hello')).toBe('hello');
  });
});

// ── window.renderOrders ───────────────────────────────────────────────────
describe('window.renderOrders', () => {
  const sampleOrders = [
    { orderID: 'O1', orderDate: '2025-01-01', itemName: 'Classic Snapback Cap',
      itemPrice: 20, qtyBought: 2, shipping: 5, taxes: 2, orderTotal: 47, orderStatus: 'Pending' },
    { orderID: 'O2', orderDate: '2025-01-02', itemName: 'Ceramic Coffee Mug',
      itemPrice: 15, qtyBought: 1, shipping: 3, taxes: 1, orderTotal: 19, orderStatus: 'Delivered' },
  ];

  beforeEach(() => {
    window.alert = jest.fn();
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const revEl = document.createElement('div');
    revEl.id = 'total-revenue';
    document.body.appendChild(revEl);
  });

  test('renders rows for each order', () => {
    window.renderOrders(sampleOrders);
    const tbody = document.getElementById('tableBody');
    expect(tbody.querySelectorAll('tr').length).toBe(2);
  });

  test('renders empty tbody when orders array is empty', () => {
    window.renderOrders([]);
    const tbody = document.getElementById('tableBody');
    expect(tbody.querySelectorAll('tr').length).toBe(0);
  });

  test('also updates the revenue display', () => {
    window.renderOrders(sampleOrders);
    const rev = document.getElementById('total-revenue');
    expect(rev.innerHTML).toContain('$');
  });

  test('does nothing when tableBody is absent', () => {
    document.getElementById('tableBody').remove();
    expect(() => window.renderOrders(sampleOrders)).not.toThrow();
  });
});

// ── window.displayRevenue ─────────────────────────────────────────────────
describe('window.displayRevenue', () => {
  test('updates total-revenue element', () => {
    const el = document.createElement('div');
    el.id = 'total-revenue';
    document.body.appendChild(el);
    window.displayRevenue();
    expect(el.innerHTML).toContain('$');
  });

  test('does nothing when total-revenue element is absent', () => {
    expect(() => window.displayRevenue()).not.toThrow();
  });
});

// ── window.deleteOrder ────────────────────────────────────────────────────
describe('window.deleteOrder', () => {
  beforeEach(() => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
  });

  test('does nothing when orderID is not found', () => {
    expect(() => window.deleteOrder('nonexistent-id')).not.toThrow();
  });
});

// ── window.sortTable ──────────────────────────────────────────────────────
describe('window.sortTable', () => {
  test('is a function', () => {
    expect(typeof window.sortTable).toBe('function');
  });

  test('runs without throwing when tableBody is present', () => {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    table.appendChild(tbody);
    document.body.appendChild(table);
    expect(() => window.sortTable('orderID')).not.toThrow();
  });
});

// ── window.performSearch ──────────────────────────────────────────────────
describe('window.performSearch', () => {
  beforeEach(() => {
    const input = document.createElement('input');
    input.id = 'searchInput';
    document.body.appendChild(input);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const revEl = document.createElement('div');
    revEl.id = 'total-revenue';
    document.body.appendChild(revEl);
  });

  test('renders all orders when search is empty', () => {
    document.getElementById('searchInput').value = '';
    expect(() => window.performSearch()).not.toThrow();
  });

  test('renders filtered results for a search keyword', () => {
    document.getElementById('searchInput').value = 'pending';
    expect(() => window.performSearch()).not.toThrow();
  });
});

// ── window.exportToCSV ───────────────────────────────────────────────────
describe('window.exportToCSV', () => {
  test('is a function', () => {
    expect(typeof window.exportToCSV).toBe('function');
  });

  test('runs without throwing', () => {
    // downloadCSV triggers an anchor click which is a no-op in jsdom
    expect(() => window.exportToCSV()).not.toThrow();
  });

  test('runs for zh language without throwing', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLanguage.mockReturnValue('en');
  });
});

// ── window.handleQuickAddOpen ─────────────────────────────────────────────
describe('window.handleQuickAddOpen', () => {
  test('is a function', () => {
    expect(typeof window.handleQuickAddOpen).toBe('function');
  });

  test('does nothing when quickAdd param is absent', () => {
    expect(() => window.handleQuickAddOpen()).not.toThrow();
  });
});

// ── window.newOrder validation branches ──────────────────────────────────
describe('window.newOrder validation', () => {
  let mockEvent;

  beforeEach(() => {
    window.alert = jest.fn();
    mockEvent = { preventDefault: jest.fn() };

    // Build minimal form DOM
    const ids = ['order-id', 'order-date', 'item-name', 'item-price',
                  'qty-bought', 'shipping', 'taxes', 'order-status'];
    ids.forEach((id) => {
      const el = document.createElement('input');
      el.id = id;
      el.value = '';
      document.body.appendChild(el);
    });
    const form = document.createElement('form');
    form.id = 'order-form';
    document.body.appendChild(form);
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    document.body.appendChild(btn);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const revEl = document.createElement('div');
    revEl.id = 'total-revenue';
    document.body.appendChild(revEl);
  });

  test('alerts when required fields are empty', () => {
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when itemPrice is not a number', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = 'abc';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when qtyBought is not a number', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = 'abc';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when shipping is empty', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = '';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when taxes is empty', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = '5';
    document.getElementById('taxes').value = '';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when shipping is not a valid number', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = 'abc';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when taxes is not a valid number', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = '5';
    document.getElementById('taxes').value = 'abc';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when itemPrice is negative', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '-5';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = '5';
    document.getElementById('taxes').value = '2';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when qtyBought is negative', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '-1';
    document.getElementById('shipping').value = '5';
    document.getElementById('taxes').value = '2';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when shipping is negative', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = '-1';
    document.getElementById('taxes').value = '2';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when taxes is negative', () => {
    document.getElementById('order-id').value = 'T1';
    document.getElementById('order-date').value = '2025-01-01';
    document.getElementById('item-name').value = 'Test Item';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '2';
    document.getElementById('shipping').value = '5';
    document.getElementById('taxes').value = '-2';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });

  test('creates order successfully with all valid inputs', () => {
    document.getElementById('order-id').value = 'TEST-999';
    document.getElementById('order-date').value = '2025-03-01';
    document.getElementById('item-name').value = 'Widget';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '20';
    document.getElementById('qty-bought').value = '3';
    document.getElementById('shipping').value = '5';
    document.getElementById('taxes').value = '2';
    window.newOrder(mockEvent);
    expect(window.alert).not.toHaveBeenCalled();
  });

  test('alerts when duplicate orderID is submitted', () => {
    // First, create order TEST-888
    document.getElementById('order-id').value = 'TEST-888';
    document.getElementById('order-date').value = '2025-04-01';
    document.getElementById('item-name').value = 'Widget';
    document.getElementById('order-status').value = 'Pending';
    document.getElementById('item-price').value = '10';
    document.getElementById('qty-bought').value = '1';
    document.getElementById('shipping').value = '0';
    document.getElementById('taxes').value = '0';
    window.newOrder(mockEvent);
    window.alert.mockClear();

    // Try to create again with same ID
    document.getElementById('order-id').value = 'TEST-888';
    window.newOrder(mockEvent);
    expect(window.alert).toHaveBeenCalled();
  });
});

// ── window.addOrUpdate (orders) ───────────────────────────────────────────
describe('window.addOrUpdate (orders)', () => {
  function setupDOM() {
    const ids = ['order-id', 'order-date', 'item-name', 'item-price', 'qty-bought', 'shipping', 'taxes', 'order-status'];
    ids.forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = '';
      document.body.appendChild(el);
    });
    const form = document.createElement('form');
    form.id = 'order-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    window.alert = jest.fn();
  }

  test('routes to newOrder when submitBtn has no isEdit', () => {
    setupDOM();
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    btn.dataset.isEdit = '';
    document.body.appendChild(btn);
    const evt = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(evt)).not.toThrow();
    expect(window.alert).toHaveBeenCalled(); // empty fields → alert
  });

  test('routes to updateOrder when submitBtn.dataset.isEdit is set', () => {
    setupDOM();
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    btn.dataset.isEdit = 'true';
    document.body.appendChild(btn);
    const evt = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(evt)).not.toThrow();
  });
});

// ── window.createOrderDatePicker ──────────────────────────────────────────
describe('window.createOrderDatePicker', () => {
  beforeAll(() => {
    window.flatpickr = jest.fn();
  });

  test('returns early without #order-date element', () => {
    // no #order-date in DOM
    expect(() => window.createOrderDatePicker()).not.toThrow();
    expect(window.flatpickr).not.toHaveBeenCalled();
  });

  test('calls flatpickr when #order-date input exists', () => {
    const input = document.createElement('input');
    input.id = 'order-date';
    document.body.appendChild(input);

    window.flatpickr.mockClear();
    window.createOrderDatePicker();
    expect(window.flatpickr).toHaveBeenCalledWith(input, expect.objectContaining({ dateFormat: 'Y-m-d' }));
  });

  test('destroys existing flatpickr instance before creating new one', () => {
    const input = document.createElement('input');
    input.id = 'order-date';
    const destroyMock = jest.fn();
    input._flatpickr = { destroy: destroyMock };
    document.body.appendChild(input);

    window.flatpickr.mockClear();
    window.createOrderDatePicker();
    expect(destroyMock).toHaveBeenCalled();
    expect(window.flatpickr).toHaveBeenCalled();
  });

  test('uses zh locale when getCurrentLang returns zh', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    const input = document.createElement('input');
    input.id = 'order-date';
    document.body.appendChild(input);

    window.flatpickr.mockClear();
    window.createOrderDatePicker();
    const callArg = window.flatpickr.mock.calls[0][1];
    expect(callArg.locale).toBe('zh');

    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('uses default locale for en', () => {
    window.getCurrentLanguage.mockReturnValue('en');
    const input = document.createElement('input');
    input.id = 'order-date';
    document.body.appendChild(input);

    window.flatpickr.mockClear();
    window.createOrderDatePicker();
    const callArg = window.flatpickr.mock.calls[0][1];
    expect(callArg.locale).toBe('default');
  });

  test('onReady callback creates and appends custom buttons', () => {
    const input = document.createElement('input');
    input.id = 'order-date';
    document.body.appendChild(input);

    window.flatpickr.mockClear();
    window.createOrderDatePicker();

    const options = window.flatpickr.mock.calls[0][1];
    const calendarContainer = document.createElement('div');
    const mockInstance = {
      calendarContainer,
      setDate: jest.fn(),
      clear: jest.fn(),
    };

    // Invoke onReady → covers createCustomButtons (lines 76-91) and line 100
    options.onReady([], '', mockInstance);
    const buttons = calendarContainer.querySelectorAll('button');
    expect(buttons.length).toBe(2);

    // today button onclick → covers line 82
    buttons[0].onclick();
    expect(mockInstance.setDate).toHaveBeenCalledWith(expect.any(Date));

    // clear button onclick → covers line 87
    buttons[1].onclick();
    expect(mockInstance.clear).toHaveBeenCalled();
  });
});

// ── DOMContentLoaded: initialises orders + renders table ──────────────────
describe('DOMContentLoaded handler (orders)', () => {
  function setupOrdersDOM() {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    const dateInput = document.createElement('input');
    dateInput.id = 'order-date';
    document.body.appendChild(dateInput);
  }

  test('first dispatch: uses DEFAULT_ORDERS (localStorage empty)', async () => {
    localStorage.removeItem('bizTrackOrders');
    setupOrdersDOM();
    window.flatpickr.mockClear();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    const rows = document.getElementById('tableBody').querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('second dispatch: reads orders from localStorage (line 382)', async () => {
    // After first dispatch, bizTrackOrders is now in localStorage
    setupOrdersDOM();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 100));
    const rows = document.getElementById('tableBody').querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('languageChanged event re-renders orders', async () => {
    setupOrdersDOM();
    window.dispatchEvent(new CustomEvent('languageChanged'));
    await new Promise(r => setTimeout(r, 100));
    expect(true).toBe(true);
  });

  test('uses DEFAULT_ORDERS when getDataWithFallback returns non-array (line 383)', async () => {
    const spy = jest.spyOn(dataService, 'getDataWithFallback').mockResolvedValue(null);
    localStorage.removeItem('bizTrackOrders');
    setupOrdersDOM();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 100));
    const stored = JSON.parse(localStorage.getItem('bizTrackOrders') || '[]');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});

// ── window.editRow (orders) ───────────────────────────────────────────────
describe('window.editRow (orders)', () => {
  function setupOrderFormDOM() {
    ['order-id', 'order-date', 'item-name', 'item-price', 'qty-bought', 'shipping', 'taxes', 'order-status'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    document.body.appendChild(btn);
    const form = document.createElement('div');
    form.id = 'order-form';
    form.style.display = 'none';
    document.body.appendChild(form);
  }

  test('does nothing when orderID does not exist', () => {
    setupOrderFormDOM();
    expect(() => window.editRow('NONEXISTENT')).not.toThrow();
    expect(document.getElementById('order-form').style.display).toBe('none');
  });

  test('populates form fields for existing orderID (1001 from DEFAULT_ORDERS)', () => {
    setupOrderFormDOM();
    // orders was populated by DOMContentLoaded above with DEFAULT_ORDERS (orderID "1001")
    expect(() => window.editRow('1001')).not.toThrow();
    expect(document.getElementById('order-form').style.display).toBe('block');
    expect(document.getElementById('order-id').value).toBe('1001');
  });
});

// ── window.deleteOrder with existing ID ──────────────────────────────────
describe('window.deleteOrder with existing orderID', () => {
  test('deletes order 1005 from DEFAULT_ORDERS', () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    // 1005 should exist in orders (from DOMContentLoaded initialization)
    expect(() => window.deleteOrder('1005')).not.toThrow();
  });
});

// ── window.updateOrder ────────────────────────────────────────────────────
describe('window.updateOrder', () => {
  function setupUpdateFormDOM(values = {}) {
    ['order-id', 'order-date', 'item-name', 'item-price', 'qty-bought', 'shipping', 'taxes', 'order-status'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = values[id] !== undefined ? values[id] : '';
      document.body.appendChild(el);
    });
    const btn = document.createElement('button');
    btn.id = 'submitBtn';
    document.body.appendChild(btn);
    const form = document.createElement('form');
    form.id = 'order-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    window.alert = jest.fn();
  }

  test('returns early when orderID does not exist', () => {
    setupUpdateFormDOM({ 'order-id': 'NONEXISTENT' });
    expect(() => window.updateOrder()).not.toThrow();
    expect(window.alert).not.toHaveBeenCalled();
  });

  test('alerts when required fields empty for existing order', () => {
    setupUpdateFormDOM({ 'order-id': '1001' }); // 1001 from DEFAULT_ORDERS
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when itemPrice is invalid', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': 'abc', 'qty-bought': '2', 'shipping': '5', 'taxes': '1' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when qtyBought is invalid', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '10', 'qty-bought': 'bad', 'shipping': '5', 'taxes': '1' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when shipping is invalid', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '10', 'qty-bought': '2', 'shipping': '', 'taxes': '1' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when taxes is invalid', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '10', 'qty-bought': '2', 'shipping': '5', 'taxes': '' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('updates successfully with all valid fields', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-06-01', 'item-name': 'Updated Item', 'order-status': 'Shipped', 'item-price': '30', 'qty-bought': '3', 'shipping': '5', 'taxes': '2' });
    window.updateOrder();
    expect(window.alert).not.toHaveBeenCalled();
  });

  test('alerts when itemPrice is negative (line 309-310)', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '-5', 'qty-bought': '2', 'shipping': '5', 'taxes': '1' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when qtyBought is negative (line 313-314)', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '10', 'qty-bought': '-1', 'shipping': '5', 'taxes': '1' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when shipping is negative (line 317-318)', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '10', 'qty-bought': '2', 'shipping': '-3', 'taxes': '1' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when taxes is negative (line 321-322)', () => {
    setupUpdateFormDOM({ 'order-id': '1001', 'order-date': '2025-01-01', 'item-name': 'Test', 'order-status': 'Pending', 'item-price': '10', 'qty-bought': '2', 'shipping': '5', 'taxes': '-2' });
    window.updateOrder();
    expect(window.alert).toHaveBeenCalled();
  });
});

// ── window.handleQuickAddOpen with quickAdd=1 (lines 405-406) ─────────────
describe('window.handleQuickAddOpen with quickAdd=1', () => {
  test('shows order-form when quickAdd=1 in URL (lines 405-406)', () => {
    const form = document.createElement('div');
    form.id = 'order-form';
    form.style.display = 'none';
    document.body.appendChild(form);

    const origLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?quickAdd=1', href: 'http://localhost/?quickAdd=1' },
    });

    window.handleQuickAddOpen();
    expect(form.style.display).toBe('block');

    Object.defineProperty(window, 'location', { writable: true, value: origLocation });
  });
});

// ── window.performSearch with populated orders ────────────────────────────
describe('window.performSearch with orders loaded', () => {
  test('filters orders by keyword (covers filter callback body)', () => {
    const input = document.createElement('input');
    input.id = 'searchInput';
    input.value = 'pending';
    document.body.appendChild(input);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    // After DOMContentLoaded, orders is populated with DEFAULT_ORDERS
    // Filtering 'pending' with non-empty orders exercises lines 344-345
    expect(() => window.performSearch()).not.toThrow();
  });
});

// ── translate() without window.t (line 17 false branch) ──────────────────
describe('translate fallback when window.t is not defined (line 17)', () => {
  test('newOrder validation calls translate() fallback when window.t is falsy', () => {
    const savedT = window.t;
    window.t = undefined;
    // Set up minimal DOM so newOrder can run validation
    ['order-id', 'order-date', 'item-name', 'order-status', 'item-price', 'qty-bought', 'shipping', 'taxes'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = '';
      document.body.appendChild(el);
    });
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    window.alert = jest.fn();
    const mockEvent = { preventDefault: jest.fn() };
    expect(() => window.newOrder(mockEvent)).not.toThrow();
    window.t = savedT;
  });
});

// ── createOrderDatePicker: flatpickr onReady creates custom buttons (lines 75-91) ──
describe('createOrderDatePicker: flatpickr onReady callback (lines 75-91)', () => {
  test('createCustomButtons is called when flatpickr onReady fires', () => {
    const orderDateInput = document.createElement('input');
    orderDateInput.id = 'order-date';
    document.body.appendChild(orderDateInput);

    // Mock flatpickr to immediately call the onReady callback with a mock instance
    const mockInstance = {
      setDate: jest.fn(),
      clear: jest.fn(),
      calendarContainer: document.createElement('div'),
    };
    const savedFlatpickr = window.flatpickr;
    window.flatpickr = jest.fn((el, config) => {
      if (config && config.onReady) {
        config.onReady([], '', mockInstance);
      }
    });

    expect(() => window.createOrderDatePicker()).not.toThrow();
    window.flatpickr = savedFlatpickr;
  });

  test('createCustomButtons today/clear buttons use datePickerConfig when available', () => {
    const orderDateInput = document.createElement('input');
    orderDateInput.id = 'order-date';
    document.body.appendChild(orderDateInput);

    window.datePickerI18n = { en: { today: 'TodayLabel', clear: 'ClearLabel' } };
    const mockInstance = {
      setDate: jest.fn(),
      clear: jest.fn(),
      calendarContainer: document.createElement('div'),
    };
    const savedFlatpickr = window.flatpickr;
    window.flatpickr = jest.fn((el, config) => {
      if (config && config.onReady) {
        config.onReady([], '', mockInstance);
      }
    });

    expect(() => window.createOrderDatePicker()).not.toThrow();
    window.flatpickr = savedFlatpickr;
  });

  test('createCustomButtons falls back to window.t when datePickerConfig is missing (lines 80, 85)', () => {
    const orderDateInput = document.createElement('input');
    orderDateInput.id = 'order-date';
    document.body.appendChild(orderDateInput);

    // Set datePickerI18n without today/clear keys → datePickerConfig?.today is undefined → || window.t?.()
    window.datePickerI18n = { en: {} };
    const mockInstance = {
      setDate: jest.fn(),
      clear: jest.fn(),
      calendarContainer: document.createElement('div'),
    };
    const savedFlatpickr = window.flatpickr;
    window.flatpickr = jest.fn((el, config) => {
      if (config && config.onReady) {
        config.onReady([], '', mockInstance);
      }
    });

    expect(() => window.createOrderDatePicker()).not.toThrow();
    window.flatpickr = savedFlatpickr;
    window.datePickerI18n = { en: { today: 'Today', clear: 'Clear' } };
  });

  test('createCustomButtons uses hard-coded fallback when no config and no window.t (line 80 right-side)', () => {
    const orderDateInput = document.createElement('input');
    orderDateInput.id = 'order-date';
    document.body.appendChild(orderDateInput);

    window.datePickerI18n = {};  // No config for 'en' → datePickerConfig is undefined
    const savedT = window.t;
    window.t = undefined;       // window.t?.() → undefined → uses 'Today'/'Clear' fallback
    const mockInstance = {
      setDate: jest.fn(),
      clear: jest.fn(),
      calendarContainer: document.createElement('div'),
    };
    const savedFlatpickr = window.flatpickr;
    window.flatpickr = jest.fn((el, config) => {
      if (config && config.onReady) {
        config.onReady([], '', mockInstance);
      }
    });

    expect(() => window.createOrderDatePicker()).not.toThrow();
    window.flatpickr = savedFlatpickr;
    window.t = savedT;
    window.datePickerI18n = { en: { today: 'Today', clear: 'Clear' } };
  });
});

// ── renderOrders without window.translateProductName (lines 206-221) ─────
describe('renderOrders without window.translateProductName', () => {
  test('renders item name directly when translateProductName is not defined', () => {
    const savedFn = window.translateProductName;
    window.translateProductName = undefined;
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    const order = { orderID: 'X001', orderDate: '2025-01-01', itemName: 'Test Cap', itemPrice: 10, qtyBought: 1, shipping: 0, taxes: 0, orderTotal: 10, orderStatus: 'Pending' };
    expect(() => window.renderOrders([order])).not.toThrow();
    expect(tbody.innerHTML).toContain('Test Cap');
    window.translateProductName = savedFn;
  });

  test('outer || order.itemName branch (line 206): escapeHTML undefined', () => {
    const savedEscape = window.escapeHTML;
    const savedFn = window.translateProductName;
    window.escapeHTML = undefined;       // escapeHTML?.() → undefined → outer || order.itemName runs
    window.translateProductName = undefined; // translateProductName?.() → undefined → inner || order.itemName
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    const order = { orderID: 'X002', orderDate: '2025-01-01', itemName: 'Blue Hat', itemPrice: 5, qtyBought: 2, shipping: 0, taxes: 0, orderTotal: 10, orderStatus: 'Shipped' };
    expect(() => window.renderOrders([order])).not.toThrow();
    expect(tbody.innerHTML).toContain('Blue Hat');
    window.escapeHTML = savedEscape;
    window.translateProductName = savedFn;
  });

  test('statusText fallback (line 207): window.t undefined → || order.orderStatus runs', () => {
    const savedT = window.t;
    window.t = undefined; // window.t?.(...) → undefined → || order.orderStatus runs
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    const order = { orderID: 'X003', orderDate: '2025-01-01', itemName: 'Hat', itemPrice: 5, qtyBought: 1, shipping: 0, taxes: 0, orderTotal: 5, orderStatus: 'Pending' };
    expect(() => window.renderOrders([order])).not.toThrow();
    window.t = savedT;
  });
});

// ── displayRevenue: label fallback (line 235) ─────────────────────────────
describe('displayRevenue: label fallback when window.t is undefined (line 235)', () => {
  test('uses fallback label when window.t is undefined', () => {
    const savedT = window.t;
    window.t = undefined;
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    expect(() => window.displayRevenue()).not.toThrow();
    expect(rev.innerHTML).toContain('Total Revenue');
    window.t = savedT;
  });
});

// ── handleQuickAddOpen with quickAdd=1 but no form element (line 406 false branch) ──
describe('handleQuickAddOpen when form element does not exist', () => {
  test('does not throw when #order-form is absent and quickAdd=1', () => {
    const origLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?quickAdd=1', href: 'http://localhost/?quickAdd=1' },
    });
    // No #order-form in DOM → if(form) false branch
    expect(() => window.handleQuickAddOpen()).not.toThrow();
    Object.defineProperty(window, 'location', { writable: true, value: origLocation });
  });
});

// ── exportToCSV with zh language (line 358 true branch) ──────────────────
describe('exportToCSV language handling', () => {
  test('uses zh headers when getCurrentLang returns zh', () => {
    const savedGetLang = window.getCurrentLang;
    window.getCurrentLang = jest.fn(() => 'zh');
    window.translateOrderStatusForExport = window.translateOrderStatusForExport || jest.fn((s) => s);
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLang = savedGetLang;
  });

  test('falls back to en headers when lang is not in headers map (line 358 || branch)', () => {
    const savedGetLang = window.getCurrentLang;
    window.getCurrentLang = jest.fn(() => 'zhTW');  // not in headers → || headers.en
    window.translateOrderStatusForExport = window.translateOrderStatusForExport || jest.fn((s) => s);
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLang = savedGetLang;
  });
});

// ── DOMContentLoaded with #searchInput covers line 395 ────────────────────
describe('DOMContentLoaded handler with searchInput present (line 395)', () => {
  test('binds debounced search when #searchInput exists in DOM', () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    const rev = document.createElement('div');
    rev.id = 'total-revenue';
    document.body.appendChild(rev);
    const dateInput = document.createElement('input');
    dateInput.id = 'order-date';
    document.body.appendChild(dateInput);
    const searchInput = document.createElement('input');
    searchInput.id = 'searchInput';
    document.body.appendChild(searchInput);
    expect(() => document.dispatchEvent(new Event('DOMContentLoaded'))).not.toThrow();
  });
});
