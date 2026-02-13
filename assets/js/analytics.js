let analyticsAggData = null;
let selectedKeywords = new Set();
let selectedCities = new Set();
let cityChart = null;
let categoryChart = null;
let ratingChart = null;

document.addEventListener('DOMContentLoaded', async function () {
    await initDB();
    await loadAnalytics();
});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && _db) {
        loadAnalytics();
    }
});

async function loadAnalytics() {
    showLoading(true, 'جاري تحميل التحليلات...');

    try {
        const stats = await DB.getStats();
        updateNavCount(stats.totalRecords);

        if (stats.totalRecords === 0) {
            showEmptyState(true);
            showLoading(false);
            return;
        }

        showEmptyState(false);

        var totalEstimate = stats.totalRecords;
        updateProgress(0, totalEstimate, 'جاري تجميع البيانات... 0 من ' + formatNumber(totalEstimate));

        analyticsAggData = await DB.getAnalyticsData(function (processed) {
            updateProgress(processed, totalEstimate,
                'جاري تجميع البيانات... ' + formatNumber(processed) + ' من ' + formatNumber(totalEstimate)
            );
        });

        updateProgress(totalEstimate, totalEstimate, 'جاري عرض النتائج...');

        renderFilters();

        requestAnimationFrame(() => {
            applyFiltersAndRender();
            showLoading(false);
        });

    } catch (error) {
        console.error('Analytics load error:', error);
        showToast('حدث خطأ في تحميل التحليلات', 'danger');
        showLoading(false);
    }
}

function aggregateFiltered() {
    var cells = Object.values(analyticsAggData.cellMap);
    var filterByKeyword = selectedKeywords.size > 0;
    var filterByCity = selectedCities.size > 0;

    var totalRecords = 0;
    var totalRatingSum = 0;
    var totalRatingCount = 0;
    var totalNoWebsite = 0;
    var totalLowRated = 0;

    var cityCounts = {};
    var categoryCounts = {};
    var cityRatingMap = {};
    var crossData = {};
    var cityTotals = {};
    var ratingBuckets = [0, 0, 0, 0, 0, 0];
    var keywordsInView = new Set();
    var citiesInView = new Set();
    var categoriesInView = new Set();
    var keywordStats = {};

    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];

        if (filterByKeyword && !selectedKeywords.has(cell.keyword)) continue;
        if (filterByCity && !selectedCities.has(cell.city)) continue;

        totalRecords += cell.count;
        totalRatingSum += cell.ratingSum;
        totalRatingCount += cell.ratingCount;
        totalNoWebsite += cell.noWebsite;
        totalLowRated += cell.lowRated;

        if (cell.keyword) keywordsInView.add(cell.keyword);
        citiesInView.add(cell.city);

        cityCounts[cell.city] = (cityCounts[cell.city] || 0) + cell.count;
        cityTotals[cell.city] = (cityTotals[cell.city] || 0) + cell.count;

        if (cell.ratingCount > 0) {
            if (!cityRatingMap[cell.city]) cityRatingMap[cell.city] = { sum: 0, count: 0 };
            cityRatingMap[cell.city].sum += cell.ratingSum;
            cityRatingMap[cell.city].count += cell.ratingCount;
        }

        for (var b = 0; b < 6; b++) {
            ratingBuckets[b] += cell.ratingBuckets[b];
        }

        for (var cat in cell.categories) {
            var catCount = cell.categories[cat];
            categoryCounts[cat] = (categoryCounts[cat] || 0) + catCount;
            categoriesInView.add(cat);
            var crossKey = cat + '|||' + cell.city;
            crossData[crossKey] = (crossData[crossKey] || 0) + catCount;
        }

        if (cell.keyword) {
            if (!keywordStats[cell.keyword]) {
                keywordStats[cell.keyword] = { count: 0, cities: new Set(), ratingSum: 0, ratingCount: 0 };
            }
            var kwStat = keywordStats[cell.keyword];
            kwStat.count += cell.count;
            kwStat.cities.add(cell.city);
            kwStat.ratingSum += cell.ratingSum;
            kwStat.ratingCount += cell.ratingCount;
        }
    }

    var avgRating = totalRatingCount > 0
        ? (totalRatingSum / totalRatingCount).toFixed(1)
        : '0';

    var keywordComparison = {};
    for (var kw in keywordStats) {
        var s = keywordStats[kw];
        keywordComparison[kw] = {
            count: s.count,
            cityCount: s.cities.size,
            avgRating: s.ratingCount > 0
                ? (s.ratingSum / s.ratingCount).toFixed(1)
                : '-'
        };
    }

    return {
        totalRecords: totalRecords,
        avgRating: avgRating,
        totalRatingSum: totalRatingSum,
        totalRatingCount: totalRatingCount,
        totalNoWebsite: totalNoWebsite,
        totalLowRated: totalLowRated,
        cityCounts: cityCounts,
        categoryCounts: categoryCounts,
        cityRatingMap: cityRatingMap,
        crossData: crossData,
        cityTotals: cityTotals,
        ratingBuckets: ratingBuckets,
        keywords: Array.from(keywordsInView).sort(),
        cities: Array.from(citiesInView).sort(),
        categories: Array.from(categoriesInView).sort(),
        keywordComparison: keywordComparison
    };
}

