function formatNumber(num) {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function escapeJs(text) {
    if (!text) return '';
    return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function truncate(text, length) {
    if (!text) return '';
    text = String(text);
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatDate(date) {
    if (!date) return '-';
    try {
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return String(date);
    }
}

function formatDateTime(date) {
    if (!date) return '-';
    try {
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return String(date);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function cleanPhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).trim();
    if (cleaned.startsWith('+')) {
        cleaned = '+' + cleaned.slice(1).replace(/[^\d]/g, '');
    } else {
        cleaned = cleaned.replace(/[^\d]/g, '');
    }
    return cleaned;
}

const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];

function sanitizeUrl(url) {
    if (!url) return '';
    const str = String(url).trim();
    if (str === '') return '';
    if (str.startsWith('/') || str.startsWith('./') || str.startsWith('../') || str.startsWith('#')) {
        return escapeHtml(str);
    }
    try {
        const parsed = new URL(str);
        if (SAFE_URL_PROTOCOLS.includes(parsed.protocol)) {
            return escapeHtml(str);
        }
    } catch {
        if (/^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}/.test(str)) {
            return escapeHtml('https://' + str);
        }
    }
    return '';
}

function sanitizeTel(phone) {
    if (!phone) return '';
    const cleaned = String(phone).replace(/[^\d+*#]/g, '');
    if (cleaned.length < 3) return '';
    return 'tel:' + cleaned;
}

function sanitizeImageUrl(url) {
    if (!url) return '';
    const str = String(url).trim();
    if (str === '') return '';
    try {
        const parsed = new URL(str);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return escapeHtml(str);
        }
    } catch {
    }
    return '';
}

/**
 * Build the best possible Google Maps URL from a record's data.
 * Priority: Place ID from Listing URL → raw Listing URL → Listing CID → Lat/Long → null.
 * Returns a raw URL string (not HTML-escaped) safe for use with element.href.
 *
 * @param {Object} record - A data record
 * @returns {string|null} - A Google Maps URL or null
 */
function buildGoogleMapsUrl(record) {
    if (!record || typeof record !== 'object') return null;

    var listingUrl = record['Listing URL'] ? String(record['Listing URL']).trim() : '';
    var name = record.Name ? String(record.Name).trim() : '';
    var lat = parseFloat(record.Lat);
    var lng = parseFloat(record.Long);
    var hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    var cid = record['Listing CID'] ? String(record['Listing CID']).trim() : '';

    var slug = '';
    if (name) {
        slug = name.replace(/[,،]/g, ',');
        slug = encodeURIComponent(slug)
            .replace(/%20/g, '+')
            .replace(/%2C/g, ',')
            .replace(/%2B/g, '+');
    }

    var coordStr = '';
    if (hasCoords) {
        var latStr = _trimCoord(lat);
        var lngStr = _trimCoord(lng);
        coordStr = latStr + ',' + lngStr;
    }

    if (listingUrl) {
        var placeIdMatch = listingUrl.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);

        if (placeIdMatch) {
            var placeId = placeIdMatch[1];

            var gMatch = listingUrl.match(/!16s(\/g\/[A-Za-z0-9_-]+)/);
            var gId = gMatch ? gMatch[1] : '';

            var url = 'https://www.google.com/maps/place/' + slug + '/';

            if (hasCoords) {
                url += '@' + coordStr + ',17z'
                    + '/data='
                    + '!4m6!3m5'
                    + '!1s' + placeId
                    + '!8m2!3d' + _trimCoord(lat) + '!4d' + _trimCoord(lng);

                if (gId) {
                    url += '!16s' + encodeURIComponent(gId);
                }
            } else {
                url += 'data=!4m6!3m5!1s' + placeId;
                if (gId) {
                    url += '!16s' + encodeURIComponent(gId);
                }
            }

            return url;
        }

        if (/^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i.test(listingUrl)) {
            return listingUrl;
        }
    }

    if (cid && /^\d+$/.test(cid)) {
        if (hasCoords && slug) {
            return 'https://www.google.com/maps/place/' + slug + '/@' + coordStr + ',17z?cid=' + cid;
        }
        return 'https://www.google.com/maps?cid=' + cid;
    }

    if (hasCoords) {
        if (slug) {
            return 'https://www.google.com/maps/place/' + slug + '/@' + coordStr + ',17z';
        }
        return 'https://www.google.com/maps?q=' + coordStr;
    }

    return null;
}

/**
 * Trim trailing zeros from a coordinate number, keeping up to 7 decimal places.
 * @param {number} coord
 * @returns {string}
 */
function _trimCoord(coord) {
    var fixed = coord.toFixed(7);
    fixed = fixed.replace(/0+$/, '');
    fixed = fixed.replace(/\.$/, '');
    return fixed;
}

function buildInsightText(template, values) {
    const parts = template.split(/(\{\d+\})/g);
    return parts.map(part => {
        const match = part.match(/^\{(\d+)\}$/);
        if (match) {
            const index = parseInt(match[1]);
            const value = values[index] !== undefined ? values[index] : '';
            return '<strong>' + escapeHtml(String(value)) + '</strong>';
        }
        return escapeHtml(part);
    }).join('');
}

function escapeAttr(value) {
    if (!value) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildSafeLink(url, text, options = {}) {
    const safeUrl = sanitizeUrl(url);
    const safeText = escapeHtml(text || url || '');
    if (!safeUrl) {
        return safeText;
    }
    const cls = options.className ? ` class="${escapeAttr(options.className)}"` : '';
    const target = options.target ? ` target="${escapeAttr(options.target)}" rel="noopener noreferrer"` : '';
    const aria = options.ariaLabel ? ` aria-label="${escapeAttr(options.ariaLabel)}"` : '';
    const icon = options.icon ? `<i class="bi bi-${escapeAttr(options.icon)} ms-1" aria-hidden="true"></i>` : '';
    return `<a href="${safeUrl}"${cls}${target}${aria}>${icon}${safeText}</a>`;
}

function buildPhoneLink(phone, options = {}) {
    if (!phone) return '-';
    const safeTel = sanitizeTel(phone);
    const display = escapeHtml(phone);
    if (!safeTel) {
        return display;
    }
    const cls = options.className ? ` class="${escapeAttr(options.className)}"` : '';
    const aria = options.ariaLabel ? ` aria-label="${escapeAttr(options.ariaLabel)}"` : '';
    const icon = options.icon !== false ? '<i class="bi bi-telephone ms-1" aria-hidden="true"></i>' : '';
    return `<a href="${safeTel}"${cls}${aria}>${icon}${display}</a>`;
}

function buildSafeImage(url, alt, options = {}) {
    const safeUrl = sanitizeImageUrl(url);
    if (!safeUrl) return '';
    const cls = options.className ? ` class="${escapeAttr(options.className)}"` : '';
    const loading = options.loading || 'lazy';
    const safeAlt = escapeAttr(alt || '');
    return `<img src="${safeUrl}"${cls} alt="${safeAlt}" loading="${loading}" onerror="this.parentElement.style.display='none'">`;
}

function generateStars(rating) {
    const r = parseFloat(rating) || 0;
    const full = Math.floor(r);
    const half = r % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '<i class="bi bi-star-fill"></i>'.repeat(full) +
        (half ? '<i class="bi bi-star-half"></i>' : '') +
        '<i class="bi bi-star"></i>'.repeat(Math.max(0, empty));
}

function getScoreClass(score) {
    const s = parseFloat(score) || 0;
    if (s >= 4) return 'positive';
    if (s >= 2.5) return 'neutral';
    return 'negative';
}

function showLoading(show, message) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    if (show) {
        overlay.classList.remove('d-none');
        const textEl = document.getElementById('loadingText');
        if (textEl && message) textEl.textContent = message;
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) progressContainer.classList.add('d-none');
    } else {
        overlay.classList.add('d-none');
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) progressContainer.classList.add('d-none');
        const progressFill = document.getElementById('progressFill');
        if (progressFill) progressFill.style.width = '0%';
    }
}

