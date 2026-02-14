let restoreFileData = null;
let _expFilterGeneration = 0;
let _expDropdownOpen = false;
let _briefModeActive = false;
const BRIEF_TEMPLATE_KEY = 'datamap_custom_template';

const ALL_COLUMNS = [
    { key: 'Name', label: 'الاسم', group: 'basic' },
    { key: 'Address', label: 'العنوان الكامل', group: 'basic' },
    { key: 'Street Address', label: 'عنوان الشارع', group: 'basic' },
    { key: 'cityExtracted', label: 'المدينة', group: 'basic' },
    { key: 'State', label: 'الولاية/المنطقة', group: 'basic' },
    { key: 'ZipCode', label: 'الرمز البريدي', group: 'basic' },
    { key: 'Plus Code', label: 'Plus Code', group: 'basic' },
    { key: 'Phone', label: 'الهاتف', group: 'contact' },
    { key: 'Website', label: 'الموقع الإلكتروني', group: 'contact' },
    { key: 'Menu', label: 'القائمة', group: 'contact' },
    { key: 'Book Online', label: 'الحجز', group: 'contact' },
    { key: 'Category', label: 'التصنيف', group: 'info' },
    { key: 'Listing Type', label: 'نوع القائمة', group: 'info' },
    { key: 'Rating', label: 'التقييم', group: 'info' },
    { key: 'Reviews', label: 'المراجعات', group: 'info' },
    { key: 'Price Range', label: 'نطاق الأسعار', group: 'info' },
    { key: 'Hours', label: 'ساعات العمل', group: 'info' },
    { key: 'Description', label: 'الوصف', group: 'info' },
    { key: 'Merchant Verified', label: 'تحقق التاجر', group: 'status' },
    { key: 'Permanently Closed', label: 'مغلق دائماً', group: 'status' },
    { key: 'Temporarily Closed', label: 'مغلق مؤقتاً', group: 'status' },
    { key: 'Dine-In', label: 'طعام داخلي', group: 'services' },
    { key: 'Takeout', label: 'استلام', group: 'services' },
    { key: 'Delivery', label: 'توصيل', group: 'services' },
    { key: 'Image URL', label: 'رابط الصورة', group: 'technical' },
    { key: 'Listing CID', label: 'معرف القائمة', group: 'technical' },
    { key: 'Lat', label: 'خط العرض', group: 'technical' },
    { key: 'Long', label: 'خط الطول', group: 'technical' },
    { key: 'Possible Virtual Tour', label: 'جولة افتراضية', group: 'technical' },
    { key: 'Listing URL', label: 'رابط Google Maps', group: 'technical' },
    { key: 'Review 1 Text', label: 'نص المراجعة 1', group: 'reviews' },
    { key: 'Review 1 Score', label: 'تقييم المراجعة 1', group: 'reviews' },
    { key: 'Review 1 Date', label: 'تاريخ المراجعة 1', group: 'reviews' },
    { key: 'Review 2 Text', label: 'نص المراجعة 2', group: 'reviews' },
    { key: 'Review 2 Score', label: 'تقييم المراجعة 2', group: 'reviews' },
    { key: 'Review 2 Date', label: 'تاريخ المراجعة 2', group: 'reviews' },
    { key: 'Review 3 Text', label: 'نص المراجعة 3', group: 'reviews' },
    { key: 'Review 3 Score', label: 'تقييم المراجعة 3', group: 'reviews' },
    { key: 'Review 3 Date', label: 'تاريخ المراجعة 3', group: 'reviews' },
    { key: 'keyword', label: 'الكلمة المفتاحية', group: 'meta' },
    { key: 'importDate', label: 'تاريخ الاستيراد', group: 'meta' },
    { key: 'isDuplicate', label: 'مكرر', group: 'meta' }
];

const TEMPLATES = {
    contact: ['Name', 'Phone', 'cityExtracted', 'Category'],
    marketing: ['Name', 'Phone', 'Website', 'cityExtracted', 'Category', 'Rating', 'Reviews', 'keyword'],
    brief: ['Name', 'Address', 'Phone', 'Website', 'Category', 'Rating', 'cityExtracted']
};

document.addEventListener('DOMContentLoaded', async function () {
    await initDB();
    await loadExportPage();
    renderColumnsSelector();
    setupRestoreZone();
    setupClearConfirmation();
});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && _db) {
        loadExportPage();
    }
});

