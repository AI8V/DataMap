let currentPage = 1;
let totalFilteredCount = 0;
let hasAnyData = false;
const ITEMS_PER_PAGE = 25;

let _searchTimer = null;
const SEARCH_DEBOUNCE = 300;

document.addEventListener('DOMContentLoaded', async function () {
    await initDB();
    await loadData();
});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && _db) {
        loadData();
    }
});

async function loadData() {
    showLoading(true);

    try {
        const stats = await DB.getStats();
        const totalRecords = stats.totalRecords;

        await updateNavCount(totalRecords);

        if (totalRecords === 0) {
            hasAnyData = false;
            showPageEmptyState(true);
            showLoading(false);
            return;
        }

        hasAnyData = true;
        showPageEmptyState(false);

        await updateStatsFromData(stats);
        await populateFilters();
        await fetchAndRenderPage();

    } catch (error) {
        console.error('Load error:', error);
        showToast('حدث خطأ في تحميل البيانات', 'danger');
    } finally {
        showLoading(false);
    }
}

async function refreshAfterChange() {
    try {
        var stats = await DB.getStats();
        var totalRecords = stats.totalRecords;

        updateNavCount(totalRecords);

        if (totalRecords === 0) {
            hasAnyData = false;
            showPageEmptyState(true);
            return;
        }

        updateStatsFromData(stats);
        await populateFilters();
        await fetchAndRenderPage();

    } catch (error) {
        console.error('Refresh error:', error);
        await loadData();
    }
}

function showPageEmptyState(show) {
    const emptyState = document.getElementById('pageEmptyState');
    const mainContent = document.getElementById('mainPageContent');

    if (show) {
        emptyState.classList.remove('d-none');
        mainContent.classList.add('d-none');
    } else {
        emptyState.classList.add('d-none');
        mainContent.classList.remove('d-none');
    }
}

function getCurrentFilters() {
    var phoneVal = document.getElementById('filterPhone');
    var websiteVal = document.getElementById('filterWebsite');
    var reviewsVal = document.getElementById('filterReviews');

    return {
        search: (document.getElementById('searchInput').value || '').trim() || undefined,
        city: _getMultiSelectValues('city') || undefined,
        category: _getMultiSelectValues('category') || undefined,
        keyword: _getMultiSelectValues('keyword') || undefined,
        hasPhone: (phoneVal && phoneVal.value) || undefined,
        hasWebsite: (websiteVal && websiteVal.value) || undefined,
        reviewsRange: (reviewsVal && reviewsVal.value) || undefined
    };
}

function _getMultiSelectValues(filterKey) {
    return MultiSelect.getValues(filterKey + 'FilterWrapper');
}

function getCurrentSort() {
    return document.getElementById('sortBy').value || 'name';
}

async function fetchAndRenderPage() {
    const filters = getCurrentFilters();
    const sortBy = getCurrentSort();

    var tableIndicator = document.getElementById('tableLoadingIndicator');
    if (tableIndicator) tableIndicator.classList.remove('d-none');

    try {
        const result = await DB.getPage(filters, sortBy, currentPage, ITEMS_PER_PAGE);

        totalFilteredCount = result.totalFiltered;
        renderTable(result.records);
        renderPagination();

    } catch (error) {
        console.error('Fetch page error:', error);
        showToast('حدث خطأ في جلب البيانات', 'danger');
    } finally {
        if (tableIndicator) tableIndicator.classList.add('d-none');
    }
}

async function updateStats() {
    const stats = await DB.getStats();
    updateStatsFromData(stats);
}

function updateStatsFromData(stats) {
    document.getElementById('totalRecords').textContent = formatNumber(stats.totalRecords);
    document.getElementById('totalCities').textContent = formatNumber(stats.totalCities);
    document.getElementById('totalCategories').textContent = formatNumber(stats.totalCategories);
    document.getElementById('totalKeywords').textContent = formatNumber(stats.totalKeywords);
    document.getElementById('avgRating').textContent = stats.avgRating;
    document.getElementById('totalReviews').textContent = formatNumber(stats.totalReviews);
}

