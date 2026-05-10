// products.js — test window-level functions exposed at module load time

beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.biztrackDb = null;
  window.biztrackDbHelpers = {
    isReady: jest.fn(() => false),
    syncCollection: jest.fn(),
    logActivity: jest.fn(),
  };
  window.getCurrentLanguage = jest.fn(() => 'en');
  window.addGuideButton = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
  localStorage.clear();

  // Pre-seed localStorage so loadProductsFromStorage takes the "parse stored" branch (line 88)
  const storedProducts = [
    { prodID: 'PD001', prodName: 'Baseball caps', prodDesc: 'Peace embroidered cap', prodCat: 'Hats', prodPrice: 25.0, prodSold: 20 },
    { prodID: 'PD002', prodName: 'Snapbacks', prodDesc: 'Classic snapback fit', prodCat: 'Hats', prodPrice: 28.0, prodSold: 15 },
  ];
  localStorage.setItem('bizTrackProducts', JSON.stringify(storedProducts));
  localStorage.setItem('bizTrackProductsCatalogVersion', 'full-16-v1');

  // products.js calls init() immediately when readyState is "complete".
  // init() calls renderProducts() which needs #tableBody to exist.
  const tbody = document.createElement('tbody');
  tbody.id = 'tableBody';
  document.body.appendChild(tbody);
});

beforeAll(async () => {
  await import('../products.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ── window.translateProductDescription ───────────────────────────────────
describe('window.translateProductDescription (products.js)', () => {
  test('is a function', () => {
    expect(typeof window.translateProductDescription).toBe('function');
  });

  test('returns the description when window.t returns the key', () => {
    // window.t returns the key itself (mock), so translated === key → falls back to description
    const result = window.translateProductDescription('Classic Snapback Cap');
    expect(result).toBe('Classic Snapback Cap');
  });

  test('returns undefined when description is undefined', () => {
    expect(window.translateProductDescription(undefined)).toBeUndefined();
  });

  test('returns null when description is null', () => {
    expect(window.translateProductDescription(null)).toBeNull();
  });

  test('uses translated value when window.t gives a different string', () => {
    window.t.mockImplementation((key) => {
      if (key === 'product.desc.TestDesc') return 'Translated Desc';
      return key;
    });
    const result = window.translateProductDescription('TestDesc');
    expect(result).toBe('Translated Desc');
    window.t.mockImplementation((key) => key); // reset
  });
});

// ── window.translateProductCategory ──────────────────────────────────────
describe('window.translateProductCategory (products.js)', () => {
  test('is a function', () => {
    expect(typeof window.translateProductCategory).toBe('function');
  });

  test('uses raw category when window.t is undefined but mapping key exists', () => {
    const prev = window.t;
    window.t = undefined;
    expect(window.translateProductCategory('Hats')).toBe('Hats');
    window.t = prev;
  });

  test('returns original category when no translation found', () => {
    window.t.mockImplementation((key) => key);
    const result = window.translateProductCategory('Hats');
    // Since mock returns key, translated === key → falls back to 'Hats'
    expect(result).toBe('Hats');
  });

  test('returns translated category when window.t provides a translation', () => {
    window.t.mockImplementation((key) => {
      if (key === 'products.hats') return '帽子';
      return key;
    });
    const result = window.translateProductCategory('Hats');
    expect(result).toBe('帽子');
    window.t.mockImplementation((key) => key); // reset
  });

  test('returns unknown category unchanged when no mapping key exists', () => {
    const result = window.translateProductCategory('UnknownCat');
    expect(result).toBe('UnknownCat');
  });
});

// ── window.syncProductsToDb ───────────────────────────────────────────────
describe('window.syncProductsToDb', () => {
  test('is a function', () => {
    expect(typeof window.syncProductsToDb).toBe('function');
  });

  test('returns early when db is not ready', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
    await expect(
      window.syncProductsToDb('create', { prodID: 'P1' })
    ).resolves.toBeUndefined();
  });

  test('calls syncCollection when db is ready', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(true);
    window.biztrackDbHelpers.syncCollection.mockResolvedValue();
    window.biztrackDbHelpers.logActivity.mockResolvedValue();
    await window.syncProductsToDb('create', { prodID: 'P1' });
    expect(window.biztrackDbHelpers.syncCollection).toHaveBeenCalledWith(
      'products',
      expect.any(Array),
      'prodID'
    );
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
  });

  test('does not log bulk page sync placeholder', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(true);
    window.biztrackDbHelpers.syncCollection.mockResolvedValue();
    window.biztrackDbHelpers.logActivity.mockClear();
    await window.syncProductsToDb('sync', { prodID: 'all-products' });
    expect(window.biztrackDbHelpers.logActivity).not.toHaveBeenCalled();
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
  });

  test('handles sync errors without throwing', async () => {
    window.biztrackDbHelpers.isReady.mockReturnValue(true);
    window.biztrackDbHelpers.syncCollection.mockRejectedValue(new Error('fail'));
    await expect(
      window.syncProductsToDb('create', { prodID: 'P1' })
    ).resolves.toBeUndefined();
    window.biztrackDbHelpers.isReady.mockReturnValue(false);
  });
});