function getAvailableValues() {
    var cells = Object.values(analyticsAggData.cellMap);
    var filterByKeyword = selectedKeywords.size > 0;
    var filterByCity = selectedCities.size > 0;

    var availableKeywords = {};
    var availableCities = {};

    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];

        if (!filterByCity || selectedCities.has(cell.city)) {
            if (cell.keyword) {
                availableKeywords[cell.keyword] = (availableKeywords[cell.keyword] || 0) + cell.count;
            }
        }

        if (!filterByKeyword || selectedKeywords.has(cell.keyword)) {
            availableCities[cell.city] = (availableCities[cell.city] || 0) + cell.count;
        }
    }

    return {
        keywords: availableKeywords,
        cities: availableCities
    };
}

function renderFilters() {
    var available = getAvailableValues();

    renderFilterChips('keyword', available.keywords, selectedKeywords);
    renderFilterChips('city', available.cities, selectedCities);
    renderActiveFiltersBar();

    var kwSearch = document.getElementById('keywordChipsSearch');
    if (kwSearch) {
        kwSearch.classList.toggle('show', Object.keys(available.keywords).length > 6);
    }
    var citySearch = document.getElementById('cityChipsSearch');
    if (citySearch) {
        citySearch.classList.toggle('show', Object.keys(available.cities).length > 6);
    }
}

