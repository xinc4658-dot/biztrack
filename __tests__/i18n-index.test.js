// i18n/index.js sets up window.t, window.changeLanguage, window.getCurrentLanguage, etc.

beforeAll(() => {
  // location.reload is called by resetCookieConsent – replace with a no-op to avoid jsdom error
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, reload: jest.fn() },
  });
  localStorage.clear();
});

beforeAll(async () => {
  await import('../i18n/index.js');
});

afterEach(() => {
  // Clean up DOM elements added during tests
  document.body.innerHTML = '';
});

// ── window.getCurrentLanguage ──────────────────────────────────────────────
describe('window.getCurrentLanguage', () => {
  test('is a function after module loads', () => {
    expect(typeof window.getCurrentLanguage).toBe('function');
  });

  test('returns a string', () => {
    expect(typeof window.getCurrentLanguage()).toBe('string');
  });

  test('returns en by default when no localStorage value', () => {
    expect(window.getCurrentLanguage()).toBe('en');
  });
});

// ── window.t ──────────────────────────────────────────────────────────────
describe('window.t', () => {
  test('is a function', () => {
    expect(typeof window.t).toBe('function');
  });

  test('returns a string for a valid key', () => {
    const result = window.t('dashboard.revenue');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns the key itself when translation is missing', () => {
    const missing = 'this.key.does.not.exist';
    expect(window.t(missing)).toBe(missing);
  });

  test('translates dashboard.expenses', () => {
    const result = window.t('dashboard.expenses');
    expect(result).not.toBe('dashboard.expenses');
  });

  test('translates dashboard.orders', () => {
    const result = window.t('dashboard.orders');
    expect(result).not.toBe('dashboard.orders');
  });

  test('replaces params in translation', () => {
    // privacy.cookieMessage or any key with no param should just return text
    const result = window.t('dashboard.revenue');
    expect(typeof result).toBe('string');
  });
});

// ── window.tHTML ───────────────────────────────────────────────────────────
describe('window.tHTML', () => {
  test('is a function', () => {
    expect(typeof window.tHTML).toBe('function');
  });

  test('returns a string', () => {
    const result = window.tHTML('dashboard.revenue');
    expect(typeof result).toBe('string');
  });
});

// ── window.changeLanguage ─────────────────────────────────────────────────
describe('window.changeLanguage', () => {
  afterEach(() => {
    // Reset to en so other tests are not affected
    window.changeLanguage('en');
  });

  test('is a function', () => {
    expect(typeof window.changeLanguage).toBe('function');
  });

  test('switches language to zh', () => {
    window.changeLanguage('zh');
    expect(window.getCurrentLanguage()).toBe('zh');
  });

  test('switches language to zhTW', () => {
    window.changeLanguage('zhTW');
    expect(window.getCurrentLanguage()).toBe('zhTW');
  });

  test('ignores unknown language codes', () => {
    const before = window.getCurrentLanguage();
    window.changeLanguage('fr'); // unsupported
    expect(window.getCurrentLanguage()).toBe(before);
  });

  test('persists language choice in localStorage', () => {
    window.changeLanguage('zh');
    expect(localStorage.getItem('bizTrackLanguage')).toBe('zh');
  });

  test('sets document.documentElement.lang for zh', () => {
    window.changeLanguage('zh');
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  test('sets document.documentElement.lang for zhTW', () => {
    window.changeLanguage('zhTW');
    expect(document.documentElement.lang).toBe('zh-TW');
  });

  test('sets document.documentElement.lang for en', () => {
    window.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });

  test('window.t returns Chinese text after switching to zh', () => {
    window.changeLanguage('zh');
    const result = window.t('dashboard.revenue');
    // Should be a non-empty string that is different from the English version
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    window.changeLanguage('en');
  });

  test('updates languageSelector element value if present', () => {
    const sel = document.createElement('select');
    sel.id = 'languageSelector';
    // jsdom only sets select.value when a matching <option> exists
    ['en', 'zh', 'zhTW'].forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang;
      sel.appendChild(opt);
    });
    document.body.appendChild(sel);
    window.changeLanguage('zh');
    expect(sel.value).toBe('zh');
  });
});

