(function () {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./sw.js')
        .then(function (reg) {
            console.log('[App] SW registered');
            reg.addEventListener('updatefound', function () {
                var newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', function () {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner();
                    }
                });
            });
        })
        .catch(function (err) {
            console.error('[App] SW registration failed:', err);
        });

    navigator.serviceWorker.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('[App] SW updated to version:', event.data.version);
        }
    });

    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });

    function showUpdateBanner() {
        if (document.getElementById('swUpdateBanner')) return;

        var banner = document.createElement('div');
        banner.id = 'swUpdateBanner';
        banner.className = 'sw-update-banner';
        banner.setAttribute('role', 'alert');

        var textSpan = document.createElement('span');
        textSpan.textContent = 'يتوفر تحديث جديد للتطبيق';

        var btn = document.createElement('button');
        btn.className = 'sw-update-btn';
        btn.textContent = 'تحديث الآن';
        btn.addEventListener('click', function () {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(function (reg) {
                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            }
            banner.remove();
        });

        var dismissBtn = document.createElement('button');
        dismissBtn.className = 'sw-dismiss-btn';
        dismissBtn.setAttribute('aria-label', 'إغلاق');
        dismissBtn.textContent = '✕';
        dismissBtn.addEventListener('click', function () {
            banner.remove();
        });

        banner.appendChild(textSpan);
        banner.appendChild(btn);
        banner.appendChild(dismissBtn);
        document.body.prepend(banner);
    }
})();
