import { en } from '../i18n/locales/en.js';
import { zh } from '../i18n/locales/zh.js';
import { zhTW } from '../i18n/locales/zh-TW.js';

const REQUIRED_TOP_LEVEL_KEYS = [
  'sidebar', 'history', 'dashboard', 'products',
  'orders', 'expenses', 'balance', 'privacy'
];

const REQUIRED_SIDEBAR_KEYS = [
  'dashboard', 'products', 'orders', 'expenses',
  'balance', 'help', 'close', 'history'
];

// ─── English locale ──────────────────────────────────────────────────────────
describe('en locale', () => {
  test('is exported as a non-null object', () => {
    expect(typeof en).toBe('object');
    expect(en).not.toBeNull();
  });

  test('has all required top-level sections', () => {
    REQUIRED_TOP_LEVEL_KEYS.forEach((key) => {
      expect(en).toHaveProperty(key);
    });
  });

  test('sidebar contains all required keys with string values', () => {
    REQUIRED_SIDEBAR_KEYS.forEach((key) => {
      expect(typeof en.sidebar[key]).toBe('string');
      expect(en.sidebar[key].length).toBeGreaterThan(0);
    });
  });

  test('history section has required column labels', () => {
    expect(typeof en.history.colTime).toBe('string');
    expect(typeof en.history.colAction).toBe('string');
    expect(typeof en.history.noRecords).toBe('string');
  });

  test('dashboard section has required keys', () => {
    expect(en.dashboard).toBeDefined();
    expect(typeof en.dashboard).toBe('object');
  });

  test('privacy section has cookie-related keys', () => {
    expect(typeof en.privacy.cookieMessage).toBe('string');
    expect(typeof en.privacy.acceptAll).toBe('string');
    expect(typeof en.privacy.rejectAll).toBe('string');
    expect(typeof en.privacy.necessaryOnly).toBe('string');
  });
});

// ─── Chinese (Simplified) locale ─────────────────────────────────────────────
describe('zh locale', () => {
  test('is exported as a non-null object', () => {
    expect(typeof zh).toBe('object');
    expect(zh).not.toBeNull();
  });

  test('has all required top-level sections', () => {
    REQUIRED_TOP_LEVEL_KEYS.forEach((key) => {
      expect(zh).toHaveProperty(key);
    });
  });

  test('sidebar contains all required keys with string values', () => {
    REQUIRED_SIDEBAR_KEYS.forEach((key) => {
      expect(typeof zh.sidebar[key]).toBe('string');
      expect(zh.sidebar[key].length).toBeGreaterThan(0);
    });
  });

  test('history section has required column labels', () => {
    expect(typeof zh.history.colTime).toBe('string');
    expect(typeof zh.history.colAction).toBe('string');
    expect(typeof zh.history.noRecords).toBe('string');
  });

  test('privacy section has cookie-related keys', () => {
    expect(typeof zh.privacy.cookieMessage).toBe('string');
    expect(typeof zh.privacy.acceptAll).toBe('string');
    expect(typeof zh.privacy.rejectAll).toBe('string');
  });
});

// ─── Chinese (Traditional) locale ────────────────────────────────────────────
describe('zhTW locale', () => {
  test('is exported as a non-null object', () => {
    expect(typeof zhTW).toBe('object');
    expect(zhTW).not.toBeNull();
  });

  test('has all required top-level sections', () => {
    REQUIRED_TOP_LEVEL_KEYS.forEach((key) => {
      expect(zhTW).toHaveProperty(key);
    });
  });

  test('sidebar contains all required keys with string values', () => {
    REQUIRED_SIDEBAR_KEYS.forEach((key) => {
      expect(typeof zhTW.sidebar[key]).toBe('string');
      expect(zhTW.sidebar[key].length).toBeGreaterThan(0);
    });
  });

  test('privacy section has cookie-related keys', () => {
    expect(typeof zhTW.privacy.cookieMessage).toBe('string');
    expect(typeof zhTW.privacy.acceptAll).toBe('string');
    expect(typeof zhTW.privacy.rejectAll).toBe('string');
  });
});

// ─── Cross-locale consistency ─────────────────────────────────────────────────
describe('locale consistency', () => {
  test('en and zh have the same top-level keys', () => {
    const enKeys = Object.keys(en).sort();
    const zhKeys = Object.keys(zh).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  test('en and zhTW have the same top-level keys', () => {
    const enKeys = Object.keys(en).sort();
    const zhTWKeys = Object.keys(zhTW).sort();
    expect(enKeys).toEqual(zhTWKeys);
  });

  test('all three locales have the same sidebar keys', () => {
    const enSidebarKeys = Object.keys(en.sidebar).sort();
    const zhSidebarKeys = Object.keys(zh.sidebar).sort();
    const zhTWSidebarKeys = Object.keys(zhTW.sidebar).sort();
    expect(enSidebarKeys).toEqual(zhSidebarKeys);
    expect(enSidebarKeys).toEqual(zhTWSidebarKeys);
  });

  test('sidebar values differ between en and zh (actually translated)', () => {
    expect(en.sidebar.dashboard).not.toBe(zh.sidebar.dashboard);
    expect(en.sidebar.products).not.toBe(zh.sidebar.products);
  });

  test('sidebar values differ between zh and zhTW (different scripts)', () => {
    expect(zh.sidebar.dashboard).not.toBe(zhTW.sidebar.dashboard);
  });
});