async function populateFilters() {
    var currentCity = _getMultiSelectValues('city');
    var currentCategory = _getMultiSelectValues('category');
    var currentKeyword = _getMultiSelectValues('keyword');

    var phoneEl = document.getElementById('filterPhone');
    var websiteEl = document.getElementById('filterWebsite');
    var reviewsEl = document.getElementById('filterReviews');
    var advancedFilters = {};
    if (phoneEl && phoneEl.value) advancedFilters.hasPhone = phoneEl.value;
    if (websiteEl && websiteEl.value) advancedFilters.hasWebsite = websiteEl.value;
    if (reviewsEl && reviewsEl.value) advancedFilters.reviewsRange = reviewsEl.value;

    var cityOptions, categoryOptions, keywordOptions;
    var cityCounts, categoryCounts, keywordCounts;

    try {
        var cityFilters = Object.assign({}, advancedFilters);
        if (currentCategory && currentCategory.length > 0) cityFilters.category = currentCategory;
        if (currentKeyword && currentKeyword.length > 0) cityFilters.keyword = currentKeyword;
        var cityResult = await DB.getFilteredOptions(cityFilters);
        cityOptions = cityResult.cities;
        cityCounts = cityResult.cityCounts;

        var catFilters = Object.assign({}, advancedFilters);
        if (currentCity && currentCity.length > 0) catFilters.city = currentCity;
        if (currentKeyword && currentKeyword.length > 0) catFilters.keyword = currentKeyword;
        var catResult = await DB.getFilteredOptions(catFilters);
        categoryOptions = catResult.categories;
        categoryCounts = catResult.categoryCounts;

        var kwFilters = Object.assign({}, advancedFilters);
        if (currentCity && currentCity.length > 0) kwFilters.city = currentCity;
        if (currentCategory && currentCategory.length > 0) kwFilters.category = currentCategory;
        var kwResult = await DB.getFilteredOptions(kwFilters);
        keywordOptions = kwResult.keywords;
        keywordCounts = kwResult.keywordCounts;
    } catch (error) {
        console.error('Cascading filter error:', error);
        var stats = await DB.getStats();
        cityOptions = stats.cities;
        categoryOptions = stats.categories;
        keywordOptions = stats.keywords;
        cityCounts = null;
        categoryCounts = null;
        keywordCounts = null;
    }

    if (currentCity) {
        currentCity = currentCity.filter(function (v) { return cityOptions.indexOf(v) !== -1; });
        if (currentCity.length === 0) currentCity = null;
    }
    if (currentCategory) {
        currentCategory = currentCategory.filter(function (v) { return categoryOptions.indexOf(v) !== -1; });
        if (currentCategory.length === 0) currentCategory = null;
    }
    if (currentKeyword) {
        currentKeyword = currentKeyword.filter(function (v) { return keywordOptions.indexOf(v) !== -1; });
        if (currentKeyword.length === 0) currentKeyword = null;
    }

    _buildMultiSelectOptions('city', cityOptions, currentCity, 'جميع المدن', cityCounts);
    _buildMultiSelectOptions('category', categoryOptions, currentCategory, 'جميع التصنيفات', categoryCounts);
    _buildMultiSelectOptions('keyword', keywordOptions, currentKeyword, 'جميع الكلمات', keywordCounts);
}

function _buildMultiSelectOptions(filterKey, options, selectedValues, defaultText, counts) {
    MultiSelect.build(filterKey + 'FilterWrapper', options, selectedValues, defaultText, function () {
        _applyFilterChange();
    }, counts || undefined);
}

let _filterGeneration = 0;

async function _applyFilterChange() {
    var gen = ++_filterGeneration;
    currentPage = 1;

    try {
        await fetchAndRenderPage();
        if (gen !== _filterGeneration) return;

        await populateFilters();
    } catch (error) {
        if (gen === _filterGeneration) {
            console.error('Filter change error:', error);
        }
    }
}

function _toggleMultiOption(filterKey, optionEl) {
    var defaultTexts = { city: 'جميع المدن', category: 'جميع التصنيفات', keyword: 'جميع الكلمات' };
    MultiSelect.toggle(filterKey + 'FilterWrapper', optionEl, defaultTexts[filterKey], function () {
        _applyFilterChange();
    });
}

function _updateMultiToggle(filterKey, defaultText) {
    MultiSelect.updateToggle(filterKey + 'FilterWrapper', defaultText);
}

