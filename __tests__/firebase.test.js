// firebase.js uses the global `firebase` variable directly.
// We mock it before importing so the module initialises safely.
beforeAll(() => {
  global.firebase = {
    apps: ['existing-app'],
    initializeApp: jest.fn(),
    firestore: Object.assign(
      jest.fn(() => ({
        collection: jest.fn(() => ({
          add: jest.fn(() => Promise.resolve()),
          get: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
          doc: jest.fn(() => ({})),
        })),
        batch: jest.fn(() => ({
          delete: jest.fn(),
          set: jest.fn(),
          commit: jest.fn(() => Promise.resolve()),
        })),
      })),
      {
        FieldValue: {
          serverTimestamp: jest.fn(() => 'mock-timestamp'),
        },
      }
    ),
  };
  window.firebase = global.firebase;
});

import '../firebase.js';

describe('firebase: configuration and collections', () => {
  test('window.biztrackCollections has correct collection names', () => {
    expect(window.biztrackCollections.products).toBe('products');
    expect(window.biztrackCollections.orders).toBe('orders');
    expect(window.biztrackCollections.expenses).toBe('expenses');
    expect(window.biztrackCollections.activityLogs).toBe('activity_logs');
  });

  test('window.biztrackCollections has exactly 4 collections', () => {
    expect(Object.keys(window.biztrackCollections)).toHaveLength(4);
  });

  test('window.biztrackDbHelpers is defined', () => {
    expect(window.biztrackDbHelpers).toBeDefined();
  });

  test('biztrackDbHelpers.isReady returns false when biztrackDb is null', () => {
    const original = window.biztrackDb;
    window.biztrackDb = null;
    expect(window.biztrackDbHelpers.isReady()).toBe(false);
    window.biztrackDb = original;
  });

  test('biztrackDbHelpers.isReady returns true when biztrackDb is set', () => {
    window.biztrackDb = { collection: jest.fn() };
    expect(window.biztrackDbHelpers.isReady()).toBe(true);
  });

  test('biztrackDbHelpers.syncCollection with unknown key returns a resolved promise', async () => {
    await expect(
      window.biztrackDbHelpers.syncCollection('unknownKey', [], 'id')
    ).resolves.toBeUndefined();
  });

  test('biztrackDbHelpers.syncCollection with valid key calls replaceCollection', async () => {
    const mockGet = jest.fn(() => Promise.resolve({ forEach: jest.fn() }));
    const mockCommit = jest.fn(() => Promise.resolve());
    window.biztrackDb = {
      collection: jest.fn(() => ({
        get: mockGet,
        doc: jest.fn(() => ({})),
      })),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        set: jest.fn(),
        commit: mockCommit,
      })),
    };

    await window.biztrackDbHelpers.syncCollection('products', [{ prodID: '1', name: 'A' }], 'prodID');
    expect(mockGet).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
  });

  test('biztrackDbHelpers.logActivity does nothing when biztrackDb is null', async () => {
    window.biztrackDb = null;
    await expect(
      window.biztrackDbHelpers.logActivity('products', 'create', '1', {}, {})
    ).resolves.toBeUndefined();
  });
});

describe('firebase: bootstrap from localStorage', () => {
  const makeMockDb = () => {
    const mockGet = jest.fn(() => Promise.resolve({ forEach: jest.fn() }));
    const mockCommit = jest.fn(() => Promise.resolve());
    return {
      db: {
        collection: jest.fn(() => ({
          get: mockGet,
          doc: jest.fn(() => ({})),
          add: jest.fn(() => Promise.resolve()),
        })),
        batch: jest.fn(() => ({
          delete: jest.fn(),
          set: jest.fn(),
          commit: mockCommit,
        })),
      },
      mockGet,
      mockCommit,
    };
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('window load event fires without throwing', () => {
    expect(() => {
      window.dispatchEvent(new Event('load'));
    }).not.toThrow();
  });

  test('bootstrap syncs products from localStorage when db is ready', async () => {
    const { db, mockCommit } = makeMockDb();
    window.biztrackDb = db;
    localStorage.setItem('bizTrackProducts', JSON.stringify([{ prodID: 'PD001' }]));

    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 0));
    expect(mockCommit).toHaveBeenCalled();
  });

  test('bootstrap pulls remote products into localStorage and does not overwrite cloud when remote exists', async () => {
    const mockCommit = jest.fn(() => Promise.resolve());
    const remoteProduct = { data: () => ({ prodID: 'FROM_CLOUD', prodName: 'Remote' }) };
    window.biztrackDb = {
      collection: jest.fn((collectionName) => ({
        get: jest.fn(() => {
          if (collectionName === 'products') {
            return Promise.resolve({
              forEach: (fn) => fn(remoteProduct),
            });
          }
          return Promise.resolve({ forEach: jest.fn() });
        }),
        doc: jest.fn(() => ({})),
        add: jest.fn(() => Promise.resolve()),
      })),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        set: jest.fn(),
        commit: mockCommit,
      })),
    };
    localStorage.setItem('bizTrackProducts', JSON.stringify([{ prodID: 'STALE_LOCAL' }]));
    localStorage.setItem('bizTrackOrders', JSON.stringify([]));
    localStorage.setItem('bizTrackTransactions', JSON.stringify([]));

    window.dispatchEvent(new Event('load'));
    await new Promise((r) => setTimeout(r, 0));

    const cached = JSON.parse(localStorage.getItem('bizTrackProducts') || '[]');
    expect(cached).toEqual([{ prodID: 'FROM_CLOUD', prodName: 'Remote' }]);
    expect(mockCommit).not.toHaveBeenCalled();
  });

  test('bootstrap syncs orders from localStorage', async () => {
    const { db, mockCommit } = makeMockDb();
    window.biztrackDb = db;
    localStorage.setItem('bizTrackOrders', JSON.stringify([{ orderID: '1001' }]));

    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 0));
    expect(mockCommit).toHaveBeenCalled();
  });

  test('bootstrap syncs expenses from localStorage', async () => {
    const { db, mockCommit } = makeMockDb();
    window.biztrackDb = db;
    localStorage.setItem('bizTrackTransactions', JSON.stringify([{ trID: 1 }]));

    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 0));
    expect(mockCommit).toHaveBeenCalled();
  });

  test('bootstrap does nothing when db is not ready', async () => {
    window.biztrackDb = null;
    expect(() => {
      window.dispatchEvent(new Event('load'));
    }).not.toThrow();
  });

  test('bootstrap handles Firestore errors gracefully', async () => {
    window.biztrackDb = {
      collection: jest.fn(() => ({
        get: jest.fn(() => Promise.reject(new Error('sync error'))),
        doc: jest.fn(() => ({})),
      })),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        set: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      })),
    };
    localStorage.setItem('bizTrackProducts', JSON.stringify([{ prodID: 'PD001' }]));
    expect(() => window.dispatchEvent(new Event('load'))).not.toThrow();
  });

  test('bootstrap continues when biztrackCollections entry is missing (line 94)', async () => {
    const { db } = makeMockDb();
    const savedCols = { ...window.biztrackCollections };
    window.biztrackDb = db;
    window.biztrackCollections = {
      ...savedCols,
      orders: undefined,
    };
    localStorage.setItem('bizTrackProducts', JSON.stringify([{ prodID: 'P1' }]));
    localStorage.setItem('bizTrackOrders', JSON.stringify([{ orderID: '1001' }]));
    localStorage.setItem('bizTrackTransactions', JSON.stringify([]));

    expect(() => window.dispatchEvent(new Event('load'))).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));

    window.biztrackCollections = savedCols;
  });
});

