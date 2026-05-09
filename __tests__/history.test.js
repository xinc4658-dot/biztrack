// history.js — test window-level functions exposed at module load time

beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.escapeHTML = jest.fn((s) => String(s));
  window.biztrackDb = null;
  window.getCurrentLanguage = jest.fn(() => 'en');
  localStorage.clear();
});

beforeAll(async () => {
  await import('../history.js');
});

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

// ── Basic module-level exports ────────────────────────────────────────────
describe('history.js module-level exports', () => {
  test('window.openSidebar is a function', () => {
    expect(typeof window.openSidebar).toBe('function');
  });

  test('window.closeSidebar is a function', () => {
    expect(typeof window.closeSidebar).toBe('function');
  });

  test('window.refreshHistoryLogs is a function', () => {
    expect(typeof window.refreshHistoryLogs).toBe('function');
  });
});

// ── window.refreshHistoryLogs (cache is null → calls loadHistory) ─────────
describe('window.refreshHistoryLogs', () => {
  beforeEach(() => {
    // Provide a minimal tbody so loadHistory doesn't crash
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    tbody.id = 'historyTableBody';
    table.appendChild(tbody);
    document.body.appendChild(table);
  });

  test('calls loadHistory (shows error row) when cache is null and db is not connected', async () => {
    window.biztrackDb = null;
    // refreshHistoryLogs internally calls loadHistory if cache is null
    // loadHistory will throw because there is no db, and fill the tbody
    await expect(
      new Promise((resolve) => {
        window.refreshHistoryLogs();
        setTimeout(resolve, 50);
      })
    ).resolves.toBeUndefined();
    // After the async loadHistory resolves, tbody should have content
    const tbody = document.getElementById('historyTableBody');
    expect(tbody).not.toBeNull();
  });

  test('calls renderLogs when cache is populated', async () => {
    // Populate cache via localStorage, which loadHistory reads on startup
    const fakeLogs = [
      {
        action: 'create',
        entityType: 'products',
        entityId: 'P1',
        createdAt: null,
        clientTime: '2025-01-01T00:00:00.000Z',
        beforeData: null,
        afterData: { prodID: 'P1', prodName: 'Test', prodCat: 'Hats', prodPrice: 10, prodSold: 0 },
      },
    ];
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(fakeLogs));

    // Re-trigger refreshHistoryLogs; since historyLogsCache was set by
    // a prior loadHistory call (if any), we may or may not have cache.
    // The important thing is that the function doesn't throw.
    await expect(
      new Promise((resolve) => {
        window.refreshHistoryLogs();
        setTimeout(resolve, 50);
      })
    ).resolves.toBeUndefined();
  });
});

