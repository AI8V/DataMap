// ============================================
// Prompt Builder — v1.0
// Templates معزولة لسهولة التحديث
// ============================================

const PROMPT_TEMPLATES = {

    /**
     * Prompt 1 — خطة بحث كاملة (قبل السكرابر)
     * المتغيرات: {businessDesc}, {targetAudience}, {countryNameAr}, {countryNameEn}, {citiesList}
     */
    searchPlan: function (data) {
        return 'أنت خبير في بيانات خرائط جوجل (Google Maps) واستخراج بيانات الأنشطة التجارية. أحتاج منك خطة بحث شاملة ومفصّلة.\n'
            + '\n'
            + '## السياق:\n'
            + 'لدي مشروع/نشاط: ' + data.businessDesc + '\n'
            + 'الجمهور المستهدف: ' + data.targetAudience + '\n'
            + 'الدولة المستهدفة: ' + data.countryNameAr + ' (' + data.countryNameEn + ')\n'
            + '\n'
            + '## المطلوب:\n'
            + 'سأستخدم أداة سكرابر (Google Maps Scraper) تقبل حقلين فقط:\n'
            + '- **Keyword**: الكلمة المفتاحية (اسم التخصص/النشاط)\n'
            + '- **Location**: الموقع بصيغة "City, Country" بالإنجليزي\n'
            + '\n'
            + 'أحتاج منك توليد خطة بحث كاملة تتضمن:\n'
            + '\n'
            + '---\n'
            + '\n'
            + '### أولاً — جدول الفئات المستهدفة:\n'
            + 'صنّف الجمهور المستهدف إلى فئات واضحة (مثال: أطباء غدد صماء، أطباء باطنة، عيادات، مستشفيات، صيدليات… إلخ).\n'
            + 'لكل فئة، أنشئ جدولاً بعمودين:\n'
            + '| الكلمة المفتاحية بالعربي | الكلمة المفتاحية بالإنجليزي |\n'
            + '\n'
            + 'غطِّ كل الصيغ الممكنة لكل فئة. مثلاً لفئة "أطباء أسنان" قد تشمل:\n'
            + '- طبيب أسنان / دكتور أسنان / عيادة أسنان / مركز أسنان / Dentist / Dental Clinic / Dental Center\n'
            + '\n'
            + 'كلما زادت الصيغ، زادت النتائج المختلفة من Google Maps لأن كل صيغة تُرجع تصنيفات (Categories) مختلفة.\n'
            + '\n'
            + '---\n'
            + '\n'
            + '### ثانياً — قائمة المدن:\n'
            + 'المدن الرئيسية في ' + data.countryNameAr + ':\n'
            + data.citiesList + '\n'
            + '\n'
            + 'اكتب كل مدينة بصيغة: City, ' + data.countryNameEn + '\n'
            + '\n'
            + '---\n'
            + '\n'
            + '### ثالثاً — صيغ البحث الجاهزة للنسخ المباشر:\n'
            + 'لكل فئة من الفئات أعلاه، ولّد قائمة صيغ جاهزة يمكن نسخها مباشرة في حقل Keyword في أداة السكرابر:\n'
            + '- صيغ إنجليزية بنمط: "Keyword near City, ' + data.countryNameEn + '"\n'
            + '- صيغ عربية بنمط: "كلمة مفتاحية + اسم المدينة"\n'
            + '\n'
            + 'مثال:\n'
            + '```\n'
            + 'Dentist near Riyadh, ' + data.countryNameEn + '\n'
            + 'Dental Clinic near Jeddah, ' + data.countryNameEn + '\n'
            + 'طبيب أسنان الرياض\n'
            + 'عيادة أسنان جدة\n'
            + '```\n'
            + '\n'
            + '---\n'
            + '\n'
            + '### رابعاً — ملخص وأولويات:\n'
            + '- جدول ملخص يوضح: عدد الكلمات المفتاحية لكل فئة × عدد المدن = إجمالي عمليات البحث المطلوبة.\n'
            + '- رتّب الفئات حسب الأولوية (أي فئة أبدأ بها أولاً بناءً على مدى ارتباطها بالتخصص وحجم النتائج المتوقع).\n'
            + '- اذكر نصائح لتحسين جودة النتائج.\n'
            + '\n'
            + '---\n'
            + '\n'
            + '**مهم:** كن شاملاً في الصيغ. الهدف تغطية أكبر عدد ممكن من الأنشطة التجارية المرتبطة بتخصصي في Google Maps. كل صيغة مختلفة (عربي/إنجليزي، مفرد/جمع، طبيب/دكتور/أخصائي/عيادة/مركز) قد تُرجع نتائج مختلفة تماماً.';
    },

    /**
     * Prompt 2 — تحليل التصنيفات (بعد رفع الملف)
     * المتغيرات: {keyword}, {categoriesList}, {totalRecords}, {cityInfo}
     */
    categoryAnalysis: function (data) {
        return 'أنت خبير في بيانات خرائط جوجل (Google Maps) وتحليل الأنشطة التجارية.\n'
            + '\n'
            + '## السياق:\n'
            + 'قمت بالبحث في Google Maps باستخدام الكلمة المفتاحية: "' + data.keyword + '"'
            + (data.cityInfo ? ' في منطقة: ' + data.cityInfo : '') + '\n'
            + 'وحصلت على ' + data.totalRecords + ' نتيجة.\n'
            + '\n'
            + 'Google Maps أرجعت هذه النتائج مصنّفة تحت التصنيفات (Categories) التالية:\n'
            + '\n'
            + data.categoriesList + '\n'
            + '\n'
            + '## المطلوب:\n'
            + 'حلّل هذه التصنيفات بناءً على الكلمة المفتاحية المُستخدمة في البحث، وقدّم توصية واضحة:\n'
            + '\n'
            + '### 1. التصنيفات المرتبطة (يُنصح بالإبقاء عليها):\n'
            + 'اذكر كل تصنيف مرتبط بالتخصص مع سبب مختصر.\n'
            + '\n'
            + '### 2. التصنيفات غير المرتبطة (يُنصح باستبعادها):\n'
            + 'اذكر كل تصنيف غير مرتبط أو عام جداً مع سبب الاستبعاد.\n'
            + '\n'
            + '### 3. تصنيفات تحتاج مراجعة يدوية:\n'
            + 'إن وُجدت تصنيفات غامضة أو قد تكون مرتبطة جزئياً، اذكرها مع التوضيح.\n'
            + '\n'
            + '### 4. ملخص سريع:\n'
            + '- كم تصنيف يُبقى عليه وكم يُستبعد.\n'
            + '- النسبة التقريبية للسجلات المتوقع الاحتفاظ بها.\n'
            + '- أي ملاحظات إضافية حول جودة نتائج هذا البحث.\n'
            + '\n'
            + '**مهم:** كن محدداً وعملياً. الهدف هو تنظيف البيانات والاحتفاظ فقط بالأنشطة التجارية المرتبطة فعلاً بتخصص البحث.';
    }
};

