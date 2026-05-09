import {
  calculateExpTotal,
  calculateRevTotal,
  calculateOrderStatusCounts,
  calculateDashboardSummary,
  findCategoryForItemName,
  calculateCategoryUnitsSoldFromOrders,
  calculateCategoryExpenses,
  aggregateByMonth
} from '../analytics-service.js';

const sampleExpenses = [
  { trID: 1, trDate: '2024-01-05', trCategory: 'Rent',       trAmount: 100 },
  { trID: 2, trDate: '2024-01-15', trCategory: 'Utilities',  trAmount: 50  },
  { trID: 3, trDate: '2024-02-10', trCategory: 'Rent',       trAmount: 200 }
];

const sampleOrders = [
  { orderID: '1', orderDate: '2024-01-05', itemName: 'Beanies',    qtyBought: 2, orderTotal: 30,  orderStatus: 'Pending'    },
  { orderID: '2', orderDate: '2024-01-20', itemName: 'Mugs',       qtyBought: 1, orderTotal: 14,  orderStatus: 'Shipped'    },
  { orderID: '3', orderDate: '2024-02-05', itemName: 'Beanies',    qtyBought: 3, orderTotal: 55,  orderStatus: 'Delivered'  },
  { orderID: '4', orderDate: '2024-02-15', itemName: 'T-shirts',   qtyBought: 1, orderTotal: 20,  orderStatus: 'Processing' }
];

const sampleProducts = [
  { prodID: 'PD001', prodName: 'Beanies',  prodCat: 'Hats',      prodPrice: 18.5 },
  { prodID: 'PD002', prodName: 'Mugs',     prodCat: 'Drinkware',  prodPrice: 14   },
  { prodID: 'PD003', prodName: 'T-shirts', prodCat: 'Clothing',   prodPrice: 19.99}
];

// ─── calculateExpTotal ──────────────────────────────────────────────────────
describe('calculateExpTotal', () => {
  test('sums all transaction amounts', () => {
    expect(calculateExpTotal(sampleExpenses)).toBe(350);
  });

  test('returns 0 for empty array', () => {
    expect(calculateExpTotal([])).toBe(0);
  });

  test('returns 0 for null/undefined', () => {
    expect(calculateExpTotal(null)).toBe(0);
    expect(calculateExpTotal(undefined)).toBe(0);
  });

  test('handles non-numeric amounts gracefully (treats as 0)', () => {
    expect(calculateExpTotal([{ trAmount: 'abc' }])).toBe(0);
  });
});

// ─── calculateRevTotal ──────────────────────────────────────────────────────
describe('calculateRevTotal', () => {
  test('sums all order totals', () => {
    expect(calculateRevTotal(sampleOrders)).toBe(119);
  });

  test('returns 0 for empty array', () => {
    expect(calculateRevTotal([])).toBe(0);
  });

  test('returns 0 for null/undefined', () => {
    expect(calculateRevTotal(null)).toBe(0);
    expect(calculateRevTotal(undefined)).toBe(0);
  });
});

// ─── calculateOrderStatusCounts ────────────────────────────────────────────
describe('calculateOrderStatusCounts', () => {
  test('counts each order status correctly', () => {
    const counts = calculateOrderStatusCounts(sampleOrders);
    expect(counts.Pending).toBe(1);
    expect(counts.Shipped).toBe(1);
    expect(counts.Delivered).toBe(1);
    expect(counts.Processing).toBe(1);
  });

  test('returns zero counts for empty array', () => {
    const counts = calculateOrderStatusCounts([]);
    expect(counts).toEqual({ Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 });
  });

  test('returns zero counts for null', () => {
    const counts = calculateOrderStatusCounts(null);
    expect(counts).toEqual({ Pending: 0, Processing: 0, Shipped: 0, Delivered: 0 });
  });

  test('ignores unknown statuses', () => {
    const orders = [{ orderStatus: 'Unknown' }];
    const counts = calculateOrderStatusCounts(orders);
    expect(counts.Pending).toBe(0);
  });
});

// ─── calculateDashboardSummary ─────────────────────────────────────────────
describe('calculateDashboardSummary', () => {
  test('returns correct summary object', () => {
    const summary = calculateDashboardSummary(sampleExpenses, sampleOrders);
    expect(summary.totalExpenses).toBe(350);
    expect(summary.totalRevenues).toBe(119);
    expect(summary.totalBalance).toBe(-231);
    expect(summary.numOrders).toBe(4);
  });

  test('totalBalance is revenue minus expenses', () => {
    const summary = calculateDashboardSummary(
      [{ trAmount: 100 }],
      [{ orderTotal: 200, orderStatus: 'Pending', itemName: '', qtyBought: 0, orderDate: '' }]
    );
    expect(summary.totalBalance).toBe(100);
  });

  test('returns zero summary for empty inputs', () => {
    const summary = calculateDashboardSummary([], []);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.totalRevenues).toBe(0);
    expect(summary.totalBalance).toBe(0);
    expect(summary.numOrders).toBe(0);
  });
});

