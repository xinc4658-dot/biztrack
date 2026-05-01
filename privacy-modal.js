// 隐私政策弹窗功能
window.showPrivacyModal = function() {
    // 如果已经存在弹窗，先移除
    const existingModal = document.getElementById('privacy-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 保存之前聚焦的元素
    const previousActiveElement = document.activeElement;

    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'privacy-modal';
    modal.className = 'privacy-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'privacy-modal-title');

    // 获取翻译文本
    const title = window.t('privacy.pageTitle') || 'Privacy Policy';
    const closeBtn = window.t('privacy.close') || 'Close';
    const whatWeCollect = window.t('privacy.whatWeCollect') || '1. What we collect';
    const whatWeCollectDesc = window.t('privacy.whatWeCollectDesc') || 'We collect product details, order history, and expense records that you manually input into the application.';
    const howWeUseIt = window.t('privacy.howWeUseIt') || '2. How we use it';
    const howWeUseItDesc = window.t('privacy.howWeUseItDesc') || 'Your data is strictly used to power the Dashboard analytics, generate tables, and provide you with business tracking functionalities.';
    const cookieChoices = window.t('privacy.cookieChoices') || '3. Cookie choices';
    const cookieChoicesDesc = window.t('privacy.cookieChoicesDesc') || 'We only use Local Storage to save your language preference and temporary session data. No tracking cookies are used.';
    const thirdParties = window.t('privacy.thirdParties') || '4. Third parties';
    const thirdPartiesDesc = window.t('privacy.thirdPartiesDesc') || 'Your data is stored securely via Google Firebase. We do not sell or share your data with any advertising agencies.';
    const contact = window.t('privacy.contact') || '5. Contact';
    const contactDesc = window.t('privacy.contactDesc') || 'If you have any questions, please contact us via the Help page.';

    modal.innerHTML = `
        <div class="privacy-modal-content">
            <div class="privacy-modal-header">
                <h2 id="privacy-modal-title">${title}</h2>
                <button id="privacy-modal-close" type="button" aria-label="${closeBtn}">${closeBtn}</button>
            </div>
            <div class="privacy-modal-body">
                <article>
                    <h3>${whatWeCollect}</h3>
                    <p>${whatWeCollectDesc}</p>
                </article>
                <article>
                    <h3>${howWeUseIt}</h3>
                    <p>${howWeUseItDesc}</p>
                </article>
                <article>
                    <h3>${cookieChoices}</h3>
                    <p>${cookieChoicesDesc}</p>
                </article>
                <article>
                    <h3>${thirdParties}</h3>
                    <p>${thirdPartiesDesc}</p>
                </article>
                <article>
                    <h3>${contact}</h3>
                    <p>${contactDesc}</p>
                </article>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 获取弹窗内的可聚焦元素
    const getFocusableElements = () => {
        return modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
    };

    // 添加事件监听器
    const closeButton = document.getElementById('privacy-modal-close');
    const closeModal = () => {
        modal.remove();
        if (previousActiveElement) {
            previousActiveElement.focus();
        }
    };

    closeButton.addEventListener('click', closeModal);

    // 点击弹窗外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 键盘支持
    modal.addEventListener('keydown', (e) => {
        const focusableElements = getFocusableElements();
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.key === 'Escape') {
            closeModal();
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

    // 聚焦到关闭按钮
    setTimeout(() => {
        closeButton.focus();
    }, 100);
};