// ============================================
// Prompt Builder — دوال مساعدة
// ============================================

function _getCitiesListForPrompt(countryCode) {
    var country = CITIES_DATABASE[countryCode];
    if (!country || !country.cities) return '';

    var lines = [];
    for (var i = 0; i < country.cities.length; i++) {
        var city = country.cities[i];
        var arName = '';
        for (var v = 0; v < city.variants.length; v++) {
            if (/[\u0600-\u06FF]/.test(city.variants[v])) {
                arName = city.variants[v];
                break;
            }
        }
        if (arName) {
            lines.push(city.standard + ' (' + arName + ')');
        } else {
            lines.push(city.standard);
        }
    }

    return lines.join(' — ');
}

function _validatePrompt1Inputs() {
    var desc = document.getElementById('promptBusinessDesc');
    var audience = document.getElementById('promptTargetAudience');
    var country = document.getElementById('promptCountrySelect');
    var btn = document.getElementById('btnGeneratePrompt1');

    if (!desc || !audience || !country || !btn) return;

    var isValid = desc.value.trim().length > 0
        && audience.value.trim().length > 0
        && country.value !== '';

    btn.disabled = !isValid;
}

function generateSearchPlanPrompt() {
    var descEl = document.getElementById('promptBusinessDesc');
    var audienceEl = document.getElementById('promptTargetAudience');
    var countryEl = document.getElementById('promptCountrySelect');

    if (!descEl || !audienceEl || !countryEl) return;

    var businessDesc = descEl.value.trim();
    var targetAudience = audienceEl.value.trim();
    var countryCode = countryEl.value;

    if (!businessDesc || !targetAudience || !countryCode) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }

    var countryNameAr = getCountryNameAr(countryCode);
    var countryNameEn = getCountryNameEn(countryCode);
    var citiesList = _getCitiesListForPrompt(countryCode);

    var promptText = PROMPT_TEMPLATES.searchPlan({
        businessDesc: businessDesc,
        targetAudience: targetAudience,
        countryNameAr: countryNameAr,
        countryNameEn: countryNameEn,
        citiesList: citiesList
    });

    var textEl = document.getElementById('prompt1Text');
    var wrapperEl = document.getElementById('prompt1OutputWrapper');

    if (textEl) textEl.textContent = promptText;
    if (wrapperEl) wrapperEl.classList.remove('d-none');

    var previewEl = document.getElementById('prompt1Preview');
    var toggleIcon = document.getElementById('prompt1ToggleIcon');
    var toggleText = document.getElementById('prompt1ToggleText');
    if (previewEl) previewEl.classList.remove('d-none');
    if (toggleIcon) {
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
    }
    if (toggleText) toggleText.textContent = 'إخفاء';

    var successEl = document.getElementById('prompt1CopySuccess');
    if (successEl) successEl.classList.add('d-none');

    showToast('تم توليد الـ Prompt بنجاح — انسخه واستخدمه مع أي نموذج ذكاء اصطناعي', 'success');
}