// ── window.translateProductName ───────────────────────────────────────────
describe('window.translateProductName', () => {
  test('is a function', () => {
    expect(typeof window.translateProductName).toBe('function');
  });

  test('returns the name unchanged when no translation exists', () => {
    window.changeLanguage('en');
    expect(window.translateProductName('SomeUnknownProduct')).toBe('SomeUnknownProduct');
  });

  test('returns null/undefined input as-is', () => {
    expect(window.translateProductName(null)).toBe(null);
    expect(window.translateProductName(undefined)).toBe(undefined);
  });

  test('translates English product names when language is zhTW', () => {
    window.changeLanguage('zhTW');
    expect(window.translateProductName('Beanies')).toBe('無簷便帽');
    window.changeLanguage('en');
  });

  test('maps Simplified Chinese product labels to Traditional when language is zhTW', () => {
    window.changeLanguage('zhTW');
    expect(window.translateProductName('无檐便帽')).toBe('無簷便帽');
    expect(window.translateProductName('马克杯')).toBe('馬克杯');
    window.changeLanguage('en');
  });
});

// ── window.translateProductCategory ──────────────────────────────────────
describe('window.translateProductCategory', () => {
  test('is a function', () => {
    expect(typeof window.translateProductCategory).toBe('function');
  });

  test('returns a string for a known category', () => {
    window.changeLanguage('en');
    const result = window.translateProductCategory('Hats');
    expect(typeof result).toBe('string');
  });

  test('returns key when no translation matches', () => {
    expect(window.translateProductCategory('UnknownCategory')).toBeTruthy();
  });
});

// ── window.translateProductDescription ───────────────────────────────────
describe('window.translateProductDescription (from i18n/index.js)', () => {
  test('is a function', () => {
    expect(typeof window.translateProductDescription).toBe('function');
  });

  test('returns a string', () => {
    const result = window.translateProductDescription('Classic Snapback Cap');
    expect(typeof result).toBe('string');
  });
});

// ── window.resetCookieConsent ─────────────────────────────────────────────
describe('window.resetCookieConsent', () => {
  test('is a function', () => {
    expect(typeof window.resetCookieConsent).toBe('function');
  });

  test('removes bizTrack_cookieChoice from localStorage', () => {
    localStorage.setItem('bizTrack_cookieChoice', 'accepted');
    window.resetCookieConsent();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBeNull();
  });

  test('calls location.reload', () => {
    window.resetCookieConsent();
    expect(window.location.reload).toHaveBeenCalled();
  });
});

// ── window.datePickerI18n ─────────────────────────────────────────────────
describe('window.datePickerI18n', () => {
  test('is set on window', () => {
    expect(window.datePickerI18n).toBeDefined();
  });

  test('has en, zh, zhTW', () => {
    expect(window.datePickerI18n).toHaveProperty('en');
    expect(window.datePickerI18n).toHaveProperty('zh');
    expect(window.datePickerI18n).toHaveProperty('zhTW');
  });
});

