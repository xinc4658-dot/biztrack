// 改进的 Cookie 弹窗功能
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function (tag) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[tag] || tag;
    });
}

function initCookieBanner() {
    if (localStorage.getItem('bizTrack_cookieChoice')) {
        return;
    }

    // 保存之前聚焦的元素
    const previousActiveElement = document.activeElement;

    const banner = document.createElement('div');
    banner.id = 'cookie-compliance-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Cookie Consent');

    // 样式调整
    banner.style.cssText = `
        position: fixed; bottom: 0; left: 0; width: 100%;
        background-color: #f8f9fa; color: #333;
        padding: 15px 20px; display: flex; flex-direction: row; justify-content: space-between;
        align-items: center; flex-wrap: wrap; gap: 15px; z-index: 10001;
        box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
        font-family: 'Lato', sans-serif; font-size: 14px; box-sizing: border-box;
    `;

    // 安全获取翻译文本
    const msg = window.t('privacy.cookieMessage') || 'We use cookies to ensure the core functionality of BizTrack.';
    const policy = window.t('privacy.policyLink') || 'Privacy Policy';
    const rejectAll = window.t('privacy.rejectAll') || 'Reject All';
    const necessary = window.t('privacy.necessaryOnly') || 'Necessary Only';
    const acceptAll = window.t('privacy.acceptAll') || 'Accept All';
    const close = window.t('privacy.close') || 'Close';

    banner.innerHTML = `
        <div style="flex-grow: 1; text-align: left; min-width: 250px;">
            <span data-i18n="privacy.cookieMessage">${escapeHTML(msg)}</span>
            <button id="privacy-policy-btn" style="background: none; border: none; color: #247BA0; text-decoration: underline; margin-left: 5px; font-weight: bold; padding: 0; cursor: pointer;" data-i18n="privacy.policyLink">${escapeHTML(policy)}</button>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="reject-all-btn" style="background-color: transparent; border: 1px solid #dc3545; color: #dc3545; padding: 6px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap;" data-i18n="privacy.rejectAll">${escapeHTML(rejectAll)}</button>
            <button id="necessary-only-btn" style="background-color: transparent; border: 1px solid #6c757d; color: #6c757d; padding: 6px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap;" data-i18n="privacy.necessaryOnly">${escapeHTML(necessary)}</button>
            <button id="accept-all-btn" style="background-color: #249672; color: white; border: none; padding: 7px 18px; border-radius: 4px; cursor: pointer; font-weight: bold; white-space: nowrap;" data-i18n="privacy.acceptAll">${escapeHTML(acceptAll)}</button>
            <button id="close-banner-btn" style="background-color: transparent; border: 1px solid #6c757d; color: #6c757d; padding: 6px 14px; border-radius: 4px; cursor: pointer; white-space: nowrap;" data-i18n="privacy.close" aria-label="${escapeHTML(close)}">${escapeHTML(close)}</button>
        </div>
    `;

    document.body.appendChild(banner);

    // 添加背景不可选中的样式
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

    // 获取弹窗内的可聚焦元素
    const getFocusableElements = () => {
        const elements = banner.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        // 过滤掉被设置为inert的元素
        return Array.from(elements).filter(el => !el.inert);
    };

    // 关闭弹窗的函数
    const closeBanner = () => {
        banner.style.display = 'none';
        document.body.classList.remove('cookie-banner-open');
        
        // 清除inert状态
        const allElements = document.querySelectorAll('[inert]');
        allElements.forEach(el => {
            el.inert = false;
        });
        
        // 停止定期检查
        clearInterval(inertInterval);
        
        if (previousActiveElement) {
            previousActiveElement.focus();
        }
    };

    // 添加隐私政策按钮点击事件
    document.getElementById('privacy-policy-btn').addEventListener('click', () => {
        if (typeof window.showPrivacyModal === 'function') {
            window.showPrivacyModal();
        }
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

    document.getElementById('close-banner-btn').addEventListener('click', () => {
        // 关闭弹窗时默认选择"仅必要"选项
        localStorage.setItem('bizTrack_cookieChoice', 'necessary_only');
        closeBanner();
    });

    // 键盘支持
    banner.addEventListener('keydown', (e) => {
        const focusableElements = getFocusableElements();
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.key === 'Escape') {
            // ESC键关闭时默认选择"仅必要"选项
            localStorage.setItem('bizTrack_cookieChoice', 'necessary_only');
            closeBanner();
        } else if (e.key === 'Enter' || e.key === ' ') {
            // 当焦点在按钮上时，按下 Enter 或 Space 键触发按钮点击事件
            if (document.activeElement.tagName === 'BUTTON') {
                e.preventDefault();
                document.activeElement.click();
            }
        } else if (e.key === 'Tab') {
            // 焦点陷阱：确保 Tab 键只能在弹窗内部循环
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

    // 聚焦到第一个按钮
    const firstButton = getFocusableElements()[0];
    if (firstButton) {
        firstButton.focus();
    }
}

// 覆盖原有的 initCookieBanner 函数
window.initCookieBanner = initCookieBanner;

// 立即初始化
document.addEventListener('DOMContentLoaded', () => {
    initCookieBanner();
});