async function loadExportPage() {
    try {
        const stats = await DB.getStats();
        const totalCount = stats.totalRecords;

        updateNavCount(totalCount);
        document.getElementById('fullExportCount').textContent = formatNumber(totalCount);

        const emptyState = document.getElementById('exportEmpty');
        const cardsContainer = document.getElementById('exportCardsContainer');
        const backupExportSection = document.getElementById('backupExportSection');
        const dangerZoneWrapper = document.getElementById('dangerZoneWrapper');

        if (totalCount === 0) {
            emptyState.classList.remove('d-none');
            cardsContainer.classList.add('d-none');
            backupExportSection.classList.add('d-none');
            dangerZoneWrapper.classList.add('d-none');
            var expPhone = document.getElementById('expFilterPhone');
            if (expPhone) expPhone.value = '';
            var expWebsite = document.getElementById('expFilterWebsite');
            if (expWebsite) expWebsite.value = '';
            var expReviews = document.getElementById('expFilterReviews');
            if (expReviews) expReviews.value = '';
            var expWebNote = document.getElementById('expWebsiteFilterNote');
            if (expWebNote) expWebNote.classList.add('d-none');
        } else {
            emptyState.classList.add('d-none');
            cardsContainer.classList.remove('d-none');
            backupExportSection.classList.remove('d-none');
            dangerZoneWrapper.classList.remove('d-none');
            loadFilterDropdowns(stats);
            updateFilteredCount();
        }

    } catch (error) {
        console.error('Export page load error:', error);
        showToast('حدث خطأ في تحميل البيانات', 'danger');
    }
}

function loadFilterDropdowns(stats) {
    _buildExpMultiOptions('expCity', stats.cities);
    _buildExpMultiOptions('expCategory', stats.categories);
    _buildExpMultiOptions('expKeyword', stats.keywords);
    updateFilteredCount();
}

function _buildExpMultiOptions(filterKey, options) {
    var defaults = {
        expCity: 'جميع المدن',
        expCategory: 'جميع التصنيفات',
        expKeyword: 'جميع الكلمات'
    };
    MultiSelect.build(filterKey + 'Wrapper', options, null, defaults[filterKey], function () {
        updateFilteredCount();
    });
}

function _toggleExpMultiOption(filterKey, optionEl) {
    var defaults = {
        expCity: 'جميع المدن',
        expCategory: 'جميع التصنيفات',
        expKeyword: 'جميع الكلمات'
    };
    MultiSelect.toggle(filterKey + 'Wrapper', optionEl, defaults[filterKey], function () {
        updateFilteredCount();
    });
}

function _updateExpMultiToggle(filterKey, defaultText) {
    MultiSelect.updateToggle(filterKey + 'Wrapper', defaultText);
}

function expMultiSelectAll(filterKey) {
    var wrapper = document.getElementById(filterKey + 'Wrapper');
    if (!wrapper) return;

    wrapper.querySelectorAll('.multi-select-option').forEach(function (opt) {
        opt.classList.add('selected');
        opt.setAttribute('aria-selected', 'true');
        opt.querySelector('.form-check-input').checked = true;
    });

    var defaults = {
        expCity: 'جميع المدن',
        expCategory: 'جميع التصنيفات',
        expKeyword: 'جميع الكلمات'
    };
    MultiSelect.updateToggle(filterKey + 'Wrapper', defaults[filterKey]);
    updateFilteredCount();
}

function expMultiClearAll(filterKey) {
    var defaults = {
        expCity: 'جميع المدن',
        expCategory: 'جميع التصنيفات',
        expKeyword: 'جميع الكلمات'
    };
    MultiSelect.clearAll(filterKey + 'Wrapper', defaults[filterKey], function () {
        updateFilteredCount();
    });
}

function _getExpMultiValues(filterKey) {
    return MultiSelect.getValues(filterKey + 'Wrapper');
}

function getExportFilters() {
    var phoneVal = document.getElementById('expFilterPhone');
    var websiteVal = document.getElementById('expFilterWebsite');
    var reviewsVal = document.getElementById('expFilterReviews');

    return {
        city: _getExpMultiValues('expCity') || undefined,
        category: _getExpMultiValues('expCategory') || undefined,
        keyword: _getExpMultiValues('expKeyword') || undefined,
        hasPhone: (phoneVal && phoneVal.value) || undefined,
        hasWebsite: (websiteVal && websiteVal.value) || undefined,
        reviewsRange: (reviewsVal && reviewsVal.value) || undefined
    };
}