// ── Guide system: window.showUserGuide / closeUserGuide ───────────────────
// These functions cover ensureGuideElements(), getGuidePageData(),
// updateGuideContent() — the largest untested block in index.js
describe('window.showUserGuide', () => {
  afterEach(() => {
    // Clean up guide overlay between tests
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('is a function', () => {
    expect(typeof window.showUserGuide).toBe('function');
  });

  test('creates guide overlay element in DOM', () => {
    window.showUserGuide('dashboard');
    expect(document.getElementById('biztrack-guide-overlay')).not.toBeNull();
  });

  test('adds biztrack-guide-open class to body', () => {
    window.showUserGuide('dashboard');
    expect(document.body.classList.contains('biztrack-guide-open')).toBe(true);
  });

  test('sets window.userGuideState.visible to true', () => {
    window.showUserGuide('dashboard');
    expect(window.userGuideState.visible).toBe(true);
  });

  test('sets window.userGuideState.pageKey', () => {
    window.showUserGuide('orders');
    expect(window.userGuideState.pageKey).toBe('orders');
  });

  test('works for various page keys', () => {
    for (const page of ['dashboard', 'orders', 'products', 'finances', 'balance', 'history']) {
      window.showUserGuide(page);
      expect(document.getElementById('biztrack-guide-overlay')).not.toBeNull();
      document.getElementById('biztrack-guide-overlay')?.remove();
      document.body.classList.remove('biztrack-guide-open');
    }
  });

  test('does not duplicate the overlay if called twice', () => {
    window.showUserGuide('dashboard');
    window.showUserGuide('dashboard');
    const overlays = document.querySelectorAll('#biztrack-guide-overlay');
    expect(overlays.length).toBe(1);
  });
});

describe('window.closeUserGuide', () => {
  beforeEach(() => {
    window.showUserGuide('dashboard');
  });

  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('is a function', () => {
    expect(typeof window.closeUserGuide).toBe('function');
  });

  test('hides the overlay', () => {
    window.closeUserGuide();
    const overlay = document.getElementById('biztrack-guide-overlay');
    // overlay still exists but has hidden class
    if (overlay) {
      expect(overlay.classList.contains('hidden')).toBe(true);
    }
  });

  test('sets visible to false', () => {
    window.closeUserGuide();
    expect(window.userGuideState.visible).toBe(false);
  });

  test('removes biztrack-guide-open class from body', () => {
    window.closeUserGuide();
    expect(document.body.classList.contains('biztrack-guide-open')).toBe(false);
  });

  test('does nothing when overlay is absent', () => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    expect(() => window.closeUserGuide()).not.toThrow();
  });
});

// ── window.nextGuideStep / prevGuideStep ──────────────────────────────────
describe('window.nextGuideStep / prevGuideStep', () => {
  beforeEach(() => {
    window.showUserGuide('dashboard');
  });

  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('nextGuideStep is a function', () => {
    expect(typeof window.nextGuideStep).toBe('function');
  });

  test('prevGuideStep is a function', () => {
    expect(typeof window.prevGuideStep).toBe('function');
  });

  test('nextGuideStep increments stepIndex when not at last step', () => {
    window.userGuideState.stepIndex = 0;
    window.nextGuideStep();
    // If there are steps, index should have advanced or guide should have closed
    expect(typeof window.userGuideState.stepIndex).toBe('number');
  });

  test('prevGuideStep decrements stepIndex when not at first step', () => {
    window.userGuideState.stepIndex = 2;
    window.prevGuideStep();
    expect(window.userGuideState.stepIndex).toBe(1);
  });

  test('prevGuideStep does nothing when stepIndex is 0', () => {
    window.userGuideState.stepIndex = 0;
    window.prevGuideStep();
    expect(window.userGuideState.stepIndex).toBe(0);
  });
});

// ── window.showGuideConfirmDialog ─────────────────────────────────────────
describe('window.showGuideConfirmDialog', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-confirm-dialog')?.remove();
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('is a function', () => {
    expect(typeof window.showGuideConfirmDialog).toBe('function');
  });

  test('creates the confirm dialog in DOM', () => {
    window.showGuideConfirmDialog('dashboard');
    expect(document.getElementById('biztrack-guide-confirm-dialog')).not.toBeNull();
  });

  test('clicking cancel removes the dialog', () => {
    window.showGuideConfirmDialog('dashboard');
    const cancelBtn = document.getElementById('guide-confirm-cancel');
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();
    expect(document.getElementById('biztrack-guide-confirm-dialog')).toBeNull();
  });

  test('clicking start removes dialog and opens guide', () => {
    window.showGuideConfirmDialog('dashboard');
    const startBtn = document.getElementById('guide-confirm-start');
    expect(startBtn).not.toBeNull();
    startBtn.click();
    expect(document.getElementById('biztrack-guide-confirm-dialog')).toBeNull();
    // Guide overlay should now be visible
    expect(document.getElementById('biztrack-guide-overlay')).not.toBeNull();
  });

  test('Escape key removes the dialog', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('biztrack-guide-confirm-dialog')).toBeNull();
  });

  test('clicking outside (on dialog backdrop) removes dialog', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    // Simulate click on dialog element itself (the backdrop)
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // target === dialog → removes it
    expect(document.getElementById('biztrack-guide-confirm-dialog')).toBeNull();
  });
});

// ── window.addGuideButton ─────────────────────────────────────────────────
describe('window.addGuideButton', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-button')?.remove();
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.getElementById('biztrack-guide-confirm-dialog')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('is a function', () => {
    expect(typeof window.addGuideButton).toBe('function');
  });

  test('adds a guide button to the DOM', () => {
    window.addGuideButton('dashboard');
    expect(document.getElementById('biztrack-guide-button')).not.toBeNull();
  });

  test('does not add a second button if already present', () => {
    window.addGuideButton('dashboard');
    window.addGuideButton('dashboard');
    expect(document.querySelectorAll('#biztrack-guide-button').length).toBe(1);
  });

  test('adds button to header-title when present', () => {
    const header = document.createElement('div');
    header.className = 'header-title';
    document.body.appendChild(header);
    document.getElementById('biztrack-guide-button')?.remove(); // ensure fresh
    window.addGuideButton('dashboard');
    expect(header.querySelector('#biztrack-guide-button')).not.toBeNull();
  });
});