function renderFilterChips(type, optionsMap, selectedSet) {
    var container = document.getElementById(type + 'Chips');
    if (!container) return;

    var sorted = Object.entries(optionsMap).sort(function (a, b) { return b[1] - a[1]; });
    var countEl = document.getElementById(type + 'FilterCount');

    if (countEl) {
        if (selectedSet.size > 0) {
            countEl.textContent = selectedSet.size + ' من ' + sorted.length;
        } else {
            countEl.textContent = sorted.length + ' متاح';
        }
    }

    var fragment = document.createDocumentFragment();

    sorted.forEach(function (entry) {
        var value = entry[0];
        var count = entry[1];
        var isActive = selectedSet.has(value);

        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (isActive ? ' active' : '');
        chip.dataset.type = type;
        chip.dataset.value = value;
        chip.setAttribute('aria-pressed', String(isActive));

        var labelSpan = document.createElement('span');
        labelSpan.textContent = value;

        var countSpan = document.createElement('span');
        countSpan.className = 'chip-count';
        countSpan.textContent = count;

        chip.appendChild(labelSpan);
        chip.appendChild(countSpan);

        chip.addEventListener('click', function () {
            toggleChip(type, value);
        });

        fragment.appendChild(chip);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

function toggleChip(type, value) {
    var selectedSet = type === 'keyword' ? selectedKeywords : selectedCities;

    if (selectedSet.has(value)) {
        selectedSet.delete(value);
    } else {
        selectedSet.add(value);
    }

    requestAnimationFrame(function () {
        renderFilters();
        applyFiltersAndRender();
    });
}

function analyticsSelectAll(type) {
    var selectedSet = type === 'keyword' ? selectedKeywords : selectedCities;
    var available = getAvailableValues();
    var values = type === 'keyword' ? available.keywords : available.cities;

    selectedSet.clear();
    var keys = Object.keys(values);
    for (var i = 0; i < keys.length; i++) {
        selectedSet.add(keys[i]);
    }

    var searchContainer = document.getElementById(type + 'ChipsSearch');
    if (searchContainer) {
        var input = searchContainer.querySelector('input');
        if (input) input.value = '';
    }

    requestAnimationFrame(function () {
        renderFilters();
        applyFiltersAndRender();
    });
}

function analyticsClearAll(type) {
    var selectedSet = type === 'keyword' ? selectedKeywords : selectedCities;
    selectedSet.clear();

    var searchContainer = document.getElementById(type + 'ChipsSearch');
    if (searchContainer) {
        var input = searchContainer.querySelector('input');
        if (input) input.value = '';
    }

    requestAnimationFrame(function () {
        renderFilters();
        applyFiltersAndRender();
    });
}

function analyticsClearAllFilters() {
    selectedKeywords.clear();
    selectedCities.clear();

    document.querySelectorAll('.filter-chips-search input').forEach(function (input) {
        input.value = '';
    });

    requestAnimationFrame(function () {
        renderFilters();
        applyFiltersAndRender();
    });
}

function removeActiveFilter(type, value) {
    var selectedSet = type === 'keyword' ? selectedKeywords : selectedCities;
    selectedSet.delete(value);

    requestAnimationFrame(function () {
        renderFilters();
        applyFiltersAndRender();
    });
}

function filterChipsSearch(type, query) {
    var container = document.getElementById(type + 'Chips');
    if (!container) return;

    var lowerQuery = query.toLowerCase();
    container.querySelectorAll('.filter-chip').forEach(function (chip) {
        var value = chip.dataset.value.toLowerCase();
        chip.style.display = value.includes(lowerQuery) ? '' : 'none';
    });
}

function renderActiveFiltersBar() {
    var bar = document.getElementById('activeFiltersBar');
    var tagsContainer = document.getElementById('activeFilterTags');
    if (!bar || !tagsContainer) return;

    var hasFilters = selectedKeywords.size > 0 || selectedCities.size > 0;

    if (!hasFilters) {
        bar.classList.remove('show');
        return;
    }

    bar.classList.add('show');
    var fragment = document.createDocumentFragment();

    selectedKeywords.forEach(function (kw) {
        fragment.appendChild(buildFilterTag('keyword', kw, 'key'));
    });

    selectedCities.forEach(function (city) {
        fragment.appendChild(buildFilterTag('city', city, 'geo-alt'));
    });

    tagsContainer.innerHTML = '';
    tagsContainer.appendChild(fragment);
}

function buildFilterTag(type, value, icon) {
    var tag = document.createElement('span');
    tag.className = 'active-filter-tag';

    var iconEl = document.createElement('i');
    iconEl.className = 'bi bi-' + icon;
    iconEl.setAttribute('aria-hidden', 'true');

    var textNode = document.createTextNode(' ' + value + ' ');

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tag-remove';
    removeBtn.setAttribute('aria-label', 'إزالة ' + value);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', function () {
        removeActiveFilter(type, value);
    });

    tag.appendChild(iconEl);
    tag.appendChild(textNode);
    tag.appendChild(removeBtn);

    return tag;
}

function applyFiltersAndRender() {
    const agg = aggregateFiltered();

    updateSummaryCards(agg);
    renderCrossTable(agg);
    renderInsights(agg);
    renderCityChart(agg);
    renderCategoryChart(agg);
    renderRatingChart(agg);
    renderKeywordComparison(agg);
}

function updateSummaryCards(agg) {
    document.getElementById('anTotalRecords').textContent = formatNumber(agg.totalRecords);
    document.getElementById('anTotalCities').textContent = formatNumber(agg.cities.length);
    document.getElementById('anTotalCategories').textContent = formatNumber(agg.categories.length);
    document.getElementById('anTotalKeywords').textContent = formatNumber(agg.keywords.length);
    document.getElementById('anAvgRating').textContent = agg.avgRating;

    var hasFilters = selectedKeywords.size > 0 || selectedCities.size > 0;

    var ctxRecords = document.getElementById('anTotalRecordsCtx');
    var ctxCities = document.getElementById('anTotalCitiesCtx');
    var ctxCategories = document.getElementById('anTotalCategoriesCtx');
    var ctxKeywords = document.getElementById('anTotalKeywordsCtx');
    var ctxRating = document.getElementById('anAvgRatingCtx');

    if (hasFilters && analyticsAggData) {
        var totalAll = analyticsAggData.totalRecords;
        var pct = totalAll > 0 ? ((agg.totalRecords / totalAll) * 100).toFixed(1) : '0';

        if (ctxRecords) {
            ctxRecords.textContent = pct + '% من ' + formatNumber(totalAll);
            ctxRecords.classList.remove('d-none');
        }
        if (ctxCities) {
            ctxCities.textContent = 'من أصل ' + formatNumber(analyticsAggData.cities.length);
            ctxCities.classList.remove('d-none');
        }
        if (ctxCategories) {
            ctxCategories.textContent = 'من أصل ' + formatNumber(analyticsAggData.categories.length);
            ctxCategories.classList.remove('d-none');
        }
        if (ctxKeywords) {
            ctxKeywords.textContent = 'من أصل ' + formatNumber(analyticsAggData.keywords.length);
            ctxKeywords.classList.remove('d-none');
        }
        if (ctxRating) {
            ctxRating.textContent = 'الإجمالي: ' + analyticsAggData.avgRating;
            ctxRating.classList.remove('d-none');
        }
    } else {
        if (ctxRecords) ctxRecords.classList.add('d-none');
        if (ctxCities) ctxCities.classList.add('d-none');
        if (ctxCategories) ctxCategories.classList.add('d-none');
        if (ctxKeywords) ctxKeywords.classList.add('d-none');
        if (ctxRating) ctxRating.classList.add('d-none');
    }
}

function renderCrossTable(agg) {
    const headerEl = document.getElementById('crossTableHeader');
    const bodyEl = document.getElementById('crossTableBody');
    const emptyEl = document.getElementById('crossTableEmpty');

    if (agg.totalRecords === 0) {
        headerEl.innerHTML = '';
        bodyEl.innerHTML = '';
        emptyEl.classList.remove('d-none');
        return;
    }

    emptyEl.classList.add('d-none');

    const cities = agg.cities;
    const categories = agg.categories;
    const grandTotal = agg.totalRecords;

    const thead = document.createDocumentFragment();

    const tr1 = document.createElement('tr');
    const thCat = document.createElement('th');
    thCat.scope = 'col';
    thCat.rowSpan = 2;
    thCat.className = 'th-category';
    thCat.textContent = 'التصنيف';
    tr1.appendChild(thCat);

    cities.forEach(city => {
        const th = document.createElement('th');
        th.scope = 'colgroup';
        th.colSpan = 2;
        th.className = 'th-city';
        th.textContent = city;
        tr1.appendChild(th);
    });

    const thTotal = document.createElement('th');
    thTotal.scope = 'colgroup';
    thTotal.colSpan = 2;
    thTotal.className = 'th-total';
    thTotal.textContent = 'الإجمالي';
    tr1.appendChild(thTotal);
    thead.appendChild(tr1);

    const tr2 = document.createElement('tr');
    for (let i = 0; i <= cities.length; i++) {
        const thCount = document.createElement('th');
        thCount.scope = 'col';
        thCount.className = 'th-count';
        thCount.textContent = 'العدد';
        const thPct = document.createElement('th');
        thPct.scope = 'col';
        thPct.className = 'th-percent';
        thPct.textContent = 'النسبة';
        tr2.appendChild(thCount);
        tr2.appendChild(thPct);
    }
    thead.appendChild(tr2);

    headerEl.innerHTML = '';
    headerEl.appendChild(thead);

    const tbody = document.createDocumentFragment();

    categories.forEach(category => {
        const tr = document.createElement('tr');

        const tdCat = document.createElement('td');
        tdCat.className = 'td-category';
        tdCat.textContent = category;
        tr.appendChild(tdCat);

        let categoryTotal = 0;

        cities.forEach(city => {
            const crossKey = category + '|||' + city;
            const count = agg.crossData[crossKey] || 0;
            const cityTotal = agg.cityTotals[city] || 1;
            const percentage = ((count / cityTotal) * 100).toFixed(1);
            categoryTotal += count;

            const tdCount = document.createElement('td');
            tdCount.className = 'td-count';
            tdCount.textContent = count;
            tr.appendChild(tdCount);

            const tdPct = document.createElement('td');
            tdPct.className = 'td-percent ' + getPercentageClass(parseFloat(percentage));
            tdPct.textContent = percentage + '%';
            tr.appendChild(tdPct);
        });

        const rowPct = ((categoryTotal / grandTotal) * 100).toFixed(1);

        const tdTotal = document.createElement('td');
        tdTotal.className = 'td-count fw-bold';
        tdTotal.textContent = categoryTotal;
        tr.appendChild(tdTotal);

        const tdTotalPct = document.createElement('td');
        tdTotalPct.className = 'td-percent fw-bold';
        tdTotalPct.textContent = rowPct + '%';
        tr.appendChild(tdTotalPct);

        tbody.appendChild(tr);
    });

    const trTotal = document.createElement('tr');
    trTotal.className = 'total-row';

    const tdLabel = document.createElement('td');
    tdLabel.className = 'fw-bold';
    tdLabel.textContent = 'الإجمالي';
    trTotal.appendChild(tdLabel);

    cities.forEach(city => {
        const total = agg.cityTotals[city] || 0;
        const pct = ((total / grandTotal) * 100).toFixed(1);

        const td1 = document.createElement('td');
        td1.className = 'fw-bold';
        td1.textContent = total;
        trTotal.appendChild(td1);

        const td2 = document.createElement('td');
        td2.className = 'fw-bold';
        td2.textContent = pct + '%';
        trTotal.appendChild(td2);
    });

    const tdGrand = document.createElement('td');
    tdGrand.className = 'fw-bold';
    tdGrand.textContent = grandTotal;
    trTotal.appendChild(tdGrand);

    const tdGrandPct = document.createElement('td');
    tdGrandPct.className = 'fw-bold';
    tdGrandPct.textContent = '100%';
    trTotal.appendChild(tdGrandPct);

    tbody.appendChild(trTotal);

    bodyEl.innerHTML = '';
    bodyEl.appendChild(tbody);
}

function renderInsights(agg) {
    var container = document.getElementById('insightsContainer');

    if (agg.totalRecords === 0) {
        container.innerHTML = '';
        var p = document.createElement('p');
        p.className = 'text-muted text-center py-3';
        p.textContent = 'لا توجد بيانات كافية للتحليل';
        container.appendChild(p);
        return;
    }

    var insights = [];

    var topCity = Object.entries(agg.cityCounts).sort(function (a, b) { return b[1] - a[1]; })[0];
    if (topCity) {
        insights.push({
            type: 'info',
            icon: 'geo-alt-fill',
            text: buildInsightText('المدينة الأكثر نتائج: {0} بعدد {1} سجل', [topCity[0], topCity[1]])
        });
    }

    var topCategory = Object.entries(agg.categoryCounts).sort(function (a, b) { return b[1] - a[1]; })[0];
    if (topCategory) {
        var catPercent = ((topCategory[1] / agg.totalRecords) * 100).toFixed(1);
        insights.push({
            type: 'success',
            icon: 'tag-fill',
            text: buildInsightText('التصنيف الأكثر شيوعاً: {0} بنسبة {1}', [topCategory[0], catPercent + '%'])
        });
    }

    if (agg.totalRatingCount > 0) {
        insights.push({
            type: 'warning',
            icon: 'star-fill',
            text: buildInsightText('متوسط التقييم العام: {0} من 5 ({1} نشاط مُقيَّم)', [agg.avgRating, agg.totalRatingCount])
        });
    }

    var cityAvgs = Object.entries(agg.cityRatingMap)
        .filter(function (entry) { return entry[1].count >= 3; })
        .map(function (entry) {
            return {
                city: entry[0],
                avg: (entry[1].sum / entry[1].count).toFixed(1)
            };
        })
        .sort(function (a, b) { return b.avg - a.avg; });

    if (cityAvgs.length >= 2) {
        insights.push({
            type: 'info',
            icon: 'trophy-fill',
            text: buildInsightText('أعلى متوسط تقييم: {0} بمتوسط {1}', [cityAvgs[0].city, cityAvgs[0].avg])
        });

        var lowest = cityAvgs[cityAvgs.length - 1];
        if (parseFloat(lowest.avg) < 4.0) {
            insights.push({
                type: 'danger',
                icon: 'arrow-down-circle-fill',
                text: buildInsightText('أدنى متوسط تقييم: {0} بمتوسط {1} — قد تحتاج اهتماماً', [lowest.city, lowest.avg])
            });
        }
    }

    if (agg.keywords.length > 1) {
        insights.push({
            type: 'primary',
            icon: 'key-fill',
            text: buildInsightText('تم البحث بـ {0} كلمات مفتاحية مختلفة', [agg.keywords.length])
        });
    }

    if (agg.totalLowRated > 0) {
        var lowPercent = ((agg.totalLowRated / agg.totalRecords) * 100).toFixed(1);
        insights.push({
            type: 'danger',
            icon: 'graph-down-arrow',
            text: buildInsightText('{0} نشاط تقييمه أقل من 3.5 ({1})', [agg.totalLowRated, lowPercent + '%'])
        });
    }

    if (agg.totalNoWebsite > 0) {
        var noWebPercent = ((agg.totalNoWebsite / agg.totalRecords) * 100).toFixed(1);
        insights.push({
            type: 'warning',
            icon: 'globe2',
            text: buildInsightText('{0} نشاط بدون موقع إلكتروني ({1})', [agg.totalNoWebsite, noWebPercent + '%'])
        });
    }

    var sortedCities = Object.entries(agg.cityCounts).sort(function (a, b) { return b[1] - a[1]; });
    if (sortedCities.length >= 2) {
        var largest = sortedCities[0];
        var smallest = sortedCities[sortedCities.length - 1];
        var ratio = largest[1] / Math.max(smallest[1], 1);
        if (ratio >= 10 && smallest[1] > 0) {
            insights.push({
                type: 'info',
                icon: 'bar-chart-steps',
                text: buildInsightText('فجوة كبيرة بين المدن: {0} ({1} سجل) مقابل {2} ({3} سجل) — وسّع البحث في المدن الأصغر', [largest[0], largest[1], smallest[0], smallest[1]])
            });
        }
    }

    var noRatingCount = agg.ratingBuckets[5] || 0;
    if (noRatingCount > 0 && agg.totalRecords > 0) {
        var noRatingPercent = ((noRatingCount / agg.totalRecords) * 100).toFixed(1);
        if (parseFloat(noRatingPercent) >= 30) {
            insights.push({
                type: 'warning',
                icon: 'star',
                text: buildInsightText('{0} نشاط بدون أي تقييم ({1}) — أنشطة جديدة أو غير نشطة', [noRatingCount, noRatingPercent + '%'])
            });
        }
    }

    container.innerHTML = '';

    insights.forEach(function (insight) {
        var article = document.createElement('article');
        article.className = 'insight-item ' + escapeAttr(insight.type);
        article.setAttribute('role', 'listitem');

        var icon = document.createElement('i');
        icon.className = 'bi bi-' + escapeAttr(insight.icon) + ' ms-2';
        icon.setAttribute('aria-hidden', 'true');

        var span = document.createElement('span');
        span.innerHTML = insight.text;

        article.appendChild(icon);
        article.appendChild(span);
        container.appendChild(article);
    });
}

const CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#e11d48', '#7c3aed', '#059669', '#d97706'
];