function multiSelectAll(filterKey) {
    var wrapperId = filterKey + 'FilterWrapper';
    var wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    wrapper.querySelectorAll('.multi-select-option').forEach(function (opt) {
        opt.classList.add('selected');
        opt.setAttribute('aria-selected', 'true');
        opt.querySelector('.form-check-input').checked = true;
    });

    var defaultTexts = { city: 'جميع المدن', category: 'جميع التصنيفات', keyword: 'جميع الكلمات' };
    MultiSelect.updateToggle(wrapperId, defaultTexts[filterKey]);
    _applyFilterChange();
}

function multiClearAll(filterKey) {
    var defaultTexts = { city: 'جميع المدن', category: 'جميع التصنيفات', keyword: 'جميع الكلمات' };
    MultiSelect.clearAll(filterKey + 'FilterWrapper', defaultTexts[filterKey], function () {
        _applyFilterChange();
    });
}

function handleSearch() {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(function () {
        _applyFilterChange();
    }, SEARCH_DEBOUNCE);
}

function handleSort() {
    currentPage = 1;
    fetchAndRenderPage();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = 'name';

    var filterPhone = document.getElementById('filterPhone');
    if (filterPhone) filterPhone.value = '';
    var filterWebsite = document.getElementById('filterWebsite');
    if (filterWebsite) filterWebsite.value = '';
    var filterReviews = document.getElementById('filterReviews');
    if (filterReviews) filterReviews.value = '';

    var websiteNote = document.getElementById('websiteFilterNote');
    if (websiteNote) websiteNote.classList.add('d-none');

    var defaultTexts = { city: 'جميع المدن', category: 'جميع التصنيفات', keyword: 'جميع الكلمات' };
    ['city', 'category', 'keyword'].forEach(function (key) {
        MultiSelect.clearAll(key + 'FilterWrapper', defaultTexts[key]);
    });

    _applyFilterChange();
    showToast('تم إعادة تعيين الفلاتر', 'info');
}

function handleAdvancedFilter() {
    var websiteSelect = document.getElementById('filterWebsite');
    var websiteNote = document.getElementById('websiteFilterNote');
    if (websiteSelect && websiteNote) {
        if (websiteSelect.value === 'no') {
            websiteNote.classList.remove('d-none');
            websiteNote.style.display = 'block';
        } else {
            websiteNote.classList.add('d-none');
        }
    }

    _applyFilterChange();
}