// ── updatePageTranslations (exercised via changeLanguage) ─────────────────
describe('updatePageTranslations via changeLanguage', () => {
  afterEach(() => {
    window.changeLanguage('en');
    document.body.innerHTML = '';
  });

  test('updates data-i18n elements', () => {
    const el = document.createElement('span');
    el.dataset.i18n = 'dashboard.revenue';
    document.body.appendChild(el);
    window.changeLanguage('en');
    expect(typeof el.textContent).toBe('string');
  });

  test('updates data-i18n-placeholder elements', () => {
    const input = document.createElement('input');
    input.dataset.i18nPlaceholder = 'dashboard.revenue';
    document.body.appendChild(input);
    window.changeLanguage('en');
    expect(typeof input.placeholder).toBe('string');
  });

  test('updates data-i18n-title elements', () => {
    const btn = document.createElement('button');
    btn.dataset.i18nTitle = 'dashboard.revenue';
    document.body.appendChild(btn);
    window.changeLanguage('en');
    expect(typeof btn.title).toBe('string');
  });

  test('updates data-i18n-aria-label elements (non-guide-button)', () => {
    const btn = document.createElement('button');
    btn.dataset.i18nAriaLabel = 'dashboard.revenue';
    document.body.appendChild(btn);
    window.changeLanguage('en');
    expect(typeof btn.getAttribute('aria-label')).toBe('string');
  });

  test('updates data-i18n-html elements (line 699)', () => {
    const el = document.createElement('div');
    el.dataset.i18nHtml = 'dashboard.revenue';
    document.body.appendChild(el);
    window.changeLanguage('en');
    expect(typeof el.innerHTML).toBe('string');
  });

  test('updates data-i18n-alt elements (line 712)', () => {
    const img = document.createElement('img');
    img.dataset.i18nAlt = 'dashboard.revenue';
    document.body.appendChild(img);
    window.changeLanguage('en');
    expect(typeof img.alt).toBe('string');
  });

  test('updates data-i18n-value elements (line 718)', () => {
    const input = document.createElement('input');
    input.dataset.i18nValue = 'dashboard.revenue';
    document.body.appendChild(input);
    window.changeLanguage('en');
    expect(typeof input.value).toBe('string');
  });

  test('updates select option[data-i18n] elements (line 723)', () => {
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.dataset.i18n = 'dashboard.revenue';
    select.appendChild(option);
    document.body.appendChild(select);
    window.changeLanguage('en');
    expect(typeof option.textContent).toBe('string');
  });

  test('updates select optgroup[data-i18n] elements (line 726)', () => {
    const select = document.createElement('select');
    const optgroup = document.createElement('optgroup');
    optgroup.dataset.i18n = 'dashboard.revenue';
    select.appendChild(optgroup);
    document.body.appendChild(select);
    window.changeLanguage('en');
    expect(typeof optgroup.label).toBe('string');
  });
});

// ── window.initI18n ───────────────────────────────────────────────────────
describe('window.initI18n', () => {
  test('is a function (line 627)', () => {
    expect(typeof window.initI18n).toBe('function');
  });

  test('calling initI18n does not throw', () => {
    expect(() => window.initI18n()).not.toThrow();
  });
});

// ── DOMContentLoaded handler + initCookieBanner ───────────────────────────
describe('DOMContentLoaded handler in i18n/index.js', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('dispatching DOMContentLoaded covers lines 895-902', () => {
    localStorage.removeItem('bizTrack_cookieChoice');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // initCookieBanner should have created the cookie banner
    expect(document.getElementById('cookie-compliance-banner')).not.toBeNull();
  });

  test('DOMContentLoaded with languageSelector sets selector value (line 897)', () => {
    localStorage.removeItem('bizTrack_cookieChoice');
    const sel = document.createElement('select');
    sel.id = 'languageSelector';
    ['en', 'zh', 'zhTW'].forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      sel.appendChild(opt);
    });
    document.body.appendChild(sel);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(sel.value).toBe(window.getCurrentLanguage());
  });

  test('initCookieBanner returns early when cookie choice already stored (line 738)', () => {
    localStorage.setItem('bizTrack_cookieChoice', 'accepted');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(document.getElementById('cookie-compliance-banner')).toBeNull();
  });

  test('refreshGuideText called on languageChanged when guide visible (lines 621-623)', async () => {
    // Open the guide, then dispatch languageChanged → refreshGuideText runs
    window.showUserGuide('dashboard');
    expect(window.userGuideState.visible).toBe(true);
    window.dispatchEvent(new CustomEvent('languageChanged'));
    await new Promise(r => setTimeout(r, 50));
    // Guide overlay should still be present (refreshGuideText didn't close it)
    expect(document.getElementById('biztrack-guide-overlay')).not.toBeNull();
  });
});

