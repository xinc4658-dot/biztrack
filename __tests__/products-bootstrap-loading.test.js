/**
 * Covers products.js boot path when document.readyState === "loading"
 * (DOMContentLoaded listener branch instead of immediate init).
 */
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

  const storedProducts = [
    { prodID: 'PD001', prodName: 'Baseball caps', prodDesc: 'Peace embroidered cap', prodCat: 'Hats', prodPrice: 25.0, prodSold: 20 },
  ];
  localStorage.setItem('bizTrackProducts', JSON.stringify(storedProducts));
  localStorage.setItem('bizTrackProductsCatalogVersion', 'full-16-v1');
});

describe('products.js bootstrap when readyState is loading', () => {
  test('registers DOMContentLoaded and runs init after event', async () => {
    jest.resetModules();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      writable: true,
      value: 'loading',
    });

    document.body.innerHTML = '';
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';
    document.body.appendChild(tbody);

    await import('../products.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 20));

    expect(typeof window.renderProducts).toBe('function');
    expect(document.getElementById('tableBody')).not.toBeNull();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      writable: true,
      value: 'complete',
    });
  });
});