function renderTable(pageData) {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('filteredCount');

    countEl.textContent = formatNumber(totalFilteredCount) + ' نتيجة';

    if (!pageData || pageData.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('d-none');
        document.getElementById('paginationContainer').classList.add('d-none');
        return;
    }

    emptyState.classList.add('d-none');
    document.getElementById('paginationContainer').classList.remove('d-none');

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const fragment = document.createDocumentFragment();

    pageData.forEach((record, index) => {
        const safeId = parseInt(record.id);
        if (isNaN(safeId)) return;

        const rowNum = start + index + 1;
        const tr = document.createElement('tr');

        const tdCheck = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input row-check';
        checkbox.dataset.id = String(safeId);
        checkbox.setAttribute('aria-label', 'تحديد ' + (record.Name || ''));
        checkbox.addEventListener('change', updateDeleteButton);
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);

        const tdNum = document.createElement('td');
        const numBadge = document.createElement('span');
        numBadge.className = 'badge bg-secondary';
        numBadge.textContent = rowNum;
        tdNum.appendChild(numBadge);
        tr.appendChild(tdNum);

        const tdName = document.createElement('td');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'fw-bold';
        nameSpan.textContent = record.Name || '-';
        tdName.appendChild(nameSpan);

        if (record.Website) {
            const br = document.createElement('br');
            const websiteSmall = document.createElement('small');
            websiteSmall.className = 'text-muted';
            const globeIcon = document.createElement('i');
            globeIcon.className = 'bi bi-globe ms-1';
            globeIcon.setAttribute('aria-hidden', 'true');
            websiteSmall.appendChild(globeIcon);
            websiteSmall.appendChild(document.createTextNode(truncate(record.Website, 25)));
            tdName.appendChild(br);
            tdName.appendChild(websiteSmall);
        }
        tr.appendChild(tdName);

        const tdCity = document.createElement('td');
        const citySpan = document.createElement('span');
        citySpan.className = 'd-flex align-items-center';
        const cityIcon = document.createElement('i');
        cityIcon.className = 'bi bi-geo-alt text-info ms-1';
        cityIcon.setAttribute('aria-hidden', 'true');
        citySpan.appendChild(cityIcon);
        citySpan.appendChild(document.createTextNode(record.cityExtracted || '-'));
        tdCity.appendChild(citySpan);
        tr.appendChild(tdCity);

        const tdPhone = document.createElement('td');
        const phoneEl = createPhoneLink(record.Phone, {
            className: 'phone-link',
            ariaLabel: 'اتصال بـ ' + (record.Phone || '')
        });
        tdPhone.appendChild(phoneEl);
        tr.appendChild(tdPhone);

        const tdCat = document.createElement('td');
        const catBadge = document.createElement('span');
        catBadge.className = 'badge-category';
        catBadge.textContent = record.Category || '-';
        tdCat.appendChild(catBadge);
        tr.appendChild(tdCat);

        const tdRating = document.createElement('td');
        const ratingBadge = document.createElement('span');
        ratingBadge.className = 'rating-badge';
        ratingBadge.setAttribute('aria-label', 'التقييم ' + (record.Rating || '0') + ' من 5');
        const starIcon = document.createElement('i');
        starIcon.className = 'bi bi-star-fill ms-1';
        starIcon.setAttribute('aria-hidden', 'true');
        ratingBadge.appendChild(starIcon);
        ratingBadge.appendChild(document.createTextNode(record.Rating ? String(record.Rating) : '0'));
        tdRating.appendChild(ratingBadge);
        tr.appendChild(tdRating);

        const tdReviews = document.createElement('td');
        tdReviews.textContent = formatNumber(record.Reviews || 0);
        tr.appendChild(tdReviews);

        const tdActions = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'd-flex gap-1';
        actionsDiv.setAttribute('role', 'group');
        actionsDiv.setAttribute('aria-label', 'إجراءات');

        const btnView = document.createElement('button');
        btnView.className = 'btn-action btn-view';
        btnView.setAttribute('aria-label', 'عرض ' + (record.Name || ''));
        btnView.addEventListener('click', () => viewRecord(safeId));
        const viewIcon = document.createElement('i');
        viewIcon.className = 'bi bi-eye';
        viewIcon.setAttribute('aria-hidden', 'true');
        btnView.appendChild(viewIcon);
        actionsDiv.appendChild(btnView);

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-action btn-edit';
        btnEdit.setAttribute('aria-label', 'تعديل ' + (record.Name || ''));
        btnEdit.addEventListener('click', () => editRecord(safeId));
        const editIcon = document.createElement('i');
        editIcon.className = 'bi bi-pencil';
        editIcon.setAttribute('aria-hidden', 'true');
        btnEdit.appendChild(editIcon);
        actionsDiv.appendChild(btnEdit);

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-action btn-delete';
        btnDelete.setAttribute('aria-label', 'حذف ' + (record.Name || ''));
        btnDelete.addEventListener('click', () => deleteRecord(safeId));
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'bi bi-trash3';
        deleteIcon.setAttribute('aria-hidden', 'true');
        btnDelete.appendChild(deleteIcon);
        actionsDiv.appendChild(btnDelete);

        tdActions.appendChild(actionsDiv);
        tr.appendChild(tdActions);

        fragment.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

function renderPagination() {
    const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    const fragment = document.createDocumentFragment();

    fragment.appendChild(createPageItem(
        currentPage - 1,
        null,
        'السابق',
        'bi-chevron-right',
        currentPage === 1
    ));

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        fragment.appendChild(createPageItem(1, '1'));
        if (startPage > 2) {
            fragment.appendChild(createEllipsis());
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        fragment.appendChild(createPageItem(i, String(i), null, null, false, i === currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            fragment.appendChild(createEllipsis());
        }
        fragment.appendChild(createPageItem(totalPages, String(totalPages)));
    }

    fragment.appendChild(createPageItem(
        currentPage + 1,
        null,
        'التالي',
        'bi-chevron-left',
        currentPage === totalPages
    ));

    pagination.innerHTML = '';
    pagination.appendChild(fragment);
}

function createPageItem(page, text, ariaLabel, iconClass, disabled, active) {
    const li = document.createElement('li');
    li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');

    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';

    if (ariaLabel) a.setAttribute('aria-label', ariaLabel);
    if (active) a.setAttribute('aria-current', 'page');
    if (disabled) a.tabIndex = -1;

    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = 'bi ' + iconClass;
        icon.setAttribute('aria-hidden', 'true');
        a.appendChild(icon);
    } else {
        a.textContent = text;
    }

    a.addEventListener('click', function (e) {
        e.preventDefault();
        if (!disabled) goToPage(page);
    });

    li.appendChild(a);
    return li;
}

function createEllipsis() {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    const span = document.createElement('span');
    span.className = 'page-link';
    span.textContent = '...';
    li.appendChild(span);
    return li;
}

function goToPage(page) {
    const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    fetchAndRenderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    document.querySelectorAll('.row-check').forEach(cb => {
        cb.checked = selectAll.checked;
    });
    updateDeleteButton();
}

function updateDeleteButton() {
    const checked = document.querySelectorAll('.row-check:checked');
    const btn = document.getElementById('btnDeleteSelected');
    if (checked.length > 0) {
        btn.classList.remove('d-none');
        btn.innerHTML = `<i class="bi bi-trash3 ms-1" aria-hidden="true"></i> حذف المحدد (${parseInt(checked.length)})`;
    } else {
        btn.classList.add('d-none');
    }
}

async function deleteSelected() {
    var checked = document.querySelectorAll('.row-check:checked');
    var ids = Array.from(checked).map(function (cb) {
        return parseInt(cb.dataset.id);
    }).filter(function (id) {
        return !isNaN(id);
    });

    if (ids.length === 0) return;

    document.getElementById('bulkDeleteCount').textContent = formatNumber(ids.length);

    var modal = new bootstrap.Modal(document.getElementById('bulkDeleteModal'));
    modal.show();

    var btn = document.getElementById('btnConfirmBulkDelete');
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async function () {
        modal.hide();
        showLoading(true);
        try {
            await DB.deleteBulk(ids);
            showToast('تم حذف ' + formatNumber(ids.length) + ' سجل بنجاح', 'success');
            await refreshAfterChange();
        } catch (error) {
            showToast('حدث خطأ أثناء الحذف', 'danger');
        } finally {
            showLoading(false);
        }
    });
}

async function viewRecord(id) {
    const safeId = parseInt(id);
    if (isNaN(safeId)) return;

    const record = await DB.getById(safeId);
    if (!record) return;

    const body = document.getElementById('viewModalBody');
    const mapBtn = document.getElementById('btnOpenMap');

    var mapsUrl = buildGoogleMapsUrl(record);
    if (mapsUrl) {
        mapBtn.href = mapsUrl;
        mapBtn.classList.remove('d-none');
    } else {
        mapBtn.classList.add('d-none');
    }

    body.innerHTML = '';
    body.appendChild(buildViewModalDOM(record));

    new bootstrap.Modal(document.getElementById('viewModal')).show();
}

function buildViewModalDOM(record) {
    const container = document.createElement('div');
    container.className = 'row';

    const leftCol = document.createElement('div');
    leftCol.className = 'col-md-8';

    const title = document.createElement('h3');
    title.className = 'detail-title';
    const titleIcon = document.createElement('i');
    titleIcon.className = 'bi bi-building ms-2';
    titleIcon.setAttribute('aria-hidden', 'true');
    title.appendChild(titleIcon);
    title.appendChild(document.createTextNode(record.Name || '-'));
    leftCol.appendChild(title);

    leftCol.appendChild(buildBasicInfoDOM(record));
    leftCol.appendChild(buildContactDOM(record));
    leftCol.appendChild(buildBusinessInfoDOM(record));

    const servicesSection = buildServicesDOM(record);
    if (servicesSection) leftCol.appendChild(servicesSection);

    leftCol.appendChild(buildReviewsDOM(record));

    container.appendChild(leftCol);

    const rightCol = document.createElement('div');
    rightCol.className = 'col-md-4';

    const img = createSafeImage(record['Image URL'], 'صورة ' + (record.Name || ''), {
        className: 'business-image'
    });
    if (img) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'business-image-container';
        imgContainer.appendChild(img);
        rightCol.appendChild(imgContainer);
    }

    const ratingBox = document.createElement('div');
    ratingBox.className = 'rating-box';

    const starsDiv = document.createElement('div');
    starsDiv.className = 'rating-stars';
    starsDiv.setAttribute('aria-hidden', 'true');
    starsDiv.appendChild(createStarRating(record.Rating));
    ratingBox.appendChild(starsDiv);

    const ratingValue = document.createElement('p');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = record.Rating || '0';
    ratingBox.appendChild(ratingValue);

    const ratingCount = document.createElement('p');
    ratingCount.className = 'rating-count';
    ratingCount.textContent = formatNumber(record.Reviews || 0) + ' مراجعة';
    ratingBox.appendChild(ratingCount);

    rightCol.appendChild(ratingBox);

    if (record.Lat && record.Long) {
        const lat = parseFloat(record.Lat);
        const lng = parseFloat(record.Long);
        if (!isNaN(lat) && !isNaN(lng)) {
            const coordsDiv = document.createElement('div');
            coordsDiv.className = 'detail-meta mt-3';
            const coordsSmall = document.createElement('small');
            coordsSmall.className = 'text-muted';
            const pinIcon = document.createElement('i');
            pinIcon.className = 'bi bi-pin-map ms-1';
            coordsSmall.appendChild(pinIcon);
            coordsSmall.appendChild(document.createTextNode(' ' + lat + ', ' + lng));
            coordsDiv.appendChild(coordsSmall);
            rightCol.appendChild(coordsDiv);
        }
    }

    container.appendChild(rightCol);
    return container;
}

