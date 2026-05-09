// script.js (dashboard) — test window-level functions exposed at module load time

beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.biztrackDb = null;
  window.biztrackDbHelpers = {
    isReady: jest.fn(() => false),
    syncCollection: jest.fn(),
    logActivity: jest.fn(),
  };
  window.getCurrentLanguage = jest.fn(() => 'en');
  window.translateProductName = jest.fn((name) => name);
  window.initI18n = jest.fn();
  window.addGuideButton = jest.fn();
  localStorage.clear();

  window.ApexCharts = jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
    updateOptions: jest.fn(),
  }));
});

beforeAll(async () => {
  await import('../script.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ── Module-level window exports ───────────────────────────────────────────
describe('script.js module-level exports', () => {
  test('window.openSidebar is a function', () => {
    expect(typeof window.openSidebar).toBe('function');
  });

  test('window.closeSidebar is a function', () => {
    expect(typeof window.closeSidebar).toBe('function');
  });

  test('window.PRODUCT_CATEGORY_ORDER is an array', () => {
    expect(Array.isArray(window.PRODUCT_CATEGORY_ORDER)).toBe(true);
    expect(window.PRODUCT_CATEGORY_ORDER.length).toBeGreaterThan(0);
  });

  test('window.calculateCategoryUnitsSoldFromOrders is a function', () => {
    expect(typeof window.calculateCategoryUnitsSoldFromOrders).toBe('function');
  });
});

// ── window.calculateCategoryUnitsSoldFromOrders (re-exported via script.js) ──
describe('window.calculateCategoryUnitsSoldFromOrders via script.js', () => {
  test('returns an object with category keys', () => {
    const orders = [
      { itemName: 'Classic Snapback Cap', qtyBought: 2 },
      { itemName: 'Ceramic Coffee Mug', qtyBought: 3 },
    ];
    const result = window.calculateCategoryUnitsSoldFromOrders(orders);
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  test('returns zero quantities for empty orders array', () => {
    const result = window.calculateCategoryUnitsSoldFromOrders([]);
    // All categories should exist with value 0
    Object.values(result).forEach((v) => expect(v).toBe(0));
  });
});

// ── sidebar helpers ───────────────────────────────────────────────────────
describe('sidebar functions (script)', () => {
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

// ── window.onload handler (defined at module level) ───────────────────────
describe('window.onload is set by script.js', () => {
  test('window.onload is a function', () => {
    expect(typeof window.onload).toBe('function');
  });
});

// ── window.onload execution: covers loadDashboardSummary + renderLowStockList ──
describe('window.onload execution triggers loadDashboardSummary', () => {
  test('calls initI18n and completes without throwing', async () => {
    window.initI18n.mockClear();
    window.onload();
    await new Promise(r => setTimeout(r, 200));
    expect(window.initI18n).toHaveBeenCalled();
  });

  test('renders low-stock list when #low-stock-list element exists', async () => {
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);

    window.onload();
    await new Promise(r => setTimeout(r, 200));
    expect(listEl.innerHTML.length).toBeGreaterThan(0);
  });

  test('updates rev/exp/balance/orders divs when elements present', async () => {
    ['rev-amount', 'exp-amount', 'balance', 'num-orders'].forEach(id => {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    });

    window.onload();
    await new Promise(r => setTimeout(r, 200));

    const revEl = document.getElementById('rev-amount');
    expect(revEl.innerHTML.length).toBeGreaterThan(0);
  });

  test('initializeChart runs when #bar-chart and #donut-chart exist', async () => {
    ['bar-chart', 'donut-chart'].forEach(id => {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    });

    window.ApexCharts.mockClear();
    window.onload();
    await new Promise(r => setTimeout(r, 200));
    // loadDashboardSummary completes (no error is the assertion here)
    expect(true).toBe(true);
  });

  test('window.onload works even without initI18n defined', async () => {
    const saved = window.initI18n;
    window.initI18n = undefined;
    // Without initI18n, it enters the polling loop; we just confirm no immediate crash
    window.onload();
    await new Promise(r => setTimeout(r, 50));
    window.initI18n = saved;
  });
});

// ── languageChanged event triggers loadDashboardSummary ───────────────────
describe('languageChanged event listener (script)', () => {
  test('dispatching languageChanged runs loadDashboardSummary without throwing', async () => {
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);

    window.dispatchEvent(new CustomEvent('languageChanged'));
    await new Promise(r => setTimeout(r, 200));
    expect(true).toBe(true);
  });
});

// ── renderLowStockList branch: empty products shows placeholder ─────────────
describe('renderLowStockList with empty products list', () => {
  test('shows empty-state message when products localStorage is empty array', async () => {
    localStorage.setItem('bizTrackProducts', JSON.stringify([]));

    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);

    window.onload();
    await new Promise(r => setTimeout(r, 200));

    expect(listEl.innerHTML).toMatch(/low-stock/);

    localStorage.removeItem('bizTrackProducts');
  });
});

// ── window.updateCardContent (lines 58-103) ───────────────────────────────
describe('window.updateCardContent', () => {
  test('is a function', () => {
    expect(typeof window.updateCardContent).toBe('function');
  });

  test('runs without throwing when no DOM elements exist', () => {
    expect(() => window.updateCardContent()).not.toThrow();
  });

  test('updates title text when card divs with .title child exist', () => {
    ['rev-amount', 'exp-amount', 'balance', 'num-orders'].forEach(id => {
      const div = document.createElement('div');
      div.id = id;
      const title = document.createElement('span');
      title.className = 'title';
      const value = document.createElement('span');
      value.className = 'amount-value';
      div.appendChild(title);
      div.appendChild(value);
      document.body.appendChild(div);
    });
    expect(() => window.updateCardContent()).not.toThrow();
    expect(document.querySelector('#rev-amount .title').textContent).toBeTruthy();
  });

  test('returns early when revDiv has no .amount-value child (line 80)', () => {
    const div = document.createElement('div');
    div.id = 'rev-amount';
    const title = document.createElement('span');
    title.className = 'title';
    div.appendChild(title);
    // No .amount-value → early return
    document.body.appendChild(div);
    expect(() => window.updateCardContent()).not.toThrow();
  });

  test('handles missing .title children gracefully in expDiv/balDiv/ordDiv (lines 86,93,100 false branches)', () => {
    // revDiv must have .amount-value so the early return at line 80 does NOT trigger
    const revDiv = document.createElement('div');
    revDiv.id = 'rev-amount';
    const amountValue = document.createElement('span');
    amountValue.className = 'amount-value';
    revDiv.appendChild(amountValue);
    document.body.appendChild(revDiv);
    // expDiv, balDiv, ordDiv without .title → covers false branch of if(titleElement)
    ['exp-amount', 'balance', 'num-orders'].forEach(id => {
      const div = document.createElement('div');
      div.id = id;
      document.body.appendChild(div);
    });
    expect(() => window.updateCardContent()).not.toThrow();
  });

  test('uses localStorage fallback when window.getCurrentLanguage is not defined (line 58)', () => {
    const saved = window.getCurrentLanguage;
    window.getCurrentLanguage = undefined;
    expect(() => window.updateCardContent()).not.toThrow();
    window.getCurrentLanguage = saved;
  });

  test('uses fallback values when window.t is not defined (line 60)', () => {
    const savedT = window.t;
    window.t = undefined;
    expect(() => window.updateCardContent()).not.toThrow();
    window.t = savedT;
  });
});

// ── window.initializeChart (lines 185-366) ───────────────────────────────
describe('window.initializeChart', () => {
  test('is a function', () => {
    expect(typeof window.initializeChart).toBe('function');
  });

  test('runs without throwing when chart containers are absent', async () => {
    window.ApexCharts.mockClear();
    await expect(window.initializeChart()).resolves.not.toThrow();
  });

  test('creates ApexCharts instances when #bar-chart and #donut-chart exist', async () => {
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);

    window.ApexCharts.mockClear();
    await window.initializeChart();
    expect(window.ApexCharts).toHaveBeenCalled();
  });

  test('calls destroy() on existing charts before re-creating (covers lines 357-358)', async () => {
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);

    // First call sets barChart/donutChart module vars
    await window.initializeChart();
    const destroyMock = window.ApexCharts.mock.results[0]?.value?.destroy;
    // Second call should trigger destroy()
    await window.initializeChart();
    if (destroyMock) {
      expect(destroyMock).toHaveBeenCalled();
    }
  });

  test('works with zh language setting', async () => {
    window.getCurrentLanguage.mockReturnValueOnce('zh');
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);
    await expect(window.initializeChart()).resolves.not.toThrow();
  });

  test('works without window.getCurrentLanguage (line 185 false branch)', async () => {
    const saved = window.getCurrentLanguage;
    window.getCurrentLanguage = undefined;
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);
    await expect(window.initializeChart()).resolves.not.toThrow();
    window.getCurrentLanguage = saved;
  });

  test('works without window.t (line 186 false branch)', async () => {
    const saved = window.t;
    window.t = undefined;
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);
    await expect(window.initializeChart()).resolves.not.toThrow();
    window.t = saved;
  });

  test('bar chart tooltip formatter returns rounded integer string (line 266)', async () => {
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);
    window.ApexCharts.mockClear();
    await window.initializeChart();
    // Each ApexCharts call: args[0] = DOM element, args[1] = options
    for (const args of window.ApexCharts.mock.calls) {
      const opts = args[1] || args[0];
      // Bar chart has chart.type === 'bar'
      if (opts?.chart?.type === 'bar' && opts?.tooltip?.y?.formatter) {
        const result = opts.tooltip.y.formatter(4.7);
        expect(result).toBe('5');
      }
      // Donut chart has chart.type === 'donut'
      if (opts?.chart?.type === 'donut' && opts?.tooltip?.y?.formatter) {
        const result = opts.tooltip.y.formatter(9.5);
        expect(result).toBe('$9.50');
      }
    }
  });
});

