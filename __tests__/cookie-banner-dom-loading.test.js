/**
 * Covers cookie-banner.js DOMContentLoaded listener (lines 198–200).
 */
beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.showPrivacyModal = jest.fn();
});

describe('cookie-banner DOMContentLoaded registration', () => {
  test('runs initCookieBanner when DOMContentLoaded fires under loading readyState', async () => {
    jest.resetModules();
    localStorage.clear();
    document.body.innerHTML = '';

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      writable: true,
      value: 'loading',
    });

    await import('../cookie-banner.js');

    expect(document.getElementById('cookie-compliance-banner')).toBeNull();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise((r) => setTimeout(r, 30));

    expect(document.getElementById('cookie-compliance-banner')).not.toBeNull();

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      writable: true,
      value: 'complete',
    });
  });
});