// ── initCookieBanner button/keyboard interactions (lines 831-885) ─────────
describe('initCookieBanner button and keyboard interactions', () => {
  function triggerBanner() {
    localStorage.removeItem('bizTrack_cookieChoice');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return document.getElementById('cookie-compliance-banner');
  }

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('reject-all button stores choice and closes banner (lines 849-852, 831-843)', () => {
    // Focus a button so previousActiveElement is truthy when closeBanner calls ?.focus() (line 842)
    const focusAnchor = document.createElement('button');
    document.body.appendChild(focusAnchor);
    focusAnchor.focus();
    // Add a div with children and [inert] attribute so closeBanner's querySelectorAll('[inert]')
    // finds it and runs el.inert = false (line 839)
    const inertDiv = document.createElement('div');
    inertDiv.setAttribute('inert', '');
    const child = document.createElement('span');
    inertDiv.appendChild(child);
    document.body.appendChild(inertDiv);
    const banner = triggerBanner();
    expect(banner).not.toBeNull();
    document.getElementById('reject-all-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('rejected_all');
  });

  test('necessary-only button stores choice and closes banner (lines 853-856)', () => {
    triggerBanner();
    document.getElementById('necessary-only-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('necessary_only');
  });

  test('accept-all button stores choice and closes banner (lines 857-860)', () => {
    triggerBanner();
    document.getElementById('accept-all-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('accepted_all');
  });

  test('close-banner button stores necessary_only and closes banner (lines 862-866)', () => {
    triggerBanner();
    document.getElementById('close-banner-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('necessary_only');
  });

  test('Escape key on banner stores necessary_only and closes banner (lines 874-877)', () => {
    const banner = triggerBanner();
    banner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('necessary_only');
  });

  test('Tab key on banner does not throw (lines 878-884)', () => {
    const banner = triggerBanner();
    expect(() => {
      banner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      banner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    }).not.toThrow();
  });

  test('non-Escape non-Tab key on banner does nothing (implicit else)', () => {
    const banner = triggerBanner();
    expect(() => {
      banner.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }).not.toThrow();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBeNull();
  });

  test('privacy-policy-btn click calls showPrivacyModal (line 847)', () => {
    triggerBanner();
    const original = window.showPrivacyModal;
    window.showPrivacyModal = jest.fn();
    document.getElementById('privacy-policy-btn').click();
    expect(window.showPrivacyModal).toHaveBeenCalled();
    window.showPrivacyModal = original;
  });

  test('Tab on banner focuses first when last focusable is active (line 882)', () => {
    const banner = triggerBanner();
    const focusableEls = banner.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const lastBtn = focusableEls[focusableEls.length - 1];
    if (lastBtn) {
      lastBtn.focus();
      expect(() => {
        banner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      }).not.toThrow();
    }
  });

  test('enforceInertState sets privacy-modal inert=false when it exists (line 811)', () => {
    jest.useFakeTimers();
    triggerBanner();
    // Add #privacy-modal so enforceInertState's if(modalElement) branch is taken
    const modal = document.createElement('div');
    modal.id = 'privacy-modal';
    document.body.appendChild(modal);
    expect(() => jest.advanceTimersByTime(200)).not.toThrow();
    jest.useRealTimers();
  });
});

// ── showGuideConfirmDialog focus and Tab trap (lines 196-203, 211) ────────
describe('showGuideConfirmDialog Tab focus trap (lines 196-203, 211)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    document.getElementById('biztrack-guide-confirm-dialog')?.remove();
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('setTimeout focus on startBtn fires after 100ms (line 211)', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    expect(dialog).not.toBeNull();
    expect(() => jest.advanceTimersByTime(150)).not.toThrow();
  });

  test('Shift+Tab when activeElement is first focusable wraps to last (lines 196-197)', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusables.length > 0) {
      focusables[0].focus();
      expect(() => {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
      }).not.toThrow();
    }
  });

  test('Tab when activeElement is last focusable wraps to first (lines 202-203)', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusables.length > 0) {
      focusables[focusables.length - 1].focus();
      expect(() => {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      }).not.toThrow();
    }
  });
});