function generateCategoryAnalysisPrompt() {
    var keyword = document.getElementById('keywordInput').value.trim();

    if (!keyword) {
        showToast('لا توجد كلمة مفتاحية — تأكد من إدخالها في خطوة رفع الملف', 'warning');
        return;
    }

    var categoryKeys = Object.keys(_categoryCounts);
    if (categoryKeys.length === 0) {
        showToast('لا توجد تصنيفات للتحليل', 'warning');
        return;
    }

    var sorted = Object.entries(_categoryCounts).sort(function (a, b) { return b[1] - a[1]; });
    var categoriesLines = [];
    for (var i = 0; i < sorted.length; i++) {
        categoriesLines.push('- ' + sorted[i][0] + ' (' + sorted[i][1] + ' سجل)');
    }
    var categoriesList = categoriesLines.join('\n');

    var totalRecords = String(processedRecords.length);

    var cityInfo = '';
    var countryCode = document.getElementById('countrySelect').value;
    if (countryCode && countryCode !== 'OTHER') {
        cityInfo = getCountryNameAr(countryCode);
    }

    var promptText = PROMPT_TEMPLATES.categoryAnalysis({
        keyword: keyword,
        categoriesList: categoriesList,
        totalRecords: totalRecords,
        cityInfo: cityInfo
    });

    var textEl = document.getElementById('prompt2Text');
    var wrapperEl = document.getElementById('prompt2OutputWrapper');

    if (textEl) textEl.textContent = promptText;
    if (wrapperEl) wrapperEl.classList.remove('d-none');

    var previewEl = document.getElementById('prompt2Preview');
    var toggleIcon = document.getElementById('prompt2ToggleIcon');
    var toggleText = document.getElementById('prompt2ToggleText');
    if (previewEl) previewEl.classList.remove('d-none');
    if (toggleIcon) {
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
    }
    if (toggleText) toggleText.textContent = 'إخفاء';

    var successEl = document.getElementById('prompt2CopySuccess');
    if (successEl) successEl.classList.add('d-none');

    showToast('تم توليد Prompt التحليل — انسخه واستخدمه مع أي نموذج ذكاء اصطناعي', 'success');
}

function togglePromptPreview(promptId) {
    var previewEl = document.getElementById(promptId + 'Preview');
    var toggleIcon = document.getElementById(promptId + 'ToggleIcon');
    var toggleText = document.getElementById(promptId + 'ToggleText');

    if (!previewEl) return;

    var isHidden = previewEl.classList.contains('d-none');

    if (isHidden) {
        previewEl.classList.remove('d-none');
        if (toggleIcon) {
            toggleIcon.classList.remove('bi-eye');
            toggleIcon.classList.add('bi-eye-slash');
        }
        if (toggleText) toggleText.textContent = 'إخفاء';
    } else {
        previewEl.classList.add('d-none');
        if (toggleIcon) {
            toggleIcon.classList.remove('bi-eye-slash');
            toggleIcon.classList.add('bi-eye');
        }
        if (toggleText) toggleText.textContent = 'إظهار';
    }
}

function copyPromptToClipboard(promptId) {
    var textEl = document.getElementById(promptId + 'Text');
    if (!textEl) return;

    var text = textEl.textContent;
    if (!text) {
        showToast('لا يوجد نص للنسخ', 'warning');
        return;
    }

    var successEl = document.getElementById(promptId + 'CopySuccess');

    function onCopySuccess() {
        if (successEl) {
            successEl.classList.remove('d-none');
            setTimeout(function () {
                successEl.classList.add('d-none');
            }, 3000);
        }
        showToast('تم نسخ الـ Prompt — الصقه في ChatGPT أو Gemini أو Claude', 'success');
    }

    function onCopyFail() {
        _fallbackSelectPrompt(promptId);
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            navigator.clipboard.writeText(text).then(onCopySuccess).catch(function () {
                _fallbackExecCopy(text, onCopySuccess, onCopyFail);
            });
        } catch (e) {
            _fallbackExecCopy(text, onCopySuccess, onCopyFail);
        }
    } else {
        _fallbackExecCopy(text, onCopySuccess, onCopyFail);
    }
}

function _fallbackExecCopy(text, onSuccess, onFail) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.right = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    var selected = document.getSelection().rangeCount > 0
        ? document.getSelection().getRangeAt(0)
        : null;

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    var success = false;
    try {
        success = document.execCommand('copy');
    } catch (e) {
        success = false;
    }

    document.body.removeChild(textarea);

    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    }

    if (success) {
        onSuccess();
    } else {
        onFail();
    }
}

function _fallbackSelectPrompt(promptId) {
    var previewEl = document.getElementById(promptId + 'Preview');
    var textEl = document.getElementById(promptId + 'Text');

    if (previewEl && previewEl.classList.contains('d-none')) {
        previewEl.classList.remove('d-none');
        var toggleIcon = document.getElementById(promptId + 'ToggleIcon');
        var toggleText = document.getElementById(promptId + 'ToggleText');
        if (toggleIcon) {
            toggleIcon.classList.remove('bi-eye');
            toggleIcon.classList.add('bi-eye-slash');
        }
        if (toggleText) toggleText.textContent = 'إخفاء';
    }

    if (textEl) {
        var range = document.createRange();
        range.selectNodeContents(textEl);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    showToast('لم يتمكن المتصفح من النسخ تلقائياً — تم تحديد النص، اضغط Ctrl+C للنسخ', 'warning');
}

let parsedRecords = [];
let processedRecords = [];
let uniqueRecords = [];
let duplicateRecords = [];
let selectedCategories = {};
let _categoryCounts = {};
let duplicateAction = 'manual';
let selectedDuplicates = new Set();
let _importInProgress = false;
let _pendingLeaveUrl = null;

document.addEventListener('DOMContentLoaded', async function () {
    await initDB();
    await DB.count();
    await loadImportHistory();
    setupDropZone();
    setupFileInput();
    await updateNavCount();

    // ربط أحداث التحقق من صحة نموذج الاستيراد
    var countrySelect = document.getElementById('countrySelect');
    var keywordInput = document.getElementById('keywordInput');

    if (countrySelect) countrySelect.addEventListener('change', validateForm);
    if (keywordInput) keywordInput.addEventListener('input', validateForm);

    // ربط أحداث التحقق من صحة مدخلات Prompt Builder
    var promptDesc = document.getElementById('promptBusinessDesc');
    var promptAudience = document.getElementById('promptTargetAudience');
    var promptCountry = document.getElementById('promptCountrySelect');

    if (promptDesc) promptDesc.addEventListener('input', _validatePrompt1Inputs);
    if (promptAudience) promptAudience.addEventListener('input', _validatePrompt1Inputs);
    if (promptCountry) promptCountry.addEventListener('change', _validatePrompt1Inputs);
});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && _db) {
        loadImportHistory();
        updateNavCount();
    }
});