function updateProgress(current, total, label) {
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (!progressContainer || !progressFill) return;
    progressContainer.classList.remove('d-none');
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    progressFill.style.width = percentage + '%';
    if (progressText) {
        progressText.textContent = label || (percentage + '%');
    }
}

const _toastHistory = new Map();
const TOAST_DEDUPE_MS = 2000;
const TOAST_MAX_VISIBLE = 3;
const TOAST_AUTO_DISMISS = 5000;

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    var dedupeKey = type + '|' + message;
    var now = Date.now();
    var lastShown = _toastHistory.get(dedupeKey);

    if (lastShown && (now - lastShown) < TOAST_DEDUPE_MS) {
        return;
    }
    _toastHistory.set(dedupeKey, now);

    if (_toastHistory.size > 50) {
        var keysToDelete = [];
        _toastHistory.forEach(function (timestamp, key) {
            if (now - timestamp > TOAST_DEDUPE_MS * 5) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(function (key) {
            _toastHistory.delete(key);
        });
    }

    var existingToasts = container.querySelectorAll('.toast');
    if (existingToasts.length >= TOAST_MAX_VISIBLE) {
        existingToasts[0].remove();
    }

    const id = 'toast-' + now;
    const icons = {
        success: 'check-circle-fill',
        danger: 'exclamation-triangle-fill',
        warning: 'exclamation-circle-fill',
        info: 'info-circle-fill'
    };

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    const header = document.createElement('div');
    header.className = 'toast-header bg-' + type + ' text-white';

    const icon = document.createElement('i');
    icon.className = 'bi bi-' + (icons[type] || icons.info) + ' ms-2';
    icon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('strong');
    title.className = 'me-auto';
    title.textContent = 'إشعار';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close btn-close-white order-first';
    closeBtn.setAttribute('aria-label', 'إغلاق');
    closeBtn.addEventListener('click', function () { toast.remove(); });

    header.appendChild(closeBtn);
    header.appendChild(icon);
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'toast-body';
    body.textContent = message;

    toast.appendChild(header);
    toast.appendChild(body);

    container.appendChild(toast);

    setTimeout(function () {
        var el = document.getElementById(id);
        if (el) el.remove();
    }, TOAST_AUTO_DISMISS);
}

function announce(message) {
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'sr-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.className = 'visually-hidden';
        document.body.appendChild(announcer);
    }
    announcer.textContent = message;
    setTimeout(() => { announcer.textContent = ''; }, 1000);
}