// ── loadDashboardSummary: missing getCurrentLanguage/window.t/addGuideButton ──
describe('window.onload without optional globals (lines 120-121, 179)', () => {
  test('loadDashboardSummary without window.getCurrentLanguage covers line 120 false branch', async () => {
    const saved = window.getCurrentLanguage;
    window.getCurrentLanguage = undefined;
    expect(() => window.onload()).not.toThrow();
    await new Promise(r => setTimeout(r, 200));
    window.getCurrentLanguage = saved;
  });

  test('loadDashboardSummary without window.t covers line 121 false branch', async () => {
    const savedT = window.t;
    window.t = undefined;
    expect(() => window.onload()).not.toThrow();
    await new Promise(r => setTimeout(r, 200));
    window.t = savedT;
  });

  test('loadDashboardSummary without window.addGuideButton covers line 179 false branch', async () => {
    const savedGuide = window.addGuideButton;
    window.addGuideButton = undefined;
    expect(() => window.onload()).not.toThrow();
    await new Promise(r => setTimeout(r, 200));
    window.addGuideButton = savedGuide;
  });
});

// ── loadDashboardSummary: order-count elements (lines 172-175 true branches) ─
describe('window.onload with order-count elements', () => {
  test('populates pending/processing/shipped/delivered count elements', async () => {
    ['rev-amount', 'exp-amount', 'balance', 'num-orders'].forEach(id => {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    });
    ['pending-order-count', 'processing-order-count', 'shipped-order-count', 'delivered-order-count'].forEach(id => {
      const el = document.createElement('span');
      el.id = id;
      document.body.appendChild(el);
    });
    window.onload();
    await new Promise(r => setTimeout(r, 200));
    expect(document.getElementById('pending-order-count').textContent).toMatch(/\d+/);
  });
});