window.addEventListener('beforeunload', function (e) {
    if (!_importInProgress) return;
    e.preventDefault();
    e.returnValue = '';
});

document.addEventListener('click', function (e) {
    if (!_importInProgress) return;

    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#') || href.startsWith('javascript:')) return;

    if (link.target === '_blank') return;

    var isInternal = href === 'index.html'
        || href === 'analytics.html'
        || href === 'export.html'
        || href === 'import.html'
        || href.endsWith('/index.html')
        || href.endsWith('/analytics.html')
        || href.endsWith('/export.html')
        || href.endsWith('/import.html')
        || href === '/'
        || href === './';

    if (!isInternal) return;

    e.preventDefault();
    _pendingLeaveUrl = href;

    var modalEl = document.getElementById('leaveImportModal');
    if (modalEl) {
        new bootstrap.Modal(modalEl).show();
    }
}, true);

document.addEventListener('DOMContentLoaded', function () {
    var btnConfirmLeave = document.getElementById('btnConfirmLeave');
    if (btnConfirmLeave) {
        btnConfirmLeave.addEventListener('click', function () {
            _importInProgress = false;
            var modalEl = document.getElementById('leaveImportModal');
            var modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            if (_pendingLeaveUrl) {
                window.location.href = _pendingLeaveUrl;
            }
        });
    }
});

function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
}

function setupFileInput() {
    document.getElementById('fileInput').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function handleFile(file) {
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    const validExts = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
        showToast('يرجى رفع ملف Excel أو CSV فقط', 'danger');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showToast(`حجم الملف (${formatFileSize(file.size)}) يتجاوز الحد الأقصى (${formatFileSize(MAX_FILE_SIZE)})`, 'danger');
        return;
    }

    if (file.size === 0) {
        showToast('الملف فارغ', 'danger');
        return;
    }

    document.getElementById('dropZone').classList.add('d-none');
    document.getElementById('fileInfo').classList.remove('d-none');
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);

    autoDetectKeyword(file.name);

    window._selectedFile = file;

    validateForm();
}

function autoDetectKeyword(filename) {
    const keywordInput = document.getElementById('keywordInput');

    if (keywordInput.value.trim()) return;

    let name = filename.replace(/\.(xlsx|xls|csv)$/i, '');

    if (name.startsWith('Google-Full-')) {
        name = name.replace('Google-Full-', '');
        const keyword = name.replace(/-/g, ' ').trim();

        if (keyword) {
            keywordInput.value = keyword;
            autoDetectCountry(keyword);
            validateForm();
            showToast('تم استنتاج الكلمة المفتاحية تلقائياً من اسم الملف', 'info');
        }
    }
}

function autoDetectCountry(keyword) {
    const countrySelect = document.getElementById('countrySelect');

    if (countrySelect.value) return;

    const keywordLower = keyword.toLowerCase();

    const countryPatterns = {
        'SA': ['saudi arabia', 'saudi', 'السعودية', 'المملكة'],
        'EG': ['egypt', 'مصر'],
        'AE': ['united arab emirates', 'uae', 'الإمارات', 'الامارات', 'dubai', 'abu dhabi'],
        'KW': ['kuwait', 'الكويت'],
        'BH': ['bahrain', 'البحرين'],
        'OM': ['oman', 'عمان', 'سلطنة عمان'],
        'QA': ['qatar', 'قطر'],
        'JO': ['jordan', 'الأردن', 'الاردن'],
        'IQ': ['iraq', 'العراق'],
        'MA': ['morocco', 'المغرب', 'maroc'],
        'TN': ['tunisia', 'تونس'],
        'LY': ['libya', 'ليبيا'],
        'DZ': ['algeria', 'الجزائر'],
        'TR': ['turkey', 'türkiye', 'turkiye', 'تركيا']
    };

    for (const [code, patterns] of Object.entries(countryPatterns)) {
        for (const pattern of patterns) {
            if (keywordLower.includes(pattern)) {
                countrySelect.value = code;
                return;
            }
        }
    }
}

function removeFile() {
    document.getElementById('dropZone').classList.remove('d-none');
    document.getElementById('fileInfo').classList.add('d-none');
    document.getElementById('fileInput').value = '';
    window._selectedFile = null;
    validateForm();
    resetSteps();
}

function validateForm() {
    const hasFile = !!window._selectedFile;
    const hasCountry = !!document.getElementById('countrySelect').value;
    const hasKeyword = !!document.getElementById('keywordInput').value.trim();

    document.getElementById('btnProcess').disabled = !(hasFile && hasCountry && hasKeyword);
}

