import {
  sanitizeCSVField,
  generateCSV,
  debounce,
  openSidebar,
  closeSidebar,
  downloadCSV,
  sortTableRowsByDataset,
  fixEscapedApostrophes,
  bindEscapedApostropheFix
} from '../shared-utils.js';

// ─── sanitizeCSVField ───────────────────────────────────────────────────────
describe('sanitizeCSVField', () => {
  test('returns plain text unchanged', () => {
    expect(sanitizeCSVField('hello')).toBe('hello');
  });

  test('prepends apostrophe to formula starting with =', () => {
    expect(sanitizeCSVField('=SUM(A1)')).toBe("'=SUM(A1)");
  });

  test('prepends apostrophe to formula starting with +', () => {
    expect(sanitizeCSVField('+cmd')).toBe("'+cmd");
  });

  test('prepends apostrophe to formula starting with -', () => {
    expect(sanitizeCSVField('-1+1')).toBe("'-1+1");
  });

  test('prepends apostrophe to formula starting with @', () => {
    expect(sanitizeCSVField('@SUM')).toBe("'@SUM");
  });

  test('wraps field containing comma in quotes', () => {
    expect(sanitizeCSVField('hello, world')).toBe('"hello, world"');
  });

  test('wraps field containing newline in quotes', () => {
    expect(sanitizeCSVField("line1\nline2")).toBe('"line1\nline2"');
  });

  test('wraps field containing carriage return in quotes', () => {
    expect(sanitizeCSVField("line1\rline2")).toBe('"line1\rline2"');
  });

  test('escapes double quotes inside the field', () => {
    expect(sanitizeCSVField('say "hi"')).toBe('"say ""hi"""');
  });

  test('returns empty string for null', () => {
    expect(sanitizeCSVField(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(sanitizeCSVField(undefined)).toBe('');
  });

  test('converts number to string', () => {
    expect(sanitizeCSVField(42)).toBe('42');
  });
});

// ─── generateCSV ────────────────────────────────────────────────────────────
describe('generateCSV', () => {
  const headers = { id: 'ID', name: 'Name', price: 'Price' };
  const data = [
    { id: 1, name: 'Apple', price: 1.5 },
    { id: 2, name: 'Banana', price: 0.75 }
  ];

  test('generates correct header row', () => {
    const csv = generateCSV(data, headers);
    expect(csv.split('\n')[0]).toBe('ID,Name,Price');
  });

  test('generates correct data rows', () => {
    const csv = generateCSV(data, headers);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('1,Apple,1.5');
    expect(lines[2]).toBe('2,Banana,0.75');
  });

  test('generates CSV with correct number of lines', () => {
    expect(generateCSV(data, headers).split('\n')).toHaveLength(3);
  });

  test('handles empty data array', () => {
    expect(generateCSV([], headers)).toBe('ID,Name,Price');
  });

  test('wraps fields with commas in quotes', () => {
    const specialData = [{ id: 1, name: 'Apple, Red', price: 1.5 }];
    expect(generateCSV(specialData, headers)).toContain('"Apple, Red"');
  });
});

// ─── debounce ────────────────────────────────────────────────────────────────
describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('does not call function immediately', () => {
    const fn = jest.fn();
    debounce(fn, 300)();
    expect(fn).not.toHaveBeenCalled();
  });

  test('calls function after delay', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);
    d();
    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('only calls function once when triggered multiple times quickly', () => {
    const fn = jest.fn();
    const d = debounce(fn, 300);
    d(); d(); d();
    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('passes arguments to the wrapped function', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d('hello', 42);
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  test('uses default delay of 250ms', () => {
    const fn = jest.fn();
    const d = debounce(fn);
    d();
    jest.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── openSidebar / closeSidebar ──────────────────────────────────────────────
describe('openSidebar', () => {
  test('does nothing when sidebar element does not exist', () => {
    expect(() => openSidebar()).not.toThrow();
  });

  test('shows sidebar when it is hidden', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.display = 'none';
    document.body.appendChild(sidebar);

    openSidebar();
    expect(sidebar.style.display).toBe('block');

    document.body.removeChild(sidebar);
  });

  test('hides sidebar when it is already shown', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.display = 'block';
    document.body.appendChild(sidebar);

    openSidebar();
    expect(sidebar.style.display).toBe('none');

    document.body.removeChild(sidebar);
  });
});

describe('closeSidebar', () => {
  test('does nothing when sidebar element does not exist', () => {
    expect(() => closeSidebar()).not.toThrow();
  });

  test('hides the sidebar', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.display = 'block';
    document.body.appendChild(sidebar);

    closeSidebar();
    expect(sidebar.style.display).toBe('none');

    document.body.removeChild(sidebar);
  });
});

// ─── downloadCSV ─────────────────────────────────────────────────────────────
describe('downloadCSV', () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates and clicks a download link', () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV('ID,Name\n1,Apple', 'test.csv');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  test('sets the correct filename on the link', () => {
    const links = [];
    jest.spyOn(document.body, 'appendChild').mockImplementation((el) => links.push(el));
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCSV('content', 'export.csv');
    expect(links[0].download).toBe('export.csv');
  });
});

// ─── sortTableRowsByDataset ──────────────────────────────────────────────────
describe('sortTableRowsByDataset', () => {
  test('does nothing when tbody is null', () => {
    expect(() => sortTableRowsByDataset(null, 'name')).not.toThrow();
  });

  test('sorts rows alphabetically by dataset column', () => {
    const tbody = document.createElement('tbody');
    const rows = ['Banana', 'Apple', 'Cherry'].map((name) => {
      const tr = document.createElement('tr');
      tr.dataset.name = name;
      tbody.appendChild(tr);
      return tr;
    });

    sortTableRowsByDataset(tbody, 'name');

    const sorted = Array.from(tbody.querySelectorAll('tr')).map((r) => r.dataset.name);
    expect(sorted).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  test('sorts rows numerically when column is in numericColumns', () => {
    const tbody = document.createElement('tbody');
    [30, 5, 20].forEach((n) => {
      const tr = document.createElement('tr');
      tr.dataset.amount = String(n);
      tbody.appendChild(tr);
    });

    sortTableRowsByDataset(tbody, 'amount', ['amount']);

    const sorted = Array.from(tbody.querySelectorAll('tr')).map((r) => Number(r.dataset.amount));
    expect(sorted).toEqual([5, 20, 30]);
  });

  test('covers ?? operator: rows without dataset column fall back to empty string (lines 73-74)', () => {
    const tbody = document.createElement('tbody');
    // Row with dataset value
    const tr1 = document.createElement('tr');
    tr1.dataset.name = 'Banana';
    tbody.appendChild(tr1);
    // Row without dataset value → dataset.name is undefined → ?? '' covers the branch
    const tr2 = document.createElement('tr');
    tbody.appendChild(tr2);

    expect(() => sortTableRowsByDataset(tbody, 'name')).not.toThrow();
    const sorted = Array.from(tbody.querySelectorAll('tr')).map((r) => r.dataset.name ?? '');
    expect(sorted[0]).toBe('');   // undefined comes first when sorted alphabetically
  });

  test('numeric sort with missing dataset value defaults to 0 via ??(lines 73-77)', () => {
    const tbody = document.createElement('tbody');
    const tr1 = document.createElement('tr');
    tr1.dataset.amount = '10';
    tbody.appendChild(tr1);
    // No dataset.amount on tr2 → rawB is undefined → ?? '' → parseFloat('') → NaN → treated as 0
    const tr2 = document.createElement('tr');
    tbody.appendChild(tr2);

    expect(() => sortTableRowsByDataset(tbody, 'amount', ['amount'])).not.toThrow();
  });

  test('both rows without dataset: covers ?? right-side for rawA and rawB (lines 73-74)', () => {
    const tbody = document.createElement('tbody');
    // Both rows have no dataset[column] → undefined ?? '' covers both lines 73 and 74
    const tr1 = document.createElement('tr');
    tbody.appendChild(tr1);
    const tr2 = document.createElement('tr');
    tbody.appendChild(tr2);
    expect(() => sortTableRowsByDataset(tbody, 'name')).not.toThrow();
  });

  test('numeric sort with both rows missing dataset: covers || 0 branch (line 77)', () => {
    const tbody = document.createElement('tbody');
    const tr1 = document.createElement('tr'); // no dataset.price
    tbody.appendChild(tr1);
    const tr2 = document.createElement('tr'); // no dataset.price
    tbody.appendChild(tr2);
    expect(() => sortTableRowsByDataset(tbody, 'price', ['price'])).not.toThrow();
  });
});

// ─── fixEscapedApostrophes ───────────────────────────────────────────────────
describe('fixEscapedApostrophes', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('replaces &#39; with apostrophe in data-i18n elements after timeout', () => {
    const el = document.createElement('span');
    el.setAttribute('data-i18n', 'key');
    el.textContent = 'it&#39;s';
    document.body.appendChild(el);

    fixEscapedApostrophes();
    jest.advanceTimersByTime(20);

    expect(el.textContent).toBe("it's");
    document.body.removeChild(el);
  });
});

// ─── bindEscapedApostropheFix ────────────────────────────────────────────────
describe('bindEscapedApostropheFix', () => {
  test('registers event listeners without throwing', () => {
    expect(() => bindEscapedApostropheFix()).not.toThrow();
  });
});