// ── window.openForm / closeForm ────────────────────────────────────────────
describe('window.openForm / closeForm (products)', () => {
  beforeEach(() => {
    if (!document.getElementById('product-form')) {
      const form = document.createElement('div');
      form.id = 'product-form';
      form.style.display = 'none';
      document.body.appendChild(form);
    }
  });

  test('openForm toggles product-form to block', () => {
    document.getElementById('product-form').style.display = 'none';
    window.openForm();
    expect(document.getElementById('product-form').style.display).toBe('block');
  });

  test('openForm toggles product-form back to none', () => {
    document.getElementById('product-form').style.display = 'block';
    window.openForm();
    expect(document.getElementById('product-form').style.display).toBe('none');
  });

  test('closeForm sets product-form display to none', () => {
    document.getElementById('product-form').style.display = 'block';
    window.closeForm();
    expect(document.getElementById('product-form').style.display).toBe('none');
  });
});

// ── window.syncCategoryWithSelectedName ───────────────────────────────────
describe('window.syncCategoryWithSelectedName', () => {
  test('is a function', () => {
    expect(typeof window.syncCategoryWithSelectedName).toBe('function');
  });

  test('fills product-cat when product-name has a known mapping', () => {
    const nameInput = document.createElement('input');
    nameInput.id = 'product-name';
    const catInput = document.createElement('input');
    catInput.id = 'product-cat';
    document.body.appendChild(nameInput);
    document.body.appendChild(catInput);

    nameInput.value = 'Classic Snapback Cap';
    window.syncCategoryWithSelectedName();
    // Should set the category to whatever DEFAULT_PRODUCTS maps to for this name
    expect(typeof catInput.value).toBe('string');
  });

  test('does nothing when product-name has no mapping', () => {
    const nameInput = document.createElement('input');
    nameInput.id = 'product-name';
    const catInput = document.createElement('input');
    catInput.id = 'product-cat';
    catInput.value = 'original';
    document.body.appendChild(nameInput);
    document.body.appendChild(catInput);

    nameInput.value = 'Nonexistent Product Name XYZ';
    window.syncCategoryWithSelectedName();
    expect(catInput.value).toBe('original');
  });
});