function validateImportData(records) {
    const warnings = [];
    const stats = {
        totalRows: records.length,
        emptyNames: 0,
        invalidRatings: 0,
        invalidReviews: 0,
        emptyPhones: 0
    };

    const cleanedRecords = records.map((record, index) => {
        const cleaned = { ...record };

        if (!cleaned.Name || String(cleaned.Name).trim() === '') {
            stats.emptyNames++;
            cleaned.Name = `سجل بدون اسم #${index + 1}`;
        } else {
            cleaned.Name = String(cleaned.Name).trim();
        }

        if (cleaned.Rating !== undefined && cleaned.Rating !== '' && cleaned.Rating !== null) {
            var rating = parseFloat(cleaned.Rating);
            if (isNaN(rating)) {
                stats.invalidRatings++;
                cleaned.Rating = 0;
            } else {
                cleaned.Rating = Math.round(Math.min(5, Math.max(0, rating)) * 10) / 10;
            }
        } else {
            cleaned.Rating = 0;
        }

        if (cleaned.Reviews !== undefined && cleaned.Reviews !== '' && cleaned.Reviews !== null) {
            var reviews = parseInt(cleaned.Reviews);
            if (isNaN(reviews)) {
                stats.invalidReviews++;
                cleaned.Reviews = 0;
            } else {
                cleaned.Reviews = Math.max(0, reviews);
            }
        } else {
            cleaned.Reviews = 0;
        }

        if (!cleaned.Phone || String(cleaned.Phone).trim() === '') {
            stats.emptyPhones++;
        }

        Object.keys(cleaned).forEach(key => {
            if (typeof cleaned[key] === 'string') {
                cleaned[key] = cleaned[key].trim();
            }
        });

        return cleaned;
    });

    if (stats.emptyNames > 0) {
        warnings.push(`${stats.emptyNames} سجل بدون اسم — تم تعيين اسم تلقائي`);
    }
    if (stats.invalidRatings > 0) {
        warnings.push(`${stats.invalidRatings} سجل يحتوي تقييم غير صالح — تم تفريغه`);
    }
    if (stats.invalidReviews > 0) {
        warnings.push(`${stats.invalidReviews} سجل يحتوي عدد مراجعات غير صالح — تم تفريغه`);
    }

    return { cleanedRecords, warnings, stats };
}

async function processFile() {
    const file = window._selectedFile;
    const countryCode = document.getElementById('countrySelect').value;
    const keyword = document.getElementById('keywordInput').value.trim();

    if (!file || !countryCode || !keyword) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }

    showLoading(true, 'جاري قراءة الملف...');

    try {
        const data = await readExcelFile(file);

        if (data.length === 0) {
            showToast('الملف فارغ أو لا يحتوي على بيانات', 'warning');
            showLoading(false);
            return;
        }

        showLoading(true, 'جاري معالجة البيانات...');

        const validation = validateImportData(data);

        processedRecords = validation.cleanedRecords.map(record => ({
            ...record,
            Phone: cleanPhone(record.Phone),
            keyword: keyword,
            cityExtracted: extractCity(record, countryCode),
            importDate: new Date().toISOString(),
            isDuplicate: false
        }));

        if (validation.warnings.length > 0) {
            validation.warnings.forEach(w => showToast(w, 'warning'));
        }

        // === Reverse Geocoding للسجلات "غير محدد" ===
        var unknownCount = 0;
        for (var ri = 0; ri < processedRecords.length; ri++) {
            if (processedRecords[ri].cityExtracted === 'غير محدد') unknownCount++;
        }

        if (unknownCount > 0) {
            // فحص الاتصال بالإنترنت
            var isOnline = navigator.onLine !== false;
            if (isOnline) {
                showLoading(true, 'جاري تحديد المدن من الإحداثيات (' + unknownCount + ' سجل)...');

                try {
                    var geoResult = await reverseGeocodeBatch(
                        processedRecords,
                        countryCode,
                        function (current, total) {
                            updateProgress(current, total,
                                'تحديد المدن: ' + current + ' من ' + total
                            );
                        }
                    );

                    if (geoResult.resolved > 0) {
                        showToast(
                            'تم تحديد ' + formatNumber(geoResult.resolved) + ' مدينة من الإحداثيات'
                                + (geoResult.failed > 0 ? '، فشل ' + formatNumber(geoResult.failed) : ''),
                            'success'
                        );
                    }
                } catch (geoError) {
                    console.warn('[ReverseGeocode] Batch error:', geoError);
                    showToast('تعذّر تحديد بعض المدن من الإحداثيات — سيتم تصنيفها "غير محدد"', 'warning');
                }
            }
        }
        // === نهاية Reverse Geocoding ===

        showLoading(true, 'جاري كشف التكرارات...');
        const result = await DB.findDuplicates(processedRecords);
        uniqueRecords = result.unique;
        duplicateRecords = result.duplicates;

        showSummary(processedRecords.length, uniqueRecords.length, duplicateRecords.length);
        showDuplicates();
        showCategories();
        showCities(countryCode);
        updateConfirmation();

        showLoading(false);
        showToast('تم معالجة الملف بنجاح', 'success');
        announce('تم معالجة الملف. راجع النتائج أدناه');

    } catch (error) {
        console.error('Process error:', error);
        showLoading(false);
        showToast('حدث خطأ أثناء معالجة الملف: ' + error.message, 'danger');
    }
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

                if (jsonData.length > 0) {
                    const headers = Object.keys(jsonData[0]);
                    const hasName = headers.some(h =>
                        h.toLowerCase() === 'name' || h === 'Name'
                    );
                    if (!hasName) {
                        reject(new Error('الملف لا يحتوي على الأعمدة المتوقعة. تأكد أنه ملف بيانات خرائط جوجل.'));
                        return;
                    }
                }

                resolve(jsonData);
            } catch (err) {
                reject(new Error('فشل في قراءة الملف. تأكد أنه ملف Excel صالح.'));
            }
        };

        reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
        reader.readAsArrayBuffer(file);
    });
}

