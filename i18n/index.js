// index.js
import { escapeHTML, replaceParams } from './utils.js';
import { en } from './locales/en.js';
import { zh } from './locales/zh.js';
import { zhTW } from './locales/zh-TW.js';
import { datePickerI18n } from './datePicker.js';

const translations = { en, zh, zhTW };
let currentLanguage = localStorage.getItem('bizTrackLanguage') || 'en';

// 【新增】重置 Cookie 偏好并刷新页面
window.resetCookieConsent = function() {
    // 移除 localStorage 中的偏好记录
    localStorage.removeItem('bizTrack_cookieChoice');
    
    // 刷新页面，刷新后由于没有了记录，initCookieBanner 会自动重新弹出
    location.reload(); 
};

window.datePickerI18n = datePickerI18n;
window.getCurrentLanguage = function () {
  return currentLanguage;
};

window.showUserGuide = function (pageKey = 'dashboard') {
  ensureGuideElements();

  const pageData = getGuidePageData(pageKey);
  window.userGuideState.pageKey = pageKey;
  window.userGuideState.stepIndex = 0;
  window.userGuideState.visible = true;

  updateGuideContent(pageData);
  document.body.classList.add('biztrack-guide-open');

  // 保存之前聚焦的元素
  window.userGuideState.previousActiveElement = document.activeElement;

  // 将焦点设置到下一步按钮（如果存在且可见），否则设置到第一个可聚焦元素
  const overlay = document.getElementById('biztrack-guide-overlay');
  const nextBtn = document.getElementById('biztrack-guide-next');
  const prevBtn = document.getElementById('biztrack-guide-prev');
  const closeButton = document.getElementById('biztrack-guide-close');

  // 优先设置焦点到下一步按钮
  if (nextBtn && nextBtn.style.display !== 'none') {
    nextBtn.focus();
  } else if (prevBtn && prevBtn.style.display !== 'none') {
    prevBtn.focus();
  } else if (closeButton) {
    closeButton.focus();
  } else {
    // 如果没有按钮可聚焦，设置到 overlay 本身
    overlay.focus();
  }
};

window.closeUserGuide = function () {
  const overlay = document.getElementById('biztrack-guide-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  window.userGuideState.visible = false;
  document.body.classList.remove('biztrack-guide-open');

  // 恢复焦点到之前聚焦的元素
  if (window.userGuideState.previousActiveElement) {
    window.userGuideState.previousActiveElement.focus();
  }
};

window.nextGuideStep = function () {
  const pageData = getGuidePageData(window.userGuideState.pageKey);
  if (window.userGuideState.stepIndex < pageData.steps.length - 1) {
    window.userGuideState.stepIndex += 1;
    updateGuideContent(pageData);
  } else {
    window.closeUserGuide();
  }
};

window.prevGuideStep = function () {
  if (window.userGuideState.stepIndex > 0) {
    window.userGuideState.stepIndex -= 1;
    const pageData = getGuidePageData(window.userGuideState.pageKey);
    updateGuideContent(pageData);
  }
};

window.addGuideButton = function (pageKey, anchorSelector = 'body') {
  if (document.getElementById('biztrack-guide-button')) return;
  ensureGuideElements();

  // 查找页面标题容器
  const headerTitle = document.querySelector('.header-title');
  if (!headerTitle) {
    console.warn('Header title container not found, appending button to body');
    anchorSelector = 'body';
  }

  // 创建问号按钮
  const button = document.createElement('button');
  button.id = 'biztrack-guide-button';
  button.type = 'button';
  button.className = 'biztrack-guide-button';
  button.setAttribute('tabindex', '0');
  button.setAttribute('aria-label', 'Help');
  button.setAttribute('data-guide-button', 'true'); // 标记为引导按钮，避免被语言切换更新
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  button.onclick = () => window.showGuideConfirmDialog(pageKey);

  // 添加键盘支持
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.showGuideConfirmDialog(pageKey);
    }
  });

  // 将按钮添加到标题容器中
  if (headerTitle) {
    headerTitle.appendChild(button);
  } else {
    const anchor = document.querySelector(anchorSelector) || document.body;
    anchor.appendChild(button);
  }
};