function buildBasicInfoDOM(record) {
    const section = createDetailSection('المعلومات الأساسية');
    const grid = document.createElement('div');
    grid.className = 'detail-grid';

    grid.appendChild(createDetailItem('العنوان', record.Address || '-'));

    if (record['Street Address']) {
        grid.appendChild(createDetailItem('عنوان الشارع', record['Street Address']));
    }

    grid.appendChild(createDetailItem('المدينة', record.cityExtracted || '-'));

    if (record.State) {
        grid.appendChild(createDetailItem('المنطقة', record.State));
    }

    if (record.ZipCode) {
        grid.appendChild(createDetailItem('الرمز البريدي', record.ZipCode));
    }

    const catItem = createDetailItem('التصنيف', '');
    const catBadge = document.createElement('span');
    catBadge.className = 'badge-category';
    catBadge.textContent = record.Category || '-';
    catItem.querySelector('.detail-value').textContent = '';
    catItem.querySelector('.detail-value').appendChild(catBadge);
    grid.appendChild(catItem);

    const kwItem = createDetailItem('الكلمة المفتاحية', '');
    const kwBadge = document.createElement('span');
    kwBadge.className = 'badge-keyword';
    kwBadge.textContent = record.keyword || '-';
    kwItem.querySelector('.detail-value').textContent = '';
    kwItem.querySelector('.detail-value').appendChild(kwBadge);
    grid.appendChild(kwItem);

    section.appendChild(grid);
    return section;
}

