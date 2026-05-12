/**
 * Extends PRODUCT_CATEGORY_ORDER with an unknown category so balance.js
 * renderSalesCategoryChart hits categoryKeyMap[key] || key.toLowerCase()… (lines 219–220).
 */
jest.mock('../analytics-service.js', () => {
  const actual = jest.requireActual('../analytics-service.js');
  return {
    __esModule: true,
    ...actual,
    PRODUCT_CATEGORY_ORDER: [...actual.PRODUCT_CATEGORY_ORDER, '__ExtraCategory__'],
  };
});

beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.biztrackDb = null;
  window.biztrackDbHelpers = {
    isReady: jest.fn(() => false),
    syncCollection: jest.fn(),
    logActivity: jest.fn(),
  };
  window.getCurrentLanguage = jest.fn(() => 'en');
  localStorage.clear();
  window.ApexCharts = jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
    updateOptions: jest.fn(),
  }));
});

beforeAll(async () => {
  await import('../balance.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('balance.js sales category chart with extra PRODUCT_CATEGORY_ORDER entry', () => {
  test('DOMContentLoaded renders charts including fallback label branch for unknown category key', async () => {
    ['balance-trend-chart', 'balance-margin-chart', 'balance-sales-category-chart', 'balance-expenses-chart'].forEach((id) => {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    });

    window.ApexCharts.mockClear();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 200));

    expect(window.ApexCharts).toHaveBeenCalled();
  });
});