window.showGuideConfirmDialog = function(pageKey) {
  // 保存之前聚焦的元素
  const previousActiveElement = document.activeElement;

  // 创建确认对话框
  const dialog = document.createElement('div');
  dialog.id = 'biztrack-guide-confirm-dialog';
  dialog.className = 'biztrack-guide-confirm-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'guide-confirm-title');

  dialog.innerHTML = `
    <div class="biztrack-guide-confirm-content">
      <h3 id="guide-confirm-title">${escapeHTML(window.t('guide.confirmTitle'))}</h3>
      <p>${escapeHTML(window.t('guide.confirmMessage'))}</p>
      <div class="biztrack-guide-confirm-actions">
        <button id="guide-confirm-cancel" class="secondary">${escapeHTML(window.t('guide.cancel'))}</button>
        <button id="guide-confirm-start" class="primary">${escapeHTML(window.t('guide.startTour'))}</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // 获取对话框内的可聚焦元素
  const getFocusableElements = () => {
    return dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  };

  // 添加事件监听器
  const cancelBtn = document.getElementById('guide-confirm-cancel');
  const startBtn = document.getElementById('guide-confirm-start');

  cancelBtn.addEventListener('click', () => {
    dialog.remove();
    previousActiveElement?.focus();
  });

  startBtn.addEventListener('click', () => {
    dialog.remove();
    window.showUserGuide(pageKey);
  });

  // 点击对话框外部关闭
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
      previousActiveElement?.focus();
    }
  });

  // 键盘支持
  dialog.addEventListener('keydown', (e) => {
    const focusableElements = getFocusableElements();
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.key === 'Escape') {
      dialog.remove();
      previousActiveElement?.focus();
    } else if (e.key === 'Tab') {
      // 焦点陷阱：确保 Tab 键只能在对话框内部循环
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });

  // 聚焦到开始按钮
  setTimeout(() => {
    startBtn.focus();
  }, 100);
};

window.userGuideState = {
  pageKey: 'dashboard',
  stepIndex: 0,
  visible: false
};

function getGuidePageData(pageKey) {
  const page = translations[currentLanguage]?.guide?.pages?.[pageKey];
  const fallback = translations[currentLanguage]?.guide?.pages?.dashboard || {};
  return {
    title: page?.title || fallback.title || window.t('guide.title'),
    intro: page?.intro || fallback.intro || '',
    steps: page?.steps || fallback.steps || []
  };
}

function ensureGuideElements() {
  if (document.getElementById('biztrack-guide-overlay')) return;

  const style = document.createElement('style');
  style.id = 'biztrack-guide-styles';
  style.textContent = `
    /* 确保标题容器能够容纳按钮 */
    .header-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex: 1;
    }

    .header-title h1 {
      margin: 0;
      flex-shrink: 0;
    }

    /* 引导按钮样式 */
    .biztrack-guide-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 16px;
      width: 36px;
      height: 36px;
      padding: 0;
      background: transparent;
      color: #1976d2;
      border: 2px solid transparent;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .biztrack-guide-button:hover {
      background: rgba(25, 118, 210, 0.1);
      transform: scale(1.1);
    }

    .biztrack-guide-button:focus {
      border-color: #64b5f6;
      background: rgba(25, 118, 210, 0.1);
      box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.3);
    }

    .biztrack-guide-button:active {
      transform: scale(0.95);
    }

    .biztrack-guide-button i {
      font-size: 20px;
    }

    /* 确认对话框样式 */
    .biztrack-guide-confirm-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .biztrack-guide-confirm-content {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .biztrack-guide-confirm-content h3 {
      margin: 0 0 12px;
      color: #1976d2;
      font-size: 20px;
    }

    .biztrack-guide-confirm-content p {
      margin: 0 0 24px;
      color: #424242;
      line-height: 1.5;
    }

    .biztrack-guide-confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .biztrack-guide-confirm-actions button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .biztrack-guide-confirm-actions button.secondary {
      background: #f5f5f5;
      color: #424242;
    }

    .biztrack-guide-confirm-actions button.secondary:hover {
      background: #e0e0e0;
    }

    .biztrack-guide-confirm-actions button.primary {
      background: #1976d2;
      color: #ffffff;
    }

    .biztrack-guide-confirm-actions button.primary:hover {
      background: #1565c0;
    }

    .biztrack-guide-confirm-actions button:focus {
      outline: 2px solid #64b5f6;
      outline-offset: 2px;
    }
    .biztrack-guide-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      padding: 20px;
    }
    .biztrack-guide-overlay.hidden {
      display: none;
    }
    .biztrack-guide-panel {
      width: min(760px, 100%);
      max-height: calc(100% - 40px);
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }
    .biztrack-guide-header {
      padding: 24px 24px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .biztrack-guide-title {
      font-size: 1.4rem;
      margin: 0;
    }
    .biztrack-guide-close {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: #333;
    }
    .biztrack-guide-body {
      padding: 0 24px 24px;
      overflow-y: auto;
    }
    .biztrack-guide-step {
      margin-top: 16px;
      padding: 18px;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      background: #fafafa;
    }
    .biztrack-guide-step h3 {
      margin: 0 0 10px;
      font-size: 1.1rem;
    }
    .biztrack-guide-controls {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 0 24px 24px;
    }
    .biztrack-guide-controls button {
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 600;
    }
    .biztrack-guide-controls .secondary {
      background: #f2f2f2;
      color: #333;
    }
    .biztrack-guide-controls .primary {
      background: #1e88e5;
      color: #fff;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'biztrack-guide-overlay';
  overlay.className = 'biztrack-guide-overlay hidden';
  overlay.setAttribute('tabindex', '-1');
  overlay.innerHTML = `
    <div class="biztrack-guide-panel" role="dialog" aria-modal="true" aria-labelledby="biztrack-guide-title">
      <div class="biztrack-guide-header">
        <h2 id="biztrack-guide-title" class="biztrack-guide-title"></h2>
        <button id="biztrack-guide-close" class="biztrack-guide-close" type="button" tabindex="0">${escapeHTML(window.t('guide.close'))}</button>
      </div>
      <div class="biztrack-guide-body">
        <p id="biztrack-guide-intro"></p>
        <div id="biztrack-guide-step" class="biztrack-guide-step" aria-live="polite"></div>
      </div>
      <div class="biztrack-guide-controls">
        <button id="biztrack-guide-prev" type="button" class="secondary" tabindex="0"></button>
        <button id="biztrack-guide-next" type="button" class="primary" tabindex="0"></button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) {
      window.closeUserGuide();
    } else {
      // 点击卡片内容时，确保焦点设置到某个可聚焦元素
      const panel = overlay.querySelector('.biztrack-guide-panel');
      if (panel && panel.contains(event.target)) {
        const focusableElements = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const closeButton = document.getElementById('biztrack-guide-close');
        const prevBtn = document.getElementById('biztrack-guide-prev');
        const nextBtn = document.getElementById('biztrack-guide-next');

        // 优先设置焦点到下一步按钮（如果存在且可见）
        if (nextBtn && nextBtn.style.display !== 'none') {
          nextBtn.focus();
        } else if (prevBtn && prevBtn.style.display !== 'none') {
          prevBtn.focus();
        } else if (closeButton) {
          closeButton.focus();
        } else if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }
  });

  // 添加键盘事件监听器
  overlay.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      window.closeUserGuide();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      // 如果当前焦点在关闭按钮上，按左右方向键时自动移开焦点
      const closeButton = document.getElementById('biztrack-guide-close');
      if (document.activeElement === closeButton) {
        const focusableElements = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const closeIndex = Array.from(focusableElements).indexOf(closeButton);

        if (event.key === 'ArrowLeft') {
          // 左键：移到前一个可聚焦元素（如果存在）
          if (closeIndex > 0) {
            focusableElements[closeIndex - 1].focus();
          } else {
            // 如果关闭按钮是第一个，移到最后一个
            focusableElements[focusableElements.length - 1].focus();
          }
        } else {
          // 右键：移到后一个可聚焦元素
          if (closeIndex < focusableElements.length - 1) {
            focusableElements[closeIndex + 1].focus();
          } else {
            // 如果关闭按钮是最后一个，移到第一个
            focusableElements[0].focus();
          }
        }
        event.preventDefault();
      } else {
        // 如果焦点不在关闭按钮上，正常处理左右方向键
        if (event.key === 'ArrowLeft') {
          window.prevGuideStep();
        } else {
          window.nextGuideStep();
        }
        event.preventDefault();
      }
    } else if (event.key === 'Tab') {
      // 焦点陷阱：确保 Tab 键只能在引导卡片内部循环
      const focusableElements = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          event.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          event.preventDefault();
        }
      }
    }
  });

  document.getElementById('biztrack-guide-close').addEventListener('click', window.closeUserGuide);
  document.getElementById('biztrack-guide-prev').addEventListener('click', window.prevGuideStep);
  document.getElementById('biztrack-guide-next').addEventListener('click', window.nextGuideStep);
}

function updateGuideContent(pageData) {
  const overlay = document.getElementById('biztrack-guide-overlay');
  if (!overlay) return;

  const title = overlay.querySelector('#biztrack-guide-title');
  const intro = overlay.querySelector('#biztrack-guide-intro');
  const stepContainer = overlay.querySelector('#biztrack-guide-step');
  const prevBtn = overlay.querySelector('#biztrack-guide-prev');
  const nextBtn = overlay.querySelector('#biztrack-guide-next');

  title.textContent = pageData.title;
  intro.textContent = pageData.intro;

  // 更新关闭按钮的文本
  const closeButton = document.getElementById('biztrack-guide-close');
  if (closeButton) {
    closeButton.textContent = window.t('guide.close');
  }

  const step = pageData.steps[window.userGuideState.stepIndex] || {};
  stepContainer.innerHTML = `
    <h3>${escapeHTML(step.title || window.t('guide.stepTitle', { step: window.userGuideState.stepIndex + 1 }))}</h3>
    <p>${escapeHTML(step.text || '')}</p>
    <p><small>${escapeHTML(window.t('guide.stepOf', { current: window.userGuideState.stepIndex + 1, total: pageData.steps.length }))}</small></p>
  `;

  prevBtn.textContent = window.t('guide.previous');
  nextBtn.textContent = window.userGuideState.stepIndex < pageData.steps.length - 1 ? window.t('guide.next') : window.t('guide.done');

  // 第一页时隐藏上一步按钮
  if (window.userGuideState.stepIndex === 0) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
  }

  overlay.classList.remove('hidden');
}

function refreshGuideText() {
  // 更新引导卡片的文本
  if (!window.userGuideState.visible) return;
  const pageData = getGuidePageData(window.userGuideState.pageKey);
  updateGuideContent(pageData);
}

window.initI18n = function () {
  window.changeLanguage(currentLanguage);
};

/**
 * 全局翻译函数
 * @param {string} key - 翻译键值
 * @param {object} params - 参数字对象
 * @param {boolean} allowHTML - 是否允许渲染HTML标签 (默认false，安全)
 */
window.t = function (key, params = {}, allowHTML = false) {
  let text = key.split('.').reduce((obj, k) => obj?.[k], translations[currentLanguage]);
  text = text || key;
  text = replaceParams(text, params);

  return allowHTML ? text : text;
};

window.tHTML = function (key, params = {}) {
  return escapeHTML(window.t(key, params));
};

// 产品名称翻译（兼容products.js）
window.translateProductName = function (name) {
  if (!name) return name;
  const map = translations[currentLanguage]?.productNames;
  if (!map) return name;
  return map[name] || name;
};

// 产品描述翻译
window.translateProductDescription = function (description) {
  return window.t(`product.desc.${description}`) || description;
};

// 产品分类翻译
window.translateProductCategory = function (category) {
  return window.t(`product.category.${category}`) || category;
};

// 语言切换
window.changeLanguage = function (lang) {
  if (!translations[lang]) {
    return;
  }
  currentLanguage = lang;
  localStorage.setItem('bizTrackLanguage', lang);
  // 设置正确的语言代码
  if (lang === 'zh') {
    document.documentElement.lang = 'zh-CN';
  } else if (lang === 'zhTW') {
    document.documentElement.lang = 'zh-TW';
  } else {
    document.documentElement.lang = 'en';
  }

  // 更新语言选择器的值
  const sel = document.getElementById('languageSelector');
  if (sel) sel.value = lang;

  updatePageTranslations();
  window.dispatchEvent(new CustomEvent('languageChanged'));
};

// 更新页面翻译
function updatePageTranslations() {
  // 1. 处理普通纯文本 (data-i18n)
  document.querySelectorAll('[data-i18n]:not(option):not(optgroup):not([data-guide-button])').forEach(el => {
    el.textContent = window.t(el.dataset.i18n);
  });

  // 2. 处理含 HTML 的文本 (data-i18n-html)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = window.t(el.dataset.i18nHtml, {}, true);
  });

  // 3. 处理 Placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = window.t(el.dataset.i18nPlaceholder);
  });

  // 4. 处理 title / alt / aria-label / value
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = window.t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    el.alt = window.t(el.dataset.i18nAlt);
  });
  document.querySelectorAll('[data-i18n-aria-label]:not([data-guide-button])').forEach(el => {
    el.setAttribute('aria-label', window.t(el.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    el.value = window.t(el.dataset.i18nValue);
  });

  // 5. 处理下拉框选项
  document.querySelectorAll('select option[data-i18n]').forEach(option => {
    option.textContent = window.t(option.dataset.i18n);
  });
  document.querySelectorAll('select optgroup[data-i18n]').forEach(opt => {
    opt.label = window.t(opt.dataset.i18n);
  });
}

// ==========================================
// 隐私合规与 Cookie 横幅 （勿删）
// ==========================================
// ==========================================
// 隐私合规与 Cookie 横幅 （已修复，无重复、无报错）
// ==========================================
function initCookieBanner() {
  if (localStorage.getItem('bizTrack_cookieChoice')) {
    return; // 已有选择，不显示
  }

  // 保存之前聚焦的元素
  const previousActiveElement = document.activeElement;

  const banner = document.createElement('div');
  banner.id = 'cookie-compliance-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'true');
  banner.setAttribute('aria-label', 'Cookie Consent');
  banner.setAttribute('tabindex', '-1');

  // 样式
  banner.style.cssText = `
    position: fixed; bottom: 0; left: 0; width: 100%;
    background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%); color: white;
    padding: 25px 30px; display: flex; flex-direction: row; justify-content: space-between;
    align-items: center; flex-wrap: wrap; gap: 18px; z-index: 10001;
    box-shadow: 0 -8px 25px rgba(0,0,0,0.3);
    font-family: 'Lato', sans-serif; font-size: 16px; font-weight: 500; box-sizing: border-box;
    border-top: 4px solid #0d47a1;
  `;

  // 翻译文本
  const msg = window.t('privacy.cookieMessage') || 'We use cookies to ensure the core functionality of BizTrack.';
  const policy = window.t('privacy.policyLink') || 'Privacy Policy';
  const rejectAll = window.t('privacy.rejectAll') || 'Reject All';
  const necessary = window.t('privacy.necessaryOnly') || 'Necessary Only';
  const acceptAll = window.t('privacy.acceptAll') || 'Accept All';

  banner.innerHTML = `
    <div style="flex-grow: 1; text-align: left; min-width: 250px;">
      <span data-i18n="privacy.cookieMessage">${escapeHTML(msg)}</span>
      <button id="privacy-policy-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; text-decoration: underline; margin-left: 5px; font-weight: bold; padding: 4px 8px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" data-i18n="privacy.policyLink">${escapeHTML(policy)}</button>
    </div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <button id="reject-all-btn" style="background-color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; white-space: nowrap; font-weight: 500; transition: all 0.2s;" data-i18n="privacy.rejectAll">${escapeHTML(rejectAll)}</button>
      <button id="necessary-only-btn" style="background-color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; white-space: nowrap; font-weight: 500; transition: all 0.2s;" data-i18n="privacy.necessaryOnly">${escapeHTML(necessary)}</button>
      <button id="accept-all-btn" style="background-color: white; color: #1976d2; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.2s;" data-i18n="privacy.acceptAll">${escapeHTML(acceptAll)}</button>
    </div>
  `;
  document.body.appendChild(banner);
  document.body.classList.add('cookie-banner-open');

  // 确保背景元素始终保持inert状态
  const enforceInertState = () => {
    // 获取body的所有直接子元素，排除cookie横幅和隐私政策弹窗
    const bodyChildren = Array.from(document.body.children);
    bodyChildren.forEach(el => {
      if (el.id !== 'cookie-compliance-banner' && el.id !== 'privacy-modal') {
        el.inert = true;
        // 确保所有子元素也设置为inert
        const childElements = el.querySelectorAll('*');
        childElements.forEach(child => {
          child.inert = true;
        });
      }
    });
    
    // 确保cookie横幅和隐私政策弹窗不会被设置为inert
    const bannerElement = document.getElementById('cookie-compliance-banner');
    if (bannerElement) {
      bannerElement.inert = false;
    }
    const modalElement = document.getElementById('privacy-modal');
    if (modalElement) {
      modalElement.inert = false;
    }
  };

  // 初始设置inert状态
  enforceInertState();

  // 定期检查并强制设置inert状态
  const inertInterval = setInterval(enforceInertState, 100);

  // 获取可聚焦元素
  const getFocusableElements = () => {
    const elements = banner.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    // 过滤掉被设置为inert的元素
    return Array.from(elements).filter(el => !el.inert);
  };

  // 关闭
  const closeBanner = () => {
    // 停止定期检查
    clearInterval(inertInterval);

    banner.style.display = 'none';
    document.body.classList.remove('cookie-banner-open');

    // 清除inert状态
    const allElements = document.querySelectorAll('[inert]');
    allElements.forEach(el => {
      el.inert = false;
    });

    previousActiveElement?.focus();
  };

  // 按钮事件
  document.getElementById('privacy-policy-btn').addEventListener('click', () => {
    window.showPrivacyModal?.();
  });
  document.getElementById('reject-all-btn').addEventListener('click', () => {
    localStorage.setItem('bizTrack_cookieChoice', 'rejected_all');
    closeBanner();
  });
  document.getElementById('necessary-only-btn').addEventListener('click', () => {
    localStorage.setItem('bizTrack_cookieChoice', 'necessary_only');
    closeBanner();
  });
  document.getElementById('accept-all-btn').addEventListener('click', () => {
    localStorage.setItem('bizTrack_cookieChoice', 'accepted_all');
    closeBanner();
  });

  // 键盘支持（不允许使用ESC关闭，必须强制用户做出选择）
  banner.addEventListener('keydown', (e) => {
    const focusableElements = getFocusableElements();
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    }
  });

  // 自动聚焦
  getFocusableElements()[0]?.focus();
}
  
    

// 立即初始化
document.addEventListener('DOMContentLoaded', () => {
  window.changeLanguage(currentLanguage);
  const sel = document.getElementById('languageSelector');
  if (sel) sel.value = currentLanguage;
  sel?.addEventListener('change', e => window.changeLanguage(e.target.value));
  window.addEventListener('languageChanged', refreshGuideText);
  
  // 【新增】在页面加载完成后调用横幅渲染函数
  initCookieBanner();
});