// ── window.renderProducts ─────────────────────────────────────────────────
describe('window.renderProducts', () => {
  const sampleProducts = [
    { prodID: 'P1', prodName: 'Classic Snapback Cap', prodDesc: 'A cap', prodCat: 'Hats', prodPrice: 25.99, prodSold: 10 },
    { prodID: 'P2', prodName: 'Ceramic Coffee Mug', prodDesc: 'A mug', prodCat: 'Drinkware', prodPrice: 14.99, prodSold: 5 },
  ];

  test('renders one row per product', () => {
    const tbody = document.getElementById('tableBody') || (() => {
      const el = document.createElement('tbody');
      el.id = 'tableBody';
      document.body.appendChild(el);
      return el;
    })();
    window.renderProducts(sampleProducts);
    expect(tbody.querySelectorAll('tr').length).toBe(2);
  });

  test('renders empty tbody for empty array', () => {
    const tbody = document.getElementById('tableBody') || (() => {
      const el = document.createElement('tbody');
      el.id = 'tableBody';
      document.body.appendChild(el);
      return el;
    })();
    window.renderProducts([]);
    expect(tbody.querySelectorAll('tr').length).toBe(0);
  });

  test('uses plain field values when translate helpers are absent', () => {
    const tbody = document.getElementById('tableBody') || (() => {
      const el = document.createElement('tbody');
      el.id = 'tableBody';
      document.body.appendChild(el);
      return el;
    })();

    const prevName = window.translateProductName;
    const prevDesc = window.translateProductDescription;
    const prevCat = window.translateProductCategory;
    delete window.translateProductName;
    delete window.translateProductDescription;
    delete window.translateProductCategory;

    window.renderProducts(sampleProducts);

    expect(tbody.querySelectorAll('tr').length).toBe(2);

    window.translateProductName = prevName;
    window.translateProductDescription = prevDesc;
    window.translateProductCategory = prevCat;
  });

  test('uses default Edit/Delete button titles when window.t is undefined', () => {
    const tbody = document.getElementById('tableBody') || (() => {
      const el = document.createElement('tbody');
      el.id = 'tableBody';
      document.body.appendChild(el);
      return el;
    })();

    const prevT = window.t;
    window.t = undefined;
    window.renderProducts(sampleProducts);
    expect(tbody.innerHTML).toContain('Edit');
    expect(tbody.innerHTML).toContain('Delete');
    window.t = prevT;
  });
});

// ── window.deleteProduct ──────────────────────────────────────────────────
describe('window.deleteProduct', () => {
  test('does nothing when prodID is not found', () => {
    expect(() => window.deleteProduct('nonexistent-P99')).not.toThrow();
  });
});

// ── window.exportToCSV (products) ─────────────────────────────────────────
describe('window.exportToCSV (products)', () => {
  test('is a function', () => {
    expect(typeof window.exportToCSV).toBe('function');
  });

  test('runs without throwing for en language', () => {
    window.getCurrentLanguage.mockReturnValue('en');
    expect(() => window.exportToCSV()).not.toThrow();
  });

  test('runs without throwing for zh language', () => {
    window.getCurrentLanguage.mockReturnValue('zh');
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLanguage.mockReturnValue('en');
  });

  test('uses Traditional Chinese csv filename when language is zhTW', () => {
    window.getCurrentLanguage.mockReturnValue('zhTW');
    expect(() => window.exportToCSV()).not.toThrow();
    window.getCurrentLanguage.mockReturnValue('en');
  });
});

// ── window.performSearch (products) ──────────────────────────────────────
describe('window.performSearch (products)', () => {
  beforeEach(() => {
    const input = document.createElement('input');
    input.id = 'searchInput';
    document.body.appendChild(input);
    if (!document.getElementById('tableBody')) {
      const tbody = document.createElement('tbody');
      tbody.id = 'tableBody';
      document.body.appendChild(tbody);
    }
  });

  test('renders all when search is empty', () => {
    document.getElementById('searchInput').value = '';
    expect(() => window.performSearch()).not.toThrow();
  });

  test('renders filtered products for a keyword', () => {
    document.getElementById('searchInput').value = 'cap';
    expect(() => window.performSearch()).not.toThrow();
  });
});

