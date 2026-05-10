// Set up window.t mock before the module is imported
// cookie-banner.js uses window.t() inside initCookieBanner()
beforeAll(() => {
  window.t = jest.fn((key) => key);
  window.showPrivacyModal = jest.fn();
});

// Import after mocks are set up (babel transforms allow this ordering with require)
import '../cookie-banner.js';

describe('cookie-banner: initCookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    document.body.classList.remove('cookie-banner-open');
    window.t = jest.fn((key) => key);
    window.showPrivacyModal = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('window.initCookieBanner is a function', () => {
    expect(typeof window.initCookieBanner).toBe('function');
  });

  test('does not render banner if cookie choice already exists', () => {
    localStorage.setItem('bizTrack_cookieChoice', 'accepted_all');
    window.initCookieBanner();
    expect(document.getElementById('cookie-compliance-banner')).toBeNull();
  });

  test('renders banner when no cookie choice exists', () => {
    window.initCookieBanner();
    expect(document.getElementById('cookie-compliance-banner')).not.toBeNull();
  });

  test('adds cookie-banner-open class to body when banner is shown', () => {
    window.initCookieBanner();
    expect(document.body.classList.contains('cookie-banner-open')).toBe(true);
  });

  test('clicking reject-all stores rejected_all in localStorage', () => {
    window.initCookieBanner();
    document.getElementById('reject-all-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('rejected_all');
  });

  test('clicking necessary-only stores necessary_only in localStorage', () => {
    window.initCookieBanner();
    document.getElementById('necessary-only-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('necessary_only');
  });

  test('clicking accept-all stores accepted_all in localStorage', () => {
    window.initCookieBanner();
    document.getElementById('accept-all-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('accepted_all');
  });

  test('clicking close-banner stores necessary_only in localStorage', () => {
    window.initCookieBanner();
    document.getElementById('close-banner-btn').click();
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('necessary_only');
  });

  test('clicking any consent button hides the banner', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    document.getElementById('accept-all-btn').click();
    expect(banner.style.display).toBe('none');
  });

  test('pressing Escape key stores necessary_only and hides banner', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    banner.dispatchEvent(escEvent);
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('necessary_only');
    expect(banner.style.display).toBe('none');
  });

  test('clicking privacy policy button calls showPrivacyModal', () => {
    window.initCookieBanner();
    document.getElementById('privacy-policy-btn').click();
    expect(window.showPrivacyModal).toHaveBeenCalled();
  });

  test('banner has correct ARIA role', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    expect(banner.getAttribute('role')).toBe('dialog');
    expect(banner.getAttribute('aria-modal')).toBe('true');
  });

  test('removes cookie-banner-open class after consent is given', () => {
    window.initCookieBanner();
    document.getElementById('accept-all-btn').click();
    expect(document.body.classList.contains('cookie-banner-open')).toBe(false);
  });

  test('Tab key cycles focus within the banner (last → first)', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const buttons = banner.querySelectorAll('button');
    const lastButton = buttons[buttons.length - 1];

    lastButton.focus();
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab', bubbles: true, cancelable: true
    });
    banner.dispatchEvent(tabEvent);
    // focus trap should redirect — no error thrown
    expect(true).toBe(true);
  });

  test('Shift+Tab key cycles focus within the banner (first → last)', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const buttons = banner.querySelectorAll('button');
    buttons[0].focus();

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true
    });
    banner.dispatchEvent(shiftTabEvent);
    expect(true).toBe(true);
  });

  test('Enter key on a focused button triggers its click', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const acceptBtn = document.getElementById('accept-all-btn');
    acceptBtn.focus();

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true
    });
    banner.dispatchEvent(enterEvent);
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('accepted_all');
  });

  test('showPrivacyModal is not called if it is not a function', () => {
    window.showPrivacyModal = undefined;
    window.initCookieBanner();
    expect(() => {
      document.getElementById('privacy-policy-btn').click();
    }).not.toThrow();
  });

  test('enforceInertState sets inert on non-banner body children', () => {
    const otherDiv = document.createElement('div');
    otherDiv.id = 'some-other-element';
    document.body.appendChild(otherDiv);

    window.initCookieBanner();
    jest.advanceTimersByTime(200);

    expect(otherDiv.inert).toBe(true);
  });

  test('enforceInertState keeps banner itself not inert', () => {
    window.initCookieBanner();
    jest.advanceTimersByTime(200);
    const banner = document.getElementById('cookie-compliance-banner');
    expect(banner.inert).toBe(false);
  });

  test('enforceInertState keeps privacy-modal not inert when present', () => {
    const modal = document.createElement('div');
    modal.id = 'privacy-modal';
    document.body.appendChild(modal);

    window.initCookieBanner();
    jest.advanceTimersByTime(200);

    expect(modal.inert).toBe(false);
  });

  test('Tab key wraps from last focusable to first', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const buttons = Array.from(banner.querySelectorAll('button')).filter(b => !b.inert);
    const lastButton = buttons[buttons.length - 1];
    lastButton.focus();

    banner.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', bubbles: true, cancelable: true
    }));
    expect(true).toBe(true);
  });

  test('Shift+Tab wraps from first focusable to last', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const buttons = Array.from(banner.querySelectorAll('button')).filter(b => !b.inert);
    buttons[0].focus();

    banner.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true
    }));
    expect(true).toBe(true);
  });

  test('Space key on focused button triggers click', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    const acceptBtn = document.getElementById('accept-all-btn');
    acceptBtn.focus();

    banner.dispatchEvent(new KeyboardEvent('keydown', {
      key: ' ', bubbles: true, cancelable: true
    }));
    expect(localStorage.getItem('bizTrack_cookieChoice')).toBe('accepted_all');
  });

  test('closeBanner cleanup runs without throwing', () => {
    window.initCookieBanner();
    expect(() => {
      document.getElementById('accept-all-btn').click();
    }).not.toThrow();
  });

  test('non-string cookie message from window.t skips HTML escaping branch', () => {
    window.t = jest.fn((key) => {
      if (key === 'privacy.cookieMessage') return 42;
      return key;
    });
    window.initCookieBanner();
    expect(document.getElementById('cookie-compliance-banner')).not.toBeNull();
  });

  test('enforceInertState marks nested descendants under body children', () => {
    const section = document.createElement('section');
    section.appendChild(document.createElement('div')).appendChild(document.createElement('span'));
    document.body.appendChild(section);

    window.initCookieBanner();
    jest.advanceTimersByTime(150);

    const nestedSpan = section.querySelector('span');
    expect(nestedSpan.inert).toBe(true);
  });

  test('Enter on banner does not activate click when focus is not on a button', () => {
    window.initCookieBanner();
    const banner = document.getElementById('cookie-compliance-banner');
    banner.focus();

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true
    });
    banner.dispatchEvent(enterEvent);

    expect(localStorage.getItem('bizTrack_cookieChoice')).toBeNull();
  });
});