// ─── findCategoryForItemName ────────────────────────────────────────────────
describe('findCategoryForItemName', () => {
  test('finds category by exact product name', () => {
    expect(findCategoryForItemName('Beanies', sampleProducts)).toBe('Hats');
    expect(findCategoryForItemName('Mugs', sampleProducts)).toBe('Drinkware');
  });

  test('finds category case-insensitively', () => {
    expect(findCategoryForItemName('beanies', sampleProducts)).toBe('Hats');
    expect(findCategoryForItemName('MUGS', sampleProducts)).toBe('Drinkware');
  });

  test('returns null for unknown item name', () => {
    expect(findCategoryForItemName('Unknown Item', sampleProducts)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(findCategoryForItemName('', sampleProducts)).toBeNull();
  });

  test('returns null for null/undefined', () => {
    expect(findCategoryForItemName(null, sampleProducts)).toBeNull();
    expect(findCategoryForItemName(undefined, sampleProducts)).toBeNull();
  });

  test('returns null for non-string input', () => {
    expect(findCategoryForItemName(123, sampleProducts)).toBeNull();
  });

  test('returns null when products list is empty', () => {
    expect(findCategoryForItemName('Beanies', [])).toBeNull();
  });
});

// ─── calculateCategoryUnitsSoldFromOrders ───────────────────────────────────
describe('calculateCategoryUnitsSoldFromOrders', () => {
  test('sums units sold per category', () => {
    const totals = calculateCategoryUnitsSoldFromOrders(sampleOrders, sampleProducts);
    expect(totals['Hats']).toBe(5);
    expect(totals['Drinkware']).toBe(1);
    expect(totals['Clothing']).toBe(1);
  });

  test('all standard categories are present in result', () => {
    const totals = calculateCategoryUnitsSoldFromOrders([], sampleProducts);
    expect(totals).toHaveProperty('Hats');
    expect(totals).toHaveProperty('Drinkware');
    expect(totals).toHaveProperty('Clothing');
    expect(totals).toHaveProperty('Accessories');
    expect(totals).toHaveProperty('Home decor');
  });

  test('returns zeros for all categories when orders is empty', () => {
    const totals = calculateCategoryUnitsSoldFromOrders([], sampleProducts);
    Object.values(totals).forEach((v) => expect(v).toBe(0));
  });

  test('returns zeros for all categories when orders is null', () => {
    const totals = calculateCategoryUnitsSoldFromOrders(null, sampleProducts);
    Object.values(totals).forEach((v) => expect(v).toBe(0));
  });
});

// ─── calculateCategoryExpenses ──────────────────────────────────────────────
describe('calculateCategoryExpenses', () => {
  test('groups expenses by category', () => {
    const result = calculateCategoryExpenses(sampleExpenses);
    expect(result['Rent']).toBe(300);
    expect(result['Utilities']).toBe(50);
  });

  test('returns empty object for empty array', () => {
    expect(calculateCategoryExpenses([])).toEqual({});
  });

  test('returns empty object for null/undefined', () => {
    expect(calculateCategoryExpenses(null)).toEqual({});
    expect(calculateCategoryExpenses(undefined)).toEqual({});
  });
});

// ─── aggregateByMonth ───────────────────────────────────────────────────────
describe('aggregateByMonth', () => {
  test('returns entries sorted by month', () => {
    const result = aggregateByMonth(sampleOrders, sampleExpenses);
    const months = result.map((r) => r.month);
    expect(months).toEqual([...months].sort());
  });

  test('each entry has revenue, expenses, net, margin fields', () => {
    const result = aggregateByMonth(sampleOrders, sampleExpenses);
    result.forEach((entry) => {
      expect(entry).toHaveProperty('month');
      expect(entry).toHaveProperty('revenue');
      expect(entry).toHaveProperty('expenses');
      expect(entry).toHaveProperty('net');
      expect(entry).toHaveProperty('margin');
    });
  });

  test('net = revenue - expenses', () => {
    const result = aggregateByMonth(sampleOrders, sampleExpenses);
    result.forEach((entry) => {
      expect(entry.net).toBeCloseTo(entry.revenue - entry.expenses, 2);
    });
  });

  test('margin is 0 when revenue is 0', () => {
    const expensesOnly = [{ trDate: '2024-03-01', trAmount: 50 }];
    const result = aggregateByMonth([], expensesOnly);
    expect(result[0].margin).toBe(0);
  });

  test('returns empty array when both inputs are empty', () => {
    expect(aggregateByMonth([], [])).toEqual([]);
  });

  test('returns empty array when both inputs are null', () => {
    expect(aggregateByMonth(null, null)).toEqual([]);
  });

  test('handles invalid date strings gracefully', () => {
    const badOrders = [{ orderDate: 'not-a-date', orderTotal: 100, orderStatus: 'Pending', itemName: '', qtyBought: 0 }];
    expect(() => aggregateByMonth(badOrders, [])).not.toThrow();
  });

  test('order with null orderDate covers !dateString branch in monthKeyFromDate (line 102)', () => {
    // null date → !dateString is true → return null → order skipped
    const result = aggregateByMonth([{ orderDate: null, orderTotal: 10, orderStatus: 'Pending' }], []);
    expect(result).toEqual([]);
  });

  test('expense with null trDate covers !month branch in expenses loop (line 129)', () => {
    // null date → monthKeyFromDate returns null → if(!month) return skips it
    const result = aggregateByMonth([], [{ trDate: null, trAmount: 50 }]);
    expect(result).toEqual([]);
  });
});

// ─── Extra branch coverage ──────────────────────────────────────────────────
describe('findCategoryForItemName with null/invalid product entries', () => {
  test('skips null products in both loops (lines 55, 63)', () => {
    const mixedProducts = [null, undefined, { prodID: 'X', prodName: null }, { prodID: 'P1', prodName: 'Beanies', prodCat: 'Hats' }];
    expect(findCategoryForItemName('Beanies', mixedProducts)).toBe('Hats');
    expect(findCategoryForItemName('beanies', mixedProducts)).toBe('Hats');
  });
});

describe('calculateDashboardSummary with null orders (line 43 || branch)', () => {
  test('handles null orders gracefully', () => {
    const summary = calculateDashboardSummary(sampleExpenses, null);
    expect(summary.numOrders).toBe(0);
    expect(summary.totalExpenses).toBe(350);
  });
});