async function updateFilteredCount() {
    var gen = ++_expFilterGeneration;

    try {
        var filters = getExportFilters();

        var websiteSelect = document.getElementById('expFilterWebsite');
        var websiteNote = document.getElementById('expWebsiteFilterNote');
        if (websiteSelect && websiteNote) {
            if (websiteSelect.value === 'no') {
                websiteNote.classList.remove('d-none');
                websiteNote.style.display = 'block';
            } else {
                websiteNote.classList.add('d-none');
            }
        }

        var count = await DB.countFiltered(filters);

        if (gen !== _expFilterGeneration) return;

        document.getElementById('filteredExportCount').textContent = formatNumber(count);

        await updateCascadingFilters(filters, gen);

    } catch (error) {
        if (gen === _expFilterGeneration) {
            console.error('Count error:', error);
        }
    }
}

async function updateCascadingFilters(currentFilters, gen) {
    try {
        var advancedFilters = {};
        if (currentFilters.hasPhone) advancedFilters.hasPhone = currentFilters.hasPhone;
        if (currentFilters.hasWebsite) advancedFilters.hasWebsite = currentFilters.hasWebsite;
        if (currentFilters.reviewsRange) advancedFilters.reviewsRange = currentFilters.reviewsRange;

        var cityFilters = Object.assign({}, advancedFilters);
        if (currentFilters.category) cityFilters.category = currentFilters.category;
        if (currentFilters.keyword) cityFilters.keyword = currentFilters.keyword;
        var cityOpts = await DB.getFilteredOptions(cityFilters);

        if (gen !== _expFilterGeneration) return;

        if (currentFilters.city) {
            var staleRemoved = _removeStaleSelections('expCity', cityOpts.cities);
            if (staleRemoved) {
                currentFilters = getExportFilters();
            }
        } else {
            _updateExpAvailableOptions('expCity', cityOpts.cities);
        }

        var catFilters = Object.assign({}, advancedFilters);
        if (currentFilters.city) catFilters.city = currentFilters.city;
        if (currentFilters.keyword) catFilters.keyword = currentFilters.keyword;
        var catOpts = await DB.getFilteredOptions(catFilters);

        if (gen !== _expFilterGeneration) return;

        if (currentFilters.category) {
            var staleRemoved2 = _removeStaleSelections('expCategory', catOpts.categories);
            if (staleRemoved2) {
                currentFilters = getExportFilters();
            }
        } else {
            _updateExpAvailableOptions('expCategory', catOpts.categories);
        }

        var kwFilters = Object.assign({}, advancedFilters);
        if (currentFilters.city) kwFilters.city = currentFilters.city;
        if (currentFilters.category) kwFilters.category = currentFilters.category;
        var kwOpts = await DB.getFilteredOptions(kwFilters);

        if (gen !== _expFilterGeneration) return;

        if (currentFilters.keyword) {
            _removeStaleSelections('expKeyword', kwOpts.keywords);
        } else {
            _updateExpAvailableOptions('expKeyword', kwOpts.keywords);
        }

    } catch (error) {
        if (gen === _expFilterGeneration) {
            console.error('Cascading filter error:', error);
        }
    }
}

function _removeStaleSelections(filterKey, availableValues) {
    var wrapper = document.getElementById(filterKey + 'Wrapper');
    if (!wrapper) return false;

    var removed = false;
    var selectedOptions = wrapper.querySelectorAll('.multi-select-option.selected');

    selectedOptions.forEach(function (opt) {
        var value = opt.dataset.value;
        if (availableValues.indexOf(value) === -1) {
            opt.classList.remove('selected');
            opt.setAttribute('aria-selected', 'false');
            opt.querySelector('.form-check-input').checked = false;
            removed = true;
        }
    });

    if (removed) {
        var defaults = {
            expCity: 'جميع المدن',
            expCategory: 'جميع التصنيفات',
            expKeyword: 'جميع الكلمات'
        };
        _updateExpMultiToggle(filterKey, defaults[filterKey]);
    }

    return removed;
}

