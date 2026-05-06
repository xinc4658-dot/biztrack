// auth.js — BizTrack authentication guard
// Guests can browse (read-only). Logged-in users can edit.

(function () {
    const WRITE_SELECTORS = [
        '.edit-icon', '.delete-icon',
        '.add-button', '.download-button',
        '.open-form-btn',
        '#transaction-form', '#order-form', '#product-form',
        '.export-btn'
    ];

    function setWriteControlsVisible(visible) {
        document.querySelectorAll(WRITE_SELECTORS.join(',')).forEach((el) => {
            el.style.display = visible ? '' : 'none';
        });
    }

    function startGuestObserver() {
        if (window._guestObserver) return;
        window._guestObserver = new MutationObserver(function () {
            document.querySelectorAll('.edit-icon, .delete-icon').forEach((el) => {
                el.style.display = 'none';
            });
        });
        window._guestObserver.observe(document.body, { childList: true, subtree: true });
    }

    function stopGuestObserver() {
        if (window._guestObserver) {
            window._guestObserver.disconnect();
            window._guestObserver = null;
        }
    }

    function ensureGuestNotice() {
        if (document.getElementById('guest-notice')) return;
        const notice = document.createElement('div');
        notice.id = 'guest-notice';
        notice.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;
            background: #fff3cd; color: #856404; border-bottom: 1px solid #ffc107;
            padding: 10px 20px; font-size: 13px; text-align: center;
            font-family: 'Lato', sans-serif;
        `;
        notice.innerHTML = `
            You are viewing in <strong>read-only mode</strong>.
            <a href="./login.html" style="color:#856404;font-weight:bold;margin-left:8px;">Sign in</a>
            to make changes.
        `;
        document.body.prepend(notice);
    }

    function removeGuestNotice() {
        const notice = document.getElementById('guest-notice');
        if (notice) notice.remove();
    }

    function attachGuestSubmitGuard() {
        if (window._guestFormHandler) return;
        window._guestFormHandler = function (e) {
            if (document.body.classList.contains('auth-guest')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert('Please sign in to make changes.');
            }
        };
        document.querySelectorAll('form').forEach((form) => {
            form.addEventListener('submit', window._guestFormHandler, true);
        });
    }

    function applyGuestState() {
        document.body.classList.add('auth-guest');
        document.body.classList.remove('auth-logged-in');

        document.querySelectorAll('.auth-logout-btn').forEach((el) => (el.style.display = 'none'));
        document.querySelectorAll('.auth-login-btn').forEach((el) => (el.style.display = 'inline-block'));

        setWriteControlsVisible(false);
        startGuestObserver();
        attachGuestSubmitGuard();
        ensureGuestNotice();
    }

    function applyLoggedInState(user) {
        document.body.classList.add('auth-logged-in');
        document.body.classList.remove('auth-guest');

        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = user.email || '';

        document.querySelectorAll('.auth-login-btn').forEach((el) => (el.style.display = 'none'));
        document.querySelectorAll('.auth-logout-btn').forEach((el) => (el.style.display = 'inline-block'));

        setWriteControlsVisible(true);
        stopGuestObserver();
        removeGuestNotice();
    }

    // Initial state: hide write controls silently to avoid guest-banner flash for logged-in users.
    setWriteControlsVisible(false);
    document.querySelectorAll('.auth-login-btn, .auth-logout-btn').forEach((el) => {
        el.style.display = 'none';
    });

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            applyLoggedInState(user);
        } else {
            applyGuestState();
        }
    });

    window.biztrackLogout = function () {
        firebase.auth().signOut().then(function () {
            window.location.reload();
        });
    };
})();