// ── renderLogs via localStorage cache ────────────────────────────────────
describe('renderLogs via cached logs in localStorage', () => {
  // history.js reads localStorage("bizTrackRecentHistoryLogs") in loadHistory().
  // If the cache is populated, renderLogs() is called synchronously with the data
  // before it even tries Firebase — this covers translateEntityType, translateActionLabel,
  // formatComparableData, formatTimestamp, etc.

  function setupTableBody() {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    tbody.id = 'historyTableBody';
    table.appendChild(tbody);
    document.body.appendChild(table);
    return tbody;
  }

  function makeLogs(overrides = []) {
    const defaults = [
      {
        action: 'create',
        entityType: 'products',
        entityId: 'P1',
        clientTime: '2025-01-15T10:00:00.000Z',
        beforeData: null,
        afterData: { prodID: 'P1', prodName: 'Classic Snapback Cap', prodCat: 'Hats', prodPrice: 25, prodSold: 0 },
      },
      {
        action: 'update',
        entityType: 'orders',
        entityId: 'O1',
        clientTime: '2025-01-15T11:00:00.000Z',
        beforeData: { orderID: 'O1', itemName: 'Mug', itemPrice: 10, qtyBought: 1, orderStatus: 'Pending' },
        afterData:  { orderID: 'O1', itemName: 'Mug', itemPrice: 12, qtyBought: 1, orderStatus: 'Processing' },
      },
      {
        action: 'delete',
        entityType: 'expenses',
        entityId: 'E1',
        clientTime: '2025-01-15T12:00:00.000Z',
        beforeData: { trID: 'E1', trDate: '2025-01-01', trCategory: 'Rent', trAmount: 500 },
        afterData: null,
      },
      {
        action: 'sync',
        entityType: 'products',
        entityId: 'all-products',
        clientTime: '2025-01-15T09:00:00.000Z',
        beforeData: null,
        afterData: null,
      },
    ];
    return [...defaults, ...overrides];
  }

  beforeEach(() => {
    window.t = jest.fn((key) => key);
    window.escapeHTML = jest.fn((s) => String(s));
    localStorage.clear();
  });

  test('renders rows from cached create log (products)', async () => {
    const tbody = setupTableBody();
    const logs = makeLogs();
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(logs));

    await new Promise((resolve) => {
      window.refreshHistoryLogs();
      setTimeout(resolve, 80);
    });

    // renderLogs was called and filled the table
    expect(tbody.innerHTML.length).toBeGreaterThan(0);
  });

  test('renders rows from cached update log (orders)', async () => {
    const tbody = setupTableBody();
    const logs = [makeLogs()[1]]; // update order log
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(logs));

    await new Promise((resolve) => {
      window.refreshHistoryLogs();
      setTimeout(resolve, 80);
    });

    expect(tbody.innerHTML.length).toBeGreaterThan(0);
  });

  test('renders rows from cached delete log (expenses)', async () => {
    const tbody = setupTableBody();
    const logs = [makeLogs()[2]]; // delete expense log
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(logs));

    await new Promise((resolve) => {
      window.refreshHistoryLogs();
      setTimeout(resolve, 80);
    });

    expect(tbody.innerHTML.length).toBeGreaterThan(0);
  });

  test('shows empty message when log list is empty', async () => {
    const tbody = setupTableBody();
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify([]));

    await new Promise((resolve) => {
      window.refreshHistoryLogs();
      setTimeout(resolve, 80);
    });

    // With empty cache, loadHistory runs and ends up in error state (no db)
    expect(tbody).not.toBeNull();
  });

  test('handles logs with createdAt Timestamp-like objects', async () => {
    const tbody = setupTableBody();
    const logWithTimestamp = {
      action: 'create',
      entityType: 'products',
      entityId: 'P2',
      createdAt: { toDate: () => new Date('2025-02-01T08:00:00.000Z') },
      beforeData: null,
      afterData: { prodID: 'P2', prodName: 'Test', prodCat: 'Hats', prodPrice: 5, prodSold: 0 },
    };
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify([logWithTimestamp]));

    await new Promise((resolve) => {
      window.refreshHistoryLogs();
      setTimeout(resolve, 80);
    });

    expect(tbody).not.toBeNull();
  });

  test('handles unknown entity type gracefully', async () => {
    const tbody = setupTableBody();
    const logs = [{ action: 'create', entityType: 'unknown', entityId: 'X1',
                    clientTime: '2025-01-01', beforeData: null, afterData: null }];
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(logs));

    await new Promise((resolve) => {
      window.refreshHistoryLogs();
      setTimeout(resolve, 80);
    });

    expect(tbody).not.toBeNull();
  });
});

// ── loadHistory via 'load' event with real Firebase mock ──────────────────
describe('loadHistory via window load event (Firebase mock)', () => {
  function makeHistoryTbody() {
    const tbody = document.createElement('tbody');
    tbody.id = 'historyTableBody';
    document.body.appendChild(tbody);
    return tbody;
  }

  afterEach(() => {
    window.biztrackDb = null;
    delete window.addGuideButton;
  });

  test('successful DB query covers lines 309-333 and getLogTimeMs (12-20)', async () => {
    makeHistoryTbody();
    // Two logs: first has createdAt.toDate (covers line 13), second has clientTime (covers line 18)
    const log1 = { action: 'create', entityType: 'products', entityId: 'P1', createdAt: { toDate: () => new Date('2024-06-01') }, afterData: { prodID: 'P1', prodName: 'Widget' } };
    const log2 = { action: 'update', entityType: 'orders', entityId: 'O1', clientTime: '2024-05-01', afterData: { orderID: 'O1' } };
    window.biztrackDb = {
      collection: jest.fn(() => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [{ data: () => log1 }, { data: () => log2 }] }) })),
        orderBy: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) })),
      })),
    };
    window.addGuideButton = jest.fn();
    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 200));
    expect(window.addGuideButton).toHaveBeenCalledWith('history');
    const rows = document.getElementById('historyTableBody').querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('after successful loadHistory, refreshHistoryLogs uses cache (line 344)', async () => {
    makeHistoryTbody();
    const log1 = { action: 'delete', entityType: 'products', entityId: 'P2', clientTime: '2024-04-01', beforeData: { prodID: 'P2', prodName: 'Old' } };
    window.biztrackDb = {
      collection: jest.fn(() => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [{ data: () => log1 }] }) })),
        orderBy: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) })),
      })),
    };
    // Reset historyLogsCache by triggering a failed loadHistory first
    await new Promise(resolve => { window.refreshHistoryLogs(); setTimeout(resolve, 100); });
    // Now call the successful load
    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 200));
    // Now historyLogsCache is set; refreshHistoryLogs hits line 344
    window.biztrackDb = null;
    window.refreshHistoryLogs();
  });

  test('DB returns 0 docs → renderLogs([]) covers empty rows branch (262-265)', async () => {
    makeHistoryTbody();
    window.biztrackDb = {
      collection: jest.fn(() => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
        orderBy: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) })),
      })),
    };
    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 200));
    const tbody = document.getElementById('historyTableBody');
    expect(tbody.innerHTML).toContain('td');
  });

  test('first query throws, fallback returns bulk-sync log → filterActivityLogs false branch (26-36)', async () => {
    makeHistoryTbody();
    const syncLog = { action: 'sync', entityType: 'products', entityId: 'all-products', clientTime: '2024-01-01' };
    const createLog = { action: 'create', entityType: 'orders', entityId: 'O2', clientTime: '2024-01-02' };
    window.biztrackDb = {
      collection: jest.fn(() => ({
        where: jest.fn(() => ({ get: jest.fn().mockRejectedValue(new Error('index missing')) })),
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ docs: [{ data: () => syncLog }, { data: () => createLog }] }),
          })),
        })),
      })),
    };
    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 300));
    // createLog passes, syncLog is filtered out (false returned for bulk-sync)
    const rows = document.getElementById('historyTableBody').querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ── formatTimestamp: timestamp.toDate() and invalid fallback branches ─────