async function updateNavCount(count) {
    try {
        if (count === undefined) {
            count = await DB.count();
        }
        const el = document.getElementById('navTotalRecords');
        if (el) el.textContent = formatNumber(count);
    } catch (e) {
        console.error('Error updating nav count:', e);
    }
}

function createSafeLink(url, text, options = {}) {
    const safeUrl = sanitizeUrl(url);
    const displayText = text || url || '';
    if (!safeUrl) {
        const span = document.createElement('span');
        span.textContent = displayText;
        return span;
    }
    const a = document.createElement('a');
    a.href = safeUrl;
    a.textContent = displayText;
    if (options.className) a.className = options.className;
    if (options.target) {
        a.target = options.target;
        a.rel = 'noopener noreferrer';
    }
    if (options.ariaLabel) a.setAttribute('aria-label', options.ariaLabel);
    return a;
}

function createPhoneLink(phone, options = {}) {
    if (!phone) {
        const span = document.createElement('span');
        span.textContent = '-';
        return span;
    }
    const safeTel = sanitizeTel(phone);
    const displayText = String(phone);
    if (!safeTel) {
        const span = document.createElement('span');
        span.textContent = displayText;
        return span;
    }
    const a = document.createElement('a');
    a.href = safeTel;
    if (options.className) a.className = options.className;
    if (options.ariaLabel) a.setAttribute('aria-label', options.ariaLabel);
    if (options.showIcon !== false) {
        const icon = document.createElement('i');
        icon.className = 'bi bi-telephone ms-1';
        icon.setAttribute('aria-hidden', 'true');
        a.appendChild(icon);
    }
    a.appendChild(document.createTextNode(displayText));
    return a;
}