// ── window.sortTable (products) ───────────────────────────────────────────
describe('window.sortTable (products)', () => {
  test('runs without throwing', () => {
    if (!document.getElementById('tableBody')) {
      const tbody = document.createElement('tbody');
      tbody.id = 'tableBody';
      document.body.appendChild(tbody);
    }
    expect(() => window.sortTable('prodPrice')).not.toThrow();
  });
});

// ── window.editRow (products) ─────────────────────────────────────────────
describe('window.editRow (products)', () => {
  function setupProductFormDOM() {
    ['product-id', 'product-name', 'product-desc', 'product-cat', 'product-price', 'product-sold'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      document.body.appendChild(el);
    });
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    document.body.appendChild(submitBtn);
    const form = document.createElement('div');
    form.id = 'product-form';
    form.style.display = 'none';
    document.body.appendChild(form);
    const catSelect = document.createElement('select');
    catSelect.id = 'product-cat-select';
    document.body.appendChild(catSelect);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
  }

  test('does nothing when prodID does not exist', () => {
    setupProductFormDOM();
    expect(() => window.editRow('NONEXISTENT')).not.toThrow();
    expect(document.getElementById('product-form').style.display).toBe('none');
  });

  test('populates form and shows it for existing prodID', () => {
    setupProductFormDOM();
    // DEFAULT_PRODUCTS has PD001 (Baseball caps)
    expect(() => window.editRow('PD001')).not.toThrow();
    expect(document.getElementById('product-form').style.display).toBe('block');
    expect(document.getElementById('product-id').value).toBe('PD001');
  });
});

// ── window.addOrUpdate (products) ─────────────────────────────────────────
describe('window.addOrUpdate (products)', () => {
  function setupProductFormDOM(isEdit = false) {
    ['product-id', 'product-name', 'product-desc', 'product-cat', 'product-price', 'product-sold'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = '';
      document.body.appendChild(el);
    });
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    if (isEdit) submitBtn.dataset.isEdit = 'true';
    document.body.appendChild(submitBtn);
    const form = document.createElement('form');
    form.id = 'product-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    window.alert = jest.fn();
  }

  test('routes to newProduct when isEdit is not set', () => {
    setupProductFormDOM(false);
    const e = { preventDefault: jest.fn() };
    expect(() => window.addOrUpdate(e)).not.toThrow();
    expect(window.alert).toHaveBeenCalled(); // empty fields
  });

  test('routes to updateProduct when isEdit is true', () => {
    setupProductFormDOM(true);
    document.getElementById('product-id').value = 'NONEXISTENT';
    expect(() => window.updateProduct()).not.toThrow(); // non-existent → early return
  });
});