function renderCityChart(agg) {
    var ctx = document.getElementById('cityChart');
    if (!ctx) return;

    if (cityChart) cityChart.destroy();

    var allSorted = Object.entries(agg.cityCounts).sort(function (a, b) { return b[1] - a[1]; });
    if (allSorted.length === 0) return;

    var MAX_BARS = 15;
    var displayData;
    var hasOthers = false;

    if (allSorted.length > MAX_BARS) {
        var top = allSorted.slice(0, MAX_BARS);
        var othersCount = 0;
        for (var i = MAX_BARS; i < allSorted.length; i++) {
            othersCount += allSorted[i][1];
        }
        top.push(['أخرى (' + (allSorted.length - MAX_BARS) + ')', othersCount]);
        displayData = top;
        hasOthers = true;
    } else {
        displayData = allSorted;
    }

    var colors = CHART_COLORS.slice(0, displayData.length);
    if (hasOthers) {
        colors[colors.length - 1] = '#64748b';
    }

    var isHorizontal = displayData.length > 8;

    cityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: displayData.map(function (c) { return c[0]; }),
            datasets: [{
                label: 'عدد السجلات',
                data: displayData.map(function (c) { return c[1]; }),
                backgroundColor: colors,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: isHorizontal ? 'y' : 'x',
            animation: { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var value = context.parsed[isHorizontal ? 'x' : 'y'];
                            var percent = ((value / agg.totalRecords) * 100).toFixed(1);
                            return formatNumber(value) + ' سجل (' + percent + '%)';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', font: { family: 'Cairo' } },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8', font: { family: 'Cairo' } },
                    grid: { color: '#334155' }
                }
            }
        }
    });
}