function createSafeImage(url, alt, options = {}) {
    const safeUrl = sanitizeImageUrl(url);
    if (!safeUrl) return null;
    const img = document.createElement('img');
    img.src = safeUrl;
    img.alt = alt || '';
    img.loading = options.loading || 'lazy';
    if (options.className) img.className = options.className;
    img.onerror = function () {
        if (this.parentElement) this.parentElement.style.display = 'none';
    };
    return img;
}

function createStarRating(rating) {
    const fragment = document.createDocumentFragment();
    const r = parseFloat(rating) || 0;
    const full = Math.floor(r);
    const half = r % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < full; i++) {
        const star = document.createElement('i');
        star.className = 'bi bi-star-fill';
        fragment.appendChild(star);
    }
    if (half) {
        const star = document.createElement('i');
        star.className = 'bi bi-star-half';
        fragment.appendChild(star);
    }
    for (let i = 0; i < Math.max(0, empty); i++) {
        const star = document.createElement('i');
        star.className = 'bi bi-star';
        fragment.appendChild(star);
    }
    return fragment;
}

function validateBackupData(data) {
    var result = {
        valid: false,
        error: null,
        warnings: [],
        cleanedRecords: [],
        cleanedImports: [],
        stats: { total: 0, valid: 0, skipped: 0, cleaned: 0 }
    };

    if (!data || typeof data !== 'object') {
        result.error = 'الملف لا يحتوي على بيانات صالحة';
        return result;
    }
    if (data.app !== 'DataMap Pro') {
        result.error = 'هذا الملف ليس نسخة احتياطية من DataMap Pro';
        return result;
    }
    if (!data.data || typeof data.data !== 'object') {
        result.error = 'بنية الملف غير صالحة: الحقل data مفقود';
        return result;
    }
    if (!Array.isArray(data.data.records)) {
        result.error = 'بنية الملف غير صالحة: السجلات ليست مصفوفة';
        return result;
    }
    if (data.data.records.length === 0) {
        result.error = 'النسخة الاحتياطية لا تحتوي على أي سجلات';
        return result;
    }

    var supportedVersions = ['1.0'];
    if (data.version && !supportedVersions.includes(data.version)) {
        result.warnings.push(
            'إصدار النسخة (' + String(data.version) + ') قد لا يكون متوافقاً بالكامل'
        );
    }

    if (data.exportDate) {
        var exportTime = new Date(data.exportDate).getTime();
        if (isNaN(exportTime)) {
            result.warnings.push('تاريخ النسخة غير صالح');
        } else if (exportTime > Date.now() + 86400000) {
            result.warnings.push('تاريخ النسخة في المستقبل — تأكد من صحة الملف');
        }
    }

    var REQUIRED_FIELDS = ['Name'];
    var EXPECTED_STRING_FIELDS = [
        'Name', 'Address', 'Phone', 'Category', 'Website',
        'cityExtracted', 'keyword'
    ];
    var DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
    var MAX_FIELD_LENGTH = 10000;

    var records = data.data.records;
    result.stats.total = records.length;

    for (var i = 0; i < records.length; i++) {
        var record = records[i];

        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            result.stats.skipped++;
            continue;
        }

        var hasDangerous = false;
        for (var d = 0; d < DANGEROUS_KEYS.length; d++) {
            if (record.hasOwnProperty(DANGEROUS_KEYS[d])) {
                delete record[DANGEROUS_KEYS[d]];
                hasDangerous = true;
            }
        }
        if (hasDangerous) {
            result.stats.cleaned++;
        }

        delete record.id;

        var hasRequired = true;
        for (var r = 0; r < REQUIRED_FIELDS.length; r++) {
            var fieldVal = record[REQUIRED_FIELDS[r]];
            if (!fieldVal || String(fieldVal).trim() === '') {
                hasRequired = false;
                break;
            }
        }
        if (!hasRequired) {
            result.stats.skipped++;
            continue;
        }

        var cleaned = false;
        var keys = Object.keys(record);
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var val = record[key];

            if (EXPECTED_STRING_FIELDS.indexOf(key) !== -1) {
                if (val !== null && val !== undefined && typeof val !== 'string') {
                    record[key] = String(val);
                    cleaned = true;
                }
            }

            if (typeof record[key] === 'string' && record[key].length > MAX_FIELD_LENGTH) {
                record[key] = record[key].substring(0, MAX_FIELD_LENGTH);
                cleaned = true;
            }
        }

        if (record.Rating !== undefined && record.Rating !== '' && record.Rating !== null) {
            var rating = parseFloat(record.Rating);
            if (isNaN(rating) || rating < 0 || rating > 5) {
                record.Rating = 0;
                cleaned = true;
            } else {
                var numericRating = Math.round(Math.min(5, Math.max(0, rating)) * 10) / 10;
                if (record.Rating !== numericRating) {
                    record.Rating = numericRating;
                    cleaned = true;
                }
            }
        } else {
            record.Rating = 0;
            cleaned = true;
        }

        if (record.Reviews !== undefined && record.Reviews !== '' && record.Reviews !== null) {
            var reviews = parseInt(record.Reviews);
            if (isNaN(reviews) || reviews < 0) {
                record.Reviews = 0;
                cleaned = true;
            } else {
                if (record.Reviews !== reviews) {
                    record.Reviews = reviews;
                    cleaned = true;
                }
            }
        } else {
            record.Reviews = 0;
            cleaned = true;
        }

        if (cleaned) {
            result.stats.cleaned++;
        }

        result.cleanedRecords.push(record);
        result.stats.valid++;
    }

    if (Array.isArray(data.data.imports)) {
        for (var j = 0; j < data.data.imports.length; j++) {
            var imp = data.data.imports[j];
            if (!imp || typeof imp !== 'object' || Array.isArray(imp)) continue;

            for (var di = 0; di < DANGEROUS_KEYS.length; di++) {
                if (imp.hasOwnProperty(DANGEROUS_KEYS[di])) {
                    delete imp[DANGEROUS_KEYS[di]];
                }
            }

            delete imp.id;

            if (imp.date && imp.keyword) {
                result.cleanedImports.push(imp);
            }
        }
    }

    if (result.stats.valid === 0) {
        result.error = 'لا يوجد سجل صالح واحد في النسخة الاحتياطية';
        return result;
    }

    if (result.stats.skipped > 0) {
        result.warnings.push(
            'تم تخطي ' + result.stats.skipped + ' سجل غير صالح من أصل ' + result.stats.total
        );
    }

    if (result.stats.cleaned > 0) {
        result.warnings.push(
            'تم تصحيح بيانات ' + result.stats.cleaned + ' سجل تلقائياً'
        );
    }

    result.valid = true;
    return result;
}