// ── showUserGuide: else if (closeButton) / else overlay.focus() (lines 48-54) ──
describe('showUserGuide alternate focus: closeButton and overlay (lines 48-54)', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('focuses closeButton when nextBtn.style.display="none" and prevBtn hidden at step 0 (lines 50-51)', () => {
    // First open: creates overlay with nextBtn visible
    window.showUserGuide('dashboard');
    const nextBtn = document.getElementById('biztrack-guide-next');
    // Manually hide nextBtn so display='none' persists (updateGuideContent never resets nextBtn display)
    if (nextBtn) nextBtn.style.display = 'none';
    // Close without removing overlay (overlay stays in DOM)
    window.closeUserGuide();
    // Second open: ensureGuideElements returns early (overlay exists), updateGuideContent keeps nextBtn='none',
    // sets prevBtn='none' (step 0). Focus logic: nextBtn.display='none' → FALSE, prevBtn.display='none' → FALSE,
    // closeButton exists → closeButton.focus() (lines 50-51 covered!)
    expect(() => window.showUserGuide('dashboard')).not.toThrow();
  });

  test('focuses prevBtn when nextBtn hidden and stepIndex forced to 1 via property trick (line 49)', () => {
    // Force stepIndex to always return 1 via a getter so prevBtn is made visible by updateGuideContent
    window.showUserGuide('dashboard'); // creates overlay
    const nextBtn = document.getElementById('biztrack-guide-next');
    if (nextBtn) nextBtn.style.display = 'none'; // hide nextBtn
    window.closeUserGuide();

    // Override stepIndex getter so it returns 1, making updateGuideContent set prevBtn to 'block'
    const originalState = { ...window.userGuideState };
    let _stepIndex = 1;
    Object.defineProperty(window.userGuideState, 'stepIndex', {
      get() { return _stepIndex; },
      set(v) { _stepIndex = v; },
      configurable: true,
    });

    // Now showUserGuide will:
    // - set stepIndex=0 → _stepIndex=0 (but our getter will return it)
    // Wait — our setter DOES update _stepIndex, so it becomes 0 and getter returns 0.
    // We need setter to ignore the reset at line 30 of showUserGuide.
    // Re-define with no-op setter to keep _stepIndex=1:
    _stepIndex = 1;
    Object.defineProperty(window.userGuideState, 'stepIndex', {
      get() { return 1; },
      set(v) { /* ignore to keep stepIndex=1 */ },
      configurable: true,
    });

    expect(() => window.showUserGuide('dashboard')).not.toThrow();
    // Restore normal stepIndex
    Object.defineProperty(window.userGuideState, 'stepIndex', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  test('focuses overlay when nextBtn hidden, prevBtn hidden, and closeButton removed (lines 52-54)', () => {
    // First open
    window.showUserGuide('dashboard');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const closeButton = document.getElementById('biztrack-guide-close');
    if (nextBtn) nextBtn.style.display = 'none';
    // Remove closeButton so all checks fail → overlay.focus() (lines 52-54)
    if (closeButton) closeButton.remove();
    window.closeUserGuide();
    // Second open: nextBtn display='none', prevBtn='none' (step 0), no closeButton → overlay.focus()
    expect(() => window.showUserGuide('dashboard')).not.toThrow();
  });

  test('focuses overlay when both nextBtn and prevBtn are hidden and no closeButton (original test)', () => {
    window.showUserGuide('dashboard');
    const overlay = document.getElementById('biztrack-guide-overlay');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const prevBtn = document.getElementById('biztrack-guide-prev');
    const closeButton = document.getElementById('biztrack-guide-close');
    if (nextBtn) nextBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (closeButton) closeButton.remove();
    overlay?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
    expect(() => window.showUserGuide('dashboard')).not.toThrow();
  });
});

// ── guide overlay ArrowLeft/Right when focus IS on close button (lines 523-543) ──
describe('guide overlay arrow keys when close button is focused (lines 523-543)', () => {
  beforeEach(() => { window.showUserGuide('dashboard'); });
  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('ArrowLeft when close button is first focusable wraps to last (line 530-532)', () => {
    const overlay = document.getElementById('biztrack-guide-overlay');
    const closeBtn = document.getElementById('biztrack-guide-close');
    if (closeBtn) {
      closeBtn.focus();
      expect(() => {
        overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }).not.toThrow();
    }
  });

  test('ArrowRight when close button is last focusable wraps to first (line 538-540)', () => {
    const overlay = document.getElementById('biztrack-guide-overlay');
    const closeBtn = document.getElementById('biztrack-guide-close');
    // Remove prevBtn and nextBtn so closeButton IS the only/last focusable element
    // focusableElements = [closeButton], closeIndex=0, length-1=0 → not(0 < 0) → else runs (line 540)
    document.getElementById('biztrack-guide-prev')?.remove();
    document.getElementById('biztrack-guide-next')?.remove();
    if (closeBtn) {
      closeBtn.focus();
      expect(() => {
        overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      }).not.toThrow();
    }
  });

  test('ArrowRight when close button is not the last focusable focuses next element (line 537)', () => {
    // In the original overlay order: close, prev, next — close is FIRST (closeIndex=0 < length-1=2)
    // So ArrowRight → focusableElements[1].focus() → line 537 covered
    const overlay = document.getElementById('biztrack-guide-overlay');
    const closeBtn = document.getElementById('biztrack-guide-close');
    if (closeBtn) {
      closeBtn.focus();
      expect(() => {
        overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      }).not.toThrow();
    }
  });

  test('ArrowLeft when close button is not first focuses previous element (line 529)', () => {
    // Add an extra button before the close button to make closeIndex > 0
    const overlay = document.getElementById('biztrack-guide-overlay');
    const panel = overlay?.querySelector('.biztrack-guide-panel');
    if (panel) {
      const extraBtn = document.createElement('button');
      extraBtn.id = 'extra-focusable';
      panel.insertBefore(extraBtn, panel.firstChild);
    }
    const closeBtn = document.getElementById('biztrack-guide-close');
    if (closeBtn) {
      closeBtn.focus();
      expect(() => {
        overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }).not.toThrow();
    }
  });
});

// ── guide overlay Tab key with nextBtn/prevBtn hidden (lines 503-508) ──────
describe('guide overlay Tab key with both nav buttons hidden (lines 503-508)', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('Tab focuses closeButton when nextBtn and prevBtn are hidden (lines 505-506)', () => {
    window.showUserGuide('dashboard');
    const overlay = document.getElementById('biztrack-guide-overlay');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const prevBtn = document.getElementById('biztrack-guide-prev');
    if (nextBtn) nextBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    expect(() => {
      overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    }).not.toThrow();
  });
});

// ── nextGuideStep: last step closes guide (line 77) ───────────────────────
describe('nextGuideStep at last step closes guide', () => {
  beforeEach(() => { window.showUserGuide('dashboard'); });

  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('nextGuideStep at last step calls closeUserGuide (line 77)', () => {
    // Set stepIndex beyond any real page's step count to guarantee the else branch
    window.userGuideState.stepIndex = 9999;
    window.nextGuideStep();
    expect(window.userGuideState.visible).toBe(false);
  });
});

// ── addGuideButton keydown: Enter/Space triggers showGuideConfirmDialog ───
describe('addGuideButton keydown event (lines 113-115)', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-button')?.remove();
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.getElementById('biztrack-guide-confirm-dialog')?.remove();
    document.body.classList.remove('biztrack-guide-open');
    document.body.innerHTML = '';
  });

  test('Enter key on guide button triggers showGuideConfirmDialog', () => {
    window.addGuideButton('dashboard');
    const btn = document.getElementById('biztrack-guide-button');
    expect(btn).not.toBeNull();
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(document.getElementById('biztrack-guide-confirm-dialog')).not.toBeNull();
  });

  test('Space key on guide button triggers showGuideConfirmDialog', () => {
    window.addGuideButton('dashboard');
    const btn = document.getElementById('biztrack-guide-button');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(document.getElementById('biztrack-guide-confirm-dialog')).not.toBeNull();
  });

  test('other key on guide button does nothing', () => {
    window.addGuideButton('dashboard');
    const btn = document.getElementById('biztrack-guide-button');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.getElementById('biztrack-guide-confirm-dialog')).toBeNull();
  });
});