function showSummary(total, newCount, duplicateCount) {
    const categories = new Set(processedRecords.map(r => r.Category).filter(Boolean));

    document.getElementById('summaryTotal').textContent = formatNumber(total);
    document.getElementById('summaryNew').textContent = formatNumber(newCount);
    document.getElementById('summaryDuplicates').textContent = formatNumber(duplicateCount);
    document.getElementById('summaryCategories').textContent = formatNumber(categories.size);

    document.getElementById('stepSummary').classList.remove('d-none');

    _importInProgress = true;
}

function showDuplicates() {
    const section = document.getElementById('stepDuplicates');

    if (duplicateRecords.length === 0) {
        section.classList.add('d-none');
        document.getElementById('categoriesStepNum').textContent = '3';
        document.getElementById('citiesStepNum').textContent = '4';
        document.getElementById('confirmStepNum').textContent = '5';
        return;
    }

    section.classList.remove('d-none');
    document.getElementById('duplicatesBadge').textContent = formatNumber(duplicateRecords.length);

    document.getElementById('categoriesStepNum').textContent = '4';
    document.getElementById('citiesStepNum').textContent = '5';
    document.getElementById('confirmStepNum').textContent = '6';

    duplicateAction = 'manual';
    selectedDuplicates = new Set();

    updateDuplicateButtons();
    renderDuplicatesTable();
}

function renderDuplicatesTable() {
    const tbody = document.getElementById('duplicatesBody');
    const fragment = document.createDocumentFragment();

    duplicateRecords.forEach((dup, index) => {
        const nr = dup.newRecord;
        const er = dup.existingRecord;
        const isSelected = selectedDuplicates.has(index);

        const tr = document.createElement('tr');
        tr.className = `duplicate-row ${isSelected ? 'table-active selected' : ''}`;
        tr.dataset.index = String(index);
        tr.setAttribute('role', 'checkbox');
        tr.setAttribute('aria-checked', String(isSelected));
        tr.setAttribute('tabindex', '0');
        tr.style.cursor = 'pointer';

        tr.addEventListener('click', () => toggleDuplicateRow(index));
        tr.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDuplicateRow(index);
            }
        });

        const tdName = document.createElement('td');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'fw-bold';
        nameSpan.textContent = nr.Name || '-';
        tdName.appendChild(nameSpan);
        tr.appendChild(tdName);

        const tdCity = document.createElement('td');
        tdCity.textContent = nr.cityExtracted || '-';
        tr.appendChild(tdCity);

        const tdPhone = document.createElement('td');
        tdPhone.setAttribute('dir', 'ltr');
        tdPhone.textContent = nr.Phone || '-';
        tr.appendChild(tdPhone);

        const tdCategory = document.createElement('td');
        const catBadge = document.createElement('span');
        catBadge.className = 'badge-category';
        catBadge.textContent = nr.Category || '-';
        tdCategory.appendChild(catBadge);
        tr.appendChild(tdCategory);

        const tdMatch = document.createElement('td');

        const matchBadge = document.createElement('span');
        matchBadge.className = 'badge bg-warning text-dark';
        matchBadge.textContent = dup.matchType;
        tdMatch.appendChild(matchBadge);

        tdMatch.appendChild(document.createElement('br'));

        const matchName = document.createElement('small');
        matchName.className = 'text-info';
        matchName.textContent = er.Name || '-';
        tdMatch.appendChild(matchName);

        tdMatch.appendChild(document.createElement('br'));

        const matchKeyword = document.createElement('small');
        matchKeyword.className = 'text-muted';
        matchKeyword.textContent = 'الكلمة: ' + (er.keyword || '-');
        tdMatch.appendChild(matchKeyword);

        tr.appendChild(tdMatch);

        const tdStatus = document.createElement('td');
        tdStatus.className = 'text-center';
        const statusIcon = document.createElement('i');
        statusIcon.className = `bi ${isSelected ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'} fs-5 duplicate-status-icon`;
        statusIcon.setAttribute('aria-hidden', 'true');
        tdStatus.appendChild(statusIcon);
        tr.appendChild(tdStatus);

        fragment.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

function toggleDuplicateRow(index) {
    if (duplicateAction !== 'manual') return;

    if (selectedDuplicates.has(index)) {
        selectedDuplicates.delete(index);
    } else {
        selectedDuplicates.add(index);
    }

    renderDuplicatesTable();
    updateConfirmation();
}

function handleDuplicates(action) {
    duplicateAction = action;

    if (action !== 'manual') {
        selectedDuplicates = new Set();
    }

    updateDuplicateButtons();

    const tableWrapper = document.getElementById('duplicatesTableWrapper');
    if (action === 'manual') {
        tableWrapper.classList.remove('d-none');
        renderDuplicatesTable();
    } else {
        tableWrapper.classList.add('d-none');
    }

    updateConfirmation();
}

function updateDuplicateButtons() {
    const btnSkip = document.getElementById('btnSkipAll');
    const btnAdd = document.getElementById('btnAddAll');
    const btnManual = document.getElementById('btnManual');

    btnSkip.classList.remove('active');
    btnAdd.classList.remove('active');
    btnManual.classList.remove('active');

    switch (duplicateAction) {
        case 'skip':
            btnSkip.classList.add('active');
            break;
        case 'addMarked':
            btnAdd.classList.add('active');
            break;
        case 'manual':
            btnManual.classList.add('active');
            break;
    }
}