function renderCategoryChart(agg) {
    var ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (categoryChart) categoryChart.destroy();

    var allSorted = Object.entries(agg.categoryCounts)
        .sort(function (a, b) { return b[1] - a[1]; });

    if (allSorted.length === 0) return;

    var MAX_SLICES = 10;
    var displayData;

    if (allSorted.length > MAX_SLICES) {
        var top = allSorted.slice(0, MAX_SLICES);
        var othersCount = 0;
        for (var i = MAX_SLICES; i < allSorted.length; i++) {
            othersCount += allSorted[i][1];
        }
        var othersLabel = 'أخرى (' + (allSorted.length - MAX_SLICES) + ' تصنيف)';
        displayData = top.concat([[othersLabel, othersCount]]);
    } else {
        displayData = allSorted;
    }

    var colors = CHART_COLORS.slice(0, displayData.length);
    if (displayData.length > CHART_COLORS.length) {
        colors = CHART_COLORS.slice();
    }
    if (allSorted.length > MAX_SLICES) {
        colors[colors.length - 1] = '#64748b';
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: displayData.map(function (c) { return c[0]; }),
            datasets: [{
                data: displayData.map(function (c) { return c[1]; }),
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '55%',
            animation: { duration: 400 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Cairo', size: 11 },
                        boxWidth: 12,
                        color: '#cbd5e1',
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var total = 0;
                            for (var j = 0; j < displayData.length; j++) {
                                total += displayData[j][1];
                            }
                            var percent = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + formatNumber(context.parsed) + ' (' + percent + '%)';
                        }
                    }
                }
            }
        }
    });
}

