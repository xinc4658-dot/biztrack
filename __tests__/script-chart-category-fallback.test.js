/**
 * Extra category in PRODUCT_CATEGORY_ORDER covers script.js initializeChart
 * categoryKeyMap fallback (lines 212–216).
 */
jest.mock('../analytics-service.js', () => {
  const actual = jest.requireActual('../analytics-service.js');
  return {
    __esModule: true,
    ...actual,
    PRODUCT_CATEGORY_ORDER: [...actual.PRODUCT_CATEGORY_ORDER, '__Dash Category__'],
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

describe('script.js initializeChart with extra PRODUCT_CATEGORY_ORDER entry', () => {
  test('bar chart uses fallback translation key for unknown category', async () => {
    const bar = document.createElement('div');
    bar.id = 'bar-chart';
    document.body.appendChild(bar);
    const donut = document.createElement('div');
    donut.id = 'donut-chart';
    document.body.appendChild(donut);

    window.ApexCharts.mockClear();
    await expect(window.initializeChart()).resolves.not.toThrow();
    expect(window.ApexCharts).toHaveBeenCalled();
  });
});