describe('firebase: logActivity with active db', () => {
  test('logs activity when biztrackDb is available', async () => {
    const mockAdd = jest.fn(() => Promise.resolve());
    window.biztrackDb = {
      collection: jest.fn(() => ({ add: mockAdd })),
    };

    await window.biztrackDbHelpers.logActivity('products', 'create', '1', { name: 'A' }, {});
    expect(mockAdd).toHaveBeenCalled();
    const callArg = mockAdd.mock.calls[0][0];
    expect(callArg.entity).toBe('products');
    expect(callArg.action).toBe('create');
    expect(callArg.recordId).toBe('1');
  });

  test('uses empty recordId and default objects when optional args are nullish', async () => {
    const mockAdd = jest.fn(() => Promise.resolve());
    window.biztrackDb = {
      collection: jest.fn(() => ({ add: mockAdd })),
    };

    await window.biztrackDbHelpers.logActivity('orders', 'delete', null, null, null);
    const callArg = mockAdd.mock.calls[0][0];
    expect(callArg.recordId).toBe('');
    expect(callArg.entityId).toBe('');
    expect(callArg.changedData).toEqual({});
    expect(callArg.afterData).toEqual({});
    expect(callArg.beforeData).toEqual({});
  });
});

describe('firebase: replaceCollection early exit', () => {
  test('returns without touching Firestore when biztrackDb is null', async () => {
    window.biztrackDb = null;
    await expect(
      window.biztrackDbHelpers.syncCollection('products', [{ prodID: '1', name: 'A' }], 'prodID')
    ).resolves.toBeUndefined();
  });
});

describe('firebase: replaceCollection doc id branches', () => {
  test('uses numeric index when idField is missing or empty on an item', async () => {
    const mockDoc = jest.fn(() => ({ ref: {} }));
    const mockSet = jest.fn();
    const mockCommit = jest.fn(() => Promise.resolve());

    window.biztrackDb = {
      collection: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
        doc: mockDoc,
      })),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        set: mockSet,
        commit: mockCommit,
      })),
    };

    await window.biztrackDbHelpers.syncCollection(
      'products',
      [{ prodName: 'no-id' }, { prodID: '', prodName: 'empty-id' }],
      'prodID'
    );

    expect(mockDoc).toHaveBeenCalledWith('1');
    expect(mockDoc).toHaveBeenCalledWith('2');
  });
});

describe('firebase: replaceCollection snapshot iteration', () => {
  test('deletes existing docs and sets new ones', async () => {
    const mockDocRef = {};
    const mockDelete = jest.fn();
    const mockSet = jest.fn();
    const mockCommit = jest.fn(() => Promise.resolve());

    window.biztrackDb = {
      collection: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          forEach: jest.fn((cb) => cb({ ref: mockDocRef }))
        })),
        doc: jest.fn(() => mockDocRef),
      })),
      batch: jest.fn(() => ({
        delete: mockDelete,
        set: mockSet,
        commit: mockCommit,
      })),
    };

    await window.biztrackDbHelpers.syncCollection('products', [{ prodID: 'P1' }], 'prodID');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
  });
});

describe('firebase: initializeApp branch', () => {
  test('calls initializeApp when firebase.apps is empty', () => {
    const mockInitApp = jest.fn();
    const originalFirebase = global.firebase;

    jest.resetModules();
    global.firebase = {
      apps: [],
      initializeApp: mockInitApp,
      firestore: Object.assign(jest.fn(() => ({})), {
        FieldValue: { serverTimestamp: jest.fn() }
      }),
    };
    window.firebase = global.firebase;

    require('../firebase.js');

    expect(mockInitApp).toHaveBeenCalled();
    global.firebase = originalFirebase;
    window.firebase = originalFirebase;
  });
});