function _updateExpAvailableOptions(filterKey, availableValues) {
    var container = document.getElementById(filterKey + 'Options');
    if (!container) return;

    container.querySelectorAll('.multi-select-option').forEach(function (opt) {
        var value = opt.dataset.value;
        if (availableValues.indexOf(value) !== -1) {
            opt.style.display = '';
        } else {
            opt.style.display = 'none';
            if (opt.classList.contains('selected')) {
                opt.classList.remove('selected');
                opt.setAttribute('aria-selected', 'false');
                opt.querySelector('.form-check-input').checked = false;
            }
        }
    });

    var defaults = {
        expCity: 'جميع المدن',
        expCategory: 'جميع التصنيفات',
        expKeyword: 'جميع الكلمات'
    };
    _updateExpMultiToggle(filterKey, defaults[filterKey]);
}

function renderColumnsSelector() {
    const grid = document.getElementById('columnsGrid');

    const groups = {
        basic: 'معلومات أساسية',
        contact: 'الاتصال',
        info: 'معلومات النشاط',
        status: 'الحالة',
        services: 'الخدمات',
        technical: 'بيانات تقنية',
        reviews: 'المراجعات',
        meta: 'بيانات الأداة'
    };

    const fragment = document.createDocumentFragment();

    Object.entries(groups).forEach(([groupKey, groupLabel]) => {
        const groupColumns = ALL_COLUMNS.filter(c => c.group === groupKey);
        if (groupColumns.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'column-group';

        const groupTitle = document.createElement('p');
        groupTitle.className = 'column-group-label';
        groupTitle.textContent = groupLabel;
        groupDiv.appendChild(groupTitle);

        groupColumns.forEach(col => {
            const label = document.createElement('label');
            label.className = 'column-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input column-check';
            checkbox.value = col.key;
            checkbox.checked = true;
            checkbox.addEventListener('change', updateFilteredColumnsCount);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = col.label;

            label.appendChild(checkbox);
            label.appendChild(nameSpan);
            groupDiv.appendChild(label);
        });

        fragment.appendChild(groupDiv);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function selectAllColumns(select) {
    document.querySelectorAll('.column-check').forEach(cb => {
        cb.checked = select;
    });
    updateFilteredColumnsCount();
}

function getSelectedColumns() {
    const selected = [];
    document.querySelectorAll('.column-check:checked').forEach(cb => {
        selected.push(cb.value);
    });
    return selected;
}

function updateFilteredColumnsCount() {
    var countEl = document.getElementById('filteredColumnsCount');
    if (!countEl) return;

    var selectedKeys = getSelectedColumns();
    var count = selectedKeys.length > 0 ? selectedKeys.length : ALL_COLUMNS.length;
    countEl.textContent = formatNumber(count);

    if (_briefModeActive) {
        _saveBriefTemplate();
    }
}

function scrollToColumnsSelector() {
    var selector = document.getElementById('columnsSelector');
    if (selector) {
        selector.scrollIntoView({ behavior: 'smooth', block: 'center' });
        selector.style.outline = '2px solid var(--primary)';
        selector.style.outlineOffset = '4px';
        setTimeout(function () {
            selector.style.outline = '';
            selector.style.outlineOffset = '';
        }, 2000);
    }
}

function applyTemplate(templateName) {
    if (templateName === 'brief') {
        _briefModeActive = true;
        var saved = _loadBriefTemplate();

        document.querySelectorAll('.column-check').forEach(function (cb) {
            cb.checked = saved ? saved.indexOf(cb.value) !== -1 : false;
        });

        updateFilteredColumnsCount();
        return;
    }

    _briefModeActive = false;

    var template = TEMPLATES[templateName];
    if (!template) return;

    document.querySelectorAll('.column-check').forEach(function (cb) {
        cb.checked = template.indexOf(cb.value) !== -1;
    });

    updateFilteredColumnsCount();
    showToast('تم تطبيق القالب', 'info');
}

function _saveBriefTemplate() {
    var selected = getSelectedColumns();
    if (selected.length === 0) {
        localStorage.removeItem(BRIEF_TEMPLATE_KEY);
        return;
    }
    try {
        localStorage.setItem(BRIEF_TEMPLATE_KEY, JSON.stringify(selected));
    } catch (e) {
        console.warn('Failed to save brief template:', e);
    }
}

function _loadBriefTemplate() {
    try {
        var raw = localStorage.getItem(BRIEF_TEMPLATE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;

        var validKeys = ALL_COLUMNS.map(function (c) { return c.key; });
        var filtered = parsed.filter(function (key) {
            return validKeys.indexOf(key) !== -1;
        });

        return filtered.length > 0 ? filtered : null;
    } catch (e) {
        localStorage.removeItem(BRIEF_TEMPLATE_KEY);
        return null;
    }
}

async function exportFull(format) {
    showLoading(true, 'جاري تجهيز التصدير الكامل...');

    try {
        var totalCount = await DB.count();
        if (totalCount === 0) {
            showToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        updateProgress(0, totalCount, 'جاري قراءة السجلات... 0 من ' + formatNumber(totalCount));

        var columns = ALL_COLUMNS.map(function (c) { return c.key; });
        var headers = ALL_COLUMNS.map(function (c) { return c.label; });

        var result = await DB.buildExportRows(columns, {}, function (processed) {
            updateProgress(processed, totalCount,
                'جاري قراءة السجلات... ' + formatNumber(processed) + ' من ' + formatNumber(totalCount)
            );
        });

        updateProgress(totalCount, totalCount, 'جاري إنشاء الملف...');

        generateExportFile(result.rows, headers, 'DataMap_Full_Export', format);
        showToast('تم تصدير ' + formatNumber(result.totalCount) + ' سجل بنجاح', 'success');

    } catch (error) {
        console.error('Full export error:', error);
        showToast('حدث خطأ أثناء التصدير', 'danger');
    } finally {
        showLoading(false);
    }
}

async function exportCustom(format) {
    var selectedKeys = getSelectedColumns();
    if (selectedKeys.length === 0) {
        showToast('اختر عمود واحد على الأقل', 'warning');
        return;
    }

    showLoading(true, 'جاري تجهيز التصدير المخصص...');

    try {
        var totalCount = await DB.count();
        updateProgress(0, totalCount, 'جاري قراءة السجلات...');

        var selectedColumns = ALL_COLUMNS.filter(function (c) {
            return selectedKeys.includes(c.key);
        });
        var columns = selectedColumns.map(function (c) { return c.key; });
        var headers = selectedColumns.map(function (c) { return c.label; });

        var result = await DB.buildExportRows(columns, {}, function (processed) {
            updateProgress(processed, totalCount,
                'جاري قراءة السجلات... ' + formatNumber(processed) + ' من ' + formatNumber(totalCount)
            );
        });

        if (result.totalCount === 0) {
            showToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        updateProgress(totalCount, totalCount, 'جاري إنشاء الملف...');

        generateExportFile(result.rows, headers, 'DataMap_Custom_Export', format);
        showToast('تم تصدير ' + formatNumber(result.totalCount) + ' سجل بنجاح', 'success');

    } catch (error) {
        console.error('Custom export error:', error);
        showToast('حدث خطأ أثناء التصدير', 'danger');
    } finally {
        showLoading(false);
    }
}

async function exportFiltered(format) {
    showLoading(true, 'جاري تجهيز التصدير المفلتر...');

    try {
        var filters = getExportFilters();
        var selectedKeys = getSelectedColumns();
        var selectedColumns, columns, headers;

        if (selectedKeys.length === 0) {
            columns = ALL_COLUMNS.map(function (c) { return c.key; });
            headers = ALL_COLUMNS.map(function (c) { return c.label; });
        } else {
            selectedColumns = ALL_COLUMNS.filter(function (c) {
                return selectedKeys.indexOf(c.key) !== -1;
            });
            columns = selectedColumns.map(function (c) { return c.key; });
            headers = selectedColumns.map(function (c) { return c.label; });
        }

        var estimatedCount = await DB.countFiltered(filters);

        updateProgress(0, estimatedCount || 1, 'جاري قراءة السجلات المطابقة...');

        var result = await DB.buildExportRows(columns, filters, function (processed) {
            updateProgress(processed, estimatedCount || processed,
                'جاري قراءة السجلات... ' + formatNumber(processed) + (estimatedCount ? ' من ' + formatNumber(estimatedCount) : '')
            );
        });

        if (result.totalCount === 0) {
            showToast('لا توجد بيانات مطابقة للفلتر', 'warning');
            return;
        }

        updateProgress(result.totalCount, result.totalCount, 'جاري إنشاء الملف...');

        generateExportFile(result.rows, headers, 'DataMap_Filtered_Export', format);
        showToast('تم تصدير ' + formatNumber(result.totalCount) + ' سجل (' + formatNumber(columns.length) + ' عمود) بنجاح', 'success');

    } catch (error) {
        console.error('Filtered export error:', error);
        showToast('حدث خطأ أثناء التصدير', 'danger');
    } finally {
        showLoading(false);
    }
}

function generateExportFile(rows, headers, fileNameBase, format) {
    try {
        var sheetData = [headers].concat(rows);
        var ws = XLSX.utils.aoa_to_sheet(sheetData);

        ws['!cols'] = headers.map(function (h) {
            return { wch: Math.max(h.length * 2, 15) };
        });

        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');

        var dateStr = new Date().toISOString().slice(0, 10);
        var fileName = fileNameBase + '_' + dateStr;

        if (format === 'csv') {
            XLSX.writeFile(wb, fileName + '.csv', { bookType: 'csv' });
        } else {
            XLSX.writeFile(wb, fileName + '.xlsx', { bookType: 'xlsx' });
        }

    } catch (error) {
        console.error('Export error:', error);
        showToast('حدث خطأ أثناء التصدير', 'danger');
    }
}

async function exportBackup() {
    showLoading(true, 'جاري تجهيز النسخة الاحتياطية...');

    try {
        updateProgress(0, 2, 'جاري قراءة السجلات...');
        const records = await DB.getAll();

        updateProgress(1, 2, 'جاري قراءة سجل الاستيرادات...');
        const imports = await DB.getAllImports();

        updateProgress(2, 2, 'جاري إنشاء الملف...');

        const backup = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            app: 'DataMap Pro',
            data: {
                records: records,
                imports: imports
            },
            summary: {
                totalRecords: records.length,
                totalImports: imports.length
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = 'DataMap_Backup_' + dateStr + '.json';
        link.click();

        URL.revokeObjectURL(url);

        showToast('تم تصدير النسخة الاحتياطية (' + formatNumber(records.length) + ' سجل)', 'success');

    } catch (error) {
        console.error('Backup error:', error);
        showToast('حدث خطأ أثناء التصدير', 'danger');
    } finally {
        showLoading(false);
    }
}

function setupRestoreZone() {
    const zone = document.getElementById('restoreZone');
    const input = document.getElementById('restoreInput');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.click();
        }
    });

    input.addEventListener('change', handleRestoreFile);
}

function handleRestoreFile(event) {
    var file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        showToast('يرجى اختيار ملف JSON', 'warning');
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
        } catch (parseError) {
            showToast('ملف النسخة الاحتياطية تالف — فشل في قراءة JSON', 'danger');
            return;
        }

        var validation = validateBackupData(data);

        if (!validation.valid) {
            showToast(validation.error, 'danger');
            return;
        }

        validation.warnings.forEach(function (w) {
            showToast(w, 'warning');
        });

        restoreFileData = {
            records: validation.cleanedRecords,
            imports: validation.cleanedImports
        };

        var preview = document.getElementById('restorePreview');
        preview.innerHTML = '';

        var info = document.createElement('div');
        info.className = 'restore-info';

        var items = [
            { label: 'تاريخ النسخة', value: formatDateTime(data.exportDate) },
            { label: 'سجلات صالحة', value: formatNumber(validation.stats.valid) + ' من ' + formatNumber(validation.stats.total) },
            { label: 'سجلات الاستيراد', value: formatNumber(validation.cleanedImports.length) }
        ];

        if (validation.stats.skipped > 0) {
            items.push({
                label: 'سجلات مُتخطاة',
                value: formatNumber(validation.stats.skipped)
            });
        }

        if (validation.stats.cleaned > 0) {
            items.push({
                label: 'سجلات مُصحَّحة',
                value: formatNumber(validation.stats.cleaned)
            });
        }

        items.forEach(function (item) {
            var p = document.createElement('p');
            var strong = document.createElement('strong');
            strong.textContent = item.label + ': ';
            p.appendChild(strong);
            p.appendChild(document.createTextNode(item.value));
            info.appendChild(p);
        });

        preview.appendChild(info);

        new bootstrap.Modal(document.getElementById('restoreModal')).show();
    };

    reader.readAsText(file);
    event.target.value = '';
}

async function confirmRestore() {
    if (!restoreFileData) return;

    showLoading(true, 'جاري استعادة البيانات...');

    try {
        updateProgress(0, 1, 'جاري مسح البيانات الحالية...');

        var result = await DB.safeRestore({
            records: restoreFileData.records || [],
            imports: restoreFileData.imports || []
        });

        updateProgress(1, 1, 'تم الانتهاء');

        bootstrap.Modal.getInstance(document.getElementById('restoreModal')).hide();

        if (result.success) {
            showToast(
                'تم استعادة ' + formatNumber(result.recordsRestored) + ' سجل بنجاح',
                'success'
            );
        } else {
            showToast(result.error, 'danger');
        }

        restoreFileData = null;
        await loadExportPage();

    } catch (error) {
        console.error('Restore error:', error);
        showToast('حدث خطأ غير متوقع أثناء الاستعادة: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

function setupClearConfirmation() {
    const input = document.getElementById('clearConfirmInput');
    const btn = document.getElementById('btnConfirmClear');

    input.addEventListener('input', function () {
        btn.disabled = this.value.trim() !== 'حذف';
    });
}

async function clearAllData() {
    const totalCount = await DB.count();
    document.getElementById('clearCount').textContent = formatNumber(totalCount);
    document.getElementById('clearConfirmInput').value = '';
    document.getElementById('btnConfirmClear').disabled = true;

    new bootstrap.Modal(document.getElementById('clearModal')).show();
}

async function confirmClearAll() {
    showLoading(true, 'جاري مسح البيانات...');

    try {
        await DB.clearAll();
        bootstrap.Modal.getInstance(document.getElementById('clearModal')).hide();
        showToast('تم مسح جميع البيانات بنجاح', 'success');
        await loadExportPage();

    } catch (error) {
        console.error('Clear error:', error);
        showToast('حدث خطأ أثناء المسح', 'danger');
    } finally {
        showLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', function () {

    function positionDropdown(toggle, dropdown) {
        var rect = toggle.getBoundingClientRect();
        var dropdownHeight = 240;
        var spaceBelow = window.innerHeight - rect.bottom - 8;
        var spaceAbove = rect.top - 8;

        dropdown.style.width = rect.width + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.style.left = 'auto';

        if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
            dropdown.style.top = (rect.bottom + 4) + 'px';
            dropdown.style.bottom = 'auto';
            dropdown.style.maxHeight = Math.min(dropdownHeight, spaceBelow) + 'px';
        } else {
            dropdown.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
            dropdown.style.top = 'auto';
            dropdown.style.maxHeight = Math.min(dropdownHeight, spaceAbove) + 'px';
        }
    }

    document.querySelectorAll('.export-card .multi-select-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var wrapper = toggle.closest('.multi-select-wrapper');
            var dropdown = wrapper.querySelector('.multi-select-dropdown');
            var isOpen = dropdown.classList.contains('show');

            document.querySelectorAll('.export-card .multi-select-dropdown.show').forEach(function (d) {
                d.classList.remove('show');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').classList.remove('open');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                dropdown.classList.add('show');
                toggle.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
                _expDropdownOpen = true;
                positionDropdown(toggle, dropdown);

                var searchInput = dropdown.querySelector('.multi-select-search input');
                if (searchInput) setTimeout(function () { searchInput.focus(); }, 50);
            }
        });
    });

    var repositionTimer = null;
    function repositionOpenDropdowns() {
        if (!_expDropdownOpen) return;
        if (repositionTimer) return;
        repositionTimer = requestAnimationFrame(function () {
            repositionTimer = null;
            document.querySelectorAll('.export-card .multi-select-dropdown.show').forEach(function (dropdown) {
                var wrapper = dropdown.closest('.multi-select-wrapper');
                var toggle = wrapper.querySelector('.multi-select-toggle');
                positionDropdown(toggle, dropdown);
            });
        });
    }

    window.addEventListener('scroll', repositionOpenDropdowns, true);
    window.addEventListener('resize', repositionOpenDropdowns);

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.export-card .multi-select-wrapper')) {
            document.querySelectorAll('.export-card .multi-select-dropdown.show').forEach(function (d) {
                d.classList.remove('show');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').classList.remove('open');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').setAttribute('aria-expanded', 'false');
            });
            _expDropdownOpen = false;
        }
    });

    document.querySelectorAll('.export-card .multi-select-search input').forEach(function (input) {
        input.addEventListener('input', function () {
            var query = this.value.toLowerCase();
            var options = this.closest('.multi-select-dropdown').querySelectorAll('.multi-select-option');
            options.forEach(function (opt) {
                if (opt.style.display === 'none' && !opt.classList.contains('selected')) return;
                var text = opt.dataset.value.toLowerCase();
                opt.style.display = text.includes(query) ? '' : 'none';
            });
        });

        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });

    document.querySelectorAll('.export-card .multi-select-dropdown').forEach(function (dropdown) {
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
});