function buildContactDOM(record) {
    const section = createDetailSection('معلومات الاتصال');
    const grid = document.createElement('div');
    grid.className = 'detail-grid';

    const phoneItem = createDetailItem('الهاتف', '');
    phoneItem.querySelector('.detail-value').textContent = '';
    phoneItem.querySelector('.detail-value').appendChild(
        createPhoneLink(record.Phone, { className: 'phone-link' })
    );
    grid.appendChild(phoneItem);

    const webItem = createDetailItem('الموقع', '');
    webItem.querySelector('.detail-value').textContent = '';
    if (record.Website) {
        webItem.querySelector('.detail-value').appendChild(
            createSafeLink(record.Website, truncate(record.Website, 40), {
                className: 'link-primary',
                target: '_blank'
            })
        );
    } else {
        webItem.querySelector('.detail-value').textContent = '-';
    }
    grid.appendChild(webItem);

    if (record.Menu) {
        const menuItem = createDetailItem('القائمة', '');
        menuItem.querySelector('.detail-value').textContent = '';
        menuItem.querySelector('.detail-value').appendChild(
            createSafeLink(record.Menu, 'عرض', { target: '_blank' })
        );
        grid.appendChild(menuItem);
    }

    if (record['Book Online']) {
        const bookItem = createDetailItem('الحجز', '');
        bookItem.querySelector('.detail-value').textContent = '';
        bookItem.querySelector('.detail-value').appendChild(
            createSafeLink(record['Book Online'], 'حجز', { target: '_blank' })
        );
        grid.appendChild(bookItem);
    }

    section.appendChild(grid);
    return section;
}