function renderRatingChart(agg) {
    const ctx = document.getElementById('ratingChart');
    if (!ctx) return;

    if (ratingChart) ratingChart.destroy();

    const ratingData = [
        { label: '4.5 - 5', count: agg.ratingBuckets[0], color: '#10b981' },
        { label: '4 - 4.4', count: agg.ratingBuckets[1], color: '#3b82f6' },
        { label: '3 - 3.9', count: agg.ratingBuckets[2], color: '#f59e0b' },
        { label: '2 - 2.9', count: agg.ratingBuckets[3], color: '#f97316' },
        { label: 'أقل من 2', count: agg.ratingBuckets[4], color: '#ef4444' }
    ];

    if (agg.ratingBuckets[5] > 0) {
        ratingData.push({ label: 'بدون تقييم', count: agg.ratingBuckets[5], color: '#64748b' });
    }

    ratingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ratingData.map(r => r.label),
            datasets: [{
                label: 'عدد الأنشطة',
                data: ratingData.map(r => r.count),
                backgroundColor: ratingData.map(r => r.color),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const percent = ((context.parsed.y / agg.totalRecords) * 100).toFixed(1);
                            return context.parsed.y + ' نشاط (' + percent + '%)';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', font: { family: 'Cairo' } },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8', font: { family: 'Cairo' } },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderKeywordComparison(agg) {
    var bodyEl = document.getElementById('keywordCompareBody');
    var kwData = agg.keywordComparison;
    var keywords = Object.keys(kwData).sort();

    if (keywords.length === 0) {
        bodyEl.innerHTML = '';
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.setAttribute('colspan', '4');
        td.className = 'text-center text-muted py-3';
        td.textContent = 'لا توجد بيانات';
        tr.appendChild(td);
        bodyEl.appendChild(tr);
        return;
    }

    var fragment = document.createDocumentFragment();

    keywords.forEach(function (kw) {
        var data = kwData[kw];

        var tr = document.createElement('tr');

        var tdKw = document.createElement('td');
        tdKw.className = 'fw-bold';
        var kwIcon = document.createElement('i');
        kwIcon.className = 'bi bi-key ms-1 text-warning';
        kwIcon.setAttribute('aria-hidden', 'true');
        tdKw.appendChild(kwIcon);
        tdKw.appendChild(document.createTextNode(' ' + kw));
        tr.appendChild(tdKw);

        var tdCount = document.createElement('td');
        tdCount.textContent = formatNumber(data.count);
        tr.appendChild(tdCount);

        var tdCities = document.createElement('td');
        tdCities.textContent = String(data.cityCount);
        tr.appendChild(tdCities);

        var tdRating = document.createElement('td');
        var ratingSpan = document.createElement('span');
        ratingSpan.className = 'rating-badge-sm';
        var starIcon = document.createElement('i');
        starIcon.className = 'bi bi-star-fill ms-1';
        starIcon.setAttribute('aria-hidden', 'true');
        ratingSpan.appendChild(starIcon);
        ratingSpan.appendChild(document.createTextNode(' ' + data.avgRating));
        tdRating.appendChild(ratingSpan);
        tr.appendChild(tdRating);

        fragment.appendChild(tr);
    });

    bodyEl.innerHTML = '';
    bodyEl.appendChild(fragment);
}

function getPercentageClass(percentage) {
    if (percentage >= 25) return 'percent-high';
    if (percentage >= 10) return 'percent-medium';
    return 'percent-low';
}

function showEmptyState(show) {
    const emptyEl = document.getElementById('analyticsEmpty');
    const contentEl = document.getElementById('analyticsContent');

    if (show) {
        emptyEl.classList.remove('d-none');
        contentEl.classList.add('d-none');
    } else {
        emptyEl.classList.add('d-none');
        contentEl.classList.remove('d-none');
    }
}