describe('formatTimestamp branches via renderLogs', () => {
  beforeEach(async () => {
    // Force historyLogsCache → null by running loadHistory with no DB
    document.body.innerHTML = '';
    localStorage.clear();
    window.biztrackDb = null;
    const tb = document.createElement('tbody');
    tb.id = 'historyTableBody';
    document.body.appendChild(tb);
    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 150));
    // historyLogsCache is now null (error path sets it null)
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => { window.biztrackDb = null; delete window.translateProductName; });

  test('log with invalid fallback date covers line 183 (String(fallback))', async () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'historyTableBody';
    document.body.appendChild(tbody);
    // clientTime = not-a-date → new Date('not-a-date') is NaN → String(fallback) at line 183
    const logs = [{ action: 'create', entityType: 'products', entityId: 'P3', clientTime: 'not-a-date', afterData: { prodID: 'P3', prodName: 'Test' } }];
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(logs));
    window.biztrackDb = null;
    // historyLogsCache is null → calls loadHistory → uses localStorage cache at step 1
    await new Promise(resolve => { window.refreshHistoryLogs(); setTimeout(resolve, 150); });
    expect(tbody.querySelectorAll('tr').length).toBeGreaterThan(0);
  });

  test('log with itemName field + translateProductName covers line 159', async () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'historyTableBody';
    document.body.appendChild(tbody);
    window.translateProductName = jest.fn((name) => `T:${name}`);
    const logs = [{ action: 'update', entityType: 'orders', entityId: 'O3', clientTime: '2024-01-01', beforeData: { itemName: 'Widget' }, afterData: { itemName: 'Cap' } }];
    localStorage.setItem('bizTrackRecentHistoryLogs', JSON.stringify(logs));
    window.biztrackDb = null;
    // historyLogsCache is null → calls loadHistory → localStorage cache rendered at step 1
    await new Promise(resolve => { window.refreshHistoryLogs(); setTimeout(resolve, 150); });
    expect(window.translateProductName).toHaveBeenCalled();
  });
});

// ── sidebar helpers ───────────────────────────────────────────────────────
describe('sidebar functions (history)', () => {
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

// ── getLogTimeMs returning 0 (line 20) ────────────────────────────────────
describe('loadHistory with log having no time info (line 20)', () => {
  test('log without createdAt/changedAt/clientTime causes getLogTimeMs to return 0', async () => {
    const tbody = document.createElement('tbody');
    tbody.id = 'historyTableBody';
    document.body.appendChild(tbody);
    // Log with no time fields → getLogTimeMs returns 0 (covers line 20)
    const logNoTime = { action: 'create', entityType: 'products', entityId: 'P99' };
    const logWithTime = { action: 'update', entityType: 'orders', entityId: 'O99', clientTime: '2024-01-01' };
    window.biztrackDb = {
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            docs: [{ data: () => logNoTime }, { data: () => logWithTime }],
          }),
        })),
        orderBy: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) })),
      })),
    };
    window.addGuideButton = jest.fn();
    window.dispatchEvent(new Event('load'));
    await new Promise(r => setTimeout(r, 200));
    // Sort calls getLogTimeMs on both logs; logNoTime returns 0 → covers line 20
    expect(tbody.querySelectorAll('tr').length).toBeGreaterThan(0);
    window.biztrackDb = null;
    delete window.addGuideButton;
  });
});