function buildBusinessInfoDOM(record) {
    const section = createDetailSection('معلومات النشاط');
    const grid = document.createElement('div');
    grid.className = 'detail-grid';

    if (record['Listing Type']) {
        grid.appendChild(createDetailItem('نوع القائمة', record['Listing Type']));
    }

    if (record['Price Range']) {
        grid.appendChild(createDetailItem('نطاق الأسعار', record['Price Range']));
    }

    const verifiedItem = createDetailItem('تحقق التاجر', '');
    const verifiedSpan = document.createElement('span');
    if (record['Merchant Verified'] === 'Yes') {
        verifiedSpan.className = 'text-success';
        verifiedSpan.textContent = '✓ متحقق';
    } else {
        verifiedSpan.className = 'text-muted';
        verifiedSpan.textContent = 'غير متحقق';
    }
    verifiedItem.querySelector('.detail-value').textContent = '';
    verifiedItem.querySelector('.detail-value').appendChild(verifiedSpan);
    grid.appendChild(verifiedItem);

    const statusItem = createDetailItem('حالة النشاط', '');
    const statusSpan = document.createElement('span');
    if (record['Permanently Closed'] === 'Yes') {
        statusSpan.className = 'text-danger';
        statusSpan.textContent = 'مغلق نهائياً';
    } else if (record['Temporarily Closed'] === 'Yes') {
        statusSpan.className = 'text-warning';
        statusSpan.textContent = 'مغلق مؤقتاً';
    } else {
        statusSpan.className = 'text-success';
        statusSpan.textContent = 'مفتوح';
    }
    statusItem.querySelector('.detail-value').textContent = '';
    statusItem.querySelector('.detail-value').appendChild(statusSpan);
    grid.appendChild(statusItem);

    if (record.Hours) {
        grid.appendChild(createDetailItem('ساعات العمل', record.Hours, true));
    }

    if (record.Description) {
        grid.appendChild(createDetailItem('الوصف', record.Description, true));
    }

    section.appendChild(grid);
    return section;
}

function buildServicesDOM(record) {
    const services = [];
    if (record['Dine-In'] === 'Yes') services.push({ text: 'طعام داخلي', cls: 'bg-success' });
    if (record.Takeout === 'Yes') services.push({ text: 'استلام', cls: 'bg-info' });
    if (record.Delivery === 'Yes') services.push({ text: 'توصيل', cls: 'bg-primary' });

    if (services.length === 0) return null;

    const section = createDetailSection('الخدمات');
    const container = document.createElement('div');
    container.className = 'd-flex gap-2 flex-wrap';

    services.forEach(svc => {
        const badge = document.createElement('span');
        badge.className = 'badge ' + svc.cls;
        badge.textContent = svc.text;
        container.appendChild(badge);
    });

    section.appendChild(container);
    return section;
}

function buildReviewsDOM(record) {
    const section = createDetailSection('المراجعات');

    let hasReviews = false;

    for (let num = 1; num <= 3; num++) {
        const text = record['Review ' + num + ' Text'];
        if (!text) continue;

        hasReviews = true;

        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'd-flex justify-content-between align-items-center mb-1';

        const score = record['Review ' + num + ' Score'];
        const date = record['Review ' + num + ' Date'];
        const scoreClass = getScoreClass(parseFloat(score));

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'review-score ' + scoreClass;
        const scoreStar = document.createElement('i');
        scoreStar.className = 'bi bi-star-fill ms-1';
        scoreSpan.appendChild(scoreStar);
        scoreSpan.appendChild(document.createTextNode(score || '-'));
        headerDiv.appendChild(scoreSpan);

        const dateSmall = document.createElement('small');
        dateSmall.className = 'text-muted';
        dateSmall.textContent = date || '-';
        headerDiv.appendChild(dateSmall);

        reviewDiv.appendChild(headerDiv);

        const textP = document.createElement('p');
        textP.className = 'mb-0 small';
        textP.textContent = text;
        reviewDiv.appendChild(textP);

        section.appendChild(reviewDiv);
    }

    if (!hasReviews) {
        const noReviews = document.createElement('p');
        noReviews.className = 'text-muted';
        noReviews.textContent = 'لا توجد مراجعات';
        section.appendChild(noReviews);
    }

    return section;
}

function createDetailSection(title) {
    const section = document.createElement('div');
    section.className = 'detail-section';

    const h4 = document.createElement('h4');
    h4.className = 'detail-section-title';
    h4.textContent = title;
    section.appendChild(h4);

    return section;
}