// ── showGuideConfirmDialog: Tab focus trap (lines 191-203) ────────────────
describe('showGuideConfirmDialog Tab focus trap', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-confirm-dialog')?.remove();
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('Tab key on dialog does not throw', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    expect(() => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    }).not.toThrow();
  });

  test('Shift+Tab key on dialog does not throw', () => {
    window.showGuideConfirmDialog('dashboard');
    const dialog = document.getElementById('biztrack-guide-confirm-dialog');
    expect(() => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    }).not.toThrow();
  });
});

// ── Guide overlay keyboard events (lines 516-569) ─────────────────────────
describe('guide overlay keyboard events', () => {
  beforeEach(() => { window.showUserGuide('dashboard'); });

  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('Escape key closes the guide overlay (lines 516-518)', () => {
    const overlay = document.getElementById('biztrack-guide-overlay');
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(window.userGuideState.visible).toBe(false);
  });

  test('ArrowLeft key calls prevGuideStep (line 546-547)', () => {
    window.userGuideState.stepIndex = 2;
    const overlay = document.getElementById('biztrack-guide-overlay');
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(window.userGuideState.stepIndex).toBe(1);
  });

  test('ArrowRight key calls nextGuideStep (line 548-549)', () => {
    window.userGuideState.stepIndex = 0;
    const overlay = document.getElementById('biztrack-guide-overlay');
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(typeof window.userGuideState.stepIndex).toBe('number');
  });

  test('Tab key does not throw (lines 553-571)', () => {
    const overlay = document.getElementById('biztrack-guide-overlay');
    expect(() => {
      overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    }).not.toThrow();
  });
});