function showCategories() {
    const section = document.getElementById('stepCategories');
    section.classList.remove('d-none');

    _categoryCounts = {};
    processedRecords.forEach(r => {
        const cat = r.Category || 'غير مصنف';
        _categoryCounts[cat] = (_categoryCounts[cat] || 0) + 1;
    });

    if (Object.keys(selectedCategories).length === 0) {
        Object.keys(_categoryCounts).forEach(cat => {
            selectedCategories[cat] = true;
        });
    } else {
        Object.keys(_categoryCounts).forEach(cat => {
            if (selectedCategories[cat] === undefined) {
                selectedCategories[cat] = true;
            }
        });
    }

    renderCategories();
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    const sorted = Object.entries(_categoryCounts).sort((a, b) => b[1] - a[1]);

    window._categoryKeys = sorted.map(([cat]) => cat);

    const fragment = document.createDocumentFragment();

    sorted.forEach(([category, count], index) => {
        const isSelected = selectedCategories[category] !== false;

        const card = document.createElement('div');
        card.className = `category-card ${isSelected ? 'selected' : 'excluded'}`;
        card.dataset.categoryIndex = String(index);
        card.setAttribute('role', 'checkbox');
        card.setAttribute('aria-checked', String(isSelected));
        card.setAttribute('tabindex', '0');

        card.addEventListener('click', () => toggleCategoryByIndex(index));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCategoryByIndex(index);
            }
        });

        const header = document.createElement('div');
        header.className = 'category-card-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.textContent = category;

        const toggleSpan = document.createElement('span');
        toggleSpan.className = 'category-toggle';
        const toggleIcon = document.createElement('i');
        toggleIcon.className = isSelected
            ? 'bi bi-check-circle-fill text-success'
            : 'bi bi-x-circle-fill text-danger';
        toggleIcon.setAttribute('aria-hidden', 'true');
        toggleSpan.appendChild(toggleIcon);

        header.appendChild(nameSpan);
        header.appendChild(toggleSpan);

        const countSpan = document.createElement('span');
        countSpan.className = 'category-count';
        countSpan.textContent = count + ' سجل';

        card.appendChild(header);
        card.appendChild(countSpan);

        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function toggleCategoryByIndex(index) {
    const category = window._categoryKeys[index];
    if (category === undefined) return;
    selectedCategories[category] = !selectedCategories[category];
    renderCategories();
    updateConfirmation();
}

function selectAllCategories(select) {
    Object.keys(selectedCategories).forEach(cat => {
        selectedCategories[cat] = select;
    });
    renderCategories();
    updateConfirmation();
}

function invertCategorySelection() {
    Object.keys(selectedCategories).forEach(cat => {
        selectedCategories[cat] = !selectedCategories[cat];
    });
    renderCategories();
    updateConfirmation();
}