function createDetailItem(label, value, fullWidth) {
    const item = document.createElement('div');
    item.className = 'detail-item' + (fullWidth ? ' full-width' : '');

    const labelSpan = document.createElement('span');
    labelSpan.className = 'detail-label';
    labelSpan.textContent = label;
    item.appendChild(labelSpan);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'detail-value';
    valueSpan.textContent = value;
    item.appendChild(valueSpan);

    return item;
}

async function editRecord(id) {
    const safeId = parseInt(id);
    if (isNaN(safeId)) return;

    const record = await DB.getById(safeId);
    if (!record) return;

    document.getElementById('editRecordId').value = record.id;
    document.getElementById('editName').value = record.Name || '';
    document.getElementById('editCategory').value = record.Category || '';
    document.getElementById('editAddress').value = record.Address || '';
    document.getElementById('editCity').value = record.cityExtracted || '';
    document.getElementById('editPhone').value = record.Phone || '';
    document.getElementById('editWebsite').value = record.Website || '';
    document.getElementById('editRating').value = record.Rating ? String(record.Rating) : '';
    document.getElementById('editReviews').value = record.Reviews ? String(record.Reviews) : '';
    document.getElementById('editKeyword').value = record.keyword || '';

    new bootstrap.Modal(document.getElementById('editModal')).show();
}

async function saveEdit() {
    const id = parseInt(document.getElementById('editRecordId').value);
    if (isNaN(id)) return;

    const record = await DB.getById(id);
    if (!record) return;

    record.Name = document.getElementById('editName').value;
    record.Category = document.getElementById('editCategory').value;
    record.Address = document.getElementById('editAddress').value;
    record.cityExtracted = document.getElementById('editCity').value;
    record.Phone = document.getElementById('editPhone').value;
    record.Website = document.getElementById('editWebsite').value;
    var ratingVal = parseFloat(document.getElementById('editRating').value);
    record.Rating = isNaN(ratingVal) ? 0 : Math.round(Math.min(5, Math.max(0, ratingVal)) * 10) / 10;

    var reviewsVal = parseInt(document.getElementById('editReviews').value);
    record.Reviews = isNaN(reviewsVal) ? 0 : Math.max(0, reviewsVal);

    record.keyword = document.getElementById('editKeyword').value;

    showLoading(true);
    try {
        await DB.update(record);
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        showToast('تم تحديث السجل بنجاح', 'success');
        await refreshAfterChange();
    } catch (error) {
        showToast('حدث خطأ أثناء التحديث', 'danger');
    } finally {
        showLoading(false);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.multi-select-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var wrapper = toggle.closest('.multi-select-wrapper');
            var dropdown = wrapper.querySelector('.multi-select-dropdown');
            var isOpen = dropdown.classList.contains('show');

            document.querySelectorAll('.multi-select-dropdown.show').forEach(function (d) {
                d.classList.remove('show');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').classList.remove('open');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                dropdown.classList.add('show');
                toggle.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
                var searchInput = dropdown.querySelector('.multi-select-search input');
                if (searchInput) {
                    setTimeout(function () { searchInput.focus(); }, 50);
                }
            }
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.multi-select-wrapper')) {
            document.querySelectorAll('.multi-select-dropdown.show').forEach(function (d) {
                d.classList.remove('show');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').classList.remove('open');
                d.closest('.multi-select-wrapper').querySelector('.multi-select-toggle').setAttribute('aria-expanded', 'false');
            });
        }
    });

    document.querySelectorAll('.multi-select-search input').forEach(function (input) {
        input.addEventListener('input', function () {
            var query = this.value.toLowerCase();
            var options = this.closest('.multi-select-dropdown').querySelectorAll('.multi-select-option');
            options.forEach(function (opt) {
                var text = opt.dataset.value.toLowerCase();
                opt.style.display = text.includes(query) ? '' : 'none';
            });
        });

        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });

    document.querySelectorAll('.multi-select-dropdown').forEach(function (dropdown) {
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });
});

function deleteRecord(id) {
    const safeId = parseInt(id);
    if (isNaN(safeId)) return;

    document.getElementById('deleteRecordId').value = safeId;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function confirmDelete() {
    const id = parseInt(document.getElementById('deleteRecordId').value);
    if (isNaN(id)) return;

    showLoading(true);
    try {
        await DB.delete(id);
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        showToast('تم حذف السجل بنجاح', 'success');
        await refreshAfterChange();
    } catch (error) {
        showToast('حدث خطأ أثناء الحذف', 'danger');
    } finally {
        showLoading(false);
    }
}