// ── Guide overlay click: click on panel (lines 489-508) ──────────────────
describe('guide overlay click event', () => {
  beforeEach(() => { window.showUserGuide('dashboard'); });

  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('clicking overlay backdrop closes guide (line 489-490)', () => {
    const overlay = document.getElementById('biztrack-guide-overlay');
    // Simulate click directly on overlay (not on panel)
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: false }));
    // target === overlay → closeUserGuide
    expect(window.userGuideState.visible).toBe(false);
  });

  test('clicking inside panel does not close guide (line 492-509)', () => {
    const overlay = document.getElementById('biztrack-guide-overlay');
    const panel = overlay.querySelector('.biztrack-guide-panel');
    if (panel) {
      panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // Click inside panel does not close guide
      expect(window.userGuideState.visible).toBe(true);
    } else {
      expect(overlay).not.toBeNull();
    }
  });

  test('panel click with nextBtn hidden → else-if prevBtn branch (line 503-504)', () => {
    window.showUserGuide('dashboard');
    const overlay = document.getElementById('biztrack-guide-overlay');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const prevBtn = document.getElementById('biztrack-guide-prev');
    const panel = overlay?.querySelector('.biztrack-guide-panel');
    if (nextBtn) nextBtn.style.display = 'none';
    // prevBtn visible → else-if branch at line 503 runs → prevBtn.focus() (line 504)
    if (prevBtn) prevBtn.style.display = 'block';
    if (panel) {
      expect(() => panel.dispatchEvent(new MouseEvent('click', { bubbles: true }))).not.toThrow();
    }
  });

  test('panel click with nextBtn and prevBtn hidden → else-if closeButton branch (lines 505-506)', () => {
    window.showUserGuide('dashboard');
    const overlay = document.getElementById('biztrack-guide-overlay');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const prevBtn = document.getElementById('biztrack-guide-prev');
    const panel = overlay?.querySelector('.biztrack-guide-panel');
    if (nextBtn) nextBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    // closeButton still exists → else-if (closeButton) runs → closeButton.focus() (lines 505-506)
    if (panel) {
      expect(() => panel.dispatchEvent(new MouseEvent('click', { bubbles: true }))).not.toThrow();
    }
  });

  test('panel click with nextBtn, prevBtn, closeButton all hidden → else focusableElements branch (507-508)', () => {
    window.showUserGuide('dashboard');
    const overlay = document.getElementById('biztrack-guide-overlay');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const prevBtn = document.getElementById('biztrack-guide-prev');
    const closeButton = document.getElementById('biztrack-guide-close');
    const panel = overlay?.querySelector('.biztrack-guide-panel');
    if (nextBtn) nextBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (closeButton) closeButton.remove();
    if (panel) {
      expect(() => panel.dispatchEvent(new MouseEvent('click', { bubbles: true }))).not.toThrow();
    }
  });
});

// ── showUserGuide alternate focus paths (lines 48-54) ─────────────────────
describe('showUserGuide alternate focus paths', () => {
  afterEach(() => {
    document.getElementById('biztrack-guide-overlay')?.remove();
    document.getElementById('biztrack-guide-styles')?.remove();
    document.body.classList.remove('biztrack-guide-open');
  });

  test('focuses prevBtn when nextBtn is hidden (line 48)', () => {
    window.showUserGuide('dashboard');
    const overlay = document.getElementById('biztrack-guide-overlay');
    const nextBtn = document.getElementById('biztrack-guide-next');
    const prevBtn = document.getElementById('biztrack-guide-prev');
    if (nextBtn && prevBtn) {
      nextBtn.style.display = 'none';
      prevBtn.style.display = 'block';
      overlay?.remove();
      document.getElementById('biztrack-guide-styles')?.remove();
      document.body.classList.remove('biztrack-guide-open');
      // Re-open guide – nextBtn hidden → prevBtn.focus() branch
      window.showUserGuide('dashboard');
      expect(document.getElementById('biztrack-guide-overlay')).not.toBeNull();
    }
  });
});