function showCities(countryCode) {
    const section = document.getElementById('stepCities');
    section.classList.remove('d-none');

    const cityCount = {};
    processedRecords.forEach(r => {
        const city = r.cityExtracted || 'غير محدد';
        cityCount[city] = (cityCount[city] || 0) + 1;
    });

    const sorted = Object.entries(cityCount).sort((a, b) => b[1] - a[1]);

    const container = document.getElementById('citiesSummary');
    const fragment = document.createDocumentFragment();

    sorted.forEach(([city, count]) => {
        const item = document.createElement('div');
        item.className = 'city-summary-item';
        item.setAttribute('role', 'listitem');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'city-summary-name';

        const geoIcon = document.createElement('i');
        geoIcon.className = 'bi bi-geo-alt ms-1';
        geoIcon.setAttribute('aria-hidden', 'true');
        nameSpan.appendChild(geoIcon);
        nameSpan.appendChild(document.createTextNode(' ' + city));

        const countSpan = document.createElement('span');
        countSpan.className = 'city-summary-count';
        countSpan.textContent = formatNumber(count) + ' سجل';

        item.appendChild(nameSpan);
        item.appendChild(countSpan);

        fragment.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    const unknownCount = cityCount['غير محدد'] || 0;
    const alertEl = document.getElementById('unknownCitiesAlert');
    if (unknownCount > 0) {
        alertEl.classList.remove('d-none');
        document.getElementById('unknownCitiesCount').textContent = formatNumber(unknownCount);
    } else {
        alertEl.classList.add('d-none');
    }
}

function updateConfirmation() {
    var section = document.getElementById('stepConfirm');
    section.classList.remove('d-none');

    var finalRecords = getFinalRecords();

    var cities = new Set(finalRecords.map(function (r) { return r.cityExtracted; }).filter(Boolean));
    var categories = new Set(finalRecords.map(function (r) { return r.Category; }).filter(Boolean));

    document.getElementById('confirmNewCount').textContent = formatNumber(finalRecords.length);
    document.getElementById('confirmCityCount').textContent = formatNumber(cities.size);
    document.getElementById('confirmCategoryCount').textContent = formatNumber(categories.size);
    document.getElementById('confirmKeyword').textContent = document.getElementById('keywordInput').value.trim();

    document.getElementById('btnConfirmImport').disabled = finalRecords.length === 0;

    updateCategoryExclusionWarning(finalRecords.length);
}

function updateCategoryExclusionWarning(finalCount) {
    var warning = document.getElementById('categoryExclusionWarning');
    if (!warning) return;

    var totalInFile = processedRecords.length;
    if (totalInFile === 0) {
        warning.classList.add('d-none');
        return;
    }

    var percent = Math.round((finalCount / totalInFile) * 100);

    if (percent < 20 && finalCount < totalInFile) {
        document.getElementById('categoryWarningCount').textContent = formatNumber(finalCount);
        document.getElementById('categoryWarningTotal').textContent = formatNumber(totalInFile);
        document.getElementById('categoryWarningPercent').textContent = String(percent);
        warning.classList.remove('d-none');
    } else {
        warning.classList.add('d-none');
    }
}

function getFinalRecords() {
    let records = [...uniqueRecords];

    if (duplicateAction === 'addMarked') {
        const dupsToAdd = duplicateRecords.map(d => ({
            ...d.newRecord,
            isDuplicate: true
        }));
        records = records.concat(dupsToAdd);
    } else if (duplicateAction === 'manual') {
        selectedDuplicates.forEach(index => {
            if (duplicateRecords[index]) {
                records.push({
                    ...duplicateRecords[index].newRecord,
                    isDuplicate: true
                });
            }
        });
    }

    records = records.filter(r => {
        const cat = r.Category || 'غير مصنف';
        return selectedCategories[cat] !== false;
    });

    return records;
}

async function confirmImport() {
    const finalRecords = getFinalRecords();

    if (finalRecords.length === 0) {
        showToast('لا توجد سجلات لإضافتها', 'warning');
        return;
    }

    showLoading(true, 'جاري حفظ البيانات...');

    try {
        const result = await DB.addBulk(finalRecords, 200, function (currentBatch, totalBatches) {
            updateProgress(currentBatch, totalBatches,
                'الدفعة ' + currentBatch + ' من ' + totalBatches
            );
        });

        if (result.failed > 0) {
            console.warn('Import partial failures:', result.errors);
            showToast(
                'تم إضافة ' + formatNumber(result.added) + ' سجل بنجاح، فشل ' + formatNumber(result.failed) + ' سجل',
                result.added > 0 ? 'warning' : 'danger'
            );
        } else {
            showToast('تم إضافة ' + formatNumber(result.added) + ' سجل بنجاح', 'success');
        }

        await DB.addImport({
            date: new Date().toISOString(),
            keyword: document.getElementById('keywordInput').value.trim(),
            country: document.getElementById('countrySelect').value,
            totalInFile: processedRecords.length,
            newRecords: result.added,
            duplicates: duplicateRecords.length,
            failedRecords: result.failed,
            excludedCategories: Object.entries(selectedCategories)
                .filter(([_, v]) => !v)
                .map(([k]) => k)
        });

        announce('تم إضافة ' + result.added + ' سجل إلى قاعدة البيانات');

        resetImport();
        await DB.count();
        await loadImportHistory();
        await updateNavCount();

    } catch (error) {
        console.error('Import error:', error);
        showToast('حدث خطأ أثناء حفظ البيانات: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

function resetSteps() {
    ['stepSummary', 'stepDuplicates', 'stepCategories', 'stepCities', 'stepConfirm'].forEach(id => {
        document.getElementById(id).classList.add('d-none');
    });
}

function resetImport() {
    parsedRecords = [];
    processedRecords = [];
    uniqueRecords = [];
    duplicateRecords = [];
    selectedCategories = {};
    _categoryCounts = {};
    selectedDuplicates = new Set();
    duplicateAction = 'manual';

    _importInProgress = false;
    _pendingLeaveUrl = null;

    removeFile();
    document.getElementById('keywordInput').value = '';
    document.getElementById('countrySelect').value = '';
    resetSteps();

    var prompt2Wrapper = document.getElementById('prompt2OutputWrapper');
    if (prompt2Wrapper) prompt2Wrapper.classList.add('d-none');
}

async function loadImportHistory() {
    try {
        const history = await DB.getAllImports();
        const tbody = document.getElementById('historyBody');
        const empty = document.getElementById('historyEmpty');

        if (history.length === 0) {
            tbody.innerHTML = '';
            empty.classList.remove('d-none');
            return;
        }

        empty.classList.add('d-none');

        const fragment = document.createDocumentFragment();

        history.forEach(imp => {
            const tr = document.createElement('tr');

            const tdDate = document.createElement('td');
            tdDate.textContent = formatDateTime(imp.date);
            tr.appendChild(tdDate);

            const tdKeyword = document.createElement('td');
            const kwBadge = document.createElement('span');
            kwBadge.className = 'badge-keyword';
            kwBadge.textContent = imp.keyword || '-';
            tdKeyword.appendChild(kwBadge);
            tr.appendChild(tdKeyword);

            const tdCountry = document.createElement('td');
            tdCountry.textContent = getCountryNameAr(imp.country);
            tr.appendChild(tdCountry);

            const tdNew = document.createElement('td');
            tdNew.textContent = formatNumber(imp.newRecords);
            tr.appendChild(tdNew);

            const tdDups = document.createElement('td');
            tdDups.textContent = formatNumber(imp.duplicates);
            tr.appendChild(tdDups);

            fragment.appendChild(tr);
        });

        tbody.innerHTML = '';
        tbody.appendChild(fragment);

    } catch (error) {
        console.error('History load error:', error);
    }
}

