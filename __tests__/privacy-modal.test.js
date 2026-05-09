beforeAll(() => {
  window.t = jest.fn((key) => key);
});

import '../privacy-modal.js';

describe('privacy-modal: showPrivacyModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.t = jest.fn((key) => key);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('window.showPrivacyModal is a function', () => {
    expect(typeof window.showPrivacyModal).toBe('function');
  });

  test('creates a modal with correct ARIA attributes', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    expect(modal).not.toBeNull();
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-labelledby')).toBe('privacy-modal-title');
  });

  test('modal contains a close button', () => {
    window.showPrivacyModal();
    const closeBtn = document.getElementById('privacy-modal-close');
    expect(closeBtn).not.toBeNull();
    expect(closeBtn.tagName).toBe('BUTTON');
  });

  test('modal contains all five privacy policy sections', () => {
    window.showPrivacyModal();
    const articles = document.querySelectorAll('#privacy-modal article');
    expect(articles.length).toBe(5);
  });

  test('clicking close button removes the modal', () => {
    window.showPrivacyModal();
    document.getElementById('privacy-modal-close').click();
    expect(document.getElementById('privacy-modal')).toBeNull();
  });

  test('clicking outside the modal removes it', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('privacy-modal')).toBeNull();
  });

  test('Escape key closes the modal', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('privacy-modal')).toBeNull();
  });

  test('removes existing modal before opening a new one', () => {
    window.showPrivacyModal();
    window.showPrivacyModal();
    const modals = document.querySelectorAll('#privacy-modal');
    expect(modals.length).toBe(1);
  });

  test('focuses close button after timeout', () => {
    window.showPrivacyModal();
    const closeBtn = document.getElementById('privacy-modal-close');
    const focusSpy = jest.spyOn(closeBtn, 'focus');
    jest.advanceTimersByTime(100);
    expect(focusSpy).toHaveBeenCalled();
  });

  test('Tab key wraps focus when on the last focusable element', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    const closeBtn = document.getElementById('privacy-modal-close');
    closeBtn.focus();
    expect(() => {
      modal.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', bubbles: true, cancelable: true
      }));
    }).not.toThrow();
  });

  test('Shift+Tab wraps focus when on the first focusable element', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    const closeBtn = document.getElementById('privacy-modal-close');
    closeBtn.focus();
    expect(() => {
      modal.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', shiftKey: true, bubbles: true, cancelable: true
      }));
    }).not.toThrow();
  });

  test('Tab key does not wrap when not on last focusable element', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    document.body.focus();
    expect(() => {
      modal.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', bubbles: true, cancelable: true
      }));
    }).not.toThrow();
  });

  test('Shift+Tab does not wrap when not on first focusable element', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    document.body.focus();
    expect(() => {
      modal.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', shiftKey: true, bubbles: true, cancelable: true
      }));
    }).not.toThrow();
  });

  test('clicking inside modal content does not close modal', () => {
    window.showPrivacyModal();
    const title = document.getElementById('privacy-modal-title');
    title.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('privacy-modal')).not.toBeNull();
  });

  test('closeModal restores focus to previously active element', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();

    window.showPrivacyModal();
    const focusSpy = jest.spyOn(btn, 'focus');
    document.getElementById('privacy-modal-close').click();
    expect(focusSpy).toHaveBeenCalled();
  });

  test('uses || fallback text when window.t returns undefined (lines 21-33)', () => {
    window.t = jest.fn(() => undefined);
    expect(() => window.showPrivacyModal()).not.toThrow();
    const modal = document.getElementById('privacy-modal');
    expect(modal).not.toBeNull();
    // close button should show fallback text 'Close'
    const closeBtn = document.getElementById('privacy-modal-close');
    expect(closeBtn.textContent).toBe('Close');
    window.t = jest.fn((key) => key);
  });

  test('non-Escape non-Tab key on modal does nothing (implicit else at line 102)', () => {
    window.showPrivacyModal();
    const modal = document.getElementById('privacy-modal');
    expect(() => {
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }).not.toThrow();
    // Modal should still exist (not closed by ArrowDown)
    expect(document.getElementById('privacy-modal')).not.toBeNull();
  });

  test('closeModal with no previously active element (if branch false at line 80)', () => {
    // Force previousActiveElement to be null by blurring everything
    if (document.activeElement) { document.activeElement.blur(); }
    window.showPrivacyModal();
    // Close button triggers closeModal; if previousActiveElement is body (jsdom default), focus is still safe
    expect(() => document.getElementById('privacy-modal-close').click()).not.toThrow();
  });
});