// ============================================
// Multi-Select Shared Logic
// ============================================
// Reusable functions for multi-select dropdowns.
// Used by app.js (data management filters) and export.js (export filters).
// Each caller provides the full wrapper ID and an onChange callback.
// ============================================

const MultiSelect = {

    build: function (wrapperId, options, selectedValues, defaultText, onChange, counts) {
        var wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;

        var container = wrapper.querySelector('.multi-select-options');
        if (!container) return;

        var fragment = document.createDocumentFragment();

        options.forEach(function (opt) {
            var isSelected = selectedValues && selectedValues.indexOf(opt) !== -1;

            var div = document.createElement('div');
            div.className = 'multi-select-option' + (isSelected ? ' selected' : '');
            div.dataset.value = opt;
            div.setAttribute('role', 'option');
            div.setAttribute('aria-selected', String(isSelected));

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input';
            checkbox.checked = isSelected;
            checkbox.tabIndex = -1;

            var label = document.createElement('span');
            label.className = 'option-label';
            label.textContent = opt;

            div.appendChild(checkbox);
            div.appendChild(label);

            if (counts && counts[opt] !== undefined) {
                var countSpan = document.createElement('span');
                countSpan.className = 'option-count';
                countSpan.textContent = formatNumber(counts[opt]);
                div.appendChild(countSpan);
            }

            div.addEventListener('click', function () {
                MultiSelect.toggle(wrapperId, div, defaultText, onChange);
            });

            fragment.appendChild(div);
        });

        container.innerHTML = '';
        container.appendChild(fragment);

        MultiSelect.updateToggle(wrapperId, defaultText);
    },

    /**
     * Toggle a single option's selected state.
     *
     * @param {string} wrapperId - Full ID of the wrapper
     * @param {HTMLElement} optionEl - The .multi-select-option element
     * @param {string} defaultText - Default toggle text
     * @param {Function} onChange - Callback after change
     */
    toggle: function (wrapperId, optionEl, defaultText, onChange) {
        var isSelected = optionEl.classList.contains('selected');

        if (isSelected) {
            optionEl.classList.remove('selected');
            optionEl.setAttribute('aria-selected', 'false');
            optionEl.querySelector('.form-check-input').checked = false;
        } else {
            optionEl.classList.add('selected');
            optionEl.setAttribute('aria-selected', 'true');
            optionEl.querySelector('.form-check-input').checked = true;
        }

        MultiSelect.updateToggle(wrapperId, defaultText);

        if (typeof onChange === 'function') {
            onChange(wrapperId);
        }
    },

    /**
     * Update the toggle button text and badge to reflect current selection.
     *
     * @param {string} wrapperId - Full ID of the wrapper
     * @param {string} defaultText - Default text when nothing selected
     */
    updateToggle: function (wrapperId, defaultText) {
        var wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;

        var toggle = wrapper.querySelector('.multi-select-toggle');
        if (!toggle) return;

        var textSpan = toggle.querySelector('.toggle-text');
        var badge = toggle.querySelector('.toggle-badge');
        var selected = wrapper.querySelectorAll('.multi-select-option.selected');

        if (selected.length === 0) {
            textSpan.textContent = defaultText;
            badge.classList.add('d-none');
            toggle.classList.remove('active');
        } else if (selected.length === 1) {
            textSpan.textContent = selected[0].dataset.value;
            badge.classList.add('d-none');
            toggle.classList.add('active');
        } else {
            textSpan.textContent = selected.length + ' محدد';
            badge.textContent = selected.length;
            badge.classList.remove('d-none');
            toggle.classList.add('active');
        }
    },

    /**
     * Clear all selections (= no filter = show everything).
     *
     * @param {string} wrapperId - Full ID of the wrapper
     * @param {string} defaultText - Default toggle text
     * @param {Function} [onChange] - Optional callback after change
     */
    clearAll: function (wrapperId, defaultText, onChange) {
        var wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;

        wrapper.querySelectorAll('.multi-select-option').forEach(function (opt) {
            opt.classList.remove('selected');
            opt.setAttribute('aria-selected', 'false');
            opt.querySelector('.form-check-input').checked = false;
        });

        MultiSelect.updateToggle(wrapperId, defaultText);

        if (typeof onChange === 'function') {
            onChange(wrapperId);
        }
    },

    /**
     * Get array of selected values, or undefined if none selected.
     *
     * @param {string} wrapperId - Full ID of the wrapper
     * @returns {Array|undefined}
     */
    getValues: function (wrapperId) {
        var wrapper = document.getElementById(wrapperId);
        if (!wrapper) return undefined;

        var selected = wrapper.querySelectorAll('.multi-select-option.selected');
        if (selected.length === 0) return undefined;

        var values = [];
        selected.forEach(function (opt) {
            values.push(opt.dataset.value);
        });
        return values.length > 0 ? values : undefined;
    }
};

const updateNavRecordCount = updateNavCount;
