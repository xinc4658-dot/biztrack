import {
  toNumber,
  DEFAULT_EXPENSES,
  DEFAULT_ORDERS,
  DEFAULT_PRODUCTS,
  getDataWithFallback
} from '../data-service.js';

// ─── toNumber ────────────────────────────────────────────────────────────────
describe('toNumber', () => {
  test('converts a numeric string to number', () => {
    expect(toNumber('42')).toBe(42);
  });

  test('returns a number unchanged', () => {
    expect(toNumber(3.14)).toBe(3.14);
  });

  test('returns 0 for NaN string', () => {
    expect(toNumber('abc')).toBe(0);
  });

  test('returns 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0);
  });

  test('returns 0 for null', () => {
    expect(toNumber(null)).toBe(0);
  });

  test('returns 0 for Infinity', () => {
    expect(toNumber(Infinity)).toBe(0);
  });

  test('returns 0 for -Infinity', () => {
    expect(toNumber(-Infinity)).toBe(0);
  });

  test('converts negative number string', () => {
    expect(toNumber('-5')).toBe(-5);
  });

  test('converts zero', () => {
    expect(toNumber(0)).toBe(0);
  });
});

// ─── DEFAULT_EXPENSES ─────────────────────────────────────────────────────────
describe('DEFAULT_EXPENSES', () => {
  test('contains 5 expense records', () => {
    expect(DEFAULT_EXPENSES).toHaveLength(5);
  });

  test('each expense has required fields', () => {
    DEFAULT_EXPENSES.forEach((expense) => {
      expect(expense).toHaveProperty('trID');
      expect(expense).toHaveProperty('trDate');
      expect(expense).toHaveProperty('trCategory');
      expect(expense).toHaveProperty('trAmount');
    });
  });
});

// ─── DEFAULT_ORDERS ───────────────────────────────────────────────────────────
describe('DEFAULT_ORDERS', () => {
  test('contains 5 order records', () => {
    expect(DEFAULT_ORDERS).toHaveLength(5);
  });

  test('each order has required fields', () => {
    DEFAULT_ORDERS.forEach((order) => {
      expect(order).toHaveProperty('orderID');
      expect(order).toHaveProperty('orderDate');
      expect(order).toHaveProperty('orderTotal');
      expect(order).toHaveProperty('orderStatus');
    });
  });
});

// ─── DEFAULT_PRODUCTS ─────────────────────────────────────────────────────────
describe('DEFAULT_PRODUCTS', () => {
  test('contains 16 product records', () => {
    expect(DEFAULT_PRODUCTS).toHaveLength(16);
  });

  test('each product has required fields', () => {
    DEFAULT_PRODUCTS.forEach((product) => {
      expect(product).toHaveProperty('prodID');
      expect(product).toHaveProperty('prodName');
      expect(product).toHaveProperty('prodCat');
      expect(product).toHaveProperty('prodPrice');
    });
  });
});

// ─── getDataWithFallback ──────────────────────────────────────────────────────
describe('getDataWithFallback', () => {
  const fallback = [{ id: 1, name: 'fallback item' }];
  const localData = [{ id: 2, name: 'local item' }];

  beforeEach(() => {
    localStorage.clear();
    delete window.biztrackDb;
  });

  test('returns fallback data when localStorage and Firestore are both empty', async () => {
    const result = await getDataWithFallback('products', 'testKey', fallback);
    expect(result).toEqual(fallback);
  });

  test('returns localStorage data when available and Firestore is absent', async () => {
    localStorage.setItem('testKey', JSON.stringify(localData));
    const result = await getDataWithFallback('products', 'testKey', fallback);
    expect(result).toEqual(localData);
  });

  test('returns Firestore data when biztrackDb is available and has records', async () => {
    const remoteData = [{ id: 3, name: 'remote item' }];
    window.biztrackDb = {
      collection: () => ({
        get: async () => ({
          docs: remoteData.map((d) => ({ data: () => d }))
        })
      })
    };

    const result = await getDataWithFallback('products', 'testKey', fallback);
    expect(result).toEqual(remoteData);
  });

  test('saves Firestore data to localStorage when fetched successfully', async () => {
    const remoteData = [{ id: 4, name: 'saved item' }];
    window.biztrackDb = {
      collection: () => ({
        get: async () => ({
          docs: remoteData.map((d) => ({ data: () => d }))
        })
      })
    };

    await getDataWithFallback('products', 'cacheKey', fallback);
    const cached = JSON.parse(localStorage.getItem('cacheKey'));
    expect(cached).toEqual(remoteData);
  });

  test('falls back to local/fallback when Firestore returns empty array', async () => {
    window.biztrackDb = {
      collection: () => ({
        get: async () => ({ docs: [] })
      })
    };

    const result = await getDataWithFallback('products', 'testKey', fallback);
    expect(result).toEqual(fallback);
  });

  test('falls back gracefully when Firestore throws an error', async () => {
    window.biztrackDb = {
      collection: () => ({
        get: async () => { throw new Error('Firestore error'); }
      })
    };

    const result = await getDataWithFallback('products', 'testKey', fallback);
    expect(result).toEqual(fallback);
  });

  test('prefers localStorage over fallback when Firestore throws', async () => {
    localStorage.setItem('testKey', JSON.stringify(localData));
    window.biztrackDb = {
      collection: () => ({
        get: async () => { throw new Error('Firestore error'); }
      })
    };

    const result = await getDataWithFallback('products', 'testKey', fallback);
    expect(result).toEqual(localData);
  });
});