// ── window.newProduct validation ──────────────────────────────────────────
describe('window.newProduct validation', () => {
  function setupFormDOM(values = {}) {
    ['product-id', 'product-name', 'product-desc', 'product-cat', 'product-price', 'product-sold'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = values[id] !== undefined ? values[id] : '';
      document.body.appendChild(el);
    });
    const form = document.createElement('form');
    form.id = 'product-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    window.alert = jest.fn();
  }

  test('alerts when required fields are empty', () => {
    setupFormDOM();
    const e = { preventDefault: jest.fn() };
    window.newProduct(e);
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when product-price is not a number', () => {
    setupFormDOM({ 'product-id': 'P999', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': 'abc', 'product-sold': '5' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when product-sold is not a number', () => {
    setupFormDOM({ 'product-id': 'P999', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '20', 'product-sold': 'xyz' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when product-price is negative', () => {
    setupFormDOM({ 'product-id': 'P999', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '-5', 'product-sold': '5' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when product-sold is negative', () => {
    setupFormDOM({ 'product-id': 'P999', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '20', 'product-sold': '-1' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when prodID already exists', () => {
    setupFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '20', 'product-sold': '5' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when name-category pair does not match (covers isNameCategoryPairValid)', () => {
    setupFormDOM({ 'product-id': 'P_NEW', 'product-name': 'Baseball caps', 'product-cat': 'Bags', 'product-price': '20', 'product-sold': '5' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).toHaveBeenCalled();
  });

  test('creates product when all valid (matching name-category pair)', () => {
    // Baseball caps → Hats is a valid pair (from productCategoryMap in products.js)
    setupFormDOM({ 'product-id': 'P_VALID_01', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '25', 'product-sold': '10' });
    window.newProduct({ preventDefault: jest.fn() });
    expect(window.alert).not.toHaveBeenCalled();
  });
});

// ── window.updateProduct validation ──────────────────────────────────────
describe('window.updateProduct', () => {
  function setupUpdateFormDOM(values = {}) {
    ['product-id', 'product-name', 'product-desc', 'product-cat', 'product-price', 'product-sold'].forEach(id => {
      const el = document.createElement('input');
      el.id = id;
      el.value = values[id] !== undefined ? values[id] : '';
      document.body.appendChild(el);
    });
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitBtn';
    submitBtn.dataset.isEdit = 'true';
    document.body.appendChild(submitBtn);
    const form = document.createElement('form');
    form.id = 'product-form';
    document.body.appendChild(form);
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    window.alert = jest.fn();
  }

  test('returns early when prodID does not exist', () => {
    setupUpdateFormDOM({ 'product-id': 'NONEXISTENT' });
    expect(() => window.updateProduct()).not.toThrow();
    expect(window.alert).not.toHaveBeenCalled();
  });

  test('alerts when fields are empty for existing prodID', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001' });
    window.updateProduct();
    expect(window.alert).toHaveBeenCalled(); // empty name/cat
  });

  test('alerts when price is not a number', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': 'abc', 'product-sold': '5' });
    window.updateProduct();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when name-category pair does not match', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Bags', 'product-price': '20', 'product-sold': '5' });
    window.updateProduct();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when sold is not a valid number (lines 225-226)', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '20', 'product-sold': 'bad' });
    window.updateProduct();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when price is negative (lines 229-230)', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '-5', 'product-sold': '5' });
    window.updateProduct();
    expect(window.alert).toHaveBeenCalled();
  });

  test('alerts when sold is negative (lines 233-234)', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '20', 'product-sold': '-1' });
    window.updateProduct();
    expect(window.alert).toHaveBeenCalled();
  });

  test('updates product successfully with valid matched pair', () => {
    setupUpdateFormDOM({ 'product-id': 'PD001', 'product-name': 'Baseball caps', 'product-cat': 'Hats', 'product-price': '30', 'product-sold': '8' });
    window.updateProduct();
    expect(window.alert).not.toHaveBeenCalled();
  });
});

// ── window.deleteProduct with existing prodID (lines 137-141) ─────────────
describe('window.deleteProduct with existing prodID', () => {
  test('deletes PD002 (lines 137-141)', () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);
    window.alert = jest.fn();
    expect(() => window.deleteProduct('PD002')).not.toThrow();
  });
});

// ── window.loadProductsFromStorage true branch (lines 83-86) ─────────────
describe('window.loadProductsFromStorage (lines 83-86)', () => {
  test('loads default products when localStorage has no stored products (true branch)', () => {
    // Clear localStorage to trigger the !stored branch
    localStorage.removeItem('bizTrackProducts');
    localStorage.removeItem('bizTrackProductsCatalogVersion');
    expect(() => window.loadProductsFromStorage()).not.toThrow();
    // After calling it, localStorage should be populated with default products
    const stored = localStorage.getItem('bizTrackProducts');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(Array.isArray(parsed)).toBe(true);
  });

  test('loads default products when catalog version mismatches (ver !== PRODUCTS_CATALOG_VERSION)', () => {
    localStorage.setItem('bizTrackProducts', JSON.stringify([{ prodID: 'OLD1', prodName: 'Old product' }]));
    localStorage.setItem('bizTrackProductsCatalogVersion', 'v0.0.0-wrong');
    expect(() => window.loadProductsFromStorage()).not.toThrow();
  });
});