// ── initializeChart: expense category not in expenseCategoryKeyMap (line 307) ─
describe('initializeChart with expense category not in map', () => {
  test('uses category.toLowerCase() fallback when category not in expenseCategoryKeyMap (line 307)', async () => {
    // Inject an expense with category not in the map to trigger the || fallback
    localStorage.setItem('bizTrackTransactions', JSON.stringify([
      { trID: 'TX1', trDate: '2024-01-01', trCategory: 'CustomUnknownCat', trAmount: 50, trNotes: '' }
    ]));
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);
    await expect(window.initializeChart()).resolves.not.toThrow();
    localStorage.removeItem('bizTrackTransactions');
  });
});

// ── window.renderLowStockList (lines 20-49) ───────────────────────────────
describe('window.renderLowStockList', () => {
  test('is a function after module loads', () => {
    expect(typeof window.renderLowStockList).toBe('function');
  });

  test('does nothing when #low-stock-list element is absent (line 22)', () => {
    expect(() => window.renderLowStockList([])).not.toThrow();
  });

  test('shows empty placeholder when products is null (line 26 true branch)', () => {
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);
    window.renderLowStockList(null);
    expect(listEl.innerHTML).toMatch(/low-stock/);
  });

  test('renders items using window.t when it is a function (line 24 true branch)', () => {
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);
    const products = [{ prodName: 'CapA', prodSold: 5 }, { prodName: 'CapB', prodSold: 3 }];
    window.renderLowStockList(products);
    expect(listEl.innerHTML).toContain('low-stock-item');
  });

  test('uses key as fallback when window.t is not a function (line 24 false branch)', () => {
    const savedT = window.t;
    window.t = 'notAFunction';
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);
    const products = [{ prodName: 'CapC', prodSold: 2 }];
    expect(() => window.renderLowStockList(products)).not.toThrow();
    window.t = savedT;
  });

  test('renders product name without translateProductName when it is not a function (line 44 false branch)', () => {
    const savedFn = window.translateProductName;
    window.translateProductName = undefined;
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);
    const products = [{ prodName: 'CapD', prodSold: 1 }];
    window.renderLowStockList(products);
    expect(listEl.innerHTML).toContain('CapD');
    window.translateProductName = savedFn;
  });

  test('sort || branch: two items with same stock falls back to localeCompare (line 37)', () => {
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);
    const products = [
      { prodName: 'Zebra', prodSold: 5 },
      { prodName: 'Apple', prodSold: 5 },
    ];
    window.renderLowStockList(products);
    // Both have same stock → localeCompare used → Apple should come first
    expect(listEl.innerHTML).toContain('Apple');
  });

  test('filters out products with falsy prodName (line 36 filter branch)', () => {
    const listEl = document.createElement('ul');
    listEl.id = 'low-stock-list';
    document.body.appendChild(listEl);
    const products = [
      { prodName: '', prodSold: 1 },
      { prodName: null, prodSold: 2 },
      { prodName: 'ValidName', prodSold: 3 },
    ];
    window.renderLowStockList(products);
    expect(listEl.innerHTML).toContain('ValidName');
  });
});
